// NA 2HAND Boutique — 2026 Cute Feminine Storefront Engine

(function () {
  let settings = {};
  let categories = [];
  let products = [];
  let coupons = [];
  let reviews = [];

  let activeCategory = 'all';
  let wishlistOnly = false;
  let searchQuery = '';
  let sortBy = 'featured';
  let selectedPayment = 'qr';
  let appliedCoupon = null; // { code, discount }

  let cart = JSON.parse(localStorage.getItem('na2hand_cart') || '[]');
  let wishlist = JSON.parse(localStorage.getItem('na2hand_wishlist') || '[]');

  const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;

  // --- 1. BLINK-BLINK STARLIGHT & TAP HEART BURST EFFECTS ---
  function initSparkles() {
    const container = document.getElementById('ambient-sparkles');
    if (!container) return;
    const symbols = ['✦', '✧', '✨', '⋆', '♡'];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('span');
      s.className = 'blink-star';
      s.textContent = symbols[i % symbols.length];
      s.style.left = `${Math.random() * 98}%`;
      s.style.top = `${Math.random() * 96}%`;
      s.style.fontSize = `${11 + Math.random() * 13}px`;
      s.style.animationDuration = `${1.8 + Math.random() * 2.8}s`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(s);
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .cute-pill-btn, .cat-pill');
      if (!btn) return;
      spawnBurst(e.clientX, e.clientY);
    });
  }

  function spawnBurst(x, y) {
    const icons = ['✨', '💖', '🌸', '✦', '🎀'];
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('span');
      el.className = 'tap-sparkle-particle';
      el.textContent = icons[i % icons.length];
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      const angle = (Math.PI * 2 * i) / 7;
      const dist = 28 + Math.random() * 36;
      el.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
      el.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist - 18)}px`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 860);
    }
  }

  // --- 2. FLASH SALE COUNTDOWN TIMER ---
  function startFlashTimer() {
    let remaining = 4 * 3600 + 45 * 60 + 59;
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
      categories = data.categories || [];
      products = data.products || [];
      coupons = data.coupons || [];
      reviews = data.reviews || [];

      applyStoreSettings();
      renderVouchers();
      renderCategories();
      renderProducts();
      updateBadgesAndCart();
      startLiveProofToast();
    } catch (err) {
      console.error('Failed to load storefront:', err);
    }
  }

  function applyStoreSettings() {
    if (settings.shopName) {
      document.title = `${settings.shopName} ✨ ${settings.tagline || ''}`;
      document.getElementById('header-shop-name').textContent = settings.shopName;
    }
    if (settings.tagline) document.getElementById('header-tagline').textContent = settings.tagline;
    if (settings.announcement) {
      document.getElementById('marquee-track').innerHTML =
        `${escapeHtml(settings.announcement)} &nbsp;&nbsp;✦&nbsp;&nbsp; ${escapeHtml(settings.announcement)} &nbsp;&nbsp;✦&nbsp;&nbsp;`;
    }
    if (settings.heroTitle) document.getElementById('hero-title').textContent = settings.heroTitle;
    if (settings.heroSubtitle) document.getElementById('hero-subtitle').textContent = settings.heroSubtitle;
    if (settings.heroBannerImage) document.getElementById('hero-photo').src = settings.heroBannerImage;

    // Payment method toggles
    document.getElementById('pay-card-qr').style.display = settings.qrEnabled === false ? 'none' : 'flex';
    document.getElementById('pay-card-cod').style.display = settings.codEnabled === false ? 'none' : 'flex';

    const qrImg = document.getElementById('checkout-qr-preview-img');
    if (qrImg) qrImg.src = settings.qrImageUrl || '/images/cute-qr-placeholder.svg';
    const bankTxt = document.getElementById('checkout-qr-bank-text');
    if (bankTxt && settings.bankName) {
      bankTxt.textContent = `${settings.bankName} • STK: ${settings.bankAccountNo || ''} (${settings.bankAccountName || ''})`;
    }
  }

  function renderVouchers() {
    const el = document.getElementById('voucher-strip');
    if (!el) return;
    el.innerHTML = coupons
      .slice(0, 3)
      .map(
        (c) => `
      <div class="voucher-ticket">
        <div>
          <div class="voucher-code">🎟️ ${escapeHtml(c.code)}</div>
          <div class="voucher-desc">${escapeHtml(c.description || '')}</div>
        </div>
        <button type="button" class="cute-pill-btn primary btn-save-voucher" data-code="${escapeAttr(c.code)}" style="padding: 7px 13px; font-size: 0.76rem;">
          Lưu mã
        </button>
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
        setTimeout(() => { btn.textContent = 'Lưu mã'; }, 2000);
      });
    });
  }

  function renderCategories() {
    const wrap = document.getElementById('category-pills');
    const allCats = [{ id: 'all', name: 'Tất cả đồ xinh', icon: '✨' }, ...categories];
    wrap.innerHTML = allCats
      .map(
        (c) => `
      <button type="button" class="cat-pill ${activeCategory === c.id && !wishlistOnly ? 'active' : ''}" data-cat="${escapeAttr(c.id)}">
        ${escapeHtml(c.icon || '🌸')} ${escapeHtml(c.name)}
      </button>
    `
      )
      .join('');

    wrap.querySelectorAll('.cat-pill').forEach((b) => {
      b.addEventListener('click', () => {
        wishlistOnly = false;
        activeCategory = b.getAttribute('data-cat');
        renderCategories();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    const grid = document.getElementById('products-grid');
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

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: #fff; border-radius: 24px; border: 1.5px dashed var(--pink-200);">
          <div style="font-size: 2.4rem; margin-bottom: 8px;">🌸</div>
          <p style="font-weight: 800;">Chưa tìm thấy món đồ phù hợp nàng ơi!</p>
          <p style="font-size: 0.82rem; color: var(--ink-muted); margin-top: 4px;">Thử chọn danh mục khác hoặc xóa từ khóa tìm kiếm nhé ♡</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list
      .map((p) => {
        const img = (p.images && p.images[0]) || '/uploads/girlfriend-1.jpg';
        const disc =
          p.originalPrice && p.originalPrice > p.price
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;
        const isLiked = wishlist.includes(p.id);
        const platLabel =
          p.sourcePlatform === 'shopee'
            ? '🧡 Shopee'
            : p.sourcePlatform === 'tiktok'
            ? '🎵 TikTok Shop'
            : '🎀 Boutique';

        return `
        <article class="product-card" data-id="${escapeAttr(p.id)}">
          <div class="prod-img-wrap open-detail">
            <img src="${escapeAttr(img)}" alt="${escapeAttr(p.name)}" loading="lazy" />
            <div class="prod-badges-top">
              ${disc > 0 ? `<span class="badge-discount blink-shimmer">-${disc}%</span>` : ''}
              ${p.isFlashSale ? `<span class="badge-discount" style="background:linear-gradient(135deg,#f59e0b,#ec4899);">⚡ DEAL XINH</span>` : ''}
              <span class="badge-platform">${platLabel}</span>
            </div>
            <button type="button" class="wishlist-heart-btn ${isLiked ? 'liked' : ''}" data-like="${escapeAttr(p.id)}" title="Yêu thích">
              ${isLiked ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="prod-body">
            <h3 class="prod-title open-detail">${escapeHtml(p.name)}</h3>
            <div class="prod-meta-row">
              <span>⭐ ${Number(p.rating || 5).toFixed(1)} (${p.reviewCount || 1})</span>
              <span>Đã bán ${Number(p.sold || 0)}</span>
            </div>
            <div class="prod-price-row">
              <span class="prod-price">${vnd(p.price)}</span>
              ${p.originalPrice > p.price ? `<span class="prod-orig-price">${vnd(p.originalPrice)}</span>` : ''}
            </div>
            <button type="button" class="prod-buy-btn blink-shimmer open-detail">
              🛍️ Chọn Size / Mua Ngay
            </button>
          </div>
        </article>
      `;
      })
      .join('');

    grid.querySelectorAll('.product-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      card.querySelectorAll('.open-detail').forEach((el) => {
        el.addEventListener('click', () => openProductModal(id));
      });
      const heartBtn = card.querySelector('.wishlist-heart-btn');
      heartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(id);
      });
    });
  }

  function toggleWishlist(id) {
    if (wishlist.includes(id)) {
      wishlist = wishlist.filter((x) => x !== id);
    } else {
      wishlist.push(id);
    }
    localStorage.setItem('na2hand_wishlist', JSON.stringify(wishlist));
    updateBadgesAndCart();
    renderProducts();
  }

  // --- 4. PRODUCT DETAIL & REVIEW MODAL ---
  function openProductModal(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');
    const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : ['/uploads/girlfriend-1.jpg'];
    const sizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['Freesize'];
    const colors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Mặc định'];
    const prodReviews = reviews.filter((r) => r.productId === p.id);

    let chosenSize = sizes[0];
    let chosenColor = colors[0];
    let qty = 1;

    content.innerHTML = `
      <button type="button" class="modal-close-btn" id="close-prod-modal">✕</button>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 22px;">
        <div>
          <img id="detail-main-img" src="${escapeAttr(imgs[0])}" alt="${escapeAttr(p.name)}" style="width:100%; aspect-ratio:3/3.6; object-fit:cover; object-position:center 20%; border-radius:20px; border:1.5px solid var(--pink-200);" />
          <div style="display:flex; gap:8px; margin-top:10px; overflow-x:auto;">
            ${imgs
              .map(
                (u, i) => `
              <img src="${escapeAttr(u)}" class="detail-thumb" data-src="${escapeAttr(u)}" style="width:58px; height:64px; object-fit:cover; border-radius:12px; cursor:pointer; border:2px solid ${i === 0 ? 'var(--pink-500)' : 'var(--pink-200)'};" />
            `
              )
              .join('')}
          </div>
        </div>

        <div>
          <div style="font-size:0.75rem; font-weight:800; color:var(--pink-500); margin-bottom:4px;">✦ NA 2HAND BOUTIQUE • HÀNG TUYỂN CHỌN</div>
          <h2 style="font-size:1.25rem; font-weight:800; line-height:1.35; margin-bottom:8px;">${escapeHtml(p.name)}</h2>
          <div style="font-size:0.8rem; color:var(--ink-muted); margin-bottom:12px;">
            ⭐ ${Number(p.rating || 5).toFixed(1)} (${p.reviewCount || 1} đánh giá) • Đã bán ${p.sold || 0} • Kho còn: <strong>${p.stock ?? 10}</strong>
          </div>

          <div style="background:var(--pink-50); padding:12px 16px; border-radius:16px; margin-bottom:14px; display:flex; align-items:baseline; gap:10px;">
            <span style="font-size:1.45rem; font-weight:800; color:var(--pink-600);">${vnd(p.price)}</span>
            ${p.originalPrice > p.price ? `<span style="text-decoration:line-through; color:#b38d9d; font-size:0.88rem;">${vnd(p.originalPrice)}</span>` : ''}
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:0.8rem; font-weight:800; margin-bottom:6px;">🎨 Chọn Màu Sắc:</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;" id="detail-colors">
              ${colors.map((c, i) => `<button type="button" class="variant-pill ${i === 0 ? 'selected' : ''}" data-val="${escapeAttr(c)}">${escapeHtml(c)}</button>`).join('')}
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <div style="font-size:0.8rem; font-weight:800; margin-bottom:6px;">📏 Chọn Kích Cỡ (Size):</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;" id="detail-sizes">
              ${sizes.map((s, i) => `<button type="button" class="variant-pill ${i === 0 ? 'selected' : ''}" data-val="${escapeAttr(s)}">${escapeHtml(s)}</button>`).join('')}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
            <span style="font-size:0.8rem; font-weight:800;">Số lượng:</span>
            <div style="display:inline-flex; align-items:center; border:1.5px solid var(--pink-200); border-radius:12px; overflow:hidden;">
              <button type="button" id="qty-minus" style="padding:6px 12px; border:none; background:var(--pink-50); font-weight:800; cursor:pointer;">-</button>
              <span id="qty-val" style="padding:0 14px; font-weight:800;">1</span>
              <button type="button" id="qty-plus" style="padding:6px 12px; border:none; background:var(--pink-50); font-weight:800; cursor:pointer;">+</button>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:14px;">
            <button type="button" id="btn-detail-add" class="cute-pill-btn" style="justify-content:center; padding:12px; border-color:var(--pink-400); color:var(--pink-600);">
              🛍️ Thêm Vào Giỏ
            </button>
            <button type="button" id="btn-detail-buy-now" class="prod-buy-btn blink-shimmer" style="padding:12px;">
              💖 Mua Ngay
            </button>
          </div>

          ${
            p.sourceUrl
              ? `<a href="${escapeAttr(p.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="display:block; text-align:center; font-size:0.76rem; color:var(--ink-muted); text-decoration:underline; margin-bottom:12px;">
                  ↗ Xem sản phẩm này trên ${p.sourcePlatform === 'tiktok' ? 'TikTok Shop' : 'Shopee'} của Shop
                </a>`
              : ''
          }

          <div style="font-size:0.83rem; line-height:1.55; color:#5e3347; background:#fff9fb; padding:12px; border-radius:14px; border:1px solid var(--border-cute);">
            <strong>✨ Mô tả chi tiết:</strong><br/>
            ${escapeHtml(p.description || '')}
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div style="margin-top:22px; padding-top:16px; border-top:1.5px dashed var(--pink-200);">
        <h3 style="font-size:0.95rem; font-weight:800; margin-bottom:10px;">💬 Đánh giá từ các nàng thơ (${prodReviews.length})</h3>
        <div style="space-y:8px; margin-bottom:14px;">
          ${
            prodReviews.length > 0
              ? prodReviews
                  .slice(0, 5)
                  .map(
                    (r) => `
                <div style="background:var(--pink-50); padding:10px 14px; border-radius:14px; margin-bottom:8px; font-size:0.8rem;">
                  <div style="font-weight:800; color:var(--pink-600);">${escapeHtml(r.authorName)} • ${'⭐'.repeat(Number(r.rating || 5))}</div>
                  <div style="margin-top:3px;">${escapeHtml(r.comment)}</div>
                </div>
              `
                  )
                  .join('')
              : `<p style="font-size:0.78rem; color:var(--ink-muted);">Chưa có đánh giá nào. Hãy là nàng thơ đầu tiên feedback cho mẫu này nhé!</p>`
          }
        </div>

        <form id="review-form" style="display:flex; gap:8px; flex-wrap:wrap;">
          <input type="text" id="rev-name" placeholder="Tên của nàng..." required style="padding:8px 12px; border-radius:12px; border:1px solid var(--pink-200); font-size:0.8rem; width:150px;" />
          <input type="text" id="rev-comment" placeholder="Viết cảm nhận về món đồ xinh..." required style="flex:1; min-width:180px; padding:8px 12px; border-radius:12px; border:1px solid var(--pink-200); font-size:0.8rem;" />
          <button type="submit" class="cute-pill-btn primary" style="padding:8px 14px;">Gửi 5⭐</button>
        </form>
      </div>
    `;

    modal.classList.add('open');

    content.querySelector('#close-prod-modal').onclick = () => modal.classList.remove('open');
    content.querySelectorAll('.detail-thumb').forEach((th) => {
      th.onclick = () => {
        content.querySelector('#detail-main-img').src = th.getAttribute('data-src');
      };
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
        content.querySelectorAll('#detail-sizes .variant-pill').forEach((x) => x.classList.remove('selected'));
        b.classList.add('selected');
        chosenSize = b.getAttribute('data-val');
      };
    });

    content.querySelector('#qty-minus').onclick = () => {
      qty = Math.max(1, qty - 1);
      content.querySelector('#qty-val').textContent = qty;
    };
    content.querySelector('#qty-plus').onclick = () => {
      qty = Math.min(20, qty + 1);
      content.querySelector('#qty-val').textContent = qty;
    };

    content.querySelector('#btn-detail-add').onclick = () => {
      addToCart(p, chosenSize, chosenColor, qty);
      modal.classList.remove('open');
      openCartDrawer();
    };

    content.querySelector('#btn-detail-buy-now').onclick = () => {
      addToCart(p, chosenSize, chosenColor, qty);
      modal.classList.remove('open');
      openCheckoutModal();
    };

    content.querySelector('#review-form').onsubmit = async (e) => {
      e.preventDefault();
      const authorName = content.querySelector('#rev-name').value;
      const comment = content.querySelector('#rev-comment').value;
      const res = await fetch('/api/shop/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: p.id, authorName, rating: 5, comment })
      });
      const data = await res.json();
      if (data.success && data.review) {
        reviews.unshift(data.review);
        openProductModal(p.id);
      }
    };
  }

  // --- 5. SHOPPING BAG & CHECKOUT (DIRECT QR + COD) ---
  function addToCart(prod, size, color, qty) {
    const key = `${prod.id}__${size}__${color}`;
    const existing = cart.find((x) => x.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key,
        productId: prod.id,
        name: prod.name,
        image: (prod.images && prod.images[0]) || '/uploads/girlfriend-1.jpg',
        price: Number(prod.price),
        size,
        color,
        qty
      });
    }
    saveCart();
  }

  function saveCart() {
    localStorage.setItem('na2hand_cart', JSON.stringify(cart));
    updateBadgesAndCart();
  }

  function getCartTotals() {
    const subtotal = cart.reduce((s, item) => s + item.price * item.qty, 0);
    const freeThreshold = Number(settings.freeShipThreshold || 299000);
    const baseShip = Number(settings.shippingFee || 25000);
    const shipping = subtotal === 0 || subtotal >= freeThreshold ? 0 : baseShip;
    const discount = appliedCoupon ? Math.min(appliedCoupon.discount, subtotal) : 0;
    const total = Math.max(0, subtotal - discount + shipping);
    return { subtotal, freeThreshold, shipping, discount, total };
  }

  function updateBadgesAndCart() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-count').textContent = totalQty;
    document.getElementById('wishlist-count').textContent = wishlist.length;

    const listEl = document.getElementById('cart-items-list');
    const { subtotal, freeThreshold, shipping, discount, total } = getCartTotals();

    // Freeship progress
    const pct = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100;
    document.getElementById('freeship-fill').style.width = `${pct}%`;
    document.getElementById('freeship-msg').textContent =
      subtotal >= freeThreshold && subtotal > 0
        ? '🎉 Tuyệt vời! Đơn của nàng đã được MIỄN PHÍ VẬN CHUYỂN!'
        : `✨ Mua thêm ${vnd(Math.max(0, freeThreshold - subtotal))} nữa để được Freeship nhé nàng!`;

    if (cart.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:40px 10px; color:var(--ink-muted);">
          <div style="font-size:2.4rem; margin-bottom:8px;">🛍️</div>
          <p style="font-weight:700;">Túi đồ của nàng đang trống</p>
          <p style="font-size:0.78rem; margin-top:4px;">Hãy dạo một vòng chọn váy xinh nha ♡</p>
        </div>
      `;
    } else {
      listEl.innerHTML = cart
        .map(
          (item, i) => `
        <div style="display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--pink-100); align-items:center;">
          <img src="${escapeAttr(item.image)}" style="width:58px; height:66px; border-radius:12px; object-fit:cover;" />
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.82rem; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.name)}</div>
            <div style="font-size:0.72rem; color:var(--ink-muted);">${escapeHtml(item.color)} • Size ${escapeHtml(item.size)}</div>
            <div style="font-size:0.84rem; font-weight:800; color:var(--pink-600); margin-top:2px;">${vnd(item.price)} x ${item.qty}</div>
          </div>
          <button type="button" class="cart-del-btn" data-idx="${i}" style="border:none; background:#ffe4ef; color:var(--pink-600); width:28px; height:28px; border-radius:8px; cursor:pointer; font-weight:800;">✕</button>
        </div>
      `
        )
        .join('');

      listEl.querySelectorAll('.cart-del-btn').forEach((b) => {
        b.onclick = () => {
          cart.splice(Number(b.getAttribute('data-idx')), 1);
          saveCart();
        };
      });
    }

    document.getElementById('cart-subtotal').textContent = vnd(subtotal);
    document.getElementById('cart-discount').textContent = `-${vnd(discount)}`;
    document.getElementById('cart-shipping').textContent = shipping === 0 && subtotal > 0 ? 'Miễn phí ✨' : vnd(shipping);
    document.getElementById('cart-total').textContent = vnd(total);
    document.getElementById('chk-btn-total').textContent = vnd(total);
  }

  function openCartDrawer() {
    document.getElementById('cart-drawer-backdrop').classList.add('open');
  }

  function openCheckoutModal() {
    if (cart.length === 0) return alert('Nàng hãy chọn ít nhất 1 món đồ xinh vào giỏ trước nhé!');
    document.getElementById('cart-drawer-backdrop').classList.remove('open');
    document.getElementById('checkout-form-step').style.display = 'block';
    document.getElementById('checkout-success-step').style.display = 'none';
    updateBadgesAndCart();
    document.getElementById('checkout-modal').classList.add('open');
  }

  // Coupon validation
  document.getElementById('btn-apply-coupon').addEventListener('click', async () => {
    const code = document.getElementById('cart-coupon-input').value.trim();
    const fb = document.getElementById('coupon-feedback');
    if (!code) return;
    const { subtotal } = getCartTotals();

    const res = await fetch('/api/shop/coupon/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    const data = await res.json();
    fb.style.display = 'block';
    if (res.ok && data.success) {
      appliedCoupon = { code: data.coupon.code, discount: data.discount };
      fb.style.color = '#16a34a';
      fb.textContent = data.message;
    } else {
      appliedCoupon = null;
      fb.style.color = '#e11d48';
      fb.textContent = data.message;
    }
    updateBadgesAndCart();
  });

  // Payment option toggle
  document.querySelectorAll('.pay-option-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.pay-option-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedPayment = card.getAttribute('data-pay');
      document.getElementById('checkout-qr-preview-box').style.display = selectedPayment === 'qr' ? 'block' : 'none';
    });
  });

  // Submit Order
  document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-order');
    btn.disabled = true;
    btn.textContent = '⏳ Đang tạo đơn xinh cho nàng...';

    try {
      const payload = {
        customerName: document.getElementById('chk-name').value,
        customerPhone: document.getElementById('chk-phone').value,
        province: document.getElementById('chk-province').value,
        district: document.getElementById('chk-district').value,
        address: document.getElementById('chk-address').value,
        note: document.getElementById('chk-note').value,
        paymentMethod: selectedPayment,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        items: cart
      };

      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Lỗi tạo đơn hàng');
        return;
      }

      // Clear cart
      cart = [];
      appliedCoupon = null;
      saveCart();

      renderOrderSuccessScreen(data.order, data.paymentInfo);
    } catch (err) {
      alert('Không thể kết nối máy chủ, vui lòng thử lại!');
    } finally {
      btn.disabled = false;
      updateBadgesAndCart();
    }
  });

  function renderOrderSuccessScreen(order, pay) {
    document.getElementById('checkout-form-step').style.display = 'none';
    const step2 = document.getElementById('checkout-success-step');
    step2.style.display = 'block';

    if (order.paymentMethod === 'qr') {
      step2.innerHTML = `
        <div style="font-size:2.4rem; margin-bottom:4px;">🎀✨</div>
        <h2 style="font-family:var(--font-display); font-size:1.75rem; color:var(--pink-600);">Quét Mã QR Để Thanh Toán</h2>
        <p style="font-size:0.82rem; color:var(--ink-muted); margin:4px 0 14px;">
          Mã đơn của nàng: <strong style="color:var(--ink-dark); font-size:0.95rem;">${escapeHtml(order.orderCode)}</strong>
        </p>

        <div style="background:var(--pink-50); border:2px solid var(--pink-200); border-radius:22px; padding:16px; margin-bottom:14px;">
          <img src="${escapeAttr(pay.qrDisplayUrl)}" alt="QR Payment" style="width:230px; height:230px; object-fit:contain; background:#fff; padding:8px; border-radius:18px; border:1.5px solid var(--pink-200);" />
          <div style="margin-top:10px; font-size:0.84rem; line-height:1.6;">
            <div>Ngân hàng: <strong>${escapeHtml(pay.bankName || 'Quét trực tiếp ảnh QR')}</strong></div>
            <div>Số tài khoản: <strong>${escapeHtml(pay.bankAccountNo || '')}</strong> (${escapeHtml(pay.bankAccountName || '')})</div>
            <div>Số tiền: <strong style="color:var(--pink-600); font-size:1.05rem;">${vnd(order.totalAmount)}</strong></div>
            <div>Nội dung CK: <strong style="background:#fff; padding:2px 8px; border-radius:8px; border:1px dashed var(--pink-400);">${escapeHtml(pay.transferNote)}</strong></div>
          </div>
          <div style="margin-top:10px; display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
            <a href="${escapeAttr(pay.qrDisplayUrl)}" download="QR_${escapeAttr(order.orderCode)}.png" class="cute-pill-btn" style="font-size:0.76rem;">📥 Lưu ảnh QR</a>
            <button type="button" id="btn-copy-ck" class="cute-pill-btn" style="font-size:0.76rem;">📋 Sao chép nội dung CK</button>
          </div>
        </div>

        <button type="button" id="btn-confirm-qr-paid" class="prod-buy-btn blink-shimmer" style="padding:13px; font-size:0.92rem; border-radius:16px;">
          💖 Mình Đã Quét QR Chuyển Khoản Xong!
        </button>
      `;

      step2.querySelector('#btn-copy-ck').onclick = function () {
        navigator.clipboard?.writeText(pay.transferNote);
        this.textContent = 'Đã sao chép ✓';
      };

      step2.querySelector('#btn-confirm-qr-paid').onclick = async function () {
        this.disabled = true;
        const r = await fetch(`/api/shop/orders/${encodeURIComponent(order.orderCode)}/confirm-qr`, { method: 'POST' });
        const d = await r.json();
        step2.innerHTML = `
          <div style="font-size:2.8rem; margin-bottom:8px;">🌸💖✨</div>
          <h2 style="font-family:var(--font-display); font-size:1.85rem; color:var(--pink-600);">Cảm Ơn Nàng Thơ Nhiều Lắm!</h2>
          <p style="font-size:0.86rem; line-height:1.55; margin:8px 0 18px;">
            ${escapeHtml(d.message || 'Shop đã nhận được thông báo thanh toán QR của nàng!')}<br/>
            Mã tra cứu đơn: <strong>${escapeHtml(order.orderCode)}</strong>
          </p>
          <button type="button" class="cute-pill-btn primary" onclick="document.getElementById('checkout-modal').classList.remove('open')">
            ✨ Tiếp tục dạo shop
          </button>
        `;
      };
    } else {
      step2.innerHTML = `
        <div style="font-size:2.8rem; margin-bottom:8px;">🎁🌸✨</div>
        <h2 style="font-family:var(--font-display); font-size:1.85rem; color:var(--pink-600);">Đặt Hàng Ship COD Thành Công!</h2>
        <p style="font-size:0.86rem; line-height:1.55; margin:8px 0 16px;">
          Mã đơn hàng của nàng là: <strong style="color:var(--pink-600); font-size:1.05rem;">${escapeHtml(order.orderCode)}</strong><br/>
          Tổng thanh toán khi nhận hàng: <strong>${vnd(order.totalAmount)}</strong>.<br/>
          Tiệm sẽ sớm gọi xác nhận và gói hàng thơm phức gửi tới nàng nhé ♡
        </p>
        <button type="button" class="cute-pill-btn primary" onclick="document.getElementById('checkout-modal').classList.remove('open')">
          ✨ Tiếp tục dạo shop
        </button>
      `;
    }
  }

  // --- 6. ORDER TRACKING LOOKUP ---
  document.getElementById('btn-open-track').onclick = () => {
    document.getElementById('track-modal').classList.add('open');
  };
  document.getElementById('btn-close-track').onclick = () => {
    document.getElementById('track-modal').classList.remove('open');
  };
  document.getElementById('btn-do-track').onclick = async () => {
    const q = document.getElementById('track-query-input').value.trim();
    const box = document.getElementById('track-results-box');
    const res = await fetch(`/api/shop/orders/track?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok || !data.orders || data.orders.length === 0) {
      box.innerHTML = `<p style="text-align:center; font-size:0.82rem; color:var(--ink-muted); padding:14px;">Chưa tìm thấy đơn hàng nào khớp với "${escapeHtml(q)}".</p>`;
      return;
    }

    const statusLabel = {
      pending: '⏳ Chờ shop xác nhận',
      confirmed: '💖 Đã xác nhận đơn',
      packing: '🎀 Đang gói hàng thơm phức',
      shipping: '🚚 Đang giao tới nàng',
      completed: '🌸 Giao thành công',
      cancelled: '❌ Đã hủy'
    };

    box.innerHTML = data.orders
      .map(
        (o) => `
      <div style="border:1.5px solid var(--pink-200); border-radius:16px; padding:12px 14px; margin-bottom:10px; background:var(--pink-50); font-size:0.82rem;">
        <div style="display:flex; justify-content:space-between; font-weight:800; margin-bottom:4px;">
          <span>Mã đơn: ${escapeHtml(o.orderCode)}</span>
          <span style="color:var(--pink-600);">${statusLabel[o.orderStatus] || o.orderStatus}</span>
        </div>
        <div>Người nhận: ${escapeHtml(o.customerName)} • Tổng: <strong>${vnd(o.totalAmount)}</strong> (${o.paymentMethod === 'qr' ? 'Quét QR' : 'Ship COD'})</div>
        <div style="font-size:0.75rem; color:var(--ink-muted); margin-top:4px;">
          ${(o.items || []).map((i) => `${escapeHtml(i.name)} x${i.qty}`).join(', ')}
        </div>
      </div>
    `
      )
      .join('');
  };

  // --- 7. UI BINDINGS & SOCIAL PROOF TOAST ---
  document.getElementById('btn-open-cart').onclick = openCartDrawer;
  document.getElementById('btn-close-cart').onclick = () => document.getElementById('cart-drawer-backdrop').classList.remove('open');
  document.getElementById('btn-proceed-checkout').onclick = openCheckoutModal;
  document.getElementById('btn-close-checkout').onclick = () => document.getElementById('checkout-modal').classList.remove('open');

  document.getElementById('btn-filter-wishlist').onclick = () => {
    wishlistOnly = !wishlistOnly;
    renderCategories();
    renderProducts();
  };

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderProducts();
  });

  function startLiveProofToast() {
    if (settings.liveProofEnabled === false || products.length === 0) return;
    const names = ['Nàng Bảo Ngọc (Hà Nội)', 'Nàng Minh Anh (TP.HCM)', 'Nàng Thu Hà (Đà Nẵng)', 'Nàng Quỳnh Hương (Hải Phòng)'];
    const toast = document.getElementById('live-proof-toast');
    let idx = 0;

    setInterval(() => {
      const prod = products[idx % products.length];
      const buyer = names[idx % names.length];
      idx++;
      if (!prod) return;
      document.getElementById('proof-img').src = (prod.images && prod.images[0]) || '/uploads/girlfriend-1.jpg';
      document.getElementById('proof-title').textContent = `🎀 ${buyer} vừa đặt`;
      document.getElementById('proof-prod').textContent = `${prod.name.slice(0, 32)}... • Vừa xong`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4500);
    }, 18000);
  }

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

  initSparkles();
  startFlashTimer();
  loadStorefront();
})();
