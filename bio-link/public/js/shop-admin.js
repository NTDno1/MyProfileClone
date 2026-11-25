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
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
    authToken = '';
    localStorage.removeItem(TOKEN_KEY);
    loginOverlay.style.display = 'flex';
  });

  // --- LOAD ADMIN OVERVIEW (Unified SSO with /admin) ---
  async function loadOverview() {
    try {
      const verifyHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const vRes = await fetch('/api/auth/verify', { headers: verifyHeaders });
      if (!vRes.ok) {
        authToken = '';
        localStorage.removeItem(TOKEN_KEY);
        loginOverlay.style.display = 'flex';
        return;
      }
      const vJson = await vRes.json();
      if (vJson.token) {
        authToken = vJson.token;
        localStorage.setItem(TOKEN_KEY, authToken);
      }
      const sharedUserEl = document.getElementById('adm-shared-user');
      if (sharedUserEl && vJson.username) sharedUserEl.value = vJson.username;

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

  // --- 1. ORDERS MANAGEMENT (30 rows / page) ---
  const SHOP_PAGE_SIZE = 30;
  let orderSearch = '';
  let orderStatusFilter = 'all';
  let ordersPage = 1;
  let productsPage = 1;

  function renderAdminPager(containerId, currentPage, totalItems, onPageChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (totalItems === 0) {
      el.innerHTML = '';
      return;
    }
    const totalPages = Math.max(1, Math.ceil(totalItems / SHOP_PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const from = (safePage - 1) * SHOP_PAGE_SIZE + 1;
    const to = Math.min(totalItems, safePage * SHOP_PAGE_SIZE);

    let btns = '';
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 2) {
        btns += `<button type="button" class="btn btn-sm ${p === safePage ? 'btn-primary' : ''}" data-pg="${p}">${p}</button>`;
      } else if (Math.abs(p - safePage) === 3) {
        btns += `<span style="padding:0 4px;color:var(--muted);">...</span>`;
      }
    }

    el.innerHTML = `
      <span style="color:var(--muted);">Hiển thị <strong>${from}–${to}</strong> / <strong>${totalItems}</strong> dòng (30 dòng/trang)</span>
      <div style="display:flex; gap:5px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm" data-pg="${safePage - 1}" ${safePage <= 1 ? 'disabled style="opacity:.45"' : ''}>&larr; Trước</button>
        ${btns}
        <button type="button" class="btn btn-sm" data-pg="${safePage + 1}" ${safePage >= totalPages ? 'disabled style="opacity:.45"' : ''}>Sau &rarr;</button>
      </div>
    `;

    el.querySelectorAll('button[data-pg]').forEach((b) => {
      b.addEventListener('click', () => {
        const next = Number(b.getAttribute('data-pg'));
        if (next >= 1 && next <= totalPages && next !== safePage) {
          onPageChange(next);
        }
      });
    });
  }

  document.getElementById('ord-search-input')?.addEventListener('input', (e) => {
    orderSearch = e.target.value.trim().toLowerCase();
    ordersPage = 1;
    renderOrders();
  });
  document.getElementById('ord-status-filter')?.addEventListener('change', (e) => {
    orderStatusFilter = e.target.value;
    ordersPage = 1;
    renderOrders();
  });

  function printPackingSlip(o) {
    const win = window.open('', '_blank', 'width=520,height=680');
    if (!win) return;
    const rows = (o.items || [])
      .map(
        (it) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${escapeHtml(it.name)} (${escapeHtml(it.color)} / ${escapeHtml(it.size)})</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee;">x${it.qty}</td></tr>`
      )
      .join('');
    win.document.write(`
      <html><head><title>Phiếu Gói Hàng #${escapeHtml(o.orderCode)}</title></head>
      <body style="font-family:sans-serif; padding:24px; color:#2b151e;">
        <h2 style="margin:0 0 4px;">NA 2HAND BOUTIQUE — PHIẾU GÓI HÀNG</h2>
        <p style="margin:0 0 14px; font-size:13px; color:#666;">Mã đơn: <strong>#${escapeHtml(o.orderCode)}</strong> • ${new Date(o.createdAt).toLocaleString('vi-VN')}</p>
        <div style="border:1px solid #ccc; border-radius:10px; padding:12px; margin-bottom:14px; font-size:14px; line-height:1.6;">
          <div>Người nhận: <strong>${escapeHtml(o.customerName)}</strong> — SĐT: <strong>${escapeHtml(o.customerPhone)}</strong></div>
          <div>Địa chỉ: ${escapeHtml(o.address)}, ${escapeHtml(o.district || '')}, ${escapeHtml(o.province || '')}</div>
          <div>Hương giấy lụa: <strong>${escapeHtml(o.scentChoice || 'Hương Đào Trắng')}</strong></div>
          ${o.giftWrap ? `<div>Quà tặng: <strong>Gói hộp nơ</strong> — Thiệp: "${escapeHtml(o.giftCardMessage || '')}"</div>` : ''}
          ${o.note ? `<div>Ghi chú khách: "${escapeHtml(o.note)}"</div>` : ''}
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:14px;">${rows}</table>
        <div style="text-align:right; font-size:16px;">
          Thu hộ / Tổng đơn: <strong>${o.paymentMethod === 'cod' && o.paymentStatus !== 'paid' ? formatVnd(o.totalAmount) : '0đ (Đã TT QR)'}</strong>
        </div>
        <script>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  }

  function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody || !shopData) return;
    let orders = [...(shopData.orders || [])];

    if (orderStatusFilter !== 'all') {
      orders = orders.filter((o) => o.orderStatus === orderStatusFilter);
    }
    if (orderSearch) {
      orders = orders.filter(
        (o) =>
          String(o.orderCode || '').toLowerCase().includes(orderSearch) ||
          String(o.customerName || '').toLowerCase().includes(orderSearch) ||
          String(o.customerPhone || '').toLowerCase().includes(orderSearch)
      );
    }

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:32px; color:var(--muted);">
            Chưa có đơn đặt hàng nào khớp bộ lọc. Hãy thử đặt 1 đơn mẫu trên trang <a href="/shop" target="_blank" style="color:var(--pri); font-weight:700;">/shop</a> nhé!
          </td>
        </tr>
      `;
      renderAdminPager('orders-pagination', 1, 0, () => {});
      return;
    }

    const totalOrdersCount = orders.length;
    const maxOrdPage = Math.max(1, Math.ceil(totalOrdersCount / SHOP_PAGE_SIZE));
    if (ordersPage > maxOrdPage) ordersPage = maxOrdPage;
    const pagedOrders = orders.slice((ordersPage - 1) * SHOP_PAGE_SIZE, ordersPage * SHOP_PAGE_SIZE);
    renderAdminPager('orders-pagination', ordersPage, totalOrdersCount, (nextP) => {
      ordersPage = nextP;
      renderOrders();
    });

    tbody.innerHTML = pagedOrders
      .map((o) => {
        const dt = o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '';
        const itemsHtml = (o.items || [])
          .map(
            (it) => `
            <div style="display:flex; align-items:center; gap:7px; margin-bottom:5px;">
              <img src="${escapeHtml(it.image || '/media/bio-link/girlfriend-1.jpg')}" style="width:34px; height:34px; border-radius:8px; object-fit:cover; border:1px solid #f2d6e3;" />
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
            ? `<span class="badge" style="background:#fce7f3; color:#be185d;">Quét mã QR</span>`
            : `<span class="badge" style="background:#fef3c7; color:#92400e;">COD nhận hàng</span>`;

        return `
          <tr>
            <td>
              <div style="font-weight:800; color:var(--pri); font-size:0.88rem;">#${escapeHtml(o.orderCode)}</div>
              <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">${escapeHtml(dt)}</div>
              ${o.transferNote && o.paymentMethod === 'qr' ? `<div style="font-size:0.7rem; margin-top:4px; background:#fff5f9; padding:2px 6px; border-radius:6px; display:inline-block;">ND: <code>${escapeHtml(o.transferNote)}</code></div>` : ''}
              <div style="margin-top:6px;">
                <button type="button" class="btn btn-sm btn-print-slip" data-id="${escapeHtml(o.id)}">In Phiếu Gói</button>
              </div>
            </td>
            <td>
              <div style="font-weight:700;">${escapeHtml(o.customerName)}</div>
              <div style="font-size:0.78rem; color:#0f766e; font-weight:700;">${escapeHtml(o.customerPhone)}</div>
              <div style="font-size:0.74rem; color:var(--muted); max-width:250px;">${escapeHtml(o.address)}${o.district ? `, ${escapeHtml(o.district)}` : ''}${o.province ? `, ${escapeHtml(o.province)}` : ''}</div>
              ${o.scentChoice ? `<div style="font-size:0.72rem; color:#9d174d; margin-top:3px;">Hương gói: <strong>${escapeHtml(o.scentChoice)}</strong></div>` : ''}
              ${o.giftWrap ? `<div style="font-size:0.72rem; color:#7e22ce; margin-top:2px;">Gói quà nơ • Thiệp: "${escapeHtml(o.giftCardMessage || '')}"</div>` : ''}
              ${o.note ? `<div style="font-size:0.72rem; color:#be185d; margin-top:2px;">Ghi chú: "${escapeHtml(o.note)}"</div>` : ''}
            </td>
            <td>${itemsHtml}</td>
            <td>
              <div style="font-weight:800; font-size:0.95rem; color:#be123c; margin-bottom:4px;">${formatVnd(o.totalAmount)}</div>
              ${payBadge}
              ${o.receiptImageUrl ? `<div style="margin-top:4px;"><a href="${escapeHtml(o.receiptImageUrl)}" target="_blank" style="font-size:0.72rem; font-weight:700; color:#15803d;">Xem ảnh biên lai CK &rarr;</a></div>` : ''}
              <div style="margin-top:6px;">
                <select class="select order-pay-select" data-id="${escapeHtml(o.id)}" style="margin-bottom:0; padding:5px 8px; font-size:0.74rem;">
                  <option value="pending" ${o.paymentStatus === 'pending' ? 'selected' : ''}>Chờ thanh toán</option>
                  <option value="customer_confirmed_qr" ${o.paymentStatus === 'customer_confirmed_qr' ? 'selected' : ''}>Khách báo đã quét QR</option>
                  <option value="paid" ${o.paymentStatus === 'paid' ? 'selected' : ''}>Đã nhận đủ tiền</option>
                </select>
              </div>
            </td>
            <td>
              <select class="select order-status-select" data-id="${escapeHtml(o.id)}" style="margin-bottom:0; padding:6px 9px; font-size:0.76rem; font-weight:700;">
                <option value="pending" ${o.orderStatus === 'pending' ? 'selected' : ''}>Đơn mới chờ xác nhận</option>
                <option value="confirmed" ${o.orderStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận đơn</option>
                <option value="packing" ${o.orderStatus === 'packing' ? 'selected' : ''}>Đang ướp hương &amp; gói</option>
                <option value="shipping" ${o.orderStatus === 'shipping' ? 'selected' : ''}>Đang giao cho khách</option>
                <option value="completed" ${o.orderStatus === 'completed' ? 'selected' : ''}>Giao thành công</option>
                <option value="cancelled" ${o.orderStatus === 'cancelled' ? 'selected' : ''}>Đã hủy đơn</option>
              </select>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.btn-print-slip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ord = (shopData.orders || []).find((x) => x.id === btn.dataset.id);
        if (ord) printPackingSlip(ord);
      });
    });

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
    const maxProdPage = Math.max(1, Math.ceil(prods.length / SHOP_PAGE_SIZE));
    if (productsPage > maxProdPage) productsPage = maxProdPage;
    const pagedProds = prods.slice((productsPage - 1) * SHOP_PAGE_SIZE, productsPage * SHOP_PAGE_SIZE);
    renderAdminPager('products-pagination', productsPage, prods.length, (nextP) => {
      productsPage = nextP;
      renderProductsTable();
    });

    tbody.innerHTML = pagedProds
      .map((p) => {
        const img = (p.images && p.images[0]) || '/media/bio-link/girlfriend-1.jpg';
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
                <button type="button" class="btn btn-sm btn-edit-prod" data-id="${escapeHtml(p.id)}">Sửa</button>
                <button type="button" class="btn btn-sm btn-dup-prod" data-id="${escapeHtml(p.id)}">Nhân bản</button>
                <button type="button" class="btn btn-sm btn-danger btn-del-prod" data-id="${escapeHtml(p.id)}">Xóa</button>
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

    tbody.querySelectorAll('.btn-dup-prod').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`/api/shop/admin/products/${btn.dataset.id}/duplicate`, { method: 'POST' });
          showToast('Đã nhân bản sản phẩm!');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
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

  // --- 3. SINGLE ZERO-INSTALL AUTO SYNC FROM SHOPEE & TIKTOK SHOP ---
  function setupSyncTools() {
    if (!shopData) return;
    const urlInput = document.getElementById('sync-target-url');
    if (urlInput && !urlInput.value.trim() && shopData.settings?.shopeeShopUrl) {
      urlInput.value = shopData.settings.shopeeShopUrl;
    }
  }

  function renderSyncedPreviewHtml(res) {
    const items = Array.isArray(res.products) ? res.products.slice(0, 8) : [];
    const cardsHtml = items
      .map((p) => {
        const img = (p.images && p.images[0]) || '/media/bio-link/girlfriend-1.jpg';
        return `
          <div style="display:flex; align-items:center; gap:9px; padding:8px 10px; border:1px solid var(--border); border-radius:12px; background:#fff9fb; min-width:0;">
            <img src="${escapeHtml(img)}" style="width:42px; height:42px; border-radius:9px; object-fit:cover; flex-shrink:0; border:1px solid var(--border);" />
            <div style="min-width:0; flex:1;">
              <div style="font-weight:700; font-size:0.78rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
              <div style="font-weight:800; font-size:0.76rem; color:var(--pri);">${formatVnd(p.price)}</div>
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div style="color:#15803d; font-weight:800; font-size:0.92rem; margin-bottom:6px;">
        ${escapeHtml(res.message || 'Đã đồng bộ sản phẩm thành công!')}
      </div>
      ${
        cardsHtml
          ? `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:8px; margin:10px 0;">${cardsHtml}</div>`
          : ''
      }
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:8px;">
        <span style="font-size:0.78rem; color:var(--muted);">Đã lưu trực tiếp vào MongoDB Atlas (<code>na2hand_shop</code>).</span>
        <button type="button" class="btn btn-sm btn-primary" id="btn-jump-to-products">👗 Mở Danh Sách Sản Phẩm Vừa Kéo</button>
      </div>
    `;
  }

  function bindJumpToProductsBtn(container) {
    container?.querySelector('#btn-jump-to-products')?.addEventListener('click', () => {
      const prodTabBtn = document.querySelector('.tab-btn[data-tab="pane-products"]');
      if (prodTabBtn) prodTabBtn.click();
    });
  }

  async function importCopiedShopContent(targetUrl, pastedHtml, pastedText, logBox) {
    logBox.innerHTML = '⏳ Đang tự động bóc tách ảnh HD, tên &amp; giá của toàn bộ sản phẩm...';
    try {
      const res = await apiFetch('/api/shop/auto-sync', {
        method: 'POST',
        body: JSON.stringify({ targetUrl, pastedHtml, pastedText })
      });
      logBox.innerHTML = renderSyncedPreviewHtml(res);
      bindJumpToProductsBtn(logBox);
      showToast(`Đã kéo về ${res.addedCount || 0} sản phẩm mới! 🎉`);
      await loadOverview();
    } catch (err) {
      logBox.innerHTML = `<div style="color:#be123c; font-weight:700;">⚠️ ${escapeHtml(err.message)}</div>`;
      showToast(err.message, true);
    }
  }

  document.getElementById('btn-quick-shopee')?.addEventListener('click', () => {
    const url = shopData?.settings?.shopeeShopUrl || 'https://s.shopee.vn/8VAfrswNOG';
    const el = document.getElementById('sync-target-url');
    if (el) {
      el.value = url;
      el.focus();
    }
  });

  document.getElementById('btn-quick-tiktok')?.addEventListener('click', () => {
    const url = shopData?.settings?.tiktokShopUrl || 'https://www.tiktok.com/@na2hand3';
    const el = document.getElementById('sync-target-url');
    if (el) {
      el.value = url;
      el.focus();
    }
  });

  document.getElementById('auto-sync-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('sync-target-url');
    const submitBtn = document.getElementById('btn-auto-sync-now');
    const logBox = document.getElementById('sync-live-log');
    const targetUrl = urlInput?.value.trim() || '';

    if (!targetUrl) {
      showToast('Hãy dán đường dẫn Shop Shopee hoặc TikTok Shop vào ô trước nhé!', true);
      return;
    }

    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Đang tự động kéo sản phẩm...';
    }
    logBox.style.display = 'block';
    logBox.innerHTML = `⏳ Đang kết nối tới <code>${escapeHtml(targetUrl)}</code> và tự động quét danh sách sản phẩm...`;

    try {
      const res = await apiFetch('/api/shop/auto-sync', {
        method: 'POST',
        body: JSON.stringify({ targetUrl })
      });

      if (!res.needsBrowserClipboard) {
        if (res.resolvedUrl && urlInput) urlInput.value = res.resolvedUrl;
        logBox.innerHTML = renderSyncedPreviewHtml(res);
        bindJumpToProductsBtn(logBox);
        showToast('Tự động kéo sản phẩm thành công! 🎉');
        await loadOverview();
        return;
      }

      // Optional silent check if local browser helper happens to be running (no setup prompt if absent)
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 1100);
        const localRes = await fetch(`${PLAYWRIGHT_AGENT_URL}/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            targetUrl: res.resolvedUrl || targetUrl,
            serverUrl: window.location.origin,
            syncKey: shopData?.settings?.syncApiKey || ''
          })
        });
        clearTimeout(t);
        if (localRes.ok) {
          const localJson = await localRes.json();
          if (localJson.success) {
            logBox.innerHTML = renderSyncedPreviewHtml(localJson);
            bindJumpToProductsBtn(logBox);
            showToast('Tự động kéo sản phẩm thành công! 🎉');
            await loadOverview();
            return;
          }
        }
      } catch {}

      const finalShopUrl = res.resolvedUrl || targetUrl;
      if (urlInput && res.resolvedUrl) urlInput.value = res.resolvedUrl;

      logBox.innerHTML = `
        <div style="margin-bottom:10px;">
          <strong style="color:#9d174d;">✨ Đã nhận diện đúng địa chỉ Shop:</strong>
          <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" style="color:var(--pri); font-weight:800; word-break:break-all;">${escapeHtml(finalShopUrl)} ↗</a>
        </div>
        <div style="font-size:0.81rem; color:var(--text); margin-bottom:12px; background:#fff9fb; padding:10px 12px; border-radius:12px; border:1px dashed #f0abc6;">
          Sàn đang ẩn danh sách sản phẩm với máy chủ đám mây (yêu cầu tab trình duyệt của bạn). Không cần cài bất kỳ phần mềm nào — bạn chỉ cần:
          <strong>1)</strong> Bấm mở trang Shop bên dưới &rarr; nhấn <strong>Ctrl + A</strong> rồi <strong>Ctrl + C</strong> trên trang Shop &rarr;
          <strong>2)</strong> Quay lại đây bấm <strong>Hút Ngay Từ Bộ Nhớ Tạm</strong> (hoặc nhấn <strong>Ctrl + V</strong> vào ô dưới) là toàn bộ ảnh gốc, tên &amp; giá tự động bay hết vào cửa hàng!
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
          <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" class="btn btn-sm">
            🔗 1. Mở Trang Shop Trong Tab Mới
          </a>
          <button type="button" class="btn btn-sm btn-primary" id="btn-read-clipboard-sync">
            📋 2. Hút Ngay Toàn Bộ Sản Phẩm Vừa Copy (1 Chạm)
          </button>
        </div>
        <div
          id="paste-drop-zone"
          contenteditable="true"
          style="min-height:46px; max-height:90px; overflow:hidden; padding:10px 12px; border-radius:12px; border:1.5px dashed #e5b8cc; background:#fdf7fa; color:var(--muted); font-size:0.79rem; outline:none;"
        >Hoặc click vào ô này rồi nhấn <strong>Ctrl + V</strong> để tự động kéo sản phẩm ngay lập tức...</div>
      `;

      logBox.querySelector('#btn-read-clipboard-sync')?.addEventListener('click', async () => {
        try {
          let htmlStr = '';
          let textStr = '';
          if (navigator.clipboard && navigator.clipboard.read) {
            const clipItems = await navigator.clipboard.read();
            for (const item of clipItems) {
              if (item.types.includes('text/html')) {
                const blob = await item.getType('text/html');
                htmlStr += await blob.text();
              }
              if (item.types.includes('text/plain')) {
                const blob = await item.getType('text/plain');
                textStr += await blob.text();
              }
            }
          } else if (navigator.clipboard && navigator.clipboard.readText) {
            textStr = await navigator.clipboard.readText();
          }
          if (!htmlStr && !textStr) {
            showToast('Bộ nhớ tạm đang trống — hãy nhấn Ctrl+A rồi Ctrl+C ở trang Shop trước nhé!', true);
            return;
          }
          await importCopiedShopContent(finalShopUrl, htmlStr, textStr, logBox);
        } catch {
          const zone = logBox.querySelector('#paste-drop-zone');
          if (zone) zone.focus();
          showToast('Hãy nhấn Ctrl + V trực tiếp vào ô nét đứt bên dưới nhé!');
        }
      });

      const pasteZone = logBox.querySelector('#paste-drop-zone');
      pasteZone?.addEventListener('paste', async (ev) => {
        ev.preventDefault();
        const htmlStr = ev.clipboardData?.getData('text/html') || '';
        const textStr = ev.clipboardData?.getData('text/plain') || '';
        await importCopiedShopContent(finalShopUrl, htmlStr, textStr, logBox);
      });
    } catch (err) {
      logBox.innerHTML = `<div style="color:#be123c; font-weight:700;">⚠️ ${escapeHtml(err.message)}</div>`;
      showToast(err.message, true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
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

    const revList = document.getElementById('reviews-admin-list');
    if (revList) {
      const revs = shopData.reviews || [];
      revList.innerHTML =
        revs.length === 0
          ? `<p style="font-size:0.8rem; color:var(--muted);">Chưa có đánh giá nào.</p>`
          : revs
              .map(
                (r) => `
              <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px; border-bottom:1px solid #f7e6ee;">
                <div style="display:flex; gap:10px; align-items:center;">
                  ${r.photoUrl ? `<img src="${escapeHtml(r.photoUrl)}" style="width:44px; height:50px; object-fit:cover; border-radius:8px;" />` : ''}
                  <div>
                    <div style="font-weight:700; font-size:0.82rem;">${escapeHtml(r.authorName)} • ${'★'.repeat(Number(r.rating || 5))}</div>
                    <div style="font-size:0.78rem;">${escapeHtml(r.comment)}</div>
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-danger btn-del-rev" data-id="${escapeHtml(r.id)}">Xóa</button>
              </div>
            `
              )
              .join('');

      revList.querySelectorAll('.btn-del-rev').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await apiFetch(`/api/shop/admin/reviews/${btn.dataset.id}`, { method: 'DELETE' });
            showToast('Đã xóa đánh giá');
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
    document.getElementById('st-qr-url').value = s.qrImageUrl || '/media/bio-link/cute-qr-placeholder.svg';
    document.getElementById('st-qr-preview').src = s.qrImageUrl || '/media/bio-link/cute-qr-placeholder.svg';
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
      qrImageUrl: document.getElementById('st-qr-url').value.trim() || '/media/bio-link/cute-qr-placeholder.svg',
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

  document.getElementById('btn-change-shared-pass')?.addEventListener('click', async () => {
    const newUsername = document.getElementById('adm-shared-user').value.trim() || 'admin';
    const currentPassword = document.getElementById('adm-cur-pass').value;
    const newPassword = document.getElementById('adm-new-pass').value;
    if (!currentPassword || !newPassword) {
      return showToast('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!', true);
    }
    try {
      const res = await apiFetch('/api/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newUsername, newPassword })
      });
      if (res.token) {
        authToken = res.token;
        localStorage.setItem(TOKEN_KEY, authToken);
      }
      document.getElementById('adm-cur-pass').value = '';
      document.getElementById('adm-new-pass').value = '';
      showToast(res.message || 'Đã đổi mật khẩu đồng bộ thành công!');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Boot
  loadOverview();
})();
