// NA 2HAND Boutique — Art-Directed 2026 Storefront Engine
// Interactive Lookbook Studio, Gliding Tabs, Quick-Size Fly-to-Bag, Smart Size Advisor,
// Lucky Ribbon Unbox, Scented Gift Checkout, Direct QR + Receipt Upload & Order Journey

(function () {
  let settings = {};
  let sizeCharts = [];
  let categories = [];
  let products = [];
  let coupons = [];
  let reviews = [];

  let activeCategory = 'all';
  let activeSizeChartId = '';
  let tempCustomChart = null;
  let wishlistOnly = false;
  let searchQuery = '';
  let priceBracket = 'all';
  let saleOnly = false;
  let sortBy = 'featured';
  let selectedPayment = 'qr';
  let selectedScent = 'Hương Đào Trắng';
  let appliedCoupon = null; // { code, discount }
  let activeLookIdx = 0;

  let cart = JSON.parse(localStorage.getItem('na2hand_cart') || '[]');
  let wishlist = JSON.parse(localStorage.getItem('na2hand_wishlist') || '[]');
  let recentlyViewed = JSON.parse(localStorage.getItem('na2hand_recent') || '[]');
  let savedOrders = JSON.parse(localStorage.getItem('na2hand_my_orders') || '[]');

  const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  function formatItalicMarkup(str) {
    return escapeHtml(str).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function showToast(msg) {
    const t = document.getElementById('shop-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  // --- 1. CELESTIAL VECTOR SPARKLES, CURSOR PEARL TRAIL & SCROLL REVEAL ---
  function initAtmosphereAndMotion() {
    const container = document.getElementById('ambient-sparkles');
    if (container) {
      for (let i = 0; i < 22; i++) {
        const wrap = document.createElement('span');
        wrap.className = 'celestial-star';
        const sz = 9 + Math.round(Math.random() * 11);
        wrap.style.left = `${2 + Math.random() * 96}%`;
        wrap.style.top = `${2 + Math.random() * 95}%`;
        wrap.style.animationDuration = `${2.4 + Math.random() * 3.2}s`;
        wrap.style.animationDelay = `${Math.random() * 3.5}s`;
        wrap.innerHTML = `<svg width="${sz}" height="${sz}"><use href="#ico-star4"></use></svg>`;
        container.appendChild(wrap);
      }
    }

    // Desktop Pearl Cursor Aura & Subtle Sparkle Trail
    const aura = document.getElementById('cursor-aura');
    let lastTrailTime = 0;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (aura) {
        aura.style.opacity = '1';
        aura.style.left = `${e.clientX}px`;
        aura.style.top = `${e.clientY}px`;
      }
      const now = Date.now();
      if (now - lastTrailTime > 95) {
        lastTrailTime = now;
        const dot = document.createElement('span');
        dot.className = 'cursor-trail-dot';
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
        dot.innerHTML = `<svg width="9" height="9"><use href="#ico-star4"></use></svg>`;
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 720);
      }
    });

    // Vector Star & Heart Burst on Interactive Clicks
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, .cta-ribbon, .nav-pill, .cat-pill');
      if (!target) return;
      spawnVectorBurst(e.clientX, e.clientY);
    });

    // Sticky Header Shadow on Scroll
    const hdr = document.getElementById('shop-header');
    window.addEventListener('scroll', () => {
      if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 18);
    }, { passive: true });

    // Subtle Hero Polaroid Parallax on Desktop
    const heroSec = document.getElementById('hero-section');
    const pol1 = document.getElementById('hero-polaroid-1');
    const pol2 = document.getElementById('hero-polaroid-2');
    if (heroSec && pol1 && pol2) {
      heroSec.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = heroSec.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        pol1.style.transform = `rotate(${-3.5 + nx * 3}deg) translate(${-26 + nx * 10}px, ${ny * 8}px)`;
        pol2.style.transform = `rotate(${5.5 - nx * 3}deg) translate(${nx * -8}px, ${ny * -10}px)`;
      });
    }

    // IntersectionObserver Scroll Reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            ent.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal-up').forEach((el) => observer.observe(el));
  }

  function spawnVectorBurst(x, y) {
    if (!x && !y) return;
    const symbols = ['#ico-star4', '#ico-heart', '#ico-star4', '#ico-bow', '#ico-star4', '#ico-heart'];
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('span');
      el.className = 'tap-burst-svg';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      const angle = (Math.PI * 2 * i) / 6;
      const dist = 26 + Math.random() * 34;
      el.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
      el.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist - 14)}px`);
      el.innerHTML = `<svg width="13" height="13"><use href="${symbols[i]}"></use></svg>`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 840);
    }
  }

  // Parabolic Fly-to-Bag Thumbnail Animation
  function animateFlyToBag(imgSrc, sourceEl) {
    const bagBtn = document.getElementById('btn-open-cart');
    if (!bagBtn || !sourceEl) return;
    const sRect = sourceEl.getBoundingClientRect();
    const bRect = bagBtn.getBoundingClientRect();

    const clone = document.createElement('img');
    clone.src = imgSrc || '/media/bio-link/girlfriend-1.jpg';
    clone.className = 'fly-to-bag-clone';
    clone.style.left = `${sRect.left + sRect.width / 2 - 28}px`;
    clone.style.top = `${sRect.top + sRect.height / 2 - 34}px`;
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      const dx = bRect.left + bRect.width / 2 - (sRect.left + sRect.width / 2);
      const dy = bRect.top + bRect.height / 2 - (sRect.top + sRect.height / 2);
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.22) rotate(14deg)`;
      clone.style.opacity = '0.2';
    });

    setTimeout(() => {
      clone.remove();
      bagBtn.classList.remove('bag-bounce');
      void bagBtn.offsetWidth;
      bagBtn.classList.add('bag-bounce');
    }, 700);
  }

  // --- 2. FLASH DEAL COUNTDOWN ---
  function startFlashTimer() {
    let remaining = 4 * 3600 + 45 * 60 + 52;
    setInterval(() => {
      remaining = remaining > 0 ? remaining - 1 : 4 * 3600;
      const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
      const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      const eh = document.getElementById('timer-h');
      const em = document.getElementById('timer-m');
      const es = document.getElementById('timer-s');
      if (eh) eh.textContent = h;
      if (em) em.textContent = m;
      if (es) es.textContent = s;
    }, 1000);
  }

  // --- 3. LOAD STOREFRONT DATA ---
  async function loadStorefront() {
    try {
      const res = await fetch('/api/shop/storefront');
      const data = await res.json();
      if (!data.success) return;

      settings = data.settings || {};
      sizeCharts = Array.isArray(data.sizeCharts) ? data.sizeCharts : [];
      categories = data.categories || [];
      products = data.products || [];
      coupons = data.coupons || [];
      reviews = data.reviews || [];

      applyStoreSettings();
      renderVouchers();
      renderLookbookStudio();
      renderCategories();
      renderProducts();
      renderRecentlyViewed();
      updateBadgesAndCart();
      startLiveProofToast();
    } catch (err) {
      console.error('Failed to load storefront:', err);
    }
  }

  function applyStoreSettings() {
    if (settings.shopName) {
      document.title = `${settings.shopName} — Tủ Đồ Tiểu Thư & 2Hand Tuyển Chọn`;
      document.getElementById('header-shop-name').textContent = settings.shopName;
    }
    if (settings.tagline) {
      document.getElementById('header-tagline').textContent = settings.tagline.replace(/[✨🌸🎀]/g, '').trim();
    }
    if (settings.announcement) {
      const cleanAnn = settings.announcement.replace(/[✨🌸🎀]/g, '✦');
      document.getElementById('marquee-track').innerHTML =
        `${escapeHtml(cleanAnn)} &nbsp;&nbsp;✦&nbsp;&nbsp; ${escapeHtml(cleanAnn)} &nbsp;&nbsp;✦&nbsp;&nbsp;`;
    }
    if (settings.heroKicker) {
      const hk = document.getElementById('hero-kicker-text');
      if (hk) hk.textContent = settings.heroKicker;
    }
    if (settings.heroTitle) {
      const ht = document.getElementById('hero-title');
      if (ht) ht.innerHTML = formatItalicMarkup(settings.heroTitle);
    }
    if (settings.heroSubtitle) {
      const hs = document.getElementById('hero-subtitle');
      if (hs) hs.textContent = settings.heroSubtitle;
    }
    if (settings.heroBannerImage) {
      const hp1 = document.getElementById('hero-photo');
      if (hp1) hp1.src = settings.heroBannerImage;
    }
    if (settings.heroPolaroid1Caption) {
      const hc1 = document.getElementById('hero-cap-1');
      if (hc1) hc1.innerHTML = formatItalicMarkup(settings.heroPolaroid1Caption);
    }
    if (settings.heroBannerImage2) {
      const hp2 = document.getElementById('hero-photo-2');
      if (hp2) hp2.src = settings.heroBannerImage2;
    }
    if (settings.heroPolaroid2Caption) {
      const hc2 = document.getElementById('hero-cap-2');
      if (hc2) hc2.innerHTML = formatItalicMarkup(settings.heroPolaroid2Caption);
    }
    if (settings.heroStampText) {
      const hst = document.getElementById('hero-stamp-text');
      if (hst) hst.textContent = settings.heroStampText;
    }
    const dealStrip = document.getElementById('hero-deal-strip');
    if (dealStrip) {
      dealStrip.style.display = settings.heroDealEnabled === false ? 'none' : '';
    }
    if (settings.heroDealLabel) {
      const hdl = document.getElementById('hero-deal-label-text');
      if (hdl) hdl.textContent = settings.heroDealLabel;
    }

    const lookSec = document.getElementById('lookbook-section');
    if (lookSec) {
      lookSec.style.display = settings.lookbookEnabled === false ? 'none' : '';
    }
    if (settings.lookbookHeading) {
      const lbh = document.getElementById('lookbook-heading');
      if (lbh) lbh.innerHTML = formatItalicMarkup(settings.lookbookHeading);
    }
    if (settings.lookbookSubheading) {
      const lbs = document.getElementById('lookbook-subheading');
      if (lbs) lbs.textContent = settings.lookbookSubheading;
    }
    if (settings.messengerUrl) {
      const mLink = document.getElementById('floating-mess-link');
      if (mLink) mLink.href = settings.messengerUrl;
    }

    document.getElementById('pay-card-qr').style.display = settings.qrEnabled === false ? 'none' : 'flex';
    document.getElementById('pay-card-cod').style.display = settings.codEnabled === false ? 'none' : 'flex';

    const qrImg = document.getElementById('checkout-qr-preview-img');
    if (qrImg) qrImg.src = settings.qrImageUrl || '/media/bio-link/cute-qr-placeholder.svg';
    const bankTxt = document.getElementById('checkout-qr-bank-text');
    if (bankTxt && settings.bankName) {
      bankTxt.textContent = `${settings.bankName} • STK: ${settings.bankAccountNo || ''} (${settings.bankAccountName || ''})`;
    }
  }

  // --- 4. VOUCHER TICKETS ---
  function renderVouchers() {
    const el = document.getElementById('voucher-strip');
    if (!el) return;
    el.innerHTML = coupons
      .slice(0, 4)
      .map(
        (c) => `
        <div class="voucher-ticket">
          <div>
            <div class="voucher-code">${escapeHtml(c.code)}</div>
            <div class="voucher-desc">${escapeHtml(c.description || '')}</div>
          </div>
          <button type="button" class="btn-save-voucher" data-code="${escapeAttr(c.code)}">Lưu mã</button>
        </div>
      `
      )
      .join('');

    el.querySelectorAll('.btn-save-voucher').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        document.getElementById('cart-coupon-input').value = code;
        navigator.clipboard?.writeText(code).catch(() => {});
        btn.textContent = 'Đã lưu ✓';
        btn.classList.add('saved');
        showToast(`Đã lưu mã ${code} vào Túi Đồ của nàng!`);
        setTimeout(() => {
          btn.textContent = 'Lưu mã';
          btn.classList.remove('saved');
        }, 2500);
      });
    });
  }

  // --- 5. INTERACTIVE "SHOP THE LOOK" MIX & MATCH STUDIO ---
  function getResolvedLookbookSets() {
    const p0 = products[0];
    const p1 = products[Math.min(5, products.length - 1)];
    const p2 = products[Math.min(1, products.length - 1)];
    const p3 = products[Math.min(4, products.length - 1)];

    const customSets = Array.isArray(settings.lookbookSets) ? settings.lookbookSets : [];
    if (customSets.length > 0) {
      return customSets
        .map((s, idx) => {
          const rawPins = Array.isArray(s.pins) ? s.pins : [];
          const resolvedPins = rawPins
            .map((pin, pIdx) => {
              const foundProd =
                products.find((pr) => pr.id === pin.productId) ||
                products[(idx * 2 + pIdx) % Math.max(1, products.length)];
              if (!foundProd) return null;
              return {
                x: Math.min(92, Math.max(8, Number(pin.x ?? 50))),
                y: Math.min(92, Math.max(8, Number(pin.y ?? 50))),
                prod: foundProd
              };
            })
            .filter(Boolean);
          return {
            tabLabel: s.tabLabel || `Set Phối #${idx + 1}`,
            photo: s.photo || '/media/bio-link/girlfriend-1.jpg',
            title: s.title || `Look 0${idx + 1}`,
            description:
              s.description ||
              'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.',
            pins: resolvedPins
          };
        })
        .filter((s) => s.pins.length > 0 || products.length > 0);
    }

    return [
      {
        tabLabel: 'Set Hẹn Hò Cuối Tuần',
        photo: '/media/bio-link/girlfriend-1.jpg',
        title: 'Look 01 — Hẹn Hò Cuối Tuần Dịu Dàng',
        description: 'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.',
        pins: [
          { x: 48, y: 42, prod: p0 },
          { x: 66, y: 68, prod: p1 }
        ].filter((x) => x.prod)
      },
      {
        tabLabel: 'Set Tiểu Thư Dạo Phố',
        photo: '/media/bio-link/girlfriend-2.jpg',
        title: 'Look 02 — Dạo Phố Năng Động Ngọt Ngào',
        description: 'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.',
        pins: [
          { x: 46, y: 45, prod: p2 },
          { x: 58, y: 74, prod: p3 }
        ].filter((x) => x.prod)
      }
    ];
  }

  function renderLookbookStudio() {
    const lookSec = document.getElementById('lookbook-section');
    const stage = document.getElementById('lookbook-stage');
    const tabsWrap = document.getElementById('look-switcher-tabs');
    if (settings.lookbookEnabled === false) {
      if (lookSec) lookSec.style.display = 'none';
      return;
    }
    if (!stage || products.length === 0) return;

    const looks = getResolvedLookbookSets();
    if (looks.length === 0) return;
    if (activeLookIdx >= looks.length) activeLookIdx = 0;

    if (tabsWrap) {
      tabsWrap.style.display = looks.length > 1 ? 'inline-flex' : 'none';
      tabsWrap.innerHTML = looks
        .map(
          (lk, i) =>
            `<button type="button" class="look-tab ${i === activeLookIdx ? 'active' : ''}" data-look="${i}">${escapeHtml(lk.tabLabel)}</button>`
        )
        .join('');
      tabsWrap.querySelectorAll('.look-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          activeLookIdx = Number(tab.dataset.look || 0);
          renderLookbookStudio();
        });
      });
    }

    const cur = looks[activeLookIdx] || looks[0];
    const uniquePins = cur.pins.filter((item, idx, arr) => item.prod && arr.findIndex((x) => x.prod?.id === item.prod?.id) === idx);
    const totalSetPrice = uniquePins.reduce((s, x) => s + Number(x.prod.price || 0), 0);

    stage.innerHTML = `
      <div class="look-photo-stage">
        <img src="${escapeAttr(cur.photo)}" alt="${escapeAttr(cur.title)}" />
        ${uniquePins
          .map(
            (pin, idx) => `
          <button type="button" class="hotspot-pin ${idx === 0 ? 'active' : ''}" data-pin-idx="${idx}" style="left:${pin.x}%; top:${pin.y}%;" aria-label="Xem món đồ ${idx + 1}">
            ${idx + 1}
          </button>
        `
          )
          .join('')}
      </div>

      <div class="look-items-panel">
        <div style="font-family:var(--font-serif); font-size:1.35rem; font-weight:700; color:var(--ink);">
          ${escapeHtml(cur.title)}
        </div>
        <p style="font-size:0.8rem; color:var(--ink-muted); margin-top:-6px;">
          ${escapeHtml(cur.description || 'Phối sẵn tông màu hài hòa — nàng có thể chọn lẻ từng món hoặc rinh trọn bộ vào túi đồ.')}
        </p>

        ${uniquePins
          .map(
            (pin, idx) => `
          <div class="look-piece-card ${idx === 0 ? 'highlighted' : ''}" data-piece-idx="${idx}" data-id="${escapeAttr(pin.prod.id)}">
            <img src="${escapeAttr((pin.prod.images && pin.prod.images[0]) || '/media/bio-link/girlfriend-1.jpg')}" alt="${escapeAttr(pin.prod.name)}" />
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.69rem; font-weight:700; color:var(--cherry);">Món số 0${idx + 1}</div>
              <div class="look-piece-title">${escapeHtml(pin.prod.name)}</div>
              <div style="font-weight:800; font-size:0.88rem; color:var(--cherry); margin-top:2px;">${vnd(pin.prod.price)}</div>
            </div>
            <button type="button" class="prod-detail-btn btn-look-view" data-id="${escapeAttr(pin.prod.id)}">Xem</button>
          </div>
        `
          )
          .join('')}

        <div class="look-set-footer">
          <div>
            <span style="font-size:0.75rem; color:var(--ink-muted);">Trọn bộ ${uniquePins.length} món:</span>
            <strong style="font-size:1.1rem; color:var(--cherry); margin-left:6px;">${vnd(totalSetPrice)}</strong>
          </div>
          <button type="button" class="cta-ribbon shimmer-sheen" id="btn-buy-whole-look">
            <span>Thêm trọn Set vào Túi Đồ</span>
          </button>
        </div>
      </div>
    `;

    stage.querySelectorAll('.hotspot-pin').forEach((pinBtn) => {
      pinBtn.addEventListener('click', () => {
        const i = Number(pinBtn.dataset.pinIdx);
        stage.querySelectorAll('.hotspot-pin').forEach((b) => b.classList.remove('active'));
        stage.querySelectorAll('.look-piece-card').forEach((c) => c.classList.remove('highlighted'));
        pinBtn.classList.add('active');
        const card = stage.querySelector(`.look-piece-card[data-piece-idx="${i}"]`);
        if (card) card.classList.add('highlighted');
      });
    });

    stage.querySelectorAll('.look-piece-card').forEach((card) => {
      card.addEventListener('click', () => openProductModal(card.dataset.id));
    });

    stage.querySelector('#btn-buy-whole-look')?.addEventListener('click', (e) => {
      uniquePins.forEach((pin) => {
        addToCart(
          pin.prod,
          (pin.prod.sizes && pin.prod.sizes[0]) || 'Freesize',
          (pin.prod.colors && pin.prod.colors[0]) || 'Theo hình',
          1
        );
      });
      animateFlyToBag(cur.photo, e.currentTarget);
      showToast(`Đã thêm trọn bộ ${uniquePins.length} món vào Túi Đồ!`);
      setTimeout(openCartDrawer, 550);
    });
  }

  // --- 6. SLIDING CATEGORY GLIDER & PRODUCT CATALOG ---
  function updateCategoryGlider() {
    const wrap = document.getElementById('category-pills');
    const chip = document.getElementById('cat-glider-chip');
    const activeBtn = wrap?.querySelector('.cat-pill.active');
    if (!wrap || !chip || !activeBtn) return;
    chip.style.width = `${activeBtn.offsetWidth}px`;
    chip.style.transform = `translateX(${activeBtn.offsetLeft - 5}px)`;
  }

  function renderCategories() {
    const wrap = document.getElementById('category-pills');
    if (!wrap) return;
    const allCats = [{ id: 'all', name: 'Tất cả thiết kế' }, ...categories];
    const buttonsHtml = allCats
      .map((c) => {
        const cleanName = String(c.name || '').replace(/[👗👚🎀🌸👜✨]/g, '').trim();
        const isActive = activeCategory === c.id && !wishlistOnly;
        return `<button type="button" role="tab" class="cat-pill ${isActive ? 'active' : ''}" data-cat="${escapeAttr(c.id)}">${escapeHtml(cleanName)}</button>`;
      })
      .join('');

    wrap.innerHTML = `<span class="glider-chip" id="cat-glider-chip" aria-hidden="true"></span>${buttonsHtml}`;

    wrap.querySelectorAll('.cat-pill').forEach((b) => {
      b.addEventListener('click', () => {
        wishlistOnly = false;
        document.getElementById('btn-filter-wishlist')?.classList.remove('active-filter');
        activeCategory = b.getAttribute('data-cat');
        wrap.querySelectorAll('.cat-pill').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        updateCategoryGlider();
        renderProducts();
      });
    });

    requestAnimationFrame(updateCategoryGlider);
    window.addEventListener('resize', updateCategoryGlider, { passive: true });
  }

  function getCategoryLabel(catId) {
    const found = categories.find((c) => c.id === catId);
    return found ? String(found.name).replace(/[👗👚🎀🌸👜✨]/g, '').trim() : 'Tuyển chọn';
  }

  function renderProducts() {
    const grid = document.getElementById('products-grid');
    const countLabel = document.getElementById('catalog-count-label');
    if (!grid) return;

    let list = [...products];

    if (wishlistOnly) {
      list = list.filter((p) => wishlist.includes(p.id));
    } else if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.description || '').toLowerCase().includes(q)
      );
    }

    if (priceBracket === 'under180') {
      list = list.filter((p) => Number(p.price) < 180000);
    } else if (priceBracket === '180to280') {
      list = list.filter((p) => Number(p.price) >= 180000 && Number(p.price) <= 280000);
    } else if (priceBracket === 'over280') {
      list = list.filter((p) => Number(p.price) > 280000);
    }

    if (saleOnly) {
      list = list.filter((p) => Number(p.originalPrice || 0) > Number(p.price || 0) || p.isFlashSale);
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'bestseller') {
      list.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else {
      list.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
    }

    if (countLabel) {
      countLabel.textContent = wishlistOnly
        ? `Tủ đồ yêu thích của nàng (${list.length} thiết kế)`
        : `Hiển thị ${list.length} thiết kế tuyển chọn`;
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 52px 20px; background: #fff; border-radius: 24px; border: 1px dashed var(--line-strong);">
          <div style="font-family:var(--font-serif); font-size:1.5rem; font-weight:700; margin-bottom:6px;">Chưa tìm thấy mẫu phù hợp nàng ơi</div>
          <p style="font-size: 0.83rem; color: var(--ink-muted); margin-bottom: 14px;">Thử đặt lại bộ lọc mức giá hoặc xem toàn bộ kệ đồ của tiệm nhé.</p>
          <button type="button" class="cta-outline" id="btn-reset-all-filters">Xem lại tất cả thiết kế</button>
        </div>
      `;
      document.getElementById('btn-reset-all-filters')?.addEventListener('click', () => {
        activeCategory = 'all';
        wishlistOnly = false;
        searchQuery = '';
        priceBracket = 'all';
        saleOnly = false;
        document.getElementById('search-input').value = '';
        document.getElementById('price-filter-select').value = 'all';
        document.getElementById('chk-only-sale').checked = false;
        renderCategories();
        renderProducts();
      });
      return;
    }

    const isShopeeAvatarUrl = (u) =>
      /(?:^|\/|-)(?:[a-z]{2}-)?(?:11134216|11134226|11134233)-|avatar|icon|logo|badge|emoji|sprite/i.test(String(u || ''));

    grid.innerHTML = list
      .map((p) => {
        const rawImgs = Array.isArray(p.images) ? p.images.filter((u) => u && !isShopeeAvatarUrl(u)) : [];
        const imgs = rawImgs.length > 0 ? rawImgs : ['/media/bio-link/girlfriend-1.jpg'];
        const img1 = imgs[0];
        const img2 = imgs[1] || '';
        const sizes = Array.isArray(p.sizes)
          ? p.sizes.filter((s) => Boolean(s) && !/\b(scrape|1688|sourcing|aliprice)\b/i.test(String(s)))
          : [];
        const pVariants = Array.isArray(p.variants) ? p.variants : [];
        const inStockVars = pVariants.filter((v) => Number(v.stock ?? 1) > 0);
        const maxP = Number(p.maxPrice || 0);
        const hasRange = maxP > Number(p.price || 0);
        const refTopPrice = hasRange ? maxP : Number(p.price || 0);
        const disc =
          p.originalPrice && p.originalPrice > refTopPrice
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;
        const isLiked = wishlist.includes(p.id);

        const quickChipsHtml =
          inStockVars.length > 0
            ? inStockVars
                .slice(0, 4)
                .map(
                  (v) =>
                    `<button type="button" class="quick-size-chip" data-var="${escapeAttr(v.label)}">+ ${escapeHtml(v.label)}</button>`
                )
                .join('')
            : sizes.length > 0
            ? sizes
                .slice(0, 4)
                .map(
                  (sz) =>
                    `<button type="button" class="quick-size-chip" data-size="${escapeAttr(sz)}">+ ${escapeHtml(sz)}</button>`
                )
                .join('')
            : `<button type="button" class="quick-size-chip" data-direct="1">+ Thêm nhanh vào Túi Đồ</button>`;

        const varStripHtml =
          pVariants.length > 0
            ? `
            <div class="card-variant-strip" title="Chạm xem nhanh các phân hệ mẫu">
              ${pVariants
                .slice(0, 5)
                .map(
                  (v) =>
                    `<img src="${escapeAttr(v.image || img1)}" alt="${escapeAttr(v.label)}" title="${escapeAttr(v.label)}${Number(v.price) > 0 ? ' • ' + vnd(v.price) : ''}${Number(v.stock ?? 1) <= 0 ? ' (Hết)' : ''}" class="card-var-swatch" data-preview="${escapeAttr(v.image || img1)}" data-vprice="${Number(v.price || 0)}" style="${Number(v.stock ?? 1) <= 0 ? 'opacity:0.4;' : ''}" />`
                )
                .join('')}
              ${pVariants.length > 5 ? `<span class="card-var-more">+${pVariants.length - 5} mẫu</span>` : `<span class="card-var-more">${pVariants.length} mẫu</span>`}
            </div>
          `
            : '';

        const priceDisplayText = hasRange ? `${vnd(p.price)} – ${vnd(maxP)}` : vnd(p.price);

        return `
        <article class="product-card" data-id="${escapeAttr(p.id)}">
          <div class="prod-img-wrap">
            <img src="${escapeAttr(img1)}" alt="${escapeAttr(p.name)}" class="prod-img-primary ${img2 ? 'has-alt' : ''} open-detail" loading="lazy" />
            ${img2 ? `<img src="${escapeAttr(img2)}" alt="" class="prod-img-secondary open-detail" loading="lazy" aria-hidden="true" />` : ''}

            ${
              disc > 0
                ? `<div class="prod-badges-top"><span class="tag-pill-sale">-${disc}%</span></div>`
                : ''
            }

            <button type="button" class="wishlist-heart-btn ${isLiked ? 'liked' : ''}" data-like="${escapeAttr(p.id)}" aria-label="Lưu vào yêu thích">
              <svg width="16" height="16"><use href="#ico-heart"></use></svg>
            </button>

            <div class="quick-add-overlay">
              <div class="quick-size-label">${inStockVars.length > 0 ? 'Chạm chọn nhanh phân hệ:' : sizes.length > 0 ? 'Chạm chọn nhanh size:' : 'Chạm thêm nhanh:'}</div>
              <div class="quick-size-row">
                ${quickChipsHtml}
              </div>
            </div>
          </div>

          <div class="prod-body">
            <div class="prod-cat-kicker">${escapeHtml(getCategoryLabel(p.category))}</div>
            <h3 class="prod-title open-detail">${escapeHtml(p.name)}</h3>
            ${varStripHtml}
            <div class="prod-meta-row">
              <span>★ ${Number(p.rating || 5).toFixed(1)} (${p.reviewCount || 1})</span>
              <span>Đã bán ${Number(p.sold || 0)}</span>
            </div>
            <div class="prod-price-row">
              <div>
                <span class="prod-price" data-default-price="${escapeAttr(priceDisplayText)}">${priceDisplayText}</span>
                ${!hasRange && p.originalPrice > p.price ? `<span class="prod-orig-price">${vnd(p.originalPrice)}</span>` : ''}
              </div>
              <button type="button" class="prod-detail-btn open-detail">${pVariants.length > 0 ? `Chọn mẫu (${pVariants.length})` : 'Xem chi tiết'}</button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    grid.querySelectorAll('.product-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      const prod = products.find((x) => x.id === id);

      card.querySelectorAll('.open-detail').forEach((el) => {
        el.addEventListener('click', () => openProductModal(id));
      });

      card.querySelectorAll('.card-var-swatch').forEach((sw) => {
        const swapPreview = (e) => {
          e.stopPropagation();
          const pImg = card.querySelector('.prod-img-primary');
          const src = sw.getAttribute('data-preview');
          const vp = Number(sw.getAttribute('data-vprice') || 0);
          if (pImg && src) pImg.src = src;
          const pEl = card.querySelector('.prod-price');
          if (pEl && vp > 0) pEl.textContent = vnd(vp);
          card.querySelectorAll('.card-var-swatch').forEach((x) => x.classList.remove('active'));
          sw.classList.add('active');
        };
        sw.addEventListener('mouseenter', swapPreview);
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          openProductModal(id);
        });
      });

      card.querySelector('.wishlist-heart-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(id);
      });

      card.querySelectorAll('.quick-size-chip').forEach((chip) => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!prod) return;
          const varLbl = chip.getAttribute('data-var');
          const prodSizes = Array.isArray(prod.sizes) ? prod.sizes.filter(Boolean) : [];
          if (varLbl && Array.isArray(prod.variants)) {
            const vObj = prod.variants.find((v) => v.label === varLbl);
            const firstAvailSz =
              vObj && vObj.sizeStocks
                ? prodSizes.find((s) => Number(vObj.sizeStocks[s] ?? 0) > 0) || prodSizes[0] || ''
                : prodSizes[0] || '';
            const col = `${prod.variantGroupName || 'Mẫu'}: ${varLbl}`;
            addToCart(prod, firstAvailSz, col, 1, vObj);
            animateFlyToBag(vObj?.image || (prod.images && prod.images[0]) || '', card.querySelector('.prod-img-wrap'));
            showToast(`Đã thêm "${prod.name.slice(0, 22)}..." (${varLbl}${firstAvailSz ? ' - ' + firstAvailSz : ''}) vào Túi Đồ!`);
            return;
          }
          const sz = chip.getAttribute('data-size') || prodSizes[0] || '';
          const col = (prod.colors && prod.colors[0]) || '';
          addToCart(prod, sz, col, 1);
          animateFlyToBag((prod.images && prod.images[0]) || '', card.querySelector('.prod-img-wrap'));
          showToast(`Đã thêm "${prod.name.slice(0, 26)}..."${sz ? ` (${sz})` : ''} vào Túi Đồ!`);
        });
      });
    });
  }

  function toggleWishlist(id) {
    if (wishlist.includes(id)) {
      wishlist = wishlist.filter((x) => x !== id);
      showToast('Đã bỏ khỏi Tủ đồ yêu thích');
    } else {
      wishlist.push(id);
      showToast('Đã lưu vào Tủ đồ yêu thích ♡');
    }
    localStorage.setItem('na2hand_wishlist', JSON.stringify(wishlist));
    updateBadgesAndCart();
    renderProducts();
  }

  // --- 7. RECENTLY VIEWED ---
  function recordRecentlyViewed(id) {
    recentlyViewed = [id, ...recentlyViewed.filter((x) => x !== id)].slice(0, 8);
    localStorage.setItem('na2hand_recent', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  }

  function renderRecentlyViewed() {
    const sec = document.getElementById('recently-viewed-section');
    const row = document.getElementById('recently-viewed-list');
    if (!sec || !row) return;

    const items = recentlyViewed
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    if (items.length === 0) {
      sec.style.display = 'none';
      return;
    }

    sec.style.display = 'block';
    sec.classList.add('is-visible');
    row.innerHTML = items
      .map(
        (p) => `
        <div class="recent-mini-card" data-id="${escapeAttr(p.id)}">
          <img src="${escapeAttr((p.images && p.images[0]) || '/media/bio-link/girlfriend-1.jpg')}" alt="${escapeAttr(p.name)}" />
          <div style="overflow:hidden;">
            <div style="font-size:0.78rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--cherry); margin-top:2px;">${vnd(p.price)}</div>
          </div>
        </div>
      `
      )
      .join('');

    row.querySelectorAll('.recent-mini-card').forEach((el) => {
      el.addEventListener('click', () => openProductModal(el.dataset.id));
    });
  }

  document.getElementById('btn-clear-recent')?.addEventListener('click', () => {
    recentlyViewed = [];
    localStorage.removeItem('na2hand_recent');
    renderRecentlyViewed();
  });

  // --- 8. PRODUCT DETAIL, RELATED OUTFITS & PHOTO REVIEWS MODAL ---
  function compressImageClient(file, maxW = 900) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.84));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function openLightbox(src) {
    const lb = document.getElementById('image-lightbox');
    const im = document.getElementById('lightbox-img');
    if (!lb || !im) return;
    im.src = src;
    lb.classList.add('open');
  }

  document.getElementById('btn-close-lightbox')?.addEventListener('click', () => {
    document.getElementById('image-lightbox')?.classList.remove('open');
  });
  document.getElementById('image-lightbox')?.addEventListener('click', (e) => {
    if (e.target.id === 'image-lightbox') e.currentTarget.classList.remove('open');
  });

  function openProductModal(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;

    recordRecentlyViewed(id);

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');
    const isAvatarUrl = (u) =>
      /(?:^|\/|-)(?:[a-z]{2}-)?(?:11134216|11134226|11134233)-|avatar|icon|logo|badge|emoji|sprite/i.test(String(u || ''));
    const cleanImgs = Array.isArray(p.images) ? p.images.filter((u) => u && !isAvatarUrl(u)) : [];
    const imgs = cleanImgs.length > 0 ? cleanImgs : ['/media/bio-link/girlfriend-1.jpg'];
    const sizes = Array.isArray(p.sizes)
      ? p.sizes.filter((s) => Boolean(s) && !/\b(scrape|1688|sourcing|aliprice)\b/i.test(String(s)))
      : [];
    const colors = Array.isArray(p.colors)
      ? p.colors.filter((c) => c && c !== 'Theo hình' && c !== 'Mặc định')
      : [];
    const pVariants = Array.isArray(p.variants) ? p.variants : [];
    const hasRichVariants = pVariants.length > 0;
    const totalProductStock = hasRichVariants
      ? pVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stock ?? 0)), 0)
      : Math.max(0, Number(p.stock ?? 0));
    const varGroupTitle = p.variantGroupName || 'Mẫu';
    const firstAvailableVar =
      pVariants.find((v) => Number(v.stock ?? 1) > 0) || pVariants[0] || null;

    const varPrices = pVariants.map((v) => Number(v.price || 0)).filter((x) => x > 0);
    const distinctVarPrices = [...new Set(varPrices)];
    const hasVarPriceDiff = distinctVarPrices.length > 1;
    const minVarPrice = varPrices.length > 0 ? Math.min(...varPrices) : Number(p.price || 0);
    const maxVarPrice = varPrices.length > 0 ? Math.max(...varPrices) : Number(p.maxPrice || p.price || 0);

    const prodReviews = reviews.filter((r) => r.productId === p.id);
    const related = products.filter((x) => x.id !== p.id).slice(0, 3);
    const matchedSizeChart = resolveSizeChartForProduct(p);

    const isSizeSoldOutForVar = (vObj, sz) => {
      if (!vObj) return totalProductStock <= 0;
      if (Number(vObj.stock ?? 0) <= 0) return true;
      if (sz && vObj.sizeStocks && typeof vObj.sizeStocks === 'object' && vObj.sizeStocks[sz] !== undefined) {
        return Number(vObj.sizeStocks[sz] || 0) <= 0;
      }
      return false;
    };

    const getFirstInStockSize = (vObj) => {
      if (sizes.length === 0) return '';
      const avail = sizes.find((s) => !isSizeSoldOutForVar(vObj, s));
      return avail !== undefined ? avail : sizes[0];
    };

    const getActiveSelectionStock = (vObj, sz) => {
      if (vObj) {
        if (sz && vObj.sizeStocks && typeof vObj.sizeStocks === 'object' && vObj.sizeStocks[sz] !== undefined) {
          return Math.max(0, Number(vObj.sizeStocks[sz] || 0));
        }
        return Math.max(0, Number(vObj.stock ?? 0));
      }
      return totalProductStock;
    };

    const getActiveSelectionPrice = (vObj, sz) => {
      if (vObj) {
        if (sz && vObj.sizePrices && typeof vObj.sizePrices === 'object' && Number(vObj.sizePrices[sz]) > 0) {
          return Number(vObj.sizePrices[sz]);
        }
        if (Number(vObj.price) > 0) return Number(vObj.price);
      }
      return Number(p.price || 0);
    };

    let chosenVariant = firstAvailableVar;
    let chosenSize = getFirstInStockSize(chosenVariant);
    let chosenColor = chosenVariant ? `${varGroupTitle}: ${chosenVariant.label}` : colors[0] || '';
    let qty = 1;
    let chosenStars = 5;
    let pendingRevPhotoDataUrl = '';

    const initialMainImg = (chosenVariant && chosenVariant.image) || imgs[0];
    const initialPrice = getActiveSelectionPrice(chosenVariant, chosenSize);
    const initialStock = getActiveSelectionStock(chosenVariant, chosenSize);

    // Build guaranteed 1-to-1 Shopee product URL (verified against platformItemId shopid_itemid)
    const pTag = String(p.productTag || p.sourcePlatform || 'manual').toLowerCase();
    const rawSrcUrl = String(p.sourceUrl || '').replace(/&amp;/g, '&').trim();
    const pidMatch = String(p.platformItemId || '').match(/^shopee_(\d+)_(\d+)$/i);
    const urlItemMatch = rawSrcUrl.match(/shopee\.vn\/(?:[^?#]+-i\.(\d+)\.(\d+)|product\/(\d+)\/(\d+))/i);
    const exactShopId = (pidMatch && pidMatch[1]) || (urlItemMatch && (urlItemMatch[1] || urlItemMatch[3])) || '';
    const exactItemId = (pidMatch && pidMatch[2]) || (urlItemMatch && (urlItemMatch[2] || urlItemMatch[4])) || '';

    let shopeeDirectUrl = '';
    if (exactShopId && exactItemId) {
      if (urlItemMatch && (urlItemMatch[2] || urlItemMatch[4]) === exactItemId) {
        shopeeDirectUrl = rawSrcUrl.split('?')[0];
      } else {
        shopeeDirectUrl = `https://shopee.vn/product/${exactShopId}/${exactItemId}`;
      }
    }
    const isExactShopeeItem = Boolean(exactShopId && exactItemId && shopeeDirectUrl);

    content.innerHTML = `
      <button type="button" class="modal-close-btn" id="close-prod-modal" aria-label="Đóng">✕</button>
      <div class="detail-modal-grid">
        <div>
          <div class="detail-main-img-box" id="detail-zoom-trigger">
            <img id="detail-main-img" src="${escapeAttr(initialMainImg)}" alt="${escapeAttr(p.name)}" />
            <span class="detail-zoom-hint">Chạm phóng to ảnh</span>
          </div>

          <div style="display:flex; gap:8px; margin-top:10px; overflow-x:auto; padding-bottom:4px;">
            ${imgs
              .map(
                (u, i) => `
              <img src="${escapeAttr(u)}" class="detail-thumb" data-src="${escapeAttr(u)}" style="width:64px; height:64px; aspect-ratio:1/1; object-fit:contain; background:#ffffff; border-radius:12px; cursor:pointer; flex-shrink:0; border:2px solid ${u === initialMainImg || (i === 0 && !chosenVariant?.image) ? 'var(--cherry)' : 'var(--line)'};" />
            `
              )
              .join('')}
          </div>
        </div>

        <div>
          <div class="modal-kicker">NA 2HAND ATELIER • ${escapeHtml(getCategoryLabel(p.category)).toUpperCase()}</div>
          <h2 style="font-family:var(--font-serif); font-size:1.7rem; font-weight:700; line-height:1.2; margin-bottom:8px;">${escapeHtml(p.name)}</h2>

          <div style="font-size:0.8rem; color:var(--ink-muted); margin-bottom:14px;">
            ★ ${Number(p.rating || 5).toFixed(1)} (${p.reviewCount || 1} đánh giá) &nbsp;·&nbsp; Đã bán ${p.sold || 0} &nbsp;·&nbsp; Tổng kho: <strong id="detail-total-stock-val">${totalProductStock}</strong> chiếc
          </div>

          <div style="background:var(--rose-50); border:1px solid var(--rose-200); padding:13px 16px; border-radius:16px; margin-bottom:16px; display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:baseline; gap:10px;">
              <span class="prod-price" id="detail-price-val" style="font-size:1.5rem;">${vnd(initialPrice)}</span>
              ${p.originalPrice > Math.max(initialPrice, maxVarPrice) ? `<span class="prod-orig-price" style="font-size:0.9rem;">${vnd(p.originalPrice)}</span>` : ''}
            </div>
            ${
              hasVarPriceDiff || maxVarPrice > minVarPrice
                ? `<span style="font-size:0.74rem; font-weight:700; color:var(--ink-soft); background:#fff; padding:3px 9px; border-radius:999px; border:1px solid var(--rose-200);">Khoảng giá: ${vnd(minVarPrice)} – ${vnd(maxVarPrice)}</span>`
                : ''
            }
          </div>

          ${
            hasRichVariants
              ? `
            <div style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; flex-wrap:wrap; gap:4px;">
                <span class="field-lbl" style="margin-bottom:0;">${escapeHtml(varGroupTitle)} (${pVariants.length} phân hệ):</span>
                <span id="selected-var-hint" style="font-size:0.75rem; font-weight:700; color:var(--cherry);">${chosenVariant ? `Đang chọn: ${escapeHtml(chosenVariant.label)}${chosenSize ? ` (${escapeHtml(chosenSize)})` : ''} • ${vnd(initialPrice)} • Kho: ${initialStock}` : ''}</span>
              </div>
              <div class="variant-grid-rich" id="detail-rich-variants">
                ${pVariants
                  .map((v, idx) => {
                    const soldOut = Number(v.stock ?? 0) <= 0;
                    const isSel = chosenVariant && chosenVariant.label === v.label && !soldOut;
                    return `
                      <button
                        type="button"
                        class="variant-chip-rich ${isSel ? 'selected' : ''} ${soldOut ? 'is-soldout' : ''}"
                        data-vidx="${idx}"
                        ${soldOut ? 'disabled title="Mẫu này đã hết hàng"' : ''}
                      >
                        ${v.image ? `<img src="${escapeAttr(v.image)}" alt="${escapeAttr(v.label)}" loading="lazy" />` : ''}
                        <span>${escapeHtml(v.label)}${soldOut ? ' (Hết)' : ''}</span>
                        ${hasVarPriceDiff && Number(v.price) > 0 ? `<span class="var-chip-price">${vnd(v.price)}</span>` : ''}
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            </div>
          `
              : colors.length > 0
              ? `
            <div style="margin-bottom:13px;">
              <div class="field-lbl">Màu sắc:</div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;" id="detail-colors">
                ${colors.map((c, i) => `<button type="button" class="variant-pill ${i === 0 ? 'selected' : ''}" data-val="${escapeAttr(c)}">${escapeHtml(c)}</button>`).join('')}
              </div>
            </div>
          `
              : ''
          }

          ${
            sizes.length > 0
              ? `
          <div style="margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; flex-wrap:wrap; gap:6px;">
              <span class="field-lbl" style="margin-bottom:0;">Kích cỡ (Size):</span>
              <button type="button" class="text-link-btn" id="detail-open-size-calc" style="color:var(--cherry); font-weight:700;">📏 Bảng thông số &amp; gợi ý size</button>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;" id="detail-sizes">
              ${sizes
                .map((s) => {
                  const szOut = isSizeSoldOutForVar(chosenVariant, s);
                  const szSel = !szOut && chosenSize === s;
                  return `<button type="button" class="variant-pill ${szSel ? 'selected' : ''} ${szOut ? 'is-soldout' : ''}" data-val="${escapeAttr(s)}" ${szOut ? 'disabled title="Size này đã hết hàng"' : ''}>${escapeHtml(s)}${szOut ? ' (Hết)' : ''}</button>`;
                })
                .join('')}
            </div>
          </div>
          `
              : ''
          }

          ${
            matchedSizeChart
              ? `
          <div class="detail-size-chart-box">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
              <strong style="font-size:0.79rem; color:var(--ink);">📏 ${escapeHtml(matchedSizeChart.name)}</strong>
              <div style="display:flex; gap:10px; align-items:center;">
                <button type="button" class="text-link-btn" id="btn-toggle-inline-chart" style="font-size:0.75rem; font-weight:700; color:var(--ink-soft);">Xem bảng số đo ▾</button>
                <button type="button" class="text-link-btn" id="detail-open-size-calc-2" style="font-size:0.75rem; font-weight:700; color:var(--cherry);">Đo tự động &rarr;</button>
              </div>
            </div>
            <div id="inline-size-chart-body" style="display:none; margin-top:10px;">
              ${renderSizeChartTableHtml(matchedSizeChart, -1, true)}
            </div>
          </div>
          `
              : ''
          }

          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:16px;">
            <span class="field-lbl" style="margin-bottom:0;">Số lượng:</span>
            <div style="display:inline-flex; align-items:center; border:1px solid var(--line-strong); border-radius:10px; overflow:hidden;">
              <button type="button" id="qty-minus" style="padding:6px 13px; border:none; background:var(--paper); font-weight:800; cursor:pointer;">−</button>
              <span id="qty-val" style="padding:0 14px; font-weight:700;">1</span>
              <button type="button" id="qty-plus" style="padding:6px 13px; border:none; background:var(--paper); font-weight:800; cursor:pointer;">+</button>
            </div>
            <span id="detail-stock-val" style="font-size:0.78rem; color:var(--ink-muted); font-weight:600;">${initialStock > 0 ? `${initialStock} sản phẩm có sẵn` : 'Hết hàng'}</span>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
            <button type="button" id="btn-detail-add" class="cta-outline" style="justify-content:center;" ${initialStock <= 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;justify-content:center;"' : ''}>
              Thêm vào Túi Đồ
            </button>
            <button type="button" id="btn-detail-buy-now" class="cta-ribbon shimmer-sheen" style="justify-content:center;" ${initialStock <= 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;justify-content:center;"' : ''}>
              Đặt mua ngay
            </button>
          </div>

          <!-- DIRECT SHOPEE ORDER BUTTON (Only rendered when product has an exact 1-to-1 Shopee item URL!) -->
          ${
            isExactShopeeItem
              ? `<a
                  href="${escapeAttr(shopeeDirectUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-shopee-direct shimmer-sheen"
                  id="btn-open-shopee-direct"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M6 7h12l-1 13H7L6 7z"></path>
                    <path d="M9 7V5a3 3 0 0 1 6 0v2"></path>
                    <path d="M10 12.5c0-.7.9-1.2 2-1.2s2 .5 2 1.2-.9 1-2 1.3-2 .6-2 1.3.9 1.2 2 1.2 2-.5 2-1.2"></path>
                  </svg>
                  <span>Mở Trực Tiếp Sản Phẩm &amp; Đặt Hàng Trên Shopee</span>
                  <span style="font-size:0.86rem;">↗</span>
                </a>`
              : ''
          }

          ${
            pTag === 'tiktok' && rawSrcUrl && rawSrcUrl.includes('tiktok')
              ? `<a href="${escapeAttr(rawSrcUrl)}" target="_blank" rel="noopener noreferrer" style="display:block; text-align:center; font-size:0.77rem; color:var(--ink-muted); text-decoration:underline; margin-bottom:14px;">
                  Hoặc mở xem trên TikTok Shop chính thức &rarr;
                </a>`
              : ''
          }

          <div style="font-size:0.84rem; line-height:1.6; color:var(--ink-soft); background:var(--paper); padding:13px 15px; border-radius:14px; border:1px solid var(--line); white-space:pre-line;">
            <strong style="color:var(--ink);">Chi tiết chất liệu &amp; phom dáng:</strong><br/>${escapeHtml(p.description || '')}
          </div>
        </div>
      </div>

      <!-- Cross-sell Related Pieces -->
      ${
        related.length > 0
          ? `
        <div style="margin-top:24px; padding-top:18px; border-top:1px solid var(--line);">
          <div style="font-family:var(--font-serif); font-size:1.3rem; font-weight:700; margin-bottom:10px;">Phối Cùng Mẫu Này <em>Cực Hợp</em></div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:10px;">
            ${related
              .map(
                (rp) => `
              <div class="recent-mini-card related-jump" data-id="${escapeAttr(rp.id)}" style="max-width:none;">
                <img src="${escapeAttr((rp.images && rp.images[0]) || '/media/bio-link/girlfriend-1.jpg')}" alt="${escapeAttr(rp.name)}" />
                <div style="overflow:hidden;">
                  <div style="font-size:0.78rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(rp.name)}</div>
                  <div style="font-size:0.8rem; font-weight:800; color:var(--cherry);">${vnd(rp.price)}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Reviews + Real OOTD Photo Upload -->
      <div style="margin-top:24px; padding-top:18px; border-top:1px solid var(--line);">
        <h3 style="font-family:var(--font-serif); font-size:1.35rem; font-weight:700; margin-bottom:12px;">Cảm Nhận Từ <em>Các Nàng Thơ</em> (${prodReviews.length})</h3>
        <div style="margin-bottom:14px;">
          ${
            prodReviews.length > 0
              ? prodReviews
                  .slice(0, 6)
                  .map(
                    (r) => `
                <div style="background:var(--paper); border:1px solid var(--line); padding:11px 14px; border-radius:14px; margin-bottom:8px; font-size:0.81rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--cherry);">${escapeHtml(r.authorName)}</strong>
                    <span style="color:#d97706; font-size:0.78rem;">${'★'.repeat(Number(r.rating || 5))}</span>
                  </div>
                  ${r.fitNote ? `<div style="font-size:0.72rem; color:var(--ink-muted); margin-top:2px;">Số đo tham khảo: ${escapeHtml(r.fitNote)}</div>` : ''}
                  <div style="margin-top:4px; color:var(--ink);">${escapeHtml(r.comment)}</div>
                  ${r.photoUrl ? `<img src="${escapeAttr(r.photoUrl)}" class="rev-ootd-img" style="width:74px; height:86px; object-fit:cover; border-radius:10px; margin-top:8px; cursor:zoom-in; border:1px solid var(--line);" />` : ''}
                </div>
              `
                  )
                  .join('')
              : `<p style="font-size:0.8rem; color:var(--ink-muted);">Chưa có feedback cho thiết kế này. Nàng hãy là người đầu tiên gửi ảnh OOTD nhé!</p>`
          }
        </div>

        <form id="review-form" style="background:var(--rose-50); padding:14px; border-radius:16px; border:1px solid var(--rose-200);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
            <span style="font-size:0.78rem; font-weight:700;">Gửi đánh giá &amp; ảnh diện đồ:</span>
            <div id="star-picker" style="display:inline-flex; gap:4px; cursor:pointer; font-size:1.1rem; color:#d97706;">
              ${[1, 2, 3, 4, 5].map((st) => `<span data-star="${st}">★</span>`).join('')}
            </div>
          </div>
          <div class="form-grid-2">
            <input type="text" id="rev-name" class="cute-input" placeholder="Tên của nàng *" required />
            <input type="text" id="rev-fit" class="cute-input" placeholder="Chiều cao/cân nặng (VD: 1m60 - 47kg mặc S)" />
          </div>
          <input type="text" id="rev-comment" class="cute-input" placeholder="Chia sẻ cảm nhận về chất vải, mùi hương gói hàng... *" required />
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <label class="nav-pill" style="cursor:pointer;">
              <span>+ Đính kèm ảnh OOTD</span>
              <input type="file" id="rev-photo-file" accept="image/*" style="display:none;" />
            </label>
            <span id="rev-photo-status" style="font-size:0.74rem; color:var(--cherry); font-weight:600;"></span>
            <button type="submit" class="cta-ribbon" style="padding:9px 18px; margin-left:auto;">Gửi đánh giá</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('open');

    content.querySelector('#close-prod-modal').onclick = () => modal.classList.remove('open');
    content.querySelector('#detail-zoom-trigger').onclick = () =>
      openLightbox(content.querySelector('#detail-main-img').src);

    content.querySelectorAll('.rev-ootd-img').forEach((im) => {
      im.onclick = () => openLightbox(im.src);
    });

    content.querySelectorAll('.detail-thumb').forEach((th) => {
      th.onclick = () => {
        content.querySelector('#detail-main-img').src = th.getAttribute('data-src');
        content.querySelectorAll('.detail-thumb').forEach((x) => (x.style.borderColor = 'var(--line)'));
        th.style.borderColor = 'var(--cherry)';
      };
    });

    content.querySelectorAll('.related-jump').forEach((el) => {
      el.onclick = () => openProductModal(el.dataset.id);
    });

    content.querySelector('#detail-open-size-calc')?.addEventListener('click', () => {
      openSizeAdvisorModal(matchedSizeChart);
    });
    content.querySelector('#detail-open-size-calc-2')?.addEventListener('click', () => {
      openSizeAdvisorModal(matchedSizeChart);
    });
    content.querySelector('#btn-toggle-inline-chart')?.addEventListener('click', (ev) => {
      const bodyEl = content.querySelector('#inline-size-chart-body');
      if (!bodyEl) return;
      const isHidden = bodyEl.style.display === 'none';
      bodyEl.style.display = isHidden ? 'block' : 'none';
      ev.currentTarget.textContent = isHidden ? 'Thu gọn bảng ▴' : 'Xem bảng số đo ▾';
    });

    const refreshSelectionUI = () => {
      if (sizes.length > 0 && chosenVariant) {
        if (!chosenSize || isSizeSoldOutForVar(chosenVariant, chosenSize)) {
          chosenSize = getFirstInStockSize(chosenVariant);
        }
        content.querySelectorAll('#detail-sizes .variant-pill').forEach((sb) => {
          const sv = sb.getAttribute('data-val');
          const szOut = isSizeSoldOutForVar(chosenVariant, sv);
          sb.disabled = szOut;
          sb.classList.toggle('is-soldout', szOut);
          sb.classList.toggle('selected', !szOut && chosenSize === sv);
          sb.textContent = szOut ? `${sv} (Hết)` : sv;
          sb.title = szOut ? 'Size này đã hết hàng' : '';
        });
      }

      const activePrice = getActiveSelectionPrice(chosenVariant, chosenSize);
      const selStockNum = getActiveSelectionStock(chosenVariant, chosenSize);

      const hintEl = content.querySelector('#selected-var-hint');
      if (hintEl && chosenVariant) {
        hintEl.textContent = `Đang chọn: ${chosenVariant.label}${chosenSize ? ` (${chosenSize})` : ''} • ${vnd(activePrice)} • Kho: ${selStockNum}`;
      }

      const priceEl = content.querySelector('#detail-price-val');
      if (priceEl) priceEl.textContent = vnd(activePrice);

      const stockEl = content.querySelector('#detail-stock-val');
      if (stockEl) stockEl.textContent = selStockNum > 0 ? `${selStockNum} sản phẩm có sẵn` : 'Hết hàng';

      const addBtn = content.querySelector('#btn-detail-add');
      const buyBtn = content.querySelector('#btn-detail-buy-now');
      [addBtn, buyBtn].forEach((b) => {
        if (!b) return;
        b.disabled = selStockNum <= 0;
        b.style.opacity = selStockNum <= 0 ? '0.5' : '';
        b.style.cursor = selStockNum <= 0 ? 'not-allowed' : '';
      });

      if (selStockNum > 0 && qty > selStockNum) {
        qty = selStockNum;
      } else if (selStockNum > 0 && qty < 1) {
        qty = 1;
      }
      const qEl = content.querySelector('#qty-val');
      if (qEl) qEl.textContent = qty;
    };

    content.querySelectorAll('#detail-rich-variants .variant-chip-rich').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-vidx'));
        const v = pVariants[idx];
        if (!v || Number(v.stock ?? 0) <= 0) return;

        chosenVariant = v;
        chosenColor = `${varGroupTitle}: ${v.label}`;
        content.querySelectorAll('#detail-rich-variants .variant-chip-rich').forEach((x) => x.classList.remove('selected'));
        btn.classList.add('selected');

        if (v.image) {
          content.querySelector('#detail-main-img').src = v.image;
          content.querySelectorAll('.detail-thumb').forEach((th) => {
            th.style.borderColor = th.getAttribute('data-src') === v.image ? 'var(--cherry)' : 'var(--line)';
          });
        }
        refreshSelectionUI();
      };
    });

    content.querySelector('#btn-open-shopee-direct')?.addEventListener('click', () => {
      fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `shopee_${p.id}`,
          title: `Mở Shopee: ${p.name.slice(0, 45)}`,
          url: shopeeDirectUrl
        })
      }).catch(() => {});
    });

    content.querySelectorAll('#detail-colors .variant-pill').forEach((b) => {
      b.onclick = () => {
        content.querySelectorAll('#detail-colors .variant-pill').forEach((x) => x.classList.remove('selected'));
        b.classList.add('selected');
        chosenColor = b.getAttribute('data-val');
      };
    });

    content.querySelectorAll('#detail-sizes .variant-pill').forEach((b) => {
      b.onclick = () => {
        const sv = b.getAttribute('data-val');
        if (b.disabled || isSizeSoldOutForVar(chosenVariant, sv)) {
          return showToast('Size này đã hết hàng, nàng chọn size khác nhé!');
        }
        chosenSize = sv;
        refreshSelectionUI();
      };
    });

    content.querySelector('#qty-minus').onclick = () => {
      qty = Math.max(1, qty - 1);
      content.querySelector('#qty-val').textContent = qty;
    };
    content.querySelector('#qty-plus').onclick = () => {
      const avail = getActiveSelectionStock(chosenVariant, chosenSize);
      const maxStock = Math.max(1, avail);
      if (qty >= maxStock) {
        showToast(`Phân hệ này chỉ còn tối đa ${maxStock} sản phẩm trong kho!`);
        return;
      }
      qty = Math.min(maxStock, qty + 1);
      content.querySelector('#qty-val').textContent = qty;
    };

    content.querySelector('#btn-detail-add').onclick = (e) => {
      if (getActiveSelectionStock(chosenVariant, chosenSize) <= 0) {
        return showToast('Phân hệ / size này đã hết hàng, nàng chọn mẫu khác nhé!');
      }
      addToCart(p, chosenSize, chosenColor, qty, chosenVariant);
      animateFlyToBag((chosenVariant && chosenVariant.image) || imgs[0], e.currentTarget);
      modal.classList.remove('open');
      openCartDrawer();
    };

    content.querySelector('#btn-detail-buy-now').onclick = () => {
      if (getActiveSelectionStock(chosenVariant, chosenSize) <= 0) {
        return showToast('Phân hệ / size này đã hết hàng, nàng chọn mẫu khác nhé!');
      }
      addToCart(p, chosenSize, chosenColor, qty, chosenVariant);
      modal.classList.remove('open');
      openCheckoutModal();
    };

    // Star rating picker
    content.querySelectorAll('#star-picker span').forEach((stEl) => {
      stEl.onclick = () => {
        chosenStars = Number(stEl.dataset.star || 5);
        content.querySelectorAll('#star-picker span').forEach((s) => {
          s.textContent = Number(s.dataset.star) <= chosenStars ? '★' : '☆';
        });
      };
    });

    content.querySelector('#rev-photo-file')?.addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      const st = content.querySelector('#rev-photo-status');
      st.textContent = 'Đang xử lý ảnh...';
      try {
        pendingRevPhotoDataUrl = await compressImageClient(f, 800);
        st.textContent = 'Đã đính kèm 1 ảnh OOTD ✓';
      } catch {
        st.textContent = 'Không đọc được ảnh';
      }
    });

    content.querySelector('#review-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const authorName = content.querySelector('#rev-name').value.trim();
      const fitNote = content.querySelector('#rev-fit').value.trim();
      const comment = content.querySelector('#rev-comment').value.trim();
      if (!authorName || !comment) return;

      const res = await fetch('/api/shop/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: p.id,
          authorName,
          fitNote,
          rating: chosenStars,
          comment,
          photoDataUrl: pendingRevPhotoDataUrl
        })
      });
      const out = await res.json();
      if (out.success) {
        reviews.unshift(out.review);
        p.reviewCount = Number(p.reviewCount || 0) + 1;
        showToast('Cảm ơn đánh giá đáng yêu của nàng!');
        openProductModal(p.id);
        renderProducts();
      }
    };
  }

  // --- 9. INTERACTIVE MULTI-GARMENT SIZE CHARTS & SMART SIZE ADVISOR ---
  function resolveSizeChartForProduct(p) {
    if (!p) return null;
    if (p.sizeChartId === 'none') return null;
    if (p.sizeChartId === 'custom' && p.customSizeChart && Array.isArray(p.customSizeChart.columns)) {
      return {
        ...p.customSizeChart,
        id: `custom_${p.id}`,
        name: p.customSizeChart.name || `Bảng Size — ${p.name.slice(0, 32)}`
      };
    }
    if (p.sizeChartId && p.sizeChartId !== 'auto') {
      const exact = sizeCharts.find((c) => c.id === p.sizeChartId);
      if (exact) return exact;
    }

    // Smart auto-detection from product name + category
    const text = `${p.name || ''} ${getCategoryLabel(p.category)}`.toLowerCase();
    if (/sticker|nhãn dán|kẹp tóc|túi|balo|móc khóa|vớ|tất|ủng/.test(text)) {
      return null;
    }
    for (const c of sizeCharts) {
      const kws = String(c.autoKeywords || '')
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      if (kws.some((kw) => text.includes(kw))) {
        return c;
      }
    }
    return sizeCharts[0] || null;
  }

  function renderSizeChartTableHtml(chart, recRowIdx = -1, compact = false) {
    if (!chart || !Array.isArray(chart.columns) || chart.columns.length === 0) return '';
    const cols = chart.columns;
    const rows = Array.isArray(chart.rows) ? chart.rows : [];

    const headHtml = cols.map((col) => `<th>${escapeHtml(col)}</th>`).join('');
    const bodyHtml = rows
      .map((r, rIdx) => {
        const isRec = rIdx === recRowIdx;
        const cellsHtml = cols
          .map((_, cIdx) => {
            const val = r[cIdx] ?? '';
            if (cIdx === 0 && isRec) {
              return `<td>${escapeHtml(val)} <span class="size-rec-mini-pill">Chuẩn nhất</span></td>`;
            }
            return `<td>${escapeHtml(val)}</td>`;
          })
          .join('');
        return `<tr class="${isRec ? 'is-rec-row' : ''}">${cellsHtml}</tr>`;
      })
      .join('');

    const diagHtml =
      chart.diagramUrl && !compact
        ? `<img src="${escapeAttr(chart.diagramUrl)}" alt="Minh họa cách đo" class="size-chart-diagram" loading="lazy" />`
        : chart.diagramUrl && compact
        ? `<img src="${escapeAttr(chart.diagramUrl)}" alt="Minh họa cách đo" class="size-chart-diagram" style="max-height:175px;" loading="lazy" />`
        : '';

    const noteHtml = chart.note
      ? `<div style="font-size:0.74rem; color:var(--ink-muted); margin-top:7px; text-align:center;">${escapeHtml(chart.note)}</div>`
      : '';

    return `
      <div class="size-chart-table-wrap">
        <table class="size-chart-table">
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
      ${noteHtml}
      ${diagHtml}
    `;
  }

  function parseRangeFromCell(rawText, isHeightCm) {
    const s = String(rawText || '').toLowerCase().replace(/,/g, '.').trim();
    if (!s) return null;

    // Convert "1m65" -> "165", "1m7" -> "170"
    const normalized = isHeightCm
      ? s.replace(/(\d)\s*m\s*(\d{1,2})/g, (_, m, cm) => String(Number(m) * 100 + Number(cm.length === 1 ? cm + '0' : cm)))
      : s;

    const nums = (normalized.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => !isNaN(n));
    if (nums.length === 0) return null;

    if (/dưới|<|<=|nhỏ hơn|tối đa/.test(normalized)) {
      return { min: isHeightCm ? 135 : 30, max: nums[0] };
    }
    if (/trên|>|>=|từ\s*\d+\s*trở lên/.test(normalized)) {
      return { min: nums[0], max: isHeightCm ? 205 : 120 };
    }
    if (nums.length >= 2) {
      return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
    }
    return { min: nums[0] - 2, max: nums[0] + 2 };
  }

  function getActiveAdvisorChartsList() {
    const list = [...sizeCharts];
    if (tempCustomChart && !list.some((c) => c.id === tempCustomChart.id)) {
      list.unshift(tempCustomChart);
    }
    return list;
  }

  function renderSizeAdvisorTabs() {
    const wrap = document.getElementById('size-chart-tabs');
    if (!wrap) return;
    const charts = getActiveAdvisorChartsList();
    if (charts.length === 0) {
      wrap.innerHTML = '';
      return;
    }
    if (!activeSizeChartId || !charts.some((c) => c.id === activeSizeChartId)) {
      activeSizeChartId = charts[0].id;
    }
    wrap.innerHTML = charts
      .map(
        (c) =>
          `<button type="button" class="size-chart-tab-btn ${c.id === activeSizeChartId ? 'active' : ''}" data-cid="${escapeAttr(c.id)}">${escapeHtml(c.name)}</button>`
      )
      .join('');
    wrap.querySelectorAll('.size-chart-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSizeChartId = btn.getAttribute('data-cid') || '';
        renderSizeAdvisorTabs();
        updateSizeCalculation();
      });
    });
  }

  function openSizeAdvisorModal(preferredChart = null) {
    if (preferredChart && String(preferredChart.id || '').startsWith('custom_')) {
      tempCustomChart = preferredChart;
      activeSizeChartId = preferredChart.id;
    } else {
      tempCustomChart = null;
      if (preferredChart && preferredChart.id) {
        activeSizeChartId = preferredChart.id;
      }
    }
    renderSizeAdvisorTabs();
    updateSizeCalculation();
    document.getElementById('size-modal')?.classList.add('open');
  }

  function updateSizeCalculation() {
    const h = Number(document.getElementById('calc-height')?.value || 160);
    const w = Number(document.getElementById('calc-weight')?.value || 52);
    const fit = document.querySelector('#fit-pref-pills .variant-pill.selected')?.dataset.fit || 'regular';

    const hValEl = document.getElementById('calc-h-val');
    const wValEl = document.getElementById('calc-w-val');
    if (hValEl) hValEl.textContent = `${h} cm`;
    if (wValEl) wValEl.textContent = `${w} kg`;

    const charts = getActiveAdvisorChartsList();
    const chart = charts.find((c) => c.id === activeSizeChartId) || charts[0] || null;
    const tableBox = document.getElementById('size-chart-table-box');

    if (chart && Array.isArray(chart.rows) && chart.rows.length > 0) {
      const colsLower = (chart.columns || []).map((c) => String(c || '').toLowerCase());
      const weightColIdx = colsLower.findIndex((c) => /cân nặng|weight|\bkg\b/.test(c));
      const heightColIdx = colsLower.findIndex((c) => /chiều cao|height/.test(c));

      const adjW = w + (fit === 'loose' ? 2.5 : fit === 'slim' ? -2 : 0);
      let bestIdx = 0;
      let bestScore = Infinity;

      chart.rows.forEach((row, idx) => {
        let score = 0;
        let hasMetric = false;
        if (weightColIdx >= 0) {
          const wr = parseRangeFromCell(row[weightColIdx], false);
          if (wr) {
            hasMetric = true;
            if (adjW < wr.min) score += (wr.min - adjW) * 2.4;
            else if (adjW > wr.max) score += (adjW - wr.max) * 2.4;
            else {
              const mid = (wr.min + wr.max) / 2;
              score += Math.abs(adjW - mid) * 0.12;
            }
          }
        }
        if (heightColIdx >= 0) {
          const hr = parseRangeFromCell(row[heightColIdx], true);
          if (hr) {
            hasMetric = true;
            if (h < hr.min) score += (hr.min - h) * 0.85;
            else if (h > hr.max) score += (h - hr.max) * 0.85;
            else {
              const midH = (hr.min + hr.max) / 2;
              score += Math.abs(h - midH) * 0.04;
            }
          }
        }
        if (!hasMetric) {
          // Fallback proportional index if manual table has no weight/height columns
          const ratio = Math.min(1, Math.max(0, (adjW - 42) / 36));
          const targetIdx = ratio * Math.max(0, chart.rows.length - 1);
          score = Math.abs(idx - targetIdx);
        }
        if (score < bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      });

      const bestRow = chart.rows[bestIdx] || chart.rows[0];
      const recSizeName = String(bestRow[0] || 'M').trim();
      const recLabel = /^size/i.test(recSizeName) ? recSizeName : `Size ${recSizeName}`;

      const specPairs = (chart.columns || [])
        .slice(1)
        .map((colName, i) => {
          const val = String(bestRow[i + 1] ?? '').trim();
          return val ? `${colName}: ${val}` : '';
        })
        .filter(Boolean);

      document.getElementById('size-rec-letter').textContent = recLabel;
      document.getElementById('size-rec-title').textContent = `${chart.name}: Gợi ý chuẩn nhất là ${recLabel}!`;
      document.getElementById('size-rec-desc').textContent =
        specPairs.length > 0
          ? `Thông số dòng ${recLabel} → ${specPairs.join(' • ')}`
          : `Với chiều cao ${h}cm & cân nặng ${w}kg, ${recLabel} sẽ vừa đẹp nhất cho nàng.`;

      if (tableBox) {
        tableBox.innerHTML = renderSizeChartTableHtml(chart, bestIdx, false);
      }
      return;
    }

    // Fallback if store has zero size charts
    let adjWeight = w + (fit === 'loose' ? 3 : fit === 'slim' ? -2 : 0) - (h - 158) * 0.25;
    let rec = 'Size S';
    if (adjWeight >= 47 && adjWeight <= 53.5) rec = 'Size M';
    else if (adjWeight > 53.5) rec = 'Size L';
    document.getElementById('size-rec-letter').textContent = rec;
    document.getElementById('size-rec-title').textContent = `Gợi ý chuẩn nhất: ${rec}`;
    document.getElementById('size-rec-desc').textContent = `Với chiều cao ${h}cm & cân nặng ${w}kg, ${rec} sẽ lên phom thoải mái nhất.`;
    if (tableBox) tableBox.innerHTML = '';
  }

  ['btn-open-size-guide', 'hero-btn-size', 'mob-open-size'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => {
      openSizeAdvisorModal(null);
    });
  });
  document.getElementById('btn-close-size')?.addEventListener('click', () => {
    document.getElementById('size-modal')?.classList.remove('open');
  });
  document.getElementById('calc-height')?.addEventListener('input', updateSizeCalculation);
  document.getElementById('calc-weight')?.addEventListener('input', updateSizeCalculation);
  document.querySelectorAll('#fit-pref-pills .variant-pill').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#fit-pref-pills .variant-pill').forEach((x) => x.classList.remove('selected'));
      b.classList.add('selected');
      updateSizeCalculation();
    });
  });

  // --- 10. INTERACTIVE LUCKY RIBBON GIFT BOX ---
  let luckyWonCode = 'NANGTHO15';

  function openLuckyModal() {
    document.getElementById('lucky-modal')?.classList.add('open');
  }
  ['btn-open-lucky', 'btn-voucher-lucky', 'mob-open-lucky'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', openLuckyModal);
  });
  document.getElementById('btn-close-lucky')?.addEventListener('click', () => {
    document.getElementById('lucky-modal')?.classList.remove('open');
  });

  document.getElementById('btn-unbox-gift')?.addEventListener('click', (e) => {
    const boxBtn = e.currentTarget;
    boxBtn.classList.add('shaking');
    const pool = coupons.length > 0 ? coupons : [{ code: 'NANGTHO15', description: 'Giảm 15% đơn từ 250k' }];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    luckyWonCode = picked.code;

    setTimeout(() => {
      boxBtn.style.display = 'none';
      const panel = document.getElementById('gift-won-panel');
      document.getElementById('gift-won-code').textContent = picked.code;
      document.getElementById('gift-won-desc').textContent = picked.description || 'Ưu đãi dành riêng cho nàng hôm nay';
      panel.style.display = 'block';
      const rect = panel.getBoundingClientRect();
      spawnVectorBurst(rect.left + rect.width / 2, rect.top + 30);
    }, 620);
  });

  document.getElementById('btn-use-lucky-code')?.addEventListener('click', () => {
    document.getElementById('cart-coupon-input').value = luckyWonCode;
    navigator.clipboard?.writeText(luckyWonCode).catch(() => {});
    document.getElementById('lucky-modal')?.classList.remove('open');
    showToast(`Đã chép mã ${luckyWonCode} vào Túi Đồ!`);
    openCartDrawer();
  });

  // --- 11. SHOPPING BAG, SCENTED TISSUE & COUPON ---
  function addToCart(prod, size, color, qty, variantObj = null) {
    const key = `${prod.id}__${size}__${color}`;
    const unitPrice =
      variantObj && size && variantObj.sizePrices && Number(variantObj.sizePrices[size]) > 0
        ? Number(variantObj.sizePrices[size])
        : variantObj && Number(variantObj.price) > 0
        ? Number(variantObj.price)
        : Number(prod.price);
    const unitImg =
      (variantObj && variantObj.image) ||
      (prod.images && prod.images[0]) ||
      '/media/bio-link/girlfriend-1.jpg';
    const maxStock = variantObj
      ? size && variantObj.sizeStocks && variantObj.sizeStocks[size] !== undefined
        ? Math.max(0, Number(variantObj.sizeStocks[size] || 0))
        : Math.max(0, Number(variantObj.stock ?? 1))
      : Math.max(0, Number(prod.stock ?? 10));
    const safeMax = Math.max(1, maxStock);

    const found = cart.find((it) => it.key === key);
    if (found) {
      found.maxStock = safeMax;
      if (found.qty + qty > safeMax) {
        found.qty = safeMax;
        showToast(`Phân hệ này chỉ còn tối đa ${safeMax} sản phẩm trong kho!`);
      } else {
        found.qty += qty;
      }
      found.price = unitPrice;
      found.image = unitImg;
    } else {
      cart.push({
        key,
        productId: prod.id,
        name: prod.name,
        price: unitPrice,
        image: unitImg,
        size,
        color,
        variantLabel: variantObj ? variantObj.label : '',
        maxStock: safeMax,
        qty: Math.min(safeMax, qty)
      });
    }
    saveCart();
  }

  function saveCart() {
    localStorage.setItem('na2hand_cart', JSON.stringify(cart));
    revalidateAppliedCoupon();
    updateBadgesAndCart();
  }

  function getCartTotals() {
    const subtotal = cart.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
    const freeThreshold = Number(settings.freeShipThreshold || 299000);
    const baseShip = Number(settings.shippingFee ?? 25000);
    const shipping = subtotal === 0 || subtotal >= freeThreshold ? 0 : baseShip;
    const discount = appliedCoupon ? Math.min(Number(appliedCoupon.discount || 0), subtotal) : 0;
    const total = Math.max(0, subtotal - discount + shipping);
    return { subtotal, freeThreshold, shipping, discount, total };
  }

  function revalidateAppliedCoupon() {
    if (!appliedCoupon) return;
    const subtotal = cart.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
    const cp = coupons.find((c) => c.code === appliedCoupon.code);
    if (!cp || subtotal < Number(cp.minOrder || 0)) {
      appliedCoupon = null;
      const fb = document.getElementById('coupon-feedback');
      if (fb) fb.style.display = 'none';
    } else {
      let d = cp.type === 'percent' ? Math.round((subtotal * Number(cp.value)) / 100) : Number(cp.value);
      if (cp.maxDiscount && d > Number(cp.maxDiscount)) d = Number(cp.maxDiscount);
      appliedCoupon.discount = Math.min(d, subtotal);
    }
  }

  function updateBadgesAndCart() {
    const totalQty = cart.reduce((s, it) => s + Number(it.qty), 0);
    document.getElementById('cart-count').textContent = totalQty;
    document.getElementById('wishlist-count').textContent = wishlist.length;

    const { subtotal, freeThreshold, shipping, discount, total } = getCartTotals();

    const pct = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
    document.getElementById('freeship-fill').style.width = `${pct}%`;
    document.getElementById('freeship-msg').innerHTML =
      subtotal >= freeThreshold
        ? `Tuyệt vời! Đơn của nàng đã được <strong>Miễn phí vận chuyển</strong>`
        : `Mua thêm <strong>${vnd(freeThreshold - subtotal)}</strong> để được <strong>Freeship</strong> nhé!`;

    const listEl = document.getElementById('cart-items-list');
    if (cart.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:44px 12px; color:var(--ink-muted);">
          <div style="font-family:var(--font-serif); font-size:1.35rem; color:var(--ink); margin-bottom:4px;">Túi đồ đang trống</div>
          <p style="font-size:0.8rem;">Hãy dạo tủ đồ và chọn cho mình một thiết kế thật ưng ý nhé ♡</p>
        </div>
      `;
    } else {
      listEl.innerHTML = cart
        .map(
          (it, idx) => {
            const metaLine = [it.color, it.size]
              .map((x) => String(x || '').trim())
              .filter((x) => x && x !== 'Theo hình' && x !== 'Mặc định')
              .join(' · ');
            return `
          <div style="display:flex; gap:11px; padding:10px; border-radius:14px; background:#fff; border:1px solid var(--line); margin-bottom:9px;">
            <img src="${escapeAttr(it.image)}" style="width:60px; height:60px; aspect-ratio:1/1; object-fit:contain; background:#ffffff; border:1px solid var(--line); border-radius:10px;" />
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.81rem; font-weight:700; line-height:1.3;">${escapeHtml(it.name)}</div>
              ${metaLine ? `<div style="font-size:0.72rem; color:var(--ink-muted); margin:2px 0 6px;">${escapeHtml(metaLine)}</div>` : '<div style="margin-bottom:6px;"></div>'}
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <strong style="color:var(--cherry); font-size:0.85rem;">${vnd(it.price * it.qty)}</strong>
                <div style="display:inline-flex; align-items:center; gap:6px;">
                  <button type="button" class="c-dec" data-idx="${idx}" style="width:22px; height:22px; border-radius:6px; border:1px solid var(--line-strong); background:var(--paper); cursor:pointer; font-weight:700;">−</button>
                  <span style="font-size:0.78rem; font-weight:700;">${it.qty}</span>
                  <button type="button" class="c-inc" data-idx="${idx}" style="width:22px; height:22px; border-radius:6px; border:1px solid var(--line-strong); background:var(--paper); cursor:pointer; font-weight:700;">+</button>
                  <button type="button" class="c-del" data-idx="${idx}" style="border:none; background:none; color:var(--ink-muted); cursor:pointer; font-size:0.76rem; margin-left:4px;">Xóa</button>
                </div>
              </div>
            </div>
          </div>
        `;
          }
        )
        .join('');

      listEl.querySelectorAll('.c-dec').forEach((b) => {
        b.onclick = () => {
          const i = Number(b.dataset.idx);
          if (cart[i].qty > 1) cart[i].qty--;
          else cart.splice(i, 1);
          saveCart();
        };
      });
      listEl.querySelectorAll('.c-inc').forEach((b) => {
        b.onclick = () => {
          const item = cart[Number(b.dataset.idx)];
          if (!item) return;
          const prodRef = products.find((p) => p.id === item.productId);
          const varRef =
            prodRef && Array.isArray(prodRef.variants) && item.variantLabel
              ? prodRef.variants.find((v) => v.label === item.variantLabel)
              : null;
          const liveMax = varRef
            ? item.size && varRef.sizeStocks && varRef.sizeStocks[item.size] !== undefined
              ? Math.max(1, Number(varRef.sizeStocks[item.size] || 0))
              : Math.max(1, Number(varRef.stock ?? 1))
            : prodRef
            ? Math.max(1, Number(prodRef.stock ?? 1))
            : Number(item.maxStock || 99);
          if (item.qty >= liveMax) {
            showToast(`Phân hệ này chỉ còn tối đa ${liveMax} sản phẩm trong kho!`);
            return;
          }
          item.qty++;
          saveCart();
        };
      });
      listEl.querySelectorAll('.c-del').forEach((b) => {
        b.onclick = () => {
          cart.splice(Number(b.dataset.idx), 1);
          saveCart();
        };
      });
    }

    document.getElementById('cart-subtotal').textContent = vnd(subtotal);
    document.getElementById('cart-discount').textContent = `-${vnd(discount)}`;
    document.getElementById('cart-shipping').textContent = shipping === 0 && subtotal > 0 ? 'Miễn phí' : vnd(shipping);
    document.getElementById('cart-total').textContent = vnd(total);
    const chkTotal = document.getElementById('chk-btn-total');
    if (chkTotal) chkTotal.textContent = vnd(total);
  }

  document.querySelectorAll('#scent-chips .scent-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#scent-chips .scent-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedScent = chip.dataset.scent;
      showToast(`Đã chọn ướp giấy gói: ${selectedScent}`);
    });
  });

  function openCartDrawer() {
    document.getElementById('cart-drawer-backdrop').classList.add('open');
  }
  function closeCartDrawer() {
    document.getElementById('cart-drawer-backdrop').classList.remove('open');
  }

  // --- 12. CHECKOUT (DIRECT QR & COD + GIFT CARD + RECEIPT UPLOAD) ---
  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast('Nàng hãy chọn ít nhất 1 sản phẩm vào Túi Đồ trước nhé!');
      return;
    }
    closeCartDrawer();
    document.getElementById('checkout-form-step').style.display = 'block';
    document.getElementById('checkout-success-step').style.display = 'none';
    updateBadgesAndCart();
    document.getElementById('checkout-modal').classList.add('open');
  }

  document.getElementById('chk-gift-wrap')?.addEventListener('change', (e) => {
    document.getElementById('chk-gift-msg').style.display = e.target.checked ? 'block' : 'none';
  });

  function renderOrderSuccessAndQR(order, paymentInfo) {
    const stepForm = document.getElementById('checkout-form-step');
    const stepOk = document.getElementById('checkout-success-step');
    stepForm.style.display = 'none';
    stepOk.style.display = 'block';

    // Save to local device order history
    savedOrders = [
      { orderCode: order.orderCode, phone: order.customerPhone, createdAt: order.createdAt },
      ...savedOrders.filter((x) => x.orderCode !== order.orderCode)
    ].slice(0, 10);
    localStorage.setItem('na2hand_my_orders', JSON.stringify(savedOrders));

    const isQr = paymentInfo.method === 'qr';

    stepOk.innerHTML = `
      <div class="modal-kicker">ĐẶT HÀNG THÀNH CÔNG</div>
      <h2 class="modal-heading">Cảm Ơn Nàng <em>${escapeHtml(order.customerName)}</em></h2>
      <p style="font-size:0.84rem; color:var(--ink-soft); margin-bottom:14px;">
        Mã đơn của nàng: <strong style="color:var(--cherry); font-size:0.98rem;">#${escapeHtml(order.orderCode)}</strong>
        · Hương giấy gói: <strong>${escapeHtml(order.scentChoice || 'Hương Đào Trắng')}</strong>
      </p>

      ${
        isQr
          ? `
        <div style="background:var(--rose-50); border:1.5px solid var(--rose-200); border-radius:20px; padding:18px; margin-bottom:14px;">
          <div style="font-weight:800; color:var(--cherry); font-size:0.88rem; margin-bottom:8px;">
            Quét Mã QR Để Thanh Toán Trực Tiếp
          </div>
          <img src="${escapeAttr(paymentInfo.qrDisplayUrl)}" alt="QR Thanh toán" style="width:215px; height:215px; object-fit:contain; background:#fff; padding:8px; border-radius:16px; border:1px solid var(--line); margin:0 auto 10px; display:block;" />

          <div style="font-size:0.82rem; line-height:1.65; background:#fff; border-radius:12px; padding:10px 14px; text-align:left; border:1px solid var(--line);">
            ${paymentInfo.bankName ? `<div>Ngân hàng: <strong>${escapeHtml(paymentInfo.bankName)}</strong></div>` : ''}
            ${paymentInfo.bankAccountNo ? `<div>Số tài khoản: <strong>${escapeHtml(paymentInfo.bankAccountNo)}</strong></div>` : ''}
            ${paymentInfo.bankAccountName ? `<div>Chủ tài khoản: <strong>${escapeHtml(paymentInfo.bankAccountName)}</strong></div>` : ''}
            <div>Số tiền cần chuyển: <strong style="color:var(--cherry); font-size:0.95rem;">${vnd(paymentInfo.totalAmount)}</strong></div>
            <div>Nội dung CK: <strong style="background:var(--rose-100); padding:2px 8px; border-radius:6px; color:var(--cherry);">${escapeHtml(paymentInfo.transferNote)}</strong></div>
          </div>

          <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
            <label class="cta-outline" style="justify-content:center; font-size:0.79rem;">
              <span>Đính kèm ảnh chụp màn hình chuyển khoản (Tùy chọn)</span>
              <input type="file" id="qr-receipt-file" accept="image/*" style="display:none;" />
            </label>
            <div id="qr-receipt-name" style="font-size:0.74rem; color:var(--sage-ink); font-weight:700;"></div>

            <button type="button" id="btn-i-paid-qr" class="cta-ribbon shimmer-sheen" style="width:100%; justify-content:center; padding:13px;">
              <span>Xác nhận em đã quét QR chuyển khoản xong</span>
            </button>
          </div>
        </div>
      `
          : `
        <div style="background:var(--sage); border:1px solid #b7e4c7; border-radius:18px; padding:16px; margin-bottom:16px; font-size:0.84rem; color:var(--sage-ink);">
          <strong>Đơn Ship COD — Nhận Hàng Rồi Thanh Toán</strong><br/>
          Tiệm sẽ gọi xác nhận và gửi gói hàng thơm đi sớm nhất. Khi nhận hàng nàng chuẩn bị giúp bưu tá <strong>${vnd(order.totalAmount)}</strong> nhé!
        </div>
      `
      }

      <button type="button" id="btn-done-order" class="nav-pill" style="padding:10px 22px;">
        Tiếp tục dạo cửa hàng
      </button>
    `;

    let uploadedReceiptDataUrl = '';
    const receiptInput = stepOk.querySelector('#qr-receipt-file');
    if (receiptInput) {
      receiptInput.onchange = async (ev) => {
        const f = ev.target.files?.[0];
        if (!f) return;
        const lbl = stepOk.querySelector('#qr-receipt-name');
        lbl.textContent = 'Đang tải ảnh biên lai...';
        try {
          uploadedReceiptDataUrl = await compressImageClient(f, 950);
          lbl.textContent = 'Đã đính kèm ảnh biên lai chuyển khoản ✓';
        } catch {
          lbl.textContent = 'Không thể đọc file ảnh';
        }
      };
    }

    const paidBtn = stepOk.querySelector('#btn-i-paid-qr');
    if (paidBtn) {
      paidBtn.onclick = async () => {
        paidBtn.disabled = true;
        paidBtn.textContent = 'Đang gửi xác nhận...';
        const res = await fetch(`/api/shop/orders/${encodeURIComponent(order.orderCode)}/confirm-qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptDataUrl: uploadedReceiptDataUrl })
        });
        const d = await res.json();
        paidBtn.textContent = 'Tiệm đã ghi nhận chuyển khoản ✓';
        paidBtn.style.background = '#15803d';
        showToast(d.message || 'Đã ghi nhận thanh toán QR!');
      };
    }

    stepOk.querySelector('#btn-done-order').onclick = () => {
      document.getElementById('checkout-modal').classList.remove('open');
    };
  }

  // --- 13. ORDER TRACKING & 5-STEP TIMELINE + CANCEL PENDING ORDER ---
  function renderSavedOrderChips() {
    const box = document.getElementById('my-recent-orders-chips');
    if (!box) return;
    if (savedOrders.length === 0) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = `
      <div style="font-size:0.73rem; color:var(--ink-muted); margin-bottom:5px;">Đơn đặt gần đây trên thiết bị này:</div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${savedOrders
          .map(
            (so) =>
              `<button type="button" class="quick-size-chip saved-ord-chip" data-code="${escapeAttr(so.orderCode)}">#${escapeHtml(so.orderCode)}</button>`
          )
          .join('')}
      </div>
    `;
    box.querySelectorAll('.saved-ord-chip').forEach((b) => {
      b.onclick = () => {
        document.getElementById('track-query-input').value = b.dataset.code;
        executeOrderLookup(b.dataset.code);
      };
    });
  }

  async function executeOrderLookup(rawQuery) {
    const q = String(rawQuery || document.getElementById('track-query-input').value || '').trim();
    const box = document.getElementById('track-results-box');
    if (!q) return;
    box.innerHTML = `<p style="font-size:0.82rem; color:var(--ink-muted);">Đang tìm kiếm đơn hàng...</p>`;
    const res = await fetch(`/api/shop/orders/track?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    if (!d.success || !d.orders || d.orders.length === 0) {
      box.innerHTML = `<p style="font-size:0.82rem; color:var(--cherry); font-weight:600;">${escapeHtml(d.message || 'Không tìm thấy đơn hàng nào khớp với thông tin này.')}</p>`;
      return;
    }

    const stages = ['pending', 'confirmed', 'packing', 'shipping', 'completed'];
    const stageNames = ['Chờ duyệt', 'Đã xác nhận', 'Ướp hương', 'Đang giao', 'Hoàn tất'];

    box.innerHTML = d.orders
      .map((o) => {
        const curIdx = stages.indexOf(o.orderStatus);
        const isCancelled = o.orderStatus === 'cancelled';

        const timelineHtml = isCancelled
          ? `<div style="padding:8px 12px; border-radius:10px; background:#fef2f2; color:#b91c1c; font-size:0.78rem; font-weight:700; margin:8px 0;">Đơn hàng này đã được hủy</div>`
          : `
            <div class="order-journey-steps">
              ${stages
                .map(
                  (st, i) => `
                <div class="journey-step ${i <= curIdx ? 'done' : ''}">
                  <div class="journey-dot">${i <= curIdx ? '✓' : i + 1}</div>
                  <div>${stageNames[i]}</div>
                </div>
              `
                )
                .join('')}
            </div>
          `;

        return `
          <div style="background:var(--paper); border:1px solid var(--line-strong); border-radius:18px; padding:14px 16px; margin-bottom:12px; font-size:0.81rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:var(--cherry); font-size:0.92rem;">Đơn #${escapeHtml(o.orderCode)}</strong>
              <span style="font-size:0.73rem; color:var(--ink-muted);">${new Date(o.createdAt).toLocaleString('vi-VN')}</span>
            </div>

            ${timelineHtml}

            <div style="color:var(--ink-soft); line-height:1.55;">
              <div>Hình thức: <strong>${o.paymentMethod === 'qr' ? 'Quét mã QR' : 'Ship COD'}</strong> (${o.paymentStatus === 'paid' ? 'Đã thanh toán' : o.paymentStatus === 'customer_confirmed_qr' ? 'Chờ tiệm đối soát QR' : 'Chờ thanh toán'})</div>
              <div>Tổng thanh toán: <strong style="color:var(--cherry);">${vnd(o.totalAmount)}</strong></div>
              ${o.scentChoice ? `<div>Hương giấy gói: <strong>${escapeHtml(o.scentChoice)}</strong></div>` : ''}
            </div>

            ${
              o.orderStatus === 'pending'
                ? `<div style="margin-top:10px; text-align:right;">
                    <button type="button" class="text-link-btn btn-cancel-my-order" data-code="${escapeAttr(o.orderCode)}" data-phone="${escapeAttr(o.customerPhone)}" style="color:#be123c; font-weight:700;">Hủy đơn hàng này</button>
                  </div>`
                : ''
            }
          </div>
        `;
      })
      .join('');

    box.querySelectorAll('.btn-cancel-my-order').forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm(`Nàng chắc chắn muốn hủy đơn #${btn.dataset.code}?`)) return;
        const r = await fetch(`/api/shop/orders/${encodeURIComponent(btn.dataset.code)}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: btn.dataset.phone })
        });
        const j = await r.json();
        showToast(j.message || 'Đã cập nhật đơn hàng');
        executeOrderLookup(q);
      };
    });
  }

  // --- 14. LIVE BOUTIQUE ACTIVITY TOAST ---
  function startLiveProofToast() {
    if (settings.liveProofEnabled === false || products.length === 0) return;
    const names = ['Khánh Linh', 'Bảo Ngọc', 'Thảo Nhi', 'Minh Châu', 'Phương Anh', 'Quỳnh Trang'];
    const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Đà Lạt'];
    const toast = document.getElementById('live-proof-toast');
    if (!toast) return;

    setInterval(() => {
      const prod = products[Math.floor(Math.random() * products.length)];
      const girl = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      document.getElementById('proof-img').src = (prod.images && prod.images[0]) || '/media/bio-link/girlfriend-1.jpg';
      document.getElementById('proof-title').textContent = `${girl} (${city}) vừa đặt`;
      document.getElementById('proof-prod').textContent = `${prod.name.slice(0, 30)}...`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4500);
    }, 24000);
  }

  // --- 15. GLOBAL EVENT LISTENERS ---
  function bindEvents() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) searchClear.style.display = searchQuery ? 'block' : 'none';
      renderProducts();
    });

    searchClear?.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      searchClear.style.display = 'none';
      renderProducts();
    });

    document.querySelectorAll('.hot-tag').forEach((tag) => {
      tag.addEventListener('click', () => {
        searchQuery = tag.dataset.q || '';
        searchInput.value = searchQuery;
        if (searchClear) searchClear.style.display = 'block';
        document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
        renderProducts();
      });
    });

    document.getElementById('price-filter-select')?.addEventListener('change', (e) => {
      priceBracket = e.target.value;
      renderProducts();
    });

    document.getElementById('chk-only-sale')?.addEventListener('change', (e) => {
      saleOnly = e.target.checked;
      renderProducts();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });

    document.getElementById('btn-filter-wishlist').addEventListener('click', (e) => {
      wishlistOnly = !wishlistOnly;
      e.currentTarget.classList.toggle('active-filter', wishlistOnly);
      renderCategories();
      renderProducts();
    });

    document.getElementById('btn-open-cart').addEventListener('click', openCartDrawer);
    document.getElementById('btn-close-cart').addEventListener('click', closeCartDrawer);
    document.getElementById('cart-drawer-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'cart-drawer-backdrop') closeCartDrawer();
    });

    document.getElementById('product-modal').addEventListener('click', (e) => {
      if (e.target.id === 'product-modal') e.currentTarget.classList.remove('open');
    });

    // Apply coupon
    document.getElementById('btn-apply-coupon').addEventListener('click', async () => {
      const code = document.getElementById('cart-coupon-input').value.trim();
      const fb = document.getElementById('coupon-feedback');
      if (!code) return;
      const subtotal = cart.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
      const res = await fetch('/api/shop/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      fb.style.display = 'block';
      if (data.success) {
        appliedCoupon = { code: data.coupon.code, discount: data.discount };
        fb.style.color = '#15803d';
        fb.textContent = data.message;
      } else {
        appliedCoupon = null;
        fb.style.color = '#be123c';
        fb.textContent = data.message;
      }
      updateBadgesAndCart();
    });

    document.getElementById('btn-proceed-checkout').addEventListener('click', openCheckoutModal);
    document.getElementById('btn-close-checkout').addEventListener('click', () => {
      document.getElementById('checkout-modal').classList.remove('open');
    });

    // Payment method selection
    document.querySelectorAll('.pay-option-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.pay-option-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPayment = card.getAttribute('data-pay');
        document.getElementById('checkout-qr-preview-box').style.display =
          selectedPayment === 'qr' ? 'block' : 'none';
      });
    });

    // Submit Order
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-order');
      btn.disabled = true;

      const payload = {
        customerName: document.getElementById('chk-name').value.trim(),
        customerPhone: document.getElementById('chk-phone').value.trim(),
        province: document.getElementById('chk-province').value.trim(),
        district: document.getElementById('chk-district').value.trim(),
        address: document.getElementById('chk-address').value.trim(),
        note: document.getElementById('chk-note').value.trim(),
        scentChoice: selectedScent,
        giftWrap: document.getElementById('chk-gift-wrap').checked,
        giftCardMessage: document.getElementById('chk-gift-msg').value.trim(),
        paymentMethod: selectedPayment,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        items: cart
      };

      try {
        const res = await fetch('/api/shop/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
          showToast(data.message || 'Đặt hàng thất bại');
          btn.disabled = false;
          return;
        }
        cart = [];
        appliedCoupon = null;
        saveCart();
        renderOrderSuccessAndQR(data.order, data.paymentInfo);
      } catch {
        showToast('Lỗi kết nối khi đặt hàng, vui lòng thử lại!');
      } finally {
        btn.disabled = false;
      }
    });

    // Order Tracking Modal
    ['btn-open-track', 'footer-open-track', 'mob-open-track'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', () => {
        renderSavedOrderChips();
        document.getElementById('track-modal').classList.add('open');
        if (savedOrders.length > 0 && !document.getElementById('track-query-input').value) {
          executeOrderLookup(savedOrders[0].orderCode);
        }
      });
    });
    document.getElementById('btn-close-track').addEventListener('click', () => {
      document.getElementById('track-modal').classList.remove('open');
    });
    document.getElementById('btn-do-track').addEventListener('click', () => executeOrderLookup());
  }

  initAtmosphereAndMotion();
  startFlashTimer();
  bindEvents();
  loadStorefront();
})();
