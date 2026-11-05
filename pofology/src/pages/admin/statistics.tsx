import { NextPage } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { AnalyticsStats, TimeRange, VisitorLogItem } from '@/types/analytics';
import { isValidAuthToken } from '@/lib/auth';
import { FaFacebook, FaMobileAlt, FaDesktop, FaGlobeAsia, FaClock, FaEye, FaUsers } from 'react-icons/fa';
import { FiArrowLeft, FiLogOut, FiRefreshCw, FiCopy, FiCheck, FiShield } from 'react-icons/fi';

const Statistics: NextPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'facebook'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStats = useCallback(async (showLoading = true) => {
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
      });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [timeRange, mounted]);

  useEffect(() => {
    setMounted(true);
    // Strict authentication check
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

  const formatTimestamp = (dateInput: string | Date) => {
    if (!mounted) return '';
    try {
      const d = new Date(dateInput);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(dateInput);
    }
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
  const recentVisitors = stats?.recentVisitors || [];
  const filteredVisitors = filterSource === 'facebook'
    ? recentVisitors.filter((v) => v.isFacebook || !!v.fbclid)
    : recentVisitors;

  return (
    <>
      <Head>
        <title>Thống Kê Truy Cập & Khách Facebook | Admin</title>
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

          {/* Page Title & Time Range Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Thống Kê Khách & Lưu Lượng Facebook
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Theo dõi chi tiết lượt nhấp link từ Facebook, thông tin thiết bị, mạng viễn thông và lịch sử xem dự án.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                {[
                  { key: 'day', label: 'Hôm nay' },
                  { key: 'week', label: '7 ngày' },
                  { key: 'month', label: 'Tháng này' },
                  { key: 'year', label: 'Năm nay' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTimeRange(item.key as TimeRange)}
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

          {/* SECTION 2: OVERALL PERFORMANCE METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Tổng Khách Truy Cập"
              value={stats ? stats.totalVisitors : 0}
              subtitle="Theo địa chỉ IP độc nhất"
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

          {/* SECTION 3: TOP VIEWED PAGES & DEVICES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Projects & Pages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Dự Án & Trang Được Xem Nhiều Nhất</span>
                <span className="text-xs text-gray-400 font-normal">Lượt xem</span>
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats && stats.topPages && stats.topPages.length > 0 ? (
                  stats.topPages.map((item, idx) => (
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

            {/* Top Devices & Browsers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Thiết Bị & Trình Duyệt Sử Dụng
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Thiết bị</p>
                  <div className="space-y-2">
                    {stats?.topDevices?.map((d, i) => (
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
                    {stats?.topBrowsers?.slice(0, 4).map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{b.browser}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: DETAILED VISITOR LOG (LỊCH SỬ KHÁCH TRUY CẬP) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Nhật Ký Chi Tiết Khách Truy Cập (Live Visitor Log)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Hiển thị thông tin từng phiên: Nguồn, mã định danh Facebook, ứng dụng, nhà mạng và trang đã xem.
                </p>
              </div>

              {/* Source Filter Buttons */}
              <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilterSource('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterSource === 'all'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  Tất cả ({recentVisitors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('facebook')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterSource === 'facebook'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  }`}
                >
                  <FaFacebook className="text-blue-500 group-hover:text-white" />
                  Chỉ từ Facebook ({recentVisitors.filter((v) => v.isFacebook || !!v.fbclid).length})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Nguồn truy cập</th>
                    <th className="py-3 px-4">Thiết bị & Ứng dụng</th>
                    <th className="py-3 px-4">Địa điểm & Nhà mạng (ISP)</th>
                    <th className="py-3 px-4">Trang xem</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Mã Facebook (fbclid)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {filteredVisitors.length > 0 ? (
                    filteredVisitors.map((v, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatTimestamp(v.timestamp)}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {v.isFacebook || v.fbclid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              <FaFacebook className="text-blue-600" /> Facebook
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {v.trafficSource || 'Trực tiếp'}
                            </span>
                          )}
                        </td>

                        {/* Device & Client App */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white capitalize">
                              {v.appType || v.browser}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {v.os} · {v.device}
                            </span>
                          </div>
                        </td>

                        {/* Location & ISP */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white font-medium">
                              {v.city ? `${v.city}, ` : ''}{v.country || 'Việt Nam'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              IP: {v.ip} {v.isp && v.isp !== 'Chưa rõ' ? `· ${v.isp}` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Page Viewed */}
                        <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 font-medium">
                          {v.page}
                        </td>

                        {/* Time on Page */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                          {v.timeOnPage && v.timeOnPage > 0 ? formatTime(v.timeOnPage) : 'Đang xem'}
                        </td>

                        {/* fbclid */}
                        <td className="py-3 px-4">
                          {v.fbclid ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-mono text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded truncate max-w-[110px]"
                                title={v.fbclid}
                              >
                                {v.fbclid}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(v.fbclid!, `fb_${index}`)}
                                title="Sao chép toàn bộ fbclid"
                                className="text-gray-400 hover:text-blue-600 p-1"
                              >
                                {copiedId === `fb_${index}` ? (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        {filterSource === 'facebook'
                          ? 'Chưa ghi nhận lượt truy cập nào từ Facebook trong khoảng thời gian này.'
                          : 'Chưa có nhật ký truy cập.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Statistics;
