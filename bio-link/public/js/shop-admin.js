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
      renderProductSizeChartOptions();
      populateBulkPriceControls();
      renderProductsTable();
      renderCategoriesAndCoupons();
      initSizeChartsManagerFromStore();
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

  // --- ORDER PRINT STUDIO (3 TEMPLATES: INVOICE A5/A4, SHIPPING LABEL A6, THERMAL K80 + BULK PRINT) ---
  let selectedOrderIds = new Set();
  let activePrintOrders = [];
  let activePrintTemplate = 'invoice_a5'; // 'invoice_a5' | 'label_a6' | 'thermal_k80'
  let isSamplePrintMode = false;

  function updateSelectedOrdersCountUI() {
    const cntEl = document.getElementById('sel-orders-count');
    if (cntEl) cntEl.textContent = String(selectedOrderIds.size);
  }

  function renderBarcodeSvg(codeText, height = 38) {
    const clean = String(codeText || 'NA000000').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const bars = [];
    let x = 4;
    // Start guard
    [2, 1, 1, 2].forEach((w, idx) => {
      if (idx % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#111"/>`);
      x += w;
    });
    for (let i = 0; i < clean.length; i++) {
      const ch = clean.charCodeAt(i);
      const pattern = [
        1 + (ch % 3),
        1 + ((ch >> 1) % 2),
        1 + ((ch >> 2) % 3),
        1 + ((ch >> 3) % 2),
        1 + ((ch >> 4) % 2),
        1
      ];
      pattern.forEach((w, idx) => {
        if (idx % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#111"/>`);
        x += w;
      });
    }
    // End guard
    [2, 1, 2, 1, 2].forEach((w, idx) => {
      if (idx % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#111"/>`);
      x += w;
    });
    const totalW = x + 4;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${height}" width="${Math.min(210, totalW * 1.35)}" height="${height}" style="display:block;">${bars.join('')}</svg>`;
  }

  function getActiveSenderConfig() {
    const s = shopData?.settings || {};
    const livePhone = document.getElementById('ps-sender-phone')?.value?.trim();
    const liveAddr = document.getElementById('ps-sender-addr')?.value?.trim();
    const liveNote = document.getElementById('ps-thank-note')?.value?.trim();
    return {
      shopName: s.shopName || 'NA 2HAND Boutique',
      senderPhone: livePhone || s.senderPhone || s.zaloPhone || '0359427135',
      senderAddress: liveAddr || s.senderAddress || 'Kho NA 2HAND Boutique — Giao hàng toàn quốc',
      thankYouNote:
        liveNote ||
        s.invoiceThankYouNote ||
        'Cảm ơn nàng đã tin yêu NA 2HAND Boutique! Chúc nàng luôn xinh đẹp rạng rỡ trong thiết kế mới nhé ♡'
    };
  }

  function buildSampleOrderForPreview() {
    const sampleProd1 = (shopData?.products || [])[0];
    const sampleProd2 = (shopData?.products || [])[1];
    const p1Price = Number(sampleProd1?.price || 110000);
    const p2Price = Number(sampleProd2?.price || 88000);
    const sub = p1Price + p2Price;
    const ship = 30000;
    return {
      id: 'sample_preview',
      orderCode: 'NA886868',
      customerName: 'Nguyễn Ngọc Ánh (Đơn xem thử)',
      customerPhone: '0988.686.868',
      province: 'Hà Nội',
      district: 'Quận Cầu Giấy',
      address: 'Số 18 Ngõ Hoa Đào, Phường Dịch Vọng',
      shippingRegionLabel: 'Miền Bắc',
      scentChoice: 'Hương Đào Trắng',
      giftWrap: true,
      giftCardMessage: 'Chúc cậu một ngày thật dịu dàng & xinh đẹp nhé!',
      note: 'Giao giờ hành chính, gọi trước khi giao giúp em ạ',
      items: [
        {
          name: sampleProd1?.name || 'Áo Hoodie 2hand Form Rộng Hàn Quốc',
          color: sampleProd1?.variants?.[0]?.label ? `Mẫu: ${sampleProd1.variants[0].label}` : 'Kem Sữa',
          size: (sampleProd1?.sizes && sampleProd1.sizes[0]) || 'M',
          qty: 1,
          price: p1Price
        },
        {
          name: sampleProd2?.name || 'Quần Jeans Loe Nữ 2hand Dáng Tôn Chân',
          color: sampleProd2?.variants?.[0]?.label ? `Mẫu: ${sampleProd2.variants[0].label}` : 'Xanh Vintage',
          size: (sampleProd2?.sizes && sampleProd2.sizes[0]) || 'L',
          qty: 1,
          price: p2Price
        }
      ],
      subtotal: sub,
      discount: 0,
      couponCode: '',
      shippingFee: ship,
      totalAmount: sub + ship,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  function getPrintSheetCss(tpl) {
    const pageRule =
      tpl === 'label_a6'
        ? '@page { size: 100mm 150mm; margin: 3mm; }'
        : tpl === 'thermal_k80'
        ? '@page { size: 80mm auto; margin: 2mm; }'
        : '@page { size: A4 portrait; margin: 8mm 10mm; }';

    return `
      * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      ${pageRule}
      html, body { margin: 0; padding: 0; }
      .print-sheet {
        background: #ffffff;
        color: #181115;
        font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        margin: 0 auto;
        box-shadow: 0 6px 24px rgba(0,0,0,0.12);
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: avoid;
        break-after: avoid;
      }
      .print-sheet.tpl-invoice_a5 {
        width: 100%;
        max-width: 720px;
        padding: 18px 22px;
        border: 1.5px solid #ead5de;
        border-radius: 12px;
      }
      .print-sheet.tpl-label_a6 {
        width: 360px;
        padding: 9px 10px;
        border: 2px solid #111;
        border-radius: 6px;
        font-size: 11px;
      }
      .print-sheet.tpl-thermal_k80 {
        width: 296px;
        padding: 10px 8px;
        border: 1px dashed #333;
        font-size: 11.5px;
      }
      .p-table { width: 100%; border-collapse: collapse; }
      .p-table th { background: #23141b; color: #fff; font-size: 10.5px; text-transform: uppercase; padding: 6px 8px; text-align: left; }
      .p-table td { padding: 6px 8px; border-bottom: 1px solid #ead8e0; font-size: 12px; vertical-align: top; }
      @media print {
        html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
        .print-sheet {
          box-shadow: none !important;
          margin: 0 auto !important;
          border-radius: 0 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .print-sheet + .print-sheet {
          page-break-before: always !important;
          break-before: page !important;
        }
        .print-sheet.tpl-invoice_a5 { max-width: none; border: 1px solid #ddd; padding: 12px 15px; }
        .print-sheet.tpl-label_a6 { width: 100%; max-height: 143mm; overflow: hidden; padding: 7px 8px; }
        .print-sheet.tpl-thermal_k80 { width: 100%; border: none; padding: 6px 4px; }
      }
    `;
  }

  function renderSingleOrderSheetHtml(o, tpl, sender) {
    const items = Array.isArray(o.items) ? o.items : [];
    const totalQty = items.reduce((s, it) => s + Math.max(1, Number(it.qty || 1)), 0);
    const subtotal =
      o.subtotal !== undefined
        ? Number(o.subtotal)
        : items.reduce((s, it) => s + Number(it.price || 0) * Math.max(1, Number(it.qty || 1)), 0);
    const discount = Number(o.discount || 0);
    const shipFee = Number(o.shippingFee || 0);
    const totalAmount = Number(o.totalAmount ?? Math.max(0, subtotal - discount + shipFee));
    const isPaidQr = o.paymentStatus === 'paid';
    const codCollect = isPaidQr ? 0 : totalAmount;
    const createdStr = o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
    const fullAddress = [o.address, o.district, o.province].filter(Boolean).join(', ');
    const logoUrl = `${window.location.origin}/images/brand-logo.jpg`;

    // TEMPLATE 2: TEM DÁN GÓI HÀNG SHIPPER (A6 100x150mm)
    if (tpl === 'label_a6') {
      const compactRows = items
        .map((it, idx) => {
          const variantMeta = [it.color, it.size]
            .map((x) => String(x || '').trim())
            .filter((x) => x && x !== 'Mặc định' && x !== 'Theo hình')
            .join(' / ');
          return `
            <div style="display:flex; justify-content:space-between; gap:8px; padding:4px 0; border-bottom:1px dashed #ccc; font-size:11.5px;">
              <div style="flex:1;">
                <strong>${idx + 1}. ${escapeHtml(it.name)}</strong>
                ${variantMeta ? `<div style="font-size:10.5px; color:#444;">Phân loại: ${escapeHtml(variantMeta)}</div>` : ''}
              </div>
              <div style="font-weight:800; font-size:12.5px; white-space:nowrap;">SL: x${it.qty}</div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="print-sheet tpl-label_a6">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #111; padding-bottom:5px; margin-bottom:5px;">
            <div>
              <div style="font-weight:900; font-size:13px; letter-spacing:0.02em;">${escapeHtml(sender.shopName.toUpperCase())}</div>
              <div style="font-size:9.5px; color:#333;">Ngày đơn: ${escapeHtml(createdStr)}</div>
            </div>
            <div style="background:#111; color:#fff; font-weight:800; font-size:10px; padding:3px 7px; border-radius:4px;">
              ${escapeHtml((o.shippingRegionLabel || o.province || 'TOÀN QUỐC').toUpperCase())}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; align-items:center; border-bottom:1.5px solid #111; padding-bottom:5px; margin-bottom:5px;">
            ${renderBarcodeSvg(o.orderCode, 26)}
            <div style="font-weight:900; font-size:12.5px; letter-spacing:1.5px; margin-top:2px;">MÃ ĐƠN: #${escapeHtml(o.orderCode)}</div>
          </div>

          <div style="border-bottom:1px dashed #111; padding-bottom:4px; margin-bottom:5px; font-size:10.5px;">
            <div style="font-weight:800; text-transform:uppercase; color:#444;">TỪ (NGƯỜI GỬI):</div>
            <div><strong>${escapeHtml(sender.shopName)}</strong> — SĐT: <strong>${escapeHtml(sender.senderPhone)}</strong></div>
            <div>${escapeHtml(sender.senderAddress)}</div>
          </div>

          <div style="border:1.5px solid #111; padding:5px 8px; border-radius:5px; margin-bottom:5px; background:#fafafa;">
            <div style="font-weight:800; font-size:10px; text-transform:uppercase;">ĐẾN (NGƯỜI NHẬN):</div>
            <div style="font-weight:900; font-size:13.5px; margin:1px 0;">${escapeHtml(o.customerName)} — ${escapeHtml(o.customerPhone)}</div>
            <div style="font-size:11px; font-weight:600; line-height:1.3;">${escapeHtml(fullAddress)}</div>
          </div>

          <div style="margin-bottom:5px;">
            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:10.5px; background:#eee; padding:3px 6px;">
              <span>NỘI DUNG HÀNG HÓA (KIỂM ĐÓNG GÓI)</span>
              <span>TỔNG SL: ${totalQty}</span>
            </div>
            <div style="padding:2px 2px 0;">${compactRows}</div>
          </div>

          ${
            o.scentChoice || o.giftWrap || o.note
              ? `<div style="border:1px dashed #555; padding:4px 6px; margin-bottom:6px; font-size:10px; line-height:1.35;">
                  ${o.scentChoice ? `<div>• Hương giấy gói: <strong>${escapeHtml(o.scentChoice)}</strong></div>` : ''}
                  ${o.giftWrap ? `<div>• <strong>GÓI HỘP QUÀ NƠ</strong> — Thiệp: "${escapeHtml(o.giftCardMessage || '')}"</div>` : ''}
                  ${o.note ? `<div>• Ghi chú giao: <strong>${escapeHtml(o.note)}</strong></div>` : ''}
                </div>`
              : ''
          }

          <div style="display:grid; grid-template-columns:1.35fr 1fr; gap:6px; align-items:stretch;">
            <div style="border:2px solid #111; padding:5px; text-align:center;">
              <div style="font-size:9.5px; font-weight:800; text-transform:uppercase;">TIỀN THU HỘ (COD)</div>
              <div style="font-size:18px; font-weight:900; margin-top:2px;">${codCollect > 0 ? formatVnd(codCollect) : '0đ'}</div>
              <div style="font-size:9px; font-weight:700; margin-top:1px;">
                ${isPaidQr ? '(KHÁCH ĐÃ CHUYỂN KHOẢN ĐỦ)' : o.paymentMethod === 'qr' ? '(CHỜ ĐỐI SOÁT QR / THU HỘ NẾU CHƯA CK)' : '(THU TIỀN MẶT KHI GIAO)'}
              </div>
            </div>
            <div style="border:1px solid #111; padding:5px; text-align:center; display:flex; flex-direction:column; justify-content:space-between;">
              <div style="font-size:9px; font-weight:800;">CHỮ KÝ NGƯỜI NHẬN</div>
              <div style="font-size:8px; color:#555; margin-top:18px;">Xác nhận hàng nguyên vẹn</div>
            </div>
          </div>
        </div>
      `;
    }

    // TEMPLATE 3: BILL NHIỆT THU NGÂN K80 (80mm)
    if (tpl === 'thermal_k80') {
      const k80Rows = items
        .map((it) => {
          const meta = [it.color, it.size]
            .map((x) => String(x || '').trim())
            .filter((x) => x && x !== 'Mặc định' && x !== 'Theo hình')
            .join(' - ');
          return `
            <div style="padding:5px 0; border-bottom:1px dashed #aaa;">
              <div style="font-weight:700;">${escapeHtml(it.name)}</div>
              ${meta ? `<div style="font-size:11px; color:#444;">${escapeHtml(meta)}</div>` : ''}
              <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-top:2px;">
                <span>${formatVnd(it.price)} × ${it.qty}</span>
                <strong>${formatVnd(Number(it.price || 0) * Number(it.qty || 1))}</strong>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="print-sheet tpl-thermal_k80">
          <div style="text-align:center; border-bottom:1.5px dashed #111; padding-bottom:8px; margin-bottom:8px;">
            <div style="font-size:15px; font-weight:900;">${escapeHtml(sender.shopName.toUpperCase())}</div>
            <div style="font-size:11px;">Hotline/Zalo: <strong>${escapeHtml(sender.senderPhone)}</strong></div>
            <div style="font-size:10.5px; color:#333;">${escapeHtml(sender.senderAddress)}</div>
            <div style="font-size:13px; font-weight:800; margin-top:6px;">HÓA ĐƠN BÁN HÀNG</div>
            <div style="font-size:11.5px;">Mã: <strong>#${escapeHtml(o.orderCode)}</strong> • ${escapeHtml(createdStr)}</div>
          </div>

          <div style="border-bottom:1.5px dashed #111; padding-bottom:7px; margin-bottom:7px; font-size:11.5px; line-height:1.45;">
            <div>Khách: <strong>${escapeHtml(o.customerName)}</strong></div>
            <div>SĐT: <strong>${escapeHtml(o.customerPhone)}</strong></div>
            <div>Đ/c: ${escapeHtml(fullAddress)}</div>
            ${o.scentChoice ? `<div>Hương gói: ${escapeHtml(o.scentChoice)}</div>` : ''}
            ${o.giftWrap ? `<div>Gói quà + Thiệp: "${escapeHtml(o.giftCardMessage || '')}"</div>` : ''}
            ${o.note ? `<div>Ghi chú: ${escapeHtml(o.note)}</div>` : ''}
          </div>

          <div style="margin-bottom:8px;">${k80Rows}</div>

          <div style="border-top:1.5px solid #111; padding-top:6px; font-size:12px; line-height:1.55;">
            <div style="display:flex; justify-content:space-between;"><span>Tạm tính (${totalQty} món):</span><span>${formatVnd(subtotal)}</span></div>
            ${discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Ưu đãi${o.couponCode ? ` (${escapeHtml(o.couponCode)})` : ''}:</span><span>-${formatVnd(discount)}</span></div>` : ''}
            <div style="display:flex; justify-content:space-between;"><span>Phí vận chuyển:</span><span>${shipFee === 0 ? 'Miễn phí' : formatVnd(shipFee)}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:14.5px; font-weight:900; border-top:1px dashed #111; margin-top:4px; padding-top:4px;">
              <span>TỔNG CỘNG:</span><span>${formatVnd(totalAmount)}</span>
            </div>
            <div style="text-align:center; font-weight:800; font-size:11.5px; margin-top:6px; padding:4px; border:1px solid #111;">
              ${isPaidQr ? 'ĐÃ THANH TOÁN QUA QR (THU HỘ: 0đ)' : `THU KHI GIAO (COD): ${formatVnd(codCollect)}`}
            </div>
          </div>

          <div style="margin-top:10px; display:flex; flex-direction:column; align-items:center; text-align:center;">
            ${renderBarcodeSvg(o.orderCode, 30)}
            <div style="font-size:10.5px; margin-top:6px; line-height:1.4; color:#333;">${escapeHtml(sender.thankYouNote)}</div>
          </div>
        </div>
      `;
    }

    // DEFAULT TEMPLATE 1: HÓA ĐƠN CHO KHÁCH HÀNG (A5 / A4 BOUTIQUE)
    const tableRowsHtml = items
      .map((it, idx) => {
        const meta = [it.color, it.size]
          .map((x) => String(x || '').trim())
          .filter((x) => x && x !== 'Mặc định' && x !== 'Theo hình');
        const lineTotal = Number(it.price || 0) * Math.max(1, Number(it.qty || 1));
        return `
          <tr>
            <td style="text-align:center; width:36px; font-weight:700;">${idx + 1}</td>
            <td>
              <div style="font-weight:700; color:#23141b;">${escapeHtml(it.name)}</div>
              ${meta.length > 0 ? `<div style="font-size:11px; color:#6b515d; margin-top:2px;">Phân loại: ${escapeHtml(meta.join(' • '))}</div>` : ''}
            </td>
            <td style="text-align:center; width:48px; font-weight:700;">${it.qty}</td>
            <td style="text-align:right; width:96px;">${formatVnd(it.price)}</td>
            <td style="text-align:right; width:105px; font-weight:800;">${formatVnd(lineTotal)}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="print-sheet tpl-invoice_a5">
        <!-- Brand Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; border-bottom:2px solid #e6c6d4; padding-bottom:14px; margin-bottom:14px;">
          <div style="display:flex; gap:12px; align-items:center;">
            <img src="${escapeHtml(logoUrl)}" alt="Logo" style="width:54px; height:54px; border-radius:50%; object-fit:cover; border:1.5px solid #e6c6d4;" onerror="this.style.display='none'" />
            <div>
              <div style="font-size:18px; font-weight:900; color:#2b151e; letter-spacing:0.01em;">${escapeHtml(sender.shopName)}</div>
              <div style="font-size:11.5px; color:#5e424e; margin-top:2px;">Hotline / Zalo CSKH: <strong>${escapeHtml(sender.senderPhone)}</strong></div>
              <div style="font-size:11.5px; color:#5e424e;">${escapeHtml(sender.senderAddress)}</div>
            </div>
          </div>
          <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end;">
            <div style="font-size:13px; font-weight:900; color:#be185d; text-transform:uppercase; letter-spacing:0.04em;">HÓA ĐƠN ĐẶT HÀNG</div>
            <div style="font-size:12px; font-weight:800; margin:2px 0 4px;">Mã đơn: #${escapeHtml(o.orderCode)}</div>
            ${renderBarcodeSvg(o.orderCode, 28)}
            <div style="font-size:10.5px; color:#6b515d; margin-top:3px;">Ngày đặt: ${escapeHtml(createdStr)}</div>
          </div>
        </div>

        <!-- Customer & Parcel Care Info -->
        <div style="display:grid; grid-template-columns:1.25fr 1fr; gap:12px; margin-bottom:14px;">
          <div style="background:#fdf8fa; border:1px solid #edd6e0; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.55;">
            <div style="font-size:10.5px; font-weight:800; text-transform:uppercase; color:#9d174d; margin-bottom:3px;">THÔNG TIN KHÁCH HÀNG NHẬN ĐƠN</div>
            <div>Người nhận: <strong style="font-size:13px;">${escapeHtml(o.customerName)}</strong></div>
            <div>Điện thoại: <strong>${escapeHtml(o.customerPhone)}</strong></div>
            <div>Địa chỉ giao: <strong>${escapeHtml(fullAddress)}</strong></div>
          </div>
          <div style="background:#fdf8fa; border:1px solid #edd6e0; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.55;">
            <div style="font-size:10.5px; font-weight:800; text-transform:uppercase; color:#9d174d; margin-bottom:3px;">CHĂM SÓC GÓI HÀNG &amp; GHI CHÚ</div>
            <div>Ướp hương giấy lụa: <strong>${escapeHtml(o.scentChoice || 'Hương Đào Trắng')}</strong></div>
            <div>Quà tặng: <strong>${o.giftWrap ? 'Có gói hộp nơ tặng quà' : 'Đóng gói tiêu chuẩn'}</strong></div>
            ${o.giftWrap && o.giftCardMessage ? `<div>Lời chúc thiệp: <em>"${escapeHtml(o.giftCardMessage)}"</em></div>` : ''}
            ${o.note ? `<div>Lưu ý giao hàng: <strong>${escapeHtml(o.note)}</strong></div>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table class="p-table" style="margin-bottom:14px; border:1px solid #ead8e0;">
          <thead>
            <tr>
              <th style="text-align:center;">STT</th>
              <th>Tên sản phẩm &amp; Phân loại</th>
              <th style="text-align:center;">SL</th>
              <th style="text-align:right;">Đơn giá</th>
              <th style="text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- Totals & Payment Box -->
        <div style="display:grid; grid-template-columns:1fr 270px; gap:16px; align-items:start; margin-bottom:16px;">
          <div style="border:1.5px dashed #e2bfd0; border-radius:10px; padding:10px 12px; background:#fffafb;">
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#9d174d; margin-bottom:4px;">HÌNH THỨC &amp; TRẠNG THÁI THANH TOÁN</div>
            <div style="font-size:12.5px; font-weight:700; color:#23141b;">
              ${o.paymentMethod === 'qr' ? 'Chuyển khoản Quét mã QR' : 'Thanh toán khi nhận hàng (Ship COD)'}
            </div>
            <div style="margin-top:5px; display:inline-block; padding:4px 9px; border-radius:6px; font-size:12px; font-weight:800; background:${isPaidQr ? '#dcfce7' : '#ffe4e6'}; color:${isPaidQr ? '#166534' : '#be123c'};">
              ${isPaidQr ? '✓ ĐÃ THANH TOÁN ĐỦ — CẦN THU KHI GIAO: 0đ' : `CẦN THU KHI GIAO HÀNG: ${formatVnd(codCollect)}`}
            </div>
          </div>

          <div style="background:#fdf8fa; border:1px solid #ead5de; border-radius:10px; padding:10px 13px; font-size:12.5px; line-height:1.7;">
            <div style="display:flex; justify-content:space-between;">
              <span>Tạm tính (${totalQty} sản phẩm):</span>
              <strong>${formatVnd(subtotal)}</strong>
            </div>
            ${
              discount > 0
                ? `<div style="display:flex; justify-content:space-between; color:#be185d;">
                    <span>Ưu đãi Voucher${o.couponCode ? ` (${escapeHtml(o.couponCode)})` : ''}:</span>
                    <strong>-${formatVnd(discount)}</strong>
                  </div>`
                : ''
            }
            <div style="display:flex; justify-content:space-between;">
              <span>Phí vận chuyển:</span>
              <strong>${shipFee === 0 ? 'Miễn phí' : formatVnd(shipFee)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1.5px solid #2b151e; margin-top:5px; padding-top:6px; font-size:15px; font-weight:900; color:#be185d;">
              <span>TỔNG THANH TOÁN:</span>
              <span>${formatVnd(totalAmount)}</span>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; text-align:center; font-size:11px; margin:8px 0 24px;">
          <div>
            <strong>ĐẠI DIỆN CỬA HÀNG</strong>
            <div style="font-size:10px; color:#777;">(Ký &amp; đóng dấu xác nhận)</div>
          </div>
          <div>
            <strong>KHÁCH HÀNG / NGƯỜI NHẬN</strong>
            <div style="font-size:10px; color:#777;">(Kiểm tra gói hàng &amp; ký nhận)</div>
          </div>
        </div>

        <!-- Thank You & Care Note -->
        <div style="border-top:1px dashed #dcc2ce; padding-top:9px; text-align:center; font-size:11.5px; color:#5e424e; line-height:1.5;">
          <div style="font-weight:700; color:#9d174d;">${escapeHtml(sender.thankYouNote)}</div>
          <div style="font-size:10.5px; color:#7c636e; margin-top:2px;">Mẹo bảo quản: Nên giặt tay nhẹ nhàng hoặc cho vào túi giặt để trang phục luôn giữ phom đẹp bền lâu nhất.</div>
        </div>
      </div>
    `;
  }

  function renderPrintStudioPreview() {
    const stage = document.getElementById('print-studio-preview');
    if (!stage) return;
    const sender = getActiveSenderConfig();
    const ordersToRender =
      activePrintOrders.length > 0 ? activePrintOrders : [buildSampleOrderForPreview()];

    const sheetsHtml = ordersToRender
      .map((ord) => renderSingleOrderSheetHtml(ord, activePrintTemplate, sender))
      .join('');

    stage.innerHTML = `<style>${getPrintSheetCss(activePrintTemplate)}</style>${sheetsHtml}`;

    document.querySelectorAll('.print-tpl-btn').forEach((btn) => {
      btn.classList.toggle('btn-primary', btn.dataset.tpl === activePrintTemplate);
    });
  }

  function openPrintStudioModal(ordersList, preferredTemplate = 'invoice_a5', sampleMode = false) {
    isSamplePrintMode = sampleMode;
    activePrintOrders = Array.isArray(ordersList) && ordersList.length > 0 ? ordersList : [buildSampleOrderForPreview()];
    activePrintTemplate = preferredTemplate;

    const s = shopData?.settings || {};
    const phEl = document.getElementById('ps-sender-phone');
    const adEl = document.getElementById('ps-sender-addr');
    const ntEl = document.getElementById('ps-thank-note');
    if (phEl) phEl.value = s.senderPhone || s.zaloPhone || '0359427135';
    if (adEl) adEl.value = s.senderAddress || 'Kho NA 2HAND Boutique — Giao hàng toàn quốc';
    if (ntEl) {
      ntEl.value =
        s.invoiceThankYouNote ||
        'Cảm ơn nàng đã tin yêu NA 2HAND Boutique! Chúc nàng luôn xinh đẹp rạng rỡ trong thiết kế mới nhé ♡';
    }

    const titleEl = document.getElementById('print-studio-title');
    if (titleEl) {
      titleEl.textContent = sampleMode
        ? '👁️ Xem Trước & Cấu Hình Mẫu Phiếu In Đơn Hàng (Đơn Mẫu)'
        : activePrintOrders.length > 1
        ? `🖨️ In Hàng Loạt ${activePrintOrders.length} Đơn Hàng Đã Chọn`
        : `🖨️ In Đơn Hàng #${activePrintOrders[0].orderCode} — ${activePrintOrders[0].customerName}`;
    }

    renderPrintStudioPreview();
    const modal = document.getElementById('print-studio-modal');
    if (modal) modal.style.display = 'flex';
  }

  function executePrintWindow() {
    const sender = getActiveSenderConfig();
    const ordersToPrint =
      activePrintOrders.length > 0 ? activePrintOrders : [buildSampleOrderForPreview()];
    const sheetsHtml = ordersToPrint
      .map((ord) => renderSingleOrderSheetHtml(ord, activePrintTemplate, sender))
      .join('');

    const win = window.open('', '_blank', 'width=860,height=780');
    if (!win) {
      showToast('Trình duyệt đang chặn cửa sổ bật lên — hãy cho phép Pop-up để in đơn nhé!', true);
      return;
    }
    const docTitle =
      ordersToPrint.length === 1
        ? `Don-Hang-${ordersToPrint[0].orderCode}`
        : `In-Hang-Loat-${ordersToPrint.length}-Don`;

    const maxTargetPx =
      activePrintTemplate === 'label_a6' ? 520 : activePrintTemplate === 'thermal_k80' ? 0 : 980;

    win.document.write(`<!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(docTitle)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <style>${getPrintSheetCss(activePrintTemplate)}</style>
        <script>
          window.addEventListener('load', function () {
            var maxH = ${maxTargetPx};
            if (maxH > 0) {
              var sheets = document.querySelectorAll('.print-sheet');
              sheets.forEach(function (el) {
                var h = el.offsetHeight;
                if (h > maxH) {
                  el.style.zoom = String(Math.max(0.68, (maxH / h) * 0.97));
                }
              });
            }
            setTimeout(function () { window.focus(); window.print(); }, 220);
          });
        <\/script>
      </head>
      <body>${sheetsHtml}</body>
      </html>`);
    win.document.close();
  }

  document.querySelectorAll('.print-tpl-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activePrintTemplate = btn.dataset.tpl || 'invoice_a5';
      renderPrintStudioPreview();
    });
  });

  document.getElementById('btn-toggle-print-sender-cfg')?.addEventListener('click', () => {
    const box = document.getElementById('print-sender-quick-cfg');
    if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
  });

  ['ps-sender-phone', 'ps-sender-addr', 'ps-thank-note'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', renderPrintStudioPreview);
  });

  document.getElementById('btn-save-print-sender-cfg')?.addEventListener('click', async () => {
    const senderPhone = document.getElementById('ps-sender-phone')?.value.trim() || '0359427135';
    const senderAddress = document.getElementById('ps-sender-addr')?.value.trim() || '';
    const invoiceThankYouNote = document.getElementById('ps-thank-note')?.value.trim() || '';
    try {
      await apiFetch('/api/shop/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ senderPhone, senderAddress, invoiceThankYouNote })
      });
      if (shopData && shopData.settings) {
        shopData.settings.senderPhone = senderPhone;
        shopData.settings.senderAddress = senderAddress;
        shopData.settings.invoiceThankYouNote = invoiceThankYouNote;
      }
      populateSettingsForm();
      renderPrintStudioPreview();
      showToast('Đã lưu thông tin người gửi & lời cảm ơn trên phiếu in! 🖨️');
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('btn-execute-print')?.addEventListener('click', executePrintWindow);
  document.getElementById('btn-close-print-studio')?.addEventListener('click', () => {
    const modal = document.getElementById('print-studio-modal');
    if (modal) modal.style.display = 'none';
  });
  document.getElementById('print-studio-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'print-studio-modal') e.currentTarget.style.display = 'none';
  });

  document.getElementById('btn-preview-sample-invoice')?.addEventListener('click', () => {
    const realFirst = (shopData?.orders || [])[0];
    openPrintStudioModal(realFirst ? [realFirst] : [], 'invoice_a5', !realFirst);
  });

  document.getElementById('btn-print-selected-orders')?.addEventListener('click', () => {
    const allOrders = shopData?.orders || [];
    const chosen = allOrders.filter((o) => selectedOrderIds.has(o.id));
    if (chosen.length === 0) {
      if (allOrders.length === 0) {
        openPrintStudioModal([], 'invoice_a5', true);
        showToast('Hiện chưa có đơn đặt thật — đang mở Đơn Mẫu để bạn xem thử và in test nhé!');
        return;
      }
      showToast('Hãy tích chọn ít nhất 1 đơn hàng ở cột đầu tiên để in hàng loạt nhé!', true);
      return;
    }
    openPrintStudioModal(chosen, 'invoice_a5', false);
  });

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

    const selectAllChk = document.getElementById('ord-select-all');
    if (orders.length === 0) {
      if (selectAllChk) selectAllChk.checked = false;
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:32px; color:var(--muted);">
            Chưa có đơn đặt hàng nào khớp bộ lọc. Bạn có thể bấm nút <strong>👁️ Mẫu In &amp; Cấu Hình Phiếu Đơn</strong> phía trên để xem trước &amp; in thử Hóa đơn khách hàng / Tem dán gói hàng nhé!
          </td>
        </tr>
      `;
      renderAdminPager('orders-pagination', 1, 0, () => {});
      updateSelectedOrdersCountUI();
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

    if (selectAllChk) {
      selectAllChk.checked = pagedOrders.length > 0 && pagedOrders.every((o) => selectedOrderIds.has(o.id));
      selectAllChk.onchange = () => {
        if (selectAllChk.checked) {
          pagedOrders.forEach((o) => selectedOrderIds.add(o.id));
        } else {
          pagedOrders.forEach((o) => selectedOrderIds.delete(o.id));
        }
        updateSelectedOrdersCountUI();
        renderOrders();
      };
    }
    updateSelectedOrdersCountUI();

    tbody.innerHTML = pagedOrders
      .map((o) => {
        const dt = o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '';
        const isSelected = selectedOrderIds.has(o.id);
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
          <tr style="${isSelected ? 'background:#fff5f9;' : ''}">
            <td style="text-align:center;">
              <input type="checkbox" class="ord-row-chk" data-id="${escapeHtml(o.id)}" ${isSelected ? 'checked' : ''} />
            </td>
            <td>
              <div style="font-weight:800; color:var(--pri); font-size:0.88rem;">#${escapeHtml(o.orderCode)}</div>
              <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">${escapeHtml(dt)}</div>
              ${o.transferNote && o.paymentMethod === 'qr' ? `<div style="font-size:0.7rem; margin-top:4px; background:#fff5f9; padding:2px 6px; border-radius:6px; display:inline-block;">ND: <code>${escapeHtml(o.transferNote)}</code></div>` : ''}
              <div style="margin-top:6px; display:flex; gap:5px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-primary btn-print-invoice" data-id="${escapeHtml(o.id)}" style="padding:4px 8px; font-size:0.72rem;" title="In Hóa đơn bán lẻ gửi cho khách (A5/A4/K80)">🧾 In Hóa Đơn Khách</button>
                <button type="button" class="btn btn-sm btn-print-label" data-id="${escapeHtml(o.id)}" style="padding:4px 8px; font-size:0.72rem;" title="In Tem vận đơn dán ngoài gói hàng (A6)">📦 In Tem Gói</button>
              </div>
            </td>
            <td>
              <div style="font-weight:700;">${escapeHtml(o.customerName)}</div>
              <div style="font-size:0.78rem; color:#0f766e; font-weight:700;">${escapeHtml(o.customerPhone)}</div>
              <div style="font-size:0.74rem; color:var(--muted); max-width:250px;">${escapeHtml(o.address)}${o.district ? `, ${escapeHtml(o.district)}` : ''}${o.province ? `, ${escapeHtml(o.province)}` : ''}</div>
              ${o.shippingRegionLabel ? `<div style="font-size:0.71rem; color:#0f766e; font-weight:700; margin-top:2px;">🚚 ${escapeHtml(o.shippingRegionLabel)} • Ship khách trả: ${formatVnd(o.shippingFee || 0)}${Number(o.shippingShopSubsidy || 0) > 0 ? ` (Shop hỗ trợ ${formatVnd(o.shippingShopSubsidy)})` : ''}</div>` : ''}
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

    tbody.querySelectorAll('.ord-row-chk').forEach((chk) => {
      chk.addEventListener('change', () => {
        if (chk.checked) selectedOrderIds.add(chk.dataset.id);
        else selectedOrderIds.delete(chk.dataset.id);
        updateSelectedOrdersCountUI();
        renderOrders();
      });
    });

    tbody.querySelectorAll('.btn-print-invoice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ord = (shopData.orders || []).find((x) => x.id === btn.dataset.id);
        if (ord) openPrintStudioModal([ord], 'invoice_a5', false);
      });
    });

    tbody.querySelectorAll('.btn-print-label').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ord = (shopData.orders || []).find((x) => x.id === btn.dataset.id);
        if (ord) openPrintStudioModal([ord], 'label_a6', false);
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
        const curTag = document.getElementById('pf-tag')?.value || 'manual';
        const customLockEl = document.getElementById('pf-custom-price-lock');
        if (curTag !== 'manual' && customLockEl) customLockEl.checked = true;
      });
    });
    const syncTotalStockInputFromVariants = () => {
      if (editingVariants.length === 0) return;
      const total = editingVariants.reduce((s, v) => s + Math.max(0, Number(v.stock ?? 0)), 0);
      const stockInp = document.getElementById('pf-stock');
      if (stockInp) stockInp.value = String(total);
    };
    syncTotalStockInputFromVariants();

    box.querySelectorAll('.var-inp-stock').forEach((el) => {
      el.addEventListener('input', () => {
        editingVariants[Number(el.dataset.idx)].stock = Math.max(0, Number(el.value || 0));
        syncTotalStockInputFromVariants();
      });
    });
    box.querySelectorAll('.var-btn-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingVariants.splice(Number(btn.dataset.idx), 1);
        renderVariantEditorRows();
      });
    });
  }

  let lastLoadedFormPrice = 0;

  document.getElementById('pf-price')?.addEventListener('input', (e) => {
    const newPrice = Number(e.target.value || 0);
    const curTag = document.getElementById('pf-tag')?.value || 'manual';
    const customLockEl = document.getElementById('pf-custom-price-lock');
    if (curTag !== 'manual' && document.getElementById('pf-id')?.value && customLockEl) {
      customLockEl.checked = true;
    }
    // If all existing variants share a uniform price matching lastLoadedFormPrice, keep them synced automatically
    if (
      editingVariants.length > 0 &&
      newPrice > 0 &&
      editingVariants.every((v) => Number(v.price || 0) === lastLoadedFormPrice)
    ) {
      editingVariants.forEach((v) => {
        v.price = newPrice;
      });
      lastLoadedFormPrice = newPrice;
      renderVariantEditorRows();
    }
  });

  document.getElementById('btn-sync-price-to-vars')?.addEventListener('click', () => {
    const basePrice = Number(document.getElementById('pf-price')?.value || 0);
    if (basePrice <= 0) {
      showToast('Hãy nhập Giá bán hiện tại trước nhé!', true);
      return;
    }
    if (editingVariants.length === 0) {
      showToast('Sản phẩm này chưa có phân hệ con nào.', true);
      return;
    }
    editingVariants.forEach((v) => {
      v.price = basePrice;
      if (v.sizePrices && typeof v.sizePrices === 'object') {
        Object.keys(v.sizePrices).forEach((sk) => {
          v.sizePrices[sk] = basePrice;
        });
      }
    });
    lastLoadedFormPrice = basePrice;
    const curTag = document.getElementById('pf-tag')?.value || 'manual';
    const customLockEl = document.getElementById('pf-custom-price-lock');
    if (curTag !== 'manual' && customLockEl) customLockEl.checked = true;
    renderVariantEditorRows();
    showToast(`Đã áp giá ${formatVnd(basePrice)} xuống toàn bộ ${editingVariants.length} phân hệ mẫu! ⚡`);
  });

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

  let editingProductCustomChart = {
    name: '',
    columns: ['Size', 'Chiều cao (cm)', 'Cân nặng (kg)', 'Số đo (cm)'],
    rows: [
      ['S', '1m50 - 1m60', '42 - 48kg', 'Eo 64'],
      ['M', '1m55 - 1m65', '49 - 54kg', 'Eo 68']
    ],
    note: ''
  };

  function renderProductSizeChartOptions() {
    const sel = document.getElementById('pf-size-chart-id');
    if (!sel || !shopData) return;
    const prevVal = sel.value || 'auto';
    const charts = shopData.sizeCharts || [];
    sel.innerHTML = [
      `<option value="auto">✨ Tự động nhận diện theo tên / danh mục sản phẩm (Khuyên dùng)</option>`,
      `<option value="none">🚫 Không hiện bảng size (Phụ kiện, Sticker...)</option>`,
      ...charts.map((c) => `<option value="${escapeHtml(c.id)}">📏 ${escapeHtml(c.name)}</option>`),
      `<option value="custom">✍️ Tự tạo bảng size riêng bằng tay chỉ cho sản phẩm này</option>`
    ].join('');
    if ([...sel.options].some((o) => o.value === prevVal)) {
      sel.value = prevVal;
    }
    toggleProductCustomSizeBox();
  }

  function toggleProductCustomSizeBox() {
    const sel = document.getElementById('pf-size-chart-id');
    const wrap = document.getElementById('pf-custom-size-wrap');
    if (!sel || !wrap) return;
    wrap.style.display = sel.value === 'custom' ? 'block' : 'none';
    if (sel.value === 'custom') {
      renderProductCustomSizeTable();
    }
  }

  function renderProductCustomSizeTable() {
    const box = document.getElementById('pf-cs-table-editor');
    if (!box) return;
    const cols = editingProductCustomChart.columns;
    const rows = editingProductCustomChart.rows;

    const headCells = cols
      .map(
        (col, ci) => `
        <th style="padding:6px; background:#f8fafc;">
          <div style="display:flex; gap:4px; align-items:center;">
            <input type="text" class="input pf-cs-col-inp" data-ci="${ci}" value="${escapeHtml(col)}" style="margin-bottom:0; padding:5px 7px; font-size:0.76rem; font-weight:700; min-width:95px;" />
            ${cols.length > 2 ? `<button type="button" class="btn btn-sm btn-danger pf-cs-del-col" data-ci="${ci}" style="padding:3px 6px;">✕</button>` : ''}
          </div>
        </th>`
      )
      .join('');

    const bodyRows = rows
      .map(
        (r, ri) => `
        <tr>
          ${cols
            .map(
              (_, ci) => `
              <td style="padding:5px;">
                <input type="text" class="input pf-cs-cell-inp" data-ri="${ri}" data-ci="${ci}" value="${escapeHtml(r[ci] ?? '')}" style="margin-bottom:0; padding:5px 7px; font-size:0.77rem; min-width:85px;" />
              </td>`
            )
            .join('')}
          <td style="padding:5px; width:36px;">
            <button type="button" class="btn btn-sm btn-danger pf-cs-del-row" data-ri="${ri}">✕</button>
          </td>
        </tr>`
      )
      .join('');

    box.innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>${headCells}<th style="width:36px;"></th></tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;

    box.querySelectorAll('.pf-cs-col-inp').forEach((inp) => {
      inp.addEventListener('input', () => {
        editingProductCustomChart.columns[Number(inp.dataset.ci)] = inp.value;
      });
    });
    box.querySelectorAll('.pf-cs-cell-inp').forEach((inp) => {
      inp.addEventListener('input', () => {
        const ri = Number(inp.dataset.ri);
        const ci = Number(inp.dataset.ci);
        if (!editingProductCustomChart.rows[ri]) editingProductCustomChart.rows[ri] = [];
        editingProductCustomChart.rows[ri][ci] = inp.value;
      });
    });
    box.querySelectorAll('.pf-cs-del-col').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ci = Number(btn.dataset.ci);
        editingProductCustomChart.columns.splice(ci, 1);
        editingProductCustomChart.rows.forEach((r) => r.splice(ci, 1));
        renderProductCustomSizeTable();
      });
    });
    box.querySelectorAll('.pf-cs-del-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingProductCustomChart.rows.splice(Number(btn.dataset.ri), 1);
        renderProductCustomSizeTable();
      });
    });
  }

  document.getElementById('pf-size-chart-id')?.addEventListener('change', toggleProductCustomSizeBox);
  document.getElementById('btn-jump-size-tab')?.addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="pane-sizes"]')?.click();
  });
  document.getElementById('btn-pf-cs-add-col')?.addEventListener('click', () => {
    editingProductCustomChart.columns.push(`Cột ${editingProductCustomChart.columns.length + 1}`);
    editingProductCustomChart.rows.forEach((r) => r.push(''));
    renderProductCustomSizeTable();
  });
  document.getElementById('btn-pf-cs-add-row')?.addEventListener('click', () => {
    editingProductCustomChart.rows.push(editingProductCustomChart.columns.map(() => ''));
    renderProductCustomSizeTable();
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
    const scSel = document.getElementById('pf-size-chart-id');
    if (scSel) scSel.value = 'auto';
    editingProductCustomChart = {
      name: '',
      columns: ['Size', 'Chiều cao (cm)', 'Cân nặng (kg)', 'Số đo (cm)'],
      rows: [
        ['S', '1m50 - 1m60', '42 - 48kg', 'Eo 64'],
        ['M', '1m55 - 1m65', '49 - 54kg', 'Eo 68']
      ],
      note: ''
    };
    const csName = document.getElementById('pf-cs-name');
    const csNote = document.getElementById('pf-cs-note');
    if (csName) csName.value = '';
    if (csNote) csNote.value = '';
    toggleProductCustomSizeBox();
    editingVariants = [];
    renderVariantEditorRows();
    document.getElementById('pf-flash').checked = false;
    document.getElementById('pf-enabled').checked = true;
    const lockChk = document.getElementById('pf-locked');
    if (lockChk) lockChk.checked = false;
    const customPriceLock = document.getElementById('pf-custom-price-lock');
    if (customPriceLock) customPriceLock.checked = false;
    lastLoadedFormPrice = 0;
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
      sizeChartId: document.getElementById('pf-size-chart-id')?.value || 'auto',
      customSizeChart:
        document.getElementById('pf-size-chart-id')?.value === 'custom'
          ? {
              name: document.getElementById('pf-cs-name')?.value.trim() || `Bảng Size — ${document.getElementById('pf-name').value.trim()}`,
              columns: editingProductCustomChart.columns,
              rows: editingProductCustomChart.rows,
              note: document.getElementById('pf-cs-note')?.value.trim() || ''
            }
          : null,
      images: document
        .getElementById('pf-images')
        .value.split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      description: document.getElementById('pf-desc').value.trim(),
      isFlashSale: document.getElementById('pf-flash').checked,
      enabled: document.getElementById('pf-enabled').checked,
      isLocked: Boolean(document.getElementById('pf-locked')?.checked),
      customPriceOverride: chosenTag === 'manual' ? false : Boolean(document.getElementById('pf-custom-price-lock')?.checked)
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

  // --- BULK PERCENTAGE PRICE ADJUSTMENT CONTROLS ---
  function updateBulkPricePreviewUI() {
    const pct = Number(document.getElementById('bulk-adj-pct')?.value || 0);
    const step = Math.max(1, Number(document.getElementById('bulk-adj-round')?.value || 1000));
    const sampleBase = 110000;
    const sampleOut =
      pct === 0
        ? sampleBase
        : Math.max(1000, Math.round((sampleBase * (1 + pct / 100)) / step) * step);
    const prevEl = document.getElementById('bulk-adj-preview-text');
    if (prevEl) {
      const diffTxt =
        pct < 0
          ? ` (giảm ${Math.abs(pct)}% so với giá sàn)`
          : pct > 0
          ? ` (tăng +${pct}% so với giá sàn)`
          : ' (giữ đúng giá gốc trên sàn)';
      prevEl.textContent = `Ví dụ minh họa: SP trên sàn ${formatVnd(sampleBase)} → Giá bán trên Web: ${formatVnd(sampleOut)}${diffTxt}`;
    }
    document.querySelectorAll('.bulk-pct-preset').forEach((btn) => {
      btn.classList.toggle('btn-primary', Number(btn.dataset.pct) === pct);
    });
  }

  function populateBulkPriceControls() {
    const s = shopData?.settings || {};
    const curPct = Number(s.shopeePriceAdjustPercent || 0);
    const curRound = Number(s.shopeePriceRoundStep || 1000);
    const pctInp = document.getElementById('bulk-adj-pct');
    const roundSel = document.getElementById('bulk-adj-round');
    const crossChk = document.getElementById('bulk-adj-cross');
    const badgeEl = document.getElementById('bulk-adj-current-badge');

    if (pctInp) pctInp.value = String(curPct);
    if (roundSel) roundSel.value = String([1000, 500, 1].includes(curRound) ? curRound : 1000);
    if (crossChk) crossChk.checked = s.showPlatformPriceCrossedOut !== false;
    if (badgeEl) {
      badgeEl.textContent =
        curPct === 0
          ? 'Đang áp dụng: 0% (Bằng giá sàn)'
          : curPct < 0
          ? `Đang áp dụng: Giảm ${Math.abs(curPct)}% so với sàn`
          : `Đang áp dụng: Tăng +${curPct}% so với sàn`;
    }
    updateBulkPricePreviewUI();
  }

  document.querySelectorAll('.bulk-pct-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pctInp = document.getElementById('bulk-adj-pct');
      if (pctInp) {
        pctInp.value = btn.dataset.pct || '0';
        updateBulkPricePreviewUI();
      }
    });
  });

  document.getElementById('bulk-adj-pct')?.addEventListener('input', updateBulkPricePreviewUI);
  document.getElementById('bulk-adj-round')?.addEventListener('change', updateBulkPricePreviewUI);

  document.getElementById('btn-apply-bulk-price')?.addEventListener('click', async () => {
    const targetTag = document.getElementById('bulk-adj-target')?.value || 'shopee';
    const adjustPercent = Number(document.getElementById('bulk-adj-pct')?.value || 0);
    const roundStep = Number(document.getElementById('bulk-adj-round')?.value || 1000);
    const showPlatformPriceCrossedOut = Boolean(document.getElementById('bulk-adj-cross')?.checked);
    const respectManualOverrides = Boolean(document.getElementById('bulk-adj-respect-manual')?.checked);

    const btn = document.getElementById('btn-apply-bulk-price');
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang cập nhật giá...';
    }
    try {
      const res = await apiFetch('/api/shop/admin/products/bulk-price-adjust', {
        method: 'POST',
        body: JSON.stringify({
          targetTag,
          adjustPercent,
          roundStep,
          showPlatformPriceCrossedOut,
          respectManualOverrides
        })
      });
      showToast(res.message || 'Đã cập nhật giá hàng loạt thành công! 💰');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      }
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
            ? `<div style="font-size:0.7rem; color:#be123c; font-weight:700; margin-top:2px;">⚠️ Thiếu ảnh sản phẩm — hãy bấm đồng bộ lại từ Shopee.</div>`
            : '';

        return `
          <tr style="${locked ? 'background:#fff5f7; opacity:0.86;' : ''}">
            <td>
              <img src="${escapeHtml(img)}" style="width:48px; height:48px; aspect-ratio:1/1; border-radius:11px; object-fit:contain; background:#ffffff; border:1px solid var(--border);" />
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
              ${cloned && Number(p.platformBasePrice) > 0 && Number(p.platformBasePrice) !== Number(p.price) ? `<div style="font-size:0.69rem; color:#9a3412;">Giá sàn: ${formatVnd(p.platformBasePrice)}${Number(p.platformMaxPrice) > Number(p.platformBasePrice) ? ` – ${formatVnd(p.platformMaxPrice)}` : ''}</div>` : ''}
              ${p.customPriceOverride ? `<div style="margin-top:2px;"><span class="badge" style="background:#fef3c7; color:#92400e; font-size:0.66rem; padding:2px 6px;">📌 Giá riêng</span></div>` : ''}
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
        lastLoadedFormPrice = Number(prod.price || 0);
        document.getElementById('pf-orig-price').value = prod.originalPrice || 0;
        const customPriceLock = document.getElementById('pf-custom-price-lock');
        if (customPriceLock) customPriceLock.checked = Boolean(prod.customPriceOverride);
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
        const scSel = document.getElementById('pf-size-chart-id');
        if (scSel) {
          renderProductSizeChartOptions();
          scSel.value = prod.sizeChartId || 'auto';
          if (prod.sizeChartId === 'custom' && prod.customSizeChart) {
            editingProductCustomChart = JSON.parse(JSON.stringify(prod.customSizeChart));
            document.getElementById('pf-cs-name').value = prod.customSizeChart.name || '';
            document.getElementById('pf-cs-note').value = prod.customSizeChart.note || '';
          }
          toggleProductCustomSizeBox();
        }
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
      const bookmarkletHref = buildLiveBookmarkletHref(window.location.origin, syncKey);

      box.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(165px, 1fr)); gap:10px; margin-bottom:14px;">
          <div style="background:#fff5f9; border:1px solid #f7c6da; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:var(--muted); font-weight:700;">🎀 Hàng tự đăng</div>
            <div style="font-size:1.25rem; font-weight:800; color:#be185d;">${c.manual || 0} SP</div>
            <div style="font-size:0.7rem; color:#15803d;">Giữ riêng trên web</div>
          </div>
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:#9a3412; font-weight:700;">🧡 Hàng Shopee</div>
            <div style="font-size:1.25rem; font-weight:800; color:#c2410c;">${c.shopee || 0} SP</div>
            <div style="font-size:0.7rem; color:#9a3412;">Đã đủ thông tin: ${sh.deepSyncedComplete || 0}/${c.shopee || 0} SP</div>
          </div>
          <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:#6b21a8; font-weight:700;">🎵 Hàng TikTok</div>
            <div style="font-size:1.25rem; font-weight:800; color:#7e22ce;">${c.tiktok || 0} SP</div>
            <div style="font-size:0.7rem; color:#6b21a8;">Đồng bộ từ TikTok Shop</div>
          </div>
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:10px 12px;">
            <div style="font-size:0.73rem; color:#1d4ed8; font-weight:700;">💙 Nguồn khác</div>
            <div style="font-size:1.25rem; font-weight:800; color:#1e40af;">${(c.lazada || 0) + (c.other || 0)} SP</div>
            <div style="font-size:0.7rem; color:#1d4ed8;">Lazada &amp; khác</div>
          </div>
        </div>

        <div style="padding:14px 16px; border-radius:14px; border:1.5px solid ${needResyncCount > 0 ? '#fda4af' : '#bbf7d0'}; background:${needResyncCount > 0 ? '#fff1f2' : '#f0fdf4'};">
          <div style="font-weight:800; color:${needResyncCount > 0 ? '#be123c' : '#15803d'}; margin-bottom:6px;">
            ${
              needResyncCount > 0
                ? `⚠️ Có ${needResyncCount}/${c.shopee || 0} sản phẩm Shopee cần bấm đồng bộ lại để cập nhật đủ hình ảnh và số lượng kho.`
                : `✅ Toàn bộ ${c.shopee || 0}/${c.shopee || 0} sản phẩm Shopee trên web đã cập nhật đầy đủ hình ảnh, phân loại và số lượng tồn kho!`
            }
          </div>
          <div style="font-size:0.79rem; color:var(--text); line-height:1.55; margin-bottom:10px;">
            💡 <strong>Hướng dẫn nhanh:</strong> Giữ chuột kéo nút hồng <strong>🪄 Đồng Bộ Shopee</strong> bên dưới thả lên <strong>Thanh dấu trang</strong> phía trên trình duyệt (chỉ cần kéo 1 lần). Sau đó mở trang Shop Shopee và bấm vào dấu trang đó để tự động cập nhật sản phẩm.
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="https://shopee.vn/na2hand3" target="_blank" rel="noopener" class="btn btn-sm">🔗 Mở Shop Shopee</a>
            <a id="audit-bookmarklet-btn" href="${escapeHtml(bookmarkletHref)}" class="btn btn-sm btn-primary" title="Giữ chuột kéo nút này thả lên Thanh dấu trang của trình duyệt">
              🪄 Đồng Bộ Shopee (Kéo lên Thanh Dấu Trang)
            </a>
          </div>
        </div>
      `;

      box.querySelector('#audit-bookmarklet-btn')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        alert('Cách gắn 1 lần duy nhất:\n1. Bấm Ctrl + Shift + B để hiện Thanh dấu trang (nếu đang ẩn).\n2. Giữ chuột KÉO nút hồng "🪄 Đồng Bộ Shopee" thả lên Thanh dấu trang.\n3. Mở trang Shop Shopee rồi bấm vào dấu trang vừa lưu để tự động kéo sản phẩm về web!');
      });
    } catch {
      box.textContent = 'Không thể tải thống kê sản phẩm.';
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
        <span style="font-size:0.78rem; color:var(--muted);">Đã lưu tự động vào cửa hàng.</span>
        <button type="button" class="btn btn-sm btn-primary" id="btn-jump-to-products">👗 Xem Danh Sách Sản Phẩm</button>
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
      const bookmarkletHref = buildLiveBookmarkletHref(window.location.origin, syncKey);

      logBox.innerHTML = `
        <div style="margin-bottom:10px;">
          <strong style="color:#9d174d;">✨ Địa chỉ Shop cần đồng bộ:</strong>
          <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" style="color:var(--pri); font-weight:800; word-break:break-all;">${escapeHtml(finalShopUrl)} ↗</a>
        </div>

        <div style="background:linear-gradient(135deg,#fff0f6,#fdf4ff); border:1.5px solid #f0abc6; border-radius:14px; padding:14px 16px;">
          <div style="font-weight:800; color:#be185d; font-size:0.88rem; margin-bottom:6px;">
            🪄 3 bước đồng bộ sản phẩm bằng Thanh dấu trang:
          </div>
          <div style="font-size:0.81rem; color:var(--text); margin-bottom:12px; line-height:1.6;">
            <strong>Bước 1 (chỉ làm lần đầu):</strong> Giữ chuột kéo nút hồng <strong>🪄 Đồng Bộ Shopee</strong> bên dưới thả lên <strong>Thanh dấu trang</strong> phía trên trình duyệt.<br/>
            <strong>Bước 2:</strong> Bấm <strong>🔗 Mở Trang Shop</strong> để mở trang trên trình duyệt.<br/>
            <strong>Bước 3:</strong> Bấm vào nút <strong>🪄 Đồng Bộ Shopee</strong> trên thanh dấu trang, chờ vài giây sản phẩm sẽ tự động cập nhật về web!
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="${escapeHtml(finalShopUrl)}" target="_blank" rel="noopener" class="btn btn-sm">
              🔗 1. Mở Trang Shop
            </a>
            <a id="deep-bookmarklet-btn" href="${escapeHtml(bookmarkletHref)}" class="btn btn-sm btn-primary" title="Giữ chuột kéo nút này thả lên Thanh dấu trang của trình duyệt">
              🪄 2. Đồng Bộ Shopee (Kéo lên Thanh Dấu Trang)
            </a>
          </div>
        </div>
      `;

      logBox.querySelector('#deep-bookmarklet-btn')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        alert(
          'Cách gắn 1 lần duy nhất:\n1. Bấm Ctrl + Shift + B để hiện Thanh dấu trang (nếu đang ẩn).\n2. Giữ chuột KÉO nút hồng "🪄 Đồng Bộ Shopee" thả lên Thanh dấu trang.\n3. Mở trang Shop Shopee rồi bấm vào dấu trang vừa lưu để tự động kéo sản phẩm về web!'
        );
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

  // --- 5. SIZE CHARTS BUILDER (QUẦN LOE / JEAN, ÁO HOODIE & MANUAL CHARTS) ---
  let editingSizeCharts = [];
  let selectedAdminChartIdx = 0;

  function initSizeChartsManagerFromStore() {
    if (!shopData) return;
    editingSizeCharts = JSON.parse(JSON.stringify(shopData.sizeCharts || []));
    if (selectedAdminChartIdx >= editingSizeCharts.length) {
      selectedAdminChartIdx = Math.max(0, editingSizeCharts.length - 1);
    }
    renderSizeChartsManagerUI();
  }

  function syncCurrentChartMetaFromInputs() {
    const cur = editingSizeCharts[selectedAdminChartIdx];
    if (!cur) return;
    const nEl = document.getElementById('sc-name');
    const kEl = document.getElementById('sc-keywords');
    const noteEl = document.getElementById('sc-note');
    const diagEl = document.getElementById('sc-diagram-url');
    if (nEl) cur.name = nEl.value;
    if (kEl) cur.autoKeywords = kEl.value;
    if (noteEl) cur.note = noteEl.value;
    if (diagEl) cur.diagramUrl = diagEl.value.trim();
  }

  function renderSizeChartsManagerUI() {
    const bar = document.getElementById('size-charts-selector-bar');
    const panel = document.getElementById('size-chart-editor-panel');
    if (!bar || !panel) return;

    if (editingSizeCharts.length === 0) {
      bar.innerHTML = `<span style="font-size:0.82rem; color:var(--muted);">Chưa có bảng size nào — hãy bấm "+ Tạo Bảng Size Thủ Công Mới" hoặc "Khôi phục mẫu gốc".</span>`;
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';

    bar.innerHTML = editingSizeCharts
      .map(
        (c, idx) => `
        <button type="button" class="btn btn-sm ${idx === selectedAdminChartIdx ? 'btn-primary' : ''}" data-scidx="${idx}">
          📏 ${escapeHtml(c.name || `Bảng Size #${idx + 1}`)} (${(c.rows || []).length} size)
        </button>`
      )
      .join('');

    bar.querySelectorAll('button[data-scidx]').forEach((b) => {
      b.addEventListener('click', () => {
        syncCurrentChartMetaFromInputs();
        selectedAdminChartIdx = Number(b.dataset.scidx);
        renderSizeChartsManagerUI();
      });
    });

    const cur = editingSizeCharts[selectedAdminChartIdx];
    document.getElementById('sc-name').value = cur.name || '';
    document.getElementById('sc-keywords').value = cur.autoKeywords || '';
    document.getElementById('sc-note').value = cur.note || '';
    document.getElementById('sc-diagram-url').value = cur.diagramUrl || '';
    const prevImg = document.getElementById('sc-diagram-preview');
    if (prevImg) {
      prevImg.src = cur.diagramUrl || '/images/size-diagram-pants.svg';
      prevImg.style.opacity = cur.diagramUrl ? '1' : '0.28';
    }

    renderActiveSpreadsheetTable();
  }

  function renderActiveSpreadsheetTable() {
    const box = document.getElementById('sc-spreadsheet-box');
    const cur = editingSizeCharts[selectedAdminChartIdx];
    if (!box || !cur) return;

    if (!Array.isArray(cur.columns) || cur.columns.length === 0) {
      cur.columns = ['Size', 'Thông số'];
    }
    if (!Array.isArray(cur.rows)) cur.rows = [];

    const headHtml = cur.columns
      .map(
        (col, ci) => `
        <th style="background:#23131b; padding:7px 6px; min-width:118px;">
          <div style="display:flex; gap:4px; align-items:center;">
            <input type="text" class="input sc-col-input" data-ci="${ci}" value="${escapeHtml(col)}" style="margin-bottom:0; padding:5px 8px; font-size:0.76rem; font-weight:700; background:#fff; color:#2b151e;" />
            ${cur.columns.length > 2 ? `<button type="button" class="btn btn-sm btn-danger sc-del-col-btn" data-ci="${ci}" title="Xóa cột này" style="padding:4px 7px;">✕</button>` : ''}
          </div>
        </th>`
      )
      .join('');

    const rowsHtml = cur.rows
      .map(
        (row, ri) => `
        <tr>
          ${cur.columns
            .map(
              (_, ci) => `
              <td style="padding:5px 6px;">
                <input type="text" class="input sc-cell-input" data-ri="${ri}" data-ci="${ci}" value="${escapeHtml(row[ci] ?? '')}" style="margin-bottom:0; padding:6px 8px; font-size:0.8rem; font-weight:${ci === 0 ? '700' : '500'};" placeholder="..." />
              </td>`
            )
            .join('')}
          <td style="padding:5px; width:42px; text-align:center;">
            <button type="button" class="btn btn-sm btn-danger sc-del-row-btn" data-ri="${ri}" title="Xóa dòng này">✕</button>
          </td>
        </tr>`
      )
      .join('');

    box.innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>${headHtml}<th style="background:#23131b; color:#fff; width:42px; text-align:center; font-size:0.72rem;">Xóa</th></tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="${cur.columns.length + 1}" style="text-align:center; padding:16px; color:var(--muted);">Chưa có dòng nào — bấm "+ Thêm Dòng Size Mới" nhé!</td></tr>`}</tbody>
      </table>
    `;

    box.querySelectorAll('.sc-col-input').forEach((inp) => {
      inp.addEventListener('input', () => {
        cur.columns[Number(inp.dataset.ci)] = inp.value;
      });
    });
    box.querySelectorAll('.sc-cell-input').forEach((inp) => {
      inp.addEventListener('input', () => {
        const ri = Number(inp.dataset.ri);
        const ci = Number(inp.dataset.ci);
        if (!cur.rows[ri]) cur.rows[ri] = [];
        cur.rows[ri][ci] = inp.value;
      });
    });
    box.querySelectorAll('.sc-del-col-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ci = Number(btn.dataset.ci);
        cur.columns.splice(ci, 1);
        cur.rows.forEach((r) => r.splice(ci, 1));
        renderActiveSpreadsheetTable();
      });
    });
    box.querySelectorAll('.sc-del-row-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cur.rows.splice(Number(btn.dataset.ri), 1);
        renderSizeChartsManagerUI();
      });
    });
  }

  ['sc-name', 'sc-keywords', 'sc-note', 'sc-diagram-url'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      syncCurrentChartMetaFromInputs();
      if (id === 'sc-diagram-url') {
        const prevImg = document.getElementById('sc-diagram-preview');
        const v = document.getElementById('sc-diagram-url').value.trim();
        if (prevImg) {
          prevImg.src = v || '/images/size-diagram-pants.svg';
          prevImg.style.opacity = v ? '1' : '0.28';
        }
      }
    });
  });

  document.getElementById('sc-diagram-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Đang tải ảnh sơ đồ đo size... ⏳');
    try {
      const url = await uploadFileToServer(file);
      document.getElementById('sc-diagram-url').value = url;
      syncCurrentChartMetaFromInputs();
      renderSizeChartsManagerUI();
      showToast('Đã tải ảnh minh họa thành công! Nhớ bấm Lưu Cấu Hình Bảng Size nhé ✨');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('btn-sc-add-col')?.addEventListener('click', () => {
    const cur = editingSizeCharts[selectedAdminChartIdx];
    if (!cur) return;
    syncCurrentChartMetaFromInputs();
    cur.columns.push(`Thông số ${cur.columns.length}`);
    cur.rows.forEach((r) => r.push(''));
    renderActiveSpreadsheetTable();
  });

  document.getElementById('btn-sc-add-row')?.addEventListener('click', () => {
    const cur = editingSizeCharts[selectedAdminChartIdx];
    if (!cur) return;
    syncCurrentChartMetaFromInputs();
    cur.rows.push(cur.columns.map((_, i) => (i === 0 ? `Size ${cur.rows.length + 1}` : '')));
    renderSizeChartsManagerUI();
  });

  document.getElementById('btn-add-new-size-chart')?.addEventListener('click', () => {
    syncCurrentChartMetaFromInputs();
    editingSizeCharts.push({
      id: `chart_${Date.now()}`,
      name: `Bảng Size Tùy Chỉnh Mới #${editingSizeCharts.length + 1}`,
      autoKeywords: '',
      columns: ['Size', 'Chiều cao (cm)', 'Cân nặng (kg)', 'Rộng / Ngực (cm)', 'Eo (cm)', 'Dài (cm)'],
      rows: [
        ['S', '1m50 - 1m60', '42 - 48kg', '84', '64', '60'],
        ['M', '1m55 - 1m65', '49 - 54kg', '88', '68', '62'],
        ['L', '1m60 - 1m70', '55 - 62kg', '92', '72', '64']
      ],
      diagramUrl: '',
      note: 'Số đo trải phẳng thực tế (cm), có thể chênh lệch nhẹ 1-2cm.'
    });
    selectedAdminChartIdx = editingSizeCharts.length - 1;
    renderSizeChartsManagerUI();
    showToast('Đã tạo bảng size thủ công mới! Hãy chỉnh thông số rồi bấm Lưu nhé 📏');
  });

  document.getElementById('btn-dup-size-chart')?.addEventListener('click', () => {
    const cur = editingSizeCharts[selectedAdminChartIdx];
    if (!cur) return;
    syncCurrentChartMetaFromInputs();
    const copy = JSON.parse(JSON.stringify(cur));
    copy.id = `chart_${Date.now()}`;
    copy.name = `${cur.name} (Bản sao)`;
    editingSizeCharts.push(copy);
    selectedAdminChartIdx = editingSizeCharts.length - 1;
    renderSizeChartsManagerUI();
    showToast('Đã nhân bản bảng size!');
  });

  document.getElementById('btn-delete-cur-size-chart')?.addEventListener('click', () => {
    if (editingSizeCharts.length === 0) return;
    const cur = editingSizeCharts[selectedAdminChartIdx];
    if (!confirm(`Bạn chắc chắn muốn xóa "${cur?.name || 'Bảng size này'}"?`)) return;
    editingSizeCharts.splice(selectedAdminChartIdx, 1);
    selectedAdminChartIdx = Math.max(0, selectedAdminChartIdx - 1);
    renderSizeChartsManagerUI();
  });

  document.getElementById('btn-save-all-size-charts')?.addEventListener('click', async () => {
    syncCurrentChartMetaFromInputs();
    try {
      const res = await apiFetch('/api/shop/admin/size-charts', {
        method: 'PUT',
        body: JSON.stringify({ sizeCharts: editingSizeCharts })
      });
      showToast(res.message || 'Đã lưu toàn bộ Bảng Size thành công! 📏');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('btn-reset-default-charts')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/shop/admin/size-charts/reset-defaults', { method: 'POST' });
      showToast(res.message || 'Đã khôi phục mẫu chuẩn Quần Loe & Áo Hoodie!');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // --- 6. HERO POLAROID, "GÓC PHỐI ĐỒ" STUDIO, QR PAYMENT & STORE SETTINGS ---
  let editingLookbookSets = [];
  let activePinEditTarget = {}; // { [setIdx]: pinIdx }

  function buildDefaultLookbookSetsSeed() {
    const prods = shopData?.products || [];
    const p0 = prods[0]?.id || '';
    const p1 = prods[Math.min(5, Math.max(0, prods.length - 1))]?.id || p0;
    const p2 = prods[Math.min(1, Math.max(0, prods.length - 1))]?.id || p0;
    const p3 = prods[Math.min(4, Math.max(0, prods.length - 1))]?.id || p0;
    return [
      {
        id: 'look-1',
        tabLabel: 'Set Hẹn Hò Cuối Tuần',
        title: 'Look 01 — Hẹn Hò Cuối Tuần Dịu Dàng',
        description: 'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.',
        photo: '/media/bio-link/girlfriend-1.jpg',
        pins: [
          { productId: p0, x: 48, y: 42 },
          { productId: p1, x: 66, y: 68 }
        ]
      },
      {
        id: 'look-2',
        tabLabel: 'Set Tiểu Thư Dạo Phố',
        title: 'Look 02 — Dạo Phố Năng Động Ngọt Ngào',
        description: 'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.',
        photo: '/media/bio-link/girlfriend-2.jpg',
        pins: [
          { productId: p2, x: 46, y: 45 },
          { productId: p3, x: 58, y: 74 }
        ]
      }
    ];
  }

  function renderLookbookSetsEditor() {
    const wrap = document.getElementById('st-lookbook-sets-editor');
    if (!wrap || !shopData) return;
    const allProds = (shopData.products || []).filter((p) => !p.isLocked);

    wrap.innerHTML = editingLookbookSets
      .map((s, sIdx) => {
        const pins = Array.isArray(s.pins) ? s.pins : [];
        const selPinIdx = Math.min(activePinEditTarget[sIdx] || 0, Math.max(0, pins.length - 1));
        const pinsDotsHtml = pins
          .map(
            (pin, pIdx) => `
            <span
              data-sidx="${sIdx}"
              data-pidx="${pIdx}"
              class="lb-admin-pin"
              style="position:absolute; left:${Number(pin.x ?? 50)}%; top:${Number(pin.y ?? 50)}%; transform:translate(-50%,-50%); width:26px; height:26px; border-radius:50%; background:${pIdx === selPinIdx ? '#e14b85' : '#2b151e'}; color:#fff; font-size:0.74rem; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.28); cursor:pointer;"
              title="Chấm món số ${pIdx + 1}"
            >${pIdx + 1}</span>`
          )
          .join('');

        const pinsRowsHtml = pins
          .map((pin, pIdx) => {
            const optsHtml = allProds
              .map(
                (pr) =>
                  `<option value="${escapeHtml(pr.id)}" ${pr.id === pin.productId ? 'selected' : ''}>${escapeHtml(pr.name.slice(0, 48))} (${formatVnd(pr.price)})</option>`
              )
              .join('');
            return `
              <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; background:#fff; padding:7px 8px; border-radius:10px; border:1.5px solid ${pIdx === selPinIdx ? '#e14b85' : 'var(--border)'}; margin-bottom:6px;">
                <button type="button" class="btn btn-sm lb-select-pin-btn ${pIdx === selPinIdx ? 'btn-primary' : ''}" data-sidx="${sIdx}" data-pidx="${pIdx}" title="Chọn chấm này rồi click lên ảnh bên trái để đặt tọa độ">
                  🎯 Chấm #${pIdx + 1}
                </button>
                <select class="select lb-pin-prod" data-sidx="${sIdx}" data-pidx="${pIdx}" style="flex:1 1 200px; margin-bottom:0; padding:6px 8px; font-size:0.78rem;">
                  ${optsHtml}
                </select>
                <span style="font-size:0.72rem; color:var(--muted);">X%:</span>
                <input type="number" min="5" max="95" class="input lb-pin-x" data-sidx="${sIdx}" data-pidx="${pIdx}" value="${Math.round(Number(pin.x ?? 50))}" style="width:58px; margin-bottom:0; padding:5px 7px; font-size:0.76rem;" />
                <span style="font-size:0.72rem; color:var(--muted);">Y%:</span>
                <input type="number" min="5" max="95" class="input lb-pin-y" data-sidx="${sIdx}" data-pidx="${pIdx}" value="${Math.round(Number(pin.y ?? 50))}" style="width:58px; margin-bottom:0; padding:5px 7px; font-size:0.76rem;" />
                ${pins.length > 1 ? `<button type="button" class="btn btn-sm btn-danger lb-del-pin" data-sidx="${sIdx}" data-pidx="${pIdx}">✕</button>` : ''}
              </div>
            `;
          })
          .join('');

        return `
          <div style="background:#fff; border:1.5px solid var(--border); border-radius:16px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
              <strong style="color:var(--pri); font-size:0.9rem;">✨ Set Phối Đồ #${sIdx + 1}</strong>
              ${editingLookbookSets.length > 1 ? `<button type="button" class="btn btn-sm btn-danger lb-del-set" data-sidx="${sIdx}">🗑️ Xóa Set này</button>` : ''}
            </div>

            <div style="display:grid; grid-template-columns: minmax(180px, 230px) minmax(0, 1fr); gap:14px; align-items:start;">
              <div>
                <div class="lb-photo-click-stage" data-sidx="${sIdx}" style="position:relative; width:100%; aspect-ratio:3/3.6; border-radius:14px; overflow:hidden; border:1.5px solid var(--border); cursor:crosshair; background:#f8fafc;" title="Click trực tiếp lên ảnh để đặt vị trí chấm đang chọn!">
                  <img src="${escapeHtml(s.photo || '/media/bio-link/girlfriend-1.jpg')}" alt="Lookbook" style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none;" />
                  ${pinsDotsHtml}
                </div>
                <div style="font-size:0.71rem; color:var(--pri); font-weight:700; text-align:center; margin:5px 0;">
                  👆 Bấm lên ảnh để dời Chấm #${selPinIdx + 1}
                </div>
                <input type="text" class="input lb-set-photo" data-sidx="${sIdx}" value="${escapeHtml(s.photo || '')}" placeholder="URL ảnh mẫu..." style="margin-bottom:5px; padding:6px 8px; font-size:0.75rem;" />
                <label class="btn btn-sm" style="width:100%; cursor:pointer;">
                  📤 Tải ảnh Set #${sIdx + 1} lên
                  <input type="file" class="lb-set-photo-file" data-sidx="${sIdx}" accept="image/*" style="display:none;" />
                </label>
              </div>

              <div>
                <div class="grid-2">
                  <div>
                    <label class="label">Tên nút Tab chuyển Set</label>
                    <input type="text" class="input lb-set-tab" data-sidx="${sIdx}" value="${escapeHtml(s.tabLabel || '')}" placeholder="VD: Set Hẹn Hò Cuối Tuần" />
                  </div>
                  <div>
                    <label class="label">Tiêu đề hiển thị trong khung</label>
                    <input type="text" class="input lb-set-title" data-sidx="${sIdx}" value="${escapeHtml(s.title || '')}" placeholder="VD: Look 01 — Hẹn Hò Cuối Tuần Dịu Dàng" />
                  </div>
                </div>
                <div>
                  <label class="label">Dòng mô tả ngắn của Set</label>
                  <input type="text" class="input lb-set-desc" data-sidx="${sIdx}" value="${escapeHtml(s.description || '')}" placeholder="Phối sẵn tông màu hài hòa..." />
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <label class="label" style="margin-bottom:0;">Các món sản phẩm gắn trên ảnh (${pins.length} món):</label>
                  <button type="button" class="btn btn-sm lb-add-pin" data-sidx="${sIdx}">+ Thêm món vào Set</button>
                </div>
                ${pinsRowsHtml}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    wrap.querySelectorAll('.lb-set-tab').forEach((inp) => {
      inp.addEventListener('input', () => {
        editingLookbookSets[Number(inp.dataset.sidx)].tabLabel = inp.value;
      });
    });
    wrap.querySelectorAll('.lb-set-title').forEach((inp) => {
      inp.addEventListener('input', () => {
        editingLookbookSets[Number(inp.dataset.sidx)].title = inp.value;
      });
    });
    wrap.querySelectorAll('.lb-set-desc').forEach((inp) => {
      inp.addEventListener('input', () => {
        editingLookbookSets[Number(inp.dataset.sidx)].description = inp.value;
      });
    });
    wrap.querySelectorAll('.lb-set-photo').forEach((inp) => {
      inp.addEventListener('change', () => {
        editingLookbookSets[Number(inp.dataset.sidx)].photo = inp.value.trim();
        renderLookbookSetsEditor();
      });
    });
    wrap.querySelectorAll('.lb-set-photo-file').forEach((fInp) => {
      fInp.addEventListener('change', async (ev) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        const sIdx = Number(fInp.dataset.sidx);
        showToast('Đang tải ảnh phối đồ lên... ⏳');
        try {
          const url = await uploadFileToServer(file);
          editingLookbookSets[sIdx].photo = url;
          renderLookbookSetsEditor();
          showToast('Đã tải ảnh phối đồ lên! Nhớ bấm Lưu Ngay nhé 💖');
        } catch (err) {
          showToast(err.message, true);
        } finally {
          ev.target.value = '';
        }
      });
    });

    wrap.querySelectorAll('.lb-select-pin-btn, .lb-admin-pin').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        activePinEditTarget[Number(el.dataset.sidx)] = Number(el.dataset.pidx);
        renderLookbookSetsEditor();
      });
    });

    wrap.querySelectorAll('.lb-photo-click-stage').forEach((stage) => {
      stage.addEventListener('click', (ev) => {
        const sIdx = Number(stage.dataset.sidx);
        const setObj = editingLookbookSets[sIdx];
        if (!setObj || !Array.isArray(setObj.pins) || setObj.pins.length === 0) return;
        const pIdx = Math.min(activePinEditTarget[sIdx] || 0, setObj.pins.length - 1);
        const rect = stage.getBoundingClientRect();
        const xPct = Math.min(92, Math.max(8, Math.round(((ev.clientX - rect.left) / rect.width) * 100)));
        const yPct = Math.min(92, Math.max(8, Math.round(((ev.clientY - rect.top) / rect.height) * 100)));
        setObj.pins[pIdx].x = xPct;
        setObj.pins[pIdx].y = yPct;
        renderLookbookSetsEditor();
      });
    });

    wrap.querySelectorAll('.lb-pin-prod').forEach((sel) => {
      sel.addEventListener('change', () => {
        editingLookbookSets[Number(sel.dataset.sidx)].pins[Number(sel.dataset.pidx)].productId = sel.value;
      });
    });
    wrap.querySelectorAll('.lb-pin-x').forEach((inp) => {
      inp.addEventListener('input', () => {
        editingLookbookSets[Number(inp.dataset.sidx)].pins[Number(inp.dataset.pidx)].x = Number(inp.value || 50);
      });
    });
    wrap.querySelectorAll('.lb-pin-y').forEach((inp) => {
      inp.addEventListener('input', () => {
        editingLookbookSets[Number(inp.dataset.sidx)].pins[Number(inp.dataset.pidx)].y = Number(inp.value || 50);
      });
    });
    wrap.querySelectorAll('.lb-add-pin').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.dataset.sidx);
        const firstProdId = allProds[0]?.id || '';
        editingLookbookSets[sIdx].pins.push({ productId: firstProdId, x: 50, y: 55 });
        activePinEditTarget[sIdx] = editingLookbookSets[sIdx].pins.length - 1;
        renderLookbookSetsEditor();
      });
    });
    wrap.querySelectorAll('.lb-del-pin').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.dataset.sidx);
        editingLookbookSets[sIdx].pins.splice(Number(btn.dataset.pidx), 1);
        activePinEditTarget[sIdx] = 0;
        renderLookbookSetsEditor();
      });
    });
    wrap.querySelectorAll('.lb-del-set').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingLookbookSets.splice(Number(btn.dataset.sidx), 1);
        renderLookbookSetsEditor();
      });
    });
  }

  document.getElementById('btn-add-lookbook-set')?.addEventListener('click', () => {
    const firstProdId = (shopData?.products || [])[0]?.id || '';
    editingLookbookSets.push({
      id: `look_${Date.now()}`,
      tabLabel: `Set Phối #${editingLookbookSets.length + 1}`,
      title: `Look 0${editingLookbookSets.length + 1} — Gợi Ý Phối Đồ Mới`,
      description: 'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.',
      photo: '/media/bio-link/girlfriend-1.jpg',
      pins: [{ productId: firstProdId, x: 50, y: 48 }]
    });
    renderLookbookSetsEditor();
  });

  // --- 3-REGION SHIPPING & HIDDEN SELLER/BUYER SPLIT WIRING ---
  function refreshShippingRegionSummaryUI() {
    ['bac', 'trung', 'nam'].forEach((reg) => {
      const fallbackFee = reg === 'bac' ? 30000 : reg === 'trung' ? 40000 : 50000;
      const baseFee = Math.max(0, Number(document.getElementById(`st-ship-${reg}`)?.value ?? fallbackFee));
      const shopPct = Math.min(100, Math.max(0, Number(document.getElementById(`st-split-shop-${reg}`)?.value ?? 0)));
      const custPct = Math.max(0, 100 - shopPct);
      const custFee = Math.max(0, Math.round((baseFee * custPct) / 100));
      const shopSub = Math.max(0, baseFee - custFee);

      const noteEl = document.getElementById(`st-ship-note-${reg}`);
      if (noteEl) {
        noteEl.textContent =
          shopPct > 0
            ? `Khách trả trên giỏ hàng: ${formatVnd(custFee)} (Shop chịu ${shopPct}% = ${formatVnd(shopSub)})`
            : `Khách trả trên giỏ hàng: ${formatVnd(custFee)}`;
      }
      const sumEl = document.getElementById(`st-split-summary-${reg}`);
      if (sumEl) {
        sumEl.textContent = `👉 Khách trả: ${formatVnd(custFee)} (${custPct}%) • Shop hỗ trợ: ${formatVnd(shopSub)} (${shopPct}%)`;
      }
      document.querySelectorAll(`.ship-ratio-preset[data-reg="${reg}"]`).forEach((btn) => {
        btn.classList.toggle('btn-primary', Number(btn.dataset.shop) === shopPct);
      });
    });
  }

  document.getElementById('btn-toggle-hidden-ship-split')?.addEventListener('click', (e) => {
    const panel = document.getElementById('hidden-ship-split-panel');
    if (!panel) return;
    const willOpen = panel.style.display === 'none';
    panel.style.display = willOpen ? 'block' : 'none';
    e.currentTarget.textContent = willOpen
      ? '🔓 Thu gọn cấu hình ẩn: Tỉ lệ chịu phí ship 2 bên'
      : '🔒 Mở cấu hình ẩn: Tỉ lệ chịu phí ship 2 bên';
  });

  ['bac', 'trung', 'nam'].forEach((reg) => {
    document.getElementById(`st-ship-${reg}`)?.addEventListener('input', refreshShippingRegionSummaryUI);
    document.getElementById(`st-split-shop-${reg}`)?.addEventListener('input', (e) => {
      const sPct = Math.min(100, Math.max(0, Number(e.target.value || 0)));
      const cInp = document.getElementById(`st-split-cust-${reg}`);
      if (cInp) cInp.value = String(Math.max(0, 100 - sPct));
      refreshShippingRegionSummaryUI();
    });
    document.getElementById(`st-split-cust-${reg}`)?.addEventListener('input', (e) => {
      const cPct = Math.min(100, Math.max(0, Number(e.target.value || 0)));
      const sInp = document.getElementById(`st-split-shop-${reg}`);
      if (sInp) sInp.value = String(Math.max(0, 100 - cPct));
      refreshShippingRegionSummaryUI();
    });
  });

  document.querySelectorAll('.ship-ratio-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reg = btn.dataset.reg;
      const sPct = Math.min(100, Math.max(0, Number(btn.dataset.shop || 0)));
      const sInp = document.getElementById(`st-split-shop-${reg}`);
      const cInp = document.getElementById(`st-split-cust-${reg}`);
      if (sInp) sInp.value = String(sPct);
      if (cInp) cInp.value = String(100 - sPct);
      refreshShippingRegionSummaryUI();
    });
  });

  function populateSettingsForm() {
    if (!shopData || !shopData.settings) return;
    const s = shopData.settings;
    // Hero & Polaroids
    document.getElementById('st-hero-kicker').value = s.heroKicker || 'LOOKBOOK 2026 — TUYỂN CHỌN TỪNG ĐƯỜNG KIM';
    document.getElementById('st-hero-stamp').value = s.heroStampText || 'NA 2HAND ATELIER ✦ SCENTED PARCEL ✦';
    document.getElementById('st-hero-title').value = s.heroTitle || 'Tủ đồ *tiểu thư* thơm hương đào trắng dành riêng cho nàng';
    document.getElementById('st-hero-sub').value = s.heroSubtitle || '';
    document.getElementById('st-hero-img1').value = s.heroBannerImage || '/media/bio-link/girlfriend-1.jpg';
    document.getElementById('st-hero-img1-prev').src = s.heroBannerImage || '/media/bio-link/girlfriend-1.jpg';
    document.getElementById('st-hero-cap1').value = s.heroPolaroid1Caption || 'Look 01 — *Soft Coquette*';
    document.getElementById('st-hero-img2').value = s.heroBannerImage2 || '/media/bio-link/girlfriend-2.jpg';
    document.getElementById('st-hero-img2-prev').src = s.heroBannerImage2 || '/media/bio-link/girlfriend-2.jpg';
    document.getElementById('st-hero-cap2').value = s.heroPolaroid2Caption || 'Look 02 — *Sweet Muse*';
    document.getElementById('st-hero-deal-enabled').checked = s.heroDealEnabled !== false;
    document.getElementById('st-hero-deal-label').value = s.heroDealLabel || 'Khung giờ Giá Ngọt kết thúc sau';

    // Lookbook Studio ("Góc Phối Đồ Có Sẵn Cho Nàng")
    document.getElementById('st-lb-enabled').checked = s.lookbookEnabled !== false;
    document.getElementById('st-lb-heading').value = s.lookbookHeading || 'Góc Phối Đồ *Có Sẵn Cho Nàng*';
    document.getElementById('st-lb-sub').value =
      s.lookbookSubheading || 'Chạm vào các chấm ngọc trai phát sáng trên ảnh để xem từng món trong set đồ';
    editingLookbookSets =
      Array.isArray(s.lookbookSets) && s.lookbookSets.length > 0
        ? JSON.parse(JSON.stringify(s.lookbookSets))
        : buildDefaultLookbookSetsSeed();
    renderLookbookSetsEditor();

    // QR & Store Settings + 3-Region Shipping
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

    const regs = s.shippingRegions || {};
    const bacFee = Number(regs.bac?.baseFee ?? 30000);
    const trungFee = Number(regs.trung?.baseFee ?? 40000);
    const namFee = Number(regs.nam?.baseFee ?? 50000);
    const bacShop = Math.min(100, Math.max(0, Number(regs.bac?.shopSharePercent ?? 0)));
    const trungShop = Math.min(100, Math.max(0, Number(regs.trung?.shopSharePercent ?? 0)));
    const namShop = Math.min(100, Math.max(0, Number(regs.nam?.shopSharePercent ?? 0)));

    document.getElementById('st-ship-bac').value = bacFee;
    document.getElementById('st-ship-trung').value = trungFee;
    document.getElementById('st-ship-nam').value = namFee;
    document.getElementById('st-split-shop-bac').value = bacShop;
    document.getElementById('st-split-cust-bac').value = 100 - bacShop;
    document.getElementById('st-split-shop-trung').value = trungShop;
    document.getElementById('st-split-cust-trung').value = 100 - trungShop;
    document.getElementById('st-split-shop-nam').value = namShop;
    document.getElementById('st-split-cust-nam').value = 100 - namShop;

    const defRegEl = document.getElementById('st-default-ship-region');
    if (defRegEl) defRegEl.value = s.defaultShippingRegion || 'bac';
    const fsEnEl = document.getElementById('st-freeship-enabled');
    if (fsEnEl) fsEnEl.checked = s.freeShipEnabled !== false;
    document.getElementById('st-freeship').value = s.freeShipThreshold ?? 299000;
    const senderPhEl = document.getElementById('st-sender-phone');
    if (senderPhEl) senderPhEl.value = s.senderPhone || s.zaloPhone || '0359427135';
    const senderAdEl = document.getElementById('st-sender-address');
    if (senderAdEl) senderAdEl.value = s.senderAddress || 'Kho NA 2HAND Boutique — Giao hàng toàn quốc';
    const invNoteEl = document.getElementById('st-invoice-note');
    if (invNoteEl) {
      invNoteEl.value =
        s.invoiceThankYouNote ||
        'Cảm ơn nàng đã tin yêu NA 2HAND Boutique! Chúc nàng luôn xinh đẹp rạng rỡ trong thiết kế mới nhé ♡';
    }
    document.getElementById('st-tele-token').value = s.telegramBotToken || '';
    document.getElementById('st-tele-chat').value = s.telegramChatId || '';

    refreshShippingRegionSummaryUI();
  }

  document.getElementById('st-hero-img1')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) document.getElementById('st-hero-img1-prev').src = val;
  });
  document.getElementById('st-hero-img2')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) document.getElementById('st-hero-img2-prev').src = val;
  });

  document.getElementById('st-hero-img1-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Đang tải ảnh Polaroid 1 lên... ⏳');
    try {
      const url = await uploadFileToServer(file);
      document.getElementById('st-hero-img1').value = url;
      document.getElementById('st-hero-img1-prev').src = url;
      showToast('Đã tải ảnh Polaroid 1 thành công! Nhớ bấm Lưu Ngay nhé ✨');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('st-hero-img2-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Đang tải ảnh Polaroid 2 lên... ⏳');
    try {
      const url = await uploadFileToServer(file);
      document.getElementById('st-hero-img2').value = url;
      document.getElementById('st-hero-img2-prev').src = url;
      showToast('Đã tải ảnh Polaroid 2 thành công! Nhớ bấm Lưu Ngay nhé ✨');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      e.target.value = '';
    }
  });

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

  async function saveAllSettingsAndVisuals() {
    const payload = {
      heroKicker: document.getElementById('st-hero-kicker').value.trim(),
      heroStampText: document.getElementById('st-hero-stamp').value.trim(),
      heroTitle: document.getElementById('st-hero-title').value.trim(),
      heroSubtitle: document.getElementById('st-hero-sub').value.trim(),
      heroBannerImage: document.getElementById('st-hero-img1').value.trim() || '/media/bio-link/girlfriend-1.jpg',
      heroPolaroid1Caption: document.getElementById('st-hero-cap1').value.trim(),
      heroBannerImage2: document.getElementById('st-hero-img2').value.trim() || '/media/bio-link/girlfriend-2.jpg',
      heroPolaroid2Caption: document.getElementById('st-hero-cap2').value.trim(),
      heroDealEnabled: document.getElementById('st-hero-deal-enabled').checked,
      heroDealLabel: document.getElementById('st-hero-deal-label').value.trim(),
      lookbookEnabled: document.getElementById('st-lb-enabled').checked,
      lookbookHeading: document.getElementById('st-lb-heading').value.trim(),
      lookbookSubheading: document.getElementById('st-lb-sub').value.trim(),
      lookbookSets: editingLookbookSets,
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
      shippingRegions: {
        bac: {
          label: 'Miền Bắc',
          baseFee: Math.max(0, Number(document.getElementById('st-ship-bac')?.value ?? 30000)),
          shopSharePercent: Math.min(100, Math.max(0, Number(document.getElementById('st-split-shop-bac')?.value ?? 0)))
        },
        trung: {
          label: 'Miền Trung',
          baseFee: Math.max(0, Number(document.getElementById('st-ship-trung')?.value ?? 40000)),
          shopSharePercent: Math.min(100, Math.max(0, Number(document.getElementById('st-split-shop-trung')?.value ?? 0)))
        },
        nam: {
          label: 'Miền Nam',
          baseFee: Math.max(0, Number(document.getElementById('st-ship-nam')?.value ?? 50000)),
          shopSharePercent: Math.min(100, Math.max(0, Number(document.getElementById('st-split-shop-nam')?.value ?? 0)))
        }
      },
      defaultShippingRegion: document.getElementById('st-default-ship-region')?.value || 'bac',
      freeShipEnabled: Boolean(document.getElementById('st-freeship-enabled')?.checked),
      freeShipThreshold: Number(document.getElementById('st-freeship').value || 0),
      senderPhone: document.getElementById('st-sender-phone')?.value.trim() || '0359427135',
      senderAddress: document.getElementById('st-sender-address')?.value.trim() || 'Kho NA 2HAND Boutique — Giao hàng toàn quốc',
      invoiceThankYouNote: document.getElementById('st-invoice-note')?.value.trim() || '',
      telegramBotToken: document.getElementById('st-tele-token').value.trim(),
      telegramChatId: document.getElementById('st-tele-chat').value.trim()
    };

    try {
      await apiFetch('/api/shop/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Đã lưu Giao Diện, Góc Phối Đồ & Cài Đặt Cửa Hàng thành công! 💖');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  document.getElementById('btn-save-settings')?.addEventListener('click', saveAllSettingsAndVisuals);
  document.querySelectorAll('.btn-save-settings-trigger').forEach((btn) => {
    btn.addEventListener('click', saveAllSettingsAndVisuals);
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
