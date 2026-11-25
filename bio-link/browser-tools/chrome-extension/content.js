// Content Script chạy trực tiếp trên trình duyệt thật của người dùng khi mở Shopee hoặc TikTok Shop
(function () {
  if (document.getElementById('na2hand-grabber-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'na2hand-grabber-bar';
  bar.style.cssText = [
    'position:fixed',
    'left:18px',
    'bottom:22px',
    'z-index:2147483646',
    'display:flex',
    'flex-direction:column',
    'gap:7px',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
  ].join(';');

  const btnSingle = document.createElement('button');
  btnSingle.type = 'button';
  btnSingle.innerHTML = '🌸 Đẩy Sản Phẩm Về Shop NA 2HAND ✨';
  btnSingle.style.cssText = [
    'padding:11px 16px',
    'border-radius:999px',
    'border:2px solid #fff',
    'background:linear-gradient(135deg,#ff6ea7,#d63874)',
    'color:#fff',
    'font-weight:800',
    'font-size:13px',
    'cursor:pointer',
    'box-shadow:0 10px 26px rgba(214,56,116,0.42)',
    'transition:transform .18s ease'
  ].join(';');

  const statusToast = document.createElement('div');
  statusToast.style.cssText = [
    'display:none',
    'padding:9px 13px',
    'border-radius:14px',
    'background:#381625',
    'color:#fff',
    'font-size:12px',
    'font-weight:700',
    'max-width:310px',
    'box-shadow:0 8px 22px rgba(0,0,0,0.25)'
  ].join(';');

  bar.appendChild(statusToast);
  bar.appendChild(btnSingle);
  document.body.appendChild(bar);

  function notify(text, isError) {
    statusToast.style.display = 'block';
    statusToast.style.background = isError ? '#be123c' : '#381625';
    statusToast.textContent = text;
    setTimeout(() => {
      statusToast.style.display = 'none';
    }, 5000);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function autoScrollAndCollect() {
    const url = location.href;
    const platform = url.includes('tiktok') ? 'tiktok' : 'shopee';

    // Tự động rê chuột qua các thumbnail nhỏ để trình duyệt tải ảnh độ phân giải cao
    const thumbs = Array.from(document.querySelectorAll('img')).filter((im) => {
      const r = im.getBoundingClientRect();
      return r.width >= 45 && r.width <= 110 && r.height >= 45 && r.height <= 110 && r.top > 0 && r.top < 700;
    });
    for (const th of thumbs.slice(0, 6)) {
      th.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      th.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await sleep(160);
    }

    // Cuộn nhẹ để kích hoạt lazy-load nếu đang ở trang danh sách cả Shop
    window.scrollBy({ top: 500, behavior: 'smooth' });
    await sleep(450);
    window.scrollBy({ top: -500, behavior: 'smooth' });
    await sleep(250);

    const products = [];
    let ldProduct = null;
    document.querySelectorAll('script[type="application/ld+json"]').forEach((sc) => {
      try {
        const parsed = JSON.parse(sc.textContent || '{}');
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          if (item && item['@type'] === 'Product' && item.name) ldProduct = item;
        }
      } catch {}
    });

    const isSingle =
      /-i\.\d+\.\d+/.test(url) ||
      /\/product\/\d+/.test(url) ||
      /\/view\/product\//.test(url) ||
      Boolean(ldProduct);

    if (isSingle) {
      let name =
        ldProduct?.name ||
        document.querySelector('h1')?.innerText?.trim() ||
        document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.title;

      name = String(name || '')
        .replace(/\s*\|\s*Shopee.*$/i, '')
        .replace(/\s*-\s*TikTok.*$/i, '')
        .trim();

      let price = 0;
      let originalPrice = 0;
      if (ldProduct?.offers) {
        const offer = Array.isArray(ldProduct.offers) ? ldProduct.offers[0] : ldProduct.offers;
        price = offer?.price || offer?.lowPrice || 0;
        originalPrice = offer?.highPrice || 0;
      }

      const priceCandidates = [];
      document.querySelectorAll('div, span').forEach((el) => {
        if (el.children.length > 0) return;
        const t = (el.innerText || '').trim();
        if (/^[₫đ]?\s*\d{2,3}([.,]\d{3})+\s*[₫đ]?$/.test(t)) {
          const digits = parseInt(t.replace(/[^\d]/g, ''), 10);
          if (digits >= 15000 && digits <= 20000000) {
            const st = window.getComputedStyle(el);
            if (st.textDecorationLine.includes('line-through')) {
              if (!originalPrice) originalPrice = digits;
            } else {
              priceCandidates.push(digits);
            }
          }
        }
      });
      if (!price && priceCandidates.length > 0) price = priceCandidates[0];

      const images = [];
      if (ldProduct?.image) {
        (Array.isArray(ldProduct.image) ? ldProduct.image : [ldProduct.image]).forEach((u) => {
          if (typeof u === 'string' && u.startsWith('http') && !images.includes(u)) images.push(u);
        });
      }
      document.querySelectorAll('img').forEach((img) => {
        const src = (img.currentSrc || img.src || '').replace(/_tn$/, '');
        if (
          src.startsWith('http') &&
          (img.naturalWidth >= 260 || img.width >= 250) &&
          !src.includes('avatar') &&
          !src.includes('icon') &&
          !images.includes(src)
        ) {
          images.push(src);
        }
      });

      const sizes = [];
      const colors = [];
      document.querySelectorAll('button, [role="radio"]').forEach((b) => {
        const txt = (b.innerText || '').trim();
        if (!txt || txt.length > 24 || b.children.length > 2) return;
        if (/^(XS|S|M|L|XL|XXL|Freesize|Free\s*size|\d{2}kg)$/i.test(txt)) {
          if (!sizes.includes(txt)) sizes.push(txt);
        } else if (/^(Trắng|Đen|Hồng|Kem|Be|Đỏ|Xanh|Nâu|Xám|Vàng|Tím)/i.test(txt)) {
          if (!colors.includes(txt)) colors.push(txt);
        }
      });

      const description =
        ldProduct?.description ||
        document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        '';

      if (name) {
        products.push({
          name,
          price: price || 199000,
          originalPrice: originalPrice || 0,
          images: images.slice(0, 8),
          sizes: sizes.length ? sizes : ['S', 'M', 'L'],
          colors: colors.length ? colors : ['Theo hình'],
          description: String(description).slice(0, 900),
          sourcePlatform: platform,
          sourceUrl: url,
          isFlashSale: true
        });
      }
    }

    // Nếu đang ở trang danh sách Shop, quét toàn bộ sản phẩm đang hiển thị
    if (products.length === 0) {
      const seen = new Set();
      document.querySelectorAll('a[href]').forEach((a) => {
        if (products.length >= 20) return;
        const href = a.href || '';
        if (!/-i\.\d+\.\d+|\/product\/\d+|\/view\/product\//.test(href) || seen.has(href)) return;
        const imgEl = a.querySelector('img');
        const imgSrc = imgEl ? (imgEl.currentSrc || imgEl.src || '').replace(/_tn$/, '') : '';
        const rawText = (a.innerText || '').trim();
        const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
        const titleLine = lines.find((l) => l.length >= 10 && !/^[₫đ\d.,%\s-]+$/.test(l));
        const priceMatch =
          rawText.match(/(\d{2,3}(?:[.,]\d{3})+)\s*[₫đ]?/) ||
          rawText.match(/[₫đ]\s*(\d{2,3}(?:[.,]\d{3})+)/);

        if (titleLine) {
          seen.add(href);
          products.push({
            name: titleLine.slice(0, 140),
            price: priceMatch ? priceMatch[1] : 189000,
            images: imgSrc && imgSrc.startsWith('http') ? [imgSrc] : [],
            sizes: ['S', 'M', 'L'],
            colors: ['Theo hình'],
            sourcePlatform: platform,
            sourceUrl: href,
            isFlashSale: true
          });
        }
      });
    }

    return products;
  }

  btnSingle.addEventListener('click', async () => {
    const origText = btnSingle.innerHTML;
    btnSingle.innerHTML = '⏳ Đang quét ảnh HD & giá chuẩn...';
    btnSingle.disabled = true;

    try {
      const products = await autoScrollAndCollect();
      if (!products.length) {
        notify('Chưa thấy dữ liệu sản phẩm trên trang này. Hãy mở chi tiết 1 sản phẩm hoặc cuộn xuống danh sách sản phẩm của Shop nhé!', true);
        return;
      }

      chrome.runtime.sendMessage(
        { type: 'NA2HAND_IMPORT_PRODUCTS', products },
        (res) => {
          if (chrome.runtime.lastError) {
            notify('Lỗi Extension: ' + chrome.runtime.lastError.message, true);
            return;
          }
          if (res && res.success) {
            notify(res.message || `🎉 Đã đẩy ${products.length} sản phẩm về Shop thành công!`, false);
          } else {
            notify((res && res.message) || 'Không thể đẩy sản phẩm về Shop.', true);
          }
        }
      );
    } finally {
      btnSingle.innerHTML = origText;
      btnSingle.disabled = false;
    }
  });
})();
