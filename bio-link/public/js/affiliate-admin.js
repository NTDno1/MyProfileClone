// Quản Trị Trang Affiliate Riêng (/affiliate-admin) — Dùng chung SSO với /admin & /shop-admin
(function () {
  const TOKEN_KEY = 'bio_admin_token';
  const PAGE_SIZE = 30;

  let authToken = localStorage.getItem(TOKEN_KEY) || '';
  let storeData = null;
  let nextAutoCode = '01';
  let currentPage = 1;
  let searchFilter = '';
  let catFilter = 'all';

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

  function escapeHtml(s) {
    return String(s ?? '')
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
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
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

  function readImageCompressed(file, maxWidth = 1000) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawUrl = ev.target.result;
        if (file.type === 'image/svg+xml' || file.type === 'image/gif') return resolve(rawUrl);
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
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86));
        };
        img.onerror = reject;
        img.src = rawUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadFile(file) {
    const dataUrl = await readImageCompressed(file);
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, folder: 'affiliate', filename: file.name })
    });
    return res.url;
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => (p.style.display = 'none'));
      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.tab);
      if (pane) pane.style.display = 'block';
    });
  });

  // Auth
  loginForm?.addEventListener('submit', async (e) => {
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
        return showToast(json.message || 'Sai tài khoản hoặc mật khẩu!', true);
      }
      authToken = json.token;
      localStorage.setItem(TOKEN_KEY, authToken);
      loginOverlay.style.display = 'none';
      showToast('Đăng nhập Quản trị Affiliate thành công! ✨');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
    authToken = '';
    localStorage.removeItem(TOKEN_KEY);
    loginOverlay.style.display = 'flex';
  });

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

      const data = await apiFetch('/api/affiliate/admin/overview');
      loginOverlay.style.display = 'none';
      storeData = data.store;
      nextAutoCode = data.nextCode || '01';

      const dbBadge = document.getElementById('db-badge');
      if (dbBadge) {
        dbBadge.textContent = data.mongoConnected
          ? `🟢 MongoDB Atlas: ${data.mongoDbName || 'na2hand_shop'}`
          : `🟡 Local JSON (${data.mongoDbName || 'na2hand_shop'})`;
      }

      const m = data.metrics || {};
      document.getElementById('kpi-items').textContent = m.totalItems || 0;
      document.getElementById('kpi-clicks').textContent = m.totalClicks || 0;
      document.getElementById('kpi-views').textContent = m.totalViews || 0;
      document.getElementById('kpi-top').textContent =
        m.topItemClicks > 0 ? `${m.topItemName} (${m.topItemClicks} click)` : 'Chưa có lượt bấm';

      if (!document.getElementById('af-id').value) {
        document.getElementById('af-code').value = nextAutoCode;
      }

      renderCategorySelects();
      renderItemsTable();
      renderCategoriesAdmin();
      populateProfileForm();
    } catch (err) {
      if (authToken) showToast(err.message, true);
    }
  }

  function renderCategorySelects() {
    if (!storeData) return;
    const cats = storeData.categories || [];
    const opts = cats.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');

    const afCat = document.getElementById('af-cat');
    const prevAf = afCat?.value;
    if (afCat) {
      afCat.innerHTML = opts;
      if (prevAf && cats.some((c) => c.id === prevAf)) afCat.value = prevAf;
    }

    const bulkCat = document.getElementById('bulk-cat');
    if (bulkCat) bulkCat.innerHTML = opts;

    const filterCat = document.getElementById('filter-cat');
    if (filterCat) {
      filterCat.innerHTML = `<option value="all">Tất cả danh mục</option>${opts}`;
      filterCat.value = catFilter;
    }
  }

  function resetForm() {
    document.getElementById('af-id').value = '';
    document.getElementById('af-url').value = '';
    document.getElementById('af-code').value = nextAutoCode;
    document.getElementById('af-name').value = '';
    document.getElementById('af-image').value = '';
    document.getElementById('af-img-preview').src = '/media/bio-link/girlfriend-1.jpg';
    document.getElementById('af-price').value = '';
    document.getElementById('af-badge').value = '';
    document.getElementById('af-pinned').checked = false;
    document.getElementById('af-enabled').checked = true;
    document.getElementById('aff-form-heading').textContent = '➕ Đăng Sản Phẩm Affiliate Mới';
  }

  document.getElementById('btn-reset-form')?.addEventListener('click', resetForm);

  document.getElementById('af-image')?.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (v) document.getElementById('af-img-preview').src = v;
  });

  document.getElementById('af-upload-file')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    showToast('Đang tải ảnh lên kho lưu trữ... ⏳');
    try {
      const url = await uploadFile(f);
      document.getElementById('af-image').value = url;
      document.getElementById('af-img-preview').src = url;
      showToast('Đã tải ảnh sản phẩm lên thành công! ✨');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('btn-auto-fetch-meta')?.addEventListener('click', async () => {
    const url = document.getElementById('af-url').value.trim();
    if (!url) return showToast('Hãy dán Link Affiliate vào ô trước nhé!', true);
    const btn = document.getElementById('btn-auto-fetch-meta');
    const oldHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang đọc link...';
    try {
      const res = await apiFetch('/api/affiliate/admin/fetch-meta', {
        method: 'POST',
        body: JSON.stringify({ url })
      });
      if (res.name && !document.getElementById('af-name').value.trim()) {
        document.getElementById('af-name').value = res.name;
      }
      if (res.image) {
        document.getElementById('af-image').value = res.image;
        document.getElementById('af-img-preview').src = res.image;
      }
      if (res.price && !document.getElementById('af-price').value) {
        document.getElementById('af-price').value = res.price;
      }
      showToast(res.message || 'Đã đọc thông tin từ link!');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  });

  document.getElementById('aff-item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('af-id').value.trim();
    const payload = {
      code: document.getElementById('af-code').value.trim(),
      name: document.getElementById('af-name').value.trim(),
      categoryId: document.getElementById('af-cat').value,
      affiliateUrl: document.getElementById('af-url').value.trim(),
      image: document.getElementById('af-image').value.trim() || '/media/bio-link/girlfriend-1.jpg',
      price: Number(document.getElementById('af-price').value || 0),
      badge: document.getElementById('af-badge').value.trim(),
      pinned: document.getElementById('af-pinned').checked,
      enabled: document.getElementById('af-enabled').checked
    };

    try {
      if (id) {
        await apiFetch(`/api/affiliate/admin/items/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Đã cập nhật sản phẩm Affiliate! ✨');
      } else {
        await apiFetch('/api/affiliate/admin/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Đã đăng sản phẩm Affiliate mới! 🎉');
      }
      resetForm();
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('filter-search')?.addEventListener('input', (e) => {
    searchFilter = e.target.value.trim().toLowerCase();
    currentPage = 1;
    renderItemsTable();
  });

  document.getElementById('filter-cat')?.addEventListener('change', (e) => {
    catFilter = e.target.value;
    currentPage = 1;
    renderItemsTable();
  });

  function renderItemsTable() {
    const tbody = document.getElementById('aff-items-tbody');
    const pager = document.getElementById('aff-items-pager');
    if (!tbody || !storeData) return;

    const catMap = {};
    (storeData.categories || []).forEach((c) => (catMap[c.id] = c.name));

    let list = [...(storeData.items || [])];
    if (catFilter !== 'all') list = list.filter((x) => x.categoryId === catFilter);
    if (searchFilter) {
      list = list.filter(
        (x) =>
          String(x.code || '').toLowerCase().includes(searchFilter) ||
          String(x.name || '').toLowerCase().includes(searchFilter)
      );
    }

    document.getElementById('list-total-cnt').textContent = list.length;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:var(--muted);">Chưa có sản phẩm Affiliate nào khớp bộ lọc.</td></tr>`;
      if (pager) pager.innerHTML = '';
      return;
    }

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const paged = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    tbody.innerHTML = paged
      .map((it) => {
        const directShare = `${window.location.origin}/tu-do?q=${encodeURIComponent(it.code || it.name)}`;
        return `
          <tr>
            <td>
              <img src="${escapeHtml(it.image || '/media/bio-link/girlfriend-1.jpg')}" style="width:48px; height:48px; border-radius:10px; object-fit:cover; border:1px solid var(--border);" />
            </td>
            <td>
              <div style="font-weight:800; color:var(--text);">
                ${it.code ? `<span style="color:var(--pri);">#${escapeHtml(it.code)}.</span> ` : ''}${escapeHtml(it.name)}
              </div>
              <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">
                ${it.pinned ? '📌 Đang ghim đầu • ' : ''}
                ${it.enabled === false ? '🙈 Đang ẩn' : '👁️ Đang hiện'}
                ${it.badge ? ` • Nhãn: <strong>${escapeHtml(it.badge)}</strong>` : ''}
              </div>
            </td>
            <td>
              <span class="badge" style="background:#fce7f3; color:#be185d;">${escapeHtml(catMap[it.categoryId] || 'Khác')}</span>
            </td>
            <td style="max-width:210px;">
              <a href="${escapeHtml(it.affiliateUrl)}" target="_blank" rel="noopener" style="font-size:0.76rem; color:var(--pri); font-weight:700; word-break:break-all;">
                Mở Link Affiliate ↗
              </a>
            </td>
            <td>
              <strong style="font-size:0.9rem; color:#15803d;">👆 ${Number(it.clicks || 0)}</strong>
            </td>
            <td>
              <div style="display:flex; gap:5px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-copy-code-link" data-link="${escapeHtml(directShare)}" title="Copy link tìm sẵn mã này để gắn vào bình luận TikTok">📋 Copy Link Mã</button>
                <button type="button" class="btn btn-sm btn-edit-aff" data-id="${escapeHtml(it.id)}">Sửa</button>
                <button type="button" class="btn btn-sm btn-dup-aff" data-id="${escapeHtml(it.id)}">Nhân bản</button>
                <button type="button" class="btn btn-sm btn-danger btn-del-aff" data-id="${escapeHtml(it.id)}">Xóa</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.btn-copy-code-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.link);
        showToast('Đã copy link trỏ thẳng tới mã sản phẩm này! 📋');
      });
    });

    tbody.querySelectorAll('.btn-edit-aff').forEach((btn) => {
      btn.addEventListener('click', () => {
        const it = (storeData.items || []).find((x) => x.id === btn.dataset.id);
        if (!it) return;
        document.getElementById('af-id').value = it.id;
        document.getElementById('af-code').value = it.code || '';
        document.getElementById('af-name').value = it.name || '';
        document.getElementById('af-cat').value = it.categoryId || '';
        document.getElementById('af-url').value = it.affiliateUrl || '';
        document.getElementById('af-image').value = it.image || '';
        document.getElementById('af-img-preview').src = it.image || '/media/bio-link/girlfriend-1.jpg';
        document.getElementById('af-price').value = it.price || '';
        document.getElementById('af-badge').value = it.badge || '';
        document.getElementById('af-pinned').checked = Boolean(it.pinned);
        document.getElementById('af-enabled').checked = it.enabled !== false;
        document.getElementById('aff-form-heading').textContent = `✏️ Đang sửa #${it.code || ''}: ${it.name}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tbody.querySelectorAll('.btn-dup-aff').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await apiFetch(`/api/affiliate/admin/items/${btn.dataset.id}/duplicate`, { method: 'POST' });
          showToast(res.message || 'Đã nhân bản!');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    tbody.querySelectorAll('.btn-del-aff').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Bạn chắc chắn muốn xóa sản phẩm Affiliate này?')) return;
        try {
          await apiFetch(`/api/affiliate/admin/items/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Đã xóa sản phẩm Affiliate.');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    // Pagination (30 rows / page)
    if (pager) {
      const from = (currentPage - 1) * PAGE_SIZE + 1;
      const to = Math.min(list.length, currentPage * PAGE_SIZE);
      let btns = '';
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
          btns += `<button type="button" class="btn btn-sm ${p === currentPage ? 'btn-primary' : ''}" data-pg="${p}">${p}</button>`;
        }
      }
      pager.innerHTML = `
        <span style="color:var(--muted);">Hiển thị <strong>${from}–${to}</strong> / <strong>${list.length}</strong> sản phẩm (30 dòng/trang)</span>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">${btns}</div>
      `;
      pager.querySelectorAll('button[data-pg]').forEach((b) => {
        b.addEventListener('click', () => {
          currentPage = Number(b.dataset.pg);
          renderItemsTable();
        });
      });
    }
  }

  // Bulk Import & Clone from Shop
  document.getElementById('btn-run-bulk')?.addEventListener('click', async () => {
    const linesText = document.getElementById('bulk-lines').value.trim();
    const categoryId = document.getElementById('bulk-cat').value;
    if (!linesText) return showToast('Vui lòng dán danh sách sản phẩm vào ô trước nhé!', true);
    try {
      const res = await apiFetch('/api/affiliate/admin/items/bulk', {
        method: 'POST',
        body: JSON.stringify({ linesText, categoryId })
      });
      document.getElementById('bulk-lines').value = '';
      showToast(res.message);
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById('btn-clone-from-shop')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/affiliate/admin/import-from-shop', { method: 'POST' });
      showToast(res.message);
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Categories Admin
  function renderCategoriesAdmin() {
    const box = document.getElementById('aff-cats-admin-list');
    if (!box || !storeData) return;
    const cats = storeData.categories || [];
    const countMap = {};
    (storeData.items || []).forEach((it) => {
      countMap[it.categoryId] = (countMap[it.categoryId] || 0) + 1;
    });

    box.innerHTML = cats
      .map(
        (c, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid #f6e4ec;">
          <div>
            <strong>${escapeHtml(c.name)}</strong>
            <span style="font-size:0.75rem; color:var(--muted); margin-left:6px;">(${countMap[c.id] || 0} sản phẩm)</span>
          </div>
          <div style="display:flex; gap:5px;">
            <button type="button" class="btn btn-sm cat-move" data-dir="-1" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="btn btn-sm cat-move" data-dir="1" data-idx="${idx}" ${idx === cats.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="btn btn-sm btn-danger cat-del" data-id="${escapeHtml(c.id)}">Xóa</button>
          </div>
        </div>
      `
      )
      .join('');

    box.querySelectorAll('.cat-move').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.idx);
        const dir = Number(btn.dataset.dir);
        const arr = [...cats];
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        const tmp = arr[idx];
        arr[idx] = arr[target];
        arr[target] = tmp;
        await apiFetch('/api/affiliate/admin/categories/reorder', {
          method: 'PUT',
          body: JSON.stringify({ orderedIds: arr.map((x) => x.id) })
        });
        await loadOverview();
      });
    });

    box.querySelectorAll('.cat-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Xóa danh mục này? (Các sản phẩm bên trong vẫn được giữ nguyên)')) return;
        try {
          await apiFetch(`/api/affiliate/admin/categories/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Đã xóa danh mục!');
          await loadOverview();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  }

  document.getElementById('btn-add-aff-cat')?.addEventListener('click', async () => {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return showToast('Vui lòng nhập tên danh mục!', true);
    try {
      await apiFetch('/api/affiliate/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      document.getElementById('new-cat-name').value = '';
      showToast('Đã thêm danh mục mới! 🗂️');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // Profile & Theme Form
  function populateProfileForm() {
    const p = storeData?.profile || {};
    document.getElementById('pf-aff-avatar').value = p.avatar || '/media/bio-link/girlfriend-1.jpg';
    document.getElementById('pf-aff-avatar-prev').src = p.avatar || '/media/bio-link/girlfriend-1.jpg';
    document.getElementById('pf-aff-handle').value = p.handle || 'na2hand';
    document.getElementById('pf-aff-title').value = p.title || 'NA 2HAND Closet';
    document.getElementById('pf-aff-sub').value = p.subtitle || '';
    document.getElementById('pf-aff-layout').value = p.layoutMode || 'zigzag';
    document.getElementById('pf-aff-tone').value = p.themeTone || 'oatmeal';
    document.getElementById('pf-aff-show-price').checked = Boolean(p.showPrice);
    document.getElementById('pf-aff-show-plat').checked = Boolean(p.showPlatformBadge);
  }

  document.getElementById('pf-aff-avatar')?.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (v) document.getElementById('pf-aff-avatar-prev').src = v;
  });

  document.getElementById('pf-aff-avatar-file')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    showToast('Đang tải ảnh đại diện lên... ⏳');
    try {
      const url = await uploadFile(f);
      document.getElementById('pf-aff-avatar').value = url;
      document.getElementById('pf-aff-avatar-prev').src = url;
      showToast('Đã tải ảnh đại diện mới! Nhớ bấm Lưu nhé ✨');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('btn-save-aff-profile')?.addEventListener('click', async () => {
    const payload = {
      avatar: document.getElementById('pf-aff-avatar').value.trim(),
      handle: document.getElementById('pf-aff-handle').value.trim() || 'na2hand',
      title: document.getElementById('pf-aff-title').value.trim() || 'NA 2HAND Closet',
      subtitle: document.getElementById('pf-aff-sub').value.trim(),
      layoutMode: document.getElementById('pf-aff-layout').value,
      themeTone: document.getElementById('pf-aff-tone').value,
      showPrice: document.getElementById('pf-aff-show-price').checked,
      showPlatformBadge: document.getElementById('pf-aff-show-plat').checked
    };
    try {
      await apiFetch('/api/affiliate/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Đã lưu giao diện & hồ sơ trang Affiliate! 🎨');
      await loadOverview();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  loadOverview();
})();
