document.addEventListener('DOMContentLoaded', async () => {
  const serverInput = document.getElementById('serverUrl');
  const keyInput = document.getElementById('syncKey');
  const msgEl = document.getElementById('msg');

  const saved = await chrome.storage.sync.get(['serverUrl', 'syncKey']);
  serverInput.value = saved.serverUrl || 'https://na2hand.com';
  keyInput.value = saved.syncKey || '';

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const serverUrl = serverInput.value.trim().replace(/\/$/, '') || 'https://na2hand.com';
    const syncKey = keyInput.value.trim();
    await chrome.storage.sync.set({ serverUrl, syncKey });
    msgEl.textContent = '✨ Đã lưu! Hãy mở Shopee / TikTok để hút sản phẩm!';
  });
});
