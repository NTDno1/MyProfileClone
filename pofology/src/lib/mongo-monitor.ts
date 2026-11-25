import fs from 'fs';
import path from 'path';
import getConnectedClient, { getDatabase } from './mongodb';

export interface MongoMonitorSettings {
  telegramBotToken: string;
  telegramChatId: string;
  telegramEnabled: boolean;
  alertThresholdPercent: number; // Default 80% of 512MB
  keepAliveEnabled: boolean;     // Default true (every 6 hours)
  dailyReportEnabled: boolean;   // Send daily health summary to Telegram
  lastKeepAliveAt?: string | null;
  lastTelegramAlertAt?: string | null;
  lastDailyReportAt?: string | null;
  keepAlivePingCount?: number;
}

export interface DbStorageItem {
  name: string;
  sizeOnDiskBytes: number;
  sizeOnDiskMB: number;
  empty: boolean;
  collections: Array<{
    name: string;
    count: number;
  }>;
}

export interface MongoClusterHealth {
  connected: boolean;
  latencyMs: number;
  clusterHost: string;
  currentDb: string;
  freeTierLimitMB: number;
  totalUsedBytes: number;
  totalUsedMB: number;
  remainingFreeMB: number;
  usagePercent: number;
  databases: DbStorageItem[];
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

const FREE_TIER_LIMIT_MB = 512;
const AUTO_PAUSE_DAYS = 60;
const KEEPALIVE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_SETTINGS_FILE = path.join(DATA_DIR, 'mongo-monitor-settings.json');

const DEFAULT_SETTINGS: MongoMonitorSettings = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  telegramEnabled: true,
  alertThresholdPercent: 80,
  keepAliveEnabled: true,
  dailyReportEnabled: false,
  lastKeepAliveAt: null,
  lastTelegramAlertAt: null,
  lastDailyReportAt: null,
  keepAlivePingCount: 0,
};

