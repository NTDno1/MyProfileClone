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
      loadSyncAudit();
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

  let editingVariants = [];

  function renderVariantEditorRows() {
    const box = document.getElementById('pf-variants-list');
    if (!box) return;
    if (editingVariants.length === 0) {
      box.innerHTML = `<div style="font-size:0.76rem; color:var(--muted); padding:4px 2px;">Chưa có phân hệ con riêng (sẽ dùng danh sách Màu sắc / Kích cỡ mặc định).</div>`;
      return;
    }
    box.innerHTML = editingVariants
      .map(
        (v, idx) => `
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; background:#fff; padding:6px 8px; border-radius:10px; border:1px solid var(--border);">
          ${v.image ? `<img src="${escapeHtml(v.image)}" style="width:30px; height:30px; border-radius:6px; object-fit:cover; border:1px solid var(--border);" />` : ''}
          <input type="text" class="input var-inp-label" data-idx="${idx}" value="${escapeHtml(v.label || '')}" placeholder="Tên mẫu (VD: LS1)" style="width:110px; margin-bottom:0; padding:5px 8px; font-size:0.78rem;" />
          <input type="text" class="input var-inp-img" data-idx="${idx}" value="${escapeHtml(v.image || '')}" placeholder="URL ảnh riêng của mẫu..." style="flex:1 1 160px; margin-bottom:0; padding:5px 8px; font-size:0.76rem;" />
          <input type="number" class="input var-inp-price" data-idx="${idx}" value="${Number(v.price || 0)}" placeholder="Giá" style="width:92px; margin-bottom:0; padding:5px 8px; font-size:0.78rem;" title="Giá riêng của phân hệ" />
          <input type="number" class="input var-inp-stock" data-idx="${idx}" value="${Number(v.stock ?? 1)}" placeholder="Kho" style="width:68px; margin-bottom:0; padding:5px 8px; font-size:0.78rem;" title="Tồn kho (0 = Hết hàng)" />
          <button type="button" class="btn btn-sm btn-danger var-btn-del" data-idx="${idx}">✕</button>
        </div>
      `
      )
      .join('');

    box.querySelectorAll('.var-inp-label').forEach((el) => {
      el.addEventListener('input', () => {
        editingVariants[Number(el.dataset.idx)].label = el.value;
      });
    });
    box.querySelectorAll('.var-inp-img').forEach((el) => {
      el.addEventListener('input', () => {
        editingVariants[Number(el.dataset.idx)].image = el.value.trim();
      });
    });
    box.querySelectorAll('.var-inp-price').forEach((el) => {
      el.addEventListener('input', () => {
        editingVariants[Number(el.dataset.idx)].price = Number(el.value || 0);
      });
    });
    box.querySelectorAll('.var-inp-stock').forEach((el) => {
      el.addEventListener('input', () => {
        editingVariants[Number(el.dataset.idx)].stock = Math.max(0, Number(el.value || 0));
      });
    });
    box.querySelectorAll('.var-btn-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingVariants.splice(Number(btn.dataset.idx), 1);
        renderVariantEditorRows();
      });
    });
  }

  document.getElementById('btn-add-variant-row')?.addEventListener('click', () => {
    const basePrice = Number(document.getElementById('pf-price')?.value || 110000);
    editingVariants.push({
      id: `var_${Date.now()}`,
      label: `LS${editingVariants.length + 1}`,
      image: '',
      price: basePrice,
      stock: 1
    });
    renderVariantEditorRows();
  });

  function resetProductForm() {
    document.getElementById('pf-id').value = '';
    document.getElementById('pf-name').value = '';
    document.getElementById('pf-price').value = '';
    document.getElementById('pf-orig-price').value = '';
    document.getElementById('pf-sizes').value = '';
    document.getElementById('pf-colors').value = '';
    document.getElementById('pf-stock').value = '15';
    const tagSel = document.getElementById('pf-tag');
    if (tagSel) tagSel.value = 'manual';
    document.getElementById('pf-source-url').value = '';
    document.getElementById('pf-images').value = '';
    document.getElementById('pf-desc').value = '';
    const vg = document.getElementById('pf-var-group');
    if (vg) vg.value = 'Mẫu';
    editingVariants = [];
    renderVariantEditorRows();
    document.getElementById('pf-flash').checked = false;
    document.getElementById('pf-enabled').checked = true;
    const lockChk = document.getElementById('pf-locked');
    if (lockChk) lockChk.checked = false;
    document.getElementById('prod-form-heading').textContent = '➕ Thêm Sản Phẩm Mới (Mặc định: 1. Hàng tự đăng)';
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
    const chosenTag = document.getElementById('pf-tag')?.value || 'manual';
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
      variantGroupName: document.getElementById('pf-var-group')?.value.trim() || 'Mẫu',
      variants: editingVariants.filter((v) => String(v.label || '').trim()),
      productTag: chosenTag,
      sourceUrl,
      sourcePlatform: chosenTag,
      images: document
        .getElementById('pf-images')
        .value.split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      description: document.getElementById('pf-desc').value.trim(),
      isFlashSale: document.getElementById('pf-flash').checked,
      enabled: document.getElementById('pf-enabled').checked,
      isLocked: Boolean(document.getElementById('pf-locked')?.checked)
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

  let activeProductTagFilter = 'all';

  function getProdTag(p) {
    if (!p) return 'manual';
    if (p.productTag) return String(p.productTag).toLowerCase();
    if (p.originType === 'local' || /^prod-\d+$/.test(String(p.id || ''))) return 'manual';
    const plat = String(p.sourcePlatform || '').toLowerCase();
    if (plat === 'shopee' || plat === 'tiktok' || plat === 'lazada' || plat === 'other') return plat;
    const url = String(p.sourceUrl || '').toLowerCase();
    if (/-i\.\d+\.\d+|\/product\/\d+\/\d+/.test(url)) return 'shopee';
    if (/\/view\/product\//.test(url)) return 'tiktok';
    return 'manual';
  }

  function renderTagBadgeHtml(tag) {
    if (tag === 'shopee') {
      return `<span class="badge" style="background:#ffedd5; color:#c2410c;">🧡 2. Hàng Shopee (Đồng bộ 1-1)</span>`;
    }
    if (tag === 'tiktok') {
      return `<span class="badge" style="background:#f3e8ff; color:#6b21a8;">🎵 3. Hàng TikTok (Đồng bộ 1-1)</span>`;
    }
    if (tag === 'lazada') {
      return `<span class="badge" style="background:#dbeafe; color:#1d4ed8;">💙 4. Hàng Lazada</span>`;
    }
    if (tag === 'other') {
      return `<span class="badge" style="background:#f1f5f9; color:#334155;">🏷️ 5. Nguồn khác</span>`;
    }
    return `<span class="badge" style="background:#fce7f3; color:#be185d;">🎀 1. Hàng tự đăng</span>`;
  }

  function renderProductTagFilterBar(allProds) {
    const bar = document.getElementById('prod-tag-filter-bar');
    if (!bar) return;
    const counts = { all: allProds.length, manual: 0, shopee: 0, tiktok: 0, lazada: 0, other: 0 };
    allProds.forEach((p) => {
      const t = getProdTag(p);
      if (counts[t] !== undefined) counts[t]++;
      else counts.other++;
    });

    const items = [
      { key: 'all', label: `Tất cả (${counts.all})` },
      { key: 'manual', label: `🎀 1. Hàng tự đăng (${counts.manual})` },
      { key: 'shopee', label: `🧡 2. Hàng Shopee (${counts.shopee})` },
      { key: 'tiktok', label: `🎵 3. Hàng TikTok (${counts.tiktok})` },
      { key: 'lazada', label: `💙 4. Hàng Lazada (${counts.lazada})` },
      { key: 'other', label: `🏷️ 5. Nguồn khác (${counts.other})` }
    ];

    bar.innerHTML = items
      .map(
        (it) =>
          `<button type="button" class="btn btn-sm ${activeProductTagFilter === it.key ? 'btn-primary' : ''}" data-tagf="${it.key}">${it.label}</button>`
      )
      .join('');

    bar.querySelectorAll('button[data-tagf]').forEach((b) => {
      b.addEventListener('click', () => {
        activeProductTagFilter = b.getAttribute('data-tagf') || 'all';
        productsPage = 1;
        renderProductsTable();
      });
    });
  }

  document.getElementById('btn-lock-all-local')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/shop/admin/products/lock-local', {
        method: 'POST',
        body: JSON.stringify({ locked: true })
      });
      showToast(res.message || 'Đã khóa toàn bộ Hàng tự đăng! 🔒');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('btn-unlock-all-local')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/shop/admin/products/lock-local', {
        method: 'POST',
        body: JSON.stringify({ locked: false })
      });
      showToast(res.message || 'Đã mở khóa Hàng tự đăng! 🔓');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody || !shopData) return;
    const allProds = shopData.products || [];
    renderProductTagFilterBar(allProds);

    const prods =
      activeProductTagFilter === 'all'
        ? allProds
        : allProds.filter((p) => {
            const t = getProdTag(p);
            if (activeProductTagFilter === 'other') {
              return !['manual', 'shopee', 'tiktok', 'lazada'].includes(t);
            }
            return t === activeProductTagFilter;
          });

    const maxProdPage = Math.max(1, Math.ceil(prods.length / SHOP_PAGE_SIZE));
    if (productsPage > maxProdPage) productsPage = maxProdPage;
    const pagedProds = prods.slice((productsPage - 1) * SHOP_PAGE_SIZE, productsPage * SHOP_PAGE_SIZE);
    renderAdminPager('products-pagination', productsPage, prods.length, (nextP) => {
      productsPage = nextP;
      renderProductsTable();
    });

    if (pagedProds.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:26px; color:var(--muted);">Chưa có sản phẩm nào thuộc nhóm Tag này.</td></tr>`;
      return;
    }

    tbody.innerHTML = pagedProds
      .map((p) => {
        const img = (p.images && p.images[0]) || '/media/bio-link/girlfriend-1.jpg';
        const tag = getProdTag(p);
        const cloned = tag !== 'manual';
        const locked = Boolean(p.isLocked);
        const srcBadge = renderTagBadgeHtml(tag);

        const sizesInfo =
          Array.isArray(p.sizes) && p.sizes.length > 0
            ? ` • Size: ${escapeHtml(p.sizes.join(', '))}`
            : ` • <span style="color:#64748b;">Không phân size</span>`;

        const maxP = Number(p.maxPrice || 0);
        const priceHtml =
          maxP > Number(p.price || 0)
            ? `${formatVnd(p.price)} – ${formatVnd(maxP)}`
            : formatVnd(p.price);

        const hasRealImg = /^https?:\/\//i.test(String(img || ''));
        const missingImgWarn =
          tag === 'shopee' && !hasRealImg
            ? `<div style="font-size:0.7rem; color:#be123c; font-weight:700; margin-top:2px;">⚠️ Dữ liệu từ dấu trang cũ thiếu ảnh gốc — hãy xóa dấu trang cũ &amp; chạy bản V3 (Tự quét lại)!</div>`
            : '';

        return `
          <tr style="${locked ? 'background:#fff5f7; opacity:0.86;' : ''}">
            <td>
              <img src="${escapeHtml(img)}" style="width:48px; height:48px; border-radius:11px; object-fit:cover; border:1px solid var(--border);" />
            </td>
            <td>
              <div style="font-weight:700; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span>${escapeHtml(p.name)}</span>
                ${locked ? `<span class="badge" style="background:#ffe4e6; color:#be123c; border:1px solid #fda4af;">🔒 Đã khóa (Ẩn trên web)</span>` : ''}
              </div>
              <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">
                ${p.isFlashSale ? '⚡ DEAL XINH • ' : ''}
                ${locked ? '🔒 Đang khóa bảo vệ' : p.enabled === false ? '🙈 Đang ẩn' : '👁️ Đang hiện'}
                ${sizesInfo}
                ${
                  Array.isArray(p.variants) && p.variants.length > 0
                    ? ` • <span style="color:#15803d; font-weight:700;">🧩 ${p.variants.length} phân hệ (${p.variants.filter((v) => Number(v.stock ?? 0) > 0).length} mẫu còn • tổng kho ${p.stock ?? 0})</span>`
                    : cloned && p.deepSynced && hasRealImg
                    ? ` • <span style="color:#0f766e; font-weight:700;">✅ 1 mẫu đơn (Kho: ${p.stock ?? 0})</span>`
                    : cloned
                    ? ` • <span style="color:#b45309; font-weight:700;">⚠️ Chưa quét đủ tồn kho &amp; phân hệ</span>`
                    : ''
                }
              </div>
              ${missingImgWarn}
            </td>
            <td>
              <div style="font-weight:800; color:var(--pri);">${priceHtml}</div>
              ${p.originalPrice > Math.max(p.price, maxP) ? `<div style="font-size:0.72rem; text-decoration:line-through; color:var(--muted);">${formatVnd(p.originalPrice)}</div>` : ''}
            </td>
            <td>
              <div>Kho: <strong>${p.stock ?? 0}</strong></div>
              <div style="font-size:0.72rem; color:var(--muted);">Đã bán: ${p.sold ?? 0}</div>
            </td>
            <td>
              <div style="margin-bottom:4px;">${srcBadge}</div>
              <select class="select prod-quick-tag-sel" data-id="${escapeHtml(p.id)}" style="margin-bottom:3px; padding:4px 7px; font-size:0.72rem; width:auto; max-width:175px;">
                <option value="manual" ${tag === 'manual' ? 'selected' : ''}>🎀 1. Hàng tự đăng</option>
                <option value="shopee" ${tag === 'shopee' ? 'selected' : ''}>🧡 2. Hàng Shopee</option>
                <option value="tiktok" ${tag === 'tiktok' ? 'selected' : ''}>🎵 3. Hàng TikTok</option>
                <option value="lazada" ${tag === 'lazada' ? 'selected' : ''}>💙 4. Hàng Lazada</option>
                <option value="other" ${tag === 'other' ? 'selected' : ''}>🏷️ 5. Nguồn khác</option>
              </select>
              ${p.sourceUrl ? `<div><a href="${escapeHtml(p.sourceUrl)}" target="_blank" style="font-size:0.7rem; color:var(--pri);">Mở đúng link SP ↗</a></div>` : ''}
            </td>
            <td>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-toggle-lock" data-id="${escapeHtml(p.id)}" data-locked="${locked ? '1' : '0'}" style="${locked ? 'background:#ecfdf5;color:#047857;border-color:#a7f3d0;' : 'background:#fff1f2;color:#be123c;border-color:#fda4af;'}">
                  ${locked ? '🔓 Mở khóa' : '🔒 Khóa'}
                </button>
                <button type="button" class="btn btn-sm btn-edit-prod" data-id="${escapeHtml(p.id)}" ${locked ? 'disabled style="opacity:0.45;cursor:not-allowed;" title="Mở khóa trước khi sửa"' : ''}>Sửa</button>
                <button type="button" class="btn btn-sm btn-dup-prod" data-id="${escapeHtml(p.id)}">Nhân bản</button>
                <button type="button" class="btn btn-sm btn-danger btn-del-prod" data-id="${escapeHtml(p.id)}" ${locked ? 'disabled style="opacity:0.45;cursor:not-allowed;" title="Mở khóa trước khi xóa"' : ''}>Xóa</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.prod-quick-tag-sel').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          const res = await apiFetch(`/api/shop/admin/products/${sel.dataset.id}/tag`, {
            method: 'POST',
            body: JSON.stringify({ productTag: sel.value })
          });
          showToast(res.message || 'Đã cập nhật Tag nguồn hàng! 🏷️');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    tbody.querySelectorAll('.btn-toggle-lock').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nextLocked = btn.dataset.locked !== '1';
        try {
          const res = await apiFetch(`/api/shop/admin/products/${btn.dataset.id}/toggle-lock`, {
            method: 'POST',
            body: JSON.stringify({ isLocked: nextLocked })
          });
          showToast(res.message || (nextLocked ? 'Đã khóa sản phẩm! 🔒' : 'Đã mở khóa sản phẩm! 🔓'));
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    tbody.querySelectorAll('.btn-edit-prod').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prod = (shopData.products || []).find((x) => x.id === btn.dataset.id);
        if (!prod) return;
        if (prod.isLocked) {
          showToast('Sản phẩm đang khóa bảo vệ — bấm Mở khóa trước khi chỉnh sửa nhé!', true);
          return;
        }
        document.getElementById('pf-id').value = prod.id;
        document.getElementById('pf-name').value = prod.name || '';
        document.getElementById('pf-category').value = prod.category || '';
        document.getElementById('pf-price').value = prod.price || 0;
        document.getElementById('pf-orig-price').value = prod.originalPrice || 0;
        document.getElementById('pf-sizes').value = (prod.sizes || []).join(', ');
        document.getElementById('pf-colors').value = (prod.colors || []).join(', ');
        document.getElementById('pf-stock').value = prod.stock ?? 10;
        const tagSel = document.getElementById('pf-tag');
        if (tagSel) tagSel.value = getProdTag(prod);
        document.getElementById('pf-source-url').value = prod.sourceUrl || '';
        document.getElementById('pf-images').value = (prod.images || []).join('\n');
        document.getElementById('pf-desc').value = prod.description || '';
        const vg = document.getElementById('pf-var-group');
        if (vg) vg.value = prod.variantGroupName || 'Mẫu';
        editingVariants = Array.isArray(prod.variants) ? JSON.parse(JSON.stringify(prod.variants)) : [];
        renderVariantEditorRows();
        document.getElementById('pf-flash').checked = !!prod.isFlashSale;
        document.getElementById('pf-enabled').checked = prod.enabled !== false;
        const lockChk = document.getElementById('pf-locked');
        if (lockChk) lockChk.checked = !!prod.isLocked;
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

  // --- 3. SINGLE ZERO-INSTALL AUTO SYNC + DEEP INNER VARIANT HARVESTER ---
  renderVariantEditorRows();

  /* Uses shared live runtime in /js/shopee-harvester-runtime.js + live server loader /api/shop/harvester.js */
  function buildDeepHarvesterScript(serverUrl, syncKey) {
    if (typeof window.NA2HAND_DEEP_HARVESTER === 'function') {
      return `(${window.NA2HAND_DEEP_HARVESTER.toString()})(${JSON.stringify(serverUrl)},${JSON.stringify(syncKey)});`;
    }
    const loaderUrl = `${serverUrl}/api/shop/harvester.js?syncKey=${encodeURIComponent(syncKey)}&t=` + Date.now();
    return `(function(){var s=document.createElement('script');s.src=${JSON.stringify(loaderUrl)};document.body.appendChild(s);})();`;
  }

  function buildLiveBookmarkletHref(serverUrl, syncKey) {
    const base = `${serverUrl}/api/shop/harvester.js?syncKey=${encodeURIComponent(syncKey)}&t=`;
    const safeSingleQuoted = "'" + base.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    return `javascript:(function(){var u=${safeSingleQuoted}+Date.now(),s=document.createElement('script');s.src=u;s.onerror=function(){fetch(u).then(function(r){return r.text();}).then(eval);};document.body.appendChild(s);})();`;
  }

  async function loadSyncAudit() {
    const box = document.getElementById('sync-audit-panel');
    if (!box) return;
    try {
      const res = await apiFetch('/api/shop/admin/sync-audit');
      const c = res.counts || {};
      const sh = res.shopeeHealth || {};
      const shopeeList = res.byTag?.shopee || [];

      const needResyncCount = shopeeList.filter((x) => !x.hasRealImg || !x.slugOk || !x.deepSynced).length;
      const syncKey = res.syncKey || shopData?.settings?.syncApiKey || '';
      const v3BookmarkletHref = buildLiveBookmarkletHref(window.location.origin, syncKey);

      box.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(165px, 1fr)); gap:10px; margin-bottom:14px;">
          <div style="background:#fff5f9; border:1px solid #f7c6da; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:var(--muted); font-weight:700;">🎀 1. Hàng tự đăng</div>
            <div style="font-size:1.25rem; font-weight:800; color:#be185d;">${c.manual || 0} SP</div>
            <div style="font-size:0.7rem; color:#15803d;">🛡️ Độc lập, không bị xóa khi kéo sàn</div>
          </div>
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:#9a3412; font-weight:700;">🧡 2. Hàng Shopee</div>
            <div style="font-size:1.25rem; font-weight:800; color:#c2410c;">${c.shopee || 0} SP</div>
            <div style="font-size:0.7rem; color:#9a3412;">✅ Chuẩn V5 (Đủ kho thật): ${sh.deepSyncedComplete || 0}/${c.shopee || 0} SP</div>
          </div>
          <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:#6b21a8; font-weight:700;">🎵 3. Hàng TikTok</div>
            <div style="font-size:1.25rem; font-weight:800; color:#7e22ce;">${c.tiktok || 0} SP</div>
            <div style="font-size:0.7rem; color:#6b21a8;">🔄 Chế độ đồng bộ 2 chiều 1-1</div>
          </div>
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:#1d4ed8; font-weight:700;">💙 4. Lazada / Khác</div>
            <div style="font-size:1.25rem; font-weight:800; color:#1e40af;">${(c.lazada || 0) + (c.other || 0)} SP</div>
            <div style="font-size:0.7rem; color:#1d4ed8;">🏷️ Phân loại mở rộng</div>
          </div>
        </div>

        <div style="padding:14px 16px; border-radius:14px; border:1.5px solid ${needResyncCount > 0 ? '#fda4af' : '#bbf7d0'}; background:${needResyncCount > 0 ? '#fff1f2' : '#f0fdf4'};">
          <div style="font-weight:800; color:${needResyncCount > 0 ? '#be123c' : '#15803d'}; margin-bottom:6px;">
            ${
              needResyncCount > 0
                ? `⚠️ Có ${needResyncCount}/${c.shopee || 0} SP Shopee cần bấm chạy lại 1 lượt Đồng Bộ 1-1 (V5) để cập nhật chính xác 100% số lượng tồn kho thật của từng phân hệ (thay vì kho ảo 10 của Shopee).`
                : `✅ Tuyệt vời! Toàn bộ ${c.shopee || 0}/${c.shopee || 0} sản phẩm Shopee trên Web đã đồng bộ chuẩn 1-1 cả ảnh gốc, phân hệ lẫn số lượng tồn kho thật!`
            }
          </div>
          <div style="font-size:0.78rem; color:var(--text); line-height:1.55; margin-bottom:10px;">
            🚨 <strong>Lưu ý cực quan trọng:</strong> Nếu trên thanh Dấu trang (Bookmarks Bar) trình duyệt của bạn vẫn đang để nút kéo từ lần trước, hãy <strong>chuột phải XÓA dấu trang cũ đó đi</strong> (vì dấu trang cũ lưu code tĩnh đời đầu chưa có tự quét lại; server hiện đã chặn dấu trang cũ để bảo vệ dữ liệu). Hãy kéo nút <strong>V3 (Tự Quét Lại)</strong> dưới đây lên thay thế — bản V3 sẽ tự kiểm tra từng SP, nếu SP nào mạng chậm thiếu ảnh hoặc thiếu phân hệ sẽ <strong>tự động xếp hàng quét lại tối đa 4 lượt cho đến khi đủ 100%</strong>!
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="https://shopee.vn/na2hand3" target="_blank" rel="noopener" class="btn btn-sm">🔗 Mở shopee.vn/na2hand3</a>
            <a id="audit-v3-bookmarklet" href="${escapeHtml(v3BookmarkletHref)}" class="btn btn-sm btn-primary" title="Kéo nút V3 này thả lên thanh Dấu Trang trình duyệt">
              🪄 Đồng Bộ 1-1 V3 — Tự Quét Lại (Kéo lên Dấu Trang)
            </a>
            <button type="button" class="btn btn-sm" id="audit-btn-copy-v3" style="border-color:#e14b85; color:#be185d;">
              ⚡ Copy Lệnh V3 Tự Quét Lại (Dán F12 Console)
            </button>
          </div>
        </div>
      `;

      box.querySelector('#audit-v3-bookmarklet')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        alert('Hãy XÓA dấu trang cũ trên thanh Bookmarks Bar, sau đó giữ chuột KÉO nút hồng "🪄 Đồng Bộ 1-1 V3 — Tự Quét Lại" này thả lên thanh Dấu trang trình duyệt nhé!');
      });

      box.querySelector('#audit-btn-copy-v3')?.addEventListener('click', async () => {
        try {
          const code = buildDeepHarvesterScript(window.location.origin, syncKey);
          await navigator.clipboard.writeText(code);
          startLiveSyncPolling();
          showToast('Đã copy Lệnh V3 (Tự quét lại khi lỗi)! Sang tab shopee.vn/na2hand3 nhấn F12 -> Console -> Ctrl+V -> Enter nhé! 🚀');
        } catch {
          showToast('Không thể copy tự động, hãy kéo nút Dấu trang V3 bên cạnh nhé!', true);
        }
      });
    } catch {
      box.textContent = 'Không thể tải báo cáo kiểm tra đối chiếu.';
    }
  }

  document.getElementById('btn-refresh-audit')?.addEventListener('click', loadSyncAudit);

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
        const vCnt = Array.isArray(p.variants) ? p.variants.length : 0;
        return `
          <div style="display:flex; align-items:center; gap:9px; padding:8px 10px; border:1px solid var(--border); border-radius:12px; background:#fff9fb; min-width:0;">
            <img src="${escapeHtml(img)}" style="width:42px; height:42px; border-radius:9px; object-fit:cover; flex-shrink:0; border:1px solid var(--border);" />
            <div style="min-width:0; flex:1;">
              <div style="font-weight:700; font-size:0.78rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
              <div style="font-weight:800; font-size:0.75rem; color:var(--pri);">
                ${formatVnd(p.price)} ${vCnt > 0 ? `<span style="color:#15803d;">• 🧩 ${vCnt} phân hệ</span>` : ''}
              </div>
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
    logBox.innerHTML = '⏳ Đang tự động bóc tách ảnh HD, tên, giá &amp; các phân hệ con...';
    try {
      const res = await apiFetch('/api/shop/auto-sync', {
        method: 'POST',
        body: JSON.stringify({ targetUrl, pastedHtml, pastedText })
      });
      logBox.innerHTML = renderSyncedPreviewHtml(res);
      bindJumpToProductsBtn(logBox);
      showToast(res.message || 'Đồng bộ thành công! 🎉');
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

  let syncPollTimer = null;
  function startLiveSyncPolling() {
    if (syncPollTimer) clearInterval(syncPollTimer);
    let ticks = 0;
    syncPollTimer = setInterval(async () => {
      ticks++;
      if (ticks > 85) {
        clearInterval(syncPollTimer);
        syncPollTimer = null;
        return;
      }
      try {
        await loadOverview();
      } catch {}
    }, 4500);
  }

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

      const finalShopUrl = res.resolvedUrl || targetUrl;
      if (urlInput && res.resolvedUrl) urlInput.value = res.resolvedUrl;
      const syncKey = res.syncKey || shopData?.settings?.syncApiKey || '';
      const harvesterCode = buildDeepHarvesterScript(window.location.origin, syncKey);
      const bookmarkletHref = buildLiveBookmarkletHref(window.location.origin, syncKey);

      logBox.innerHTML = `
        <div style="margin-bottom:10px;">
          <strong style="color:#9d174d;">✨ Đã nhận diện đúng địa chỉ:</strong>
          <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" style="color:var(--pri); font-weight:800; word-break:break-all;">${escapeHtml(finalShopUrl)} ↗</a>
        </div>

        <!-- DEEP VARIANT SYNC (Kéo cả sản phẩm ngoài + toàn bộ phân hệ con LS1..LS15 ở trong!) -->
        <div style="background:linear-gradient(135deg,#fff0f6,#fdf4ff); border:1.5px solid #f0abc6; border-radius:14px; padding:13px 15px; margin-bottom:12px;">
          <div style="font-weight:800; color:#be185d; font-size:0.88rem; margin-bottom:5px;">
            🧩 Cách Kéo Đầy Đủ Cả Sản Phẩm Lẫn Toàn Bộ Phân Hệ Ở Trong (Mẫu LS1..LS15, Ảnh Riêng &amp; Kho Từng Mẫu):
          </div>
          <div style="font-size:0.79rem; color:var(--text); margin-bottom:10px; line-height:1.55;">
            • <strong>Cách tự động quét hết cả Shop (Khuyên dùng):</strong> Kéo nút hồng <strong>🪄 Hút Sâu Cả Shop &amp; Phân Hệ</strong> bên dưới thả lên <strong>Thanh Dấu Trang (Bookmarks Bar)</strong> trình duyệt (chỉ làm 1 lần duy nhất). Sau đó mở trang <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" style="color:var(--pri);font-weight:700;">Shop Shopee ↗</a> rồi bấm vào dấu trang đó — trình duyệt sẽ <strong>tự mở lần lượt từng sản phẩm trong Shop, tự click lấy đủ mọi phân hệ LS1..LS15, ảnh HD từng mẫu &amp; tồn kho</strong> đẩy thẳng về đây!<br/>
            • <em>(Hoặc nếu không bật thanh Dấu trang: bấm <strong>Copy Lệnh Quét Sâu</strong> &rarr; sang tab Shopee nhấn <strong>F12 &rarr; Console &rarr; Ctrl+V &rarr; Enter</strong> là chạy tự động y hệt!)</em>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" class="btn btn-sm">
              🔗 1. Mở Trang Shop / Sản Phẩm
            </a>
            <a id="deep-bookmarklet-btn" href="${escapeHtml(bookmarkletHref)}" class="btn btn-sm btn-primary" title="Kéo nút này thả lên thanh Dấu Trang (Bookmarks Bar) của trình duyệt">
              🪄 Đồng Bộ 1-1 V3 — Tự Quét Lại (Kéo lên Dấu Trang)
            </a>
            <button type="button" class="btn btn-sm" id="btn-copy-deep-script" style="border-color:#e14b85; color:#be185d;">
              ⚡ Copy Lệnh Quét Sâu Hết Phân Hệ (F12 Console)
            </button>
          </div>
        </div>

        <!-- QUICK CLIPBOARD PASTE (Works for both Shop listing AND single Product Detail page with LS1..LS15!) -->
        <div style="font-size:0.79rem; color:var(--muted); margin-bottom:8px;">
          💡 <strong>Hoặc Copy-Dán nhanh (Ctrl+A &rarr; Ctrl+C):</strong> Nếu bạn nhấn <code>Ctrl+A</code> rồi <code>Ctrl+C</code> ngay trên <strong>trang Chi tiết 1 sản phẩm Shopee</strong> (trang có hiện các nút <code>LS1..LS15</code>), rồi bấm nút dưới đây — hệ thống cũng tự bóc tách luôn cả 15 phân hệ <code>LS1..LS15</code> kèm ảnh HD từng mẫu!
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
          <button type="button" class="btn btn-sm" id="btn-read-clipboard-sync">
            📋 Hút Ngay Nội Dung Vừa Copy (Ctrl+A, Ctrl+C)
          </button>
        </div>
        <div
          id="paste-drop-zone"
          contenteditable="true"
          style="min-height:42px; max-height:84px; overflow:hidden; padding:9px 12px; border-radius:12px; border:1.5px dashed #e5b8cc; background:#fdf7fa; color:var(--muted); font-size:0.78rem; outline:none;"
        >Hoặc click vào ô này rồi nhấn <strong>Ctrl + V</strong> sau khi Ctrl+A, Ctrl+C ở trang Sản phẩm / trang Shop...</div>
      `;

      logBox.querySelector('#deep-bookmarklet-btn')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        alert(
          'Hãy giữ chuột KÉO nút hồng "🪄 Hút Sâu Cả Shop & Phân Hệ" này thả lên Thanh Dấu Trang (Bookmarks Bar - bấm Ctrl+Shift+B để hiện thanh dấu trang) phía trên trình duyệt nhé!\n\nSau đó khi đang mở trang Shop Shopee (shopee.vn/na2hand3) hoặc trang sản phẩm lẻ, bạn chỉ cần bấm 1 click vào dấu trang đó là toàn bộ sản phẩm + các phân hệ LS1..LS15 tự động kéo hết về Shop!'
        );
      });

      logBox.querySelector('#btn-copy-deep-script')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(harvesterCode);
          startLiveSyncPolling();
          showToast('Đã copy lệnh Quét Sâu! Hãy sang tab Shopee nhấn F12 -> Console -> Ctrl+V -> Enter nhé! 🚀');
        } catch {
          showToast('Không thể copy tự động, hãy thử kéo nút Dấu Trang bên cạnh nhé!', true);
        }
      });

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
            showToast('Bộ nhớ tạm đang trống — hãy nhấn Ctrl+A rồi Ctrl+C ở trang Shopee trước nhé!', true);
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

      startLiveSyncPolling();
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
