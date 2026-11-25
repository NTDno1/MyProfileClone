// Background Service Worker (Manifest V3)
// Gửi dữ liệu sản phẩm từ Shopee / TikTok Shop về Server NA 2HAND mà không bị chặn bởi CSP của trang sàn

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'NA2HAND_IMPORT_PRODUCTS') return false;

  (async () => {
    try {
      const cfg = await chrome.storage.sync.get(['serverUrl', 'syncKey']);
      const serverUrl = String(cfg.serverUrl || 'https://na2hand.com').replace(/\/$/, '');
      const syncKey = String(cfg.syncKey || '').trim();

      if (!syncKey) {
        sendResponse({
          success: false,
          message: 'Bạn chưa dán Mã Sync API Key! Hãy bấm vào biểu tượng tiện ích 🎀 ở góc trên trình duyệt để dán mã khóa trước nhé.'
        });
        return;
      }

      const res = await fetch(`${serverUrl}/api/shop/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Key': syncKey
        },
        body: JSON.stringify({ products: msg.products || [] })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        sendResponse({
          success: false,
          message: data.message || `Lỗi kết nối Server (${res.status}). Kiểm tra lại Server URL và Sync Key nhé!`
        });
        return;
      }

      sendResponse(data);
    } catch (err) {
      sendResponse({
        success: false,
        message: 'Không kết nối được tới Server Shop: ' + err.message
      });
    }
  })();

  return true; // giữ kênh bất đồng bộ cho sendResponse
});
