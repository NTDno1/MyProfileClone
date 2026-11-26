/* ==========================================================================
   NA 2HAND — TRÌNH ĐỒNG BỘ 1-1 CHUẨN SÀN SHOPEE & TIKTOK SHOP (V3 AUTO-RETRY)
   - Gom đủ 100% sản phẩm trên trang Shop (mọi nấc cuộn danh sách ảo & phân trang)
   - Chờ xác nhận xóa trắng DOM qua about:blank 100% trước khi mở từng sản phẩm
   - Kiểm định nghiêm ngặt từng SP: Bắt buộc có Ảnh thật CDN + Giá thật + Đủ phân hệ
   - CƠ CHẾ TỰ ĐỘNG QUÉT LẠI (AUTO-RETRY 4 LƯỢT): SP nào mạng chậm / thiếu ảnh / thiếu
     phân hệ sẽ tự động đưa vào hàng đợi quét lại cho đến khi đủ 100%, không lưu dữ liệu lỗi!
   ========================================================================== */
window.NA2HAND_DEEP_HARVESTER = function (serverUrl, syncKey) {
  (async function () {
    const HARVESTER_VERSION = 4;
    const MAX_ATTEMPTS_PER_ITEM = 4;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    if (!/shopee\.|tiktok\./i.test(location.hostname)) {
      alert('Hãy mở trang Gian hàng Shopee (VD: shopee.vn/na2hand3) hoặc trang sản phẩm rồi chạy nút này nhé!');
      return;
    }

    const oldHud = document.getElementById('na2hand-deep-hud');
    if (oldHud) oldHud.remove();

    let stopped = false;
    const hud = document.createElement('div');
    hud.id = 'na2hand-deep-hud';
    hud.style.cssText =
      'position:fixed;right:18px;bottom:18px;width:390px;z-index:2147483647;background:#fff;border:2px solid #e14b85;border-radius:20px;padding:16px;box-shadow:0 20px 50px rgba(120,25,65,0.34);font-family:sans-serif;color:#3d1a29;font-size:13px;line-height:1.5;';
    hud.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<strong style="color:#d63874;font-size:14px;">🎀 NA 2HAND — Đồng Bộ 1-1 (V3 Tự Quét Lại)</strong>' +
      '<button id="na2h-stop" style="border:1px solid #f3b8d2;background:#fff0f6;color:#be123c;border-radius:8px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;">Dừng ✕</button>' +
      '</div>' +
      '<div id="na2h-status" style="margin-bottom:8px;font-weight:700;color:#54283b;">Đang khởi tạo trình đồng bộ 1-1 (V3)...</div>' +
      '<div style="height:8px;background:#fce7f3;border-radius:99px;overflow:hidden;margin-bottom:6px;">' +
      '<div id="na2h-bar" style="height:100%;width:4%;background:linear-gradient(90deg,#f4669d,#d63874);transition:width 0.3s;"></div>' +
      '</div>' +
      '<div id="na2h-sub" style="font-size:11.5px;color:#8c6274;">Tự động kiểm tra ảnh gốc, phân hệ, giá &amp; tự quét lại nếu lỗi</div>';
    document.body.appendChild(hud);

    const statusEl = hud.querySelector('#na2h-status');
    const barEl = hud.querySelector('#na2h-bar');
    const subEl = hud.querySelector('#na2h-sub');
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

    const isRealPlatformImg = (u) =>
      /^https?:\/\/[^"'\s]*(?:susercontent\.com\/file\/|tiktokcdn|ibyteimg)/i.test(String(u || ''));

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

    const normWords = (str) =>
      String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const slugTitleFromUrl = (u) => {
      const m = String(u || '').match(/shopee\.vn\/([^/?#]+)-i\.\d+\.\d+/i);
      if (!m) return '';
      try {
        return decodeURIComponent(m[1]).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (e) {
        return m[1].replace(/-/g, ' ').trim();
      }
    };

    /* Strict token-aware slug match (>= 95% words + 100% exact size/style tokens) so Size S vs M or Đứng vs Rộng NEVER mix! */
    const CRITICAL_TOKENS = [
      'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', '4xl', 'freesize',
      'dung', 'rong', 'loe', 'hoodie', 'sweater', 'jeans', 'jean', 'ung', 'stickers', 'sticker', '2hand', 'secondhand'
    ];
    const titleMatchesSlugStrict = (candTitle, slugTitle) => {
      if (!slugTitle) return Boolean(candTitle && candTitle.length >= 4);
      const cw = normWords(candTitle).split(' ').filter(Boolean);
      const sw = normWords(slugTitle).split(' ').filter(Boolean);
      if (sw.length === 0) return true;
      if (cw.length === 0) return false;
      for (let t = 0; t < CRITICAL_TOKENS.length; t++) {
        const tok = CRITICAL_TOKENS[t];
        const inSlug = sw.indexOf(tok) > -1;
        const inCand = cw.indexOf(tok) > -1;
        if (inSlug !== inCand) return false;
      }
      let hit = 0;
      for (let i = 0; i < sw.length; i++) {
        if (cw.indexOf(sw[i]) > -1) hit++;
      }
      return hit / sw.length >= 0.95;
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

    const getSpecCutoffDocY = (doc) => {
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const els = doc.querySelectorAll('section, h2, h3, div');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el.children.length > 2) continue;
        const tx = (el.textContent || '').trim();
        if (
          /^(Product Specifications|Chi tiết sản phẩm|Product Ratings|Đánh giá sản phẩm|From The Same Shop|Sản phẩm khác của Shop)$/i.test(
            tx
          )
        ) {
          const dy = el.getBoundingClientRect().top + sy;
          if (dy > 260) return dy;
        }
      }
      return 2500;
    };

    const readPriceInfo = (doc) => {
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      let bestNums = [];
      let bestSize = 0;
      let origPrice = 0;
      const nodes = doc.querySelectorAll('div, span');
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (el.children.length > 4) continue;
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > 48) continue;
        if (!/[₫đ]/i.test(t)) continue;
        const r = el.getBoundingClientRect();
        const docY = r.top + sy;
        if (docY < 75 || docY > specY || r.width === 0 || r.height === 0) continue;
        const cs = win.getComputedStyle(el);
        const pcs = el.parentElement ? win.getComputedStyle(el.parentElement) : null;
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
        if (fs < 19) continue;
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

    const hasStockRendered = (doc) => {
      const txt = doc.body ? doc.body.innerText : '';
      return /\d+\s*(?:pieces?\s*available|sản phẩm có sẵn|sp có sẵn)|out of stock|hết hàng/i.test(txt);
    };

    const readMainImg = (doc) => {
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      let bestSrc = '';
      let bestArea = 0;
      const imgs = doc.querySelectorAll('img');
      for (let i = 0; i < imgs.length; i++) {
        const im = imgs[i];
        const src = im.currentSrc || im.src || im.getAttribute('src') || '';
        if (!isRealPlatformImg(src)) continue;
        if (/avatar|icon|logo|badge|emoji|sprite/i.test(src)) continue;
        const r = im.getBoundingClientRect();
        const docY = r.top + sy;
        if (docY > specY) continue;
        const w = Math.max(r.width || 0, im.naturalWidth || 0);
        const h = Math.max(r.height || 0, im.naturalHeight || 0);
        if (w < 150 || h < 150) continue;
        const area = Math.max(w * h, (r.width || 180) * (r.height || 180));
        if (area > bestArea) {
          bestArea = area;
          bestSrc = cleanImg(src);
        }
      }
      /* Fallback: check background-image style on Shopee gallery divs if img not yet decoded */
      if (!bestSrc) {
        const bgDivs = doc.querySelectorAll('div[style*="susercontent.com/file/"]');
        for (let j = 0; j < bgDivs.length; j++) {
          const st = bgDivs[j].getAttribute('style') || '';
          const m = st.match(/url\(["']?(https?:\/\/[^"')]+susercontent\.com\/file\/[^"')]+)["']?\)/i);
          if (m && m[1]) {
            bestSrc = cleanImg(m[1]);
            break;
          }
        }
      }
      return bestSrc;
    };

    /* Read ACTUAL rendered DOM title ONLY (NEVER substitute URL slug fallback, so stale DOMs are caught and retried!) */
    const readCleanDocTitle = (doc) => {
      const h1 = doc.querySelector('h1');
      const og = doc.querySelector('meta[property="og:title"]');
      const cands = [
        h1 ? h1.textContent : '',
        og ? og.getAttribute('content') : '',
        doc.title || ''
      ];
      for (let i = 0; i < cands.length; i++) {
        const cleaned = String(cands[i] || '')
          .replace(/^Mua\s+/i, '')
          .replace(/\s*\|\s*Shopee.*$/i, '')
          .replace(/\s*-\s*TikTok.*$/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleaned.length >= 4 && !/^shopee\b/i.test(cleaned)) {
          return cleaned;
        }
      }
      return '';
    };

    /* STRICT React Fiber item matcher: requires cid === expectedItemId so stale Fiber props NEVER leak! */
    const findShopeeReactItem = (doc, expectedKey) => {
      const expectedItemId = expectedKey && expectedKey.indexOf('.') > -1 ? expectedKey.split('.')[1] : '';
      const seen = new WeakSet();
      const scanObj = (obj, depth) => {
        if (!obj || typeof obj !== 'object' || depth > 6) return null;
        if (seen.has(obj)) return null;
        seen.add(obj);
        if (Array.isArray(obj.models) && obj.models.length > 0 && Array.isArray(obj.tier_variations)) {
          const cid = String(
            obj.itemid ||
              obj.item_id ||
              (obj.models[0] && (obj.models[0].itemid || obj.models[0].item_id)) ||
              ''
          );
          if (!expectedItemId || (cid && cid === expectedItemId)) {
            return obj;
          }
        }
        const keys = Object.keys(obj);
        for (let i = 0; i < Math.min(keys.length, 40); i++) {
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

      const probes = doc.querySelectorAll('button, [aria-label], section, main, #main');
      for (let p = 0; p < Math.min(probes.length, 65); p++) {
        const el = probes[p];
        const fk = Object.keys(el).find(
          (k) => k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0
        );
        if (!fk) continue;
        let cur = el[fk];
        let steps = 0;
        while (cur && steps < 50) {
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

    /* Only treat button <img> as a variation thumbnail if hosted on real product CDN (not UI icons like shield/truck)! */
    const getBtnRealThumb = (b) => {
      const im = b ? b.querySelector('img') : null;
      if (!im) return '';
      const src = im.currentSrc || im.src || im.getAttribute('src') || '';
      return isRealPlatformImg(src) ? cleanImg(src) : '';
    };

    const NON_VARIATION_BTN_RE =
      /^(add to cart|buy now|thêm vào giỏ.*|mua ngay|chat now|chat ngay|view shop|xem shop|follow|theo dõi|report|tố cáo|share|chia sẻ|favorite.*|yêu thích.*|size chart.*|bảng quy đổi.*|decrease|increase|giảm|tăng|\+|-|×|✕|.*change of mind.*|.*đổi trả.*|.*an tâm mua sắm.*|.*free ship.*|.*miễn phí vận chuyển.*|.*vận chuyển.*|.*shipping.*|.*spaylater.*|.*trả góp.*|.*voucher.*|.*mã giảm giá.*)$/i;

    /* Detect whether the Shopee PDP visibly displays variation rows in DOM */
    const pageShowsVariationUI = (doc) => {
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      const btns = doc.querySelectorAll('button');
      const parentCounts = new Map();
      for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        const dy = b.getBoundingClientRect().top + sy;
        if (dy < 80 || dy > specY) continue;
        const it = (b.innerText || '').replace(/\s+/g, ' ').trim();
        if (!it || it.length > 44 || NON_VARIATION_BTN_RE.test(it)) continue;
        if (getBtnRealThumb(b)) return true;
        const al = (b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        if (al && al === it && b.parentElement) {
          parentCounts.set(b.parentElement, (parentCounts.get(b.parentElement) || 0) + 1);
          if (parentCounts.get(b.parentElement) >= 2) return true;
        }
      }
      return false;
    };

    const extractProductDeep = async (doc, expectedUrl, expectedKey) => {
      const win = doc.defaultView || window;
      try {
        win.focus();
        win.scrollTo(0, 0);
      } catch (e) {}
      await sleep(180);

      const liveHref = doc.location && doc.location.href ? doc.location.href : expectedUrl;
      const finalUrl = cleanUrl(liveHref || expectedUrl);
      const finalKey = extractItemKey(finalUrl) || expectedKey;
      const plat = finalUrl.indexOf('tiktok') > -1 ? 'tiktok' : 'shopee';
      const platformItemId = toPlatformItemId(plat, finalKey);

      let title = readCleanDocTitle(doc, finalUrl);
      const domPrice = readPriceInfo(doc);
      let basePrice = domPrice.min || 0;
      let maxPrice = domPrice.max || basePrice;
      let origPrice = domPrice.orig || 0;
      let baseMainImg = readMainImg(doc);

      let variantGroupName = 'Mẫu';
      const variants = [];
      let sizes = [];
      let usedReactModels = false;

      const reactItem = plat === 'shopee' ? findShopeeReactItem(doc, finalKey) : null;
      if (reactItem) {
        if (reactItem.name && String(reactItem.name).trim().length >= 4) {
          title = String(reactItem.name).trim();
        }
        const rMin = normApiPrice(reactItem.price_min || reactItem.price);
        const rMax = normApiPrice(reactItem.price_max || reactItem.price);
        const rOrig = normApiPrice(reactItem.price_before_discount);
        if (rMin > 0) basePrice = rMin;
        if (rMax > 0) maxPrice = Math.max(basePrice, rMax);
        if (rOrig > maxPrice) origPrice = rOrig;
        if (!baseMainImg && reactItem.image) {
          baseMainImg = String(reactItem.image).indexOf('http') === 0
            ? cleanImg(reactItem.image)
            : 'https://down-vn.img.susercontent.com/file/' + reactItem.image;
        }

        if (Array.isArray(reactItem.tier_variations) && reactItem.tier_variations.length > 0) {
          const tv0 = reactItem.tier_variations[0];
          const tv1 = reactItem.tier_variations[1];
          const opts0 = Array.isArray(tv0.options) ? tv0.options.filter(Boolean) : [];
          const imgs0 = Array.isArray(tv0.images) ? tv0.images : [];
          if (opts0.length > 0) {
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
                const optStock =
                  matching.length > 0
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
          }
          usedReactModels = true;
        }
      }

      /* DOM Variation Clicker when React Fiber didn't expose tier_variations */
      if (!usedReactModels) {
        const sy = win.scrollY || 0;
        const specY = getSpecCutoffDocY(doc);
        const groupMap = new Map();
        const allBtns = doc.querySelectorAll('button');
        for (let i = 0; i < allBtns.length; i++) {
          const b = allBtns[i];
          const r = b.getBoundingClientRect();
          const docY = r.top + sy;
          if (docY < 80 || docY > specY) continue;
          const lbl = (b.innerText || '').replace(/\s+/g, ' ').trim();
          if (!lbl || lbl.length > 44) continue;
          if (NON_VARIATION_BTN_RE.test(lbl)) {
            continue;
          }
          const ariaLbl = (b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
          if (ariaLbl && NON_VARIATION_BTN_RE.test(ariaLbl)) continue;
          const p = b.parentElement;
          if (!p) continue;
          if (!groupMap.has(p)) groupMap.set(p, []);
          groupMap.get(p).push(b);
        }

        const tiers = [];
        groupMap.forEach((btns, parentEl) => {
          if (btns.length === 0) return;
          const hasImg = btns.some((b) => Boolean(getBtnRealThumb(b)));
          const hasMatchingAria = btns.some((b) => {
            const al = (b.getAttribute('aria-label') || '').trim();
            const it = (b.innerText || '').trim();
            return al && it && al === it;
          });
          const hasVarAttr = btns.some((b) => /variation|sApkZm|sku|option/i.test(b.className || ''));
          if (!hasImg && !hasMatchingAria && !hasVarAttr && btns.length < 2) return;
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
          try { primary.btns[0].scrollIntoView({ block: 'center' }); } catch (e) {}
          await sleep(160);

          const isBtnDisabled = (b) => {
            const cs = win.getComputedStyle(b);
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

          tiers.forEach((t, idx) => {
            if (idx === primaryIdx) return;
            t.btns.forEach((b) => {
              const s = (b.innerText || '').replace(/\s+/g, ' ').trim();
              if (s && s.length <= 20 && sizes.indexOf(s) === -1) sizes.push(s);
            });
            if (!t.btns.some(isBtnSelected)) {
              const firstActive = t.btns.find((b) => !isBtnDisabled(b));
              if (firstActive) {
                try { firstActive.click(); } catch (e) {}
              }
            }
          });
          if (tiers.length > 1) await sleep(240);

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
              const btnImg = getBtnRealThumb(btn);

              if (isBtnDisabled(btn)) {
                variants.push({
                  id: 'var_' + (k + 1),
                  label,
                  image: btnImg || baseMainImg,
                  price: basePrice || 110000,
                  stock: 0
                });
              } else {
                if (!isBtnSelected(btn) && primary.btns.length <= 50) {
                  try { btn.click(); } catch (e) {}
                  await sleep(270);
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

      try { win.scrollTo(0, 0); } catch (e) {}
      await sleep(140);

      const gallery = [];
      const addG = (u) => {
        const cu = cleanImg(u);
        if (cu && isRealPlatformImg(cu) && gallery.indexOf(cu) === -1) gallery.push(cu);
      };
      if (reactItem && Array.isArray(reactItem.images)) {
        reactItem.images.forEach((h) => {
          addG(String(h).indexOf('http') === 0 ? h : 'https://down-vn.img.susercontent.com/file/' + h);
        });
      }
      if (baseMainImg) addG(baseMainImg);
      const specLimit = getSpecCutoffDocY(doc) + 220;
      const allImgs = doc.querySelectorAll('img');
      for (let i = 0; i < allImgs.length && gallery.length < 25; i++) {
        const im = allImgs[i];
        const src = im.currentSrc || im.src || im.getAttribute('src') || '';
        if (!isRealPlatformImg(src)) continue;
        if (/avatar|icon|logo|badge|emoji|sprite/i.test(src)) continue;
        const r = im.getBoundingClientRect();
        const docY = r.top + (win.scrollY || 0);
        const w = Math.max(r.width || 0, im.naturalWidth || 0);
        if (w >= 36 && docY < specLimit) addG(src);
      }
      variants.forEach((v) => {
        if (v.image) addG(v.image);
      });

      try { win.scrollTo(0, 750); } catch (e) {}
      await sleep(220);

      let desc = reactItem && reactItem.description ? String(reactItem.description).trim() : '';
      const fullTxt = doc.body ? doc.body.innerText : '';
      if (!desc) {
        const dm = fullTxt.match(
          /(?:Product Description|Mô tả sản phẩm)\s*\n([\s\S]{12,1800}?)(?:Product Ratings|Đánh giá sản phẩm|From The Same Shop|Sản phẩm khác của Shop|You May Also Like|Có thể bạn cũng thích|CUSTOMER SERVICE|CHĂM SÓC KHÁCH HÀNG|$)/i
        );
        if (dm) desc = dm[1].trim();
      }
      desc = String(desc || '')
        .replace(/(?:CUSTOMER SERVICE|CHĂM SÓC KHÁCH HÀNG)[\s\S]*$/i, '')
        .trim();

      const soldM = fullTxt.match(/(\d+)\s*Sold|Đã bán\s*(\d+)/i);
      const sold =
        reactItem && (reactItem.historical_sold !== undefined || reactItem.sold !== undefined)
          ? Number(reactItem.historical_sold || reactItem.sold || 0)
          : soldM
          ? parseInt(soldM[1] || soldM[2] || '0', 10)
          : 0;

      const stockTotal =
        variants.length > 0
          ? variants.reduce((s, v) => s + Math.max(0, Number(v.stock || 0)), 0)
          : reactItem && (reactItem.stock !== undefined || reactItem.normal_stock !== undefined)
          ? Number(reactItem.stock ?? reactItem.normal_stock ?? 1)
          : readStock(doc);

      const expectedHasVars = reactItem
        ? (Array.isArray(reactItem.models) && reactItem.models.length > 1) ||
          (Array.isArray(reactItem.tier_variations) &&
            reactItem.tier_variations.some(
              (tv) => Array.isArray(tv && tv.options) && tv.options.filter(Boolean).length > 1
            ))
        : pageShowsVariationUI(doc) || maxPrice > basePrice;

      return {
        harvesterVersion: HARVESTER_VERSION,
        deepSynced: true,
        productTag: plat,
        platformItemId,
        name: title,
        price: basePrice,
        maxPrice: Math.max(basePrice, maxPrice),
        originalPrice: origPrice > Math.max(basePrice, maxPrice) ? origPrice : Math.max(basePrice, maxPrice),
        images: gallery,
        sizes,
        variantGroupName,
        variants,
        stock: stockTotal,
        sold,
        description: desc,
        sourcePlatform: plat,
        sourceUrl: finalUrl,
        _expectedHasVars: expectedHasVars
      };
    };

    /* Completeness & 1-to-1 URL Identity check: returns null if 100% verified, or error reason to trigger automatic retry! */
    const checkScanDefect = (prod) => {
      if (!prod || !prod.name || prod.name.length < 4) return 'Chưa đọc được tên SP';
      const urlSlugTitle = slugTitleFromUrl(prod.sourceUrl || '');
      if (urlSlugTitle && !titleMatchesSlugStrict(prod.name, urlSlugTitle)) {
        return 'Tên SP trên trang chưa khớp với đường dẫn Shopee';
      }
      const realImgs = (prod.images || []).filter(isRealPlatformImg);
      if (realImgs.length === 0) return 'Chưa tải xong ảnh gốc Shopee';
      if (!prod.price || prod.price < 1000) return 'Chưa tải xong giá bán';
      if (prod._expectedHasVars && (!prod.variants || prod.variants.length === 0) && (!prod.sizes || prod.sizes.length === 0)) {
        return 'Trang có phân hệ nhưng chưa đọc đủ nút phân hệ';
      }
      if (Array.isArray(prod.variants) && prod.variants.length > 0) {
        const nw = normWords(prod.name);
        const firstLbl = String(prod.variants[0].label || '').trim();
        if (/\bjeans?\b/.test(nw) && /^h(?:xs|s|m|l|xl|xxl)\d+$/i.test(firstLbl)) {
          return 'Phân hệ Hoodie bị lẫn vào trang Jeans';
        }
        if (/\bhoodie\b/.test(nw) && /^(?:l|d|r)(?:xs|s|m|l|xl)\d+$/i.test(firstLbl)) {
          return 'Phân hệ Jeans bị lẫn vào trang Hoodie';
        }
      }
      return null;
    };

    const endpoint = serverUrl + '/api/shop/import?syncKey=' + encodeURIComponent(syncKey);

    const pushToServer = async (prod) => {
      const payloadProd = Object.assign({}, prod);
      delete payloadProd._expectedHasVars;
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ harvesterVersion: HARVESTER_VERSION, product: payloadProd })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    };

    /* Single Product Page Mode (with automatic retry up to 4 attempts) */
    const isSingleProductPage = /-i\.\d+\.\d+|\/product\/\d+\/\d+|\/view\/product\//i.test(location.href);
    if (isSingleProductPage) {
      let finalProd = null;
      for (let att = 1; att <= MAX_ATTEMPTS_PER_ITEM && !stopped; att++) {
        statusEl.textContent =
          att === 1
            ? 'Đang quét đầy đủ ảnh, phân hệ & giá từng mẫu...'
            : '🔄 Tự động quét lại lần ' + att + '/' + MAX_ATTEMPTS_PER_ITEM + ' để lấy đủ ảnh & phân hệ...';
        barEl.style.width = Math.min(85, att * 25) + '%';
        if (att > 1) await sleep(1200);
        const cand = await extractProductDeep(document, location.href, extractItemKey(location.href));
        const defect = checkScanDefect(cand);
        if (!defect) {
          finalProd = cand;
          break;
        }
        subEl.textContent = '⚠️ ' + defect + ' — đang tự thử lại...';
      }
      if (!finalProd) {
        statusEl.innerHTML = '<span style="color:#be123c;">Trang Shopee chưa tải xong ảnh/giá. Hãy cuộn nhẹ trang rồi bấm lại nhé!</span>';
        return;
      }
      await pushToServer(finalProd);
      barEl.style.width = '100%';
      statusEl.innerHTML =
        '🎉 <span style="color:#15803d;">Đã đồng bộ chuẩn 1-1 SP kèm <strong>' +
        finalProd.variants.length +
        ' phân hệ</strong> &amp; <strong>' +
        finalProd.images.length +
        ' ảnh gốc</strong>!</span>';
      return;
    }

    /* Full Shop Listing Mode: Collect 100% of Shop Products across virtual scroll & pagination */
    const readExpectedShopCount = () => {
      const topTxt = (document.body ? document.body.innerText : '').slice(0, 2800);
      const m =
        topTxt.match(/(?:Products|Sản phẩm)\s*[:\n]?\s*(\d{1,4})\b/i) ||
        topTxt.match(/\b(\d{1,4})\s*(?:Products|Sản phẩm)\b/i);
      return m ? parseInt(m[1], 10) : 0;
    };

    const expectedTotal = readExpectedShopCount();
    const urlSet = [];
    const seenItemKeys = new Set();

    const collectVisibleLinks = () => {
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
    };

    const allProdTab = document.querySelector('a[href*="#product_list"]');
    if (allProdTab) {
      try { allProdTab.click(); } catch (e) {}
      await sleep(500);
    }

    let pageLoop = 0;
    while (!stopped && pageLoop < 8) {
      pageLoop++;
      collectVisibleLinks();
      const maxScroll = Math.max(4000, document.documentElement.scrollHeight + 900);
      for (let y = 0; y <= maxScroll && !stopped; y += 360) {
        window.scrollTo(0, y);
        await sleep(420);
        collectVisibleLinks();
        statusEl.textContent =
          '🔍 Đang gom danh sách SP trên sàn: ' +
          urlSet.length +
          (expectedTotal > 0 ? '/' + expectedTotal : '') +
          ' sản phẩm...';
        if (expectedTotal > 0 && urlSet.length >= expectedTotal) break;
      }
      collectVisibleLinks();
      if (expectedTotal > 0 && urlSet.length >= expectedTotal) break;

      const nextBtn = document.querySelector(
        '.shopee-page-controller .shopee-icon-button--right:not(.shopee-button-no-outline--disabled)'
      );
      if (nextBtn && !nextBtn.disabled) {
        const beforeLen = urlSet.length;
        try { nextBtn.click(); } catch (e) {}
        await sleep(1150);
        collectVisibleLinks();
        if (urlSet.length === beforeLen) break;
      } else {
        break;
      }
    }

    window.scrollTo(0, 0);

    if (urlSet.length === 0) {
      statusEl.innerHTML =
        '<span style="color:#be123c;">Không tìm thấy danh sách sản phẩm trên trang này. Hãy cuộn xuống mục Tất cả sản phẩm của Shop rồi bấm lại nhé!</span>';
      return;
    }

    const shopPlat = location.hostname.indexOf('tiktok') > -1 ? 'tiktok' : 'shopee';
    const discoveredPlatformIds = urlSet
      .map((u) => toPlatformItemId(shopPlat, extractItemKey(u)))
      .filter(Boolean);

    /* Open and scan a single itemUrl in workerWin with strict about:blank reset + real image/price hydration wait */
    const scanOneUrlInWorker = async (itemUrl, attemptNum) => {
      const expectedKey = extractItemKey(itemUrl);

      if (!workerWin || workerWin.closed) {
        workerWin = window.open('about:blank', 'na2hand_worker', 'width=1280,height=920,left=25,top=25');
        if (!workerWin) return { ok: false, reason: 'POPUP_BLOCKED' };
        await sleep(150);
      } else {
        /* Strictly wait until workerWin has completely unloaded onto about:blank! */
        try { workerWin.location.replace('about:blank'); } catch (e) {}
        for (let b = 0; b < 30; b++) {
          await sleep(80);
          try {
            if (
              workerWin.location.href === 'about:blank' &&
              workerWin.document &&
              workerWin.document.readyState === 'complete'
            ) {
              break;
            }
          } catch (e) {}
        }
      }

      try {
        workerWin.focus();
        workerWin.location.replace(itemUrl);
      } catch (e) {
        workerWin = window.open(itemUrl, 'na2hand_worker', 'width=1280,height=920,left=25,top=25');
        if (!workerWin) return { ok: false, reason: 'POPUP_BLOCKED' };
      }

      const maxPolls = 38 + attemptNum * 8;
      let targetDoc = null;
      for (let w = 0; w < maxPolls && !stopped; w++) {
        await sleep(400);
        try {
          const d = workerWin.document;
          const curHref = d && d.location && d.location.href ? d.location.href : '';
          if (!curHref || curHref === 'about:blank') continue;
          if (expectedKey && curHref.indexOf(expectedKey) === -1) continue;
          if (d.readyState !== 'complete') continue;

          /* Wait until exact React Fiber item OR (DOM title strictly matches URL slug + real image + price + stock)! */
          const reactReady = Boolean(findShopeeReactItem(d, expectedKey));
          const mainImgReady = Boolean(readMainImg(d));
          const priceReady = readPriceInfo(d).min > 0;
          const stockReady = hasStockRendered(d);
          const expectedSlugTitle = slugTitleFromUrl(itemUrl);
          const domTitleNow = readCleanDocTitle(d);
          const titleReady = !expectedSlugTitle || (domTitleNow && titleMatchesSlugStrict(domTitleNow, expectedSlugTitle));

          if ((reactReady && mainImgReady) || (titleReady && mainImgReady && priceReady && stockReady)) {
            targetDoc = d;
            break;
          }
          /* Scroll slightly halfway through polling to wake up lazy image loaders in background windows */
          if (w === 10 || w === 20) {
            try {
              workerWin.focus();
              workerWin.scrollTo(0, 180);
              await sleep(120);
              workerWin.scrollTo(0, 0);
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (!targetDoc) {
        return { ok: false, reason: 'Trang Shopee phản hồi chậm quá thời gian chờ' };
      }

      /* Extra hydration settle (longer on retries so slow variation buttons always mount) */
      await sleep(750 + (attemptNum - 1) * 550);

      let prod = await extractProductDeep(targetDoc, itemUrl, expectedKey);
      let defect = checkScanDefect(prod);

      /* Quick in-page second look before closing page if variations or images lagged by 1s */
      if (defect && !stopped) {
        try {
          workerWin.focus();
          workerWin.scrollTo(0, 260);
          await sleep(900);
          workerWin.scrollTo(0, 0);
          await sleep(400);
        } catch (e) {}
        prod = await extractProductDeep(targetDoc, itemUrl, expectedKey);
        defect = checkScanDefect(prod);
      }

      if (defect) {
        return { ok: false, reason: defect };
      }
      return { ok: true, prod };
    };

    /* MULTI-PASS AUTO-RETRY ENGINE:
       Pass 1 scans all items; Pass 2..4 automatically re-scan any failed/incomplete items! */
    let pendingQueue = urlSet.map((u, idx) => ({ url: u, origIdx: idx + 1 }));
    let completedCount = 0;
    let totalVars = 0;
    let popupBlocked = false;

    for (let pass = 1; pass <= MAX_ATTEMPTS_PER_ITEM && pendingQueue.length > 0 && !stopped; pass++) {
      if (pass > 1) {
        /* Refresh worker window cleanly before retry pass */
        if (workerWin && !workerWin.closed) {
          try { workerWin.close(); } catch (e) {}
        }
        workerWin = null;
        subEl.textContent =
          '🔄 Phát hiện ' +
          pendingQueue.length +
          ' SP tải thiếu dữ liệu — Đang tự động quét lại (Lượt ' +
          pass +
          '/' +
          MAX_ATTEMPTS_PER_ITEM +
          ')...';
        await sleep(900);
      }

      const nextRetryQueue = [];

      for (let q = 0; q < pendingQueue.length && !stopped; q++) {
        const entry = pendingQueue[q];
        statusEl.textContent =
          (pass === 1
            ? '⏳ Đang quét SP (' + entry.origIdx + '/' + urlSet.length + ')...'
            : '🔄 Tự quét lại SP #' +
              entry.origIdx +
              ' (Lượt ' +
              pass +
              '/' +
              MAX_ATTEMPTS_PER_ITEM +
              ')...');

        const scanRes = await scanOneUrlInWorker(entry.url, pass);
        if (scanRes.reason === 'POPUP_BLOCKED') {
          popupBlocked = true;
          statusEl.innerHTML =
            '<span style="color:#be123c;">Trình duyệt chặn cửa sổ phụ — hãy bấm biểu tượng Pop-up trên thanh địa chỉ Shopee chọn Cho phép (Allow) rồi chạy lại nhé!</span>';
          break;
        }

        if (scanRes.ok && scanRes.prod) {
          try {
            await pushToServer(scanRes.prod);
            completedCount++;
            totalVars += (scanRes.prod.variants || []).length;
            barEl.style.width = Math.round((completedCount / urlSet.length) * 100) + '%';
            statusEl.textContent =
              '✅ (' +
              completedCount +
              '/' +
              urlSet.length +
              ') ' +
              scanRes.prod.name.slice(0, 25) +
              '... (' +
              (scanRes.prod.variants || []).length +
              ' phân hệ, ' +
              (scanRes.prod.images || []).length +
              ' ảnh)';
          } catch (pushErr) {
            nextRetryQueue.push({ url: entry.url, origIdx: entry.origIdx, lastReason: 'Lỗi mạng khi lưu về Web' });
          }
        } else {
          subEl.textContent =
            '⚠️ SP #' + entry.origIdx + ': ' + (scanRes.reason || 'Chưa đủ dữ liệu') + ' -> Đã xếp hàng tự quét lại!';
          nextRetryQueue.push({ url: entry.url, origIdx: entry.origIdx, lastReason: scanRes.reason });
        }

        await sleep(320);
      }

      if (popupBlocked) break;
      pendingQueue = nextRetryQueue;
    }

    if (workerWin && !workerWin.closed) {
      try { workerWin.close(); } catch (e) {}
    }

    if (popupBlocked || stopped) return;

    /* Strict Two-Way 1-to-1 Reconciliation:
       Delete any Shopee-tagged item on Web that is NOT in discoveredPlatformIds! */
    let prunedNote = '';
    const fullCatalogConfirmed =
      discoveredPlatformIds.length > 0 &&
      completedCount === urlSet.length &&
      (!expectedTotal || discoveredPlatformIds.length >= expectedTotal);

    if (fullCatalogConfirmed) {
      try {
        const recRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
            harvesterVersion: HARVESTER_VERSION,
            reconcilePlatform: shopPlat,
            activePlatformItemIds: discoveredPlatformIds
          })
        });
        const recJson = await recRes.json();
        const rmCnt = Number(recJson && (recJson.prunedCount || recJson.removedCount || 0));
        if (rmCnt > 0) {
          prunedNote = ' • Đã xóa ' + rmCnt + ' SP không còn trên sàn!';
        }
      } catch (e) {}
    }

    if (pendingQueue.length === 0) {
      barEl.style.width = '100%';
      statusEl.innerHTML =
        '🎉 <span style="color:#15803d;">ĐỒNG BỘ 1-1 HOÀN TẤT 100%! Đã quét đủ <strong>' +
        completedCount +
        '/' +
        urlSet.length +
        ' SP</strong> (đủ ảnh gốc &amp; <strong>' +
        totalVars +
        ' phân hệ</strong>)!' +
        prunedNote +
        '</span>';
      subEl.textContent = 'Không có bất kỳ sản phẩm lỗi nào! Hàng tự đăng trên web được giữ nguyên 100%.';
    } else {
      statusEl.innerHTML =
        '⚠️ <span style="color:#b45309;">Đã lưu chuẩn <strong>' +
        completedCount +
        '/' +
        urlSet.length +
        ' SP</strong>. Còn ' +
        pendingQueue.length +
        ' SP Shopee phản hồi quá chậm sau ' +
        MAX_ATTEMPTS_PER_ITEM +
        ' lần tự thử lại — hãy bấm chạy thêm 1 lượt nữa để bù nốt nhé!</span>';
    }
  })();
};
