// Logic Quản trị Bio Link Studio: CRUD Links, Socials, Upload Ảnh, Đổi Theme & Live iPhone Preview

(function () {
  const TOKEN_KEY = 'bio_admin_token';
  let authToken = localStorage.getItem(TOKEN_KEY) || '';
  let state = null;

  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const previewIframe = document.getElementById('preview-iframe');
  const toastEl = document.getElementById('toast-msg');

  function showToast(msg, isError) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.background = isError ? '#b82e47' : '#2e1820';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function syncPreview() {
    if (!state || !previewIframe || !previewIframe.contentWindow) return;
    previewIframe.contentWindow.postMessage({
      type: 'BIO_PREVIEW_UPDATE',
      config: state
    }, '*');
    updateStatsSummary();
  }

  function updateStatsSummary() {
    if (!state) return;
    const views = Number(state.analytics && state.analytics.totalViews) || 0;
    const linksClicks = (state.links || []).reduce((sum, l) => sum + (Number(l.clicks) || 0), 0);
    const fcClicks = (state.featuredCard && Number(state.featuredCard.clicks)) || 0;
    const socClicks = (state.socials || []).reduce((sum, s) => sum + (Number(s.clicks) || 0), 0);
    const totalClicks = linksClicks + fcClicks + socClicks;
    const activeLinks = (state.links || []).filter((l) => l.enabled !== false).length;
    const ctr = views > 0 ? Math.min(100, Number(((totalClicks / views) * 100).toFixed(1))) : 0;

    document.getElementById('stat-views').textContent = views.toLocaleString('vi-VN');
    document.getElementById('stat-clicks').textContent = totalClicks.toLocaleString('vi-VN');
    document.getElementById('stat-active-links').textContent = activeLinks;
    document.getElementById('stat-ctr').textContent = `${ctr}%`;
  }

  let anaRange = 'week';
  let anaFilter = 'all';
  let anaPage = 1;
  const ANA_PAGE_SIZE = 30;
  const expandedIps = new Set();

  async function fetchRealAnalytics() {
    if (!authToken) return;
    try {
      const qs = `range=${encodeURIComponent(anaRange)}&filter=${encodeURIComponent(anaFilter)}&page=${anaPage}&pageSize=${ANA_PAGE_SIZE}`;
      const [cfgRes, anaRes] = await Promise.all([
        fetch('/api/config'),
        fetch(`/api/analytics?${qs}`, { headers: { Authorization: `Bearer ${authToken}` } })
      ]);
      if (cfgRes.ok) {
        const cfgJson = await cfgRes.json();
        if (cfgJson && cfgJson.data && state) {
          // Update real counters without overwriting unsaved form edits
          state.analytics = cfgJson.data.analytics || { totalViews: 0 };
          if (state.featuredCard && cfgJson.data.featuredCard) {
            state.featuredCard.clicks = Number(cfgJson.data.featuredCard.clicks) || 0;
          }
          const latestLinksMap = new Map((cfgJson.data.links || []).map((l) => [l.id, Number(l.clicks) || 0]));
          (state.links || []).forEach((l, idx) => {
            if (latestLinksMap.has(l.id)) {
              l.clicks = latestLinksMap.get(l.id);
              const pills = document.querySelectorAll('.link-click-pill');
              if (pills[idx]) pills[idx].textContent = `👆 ${l.clicks} lượt click`;
            }
          });
        }
      }
      if (anaRes.ok) {
        const ana = await anaRes.json();
        if (ana.summary) {
          document.getElementById('stat-views').textContent = Number(ana.summary.totalViews || 0).toLocaleString('vi-VN');
          document.getElementById('stat-clicks').textContent = Number(ana.summary.totalClicks || 0).toLocaleString('vi-VN');
          document.getElementById('stat-active-links').textContent = ana.summary.activeLinks || 0;
          document.getElementById('stat-ctr').textContent = `${ana.summary.ctr || 0}%`;
        }
        if (ana.counts) {
          const cAll = document.getElementById('cnt-ana-all');
          const cClk = document.getElementById('cnt-ana-clicked');
          const cSoc = document.getElementById('cnt-ana-social');
          const cShp = document.getElementById('cnt-ana-shop');
          if (cAll) cAll.textContent = ana.counts.all || 0;
          if (cClk) cClk.textContent = ana.counts.clicked || 0;
          if (cSoc) cSoc.textContent = ana.counts.social || 0;
          if (cShp) cShp.textContent = ana.counts.shop || 0;
        }
        if (ana.mongo) {
          const badge = document.getElementById('mongo-status-badge');
          const errText = document.getElementById('mongo-error-text');
          const dbInput = document.getElementById('mongo-db-input');
          if (dbInput && ana.mongo.dbName) dbInput.value = ana.mongo.dbName;
          if (badge) {
            if (ana.mongo.connected) {
              badge.textContent = `🟢 Đã kết nối MongoDB (${ana.mongo.dbName})`;
              badge.style.background = '#e6f9ed';
              badge.style.color = '#1b7a43';
              if (errText) errText.textContent = `URI: ${ana.mongo.uriMasked}`;
            } else {
              badge.textContent = '🟡 Lưu trực tiếp trên Server (Chờ kết nối MongoDB Atlas)';
              badge.style.background = '#fff6e0';
              badge.style.color = '#9c6500';
              if (errText) errText.textContent = ana.mongo.error ? `Trạng thái Atlas: ${ana.mongo.error} (Mọi lượt xem & click vẫn đang được ghi nhận thực tế 100%)` : '';
            }
          }
        }
        renderAnalyticsLogsTable(ana.ipFlows || [], ana.pagination || { page: 1, pageSize: ANA_PAGE_SIZE, totalItems: 0, totalPages: 1 });
      }
    } catch (e) { }
  }

  function renderStepChip(step) {
    const dt = new Date(step.timestamp);
    const hm = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const rep = step.repeat && step.repeat > 1 ? ` ×${step.repeat}` : '';
    if (step.type === 'order') {
      return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;background:#dcfce7;color:#15803d;font-weight:700;white-space:nowrap;"><small style="opacity:.75">${hm}</small> 💖 ${escapeHtml(step.title)}${rep}</span>`;
    }
    if (step.type === 'click') {
      return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;background:#fce8ef;color:#c7436e;font-weight:700;white-space:nowrap;"><small style="opacity:.75">${hm}</small> 👆 Bấm: ${escapeHtml(step.title)}${rep}</span>`;
    }
    if (step.type === 'shop_view') {
      return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;background:#fef3c7;color:#92400e;font-weight:600;white-space:nowrap;"><small style="opacity:.75">${hm}</small> 🛍️ ${escapeHtml(step.title)}${rep}</span>`;
    }
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;background:#eef6ff;color:#2b6cb0;font-weight:600;white-space:nowrap;"><small style="opacity:.75">${hm}</small> 👁️ Xem Bio${rep}</span>`;
  }

  function renderAnalyticsLogsTable(ipFlows, pagination) {
    const tbody = document.getElementById('analytics-logs-tbody');
    const pagerEl = document.getElementById('analytics-pagination');
    if (!tbody) return;

    if (!ipFlows || ipFlows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 24px; text-align: center; color: var(--adm-muted);">
            Chưa có khách truy cập nào khớp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      if (pagerEl) pagerEl.innerHTML = '';
      return;
    }

    tbody.innerHTML = ipFlows
      .map((row) => {
        const lastDt = new Date(row.lastSeen);
        const clockStr = lastDt.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const dd = String(lastDt.getDate()).padStart(2, '0');
        const mm = String(lastDt.getMonth() + 1).padStart(2, '0');
        const dateStr = `${dd}/${mm}`;

        const steps = Array.isArray(row.steps) ? row.steps : [];
        const isExpanded = expandedIps.has(row.ip);
        let flowHtml = '';

        if (steps.length <= 4 || isExpanded) {
          flowHtml = steps.map(renderStepChip).join('<span style="color:#c4a1af;font-weight:700;margin:0 4px;">&rarr;</span>');
          if (steps.length > 4 && isExpanded) {
            flowHtml += ` <button type="button" class="toggle-ip-steps" data-ip="${escapeAttr(row.ip)}" style="border:1px solid #e6cad5;background:#fff;border-radius:99px;padding:2px 8px;font-size:0.7rem;cursor:pointer;color:#8c5268;">Thu gọn</button>`;
          }
        } else {
          const firstChip = renderStepChip(steps[0]);
          const tailChips = steps.slice(-2).map(renderStepChip).join('<span style="color:#c4a1af;font-weight:700;margin:0 4px;">&rarr;</span>');
          const hiddenCount = steps.length - 3;
          flowHtml = `${firstChip}<span style="color:#c4a1af;font-weight:700;margin:0 4px;">&rarr;</span><button type="button" class="toggle-ip-steps" data-ip="${escapeAttr(row.ip)}" style="border:1px dashed #d64f7c;background:#fff5f8;border-radius:99px;padding:2px 9px;font-size:0.71rem;font-weight:700;cursor:pointer;color:#c7436e;white-space:nowrap;">+${hiddenCount} bước nữa</button><span style="color:#c4a1af;font-weight:700;margin:0 4px;">&rarr;</span>${tailChips}`;
        }

        return `
          <tr style="border-bottom: 1px solid #f5eaee;">
            <td style="padding: 10px 8px; white-space: nowrap; color: var(--adm-muted);">
              <div style="display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font-variant-numeric:tabular-nums;">
                <span style="font-weight:800; color:#3d1a28; font-size:0.82rem; letter-spacing:0.01em;">${clockStr}</span>
                <span style="padding:1px 7px; border-radius:6px; background:#f9ebf1; border:1px solid #ecd0dc; color:#a62c5c; font-size:0.71rem; font-weight:700;">${dateStr}</span>
              </div>
              <div style="font-size:0.7rem; margin-top:2px;">${steps.length} bước (${row.viewCount} xem · ${row.clickCount} bấm)</div>
            </td>
            <td style="padding: 10px 8px;">
              <div style="display:flex; align-items:center; flex-wrap:${isExpanded ? 'wrap' : 'nowrap'}; gap:2px; overflow-x:auto; max-width:clamp(240px, 32vw, 520px); scrollbar-width:thin;">
                ${flowHtml}
              </div>
            </td>
            <td style="padding: 10px 8px; white-space: nowrap;">${escapeHtml(row.device || 'Khác')} <span style="color:#999;">(${escapeHtml(row.os || '')})</span></td>
            <td style="padding: 10px 8px; white-space: nowrap; font-weight: 600;">${escapeHtml(row.browser || 'Trình duyệt')}</td>
            <td style="padding: 10px 8px; white-space: nowrap;">${escapeHtml(row.trafficSource || 'Trực tiếp')}</td>
            <td style="padding: 10px 8px; white-space: nowrap; font-family: monospace; font-size: 0.76rem; color: #555; font-weight: 700;">${escapeHtml(row.ip || '')}</td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.toggle-ip-steps').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ip = btn.getAttribute('data-ip');
        if (expandedIps.has(ip)) expandedIps.delete(ip);
        else expandedIps.add(ip);
        renderAnalyticsLogsTable(ipFlows, pagination);
      });
    });

    if (pagerEl) {
      const { page, pageSize, totalItems, totalPages } = pagination;
      const from = (page - 1) * pageSize + 1;
      const to = Math.min(totalItems, page * pageSize);

      let pageBtns = '';
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) {
          pageBtns += `<button type="button" class="btn btn-sm ana-page-btn ${p === page ? 'btn-primary' : 'btn-outline'}" data-p="${p}" style="padding:4px 10px;">${p}</button>`;
        } else if (Math.abs(p - page) === 3) {
          pageBtns += `<span style="padding:0 4px;color:#999;">...</span>`;
        }
      }

      pagerEl.innerHTML = `
        <div style="color: var(--adm-muted);">
          Hiển thị <strong>${from}–${to}</strong> trên tổng <strong>${totalItems}</strong> khách ghé trang
        </div>
        <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm ana-page-btn" data-p="${page - 1}" ${page <= 1 ? 'disabled style="opacity:.45;padding:4px 10px;"' : 'style="padding:4px 10px;"'}>&larr; Trước</button>
          ${pageBtns}
          <button type="button" class="btn btn-outline btn-sm ana-page-btn" data-p="${page + 1}" ${page >= totalPages ? 'disabled style="opacity:.45;padding:4px 10px;"' : 'style="padding:4px 10px;"'}>Sau &rarr;</button>
        </div>
      `;

      pagerEl.querySelectorAll('.ana-page-btn').forEach((b) => {
        b.addEventListener('click', () => {
          const nextP = Number(b.getAttribute('data-p'));
          if (nextP >= 1 && nextP <= totalPages && nextP !== anaPage) {
            anaPage = nextP;
            fetchRealAnalytics();
          }
        });
      });
    }
  }

  // Bind Time-Range & Filter Category Buttons for Analytics
  document.querySelectorAll('.ana-range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      anaRange = btn.getAttribute('data-range') || 'week';
      anaPage = 1;
      document.querySelectorAll('.ana-range-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.style.background = active ? '#d64f7c' : 'transparent';
        b.style.color = active ? '#fff' : '';
      });
      fetchRealAnalytics();
    });
  });

  document.querySelectorAll('.ana-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      anaFilter = btn.getAttribute('data-filter') || 'all';
      anaPage = 1;
      document.querySelectorAll('.ana-filter-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('btn-primary', active);
        b.classList.toggle('btn-outline', !active);
      });
      fetchRealAnalytics();
    });
  });

  // --- AUTHENTICATION (Unified SSO with /shop-admin) ---
  async function checkAuthAndLoad() {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const verifyRes = await fetch('/api/auth/verify', { headers });
      if (!verifyRes.ok) {
        localStorage.removeItem(TOKEN_KEY);
        authToken = '';
        loginOverlay.style.display = 'flex';
        return;
      }
      const verifyData = await verifyRes.json();
      if (verifyData.token) {
        authToken = verifyData.token;
        localStorage.setItem(TOKEN_KEY, authToken);
      }
      document.getElementById('auth-new-user').value = verifyData.username || 'admin';
      loginOverlay.style.display = 'none';
      await loadConfigData();
    } catch (e) {
      loginOverlay.style.display = 'flex';
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        loginError.textContent = data.message || 'Đăng nhập thất bại!';
        loginError.style.display = 'block';
        return;
      }
      authToken = data.token;
      localStorage.setItem(TOKEN_KEY, authToken);
      document.getElementById('auth-new-user').value = data.username || 'admin';
      loginOverlay.style.display = 'none';
      showToast('Chào mừng bạn đến với Bio Link Studio! 🌸');
      await loadConfigData();
    } catch (err) {
      loginError.textContent = 'Không thể kết nối tới máy chủ.';
      loginError.style.display = 'block';
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    fetch('/api/logout', { method: 'POST' }).catch(() => { });
    localStorage.removeItem(TOKEN_KEY);
    authToken = '';
    loginOverlay.style.display = 'flex';
  });

  // --- LOAD & SAVE CONFIG ---
  async function loadConfigData() {
    const res = await fetch('/api/config');
    const json = await res.json();
    if (json && json.data) {
      state = json.data;
      populateAllEditors();
      setTimeout(syncPreview, 250);
    }
    await fetchRealAnalytics();
  }

  document.getElementById('btn-save-all').addEventListener('click', async () => {
    if (!state) return;
    const btn = document.getElementById('btn-save-all');
    const oldText = btn.textContent;
    btn.textContent = '⏳ Đang lưu...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(state)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('💾 Đã lưu mọi thay đổi lên trang Bio! ✨');
      } else {
        showToast(data.message || 'Lỗi khi lưu!', true);
      }
    } catch (err) {
      showToast('Lỗi kết nối khi lưu cấu hình!', true);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  });

  // --- TABS SWITCHING ---
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-pane').forEach((pane) => {
        pane.style.display = pane.id === targetId ? 'block' : 'none';
      });
    });
  });

  // --- IMAGE UPLOAD HELPER (With Client-Side Compression) ---
  function compressAndUploadImage(file, onSuccess) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = async function () {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);

        try {
          showToast('⏳ Đang tải ảnh lên...');
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
              filename: file.name,
              dataUrl: compressedDataUrl
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            onSuccess(data.url);
            showToast('📤 Tải ảnh lên thành công! ✨');
          } else {
            showToast(data.message || 'Tải ảnh thất bại!', true);
          }
        } catch (err) {
          showToast('Lỗi khi tải ảnh lên server!', true);
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  let activeTemplateCategory = 'all';

  function normalizeHexColor(val, fallback) {
    const s = String(val || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      return ('#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]).toLowerCase();
    }
    return fallback || '#ffffff';
  }

  function setColorPickerValue(inputId, hexBadgeId, rawVal, fallback) {
    const hex = normalizeHexColor(rawVal, fallback);
    const inputEl = document.getElementById(inputId);
    const badgeEl = document.getElementById(hexBadgeId);
    if (inputEl) inputEl.value = hex;
    if (badgeEl) badgeEl.textContent = hex.toUpperCase();
  }

  function setTypoSliderValue(inputId, badgeId, rawVal, defaultSliderVal, unitSuffix, allowZeroOrNeg) {
    const inputEl = document.getElementById(inputId);
    const badgeEl = document.getElementById(badgeId);
    const isSet = allowZeroOrNeg
      ? rawVal !== null && rawVal !== undefined && rawVal !== ''
      : Number(rawVal || 0) > 0;
    if (inputEl) {
      inputEl.value = isSet ? Number(rawVal) : defaultSliderVal;
    }
    if (badgeEl) {
      badgeEl.textContent = isSet ? `${Number(rawVal)}${unitSuffix}` : 'Tự động';
    }
  }

  // --- POPULATE EDITORS ---
  function populateAllEditors() {
    if (!state) return;

    // 1. Profile
    const p = state.profile || {};
    document.getElementById('prof-avatar').value = p.avatar || '';
    document.getElementById('prof-avatar-preview').src = p.avatar || '';
    document.getElementById('prof-name').value = p.name || '';
    document.getElementById('prof-subtitle').value = p.subtitle || '';
    const bioInput = document.getElementById('prof-bio');
    if (bioInput) bioInput.value = p.bio || '';
    document.getElementById('prof-quote').value = p.quote || '';

    // 2. Featured Card
    const fc = state.featuredCard || {};
    document.getElementById('fc-enabled').checked = !!fc.enabled;
    const fcStyleEl = document.getElementById('fc-style');
    if (fcStyleEl) fcStyleEl.value = fc.style || 'banner';
    const fcCtaEl = document.getElementById('fc-cta-text');
    if (fcCtaEl) fcCtaEl.value = fc.ctaText ?? 'XEM NGAY';
    document.getElementById('fc-title').value = fc.title || '';
    document.getElementById('fc-subtitle').value = fc.subtitle || '';
    document.getElementById('fc-url').value = fc.url || '';
    document.getElementById('fc-image').value = fc.image || '';
    document.getElementById('fc-img-preview').src = fc.image || '';

    // 3. Theme, Templates, Deep Colors & Deep Typography
    const t = state.theme || {};
    document.getElementById('theme-avatar-frame').value = t.avatarFrame || 'organic';
    document.getElementById('theme-avatar-size').value = t.avatarSize || 124;
    document.getElementById('avatar-size-val').textContent = t.avatarSize || 124;

    document.getElementById('theme-bg-type').value = t.bgType || 'image-overlay';
    document.getElementById('theme-particles').value = t.particleEffect || 'bokeh';
    document.getElementById('theme-bg-image').value = t.bgImage || '';
    document.getElementById('theme-bg-preview').src = t.bgImage || '';
    document.getElementById('theme-portrait-image').value = t.portraitBgImage || '';
    document.getElementById('theme-portrait-preview').src = t.portraitBgImage || '';
    const coverInput = document.getElementById('theme-cover-image');
    const coverPreview = document.getElementById('theme-cover-preview');
    if (coverInput) coverInput.value = t.coverImage || '';
    if (coverPreview) coverPreview.src = t.coverImage || t.bgImage || p.avatar || '';

    document.getElementById('theme-overlay-opacity').value = t.bgOverlayOpacity ?? 35;
    document.getElementById('overlay-opacity-val').textContent = t.bgOverlayOpacity ?? 35;
    document.getElementById('theme-bg-blur').value = t.bgBlur ?? 3;
    document.getElementById('bg-blur-val').textContent = t.bgBlur ?? 3;

    document.getElementById('theme-heading-font').value = t.headingFont || 'Cormorant Garamond';
    document.getElementById('theme-body-font').value = t.bodyFont || 'Plus Jakarta Sans';
    const quoteFontEl = document.getElementById('theme-quote-font');
    if (quoteFontEl) quoteFontEl.value = t.quoteFont || 'inherit';

    const upperEl = document.getElementById('theme-uppercase-links');
    if (upperEl) upperEl.checked = t.uppercaseLinks !== false;
    const decoEl = document.getElementById('theme-show-decorations');
    if (decoEl) decoEl.checked = t.showDecorations !== false;

    document.getElementById('theme-button-style').value = t.buttonStyle || 'frosted-light';
    document.getElementById('theme-button-radius').value = t.buttonRadius || 'pill';

    const btnOpacityVal = t.buttonBgOpacity ?? 88;
    const btnOpacitySlider = document.getElementById('theme-btn-bg-opacity');
    const btnOpacityLabel = document.getElementById('btn-bg-opacity-val');
    if (btnOpacitySlider) btnOpacitySlider.value = btnOpacityVal;
    if (btnOpacityLabel) btnOpacityLabel.textContent = btnOpacityVal;

    // Deep Color Pickers + Hex Badges
    const mainTextHex = normalizeHexColor(t.textColor, '#ffffff');
    const primHex = normalizeHexColor(t.primaryColor, '#d97793');
    setColorPickerValue('theme-bg-grad-start', 'hex-bg-grad-start', t.bgGradientStart, '#f6c4d2');
    setColorPickerValue('theme-bg-grad-mid', 'hex-bg-grad-mid', t.bgGradientMid, '#e89ab2');
    setColorPickerValue('theme-bg-grad-end', 'hex-bg-grad-end', t.bgGradientEnd, '#c8738e');
    setColorPickerValue('theme-overlay-color', 'hex-overlay-color', t.bgOverlayColor, '#7a354b');
    setColorPickerValue('theme-primary-color', 'hex-primary-color', primHex, '#d97793');
    setColorPickerValue('theme-text-color', 'hex-text-color', mainTextHex, '#ffffff');
    setColorPickerValue('theme-subtitle-color', 'hex-subtitle-color', t.subtitleColor || mainTextHex, mainTextHex);
    setColorPickerValue('theme-quote-color', 'hex-quote-color', t.quoteColor || mainTextHex, mainTextHex);
    setColorPickerValue('theme-btn-bg-color', 'hex-btn-bg-color', t.buttonBgColor, '#ffffff');
    setColorPickerValue('theme-btn-text-color', 'hex-btn-text-color', t.buttonTextColor, '#522938');
    setColorPickerValue('theme-btn-border-color', 'hex-btn-border-color', t.buttonBorderColor, '#ffffff');
    setColorPickerValue('theme-social-bg-color', 'hex-social-bg-color', t.socialBgColor, '#ffffff');
    setColorPickerValue('theme-social-icon-color', 'hex-social-icon-color', t.socialIconColor || primHex, primHex);

    // Deep Typography Sliders
    setTypoSliderValue('theme-name-size', 'val-name-size', t.nameFontSize, 30, 'px', false);
    setTypoSliderValue('theme-name-spacing', 'val-name-spacing', t.nameLetterSpacing, 1.5, 'px', true);
    setTypoSliderValue('theme-subtitle-size', 'val-subtitle-size', t.subtitleFontSize, 13, 'px', false);
    setTypoSliderValue('theme-bio-size', 'val-bio-size', t.bioFontSize, 13, 'px', false);
    setTypoSliderValue('theme-btn-size', 'val-btn-size', t.buttonFontSize, 13.5, 'px', false);
    setTypoSliderValue('theme-btn-sub-size', 'val-btn-sub-size', t.buttonSubFontSize, 11, 'px', false);
    setTypoSliderValue('theme-quote-size', 'val-quote-size', t.quoteFontSize, 15, 'px', false);
    setTypoSliderValue('theme-btn-height', 'val-btn-height', t.buttonMinHeight, 46, 'px', false);
    setTypoSliderValue('theme-btn-gap', 'val-btn-gap', t.buttonGap, 11, 'px', false);

    document.getElementById('theme-social-position').value = t.socialPosition || 'bottom';
    const socStyleEl = document.getElementById('theme-social-style');
    if (socStyleEl) socStyleEl.value = t.socialStyle || 'filled-circle';

    renderTemplateGallery(t.template || 'template2');
    renderThemePresets(t.preset || 'blush-rose');

    // 4. SEO
    const seo = state.seo || {};
    document.getElementById('seo-title').value = seo.pageTitle || '';
    document.getElementById('seo-desc').value = seo.metaDescription || '';
    const footerInput = document.getElementById('seo-footer');
    if (footerInput) footerInput.value = 'Made with ♡ by My Love';
    document.getElementById('seo-share-btn').checked = seo.showShareButton !== false;

    // 5. Render Dynamic Lists
    renderLinksEditor();
    renderSocialsEditor();
    updateStatsSummary();
  }

  // --- 20-TEMPLATE GALLERY WITH VISUAL MINI-WIREFRAMES ---
  function buildMiniPhoneThumbHtml(tpl) {
    const presets = window.THEME_PRESETS || {};
    const rec = tpl.recommended || {};
    const p = presets[rec.preset] || presets['blush-rose'] || {};
    const bg1 = p.bgGradientStart || '#1a1a1c';
    const bg2 = p.bgGradientEnd || '#111113';
    const fg = p.textColor || '#ffffff';
    const btnBg = rec.buttonBgColor || p.buttonBgColor || '#ffffff';
    const borderCol = rec.buttonBorderColor || p.buttonBorderColor || fg;
    const id = tpl.id;

    let inner = '';
    if (id === 'template4') {
      inner = `
        <div style="width:72%;height:4px;border-radius:2px;background:${fg};opacity:0.9;margin-bottom:2px;"></div>
        <div style="display:flex;width:100%;gap:3px;align-items:center;flex:1;">
          <div style="width:44%;height:38px;border-radius:99px 99px 0 0;background:${fg};opacity:0.35;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:3px;">
            <div style="height:5px;border-radius:99px;background:${btnBg};"></div>
            <div style="height:5px;border-radius:99px;background:${btnBg};"></div>
            <div style="height:5px;border-radius:99px;background:${btnBg};"></div>
          </div>
        </div>`;
    } else if (id === 'template5') {
      inner = `
        <div style="display:flex;width:100%;align-items:center;justify-content:space-between;gap:3px;margin-bottom:2px;">
          <div style="width:15px;height:15px;border-radius:50%;border:1.2px solid ${fg};background:${fg};opacity:0.4;"></div>
          <div style="width:20px;height:4px;border-radius:2px;background:${fg};"></div>
        </div>
        <div style="width:92%;height:5px;border-radius:99px;background:${btnBg};"></div>
        <div style="width:92%;height:5px;border-radius:99px;background:${btnBg};"></div>
        <div style="width:92%;height:5px;border-radius:99px;background:${btnBg};"></div>`;
    } else if (id === 'template6' || id === 'template15' || id === 'template18') {
      const isOutline = id === 'template15';
      const barStyle = isOutline ? `border:1px solid ${borderCol};background:transparent;` : `background:${btnBg};border-radius:99px;`;
      inner = `
        <div style="position:absolute;top:0;left:0;right:0;height:20px;background:${fg};opacity:0.22;"></div>
        <div style="width:16px;height:16px;border-radius:50%;border:1.5px solid #fff;background:${fg};opacity:0.65;margin-top:6px;z-index:2;"></div>
        <div style="width:65%;height:3px;background:${fg};margin:1px 0;"></div>
        <div style="width:90%;height:5px;${barStyle}"></div>
        <div style="width:90%;height:5px;${barStyle}"></div>
        ${id === 'template6' ? `<div style="width:90%;height:11px;border-radius:3px;background:${btnBg};margin-top:2px;"></div>` : `<div style="width:90%;height:5px;${barStyle}"></div>`}`;
    } else if (id === 'template7' || id === 'template12') {
      const barStyle = id === 'template12' ? `background:${btnBg};border-radius:1px;` : `border:1px solid ${borderCol};border-radius:2px;`;
      inner = `
        <div style="position:absolute;inset:15px 4px 5px 4px;border:1px solid ${borderCol};opacity:0.65;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:${fg};opacity:0.75;z-index:2;"></div>
        <div style="width:58%;height:3px;background:${fg};z-index:2;"></div>
        <div style="width:80%;height:5px;${barStyle}z-index:2;"></div>
        <div style="width:80%;height:5px;${barStyle}z-index:2;"></div>
        <div style="width:80%;height:5px;${barStyle}z-index:2;"></div>`;
    } else if (id === 'template8' || id === 'template11') {
      const barStyle = id === 'template8' ? `background:${btnBg};border-radius:99px;` : `border:1px solid ${borderCol};border-radius:99px;`;
      inner = `
        <div style="position:absolute;inset:3px 3px 4px 3px;border:1px solid ${borderCol};border-radius:24px 24px 2px 2px;opacity:0.7;"></div>
        <div style="width:18px;height:21px;border-radius:99px 99px 0 0;background:${fg};opacity:0.65;margin-top:3px;"></div>
        <div style="width:76%;height:5px;${barStyle}"></div>
        <div style="width:76%;height:5px;${barStyle}"></div>
        <div style="width:76%;height:5px;${barStyle}"></div>`;
    } else if (id === 'template9') {
      inner = `
        <div style="width:24px;height:6px;border-top:1.5px solid ${fg};border-radius:50% 50% 0 0;margin-bottom:-2px;"></div>
        <div style="width:18px;height:21px;border-radius:99px 99px 0 0;background:${fg};opacity:0.65;"></div>
        <div style="width:86%;height:6px;border:1px solid ${borderCol};border-radius:50%;"></div>
        <div style="width:86%;height:6px;border:1px solid ${borderCol};border-radius:50%;"></div>
        <div style="width:86%;height:6px;border:1px solid ${borderCol};border-radius:50%;"></div>`;
    } else if (id === 'template10' || id === 'template17') {
      const barStyle = id === 'template10' ? `background:${btnBg};border-radius:2px;` : `border:1px solid ${borderCol};border-radius:99px;`;
      inner = `
        <div style="width:22px;height:5px;border-top:1.5px solid ${fg};border-radius:50% 50% 0 0;margin-bottom:-2px;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:${fg};opacity:0.75;"></div>
        <div style="width:22px;height:5px;border-bottom:1.5px solid ${fg};border-radius:0 0 50% 50%;margin-top:-2px;"></div>
        <div style="width:86%;height:5px;${barStyle}"></div>
        <div style="width:86%;height:5px;${barStyle}"></div>`;
    } else if (id === 'template13') {
      inner = `
        <div style="width:16px;height:22px;border-radius:50%;background:${fg};opacity:0.55;"></div>
        <div style="width:62%;height:3px;background:${fg};"></div>
        <div style="width:86%;height:5px;border:1px solid ${borderCol};"></div>
        <div style="width:86%;height:5px;border:1px solid ${borderCol};"></div>
        <div style="width:86%;height:5px;border:1px solid ${borderCol};"></div>`;
    } else if (id === 'template3' || id === 'template14') {
      inner = `
        <div style="width:66%;height:4px;background:${fg};margin-bottom:2px;"></div>
        <div style="width:88%;height:6px;border-radius:99px;background:${btnBg};opacity:0.85;"></div>
        <div style="width:88%;height:6px;border-radius:99px;background:${btnBg};opacity:0.85;"></div>
        <div style="width:88%;height:6px;border-radius:99px;background:${btnBg};opacity:0.85;"></div>`;
    } else if (id === 'template16') {
      inner = `
        <div style="width:74%;height:4px;background:${fg};"></div>
        <div style="width:17px;height:17px;border-radius:50%;border:1.5px solid #fff;background:${fg};opacity:0.5;margin:1px 0;"></div>
        <div style="width:88%;height:5px;border-radius:3px;background:${btnBg};"></div>
        <div style="width:88%;height:5px;border-radius:3px;background:${btnBg};"></div>
        <div style="width:88%;height:5px;border-radius:3px;background:${btnBg};"></div>`;
    } else if (id === 'template19') {
      inner = `
        <div style="width:72%;height:4px;background:${fg};"></div>
        <div style="width:18px;height:21px;border-radius:2px;background:${fg};opacity:0.55;"></div>
        <div style="width:50%;height:2.5px;background:${fg};opacity:0.8;"></div>
        <div style="width:88%;height:5px;border-radius:2px;border:1px solid ${borderCol};"></div>
        <div style="width:88%;height:5px;border-radius:2px;border:1px solid ${borderCol};"></div>`;
    } else if (id === 'template20') {
      const lineCol = p.primaryColor || '#ef8c4b';
      inner = `
        <div style="position:relative;width:100%;display:flex;justify-content:center;align-items:center;margin:2px 0;">
          <div style="position:absolute;left:-4px;right:-4px;height:1.5px;background:${lineCol};"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:#ddd;z-index:2;border:1px solid ${bg1};"></div>
        </div>
        <div style="width:66%;height:3.5px;background:${lineCol};"></div>
        <div style="width:88%;height:5px;border-radius:2px;background:${lineCol};"></div>
        <div style="width:88%;height:5px;border-radius:2px;background:${lineCol};"></div>
        <div style="width:88%;height:5px;border-radius:2px;background:${lineCol};"></div>`;
    } else {
      inner = `
        <div style="width:17px;height:17px;border-radius:50%;border:1.5px solid #fff;background:${fg};opacity:0.55;"></div>
        <div style="width:65%;height:3.5px;background:${fg};"></div>
        <div style="width:88%;height:5px;border-radius:99px;background:${btnBg};"></div>
        <div style="width:88%;height:5px;border-radius:99px;background:${btnBg};"></div>
        <div style="width:88%;height:5px;border-radius:99px;background:${btnBg};"></div>`;
    }

    return `<div class="tpl-mini-phone" style="background:linear-gradient(160deg, ${bg1}, ${bg2});">${inner}</div>`;
  }

  function applyPresetObjectToTheme(presetKey, p) {
    if (!p) return;
    state.theme = {
      ...state.theme,
      preset: presetKey,
      primaryColor: p.primaryColor,
      secondaryColor: p.secondaryColor,
      accentColor: p.accentColor,
      bgGradientStart: p.bgGradientStart,
      bgGradientMid: p.bgGradientMid,
      bgGradientEnd: p.bgGradientEnd,
      bgOverlayColor: p.bgOverlayColor,
      bgOverlayOpacity: p.bgOverlayOpacity,
      buttonStyle: p.buttonStyle || state.theme.buttonStyle,
      buttonBgColor: p.buttonBgColor,
      buttonBgOpacity: p.buttonBgOpacity ?? 88,
      buttonTextColor: p.buttonTextColor,
      buttonBorderColor: p.buttonBorderColor || p.textColor || '#ffffff',
      textColor: p.textColor,
      subtitleColor: p.subtitleColor || p.textColor,
      quoteColor: p.quoteColor || p.textColor,
      socialBgColor: p.socialBgColor || '#ffffff',
      socialIconColor: p.socialIconColor || p.primaryColor,
      socialStyle: p.socialStyle || state.theme.socialStyle || 'filled-circle',
      particleEffect: p.particleEffect || 'none'
    };
  }

  function renderTemplateGallery(selectedTplId) {
    const grid = document.getElementById('template-selector-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const templates = window.BIO_TEMPLATES || [];
    const filtered = activeTemplateCategory === 'all'
      ? templates
      : templates.filter((item) => item.group === activeTemplateCategory);

    filtered.forEach((tpl) => {
      const card = document.createElement('div');
      card.className = `template-option ${selectedTplId === tpl.id ? 'selected' : ''}`;
      card.setAttribute('data-template', tpl.id);
      card.innerHTML = `
        ${buildMiniPhoneThumbHtml(tpl)}
        <div style="min-width:0; flex:1;">
          <span class="template-option-badge">${escapeHtml(tpl.badge || 'Canva')}</span>
          <div class="template-option-title">${escapeHtml(tpl.title)}</div>
          <div class="template-option-desc">${escapeHtml(tpl.desc)}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        const autoStyleToggle = document.getElementById('tpl-auto-apply-style');
        const shouldAutoApply = !autoStyleToggle || autoStyleToggle.checked;
        const rec = tpl.recommended || {};

        state.theme.template = tpl.id;
        if (rec.avatarFrame) state.theme.avatarFrame = rec.avatarFrame;
        if (rec.socialPosition) state.theme.socialPosition = rec.socialPosition;

        if (shouldAutoApply) {
          const presets = window.THEME_PRESETS || {};
          if (rec.preset && presets[rec.preset]) {
            applyPresetObjectToTheme(rec.preset, presets[rec.preset]);
          }
          if (rec.bgType) state.theme.bgType = rec.bgType;
          if (rec.bgBlur !== undefined) state.theme.bgBlur = rec.bgBlur;
          if (rec.buttonStyle) state.theme.buttonStyle = rec.buttonStyle;
          if (rec.buttonRadius) state.theme.buttonRadius = rec.buttonRadius;
          if (rec.buttonBgColor) state.theme.buttonBgColor = rec.buttonBgColor;
          if (rec.buttonBgOpacity !== undefined) state.theme.buttonBgOpacity = rec.buttonBgOpacity;
          if (rec.buttonTextColor) state.theme.buttonTextColor = rec.buttonTextColor;
          if (rec.buttonBorderColor) state.theme.buttonBorderColor = rec.buttonBorderColor;
          if (rec.headingFont) state.theme.headingFont = rec.headingFont;
          if (rec.bodyFont) state.theme.bodyFont = rec.bodyFont;
          if (rec.quoteFont) state.theme.quoteFont = rec.quoteFont;
          if (rec.socialStyle) state.theme.socialStyle = rec.socialStyle;
          if (rec.showDecorations !== undefined) state.theme.showDecorations = rec.showDecorations;
          if (rec.enableFeatured) state.featuredCard.enabled = true;
          if (rec.featuredStyle) state.featuredCard.style = rec.featuredStyle;
        } else if (tpl.id === 'template3') {
          state.featuredCard.enabled = true;
        }

        populateAllEditors();
        syncPreview();
      });
      grid.appendChild(card);
    });
  }

  document.querySelectorAll('#tpl-category-bar .tpl-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTemplateCategory = btn.getAttribute('data-cat') || 'all';
      document.querySelectorAll('#tpl-category-bar .tpl-cat-btn').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      renderTemplateGallery((state && state.theme && state.theme.template) || 'template2');
    });
  });

  function renderThemePresets(selectedKey) {
    const grid = document.getElementById('preset-selector-grid');
    grid.innerHTML = '';
    const presets = window.THEME_PRESETS || {};
    Object.keys(presets).forEach((key) => {
      const p = presets[key];
      const div = document.createElement('div');
      div.className = `preset-card ${selectedKey === key ? 'selected' : ''}`;
      div.innerHTML = `
        <div class="preset-swatch" style="background: linear-gradient(135deg, ${p.bgGradientStart}, ${p.primaryColor});"></div>
        <div>
          <div style="font-weight: 700; font-size: 0.83rem; color: var(--adm-text);">${p.name}</div>
          <div style="font-size: 0.72rem; color: var(--adm-muted);">${p.description}</div>
        </div>
      `;
      div.addEventListener('click', () => {
        applyPresetObjectToTheme(key, p);
        populateAllEditors();
        syncPreview();
      });
      grid.appendChild(div);
    });
  }

  // --- LINKS EDITOR ---
  function getIconSelectOptionsHtml(selectedIcon) {
    const icons = window.BIO_ICONS || {};
    return Object.keys(icons)
      .map((key) => {
        const isSel = key === (selectedIcon || 'none') ? 'selected' : '';
        return `<option value="${key}" ${isSel}>${icons[key].label}</option>`;
      })
      .join('');
  }

  function renderLinksEditor() {
    const container = document.getElementById('links-editor-container');
    container.innerHTML = '';
    const links = state.links || [];

    if (links.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--adm-muted);">Chưa có đường dẫn nào. Hãy bấm "+ Thêm đường dẫn mới" nhé!</p>`;
      return;
    }

    links.forEach((link, idx) => {
      const card = document.createElement('div');
      card.className = 'link-editor-item';
      const iconPreviewSvg = window.getBioIconSvg(link.icon) || '<span style="font-size:0.75rem; color:#999;">—</span>';

      card.innerHTML = `
        <div class="link-editor-header">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0;">
            <span style="width: 32px; height: 32px; border-radius: 10px; background: var(--adm-primary-light); color: var(--adm-primary); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span class="link-icon-preview" style="width: 18px; height: 18px; display: inline-flex;">${iconPreviewSvg}</span>
            </span>
            <strong style="font-size: 0.92rem; word-break: break-word;">Nút #${idx + 1}: ${escapeHtml(link.title || 'Chưa đặt tên')}</strong>
            <span class="link-click-pill">👆 ${Number(link.clicks || 0)} lượt click</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <label class="switch-label">
              <input type="checkbox" class="link-toggle-enabled" ${link.enabled !== false ? 'checked' : ''} />
              <span>Hiện</span>
            </label>
            <button type="button" class="btn btn-outline btn-sm link-move-up" ${idx === 0 ? 'disabled' : ''} title="Chuyển lên">↑</button>
            <button type="button" class="btn btn-outline btn-sm link-move-down" ${idx === links.length - 1 ? 'disabled' : ''} title="Chuyển xuống">↓</button>
            <button type="button" class="btn btn-danger btn-sm link-delete" title="Xóa nút này">🗑️</button>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Tiêu đề hiển thị trên nút</label>
            <input type="text" class="form-input link-input-title" value="${escapeAttr(link.title)}" placeholder="VD: FASHION STORE" />
          </div>
          <div class="form-group">
            <label class="form-label">Đường dẫn đích (URL khi khách bấm vào)</label>
            <input type="text" class="form-input link-input-url" value="${escapeAttr(link.url)}" placeholder="https://shopee.vn/..." />
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Biểu tượng (Icon đầu nút)</label>
            <select class="form-select link-select-icon">
              ${getIconSelectOptionsHtml(link.icon)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Phụ đề nhỏ dưới tiêu đề (Để trống nếu muốn gọn chuẩn Canva)</label>
            <input type="text" class="form-input link-input-subtitle" value="${escapeAttr(link.subtitle)}" placeholder="Tùy chọn: Mô tả ngắn..." />
          </div>
        </div>

        <div class="form-grid" style="align-items: center;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nhãn nổi bật góc phải (VD: HOT, NEW, FREE)</label>
            <input type="text" class="form-input link-input-badge" value="${escapeAttr(link.badge)}" placeholder="Để trống nếu không dùng nhãn" />
          </div>
          <div style="padding-top: 18px;">
            <label class="switch-label">
              <input type="checkbox" class="link-toggle-shimmer" ${link.shimmer ? 'checked' : ''} />
              <span>✨ Hiệu ứng ánh sáng lấp lánh chạy qua nút (Shimmer)</span>
            </label>
          </div>
        </div>
      `;

      // Bind events
      card.querySelector('.link-input-title').addEventListener('input', (e) => {
        link.title = e.target.value;
        syncPreview();
      });
      card.querySelector('.link-input-url').addEventListener('input', (e) => {
        link.url = e.target.value;
        syncPreview();
      });
      card.querySelector('.link-input-subtitle').addEventListener('input', (e) => {
        link.subtitle = e.target.value;
        syncPreview();
      });
      card.querySelector('.link-input-badge').addEventListener('input', (e) => {
        link.badge = e.target.value;
        syncPreview();
      });
      card.querySelector('.link-select-icon').addEventListener('change', (e) => {
        link.icon = e.target.value;
        card.querySelector('.link-icon-preview').innerHTML = window.getBioIconSvg(link.icon) || '—';
        syncPreview();
      });
      card.querySelector('.link-toggle-enabled').addEventListener('change', (e) => {
        link.enabled = e.target.checked;
        syncPreview();
      });
      card.querySelector('.link-toggle-shimmer').addEventListener('change', (e) => {
        link.shimmer = e.target.checked;
        syncPreview();
      });
      card.querySelector('.link-move-up').addEventListener('click', () => {
        if (idx === 0) return;
        const temp = state.links[idx - 1];
        state.links[idx - 1] = state.links[idx];
        state.links[idx] = temp;
        renderLinksEditor();
        syncPreview();
      });
      card.querySelector('.link-move-down').addEventListener('click', () => {
        if (idx === state.links.length - 1) return;
        const temp = state.links[idx + 1];
        state.links[idx + 1] = state.links[idx];
        state.links[idx] = temp;
        renderLinksEditor();
        syncPreview();
      });
      card.querySelector('.link-delete').addEventListener('click', () => {
        state.links.splice(idx, 1);
        renderLinksEditor();
        syncPreview();
      });

      container.appendChild(card);
    });
  }

  document.getElementById('btn-add-link').addEventListener('click', () => {
    if (!state.links) state.links = [];
    state.links.push({
      id: `link-${Date.now()}`,
      title: 'ĐƯỜNG DẪN MỚI',
      subtitle: '',
      url: 'https://',
      icon: 'sparkles',
      badge: '',
      shimmer: false,
      enabled: true,
      clicks: 0
    });
    renderLinksEditor();
    syncPreview();
    showToast('➕ Đã thêm đường dẫn mới!');
  });

  // --- SOCIALS EDITOR ---
  const SOCIAL_PLATFORMS = [
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'shopee', label: 'Shopee' },
    { key: 'zalo', label: 'Zalo' },
    { key: 'threads', label: 'Threads' },
    { key: 'mail', label: 'Email (mailto:)' },
    { key: 'phone', label: 'Điện thoại (tel:)' },
    { key: 'pinterest', label: 'Pinterest' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'spotify', label: 'Spotify' },
    { key: 'twitter', label: 'Twitter / X' },
    { key: 'globe', label: 'Website riêng' }
  ];

  function renderSocialsEditor() {
    const container = document.getElementById('socials-editor-container');
    container.innerHTML = '';
    const socials = state.socials || [];

    socials.forEach((soc, idx) => {
      const row = document.createElement('div');
      row.className = 'link-editor-item';
      row.style.padding = '14px 16px';

      const platformOptions = SOCIAL_PLATFORMS.map((p) => {
        const sel = p.key === soc.platform ? 'selected' : '';
        return `<option value="${p.key}" ${sel}>${p.label}</option>`;
      }).join('');

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span class="soc-icon-preview" style="width: 36px; height: 36px; border-radius: 50%; background: var(--adm-primary-light); color: var(--adm-primary); display: inline-flex; align-items: center; justify-content: center;">
            <span style="width: 18px; height: 18px; display: inline-flex;">${window.getBioIconSvg(soc.platform)}</span>
          </span>
          <select class="form-select soc-select-platform" style="width: 165px; max-width: 100%;">
            ${platformOptions}
          </select>
          <input type="text" class="form-input soc-input-url" style="flex: 1 1 180px; min-width: 0;" value="${escapeAttr(soc.url)}" placeholder="https://... hoặc mailto:email@..." />
          <label class="switch-label">
            <input type="checkbox" class="soc-toggle-enabled" ${soc.enabled ? 'checked' : ''} />
            <span>Hiện</span>
          </label>
          <button type="button" class="btn btn-outline btn-sm soc-move-up" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-outline btn-sm soc-move-down" ${idx === socials.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-danger btn-sm soc-delete">🗑️</button>
        </div>
      `;

      row.querySelector('.soc-select-platform').addEventListener('change', (e) => {
        soc.platform = e.target.value;
        const found = SOCIAL_PLATFORMS.find((p) => p.key === soc.platform);
        soc.label = found ? found.label : soc.platform;
        row.querySelector('.soc-icon-preview span').innerHTML = window.getBioIconSvg(soc.platform);
        syncPreview();
      });
      row.querySelector('.soc-input-url').addEventListener('input', (e) => {
        soc.url = e.target.value;
        syncPreview();
      });
      row.querySelector('.soc-toggle-enabled').addEventListener('change', (e) => {
        soc.enabled = e.target.checked;
        syncPreview();
      });
      row.querySelector('.soc-move-up').addEventListener('click', () => {
        if (idx === 0) return;
        const tmp = state.socials[idx - 1];
        state.socials[idx - 1] = state.socials[idx];
        state.socials[idx] = tmp;
        renderSocialsEditor();
        syncPreview();
      });
      row.querySelector('.soc-move-down').addEventListener('click', () => {
        if (idx === state.socials.length - 1) return;
        const tmp = state.socials[idx + 1];
        state.socials[idx + 1] = state.socials[idx];
        state.socials[idx] = tmp;
        renderSocialsEditor();
        syncPreview();
      });
      row.querySelector('.soc-delete').addEventListener('click', () => {
        state.socials.splice(idx, 1);
        renderSocialsEditor();
        syncPreview();
      });

      container.appendChild(row);
    });
  }

  document.getElementById('btn-add-social').addEventListener('click', () => {
    if (!state.socials) state.socials = [];
    state.socials.push({
      id: `soc-${Date.now()}`,
      platform: 'tiktok',
      label: 'TikTok',
      url: 'https://tiktok.com/',
      enabled: true
    });
    renderSocialsEditor();
    syncPreview();
  });

  // --- DIRECT INPUT LISTENERS FOR PROFILE, FEATURED CARD, THEME & SEO ---
  function bindInput(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (!state) return;
      callback(el);
      syncPreview();
    });
    el.addEventListener('change', () => {
      if (!state) return;
      callback(el);
      syncPreview();
    });
  }

  // Profile bindings
  bindInput('prof-avatar', (el) => {
    state.profile.avatar = el.value;
    document.getElementById('prof-avatar-preview').src = el.value;
  });
  bindInput('prof-name', (el) => { state.profile.name = el.value; });
  bindInput('prof-subtitle', (el) => { state.profile.subtitle = el.value; });
  bindInput('prof-bio', (el) => { state.profile.bio = el.value; });
  bindInput('prof-quote', (el) => { state.profile.quote = el.value; });

  // Featured Card bindings
  bindInput('fc-enabled', (el) => { state.featuredCard.enabled = el.checked; });
  bindInput('fc-style', (el) => { state.featuredCard.style = el.value; });
  bindInput('fc-cta-text', (el) => { state.featuredCard.ctaText = el.value; });
  bindInput('fc-title', (el) => { state.featuredCard.title = el.value; });
  bindInput('fc-subtitle', (el) => { state.featuredCard.subtitle = el.value; });
  bindInput('fc-url', (el) => { state.featuredCard.url = el.value; });
  bindInput('fc-image', (el) => {
    state.featuredCard.image = el.value;
    document.getElementById('fc-img-preview').src = el.value;
  });

  // Theme, Deep Color & Deep Typography bindings
  bindInput('theme-avatar-frame', (el) => { state.theme.avatarFrame = el.value; });
  bindInput('theme-avatar-size', (el) => {
    state.theme.avatarSize = Number(el.value);
    document.getElementById('avatar-size-val').textContent = el.value;
  });
  bindInput('theme-bg-type', (el) => { state.theme.bgType = el.value; });
  bindInput('theme-particles', (el) => { state.theme.particleEffect = el.value; });
  bindInput('theme-bg-image', (el) => {
    state.theme.bgImage = el.value;
    document.getElementById('theme-bg-preview').src = el.value;
  });
  bindInput('theme-portrait-image', (el) => {
    state.theme.portraitBgImage = el.value;
    document.getElementById('theme-portrait-preview').src = el.value;
  });
  bindInput('theme-cover-image', (el) => {
    state.theme.coverImage = el.value;
    const prev = document.getElementById('theme-cover-preview');
    if (prev) prev.src = el.value || state.theme.bgImage || state.profile.avatar || '';
  });
  bindInput('theme-overlay-opacity', (el) => {
    state.theme.bgOverlayOpacity = Number(el.value);
    document.getElementById('overlay-opacity-val').textContent = el.value;
  });
  bindInput('theme-bg-blur', (el) => {
    state.theme.bgBlur = Number(el.value);
    document.getElementById('bg-blur-val').textContent = el.value;
  });
  bindInput('theme-heading-font', (el) => { state.theme.headingFont = el.value; });
  bindInput('theme-body-font', (el) => { state.theme.bodyFont = el.value; });
  bindInput('theme-quote-font', (el) => { state.theme.quoteFont = el.value; });
  bindInput('theme-uppercase-links', (el) => { state.theme.uppercaseLinks = el.checked; });
  bindInput('theme-show-decorations', (el) => { state.theme.showDecorations = el.checked; });
  bindInput('theme-button-style', (el) => { state.theme.buttonStyle = el.value; });
  bindInput('theme-button-radius', (el) => { state.theme.buttonRadius = el.value; });
  bindInput('theme-btn-bg-opacity', (el) => {
    state.theme.buttonBgOpacity = Number(el.value);
    const lbl = document.getElementById('btn-bg-opacity-val');
    if (lbl) lbl.textContent = el.value;
  });

  function bindColorPicker(inputId, hexBadgeId, applyFn) {
    bindInput(inputId, (el) => {
      applyFn(el.value);
      const badge = document.getElementById(hexBadgeId);
      if (badge) badge.textContent = String(el.value || '').toUpperCase();
    });
  }

  bindColorPicker('theme-bg-grad-start', 'hex-bg-grad-start', (v) => { state.theme.bgGradientStart = v; });
  bindColorPicker('theme-bg-grad-mid', 'hex-bg-grad-mid', (v) => { state.theme.bgGradientMid = v; });
  bindColorPicker('theme-bg-grad-end', 'hex-bg-grad-end', (v) => { state.theme.bgGradientEnd = v; });
  bindColorPicker('theme-overlay-color', 'hex-overlay-color', (v) => { state.theme.bgOverlayColor = v; });
  bindColorPicker('theme-primary-color', 'hex-primary-color', (v) => { state.theme.primaryColor = v; });
  bindColorPicker('theme-text-color', 'hex-text-color', (v) => { state.theme.textColor = v; });
  bindColorPicker('theme-subtitle-color', 'hex-subtitle-color', (v) => { state.theme.subtitleColor = v; });
  bindColorPicker('theme-quote-color', 'hex-quote-color', (v) => { state.theme.quoteColor = v; });
  bindColorPicker('theme-btn-bg-color', 'hex-btn-bg-color', (v) => { state.theme.buttonBgColor = v; });
  bindColorPicker('theme-btn-text-color', 'hex-btn-text-color', (v) => { state.theme.buttonTextColor = v; });
  bindColorPicker('theme-btn-border-color', 'hex-btn-border-color', (v) => { state.theme.buttonBorderColor = v; });
  bindColorPicker('theme-social-bg-color', 'hex-social-bg-color', (v) => { state.theme.socialBgColor = v; });
  bindColorPicker('theme-social-icon-color', 'hex-social-icon-color', (v) => { state.theme.socialIconColor = v; });

  const btnSyncSolidBg = document.getElementById('btn-sync-solid-bg');
  if (btnSyncSolidBg) {
    btnSyncSolidBg.addEventListener('click', () => {
      if (!state || !state.theme) return;
      const base = state.theme.bgGradientStart || '#121215';
      state.theme.bgGradientMid = base;
      state.theme.bgGradientEnd = base;
      state.theme.bgType = 'gradient';
      populateAllEditors();
      syncPreview();
      showToast('🎯 Đã đồng bộ nền trang về 1 màu phẳng đồng nhất!');
    });
  }

  // Deep Typography Slider Bindings
  function bindTypoSlider(inputId, badgeId, propName) {
    bindInput(inputId, (el) => {
      const val = Number(el.value);
      state.theme[propName] = val;
      const badge = document.getElementById(badgeId);
      if (badge) badge.textContent = `${val}px`;
    });
  }

  bindTypoSlider('theme-name-size', 'val-name-size', 'nameFontSize');
  bindTypoSlider('theme-name-spacing', 'val-name-spacing', 'nameLetterSpacing');
  bindTypoSlider('theme-subtitle-size', 'val-subtitle-size', 'subtitleFontSize');
  bindTypoSlider('theme-bio-size', 'val-bio-size', 'bioFontSize');
  bindTypoSlider('theme-btn-size', 'val-btn-size', 'buttonFontSize');
  bindTypoSlider('theme-btn-sub-size', 'val-btn-sub-size', 'buttonSubFontSize');
  bindTypoSlider('theme-quote-size', 'val-quote-size', 'quoteFontSize');
  bindTypoSlider('theme-btn-height', 'val-btn-height', 'buttonMinHeight');
  bindTypoSlider('theme-btn-gap', 'val-btn-gap', 'buttonGap');

  const btnResetTypo = document.getElementById('btn-reset-typography');
  if (btnResetTypo) {
    btnResetTypo.addEventListener('click', () => {
      if (!state || !state.theme) return;
      state.theme.nameFontSize = 0;
      state.theme.nameLetterSpacing = null;
      state.theme.subtitleFontSize = 0;
      state.theme.bioFontSize = 0;
      state.theme.buttonFontSize = 0;
      state.theme.buttonSubFontSize = 0;
      state.theme.quoteFontSize = 0;
      state.theme.buttonMinHeight = 0;
      state.theme.buttonGap = 0;
      populateAllEditors();
      syncPreview();
      showToast('↺ Đã đặt lại cỡ chữ & kích thước nút về chuẩn tự động của mẫu!');
    });
  }

  bindInput('theme-social-position', (el) => { state.theme.socialPosition = el.value; });
  bindInput('theme-social-style', (el) => { state.theme.socialStyle = el.value; });

  // Quick background & photo picks
  document.querySelectorAll('.bg-quick-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      state.theme.bgImage = url;
      document.getElementById('theme-bg-image').value = url;
      document.getElementById('theme-bg-preview').src = url;
      syncPreview();
    });
  });

  document.querySelectorAll('.avatar-quick-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      state.profile.avatar = url;
      document.getElementById('prof-avatar').value = url;
      document.getElementById('prof-avatar-preview').src = url;
      syncPreview();
      showToast('📸 Đã chọn ảnh đại diện!');
    });
  });

  document.querySelectorAll('.fc-quick-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      state.featuredCard.image = url;
      document.getElementById('fc-image').value = url;
      document.getElementById('fc-img-preview').src = url;
      syncPreview();
      showToast('📸 Đã chọn ảnh cho Banner bộ sưu tập!');
    });
  });

  document.querySelectorAll('.portrait-quick-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      state.theme.portraitBgImage = url;
      document.getElementById('theme-portrait-image').value = url;
      document.getElementById('theme-portrait-preview').src = url;
      syncPreview();
      showToast('📸 Đã chọn ảnh chân dung tràn nền!');
    });
  });

  document.querySelectorAll('.cover-quick-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      state.theme.coverImage = url;
      const inp = document.getElementById('theme-cover-image');
      const prev = document.getElementById('theme-cover-preview');
      if (inp) inp.value = url;
      if (prev) prev.src = url;
      syncPreview();
      showToast('🖼️ Đã chọn ảnh bìa đầu trang (Cover)!');
    });
  });

  // File Uploads
  document.getElementById('prof-avatar-file').addEventListener('change', (e) => {
    compressAndUploadImage(e.target.files[0], (url) => {
      state.profile.avatar = url;
      document.getElementById('prof-avatar').value = url;
      document.getElementById('prof-avatar-preview').src = url;
      syncPreview();
    });
  });

  document.getElementById('fc-file-input').addEventListener('change', (e) => {
    compressAndUploadImage(e.target.files[0], (url) => {
      state.featuredCard.image = url;
      document.getElementById('fc-image').value = url;
      document.getElementById('fc-img-preview').src = url;
      syncPreview();
    });
  });

  document.getElementById('theme-bg-file').addEventListener('change', (e) => {
    compressAndUploadImage(e.target.files[0], (url) => {
      state.theme.bgImage = url;
      document.getElementById('theme-bg-image').value = url;
      document.getElementById('theme-bg-preview').src = url;
      syncPreview();
    });
  });

  document.getElementById('theme-portrait-file').addEventListener('change', (e) => {
    compressAndUploadImage(e.target.files[0], (url) => {
      state.theme.portraitBgImage = url;
      document.getElementById('theme-portrait-image').value = url;
      document.getElementById('theme-portrait-preview').src = url;
      syncPreview();
    });
  });

  const themeCoverFile = document.getElementById('theme-cover-file');
  if (themeCoverFile) {
    themeCoverFile.addEventListener('change', (e) => {
      compressAndUploadImage(e.target.files[0], (url) => {
        state.theme.coverImage = url;
        const inp = document.getElementById('theme-cover-image');
        const prev = document.getElementById('theme-cover-preview');
        if (inp) inp.value = url;
        if (prev) prev.src = url;
        syncPreview();
      });
    });
  }

  // SEO bindings (footerText locked across all pages)
  bindInput('seo-title', (el) => { state.seo.pageTitle = el.value; });
  bindInput('seo-desc', (el) => { state.seo.metaDescription = el.value; });
  bindInput('seo-share-btn', (el) => { state.seo.showShareButton = el.checked; });

  // Password Change
  document.getElementById('btn-change-password').addEventListener('click', async () => {
    const newUsername = document.getElementById('auth-new-user').value;
    const currentPassword = document.getElementById('auth-current-pass').value;
    const newPassword = document.getElementById('auth-new-pass').value;

    const res = await fetch('/api/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ currentPassword, newUsername, newPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        authToken = data.token;
        localStorage.setItem(TOKEN_KEY, authToken);
      }
      document.getElementById('auth-current-pass').value = '';
      document.getElementById('auth-new-pass').value = '';
      showToast('Đã đổi mật khẩu đồng bộ cho cả Bio Admin & Shop Admin!');
    } else {
      showToast(data.message || 'Không thể đổi mật khẩu', true);
    }
  });

  // Reset Analytics / Restore Defaults
  document.getElementById('btn-reset-analytics').addEventListener('click', async () => {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ type: 'analytics' })
    });
    const data = await res.json();
    if (res.ok && data.data) {
      state = data.data;
      populateAllEditors();
      await fetchRealAnalytics();
      showToast('📊 Đã đặt lại bộ đếm thống kê về 0!');
    }
  });

  const btnRefreshAna = document.getElementById('btn-refresh-analytics');
  if (btnRefreshAna) {
    btnRefreshAna.addEventListener('click', async () => {
      await fetchRealAnalytics();
      showToast('🔄 Đã cập nhật số liệu thống kê thực tế mới nhất!');
    });
  }

  const btnReconnectMongo = document.getElementById('btn-reconnect-mongo');
  if (btnReconnectMongo) {
    btnReconnectMongo.addEventListener('click', async () => {
      const uri = document.getElementById('mongo-uri-input').value.trim();
      const dbName = document.getElementById('mongo-db-input').value.trim();
      showToast('⏳ Đang kiểm tra kết nối MongoDB...');
      const res = await fetch('/api/mongo/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ uri: uri || undefined, dbName: dbName || undefined })
      });
      const data = await res.json();
      await fetchRealAnalytics();
      showToast(data.message || 'Đã kiểm tra kết nối MongoDB!', !data.connected);
    });
  }

  // Auto-refresh real analytics every 8 seconds
  setInterval(() => {
    if (authToken) fetchRealAnalytics();
  }, 8000);

  document.getElementById('btn-restore-defaults').addEventListener('click', async () => {
    if (!confirm('Bạn có chắc muốn khôi phục toàn bộ giao diện & đường dẫn về mẫu gốc ban đầu không?')) return;
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ type: 'all' })
    });
    const data = await res.json();
    if (res.ok && data.data) {
      state = data.data;
      populateAllEditors();
      syncPreview();
      showToast('✨ Đã khôi phục cấu hình mẫu ban đầu!');
    }
  });

  // Mobile Preview Modal Toggle
  const previewCol = document.getElementById('preview-column');
  const btnCloseMobilePreview = document.getElementById('btn-close-mobile-preview');
  document.getElementById('btn-toggle-mobile-preview').addEventListener('click', () => {
    previewCol.classList.add('mobile-open');
    btnCloseMobilePreview.style.display = 'inline-flex';
    syncPreview();
  });
  btnCloseMobilePreview.addEventListener('click', () => {
    previewCol.classList.remove('mobile-open');
    btnCloseMobilePreview.style.display = 'none';
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  previewIframe.addEventListener('load', () => {
    try {
      const doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
      if (doc && doc.head) {
        const fixStyle = doc.createElement('style');
        fixStyle.textContent = `
          *, html, body, .bio-page-wrapper, .bio-phone-card {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          *::-webkit-scrollbar, html::-webkit-scrollbar, body::-webkit-scrollbar, .bio-phone-card::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            display: none !important;
            background: transparent !important;
          }
          html { overflow-x: clip !important; }
          body { overflow-x: clip !important; overflow-y: visible !important; }
          .bio-phone-card { overflow: hidden !important; max-height: none !important; }
          .bio-link-btn { padding: 11px 48px !important; min-height: 46px !important; }
          .link-text-group { padding: 0 !important; width: 100% !important; }
        `;
        doc.head.appendChild(fixStyle);
      }
    } catch (e) { }
    syncPreview();
  });

  checkAuthAndLoad();
})();
