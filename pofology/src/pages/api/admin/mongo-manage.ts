import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidAuthToken } from '@/lib/auth';
import getConnectedClient, { getDatabase } from '@/lib/mongodb';
import {
  buildTelegramReportHtml,
  ensureMongoKeepAliveScheduler,
  getMongoClusterHealth,
  loadMonitorSettings,
  performKeepAlivePing,
  saveMonitorSettings,
  sendTelegramNotification,
} from '@/lib/mongo-monitor';

ensureMongoKeepAliveScheduler();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token || !isValidAuthToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const health = await getMongoClusterHealth();
    return res.status(200).json(health);
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};

    try {
      if (action === 'ping_keepalive') {
        const pingResult = await performKeepAlivePing('manual-admin-button');
        const health = await getMongoClusterHealth();
        return res.status(200).json({
          success: pingResult.ok,
          message: pingResult.ok
            ? `Đã Ping Đọc/Ghi chống tự tắt thành công (${pingResult.latencyMs}ms)! Bộ đếm 60 ngày của MongoDB Atlas đã được làm mới.`
            : `Ping thất bại: ${pingResult.error}`,
          health,
        });
      }

      if (action === 'save_settings') {
        const current = await loadMonitorSettings();
        const rawToken = String(req.body.telegramBotToken ?? '').trim();
        const updatedSettings = await saveMonitorSettings({
          telegramBotToken: rawToken ? rawToken : current.telegramBotToken,
          telegramChatId: String(req.body.telegramChatId ?? current.telegramChatId).trim(),
          telegramEnabled: req.body.telegramEnabled !== undefined ? !!req.body.telegramEnabled : current.telegramEnabled,
          keepAliveEnabled: req.body.keepAliveEnabled !== undefined ? !!req.body.keepAliveEnabled : current.keepAliveEnabled,
          dailyReportEnabled: req.body.dailyReportEnabled !== undefined ? !!req.body.dailyReportEnabled : current.dailyReportEnabled,
          alertThresholdPercent: Number(req.body.alertThresholdPercent || current.alertThresholdPercent || 80),
        });

        const health = await getMongoClusterHealth();
        return res.status(200).json({
          success: true,
          message: 'Đã lưu cấu hình Giám sát MongoDB & Telegram thành công!',
          settings: updatedSettings,
          health,
        });
      }

      if (action === 'test_telegram') {
        const current = await loadMonitorSettings();
        const rawToken = String(req.body.telegramBotToken ?? '').trim();
        const rawChatId = String(req.body.telegramChatId ?? '').trim();

        const useToken = rawToken || current.telegramBotToken;
        const useChatId = rawChatId || current.telegramChatId;

        if (rawToken || rawChatId) {
          await saveMonitorSettings({
            telegramBotToken: useToken,
            telegramChatId: useChatId,
            telegramEnabled: true,
          });
        }

        const health = await getMongoClusterHealth();
        const htmlMsg = buildTelegramReportHtml(
          health,
          '🔔 Kiểm Tra Kết Nối & Sức Khỏe MongoDB Atlas'
        );

        const teleRes = await sendTelegramNotification(htmlMsg, useToken, useChatId);
        if (!teleRes.ok) {
          return res.status(400).json({
            success: false,
            message: `Gửi Telegram thất bại: ${teleRes.error}`,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Đã bắn báo cáo sức khỏe MongoDB Atlas về Telegram của bạn thành công!',
          health,
        });
      }

      if (action === 'prune_old_logs') {
        const days = Math.max(7, Number(req.body.days || 90));
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const db = await getDatabase();
        const result = await db.collection('analytics').deleteMany({
          timestamp: { $lt: cutoff },
        });
        const health = await getMongoClusterHealth();
        return res.status(200).json({
          success: true,
          message: `Đã dọn dẹp ${result.deletedCount} bản ghi thống kê cũ hơn ${days} ngày!`,
          health,
        });
      }

      if (action === 'drop_sample_db') {
        const targetDbName = String(req.body.dbName || '');
        if (!targetDbName.startsWith('sample_')) {
          return res.status(400).json({
            success: false,
            message: 'Chỉ cho phép xóa các database mẫu (sample_*) của MongoDB Atlas để bảo vệ dữ liệu thật!',
          });
        }
        const client = await getConnectedClient();
        await client.db(targetDbName).dropDatabase();
        const health = await getMongoClusterHealth();
        return res.status(200).json({
          success: true,
          message: `Đã xóa database mẫu "${targetDbName}" để giải phóng dung lượng Free Tier!`,
          health,
        });
      }

      return res.status(400).json({ success: false, message: 'Hành động không hợp lệ.' });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || 'Lỗi xử lý quản trị MongoDB',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
