// Quản trị Cửa hàng Online NA 2HAND Boutique (/shop-admin)
// Quản lý Đơn hàng (QR & COD), Sản phẩm, Kéo tự động Shopee/TikTok qua Trình duyệt thật, Danh mục, Voucher & Cài đặt

(function () {
  const TOKEN_KEY = 'bio_admin_token';
  const PLAYWRIGHT_AGENT_URL = 'http://127.0.0.1:3899';

  let authToken = localStorage.getItem(TOKEN_KEY) || '';
  let shopData = null;

  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const toastEl = document.getElementById('toast');

  function showToast(msg, isError) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.background = isError ? '#be123c' : '#381625';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  function formatVnd(n) {
    return `${Number(n || 0).toLocaleString('vi-VN')}đ`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function apiFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      authToken = '';
      localStorage.removeItem(TOKEN_KEY);
      if (loginOverlay) loginOverlay.style.display = 'flex';
      throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Có lỗi xảy ra!');
    }
    return json;
  }

  // Nén ảnh trên trình duyệt trước khi upload để tiết kiệm băng thông & ổ cứng VPS
  function readImageCompressed(file, maxWidth = 1100) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawUrl = ev.target.result;
        if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
          return resolve(rawUrl);
        }
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(outType, 0.86));
        };
        img.onerror = reject;
        img.src = rawUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadFileToServer(file) {
    const dataUrl = await readImageCompressed(file);
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename: file.name })
    });
    return res.url;
  }

  // --- TAB NAVIGATION ---
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => (p.style.display = 'none'));
      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.tab);
      if (pane) pane.style.display = 'block';
    });
  });

  // --- AUTHENTICATION ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          showToast(json.message || 'Sai tài khoản hoặc mật khẩu!', true);
          return;
        }
        authToken = json.token;
        localStorage.setItem(TOKEN_KEY, authToken);
        loginOverlay.style.display = 'none';
        showToast('Đăng nhập Quản trị Shop thành công! 🎀');
        await loadOverview();
      } catch (err) {
        showToast(err.message || 'Không thể đăng nhập', true);
      }
    });
  }

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    authToken = '';
    localStorage.removeItem(TOKEN_KEY);
    loginOverlay.style.display = 'flex';
  });

  // --- LOAD ADMIN OVERVIEW ---
  async function loadOverview() {
    if (!authToken) {
      loginOverlay.style.display = 'flex';
      return;
    }
    try {
      const data = await apiFetch('/api/shop/admin/overview');
      loginOverlay.style.display = 'none';
      shopData = data.store;

      // DB Badge
      const dbBadge = document.getElementById('db-badge');
      if (dbBadge) {
        if (data.mongoConnected) {
          dbBadge.textContent = `🟢 MongoDB Atlas: ${data.mongoDbName || 'na2hand_shop'}`;
          dbBadge.style.background = '#e6f9ed';
          dbBadge.style.color = '#157f3d';
        } else {
          dbBadge.textContent = `🟡 Dự phòng Local JSON (${data.mongoDbName || 'na2hand_shop'})`;
          dbBadge.style.background = '#fef3c7';
          dbBadge.style.color = '#92400e';
        }
      }

      // KPIs
      const m = data.metrics || {};
      document.getElementById('kpi-rev').textContent = formatVnd(m.totalRevenue);
      document.getElementById('kpi-orders').textContent = m.totalOrders || 0;
      document.getElementById('kpi-pending').textContent = m.pendingOrders || 0;
      document.getElementById('kpi-qr').textContent = m.qrWaitingOrders || 0;
      document.getElementById('kpi-prods').textContent = m.totalProducts || 0;
      document.getElementById('tab-ord-cnt').textContent = m.totalOrders || 0;

      renderOrders();
      renderCategoryOptions();
      renderProductsTable();
      renderCategoriesAndCoupons();
      populateSettingsForm();
      setupSyncTools();
    } catch (err) {
      if (authToken) showToast(err.message, true);
    }
  }

  // --- 1. ORDERS MANAGEMENT ---
  function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody || !shopData) return;
    const orders = shopData.orders || [];

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:32px; color:var(--muted);">
            🌸 Chưa có đơn đặt hàng nào. Hãy thử đặt 1 đơn mẫu trên trang <a href="/shop" target="_blank" style="color:var(--pri); font-weight:700;">/shop</a> nhé!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders
      .map((o) => {
        const dt = o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '';
        const itemsHtml = (o.items || [])
          .map(
            (it) => `
            <div style="display:flex; align-items:center; gap:7px; margin-bottom:5px;">
              <img src="${escapeHtml(it.image || '/uploads/girlfriend-1.jpg')}" style="width:34px; height:34px; border-radius:8px; object-fit:cover; border:1px solid #f2d6e3;" />
              <div>
                <div style="font-weight:700; font-size:0.78rem;">${escapeHtml(it.name)}</div>
                <div style="font-size:0.71rem; color:var(--muted);">${escapeHtml(it.color || '')} • ${escapeHtml(it.size || '')} × <strong>${it.qty}</strong></div>
              </div>
            </div>
          `
          )
          .join('');

        const payBadge =
          o.paymentMethod === 'qr'
            ? `<span class="badge" style="background:#fce7f3; color:#be185d;">📱 Quét mã QR</span>`
            : `<span class="badge" style="background:#fef3c7; color:#92400e;">💵 COD nhận hàng</span>`;

        return `
          <tr>
            <td>
              <div style="font-weight:800; color:var(--pri); font-size:0.88rem;">#${escapeHtml(o.orderCode)}</div>
              <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">${escapeHtml(dt)}</div>
              ${o.transferNote && o.paymentMethod === 'qr' ? `<div style="font-size:0.7rem; margin-top:4px; background:#fff5f9; padding:2px 6px; border-radius:6px; display:inline-block;">ND: <code>${escapeHtml(o.transferNote)}</code></div>` : ''}
            </td>
            <td>
              <div style="font-weight:700;">${escapeHtml(o.customerName)}</div>
              <div style="font-size:0.78rem; color:#0f766e; font-weight:700;">📞 ${escapeHtml(o.customerPhone)}</div>
              <div style="font-size:0.74rem; color:var(--muted); max-width:240px;">📍 ${escapeHtml(o.address)}${o.district ? `, ${escapeHtml(o.district)}` : ''}${o.province ? `, ${escapeHtml(o.province)}` : ''}</div>
              ${o.note ? `<div style="font-size:0.72rem; color:#be185d; margin-top:3px;">📝 "${escapeHtml(o.note)}"</div>` : ''}
            </td>
            <td>${itemsHtml}</td>
            <td>
              <div style="font-weight:800; font-size:0.95rem; color:#be123c; margin-bottom:4px;">${formatVnd(o.totalAmount)}</div>
              ${payBadge}
              <div style="margin-top:6px;">
                <select class="select order-pay-select" data-id="${escapeHtml(o.id)}" style="margin-bottom:0; padding:5px 8px; font-size:0.74rem;">
                  <option value="pending" ${o.paymentStatus === 'pending' ? 'selected' : ''}>⏳ Chờ thanh toán</option>
                  <option value="customer_confirmed_qr" ${o.paymentStatus === 'customer_confirmed_qr' ? 'selected' : ''}>🔔 Khách báo đã quét QR</option>
                  <option value="paid" ${o.paymentStatus === 'paid' ? 'selected' : ''}>✅ Đã nhận đủ tiền</option>
                </select>
              </div>
            </td>
            <td>
              <select class="select order-status-select" data-id="${escapeHtml(o.id)}" style="margin-bottom:0; padding:6px 9px; font-size:0.76rem; font-weight:700;">
                <option value="pending" ${o.orderStatus === 'pending' ? 'selected' : ''}>🆕 Đơn mới chờ xác nhận</option>
                <option value="confirmed" ${o.orderStatus === 'confirmed' ? 'selected' : ''}>💖 Đã xác nhận đơn</option>
                <option value="packing" ${o.orderStatus === 'packing' ? 'selected' : ''}>🎀 Đang gói hàng thơm</option>
                <option value="shipping" ${o.orderStatus === 'shipping' ? 'selected' : ''}>🚚 Đang giao cho nàng</option>
                <option value="completed" ${o.orderStatus === 'completed' ? 'selected' : ''}>✨ Giao thành công</option>
                <option value="cancelled" ${o.orderStatus === 'cancelled' ? 'selected' : ''}>❌ Đã hủy đơn</option>
              </select>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.order-pay-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiFetch(`/api/shop/admin/orders/${sel.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({ paymentStatus: sel.value })
          });
          showToast('Đã cập nhật trạng thái thanh toán! 💳');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    tbody.querySelectorAll('.order-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiFetch(`/api/shop/admin/orders/${sel.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({ orderStatus: sel.value })
          });
          showToast('Đã cập nhật trạng thái đơn hàng! 📦');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  document.getElementById('btn-refresh-orders')?.addEventListener('click', loadOverview);

  // --- 2. PRODUCTS MANAGEMENT ---
  function renderCategoryOptions() {
    const sel = document.getElementById('pf-category');
    if (!sel || !shopData) return;
    sel.innerHTML = (shopData.categories || [])
      .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.icon || '🌸')} ${escapeHtml(c.name)}</option>`)
      .join('');
  }

  function resetProductForm() {
    document.getElementById('pf-id').value = '';
    document.getElementById('pf-name').value = '';
    document.getElementById('pf-price').value = '';
    document.getElementById('pf-orig-price').value = '';
    document.getElementById('pf-sizes').value = 'S, M, L, Freesize';
    document.getElementById('pf-colors').value = 'Hồng Phấn, Trắng Kem';
    document.getElementById('pf-stock').value = '15';
    document.getElementById('pf-source-url').value = '';
    document.getElementById('pf-images').value = '';
    document.getElementById('pf-desc').value = '';
    document.getElementById('pf-flash').checked = true;
    document.getElementById('pf-enabled').checked = true;
    document.getElementById('prod-form-heading').textContent = '➕ Thêm Sản Phẩm Mới';
  }

  document.getElementById('btn-reset-prod-form')?.addEventListener('click', resetProductForm);

  document.getElementById('pf-upload-file')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    showToast(`Đang tải lên ${files.length} ảnh... ⏳`);
    try {
      const uploadedUrls = [];
      for (const f of files) {
        const url = await uploadFileToServer(f);
        uploadedUrls.push(url);
      }
      const textarea = document.getElementById('pf-images');
      const existing = textarea.value.trim();
      textarea.value = [existing, ...uploadedUrls].filter(Boolean).join('\n');
      showToast(`Đã tải lên ${uploadedUrls.length} ảnh thành công! ✨`);
    } catch (err) {
      showToast(err.message || 'Lỗi tải ảnh', true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pf-id').value.trim();
    const sourceUrl = document.getElementById('pf-source-url').value.trim();
    const payload = {
      name: document.getElementById('pf-name').value.trim(),
      category: document.getElementById('pf-category').value,
      price: Number(document.getElementById('pf-price').value || 0),
      originalPrice: Number(document.getElementById('pf-orig-price').value || 0),
      sizes: document
        .getElementById('pf-sizes')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      colors: document
        .getElementById('pf-colors')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      stock: Number(document.getElementById('pf-stock').value || 0),
      sourceUrl,
      sourcePlatform: sourceUrl.includes('tiktok') ? 'tiktok' : sourceUrl.includes('shopee') ? 'shopee' : 'manual',
      images: document
        .getElementById('pf-images')
        .value.split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      description: document.getElementById('pf-desc').value.trim(),
      isFlashSale: document.getElementById('pf-flash').checked,
      enabled: document.getElementById('pf-enabled').checked
    };

    try {
      if (id) {
        await apiFetch(`/api/shop/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Đã cập nhật sản phẩm! ✨');
      } else {
        await apiFetch('/api/shop/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Đã thêm sản phẩm mới vào Shop! 🌸');
      }
      resetProductForm();
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody || !shopData) return;
    const prods = shopData.products || [];

    tbody.innerHTML = prods
      .map((p) => {
        const img = (p.images && p.images[0]) || '/uploads/girlfriend-1.jpg';
        const srcBadge =
          p.sourcePlatform === 'shopee'
            ? `<span class="badge" style="background:#ffedd5; color:#c2410c;">🧡 Shopee</span>`
            : p.sourcePlatform === 'tiktok'
            ? `<span class="badge" style="background:#f3e8ff; color:#6b21a8;">🎵 TikTok</span>`
            : `<span class="badge" style="background:#fce7f3; color:#be185d;">🎀 Tự đăng</span>`;

        return `
          <tr>
            <td>
              <img src="${escapeHtml(img)}" style="width:48px; height:48px; border-radius:11px; object-fit:cover; border:1px solid var(--border);" />
            </td>
            <td>
              <div style="font-weight:700;">${escapeHtml(p.name)}</div>
              <div style="font-size:0.72rem; color:var(--muted);">
                ${p.isFlashSale ? '⚡ DEAL XINH • ' : ''}
                ${p.enabled === false ? '🙈 Đang ẩn' : '👁️ Đang hiện'}
              </div>
            </td>
            <td>
              <div style="font-weight:800; color:var(--pri);">${formatVnd(p.price)}</div>
              ${p.originalPrice > p.price ? `<div style="font-size:0.72rem; text-decoration:line-through; color:var(--muted);">${formatVnd(p.originalPrice)}</div>` : ''}
            </td>
            <td>
              <div>Kho: <strong>${p.stock ?? 0}</strong></div>
              <div style="font-size:0.72rem; color:var(--muted);">Đã bán: ${p.sold ?? 0}</div>
            </td>
            <td>
              ${srcBadge}
              ${p.sourceUrl ? `<div style="margin-top:3px;"><a href="${escapeHtml(p.sourceUrl)}" target="_blank" style="font-size:0.7rem; color:var(--pri);">Xem link gốc ↗</a></div>` : ''}
            </td>
            <td>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-edit-prod" data-id="${escapeHtml(p.id)}">✏️ Sửa</button>
                <button type="button" class="btn btn-sm btn-danger btn-del-prod" data-id="${escapeHtml(p.id)}">🗑️ Xóa</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.btn-edit-prod').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prod = (shopData.products || []).find((x) => x.id === btn.dataset.id);
        if (!prod) return;
        document.getElementById('pf-id').value = prod.id;
        document.getElementById('pf-name').value = prod.name || '';
        document.getElementById('pf-category').value = prod.category || '';
        document.getElementById('pf-price').value = prod.price || 0;
        document.getElementById('pf-orig-price').value = prod.originalPrice || 0;
        document.getElementById('pf-sizes').value = (prod.sizes || []).join(', ');
        document.getElementById('pf-colors').value = (prod.colors || []).join(', ');
        document.getElementById('pf-stock').value = prod.stock ?? 10;
        document.getElementById('pf-source-url').value = prod.sourceUrl || '';
        document.getElementById('pf-images').value = (prod.images || []).join('\n');
        document.getElementById('pf-desc').value = prod.description || '';
        document.getElementById('pf-flash').checked = !!prod.isFlashSale;
        document.getElementById('pf-enabled').checked = prod.enabled !== false;
        document.getElementById('prod-form-heading').textContent = `✏️ Đang sửa: ${prod.name}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tbody.querySelectorAll('.btn-del-prod').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này khỏi cửa hàng?')) return;
        try {
          await apiFetch(`/api/shop/admin/products/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Đã xóa sản phẩm!');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  // --- 3. AUTO SYNC SHOPEE & TIKTOK SHOP (PLAYWRIGHT + EXTENSION + BOOKMARKLET) ---
  function buildBookmarkletHref(serverUrl, syncKey) {
    // Bookmarklet runs directly inside the user's currently open Shopee / TikTok Shop tab
    const code = `(function(){
      var sUrl=${JSON.stringify(serverUrl)};
      var sKey=${JSON.stringify(syncKey)};
      var u=location.href;
      var plat=u.indexOf('tiktok')>-1?'tiktok':'shopee';
      var title=(document.querySelector('h1')&&document.querySelector('h1').innerText)||document.title||'';
      title=title.replace(/\\s*\\|\\s*Shopee.*$/i,'').replace(/\\s*-\\s*TikTok.*$/i,'').trim();
      var price=0,orig=0,imgs=[],desc='';
      document.querySelectorAll('script[type="application/ld+json"]').forEach(function(sc){
        try{
          var j=JSON.parse(sc.textContent);
          var arr=Array.isArray(j)?j:[j];
          arr.forEach(function(it){
            if(it['@type']==='Product'){
              if(it.name)title=it.name;
              if(it.description)desc=it.description;
              if(it.image)imgs=imgs.concat(Array.isArray(it.image)?it.image:[it.image]);
              var ofr=Array.isArray(it.offers)?it.offers[0]:it.offers;
              if(ofr&&(ofr.price||ofr.lowPrice))price=ofr.price||ofr.lowPrice;
            }
          });
        }catch(e){}
      });
      if(!price){
        var bodyTxt=document.body.innerText;
        var m=bodyTxt.match(/([0-9]{2,3}(?:\\.[0-9]{3})+)\\s*[₫đ]/i)||bodyTxt.match(/[₫đ]\\s*([0-9]{2,3}(?:[.,][0-9]{3})+)/i);
        if(m)price=m[1];
      }
      document.querySelectorAll('img').forEach(function(im){
        var src=im.currentSrc||im.src||'';
        if(src.indexOf('http')===0&&im.naturalWidth>=260&&imgs.indexOf(src)===-1&&src.indexOf('avatar')===-1){
          imgs.push(src.replace(/_tn$/,''));
        }
      });
      if(!title){alert('Không tìm thấy tên sản phẩm trên trang này!');return;}
      fetch(sUrl+'/api/shop/import',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Sync-Key':sKey},
        body:JSON.stringify({product:{name:title,price:price||199000,originalPrice:orig,images:imgs.slice(0,8),sourcePlatform:plat,sourceUrl:u,description:desc}})
      }).then(function(r){return r.json();}).then(function(res){
        alert(res.message||'Đã đẩy sản phẩm về Shop NA 2HAND thành công! ✨');
      }).catch(function(err){alert('Lỗi kết nối về Shop: '+err.message);});
    })();`;
    return 'javascript:' + encodeURIComponent(code.replace(/\s+/g, ' ').trim());
  }

  function setupSyncTools() {
    if (!shopData) return;
    const serverUrl = window.location.origin;
    const syncKey = shopData.settings?.syncApiKey || '';

    const extUrlEl = document.getElementById('ext-server-url');
    const extKeyEl = document.getElementById('ext-sync-key');
    const bmEl = document.getElementById('bookmarklet-link');

    if (extUrlEl) extUrlEl.value = serverUrl;
    if (extKeyEl) extKeyEl.value = syncKey;
    if (bmEl && syncKey) {
      bmEl.setAttribute('href', buildBookmarkletHref(serverUrl, syncKey));
    }
  }

  document.getElementById('btn-copy-sync-key')?.addEventListener('click', () => {
    const val = document.getElementById('ext-sync-key')?.value || '';
    if (!val) return;
    navigator.clipboard.writeText(val);
    showToast('Đã copy Sync API Key! 📋');
  });

  document.getElementById('btn-quick-shopee')?.addEventListener('click', () => {
    const url = shopData?.settings?.shopeeShopUrl || 'https://s.shopee.vn/8VAfrswNOG';
    document.getElementById('sync-target-url').value = url;
  });

  document.getElementById('btn-quick-tiktok')?.addEventListener('click', () => {
    const url = shopData?.settings?.tiktokShopUrl || 'https://www.tiktok.com/@na2hand3';
    document.getElementById('sync-target-url').value = url;
  });

  async function checkPlaywrightAgent() {
    const badge = document.getElementById('playwright-agent-badge');
    if (!badge) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${PLAYWRIGHT_AGENT_URL}/status`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        badge.textContent = '🟢 Playwright Sẵn Sàng Mở Chrome Trên Máy Bạn';
        badge.style.background = '#dcfce7';
        badge.style.color = '#15803d';
        return true;
      }
    } catch {}
    badge.textContent = '⚪ Chưa bật Playwright trên máy tính (Xem lệnh bật 5s bên dưới)';
    badge.style.background = '#fef3c7';
    badge.style.color = '#92400e';
    return false;
  }

  setInterval(checkPlaywrightAgent, 8000);
  checkPlaywrightAgent();

  document.getElementById('btn-launch-playwright')?.addEventListener('click', async () => {
    const targetUrl = document.getElementById('sync-target-url')?.value.trim();
    const logBox = document.getElementById('sync-live-log');
    if (!targetUrl) {
      showToast('Hãy dán link sản phẩm hoặc link Shop Shopee / TikTok Shop trước nhé!', true);
      return;
    }

    logBox.style.display = 'block';
    logBox.innerHTML = '⏳ Đang kết nối tới công cụ <strong>Playwright Local Browser</strong> trên máy của bạn...';

    const agentOnline = await checkPlaywrightAgent();
    if (!agentOnline) {
      logBox.innerHTML = `
        <div style="color:#be123c; font-weight:700; margin-bottom:6px;">
          ⚠️ Trình điều khiển Playwright trên máy tính cá nhân của bạn hiện chưa bật!
        </div>
        <div style="line-height:1.6;">
          Vì trang quản trị đang chạy trên đám mây/server, để mở được cửa sổ Chrome thật ngay trên màn hình máy tính của bạn, bạn hãy:<br/>
          • <strong>Cách nhanh nhất (Không cần gõ lệnh):</strong> Cài tiện ích <strong>Chrome Extension NA 2HAND</strong> ở Khung Cách 2 bên dưới hoặc kéo nút <strong>Bookmarklet</strong> ở Cách 3, rồi mở thẳng <a href="${escapeHtml(targetUrl)}" target="_blank" style="color:var(--pri); font-weight:700;">link Shopee/TikTok này ↗</a> để hút 1 chạm!<br/>
          • <strong>Hoặc bật Playwright tự động click trên máy bạn:</strong> Mở Terminal trong thư mục <code>bio-link/browser-tools/playwright-sync</code> rồi chạy <code>npm install &amp;&amp; npm start</code>, sau đó bấm lại nút này nhé!
        </div>
      `;
      return;
    }

    try {
      logBox.innerHTML = `🚀 Đang mở trình duyệt Chrome thật của bạn tới <code>${escapeHtml(targetUrl)}</code>, tự cuộn trang & click ảnh để cào dữ liệu chuẩn... (Vui lòng đợi 8 - 20 giây và không đóng cửa sổ Chrome vừa bật nhé!)`;

      const res = await fetch(`${PLAYWRIGHT_AGENT_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          serverUrl: window.location.origin,
          syncKey: shopData?.settings?.syncApiKey || ''
        })
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        logBox.innerHTML = `<div style="color:#be123c; font-weight:700;">⚠️ ${escapeHtml(json.message || 'Chưa lấy được sản phẩm.')}</div>`;
        return;
      }

      logBox.innerHTML = `
        <div style="color:#15803d; font-weight:800; margin-bottom:4px;">
          🎉 ${escapeHtml(json.message)}
        </div>
        <div style="color:var(--muted);">
          Đã tự động lưu vào MongoDB (<code>na2hand_shop</code>). Chuyển sang Tab <strong>👗 2. Sản Phẩm</strong> để kiểm tra hoặc chỉnh giá tùy ý nhé!
        </div>
      `;
      showToast('Kéo sản phẩm từ trình duyệt thành công! 🎉');
      await loadOverview();
    } catch (err) {
      logBox.innerHTML = `<div style="color:#be123c; font-weight:700;">Lỗi khi giao tiếp với Playwright: ${escapeHtml(err.message)}</div>`;
    }
  });

  // --- 4. CATEGORIES & COUPONS ---
  function renderCategoriesAndCoupons() {
    if (!shopData) return;

    const catsList = document.getElementById('cats-list');
    if (catsList) {
      catsList.innerHTML = (shopData.categories || [])
        .map(
          (c) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid #f7e6ee;">
            <span><strong>${escapeHtml(c.icon || '🌸')} ${escapeHtml(c.name)}</strong> <small style="color:var(--muted);">(${escapeHtml(c.id)})</small></span>
            <button type="button" class="btn btn-sm btn-danger btn-del-cat" data-id="${escapeHtml(c.id)}">Xóa</button>
          </div>
        `
        )
        .join('');

      catsList.querySelectorAll('.btn-del-cat').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await apiFetch(`/api/shop/admin/categories/${btn.dataset.id}`, { method: 'DELETE' });
            showToast('Đã xóa danh mục');
            await loadOverview();
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
    }

    const cpList = document.getElementById('coupons-list');
    if (cpList) {
      cpList.innerHTML = (shopData.coupons || [])
        .map(
          (cp) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 10px; border:1px dashed #f0abc6; border-radius:12px; margin-bottom:8px; background:#fff9fb;">
            <div>
              <strong style="color:var(--pri);">🎟️ ${escapeHtml(cp.code)}</strong>
              <span style="font-size:0.75rem; margin-left:6px;">
                (${cp.type === 'percent' ? `Giảm ${cp.value}%` : `Giảm ${formatVnd(cp.value)}`} • Đơn từ ${formatVnd(cp.minOrder)})
              </span>
              <div style="font-size:0.72rem; color:var(--muted);">${escapeHtml(cp.description || '')}</div>
            </div>
            <button type="button" class="btn btn-sm btn-danger btn-del-cp" data-id="${escapeHtml(cp.id)}">Xóa</button>
          </div>
        `
        )
        .join('');

      cpList.querySelectorAll('.btn-del-cp').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await apiFetch(`/api/shop/admin/coupons/${btn.dataset.id}`, { method: 'DELETE' });
            showToast('Đã xóa mã giảm giá');
            await loadOverview();
          } catch (err) {
            showToast(err.message, true);
          }
        });
      });
    }
  }

  document.getElementById('btn-add-cat')?.addEventListener('click', async () => {
    const icon = document.getElementById('cat-icon').value.trim() || '🌸';
    const name = document.getElementById('cat-name').value.trim();
    if (!name) return showToast('Vui lòng nhập tên danh mục!', true);
    try {
      await apiFetch('/api/shop/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ icon, name })
      });
      document.getElementById('cat-name').value = '';
      showToast('Đã thêm danh mục mới! 🎀');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('btn-add-cp')?.addEventListener('click', async () => {
    const code = document.getElementById('cp-code').value.trim().toUpperCase();
    const type = document.getElementById('cp-type').value;
    const value = Number(document.getElementById('cp-val').value || 0);
    const minOrder = Number(document.getElementById('cp-min').value || 0);
    const description = document.getElementById('cp-desc').value.trim();
    if (!code || !value) return showToast('Vui lòng nhập Mã và Giá trị giảm!', true);
    try {
      await apiFetch('/api/shop/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({ code, type, value, minOrder, description })
      });
      document.getElementById('cp-code').value = '';
      document.getElementById('cp-val').value = '';
      document.getElementById('cp-min').value = '';
      document.getElementById('cp-desc').value = '';
      showToast(`Đã tạo mã giảm giá ${code}! 🎟️`);
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // --- 5. QR PAYMENT & STORE SETTINGS ---
  function populateSettingsForm() {
    if (!shopData || !shopData.settings) return;
    const s = shopData.settings;
    document.getElementById('st-qr-enabled').checked = s.qrEnabled !== false;
    document.getElementById('st-cod-enabled').checked = s.codEnabled !== false;
    document.getElementById('st-qr-mode').value = s.qrMode || 'custom_image';
    document.getElementById('st-qr-prefix').value = s.qrNotePrefix || 'NA2HAND';
    document.getElementById('st-qr-url').value = s.qrImageUrl || '/images/cute-qr-placeholder.svg';
    document.getElementById('st-qr-preview').src = s.qrImageUrl || '/images/cute-qr-placeholder.svg';
    document.getElementById('st-bank-name').value = s.bankName || '';
    document.getElementById('st-bank-bin').value = s.bankBin || '970422';
    document.getElementById('st-bank-no').value = s.bankAccountNo || '';
    document.getElementById('st-bank-owner').value = s.bankAccountName || '';
    document.getElementById('st-shop-name').value = s.shopName || 'NA 2HAND Boutique';
    document.getElementById('st-announce').value = s.announcement || '';
    document.getElementById('st-ship-fee').value = s.shippingFee ?? 25000;
    document.getElementById('st-freeship').value = s.freeShipThreshold ?? 299000;
    document.getElementById('st-tele-token').value = s.telegramBotToken || '';
    document.getElementById('st-tele-chat').value = s.telegramChatId || '';
  }

  document.getElementById('st-qr-url')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) document.getElementById('st-qr-preview').src = val;
  });

  document.getElementById('st-qr-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Đang tải ảnh Mã QR lên... ⏳');
    try {
      const url = await uploadFileToServer(file);
      document.getElementById('st-qr-url').value = url;
      document.getElementById('st-qr-preview').src = url;
      document.getElementById('st-qr-mode').value = 'custom_image';
      showToast('Đã tải ảnh Mã QR thành công! Nhớ bấm Lưu Cài Đặt nhé 💳');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
    const payload = {
      qrEnabled: document.getElementById('st-qr-enabled').checked,
      codEnabled: document.getElementById('st-cod-enabled').checked,
      qrMode: document.getElementById('st-qr-mode').value,
      qrNotePrefix: document.getElementById('st-qr-prefix').value.trim() || 'NA2HAND',
      qrImageUrl: document.getElementById('st-qr-url').value.trim() || '/images/cute-qr-placeholder.svg',
      bankName: document.getElementById('st-bank-name').value.trim(),
      bankBin: document.getElementById('st-bank-bin').value.trim(),
      bankAccountNo: document.getElementById('st-bank-no').value.trim(),
      bankAccountName: document.getElementById('st-bank-owner').value.trim(),
      shopName: document.getElementById('st-shop-name').value.trim(),
      announcement: document.getElementById('st-announce').value.trim(),
      shippingFee: Number(document.getElementById('st-ship-fee').value || 0),
      freeShipThreshold: Number(document.getElementById('st-freeship').value || 0),
      telegramBotToken: document.getElementById('st-tele-token').value.trim(),
      telegramChatId: document.getElementById('st-tele-chat').value.trim()
    };

    try {
      await apiFetch('/api/shop/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Đã lưu cài đặt cửa hàng & Mã QR thanh toán! 💖');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Boot
  loadOverview();
})();
