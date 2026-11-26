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
    document.getElementById('prod-form-heading').textContent = '➕ Thêm Sản Phẩm Mới (SP Ngoài Sàn)';
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
      variantGroupName: document.getElementById('pf-var-group')?.value.trim() || 'Mẫu',
      variants: editingVariants.filter((v) => String(v.label || '').trim()),
      sourceUrl,
      sourcePlatform: sourceUrl.includes('tiktok') ? 'tiktok' : sourceUrl.includes('shopee') ? 'shopee' : 'manual',
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

  function isClonedFromPlatform(p) {
    if (!p) return false;
    if (p.originType === 'local') return false;
    if (p.originType === 'cloned') return true;
    const plat = String(p.sourcePlatform || '').toLowerCase();
    const url = String(p.sourceUrl || '').toLowerCase();
    return plat === 'shopee' || plat === 'tiktok' || /-i\.\d+\.\d+|\/product\/\d+\/\d+|\/view\/product\//.test(url);
  }

  document.getElementById('btn-lock-all-local')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/shop/admin/products/lock-local', {
        method: 'POST',
        body: JSON.stringify({ locked: true })
      });
      showToast(res.message || 'Đã khóa toàn bộ SP sẵn trên web! 🔒');
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
      showToast(res.message || 'Đã mở khóa các SP sẵn trên web! 🔓');
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
        const cloned = isClonedFromPlatform(p);
        const locked = Boolean(p.isLocked);
        const srcBadge = cloned
          ? p.sourcePlatform === 'tiktok'
            ? `<span class="badge" style="background:#f3e8ff; color:#6b21a8;">🔄 Đồng bộ 1-1 TikTok</span>`
            : `<span class="badge" style="background:#ffedd5; color:#c2410c;">🔄 Đồng bộ 1-1 Shopee</span>`
          : `<span class="badge" style="background:#fce7f3; color:#be185d;">🛡️ SP sẵn trên web</span>`;

        const sizesInfo =
          Array.isArray(p.sizes) && p.sizes.length > 0
            ? ` • Size: ${escapeHtml(p.sizes.join(', '))}`
            : ` • <span style="color:#64748b;">Không phân size</span>`;

        const maxP = Number(p.maxPrice || 0);
        const priceHtml =
          maxP > Number(p.price || 0)
            ? `${formatVnd(p.price)} – ${formatVnd(maxP)}`
            : formatVnd(p.price);

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
                    ? ` • <span style="color:#15803d; font-weight:700;">🧩 ${p.variants.length} phân hệ (${p.variants.filter((v) => Number(v.stock ?? 1) > 0).length} còn)</span>`
                    : cloned
                    ? ` • <span style="color:#b45309;">⚪ 1 mẫu đơn</span>`
                    : ''
                }
              </div>
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
              ${srcBadge}
              ${p.sourceUrl ? `<div style="margin-top:3px;"><a href="${escapeHtml(p.sourceUrl)}" target="_blank" style="font-size:0.7rem; color:var(--pri);">Mở đúng link SP ↗</a></div>` : ''}
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

  /* Self-contained in-browser deep harvester that runs directly inside the user's open Shopee / TikTok tab.
     NOTE: Do not use single-line // comments inside this function so bookmarklet URI encoding stays 100% valid. */
  function deepHarvesterRuntime(serverUrl, syncKey) {
    (async function () {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      if (!/shopee\.|tiktok\./i.test(location.hostname)) {
        alert('Hãy mở trang Shop Shopee / TikTok Shop (VD: shopee.vn/na2hand3) hoặc trang sản phẩm rồi bấm nút này nhé!');
        return;
      }

      const oldHud = document.getElementById('na2hand-deep-hud');
      if (oldHud) oldHud.remove();

      let stopped = false;
      const hud = document.createElement('div');
      hud.id = 'na2hand-deep-hud';
      hud.style.cssText =
        'position:fixed;right:18px;bottom:18px;width:360px;z-index:2147483647;background:#fff;border:2px solid #e14b85;border-radius:20px;padding:15px;box-shadow:0 20px 50px rgba(120,25,65,0.3);font-family:sans-serif;color:#3d1a29;font-size:13px;line-height:1.48;';
      hud.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<strong style="color:#d63874;font-size:14px;">🎀 NA 2HAND — Đồng Bộ 1-1 Chuẩn Sàn</strong>' +
        '<button id="na2h-stop" style="border:1px solid #f3b8d2;background:#fff0f6;color:#be123c;border-radius:8px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;">Đóng ✕</button>' +
        '</div>' +
        '<div id="na2h-status" style="margin-bottom:8px;font-weight:600;color:#54283b;">Đang chuẩn bị đồng bộ 1-1...</div>' +
        '<div style="height:8px;background:#fce7f3;border-radius:99px;overflow:hidden;margin-bottom:4px;">' +
        '<div id="na2h-bar" style="height:100%;width:4%;background:linear-gradient(90deg,#f4669d,#d63874);transition:width 0.3s;"></div>' +
        '</div>';
      document.body.appendChild(hud);

      const statusEl = hud.querySelector('#na2h-status');
      const barEl = hud.querySelector('#na2h-bar');
      let workerWin = null;

      hud.querySelector('#na2h-stop').onclick = function () {
        stopped = true;
        if (workerWin && !workerWin.closed) {
          try { workerWin.close(); } catch (e) {}
        }
        hud.remove();
      };

      const cleanImg = (u) =>
        String(u || '')
          .trim()
          .replace(/&amp;/g, '&')
          .replace(/@resize[^"'\s?]*/gi, '')
          .replace(/_tn(?=$|\?)/i, '');

      const cleanUrl = (u) => {
        const s = String(u || '').trim().replace(/&amp;/g, '&');
        const m = s.match(/^(https?:\/\/(?:www\.)?shopee\.vn\/[^?#]+-i\.\d+\.\d+)/i);
        if (m) return m[1];
        const m2 = s.match(/^(https?:\/\/(?:www\.)?shopee\.vn\/product\/\d+\/\d+)/i);
        if (m2) return m2[1];
        return s.split('?')[0];
      };

      const extractItemKey = (u) => {
        const s = String(u || '');
        const m1 = s.match(/-i\.(\d+\.\d+)/i);
        if (m1) return m1[1];
        const m2 = s.match(/\/product\/(\d+)\/(\d+)/i);
        if (m2) return m2[1] + '.' + m2[2];
        const m3 = s.match(/\/view\/product\/(\d+)/i);
        if (m3) return m3[1];
        return '';
      };

      const toPlatformItemId = (plat, key) => {
        if (!key) return '';
        return plat + '_' + key.replace(/\./g, '_');
      };

      const normApiPrice = (n) => {
        const v = Number(n || 0);
        if (!v || v <= 0) return 0;
        return v > 100000000 ? Math.round(v / 100000) : Math.round(v);
      };

      const extractVndList = (txt) => {
        const out = [];
        const re = /\d{1,3}(?:[.,]\d{3})+/g;
        let m;
        while ((m = re.exec(String(txt || ''))) !== null) {
          const val = parseInt(m[0].replace(/[^\d]/g, ''), 10);
          if (val >= 1000 && val <= 500000000) out.push(val);
        }
        return out;
      };

      const readPriceInfo = (doc) => {
        let bestNums = [];
        let bestSize = 0;
        let origPrice = 0;
        const nodes = doc.querySelectorAll('div, span');
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i];
          if (el.children.length > 4) continue;
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (!t || t.length > 46) continue;
          if (!/[₫đ]/i.test(t)) continue;
          const r = el.getBoundingClientRect();
          if (r.top < 80 || r.top > 720 || r.width === 0 || r.height === 0) continue;
          const cs = doc.defaultView.getComputedStyle(el);
          const pcs = el.parentElement ? doc.defaultView.getComputedStyle(el.parentElement) : null;
          const isStrike =
            (cs.textDecorationLine && cs.textDecorationLine.indexOf('line-through') > -1) ||
            (pcs && pcs.textDecorationLine && pcs.textDecorationLine.indexOf('line-through') > -1);
          const nums = extractVndList(t);
          if (nums.length === 0) continue;
          if (isStrike) {
            const maxStrike = Math.max.apply(null, nums);
            if (maxStrike > origPrice) origPrice = maxStrike;
            continue;
          }
          const fs = parseFloat(cs.fontSize || '14');
          if (fs < 18) continue;
          if (fs > bestSize || (fs === bestSize && nums.length >= bestNums.length)) {
            bestSize = fs;
            bestNums = nums;
          }
        }
        if (bestNums.length === 0) return { min: 0, max: 0, orig: origPrice };
        return {
          min: Math.min.apply(null, bestNums),
          max: Math.max.apply(null, bestNums),
          orig: origPrice
        };
      };

      const readStock = (doc) => {
        const txt = doc.body ? doc.body.innerText : '';
        const m = txt.match(/(\d+)\s*(?:pieces?\s*available|sản phẩm có sẵn|sp có sẵn)/i);
        return m ? parseInt(m[1], 10) : 1;
      };

      const readMainImg = (doc) => {
        let bestSrc = '';
        let bestArea = 0;
        const imgs = doc.querySelectorAll('img');
        for (let i = 0; i < imgs.length; i++) {
          const im = imgs[i];
          const src = im.currentSrc || im.src || '';
          if (!/susercontent\.com\/file\/|tiktokcdn|ibyteimg/i.test(src)) continue;
          const r = im.getBoundingClientRect();
          if (r.top > 760 || r.width < 180 || r.height < 180) continue;
          const area = r.width * r.height;
          if (area > bestArea) {
            bestArea = area;
            bestSrc = cleanImg(src);
          }
        }
        return bestSrc;
      };

      /* Inspect Shopee React Fiber tree for exact item models & tier_variations (0ms, 100% exact per-variant prices & sizes) */
      const findShopeeReactItem = (doc, expectedKey) => {
        const expectedItemId = expectedKey && expectedKey.indexOf('.') > -1 ? expectedKey.split('.')[1] : '';
        const seen = new WeakSet();
        const scanObj = (obj, depth) => {
          if (!obj || typeof obj !== 'object' || depth > 5) return null;
          if (seen.has(obj)) return null;
          seen.add(obj);
          if (Array.isArray(obj.models) && obj.models.length > 0 && Array.isArray(obj.tier_variations)) {
            const cid = String(obj.itemid || obj.item_id || obj.models[0]?.itemid || '');
            if (!expectedItemId || !cid || cid === expectedItemId) {
              return obj;
            }
          }
          const keys = Object.keys(obj);
          for (let i = 0; i < Math.min(keys.length, 32); i++) {
            const k = keys[i];
            if (k === 'children' || k === 'owner' || k === '_owner' || k === 'stateNode' || k === 'return') continue;
            try {
              const v = obj[k];
              if (v && typeof v === 'object') {
                const hit = scanObj(v, depth + 1);
                if (hit) return hit;
              }
            } catch (e) {}
          }
          return null;
        };

        const probes = doc.querySelectorAll('button, h1, [class*="WBVL"], main');
        for (let p = 0; p < Math.min(probes.length, 45); p++) {
          const el = probes[p];
          const fk = Object.keys(el).find((k) => k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0);
          if (!fk) continue;
          let cur = el[fk];
          let steps = 0;
          while (cur && steps < 40) {
            const hit1 = scanObj(cur.memoizedProps, 0);
            if (hit1) return hit1;
            if (cur.memoizedState && cur.memoizedState.memoizedState) {
              const hit2 = scanObj(cur.memoizedState.memoizedState, 0);
              if (hit2) return hit2;
            }
            cur = cur.return;
            steps++;
          }
        }
        return null;
      };

      const extractProductDeep = async (doc, expectedUrl, expectedKey) => {
        const liveHref = (doc.location && doc.location.href) ? doc.location.href : expectedUrl;
        const finalUrl = cleanUrl(liveHref || expectedUrl);
        const finalKey = extractItemKey(finalUrl) || expectedKey;
        const plat = finalUrl.indexOf('tiktok') > -1 ? 'tiktok' : 'shopee';
        const platformItemId = toPlatformItemId(plat, finalKey);

        let title =
          (doc.querySelector('[class*="WBVL"] span, h1') &&
            doc.querySelector('[class*="WBVL"] span, h1').innerText.trim()) ||
          doc.title.replace(/\s*\|\s*Shopee.*$/i, '').replace(/\s*-\s*TikTok.*$/i, '').trim();

        const domPrice = readPriceInfo(doc);
        let basePrice = domPrice.min || 110000;
        let maxPrice = domPrice.max || basePrice;
        let origPrice = domPrice.orig || 0;
        const baseMainImg = readMainImg(doc);

        let variantGroupName = 'Mẫu';
        const variants = [];
        let sizes = [];
        let usedReactModels = false;

        /* 1. Try exact React Fiber item models + tier_variations first */
        const reactItem = plat === 'shopee' ? findShopeeReactItem(doc, finalKey) : null;
        if (reactItem && Array.isArray(reactItem.tier_variations) && reactItem.tier_variations.length > 0) {
          if (reactItem.name && String(reactItem.name).trim().length >= 4) {
            title = String(reactItem.name).trim();
          }
          const rMin = normApiPrice(reactItem.price_min || reactItem.price);
          const rMax = normApiPrice(reactItem.price_max || reactItem.price);
          const rOrig = normApiPrice(reactItem.price_before_discount);
          if (rMin > 0) basePrice = rMin;
          if (rMax > 0) maxPrice = Math.max(basePrice, rMax);
          if (rOrig > maxPrice) origPrice = rOrig;

          const tv0 = reactItem.tier_variations[0];
          const tv1 = reactItem.tier_variations[1];
          const opts0 = Array.isArray(tv0.options) ? tv0.options : [];
          const imgs0 = Array.isArray(tv0.images) ? tv0.images : [];
          const isSingleSizeOnly =
            !tv1 &&
            imgs0.filter(Boolean).length === 0 &&
            /^(size|kích cỡ|kích thước)$/i.test(String(tv0.name || '').trim()) &&
            basePrice === maxPrice;

          if (isSingleSizeOnly) {
            sizes = opts0.map((s) => String(s || '').trim()).filter(Boolean);
          } else {
            variantGroupName = String(tv0.name || 'Mẫu').trim();
            if (tv1 && Array.isArray(tv1.options)) {
              sizes = tv1.options.map((s) => String(s || '').trim()).filter(Boolean);
            }
            opts0.forEach((optLabel, idx) => {
              const matching = (reactItem.models || []).filter((md) => {
                if (Array.isArray(md.tier_index)) return md.tier_index[0] === idx;
                if (md.extinfo && Array.isArray(md.extinfo.tier_index)) return md.extinfo.tier_index[0] === idx;
                return String(md.name || '').split(',')[0].trim() === String(optLabel || '').trim();
              });
              const inStockM = matching.filter((md) => Number(md.stock ?? md.normal_stock ?? 0) > 0);
              const pool = inStockM.length > 0 ? inStockM : matching;
              const mPrices = pool.map((md) => normApiPrice(md.price)).filter((p) => p > 0);
              const optStock = matching.length > 0
                ? matching.reduce((acc, md) => acc + Math.max(0, Number(md.stock ?? md.normal_stock ?? 0)), 0)
                : 1;
              const rawImg = imgs0[idx] || '';
              const fullVarImg = rawImg
                ? String(rawImg).indexOf('http') === 0
                  ? cleanImg(rawImg)
                  : 'https://down-vn.img.susercontent.com/file/' + rawImg
                : baseMainImg;
              variants.push({
                id: 'var_' + (idx + 1),
                label: String(optLabel || '').trim(),
                image: fullVarImg,
                price: mPrices.length > 0 ? Math.min.apply(null, mPrices) : basePrice,
                stock: optStock
              });
            });
          }
          usedReactModels = true;
        }

        /* 2. Fallback to DOM Variation Clicker (strictly using innerText, NEVER aria-label!) */
        if (!usedReactModels) {
          const groupMap = new Map();
          const allBtns = doc.querySelectorAll('button');
          for (let i = 0; i < allBtns.length; i++) {
            const b = allBtns[i];
            const r = b.getBoundingClientRect();
            if (r.top < 110 || r.top > 880 || r.width < 28 || r.height < 22) continue;
            const lbl = (b.innerText || '').replace(/\s+/g, ' ').trim();
            if (!lbl || lbl.length > 42) continue;
            if (
              /^(add to cart|buy now|thêm vào giỏ.*|mua ngay|chat now|chat ngay|view shop|xem shop|follow|theo dõi|report|tố cáo|share|chia sẻ|favorite.*|yêu thích.*|size chart.*|bảng quy đổi.*|decrease|increase|giảm|tăng|\+|-|×|✕)$/i.test(
                lbl
              )
            ) {
              continue;
            }
            const p = b.parentElement;
            if (!p) continue;
            if (!groupMap.has(p)) groupMap.set(p, []);
            groupMap.get(p).push(b);
          }

          const tiers = [];
          groupMap.forEach((btns, parentEl) => {
            if (btns.length === 0) return;
            const hasImg = btns.some((b) => !!b.querySelector('img'));
            const hasVarAttr = btns.some((b) => /variation|sApkZm|sku|option/i.test(b.className || ''));
            if (!hasImg && !hasVarAttr && btns.length < 2) return;
            let tierName = 'Mẫu';
            const row = parentEl.parentElement;
            if (row && row.firstElementChild && !row.firstElementChild.contains(btns[0])) {
              const cand = (row.firstElementChild.innerText || '').trim();
              if (cand && cand.length <= 26) tierName = cand;
            }
            tiers.push({ tierName, btns, hasImg });
          });

          if (tiers.length > 0) {
            const primaryIdx = tiers.findIndex((t) => t.hasImg) >= 0 ? tiers.findIndex((t) => t.hasImg) : 0;
            const primary = tiers[primaryIdx];
            const isBtnDisabled = (b) => {
              const cs = doc.defaultView.getComputedStyle(b);
              return (
                b.disabled ||
                b.getAttribute('aria-disabled') === 'true' ||
                /disabled|sold-?out/i.test(b.className || '') ||
                cs.cursor === 'not-allowed' ||
                parseFloat(cs.opacity || '1') < 0.56
              );
            };
            const isBtnSelected = (b) =>
              b.getAttribute('aria-checked') === 'true' ||
              /selected|active/i.test(b.className || '') ||
              !!b.querySelector('svg, [class*="tick"]');

            /* If there is a secondary tier (e.g. Size), pre-select its first active button so Shopee shows exact SKU prices! */
            tiers.forEach((t, idx) => {
              if (idx === primaryIdx) return;
              t.btns.forEach((b) => {
                const s = (b.innerText || '').replace(/\s+/g, ' ').trim();
                if (s && s.length <= 20 && sizes.indexOf(s) === -1) sizes.push(s);
              });
              const anySel = t.btns.some(isBtnSelected);
              if (!anySel) {
                const firstActive = t.btns.find((b) => !isBtnDisabled(b));
                if (firstActive) {
                  try { firstActive.click(); } catch (e) {}
                }
              }
            });
            if (tiers.length > 1) await sleep(200);

            const isSingleSizeOnlyDom =
              tiers.length === 1 &&
              !primary.hasImg &&
              /^(size|kích cỡ|kích thước)$/i.test(primary.tierName || '') &&
              basePrice === maxPrice;

            if (isSingleSizeOnlyDom) {
              primary.btns.forEach((b) => {
                const s = (b.innerText || '').replace(/\s+/g, ' ').trim();
                if (s && s.length <= 20 && sizes.indexOf(s) === -1) sizes.push(s);
              });
            } else {
              variantGroupName = primary.tierName || 'Mẫu';
              for (let k = 0; k < primary.btns.length; k++) {
                if (stopped) break;
                const btn = primary.btns[k];
                const label = (btn.innerText || 'Mẫu ' + (k + 1)).replace(/\s+/g, ' ').trim();
                const imEl = btn.querySelector('img');
                const btnImg = imEl ? cleanImg(imEl.currentSrc || imEl.src || '') : '';

                if (isBtnDisabled(btn)) {
                  variants.push({
                    id: 'var_' + (k + 1),
                    label,
                    image: btnImg || baseMainImg,
                    price: basePrice,
                    stock: 0
                  });
                } else {
                  if (!isBtnSelected(btn) && primary.btns.length <= 45) {
                    try { btn.click(); } catch (e) {}
                    await sleep(240);
                  }
                  const pNow = readPriceInfo(doc);
                  const vPrice = pNow.min || basePrice;
                  const vStock = readStock(doc);
                  const activeImg = readMainImg(doc);
                  variants.push({
                    id: 'var_' + (k + 1),
                    label,
                    image: btnImg || activeImg || baseMainImg,
                    price: vPrice,
                    stock: vStock > 0 ? vStock : 1
                  });
                }
              }
            }
          }
        }

        if (variants.length > 0) {
          const inStockPrices = variants.filter((v) => v.stock > 0 && v.price > 0).map((v) => v.price);
          const allPrices = variants.filter((v) => v.price > 0).map((v) => v.price);
          const pool = inStockPrices.length > 0 ? inStockPrices : allPrices;
          if (pool.length > 0) {
            basePrice = Math.min.apply(null, pool);
            maxPrice = Math.max.apply(null, allPrices);
          }
        }

        /* Scroll down slightly to ensure gallery & description are rendered */
        try { doc.defaultView.scrollTo(0, 750); } catch (e) {}
        await sleep(220);

        const gallery = [];
        const addG = (u) => {
          const cu = cleanImg(u);
          if (cu && cu.indexOf('http') === 0 && gallery.indexOf(cu) === -1) gallery.push(cu);
        };
        if (reactItem && Array.isArray(reactItem.images)) {
          reactItem.images.forEach((h) => {
            addG(String(h).indexOf('http') === 0 ? h : 'https://down-vn.img.susercontent.com/file/' + h);
          });
        }
        if (baseMainImg) addG(baseMainImg);
        const allImgs = doc.querySelectorAll('img');
        for (let i = 0; i < allImgs.length && gallery.length < 25; i++) {
          const im = allImgs[i];
          const src = im.currentSrc || im.src || '';
          if (!/susercontent\.com\/file\/|tiktokcdn|ibyteimg/i.test(src)) continue;
          if (/avatar|icon|logo|badge|emoji/i.test(src)) continue;
          const r = im.getBoundingClientRect();
          if (r.width >= 38 && r.height >= 38 && r.top < 1100) addG(src);
        }
        variants.forEach((v) => { if (v.image) addG(v.image); });

        let desc = reactItem && reactItem.description ? String(reactItem.description).trim() : '';
        const fullTxt = doc.body ? doc.body.innerText : '';
        if (!desc) {
          const dm = fullTxt.match(
            /(?:Product Description|Mô tả sản phẩm)\s*\n([\s\S]{15,1600}?)(?:Product Ratings|Đánh giá sản phẩm|From The Same Shop|Sản phẩm khác của Shop|$)/i
          );
          if (dm) desc = dm[1].trim();
        }

        const soldM = fullTxt.match(/(\d+)\s*Sold|Đã bán\s*(\d+)/i);
        const sold = reactItem && (reactItem.historical_sold !== undefined || reactItem.sold !== undefined)
          ? Number(reactItem.historical_sold || reactItem.sold || 0)
          : (soldM ? parseInt(soldM[1] || soldM[2] || '0', 10) : 0);

        return {
          platformItemId,
          name: title,
          price: basePrice,
          maxPrice,
          originalPrice: origPrice > maxPrice ? origPrice : maxPrice,
          images: gallery,
          sizes,
          variantGroupName,
          variants,
          sold,
          description: desc,
          sourcePlatform: plat,
          sourceUrl: finalUrl
        };
      };

      const endpoint = serverUrl + '/api/shop/import?syncKey=' + encodeURIComponent(syncKey);

      const pushToServer = async (prod) => {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({ product: prod })
        });
        return r.json();
      };

      const isSingleProductPage = /-i\.\d+\.\d+|\/product\/\d+\/\d+|\/view\/product\//i.test(location.href);

      if (isSingleProductPage) {
        statusEl.textContent = 'Đang đồng bộ 1-1 sản phẩm & giá từng phân hệ...';
        barEl.style.width = '45%';
        const prod = await extractProductDeep(document, location.href, extractItemKey(location.href));
        barEl.style.width = '85%';
        await pushToServer(prod);
        barEl.style.width = '100%';
        statusEl.innerHTML =
          '🎉 <span style="color:#15803d;">Đã đồng bộ 1-1 xong SP kèm <strong>' +
          prod.variants.length +
          ' phân hệ con</strong> (' +
          (prod.sizes.length > 0 ? 'Size: ' + prod.sizes.join(', ') : 'Không phân size') +
          ')!</span>';
        return;
      }

      /* Shop Listing Mode: Auto-scroll to collect all product URLs, then visit each one with strict URL-key verification */
      statusEl.textContent = 'Đang cuộn trang Shop để gom toàn bộ danh sách sản phẩm...';
      for (let y = 500; y <= 2800; y += 650) {
        window.scrollTo(0, y);
        await sleep(300);
      }
      window.scrollTo(0, 0);

      const urlSet = [];
      const seenItemKeys = new Set();
      document.querySelectorAll('a[href]').forEach((a) => {
        const raw = a.getAttribute('href') || '';
        if (!/-i\.\d+\.\d+|\/product\/\d+\/\d+|\/view\/product\//i.test(raw)) return;
        try {
          const abs = cleanUrl(new URL(raw, location.origin).toString());
          const ik = extractItemKey(abs) || abs;
          if (!seenItemKeys.has(ik)) {
            seenItemKeys.add(ik);
            urlSet.push(abs);
          }
        } catch (e) {}
      });

      if (urlSet.length === 0) {
        statusEl.innerHTML =
          '<span style="color:#be123c;">Không tìm thấy danh sách sản phẩm trên trang này. Hãy cuộn xuống mục Tất cả sản phẩm của Shop rồi bấm lại nhé!</span>';
        return;
      }

      const shopPlat = location.hostname.indexOf('tiktok') > -1 ? 'tiktok' : 'shopee';
      let okCount = 0;
      let totalVars = 0;
      const syncedPlatformIds = [];

      for (let i = 0; i < urlSet.length; i++) {
        if (stopped) break;
        const itemUrl = urlSet[i];
        const expectedKey = extractItemKey(itemUrl);
        statusEl.textContent =
          '⏳ Đang mở đúng link & đồng bộ 1-1 SP (' + (i + 1) + '/' + urlSet.length + ')...';
        barEl.style.width = Math.round(((i + 0.25) / urlSet.length) * 100) + '%';

        if (!workerWin || workerWin.closed) {
          workerWin = window.open(itemUrl, 'na2hand_worker', 'width=1100,height=800,left=40,top=40');
        } else {
          try { workerWin.document.title = '__NA2HAND_LOADING__'; } catch (e) {}
          workerWin.location.href = itemUrl;
        }

        if (!workerWin) {
          statusEl.innerHTML =
            '<span style="color:#be123c;">Trình duyệt chặn cửa sổ phụ — hãy cho phép Pop-up trên Shopee rồi bấm lại nhé!</span>';
          break;
        }

        let targetDoc = null;
        for (let w = 0; w < 34; w++) {
          await sleep(380);
          try {
            const d = workerWin.document;
            const curHref = (d && d.location && d.location.href) ? d.location.href : '';
            const keyMatched = !expectedKey || curHref.indexOf(expectedKey) > -1;
            if (
              d &&
              keyMatched &&
              d.readyState === 'complete' &&
              d.title !== '__NA2HAND_LOADING__' &&
              d.body &&
              /add to cart|buy now|thêm vào giỏ|mua ngay|pieces?\s*available|sản phẩm có sẵn/i.test(
                d.body.innerText || ''
              )
            ) {
              targetDoc = d;
              break;
            }
          } catch (e) {}
        }

        if (targetDoc) {
          await sleep(650);
          try {
            const prod = await extractProductDeep(targetDoc, itemUrl, expectedKey);
            if (prod && prod.name) {
              await pushToServer(prod);
              okCount++;
              totalVars += (prod.variants || []).length;
              if (prod.platformItemId) syncedPlatformIds.push(prod.platformItemId);
              statusEl.textContent =
                '✅ (' +
                (i + 1) +
                '/' +
                urlSet.length +
                ') ' +
                prod.name.slice(0, 26) +
                '... (' +
                (prod.variants || []).length +
                ' mẫu)';
            }
          } catch (e) {}
        }

        barEl.style.width = Math.round(((i + 1) / urlSet.length) * 100) + '%';
        await sleep(260);
      }

      if (workerWin && !workerWin.closed) {
        try { workerWin.close(); } catch (e) {}
      }

      let prunedNote = '';
      if (!stopped && okCount === urlSet.length && syncedPlatformIds.length > 0) {
        try {
          const recRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({
              reconcilePlatform: shopPlat,
              activePlatformItemIds: syncedPlatformIds
            })
          });
          const recJson = await recRes.json();
          const rmCnt = Number(recJson && (recJson.prunedCount || recJson.removedCount || 0));
          if (rmCnt > 0) {
            prunedNote = ' (Đã tự dọn ' + rmCnt + ' SP cũ đã gỡ trên sàn)';
          }
        } catch (e) {}
      }

      if (!stopped) {
        statusEl.innerHTML =
          '🎉 <span style="color:#15803d;">ĐỒNG BỘ 1-1 HOÀN TẤT! Đã khớp chuẩn <strong>' +
          okCount +
          '/' +
          urlSet.length +
          ' sản phẩm</strong> &amp; <strong>' +
          totalVars +
          ' phân hệ con</strong> về NA 2HAND!' +
          prunedNote +
          '</span>';
      }
    })();
  }

  function buildDeepHarvesterScript(serverUrl, syncKey) {
    return `(${deepHarvesterRuntime.toString()})(${JSON.stringify(serverUrl)},${JSON.stringify(syncKey)});`;
  }

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
      if (ticks > 35) {
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
      const bookmarkletHref = 'javascript:' + encodeURIComponent(harvesterCode);

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
            <a id="deep-bookmarklet-btn" href="${bookmarkletHref}" class="btn btn-sm btn-primary" title="Kéo nút này thả lên thanh Dấu Trang (Bookmarks Bar) của trình duyệt">
              🪄 Hút Sâu Cả Shop &amp; Phân Hệ (Kéo lên Dấu Trang)
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
