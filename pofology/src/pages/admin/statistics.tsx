import { NextPage } from 'next';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { AnalyticsStats, TimeRange, VisitorFlowStep, VisitorIpFlowItem } from '@/types/analytics';
import { isValidAuthToken } from '@/lib/auth';
import {
  FaFacebook,
  FaFacebookMessenger,
  FaPhoneAlt,
  FaCommentDots,
  FaMobileAlt,
  FaDesktop,
  FaGlobeAsia,
  FaClock,
  FaEye,
  FaUsers,
} from 'react-icons/fa';
import { FiArrowLeft, FiLogOut, FiRefreshCw, FiCopy, FiCheck, FiShield, FiSearch } from 'react-icons/fi';
import MongoAdminPanel from '@/components/admin/MongoAdminPanel';

const PAGE_SIZE = 30;

const PaginationBar: React.FC<{
  page: number;
  totalItems: number;
  pageSize?: number;
  unitLabel?: string;
  onPageChange: (nextPage: number) => void;
}> = ({ page, totalItems, pageSize = PAGE_SIZE, unitLabel = 'dòng', onPageChange }) => {
  if (totalItems <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(totalItems, safePage * pageSize);

  const pageNumbers: Array<number | 'dots'> = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 2) {
      pageNumbers.push(p);
    } else if (Math.abs(p - safePage) === 3) {
      pageNumbers.push('dots');
    }
  }

  return (
    <div className="px-5 py-3.5 bg-gray-50/70 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="text-gray-600 dark:text-gray-300">
        Hiển thị <strong className="text-gray-900 dark:text-white">{from}–{to}</strong> trên tổng{' '}
        <strong className="text-gray-900 dark:text-white">{totalItems}</strong> {unitLabel} ({pageSize} dòng / trang)
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Trước
        </button>

        {pageNumbers.map((item, idx) =>
          item === 'dots' ? (
            <span key={`d_${idx}`} className="px-1.5 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`min-w-[30px] px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                item === safePage
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sau →
        </button>
      </div>
    </div>
  );
};

const Statistics: NextPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Default to 'week' ("Tuần này") as requested
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Filter & Pagination states (30 rows / page across all categories)
  const [filterSource, setFilterSource] = useState<'all' | 'facebook' | 'contact' | 'multi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flowPage, setFlowPage] = useState(1);
  const [topPagesPage, setTopPagesPage] = useState(1);
  const [expandedIps, setExpandedIps] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      try {
        const response = await fetch(`/api/analytics/stats?range=${timeRange}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
        if (mounted) {
          setLastUpdate(new Date().toLocaleTimeString('vi-VN'));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          totalVisitors: 0,
          totalPageViews: 0,
          uniqueVisitors: 0,
          averageTimeOnPage: 0,
          topPages: [],
          topCountries: [],
          topDevices: [],
          topBrowsers: [],
          visitorsByDate: [],
          ipFlows: [],
        });
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [timeRange, mounted]
  );

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_auth_token');
      if (!token || !isValidAuthToken(token)) {
        router.push('/admin/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchStats(true);
      const interval = setInterval(() => {
        fetchStats(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchStats, mounted]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    router.push('/admin/login');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatShortDateTime = (dateInput: string | Date) => {
    if (!mounted) return '';
    try {
      const d = new Date(dateInput);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return String(dateInput);
    }
  };

  const formatStepClock = (dateInput: string | Date) => {
    if (!mounted) return '';
    try {
      return new Date(dateInput).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const toggleIpExpand = (ip: string) => {
    setExpandedIps((prev) => ({ ...prev, [ip]: !prev[ip] }));
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    accentColor = 'text-blue-600',
    bgColor = 'bg-blue-50 dark:bg-blue-900/20',
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    accentColor?: string;
    bgColor?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor} ${accentColor} text-2xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const fbSummary = stats?.facebookSummary;
  const contactSummary = stats?.contactClicksSummary;
  const allIpFlows: VisitorIpFlowItem[] = stats?.ipFlows || [];

  const fbFlowsCount = useMemo(
    () => allIpFlows.filter((f) => f.isFacebook || !!f.fbclid).length,
    [allIpFlows]
  );
  const contactFlowsCount = useMemo(
    () => allIpFlows.filter((f) => f.hasContactClick).length,
    [allIpFlows]
  );
  const multiStepFlowsCount = useMemo(
    () => allIpFlows.filter((f) => f.steps.length >= 2 || (f.steps[0]?.repeat || 1) >= 2).length,
    [allIpFlows]
  );

  const filteredFlows = useMemo(() => {
    let list = allIpFlows;
    if (filterSource === 'facebook') {
      list = list.filter((f) => f.isFacebook || !!f.fbclid);
    } else if (filterSource === 'contact') {
      list = list.filter((f) => f.hasContactClick);
    } else if (filterSource === 'multi') {
      list = list.filter((f) => f.steps.length >= 2 || (f.steps[0]?.repeat || 1) >= 2);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.ip.toLowerCase().includes(q) ||
          (f.city || '').toLowerCase().includes(q) ||
          (f.isp || '').toLowerCase().includes(q) ||
          f.steps.some((s) => s.page.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allIpFlows, filterSource, searchQuery]);

  const totalFlowPages = Math.max(1, Math.ceil(filteredFlows.length / PAGE_SIZE));
  const safeFlowPage = Math.min(flowPage, totalFlowPages);
  const pagedFlows = filteredFlows.slice((safeFlowPage - 1) * PAGE_SIZE, safeFlowPage * PAGE_SIZE);

  const allTopPages = stats?.topPages || [];
  const totalTopPagesCount = Math.max(1, Math.ceil(allTopPages.length / PAGE_SIZE));
  const safeTopPagesPage = Math.min(topPagesPage, totalTopPagesCount);
  const pagedTopPages = allTopPages.slice(
    (safeTopPagesPage - 1) * PAGE_SIZE,
    safeTopPagesPage * PAGE_SIZE
  );

  const renderFlowStepBadge = (step: VisitorFlowStep, idx: number) => {
    const hm = formatStepClock(step.timestamp);
    const rep = step.repeat && step.repeat > 1 ? ` ×${step.repeat}` : '';
    const isClick = step.eventType === 'contact_click' || step.page.startsWith('[CLICK]');

    if (isClick) {
      const isZalo = step.contactChannel === 'zalo' || step.page.includes('Zalo');
      const isPhone = step.contactChannel === 'phone' || step.page.includes('Gọi điện');
      return (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
            isZalo
              ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
              : isPhone
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
          }`}
        >
          <span className="opacity-70 font-mono text-[10px]">{hm}</span>
          {isZalo ? <FaCommentDots /> : isPhone ? <FaPhoneAlt /> : <FaFacebookMessenger />}
          <span>{step.page.replace('[CLICK] ', 'Bấm ')}{rep}</span>
        </span>
      );
    }

    return (
      <span
        key={idx}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 whitespace-nowrap"
      >
        <span className="opacity-65 font-mono text-[10px]">{hm}</span>
        <span className="font-mono font-semibold">{step.page}</span>
        {step.timeOnPage && step.timeOnPage > 0 ? (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            ({formatTime(step.timeOnPage)})
          </span>
        ) : null}
        {rep ? <span className="font-bold">{rep}</span> : null}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Thống Kê Truy Cập & Luồng Hành Trình Khách | Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Bar Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <a className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
                  <FiArrowLeft /> Dashboard
                </a>
              </Link>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                <FiShield /> Quản trị viên
              </span>
              {stats?.storageSource === 'mongodb' && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  MongoDB: signalr_chat
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {mounted && lastUpdate && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cập nhật: {lastUpdate} (tự động mỗi 5s)
                </div>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition-colors"
              >
                <FiLogOut /> Đăng xuất
              </button>
            </div>
          </div>

          {stats?.storageSource === 'fallback' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold text-sm mb-1">
                ⚠️ VPS chưa kết nối được vào MongoDB Atlas (đang hiển thị dữ liệu dự phòng trên VPS)
              </p>
              <p>
                Vào <strong>cloud.mongodb.com</strong> → mục <strong>Network Access</strong> → thêm IP VPS{' '}
                <code>103.82.26.134</code> (hoặc <code>0.0.0.0/0</code>) để tự động đồng bộ lại ngay.
              </p>
            </div>
          )}

          {/* Page Title & Time Range Filters (Default: Tuần này) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Thống Kê Khách Truy Cập & Luồng Thao Tác Theo IP
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Mặc định hiển thị khách vào trang <strong>Tuần này</strong>, gom gọn trùng IP thành 1 dòng luồng hành trình và phân trang 30 dòng/trang.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex flex-wrap p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                {[
                  { key: 'day', label: 'Hôm nay' },
                  { key: 'week', label: 'Tuần này (7 ngày)' },
                  { key: 'month', label: 'Tháng này' },
                  { key: 'year', label: 'Năm nay' },
                  { key: 'all', label: 'Tất cả' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setTimeRange(item.key as TimeRange);
                      setFlowPage(1);
                      setTopPagesPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      timeRange === item.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchStats(true)}
                title="Làm mới số liệu ngay"
                className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* SECTION 0: MONGODB ATLAS ADMIN, STORAGE QUOTA, KEEP-ALIVE & TELEGRAM */}
          <MongoAdminPanel />

          {/* SECTION 1: FACEBOOK TRAFFIC INSIGHTS */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                  <FaFacebook />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Chuyên Mục: Lưu Lượng Từ Facebook</h2>
                  <p className="text-xs text-blue-100">
                    Phân tích những khách truy cập thông qua bài đăng hoặc link trên tường Facebook
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md">
                Meta Referral & fbclid Detection
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase text-blue-100 font-semibold">Lượt xem từ Facebook</span>
                <p className="text-2xl md:text-3xl font-extrabold mt-1">
                  {fbSummary ? fbSummary.totalFacebookVisits : 0}
                </p>
                <span className="text-[11px] text-blue-200">Tổng pageviews ghi nhận</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase text-blue-100 font-semibold">Khách độc nhất (FB)</span>
                <p className="text-2xl md:text-3xl font-extrabold mt-1">
                  {fbSummary ? fbSummary.uniqueFacebookVisitors : 0}
                </p>
                <span className="text-[11px] text-blue-200">Người dùng thực tế</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase text-blue-100 font-semibold">Mở bằng App Facebook</span>
                <p className="text-2xl md:text-3xl font-extrabold mt-1">
                  {fbSummary ? fbSummary.inAppBrowserCount : 0}
                </p>
                <span className="text-[11px] text-blue-200">Trình duyệt trong app Meta</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase text-blue-100 font-semibold">Có mã FBCLID</span>
                <p className="text-2xl md:text-3xl font-extrabold mt-1">
                  {fbSummary ? fbSummary.fbclidCount : 0}
                </p>
                <span className="text-[11px] text-blue-200">Click ID chính xác từ Feed</span>
              </div>
            </div>
          </div>

          {/* SECTION 1B: MESSENGER & ZALO CLICK TRACKING */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-900/50 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl">
                  <FaFacebookMessenger />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                    Theo Dõi Lượt Bấm Liên Hệ (Zalo & Messenger)
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ghi nhận ngay lập tức thiết bị, vị trí, nhà mạng và IP của người bấm vào icon Zalo (0983877462) hoặc Messenger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterSource('contact');
                  setFlowPage(1);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition-colors"
              >
                Lọc IP đã bấm liên hệ ↓
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 bg-sky-50/70 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/40">
                <span className="text-xs uppercase font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <FaCommentDots /> Click Zalo
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {contactSummary ? contactSummary.totalZaloClicks : 0}
                </p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Bấm mở Zalo 0983877462</span>
              </div>

              <div className="rounded-xl p-4 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
                <span className="text-xs uppercase font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <FaFacebookMessenger /> Click Messenger
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {contactSummary ? contactSummary.totalMessengerClicks : 0}
                </p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Bấm mở chat Messenger</span>
              </div>

              <div className="rounded-xl p-4 bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
                <span className="text-xs uppercase font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <FaPhoneAlt /> Click Gọi SĐT
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {contactSummary ? contactSummary.totalPhoneClicks : 0}
                </p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Bấm gọi trên di động</span>
              </div>

              <div className="rounded-xl p-4 bg-purple-50/70 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
                <span className="text-xs uppercase font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <FaUsers /> Người bấm liên hệ
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {contactSummary ? contactSummary.uniqueClickers : 0}
                </p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Số khách độc nhất đã click</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: OVERALL PERFORMANCE METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Tổng Khách Truy Cập"
              value={stats ? stats.totalVisitors : 0}
              subtitle="Số địa chỉ IP độc nhất"
              icon={<FaUsers />}
              accentColor="text-blue-600"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
            />
            <StatCard
              title="Tổng Lượt Xem Trang"
              value={stats ? stats.totalPageViews : 0}
              subtitle="Số lần tải trang web"
              icon={<FaEye />}
              accentColor="text-indigo-600"
              bgColor="bg-indigo-50 dark:bg-indigo-900/20"
            />
            <StatCard
              title="Thời Gian Trung Bình"
              value={stats ? formatTime(stats.averageTimeOnPage) : '0s'}
              subtitle="Khách ở lại tìm hiểu hồ sơ"
              icon={<FaClock />}
              accentColor="text-amber-600"
              bgColor="bg-amber-50 dark:bg-amber-900/20"
            />
            <StatCard
              title="Quốc Gia / Địa Điểm"
              value={stats && stats.topCountries.length > 0 ? stats.topCountries[0].country : 'Việt Nam'}
              subtitle={`${stats ? stats.topCountries.length : 0} khu vực đã truy cập`}
              icon={<FaGlobeAsia />}
              accentColor="text-emerald-600"
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
            />
          </div>

          {/* SECTION 3: DETAILED IP ACTION FLOW TABLE (1 IP = 1 ROW, 30 ROWS / PAGE) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Luồng Hành Trình Khách Truy Cập Theo IP (1 Dòng / 1 IP • 30 Dòng / Trang)
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Các lượt xem trang và lượt bấm liên hệ trùng IP được gom chung vào 1 dòng theo thứ tự thời gian từ đầu đến cuối để bạn nhìn rõ khách đã thao tác những gì.
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full lg:w-64">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFlowPage(1);
                    }}
                    placeholder="Tìm IP, tỉnh thành, trang..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filter Category Tabs (All Paginated at 30 rows / page) */}
              <div className="inline-flex flex-wrap p-1 bg-gray-100 dark:bg-gray-700 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setFilterSource('all');
                    setFlowPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterSource === 'all'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  Tất cả IP ({allIpFlows.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterSource('facebook');
                    setFlowPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterSource === 'facebook'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  }`}
                >
                  <FaFacebook className={filterSource === 'facebook' ? 'text-white' : 'text-blue-500'} />
                  Từ Facebook ({fbFlowsCount})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterSource('contact');
                    setFlowPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterSource === 'contact'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600'
                  }`}
                >
                  <FaFacebookMessenger className={filterSource === 'contact' ? 'text-white' : 'text-indigo-500'} />
                  Bấm Zalo / Messenger ({contactFlowsCount})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterSource('multi');
                    setFlowPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterSource === 'multi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
                  }`}
                >
                  Xem nhiều bước ≥ 2 ({multiStepFlowsCount})
                </button>
              </div>
            </div>

            {/* Single-Row-Per-IP Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-4">Hoạt động gần nhất</th>
                    <th className="py-3 px-4">Luồng thao tác trên 1 dòng (Từ đầu → Cuối)</th>
                    <th className="py-3 px-4">Tổng TG</th>
                    <th className="py-3 px-4">Nguồn</th>
                    <th className="py-3 px-4">Thiết bị & Ứng dụng</th>
                    <th className="py-3 px-4">Địa điểm / IP / Nhà mạng</th>
                    <th className="py-3 px-4">FBCLID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {pagedFlows.length > 0 ? (
                    pagedFlows.map((flow) => {
                      const isExpanded = !!expandedIps[flow.ip];
                      const steps = flow.steps || [];

                      return (
                        <tr
                          key={flow.ip}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors align-middle"
                        >
                          {/* Last Seen + Summary */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono font-semibold text-gray-800 dark:text-gray-100">
                              {formatShortDateTime(flow.lastSeen)}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {steps.length} bước ({flow.pageViewCount} trang
                              {flow.contactClickCount > 0 ? ` · ${flow.contactClickCount} liên hệ` : ''})
                            </div>
                          </td>

                          {/* Single-line Chronological Action Flow */}
                          <td className="py-3 px-4">
                            <div
                              className={`flex items-center gap-1 max-w-[540px] overflow-x-auto ${
                                isExpanded ? 'flex-wrap' : 'flex-nowrap'
                              }`}
                            >
                              {steps.length <= 4 || isExpanded ? (
                                <>
                                  {steps.map((st, idx) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span className="text-gray-400 font-bold">→</span>}
                                      {renderFlowStepBadge(st, idx)}
                                    </React.Fragment>
                                  ))}
                                  {steps.length > 4 && isExpanded && (
                                    <button
                                      type="button"
                                      onClick={() => toggleIpExpand(flow.ip)}
                                      className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 whitespace-nowrap"
                                    >
                                      Thu gọn
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {renderFlowStepBadge(steps[0], 0)}
                                  <span className="text-gray-400 font-bold">→</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleIpExpand(flow.ip)}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 whitespace-nowrap"
                                  >
                                    +{steps.length - 3} bước nữa
                                  </button>
                                  {steps.slice(-2).map((st, idx) => (
                                    <React.Fragment key={`tail_${idx}`}>
                                      <span className="text-gray-400 font-bold">→</span>
                                      {renderFlowStepBadge(st, steps.length - 2 + idx)}
                                    </React.Fragment>
                                  ))}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Total Time */}
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-200">
                            {flow.totalTimeOnSite > 0 ? formatTime(flow.totalTimeOnSite) : '—'}
                          </td>

                          {/* Source */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {flow.isFacebook || flow.fbclid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                <FaFacebook className="text-blue-600" /> Facebook
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                {flow.trafficSource || 'Trực tiếp'}
                              </span>
                            )}
                          </td>

                          {/* Device & App */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900 dark:text-white capitalize">
                              {flow.appType || flow.browser}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {flow.os} · {flow.device}
                            </div>
                          </td>

                          {/* Location & IP */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-gray-900 dark:text-white font-medium">
                              {flow.city && flow.city !== 'Chưa rõ' ? `${flow.city}, ` : ''}
                              {flow.country || 'Việt Nam'}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono font-semibold">
                              {flow.ip}
                              {flow.isp && flow.isp !== 'Chưa rõ' ? ` · ${flow.isp}` : ''}
                            </div>
                          </td>

                          {/* fbclid */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {flow.fbclid ? (
                              <div className="flex items-center gap-1">
                                <span
                                  className="font-mono text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded truncate max-w-[95px]"
                                  title={flow.fbclid}
                                >
                                  {flow.fbclid}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(flow.fbclid!, `fb_${flow.ip}`)}
                                  title="Sao chép fbclid"
                                  className="text-gray-400 hover:text-blue-600 p-1"
                                >
                                  {copiedId === `fb_${flow.ip}` ? (
                                    <FiCheck className="text-green-500" />
                                  ) : (
                                    <FiCopy />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        Chưa có dữ liệu khách truy cập khớp với bộ lọc trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 30-Rows-Per-Page Pagination Bar */}
            <PaginationBar
              page={safeFlowPage}
              totalItems={filteredFlows.length}
              pageSize={PAGE_SIZE}
              unitLabel="địa chỉ IP"
              onPageChange={(nextP) => setFlowPage(nextP)}
            />
          </div>

          {/* SECTION 4: TOP VIEWED PAGES (WITH 30-ROW PAGINATION) & DEVICES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Projects & Pages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col justify-between">
              <div className="p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  <span>Dự Án & Trang Được Xem Nhiều Nhất ({allTopPages.length})</span>
                  <span className="text-xs text-gray-400 font-normal">Lượt xem</span>
                </h2>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pagedTopPages.length > 0 ? (
                    pagedTopPages.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                        <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[280px]">
                          {item.page}
                        </span>
                        <span className="font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full text-xs">
                          {item.views} lượt
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">Chưa có dữ liệu trang</p>
                  )}
                </div>
              </div>

              {allTopPages.length > PAGE_SIZE && (
                <PaginationBar
                  page={safeTopPagesPage}
                  totalItems={allTopPages.length}
                  pageSize={PAGE_SIZE}
                  unitLabel="trang"
                  onPageChange={(nextP) => setTopPagesPage(nextP)}
                />
              )}
            </div>

            {/* Top Devices & Browsers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Thiết Bị & Trình Duyệt Sử Dụng
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Thiết bị</p>
                  <div className="space-y-2">
                    {stats?.topDevices?.slice(0, PAGE_SIZE).map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300 capitalize flex items-center gap-1.5">
                          {d.device === 'mobile' ? <FaMobileAlt className="text-gray-400" /> : <FaDesktop className="text-gray-400" />}
                          {d.device}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Trình duyệt</p>
                  <div className="space-y-2">
                    {stats?.topBrowsers?.slice(0, PAGE_SIZE).map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[110px]">{b.browser}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Statistics;
