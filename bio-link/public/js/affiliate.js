// Trang Hiển Thị Danh Sách Sản Phẩm Affiliate (/affiliate) — Chuẩn Passio Creator Showcase
(function () {
  let profile = {};
  let categories = [];
  let allItems = [];
  let activeCatId = 'all';
  let searchQuery = '';
  const expandedSectionLimits = {};

  const searchInput = document.getElementById('aff-search-input');
  const searchClear = document.getElementById('aff-search-clear');
  const catsListEl = document.getElementById('aff-cats-list');
  const expandCatsBtn = document.getElementById('btn-expand-cats');
  const rootEl = document.getElementById('aff-sections-root');
  const toastEl = document.getElementById('aff-toast');

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatVnd(n) {
    return `${Number(n || 0).toLocaleString('vi-VN')}đ`;
  }

  function normalizeVi(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();
  }

  function platformLabel(plat) {
    if (plat === 'shopee') return 'Shopee';
    if (plat === 'tiktok') return 'TikTok Shop';
    if (plat === 'lazada') return 'Lazada';
    return 'Xem ngay';
  }

  function trackAffiliateClick(id) {
    const url = `/api/affiliate/click/${encodeURIComponent(id)}`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  }

  function renderCategoryPills() {
    if (!catsListEl) return;
    const countMap = {};
    allItems.forEach((it) => {
      countMap[it.categoryId] = (countMap[it.categoryId] || 0) + 1;
    });

    const nonEmptyCats = categories.filter((c) => (countMap[c.id] || 0) > 0);
    const pills = [
      ...(nonEmptyCats.length > 1
        ? [{ id: 'all', label: `Tất cả (${allItems.length})` }]
        : []),
      ...nonEmptyCats.map((c) => ({
        id: c.id,
        label: `${c.name} (${countMap[c.id] || 0})`
      }))
    ];

    catsListEl.innerHTML = pills
      .map(
        (p) => `
        <button type="button" class="aff-cat-pill ${activeCatId === p.id ? 'active' : ''}" data-cid="${escapeHtml(p.id)}">
          ${escapeHtml(p.label)}
        </button>
      `
      )
      .join('');

    catsListEl.querySelectorAll('.aff-cat-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCatId = btn.getAttribute('data-cid') || 'all';
        renderCategoryPills();
        renderSections();
      });
    });
  }

  function renderItemCard(item, idxInSec, layoutMode) {
    const displayTitle = item.code ? `${item.code}. ${item.name}` : item.name;
    const priceHtml =
      profile.showPrice && Number(item.price) > 0
        ? `<div class="aff-item-price">${formatVnd(item.price)}</div>`
        : '';
    const platHtml = profile.showPlatformBadge
      ? `<span class="aff-item-plat">${escapeHtml(platformLabel(item.platform))}</span>`
      : '';
    const badgeHtml = item.badge
      ? `<span class="aff-item-badge">${escapeHtml(item.badge)}</span>`
      : '';

    if (layoutMode === 'grid') {
      return `
        <a
          href="${escapeHtml(item.affiliateUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="aff-grid-item aff-track-link"
          data-id="${escapeHtml(item.id)}"
        >
          <div class="aff-item-media">
            <img src="${escapeHtml(item.image || '/media/bio-link/girlfriend-1.jpg')}" alt="${escapeHtml(displayTitle)}" loading="lazy" />
            ${badgeHtml}
          </div>
          <div class="aff-item-info">
            <div class="aff-item-title">${escapeHtml(displayTitle)}</div>
            ${priceHtml}
            ${platHtml}
          </div>
        </a>
      `;
    }

    // Default Passio Signature Alternating Zig-Zag Layout
    const oddClass = idxInSec % 2 === 1 ? 'is-odd' : '';
    return `
      <a
        href="${escapeHtml(item.affiliateUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        class="aff-zigzag-item ${oddClass} aff-track-link"
        data-id="${escapeHtml(item.id)}"
      >
        <div class="aff-item-media">
          <img src="${escapeHtml(item.image || '/media/bio-link/girlfriend-1.jpg')}" alt="${escapeHtml(displayTitle)}" loading="lazy" />
          ${badgeHtml}
        </div>
        <div class="aff-item-info">
          <div class="aff-item-title">${escapeHtml(displayTitle)}</div>
          ${priceHtml}
          ${platHtml}
        </div>
      </a>
    `;
  }

  function renderSections() {
    if (!rootEl) return;

    const qNorm = normalizeVi(searchQuery.replace(/^#/, ''));
    let filtered = allItems;

    if (qNorm) {
      filtered = allItems.filter((it) => {
        const codeNorm = normalizeVi(it.code || '');
        const nameNorm = normalizeVi(it.name || '');
        return (
          codeNorm === qNorm ||
          codeNorm.includes(qNorm) ||
          nameNorm.includes(qNorm) ||
          `${codeNorm}. ${nameNorm}`.includes(qNorm)
        );
      });
    }

    if (activeCatId !== 'all') {
      filtered = filtered.filter((it) => it.categoryId === activeCatId);
    }

    if (filtered.length === 0) {
      rootEl.innerHTML = `<div class="aff-empty">Không tìm thấy sản phẩm nào khớp từ khóa <strong>"${escapeHtml(searchQuery)}"</strong>.</div>`;
      return;
    }

    const layoutMode = profile.layoutMode === 'grid' ? 'grid' : 'zigzag';
    const basePageSize = Number(profile.itemsPerCategory || 12);

    // Group by categories in order
    const catsToShow =
      activeCatId === 'all'
        ? categories
        : categories.filter((c) => c.id === activeCatId);

    const sectionsHtml = [];
    const matchedCatIds = new Set(catsToShow.map((c) => c.id));
    const uncategorized = filtered.filter((it) => !matchedCatIds.has(it.categoryId));

    const groups = [
      ...catsToShow.map((c) => ({
        id: c.id,
        name: c.name,
        items: filtered.filter((it) => it.categoryId === c.id)
      })),
      ...(uncategorized.length > 0
        ? [{ id: '_other', name: 'Sản phẩm khác', items: uncategorized }]
        : [])
    ].filter((g) => g.items.length > 0);

    for (const grp of groups) {
      const limit = qNorm ? grp.items.length : expandedSectionLimits[grp.id] || basePageSize;
      const visibleItems = grp.items.slice(0, limit);
      const remaining = grp.items.length - visibleItems.length;

      const listClass = layoutMode === 'grid' ? 'aff-grid-list' : 'aff-zigzag-list';
      const cardsHtml = visibleItems
        .map((item, idx) => renderItemCard(item, idx, layoutMode))
        .join('');

      sectionsHtml.push(`
        <div class="aff-cat-section" id="sec-${escapeHtml(grp.id)}">
          <h2 class="aff-cat-heading">${escapeHtml(grp.name)}</h2>
          <div class="${listClass}">
            ${cardsHtml}
          </div>
          ${
            remaining > 0
              ? `<button type="button" class="aff-see-more-btn" data-sec="${escapeHtml(grp.id)}">Xem thêm (${remaining} sản phẩm)</button>`
              : ''
          }
        </div>
      `);
    }

    rootEl.innerHTML = sectionsHtml.join('');

    rootEl.querySelectorAll('.aff-track-link').forEach((a) => {
      a.addEventListener('click', () => {
        const id = a.getAttribute('data-id');
        if (id) trackAffiliateClick(id);
      });
    });

    rootEl.querySelectorAll('.aff-see-more-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const secId = btn.getAttribute('data-sec');
        expandedSectionLimits[secId] = (expandedSectionLimits[secId] || basePageSize) + basePageSize;
        renderSections();
      });
    });
  }

  expandCatsBtn?.addEventListener('click', () => {
    catsListEl?.classList.toggle('expanded');
    expandCatsBtn.classList.toggle('open');
  });

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value || '';
    if (searchClear) searchClear.style.display = searchQuery ? 'block' : 'none';
    renderSections();
  });

  searchClear?.addEventListener('click', () => {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    searchClear.style.display = 'none';
    renderSections();
  });

  document.getElementById('btn-share-aff')?.addEventListener('click', async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: shareUrl
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Đã sao chép đường dẫn trang Affiliate!');
    } catch {
      prompt('Sao chép đường dẫn dưới đây:', shareUrl);
    }
  });

  async function initAffiliateShowcase() {
    try {
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get('q') || '';
      if (qParam && searchInput) {
        searchQuery = qParam;
        searchInput.value = qParam;
        if (searchClear) searchClear.style.display = 'block';
      }

      const res = await fetch('/api/affiliate/public?track=1');
      const data = await res.json();
      if (!data.success) throw new Error('Load error');

      profile = data.profile || {};
      categories = data.categories || [];
      allItems = data.items || [];

      document.body.setAttribute('data-tone', profile.themeTone || 'oatmeal');
      if (profile.handle) document.getElementById('aff-handle').textContent = profile.handle;
      if (profile.title) {
        document.getElementById('aff-title').textContent = profile.title;
        document.title = `${profile.title} — Link Đồ Xinh & Affiliate`;
      }
      if (profile.subtitle) document.getElementById('aff-subtitle').textContent = profile.subtitle;
      if (profile.avatar) document.getElementById('aff-avatar').src = profile.avatar;

      renderCategoryPills();
      renderSections();
    } catch {
      if (rootEl) rootEl.innerHTML = `<div class="aff-empty">Không thể tải danh sách sản phẩm, vui lòng thử tải lại trang!</div>`;
    }
  }

  initAffiliateShowcase();
})();
