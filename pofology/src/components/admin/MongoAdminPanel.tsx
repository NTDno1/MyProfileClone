import React, { useState, useEffect, useCallback } from 'react';
import { FaDatabase, FaTelegramPlane, FaHeartbeat, FaTrashAlt, FaSyncAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface DbInfo {
  name: string;
  sizeOnDiskBytes: number;
  sizeOnDiskMB: number;
  empty: boolean;
  collections: Array<{ name: string; count: number }>;
}

interface MongoHealthData {
  connected: boolean;
  latencyMs: number;
  clusterHost: string;
  currentDb: string;
  freeTierLimitMB: number;
  totalUsedMB: number;
  remainingFreeMB: number;
  usagePercent: number;
  databases: DbInfo[];
  keepAlive: {
    enabled: boolean;
    intervalHours: number;
    lastPingAt: string | null;
    pingCount: number;
    daysSinceLastActivity: number;
    autoPauseLimitDays: number;
    daysRemainingBeforePause: number;
    statusText: string;
  };
  settings: {
    telegramConfigured: boolean;
    telegramBotTokenMasked: string;
    telegramChatId: string;
    telegramEnabled: boolean;
    alertThresholdPercent: number;
    keepAliveEnabled: boolean;
    dailyReportEnabled: boolean;
  };
  error?: string;
}

export default function MongoAdminPanel() {
  const [health, setHealth] = useState<MongoHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Telegram & Monitor form states
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [keepAliveEnabled, setKeepAliveEnabled] = useState(true);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(80);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') || '' : '');

  const fetchHealth = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mongo-manage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: MongoHealthData = await res.json();
        setHealth(data);
        setChatId((prev) => prev || data.settings.telegramChatId || '');
        setTelegramEnabled(data.settings.telegramEnabled);
        setKeepAliveEnabled(data.settings.keepAliveEnabled);
        setDailyReportEnabled(data.settings.dailyReportEnabled);
        setAlertThreshold(data.settings.alertThresholdPercent || 80);
      }
    } catch (err) {
      console.error('Error loading MongoDB health:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const runAction = async (action: string, extraBody: Record<string, any> = {}) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(action);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/mongo-manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...extraBody }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setFeedback({ type: 'ok', text: data.message || 'Thao tác thành công!' });
        if (data.health) setHealth(data.health);
        if (action === 'save_settings' || action === 'test_telegram') {
          setBotToken('');
        }
      } else {
        setFeedback({ type: 'err', text: data.message || 'Có lỗi xảy ra!' });
      }
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setActionLoading(null);
    }
  };

  const percent = health?.usagePercent || 0;
  const barColor =
    percent >= 80 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-transparent dark:from-emerald-900/20 dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-sm">
            <FaDatabase />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                Quản Trị Trực Tiếp MongoDB Atlas & Cảnh Báo Telegram
              </h2>
              {health?.connected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <FaCheckCircle /> Online ({health.latencyMs}ms)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                  <FaExclamationTriangle /> Mất kết nối
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Theo dõi dung lượng Free Tier (512 MB), cơ chế tự động Ping chống tự tắt (Auto-Pause 60 ngày) và bắn báo cáo về Telegram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={() => runAction('ping_keepalive')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <FaHeartbeat className={actionLoading === 'ping_keepalive' ? 'animate-ping' : ''} />
            Ping Chống Tự Tắt Ngay
          </button>
          <button
            type="button"
            onClick={fetchHealth}
            title="Làm mới dung lượng DB"
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="ml-3 font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="p-5 md:p-6 space-y-6">
        {/* Row 1: Storage Quota Gauge & Anti-Pause Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Storage Box */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dung Lượng Gói Free Tier (M0 - 512 MB)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Còn trống: {health ? `${health.remainingFreeMB} MB` : '...'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {health ? `${health.totalUsedMB} MB` : '...'}{' '}
                <span className="text-xs font-normal text-gray-500">/ {health?.freeTierLimitMB || 512} MB ({percent}%)</span>
              </p>
              <span className="text-[11px] font-mono text-gray-400">{health?.clusterHost}</span>
            </div>

            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.max(2, percent)}%` }}
              />
            </div>

            {/* Database Breakdown List */}
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Chi tiết các Database trên Cluster (Đã tách riêng Portfolio & Bio/Shop):
              </p>
              {health?.databases && health.databases.length > 0 ? (
                health.databases.map((d) => (
                  <div
                    key={d.name}
                    className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{d.name}</span>
                      {d.name === 'signalr_chat' && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          Portfolio
                        </span>
                      )}
                      {d.name === 'na2hand_shop' && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                          Bio & Shop NA 2HAND
                        </span>
                      )}
                      {d.name.startsWith('sample_') && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          DB Mẫu Của Atlas (Nên xóa cho nhẹ)
                        </span>
                      )}
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {d.collections.map((c) => `${c.name} (${c.count})`).join(' · ') || 'Trống'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">
                        {d.sizeOnDiskMB} MB
                      </span>
                      {d.name.startsWith('sample_') && (
                        <button
                          type="button"
                          disabled={!!actionLoading}
                          onClick={() => {
                            if (confirm(`Xóa database mẫu "${d.name}" (${d.sizeOnDiskMB} MB) của MongoDB để giải phóng dung lượng Free Tier?`)) {
                              runAction('drop_sample_db', { dbName: d.name });
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold"
                          title="Xóa dữ liệu mẫu không dùng tới"
                        >
                          <FaTrashAlt /> Xóa mẫu
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">Đang tải danh sách database...</p>
              )}

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!!actionLoading}
                  onClick={() => {
                    if (confirm('Dọn dẹp các bản ghi log thống kê cũ hơn 180 ngày để tiết kiệm dung lượng?')) {
                      runAction('prune_old_logs', { days: 180 });
                    }
                  }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🧹 Dọn log cũ &gt; 180 ngày
                </button>
              </div>
            </div>
          </div>

          {/* Anti-Pause & Telegram Config Box */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  🛡️ Cơ Chế Chống Tự Tắt (Anti-Pause 60 Ngày)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  An toàn: Còn {health?.keepAlive.daysRemainingBeforePause ?? 60}/60 ngày
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/50 text-xs text-gray-700 dark:text-gray-200 space-y-1">
                <p>
                  • <strong>Quy tắc của MongoDB Atlas:</strong> Gói Free chỉ tự động tắt (Pause) khi suốt <strong>60 ngày liên tiếp không có đọc/ghi dữ liệu</strong> (không bắt buộc bạn phải đăng nhập web hàng tuần).
                </p>
                <p>
                  • <strong>Cơ chế đã kích hoạt:</strong> Server tự động thực hiện 1 lệnh <strong>Đọc + Ghi Keep-Alive mỗi 6 giờ</strong> vào bảng <code>keepalive_heartbeats</code>, giúp bộ đếm 60 ngày luôn được reset về 0 → <strong>Không bao giờ tự tắt!</strong>
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 font-medium">
                  Lần Ping gần nhất:{' '}
                  {health?.keepAlive.lastPingAt
                    ? new Date(health.keepAlive.lastPingAt).toLocaleString('vi-VN')
                    : 'Vừa khởi tạo'}{' '}
                  · Đã Ping: {health?.keepAlive.pingCount || 0} lần
                </p>
              </div>
            </div>

            {/* Telegram Alert Form */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                  <FaTelegramPlane className="text-sky-500 text-base" />
                  Thông Báo Về Tin Nhắn Telegram
                </span>
                {health?.settings.telegramConfigured && (
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Đã lưu Bot ({health.settings.telegramBotTokenMasked})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Telegram Bot Token (@BotFather)
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder={
                      health?.settings.telegramBotTokenMasked
                        ? `Đang dùng: ${health.settings.telegramBotTokenMasked}`
                        : 'VD: 7123456:AAH...'
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Telegram Chat ID (@userinfobot)
                  </label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="VD: 5432198765"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 dark:text-gray-300">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepAliveEnabled}
                    onChange={(e) => setKeepAliveEnabled(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Tự động Ping mỗi 6h</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>Cảnh báo khi lỗi / đầy &gt; {alertThreshold}%</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyReportEnabled}
                    onChange={(e) => setDailyReportEnabled(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>Báo cáo hàng ngày qua Tele</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={!!actionLoading}
                  onClick={() =>
                    runAction('save_settings', {
                      telegramBotToken: botToken,
                      telegramChatId: chatId,
                      telegramEnabled,
                      keepAliveEnabled,
                      dailyReportEnabled,
                      alertThresholdPercent: alertThreshold,
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  💾 Lưu Cấu Hình
                </button>

                <button
                  type="button"
                  disabled={!!actionLoading}
                  onClick={() =>
                    runAction('test_telegram', {
                      telegramBotToken: botToken,
                      telegramChatId: chatId,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  <FaTelegramPlane /> Bắn Báo Cáo Thử Về Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