function readLocalSettings(): MongoMonitorSettings {
  try {
    if (fs.existsSync(LOCAL_SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf8'));
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function writeLocalSettings(settings: MongoMonitorSettings) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch {}
}

export async function loadMonitorSettings(): Promise<MongoMonitorSettings> {
  const local = readLocalSettings();
  try {
    const db = await getDatabase();
    const doc = await db
      .collection<{ _id: string } & Partial<MongoMonitorSettings>>('system_settings')
      .findOne({ _id: 'mongo_monitor_config' });
    if (doc) {
      const merged: MongoMonitorSettings = {
        ...DEFAULT_SETTINGS,
        ...local,
        ...doc,
        telegramBotToken: doc.telegramBotToken || local.telegramBotToken || DEFAULT_SETTINGS.telegramBotToken,
        telegramChatId: doc.telegramChatId || local.telegramChatId || DEFAULT_SETTINGS.telegramChatId,
      };
      writeLocalSettings(merged);
      return merged;
    }
  } catch {}
  return local;
}

export async function saveMonitorSettings(partial: Partial<MongoMonitorSettings>): Promise<MongoMonitorSettings> {
  const current = await loadMonitorSettings();
  const updated: MongoMonitorSettings = {
    ...current,
    ...partial,
  };
  writeLocalSettings(updated);

  try {
    const db = await getDatabase();
    await db
      .collection<{ _id: string }>('system_settings')
      .updateOne(
        { _id: 'mongo_monitor_config' },
        {
          $set: {
            ...updated,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
  } catch (err) {
    console.warn('[MongoMonitor] Could not save settings to MongoDB (saved locally):', err);
  }

  return updated;
}

export function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 12) return '********';
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

export async function sendTelegramNotification(
  messageHtml: string,
  overrideToken?: string,
  overrideChatId?: string
): Promise<{ ok: boolean; error?: string }> {
  const settings = await loadMonitorSettings();
  const botToken = (overrideToken ?? settings.telegramBotToken ?? '').trim();
  const chatId = (overrideChatId ?? settings.telegramChatId ?? '').trim();

  if (!botToken || !chatId) {
    return { ok: false, error: 'Chưa cấu hình Telegram Bot Token hoặc Chat ID.' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.description || `Telegram HTTP ${res.status}`,
      };
    }

    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Không thể kết nối tới Telegram API',
    };
  }
}

// Perform a real read + write operation so MongoDB Atlas resets its 60-day inactivity timer
export async function performKeepAlivePing(source = 'auto'): Promise<{
  ok: boolean;
  latencyMs: number;
  pingCount: number;
  lastPingAt: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const db = await getDatabase();
    const nowIso = new Date().toISOString();
    const col = db.collection<{ _id: string; pingCount?: number; lastPingAt?: Date }>('keepalive_heartbeats');

    await col.updateOne(
      { _id: 'atlas_anti_pause_heartbeat' },
      {
        $set: {
          lastPingAt: new Date(nowIso),
          lastSource: source,
        },
        $inc: {
          pingCount: 1,
        },
      },
      { upsert: true }
    );

    const doc = await col.findOne({ _id: 'atlas_anti_pause_heartbeat' });
    const latencyMs = Date.now() - start;
    const pingCount = doc?.pingCount || 1;

    await saveMonitorSettings({
      lastKeepAliveAt: nowIso,
      keepAlivePingCount: pingCount,
    });

    return {
      ok: true,
      latencyMs,
      pingCount,
      lastPingAt: nowIso,
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      pingCount: 0,
      lastPingAt: new Date().toISOString(),
      error: err?.message || 'MongoDB Keep-Alive failed',
    };
  }
}

export async function getMongoClusterHealth(): Promise<MongoClusterHealth> {
  const settings = await loadMonitorSettings();
  const start = Date.now();

  try {
    const client = await getConnectedClient();
    const db = await getDatabase();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - start;

    const adminDb = db.admin();
    const listDbResult = await adminDb.listDatabases();

    const databases: DbStorageItem[] = [];
    let totalUsedBytes = 0;

    for (const d of listDbResult.databases || []) {
      const sizeBytes = Number(d.sizeOnDisk || 0);
      totalUsedBytes += sizeBytes;

      if (['admin', 'local', 'config'].includes(d.name)) {
        continue;
      }

      const collectionsInfo: Array<{ name: string; count: number }> = [];
      try {
        const targetDb = client ? client.db(d.name) : d.name === db.databaseName ? db : null;
        if (targetDb) {
          const cols = await targetDb.listCollections().toArray();
          for (const c of cols.slice(0, 12)) {
            const cnt = await targetDb.collection(c.name).estimatedDocumentCount();
            collectionsInfo.push({ name: c.name, count: cnt });
          }
        }
      } catch {}

      databases.push({
        name: d.name,
        sizeOnDiskBytes: sizeBytes,
        sizeOnDiskMB: Number((sizeBytes / (1024 * 1024)).toFixed(2)),
        empty: !!d.empty,
        collections: collectionsInfo,
      });
    }

    databases.sort((a, b) => b.sizeOnDiskBytes - a.sizeOnDiskBytes);

    // Check heartbeat collection
    let lastPingAt = settings.lastKeepAliveAt || null;
    let pingCount = settings.keepAlivePingCount || 0;
    try {
      const hb = await db
        .collection<{ _id: string; lastPingAt?: Date; pingCount?: number }>('keepalive_heartbeats')
        .findOne({ _id: 'atlas_anti_pause_heartbeat' });
      if (hb?.lastPingAt) {
        lastPingAt = new Date(hb.lastPingAt).toISOString();
      }
      if (hb?.pingCount) {
        pingCount = hb.pingCount;
      }
    } catch {}

    // If never pinged yet, run initial keep-alive ping automatically!
    if (!lastPingAt) {
      const initial = await performKeepAlivePing('initial-health-check');
      if (initial.ok) {
        lastPingAt = initial.lastPingAt;
        pingCount = initial.pingCount;
      }
    }

    const totalUsedMB = Number((totalUsedBytes / (1024 * 1024)).toFixed(2));
    const remainingFreeMB = Number(Math.max(0, FREE_TIER_LIMIT_MB - totalUsedMB).toFixed(2));
    const usagePercent = Number(Math.min(100, (totalUsedMB / FREE_TIER_LIMIT_MB) * 100).toFixed(1));

    const daysSinceLastActivity = lastPingAt
      ? Math.max(0, Math.floor((Date.now() - new Date(lastPingAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const daysRemainingBeforePause = Math.max(0, AUTO_PAUSE_DAYS - daysSinceLastActivity);

    return {
      connected: true,
      latencyMs,
      clusterHost: 'mongodbdatnt.bc8xywz.mongodb.net',
      currentDb: db.databaseName,
      freeTierLimitMB: FREE_TIER_LIMIT_MB,
      totalUsedBytes,
      totalUsedMB,
      remainingFreeMB,
      usagePercent,
      databases,
      keepAlive: {
        enabled: settings.keepAliveEnabled !== false,
        intervalHours: 6,
        lastPingAt,
        pingCount,
        daysSinceLastActivity,
        autoPauseLimitDays: AUTO_PAUSE_DAYS,
        daysRemainingBeforePause,
        statusText:
          settings.keepAliveEnabled !== false
            ? 'Đang bật tự động Ping Đọc/Ghi mỗi 6 giờ — Cluster sẽ KHÔNG BAO GIỜ bị tự tắt (Auto-Pause 60 ngày)'
            : `Đang tắt tự động Ping — Cần có truy cập trong ${daysRemainingBeforePause} ngày tới`,
      },
      settings: {
        telegramConfigured: Boolean(settings.telegramBotToken && settings.telegramChatId),
        telegramBotTokenMasked: maskToken(settings.telegramBotToken),
        telegramChatId: settings.telegramChatId,
        telegramEnabled: settings.telegramEnabled,
        alertThresholdPercent: settings.alertThresholdPercent || 80,
        keepAliveEnabled: settings.keepAliveEnabled !== false,
        dailyReportEnabled: !!settings.dailyReportEnabled,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      clusterHost: 'mongodbdatnt.bc8xywz.mongodb.net',
      currentDb: 'signalr_chat',
      freeTierLimitMB: FREE_TIER_LIMIT_MB,
      totalUsedBytes: 0,
      totalUsedMB: 0,
      remainingFreeMB: FREE_TIER_LIMIT_MB,
      usagePercent: 0,
      databases: [],
      keepAlive: {
        enabled: settings.keepAliveEnabled !== false,
        intervalHours: 6,
        lastPingAt: settings.lastKeepAliveAt || null,
        pingCount: settings.keepAlivePingCount || 0,
        daysSinceLastActivity: 0,
        autoPauseLimitDays: AUTO_PAUSE_DAYS,
        daysRemainingBeforePause: AUTO_PAUSE_DAYS,
        statusText: 'Mất kết nối tới MongoDB Atlas — Kiểm tra IP Whitelist (0.0.0.0/0) hoặc trạng thái Cluster!',
      },
      settings: {
        telegramConfigured: Boolean(settings.telegramBotToken && settings.telegramChatId),
        telegramBotTokenMasked: maskToken(settings.telegramBotToken),
        telegramChatId: settings.telegramChatId,
        telegramEnabled: settings.telegramEnabled,
        alertThresholdPercent: settings.alertThresholdPercent || 80,
        keepAliveEnabled: settings.keepAliveEnabled !== false,
        dailyReportEnabled: !!settings.dailyReportEnabled,
      },
      error: err?.message || 'MongoDB connection failed',
    };
  }
}

export function buildTelegramReportHtml(health: MongoClusterHealth, title = '📊 Báo cáo MongoDB Atlas (Portfolio & Bio)'): string {
  if (!health.connected) {
    return [
      `🚨 <b>CẢNH BÁO MẤT KẾT NỐI MONGODB ATLAS</b>`,
      `🌐 Cluster: <code>${health.clusterHost}</code>`,
      `❌ Lỗi: <code>${health.error || 'Không xác định'}</code>`,
      `💡 Hãy kiểm tra mục <b>Network Access (0.0.0.0/0)</b> hoặc trạng thái Cluster trên cloud.mongodb.com!`,
    ].join('\n');
  }

  const dbLines = health.databases
    .map((d) => `  • <b>${d.name}</b>: ${d.sizeOnDiskMB} MB (${d.collections.length} bảng)`)
    .join('\n');

  return [
    `<b>${title}</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `🟢 <b>Trạng thái:</b> Đang hoạt động tốt (${health.latencyMs}ms)`,
    `💾 <b>Đã dùng:</b> ${health.totalUsedMB} MB / ${health.freeTierLimitMB} MB (${health.usagePercent}%)`,
    `🆓 <b>Còn trống:</b> <b>${health.remainingFreeMB} MB</b>`,
    `🛡️ <b>Chống tự tắt (60 ngày):</b> ${health.keepAlive.enabled ? 'Đang bật (Ping mỗi 6h)' : 'Đang tắt'}`,
    `🔄 <b>Tổng số lần Keep-Alive:</b> ${health.keepAlive.pingCount} lần`,
    `📂 <b>Chi tiết các Database:</b>`,
    dbLines || '  • Chưa có dữ liệu',
    `🕒 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
  ].join('\n');
}

// Singleton background scheduler inside Node.js process
let globalWithMonitor = global as typeof globalThis & {
  _mongoMonitorTimerStarted?: boolean;
};

export function ensureMongoKeepAliveScheduler() {
  if (globalWithMonitor._mongoMonitorTimerStarted) return;
  globalWithMonitor._mongoMonitorTimerStarted = true;

  const runScheduledCheck = async () => {
    try {
      const settings = await loadMonitorSettings();
      if (settings.keepAliveEnabled !== false) {
        await performKeepAlivePing('scheduled-6h');
      }

      const health = await getMongoClusterHealth();
      if (!settings.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId) {
        return;
      }

      // 1. Alert if disconnected
      if (!health.connected) {
        await sendTelegramNotification(buildTelegramReportHtml(health));
        return;
      }

      // 2. Alert if storage usage >= threshold
      const threshold = settings.alertThresholdPercent || 80;
      if (health.usagePercent >= threshold) {
        const lastAlert = settings.lastTelegramAlertAt ? new Date(settings.lastTelegramAlertAt).getTime() : 0;
        if (Date.now() - lastAlert > 12 * 60 * 60 * 1000) {
          await sendTelegramNotification(
            buildTelegramReportHtml(
              health,
              `⚠️ CẢNH BÁO DUNG LƯỢNG MONGODB ĐẠT ${health.usagePercent}%`
            )
          );
          await saveMonitorSettings({ lastTelegramAlertAt: new Date().toISOString() });
        }
      }

      // 3. Optional daily report (every 24h)
      if (settings.dailyReportEnabled) {
        const lastDaily = settings.lastDailyReportAt ? new Date(settings.lastDailyReportAt).getTime() : 0;
        if (Date.now() - lastDaily > 24 * 60 * 60 * 1000) {
          await sendTelegramNotification(
            buildTelegramReportHtml(health, '☀️ Báo Cáo Định Kỳ MongoDB Atlas & Keep-Alive')
          );
          await saveMonitorSettings({ lastDailyReportAt: new Date().toISOString() });
        }
      }
    } catch (err) {
      console.warn('[MongoMonitor] Scheduled check error:', err);
    }
  };

  // Run first background check 20s after boot, then every 6 hours
  setTimeout(runScheduledCheck, 20 * 1000);
  setInterval(runScheduledCheck, KEEPALIVE_INTERVAL_MS);
}
