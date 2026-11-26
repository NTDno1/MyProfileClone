/* ==========================================================================
   NA 2HAND — TRÌNH ĐỒNG BỘ 1-1 CHUẨN SÀN SHOPEE & TIKTOK SHOP (LIVE RUNTIME)
   - Tự gom đủ 100% sản phẩm trên trang Shop (kể cả danh sách ảo & nhiều trang)
   - Dọn sạch DOM cũ qua about:blank + đối chiếu Slug tiêu đề chống lệch link 100%
   - Tự lấy đủ phân hệ con (Mẫu LS1..LS15), giá riêng từng phân hệ & ẩn Size nếu sàn không có Size
   - Đồng bộ 2 chiều chuẩn 1-1: Tự xóa SP tag Shopee trên web nếu đã gỡ trên sàn, giữ nguyên Hàng tự đăng!
   ========================================================================== */
window.NA2HAND_DEEP_HARVESTER = function (serverUrl, syncKey) {
  (async function () {
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
      'position:fixed;right:18px;bottom:18px;width:375px;z-index:2147483647;background:#fff;border:2px solid #e14b85;border-radius:20px;padding:16px;box-shadow:0 20px 50px rgba(120,25,65,0.32);font-family:sans-serif;color:#3d1a29;font-size:13px;line-height:1.5;';
    hud.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<strong style="color:#d63874;font-size:14px;">🎀 NA 2HAND — Đồng Bộ 1-1 Sàn &amp; Web</strong>' +
      '<button id="na2h-stop" style="border:1px solid #f3b8d2;background:#fff0f6;color:#be123c;border-radius:8px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;">Dừng ✕</button>' +
      '</div>' +
      '<div id="na2h-status" style="margin-bottom:8px;font-weight:600;color:#54283b;">Đang khởi tạo trình đồng bộ 1-1...</div>' +
      '<div style="height:8px;background:#fce7f3;border-radius:99px;overflow:hidden;margin-bottom:6px;">' +
      '<div id="na2h-bar" style="height:100%;width:4%;background:linear-gradient(90deg,#f4669d,#d63874);transition:width 0.3s;"></div>' +
      '</div>' +
      '<div id="na2h-sub" style="font-size:11px;color:#8c6274;">Chế độ 1-1: Giữ nguyên Hàng tự đăng, khớp chuẩn 100% Hàng Shopee</div>';
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

    const titleMatchesSlug = (candTitle, slugTitle) => {
      if (!slugTitle) return Boolean(candTitle && candTitle.length >= 4);
      const cw = normWords(candTitle).split(' ').filter((w) => w.length >= 2);
      const sw = normWords(slugTitle).split(' ').filter((w) => w.length >= 2);
      if (sw.length === 0) return true;
      if (cw.length === 0) return false;
      let hit = 0;
      for (let i = 0; i < sw.length; i++) {
        if (cw.indexOf(sw[i]) > -1) hit++;
      }
      return hit / sw.length >= 0.5;
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
        if (/^(Product Specifications|Chi tiết sản phẩm|Product Ratings|Đánh giá sản phẩm|From The Same Shop|Sản phẩm khác của Shop)$/i.test(tx)) {
          const dy = el.getBoundingClientRect().top + sy;
          if (dy > 260) return dy;
        }
      }
      return 2400;
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
        if (docY < 60 || docY > specY || r.width === 0 || r.height === 0) continue;
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
        if (fs < 17) continue;
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
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      let bestSrc = '';
      let bestArea = 0;
      const imgs = doc.querySelectorAll('img');
      for (let i = 0; i < imgs.length; i++) {
        const im = imgs[i];
        const src = im.currentSrc || im.src || '';
        if (!/susercontent\.com\/file\/|tiktokcdn|ibyteimg/i.test(src)) continue;
        if (/avatar|icon|logo|badge|emoji/i.test(src)) continue;
        const r = im.getBoundingClientRect();
        const docY = r.top + sy;
        if (docY > specY) continue;
        const w = Math.max(r.width || 0, im.naturalWidth || 0);
        const h = Math.max(r.height || 0, im.naturalHeight || 0);
        if (w < 160 || h < 160) continue;
        const area = (r.width || 200) * (r.height || 200);
        if (area > bestArea) {
          bestArea = area;
          bestSrc = cleanImg(src);
        }
      }
      return bestSrc;
    };

    const readCleanDocTitle = (doc, expectedUrl) => {
      const slugFallback = slugTitleFromUrl(expectedUrl);
      const og = doc.querySelector('meta[property="og:title"]');
      const cands = [
        og ? og.getAttribute('content') : '',
        doc.title || ''
      ];
      for (let i = 0; i < cands.length; i++) {
        const cleaned = String(cands[i] || '')
          .replace(/^Mua\s+/i, '')
          .replace(/\s*\|\s*Shopee.*$/i, '')
          .replace(/\s*-\s*TikTok.*$/i, '')
          .trim();
        if (cleaned.length >= 4 && titleMatchesSlug(cleaned, slugFallback)) {
          return cleaned;
        }
      }
      return slugFallback || String(doc.title || '').replace(/\s*\|\s*Shopee.*$/i, '').trim();
    };

    const findShopeeReactItem = (doc, expectedKey) => {
      const expectedItemId = expectedKey && expectedKey.indexOf('.') > -1 ? expectedKey.split('.')[1] : '';
      const seen = new WeakSet();
      const scanObj = (obj, depth) => {
        if (!obj || typeof obj !== 'object' || depth > 5) return null;
        if (seen.has(obj)) return null;
        seen.add(obj);
        if (Array.isArray(obj.models) && obj.models.length > 0 && Array.isArray(obj.tier_variations)) {
          const cid = String(obj.itemid || obj.item_id || (obj.models[0] && obj.models[0].itemid) || '');
          if (!expectedItemId || !cid || cid === expectedItemId) {
            return obj;
          }
        }
        const keys = Object.keys(obj);
        for (let i = 0; i < Math.min(keys.length, 35); i++) {
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

      const probes = doc.querySelectorAll('button, [aria-label], main, #main');
      for (let p = 0; p < Math.min(probes.length, 55); p++) {
        const el = probes[p];
        const fk = Object.keys(el).find(
          (k) => k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0
        );
        if (!fk) continue;
        let cur = el[fk];
        let steps = 0;
        while (cur && steps < 45) {
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
      const win = doc.defaultView || window;
      try { win.scrollTo(0, 0); } catch (e) {}
      await sleep(150);

      const liveHref = doc.location && doc.location.href ? doc.location.href : expectedUrl;
      const finalUrl = cleanUrl(liveHref || expectedUrl);
      const finalKey = extractItemKey(finalUrl) || expectedKey;
      const plat = finalUrl.indexOf('tiktok') > -1 ? 'tiktok' : 'shopee';
      const platformItemId = toPlatformItemId(plat, finalKey);

      let title = readCleanDocTitle(doc, finalUrl);
      const domPrice = readPriceInfo(doc);
      let basePrice = domPrice.min || 110000;
      let maxPrice = domPrice.max || basePrice;
      let origPrice = domPrice.orig || 0;
      const baseMainImg = readMainImg(doc);

      let variantGroupName = 'Mẫu';
      const variants = [];
      let sizes = [];
      let usedReactModels = false;

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
        usedReactModels = true;
      }

      /* DOM Clicker Fallback: immune to Windows 125%/150% display scaling! */
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
          if (
            /^(add to cart|buy now|thêm vào giỏ.*|mua ngay|chat now|chat ngay|view shop|xem shop|follow|theo dõi|report|tố cáo|share|chia sẻ|favorite.*|yêu thích.*|size chart.*|bảng quy đổi.*|decrease|increase|giảm|tăng|\+|-|×|✕)$/i.test(
              lbl
            )
          ) {
            continue;
          }
          const ariaLbl = (b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
          if (ariaLbl && /^(decrease|increase|giảm|tăng)$/i.test(ariaLbl)) continue;
          const p = b.parentElement;
          if (!p) continue;
          if (!groupMap.has(p)) groupMap.set(p, []);
          groupMap.get(p).push(b);
        }

        const tiers = [];
        groupMap.forEach((btns, parentEl) => {
          if (btns.length === 0) return;
          const hasImg = btns.some((b) => !!b.querySelector('img'));
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
          await sleep(120);

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
          if (tiers.length > 1) await sleep(220);

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
                if (!isBtnSelected(btn) && primary.btns.length <= 50) {
                  try { btn.click(); } catch (e) {}
                  await sleep(250);
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
      await sleep(120);

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
      const specLimit = getSpecCutoffDocY(doc) + 200;
      const allImgs = doc.querySelectorAll('img');
      for (let i = 0; i < allImgs.length && gallery.length < 25; i++) {
        const im = allImgs[i];
        const src = im.currentSrc || im.src || '';
        if (!/susercontent\.com\/file\/|tiktokcdn|ibyteimg/i.test(src)) continue;
        if (/avatar|icon|logo|badge|emoji|sprite/i.test(src)) continue;
        const r = im.getBoundingClientRect();
        const docY = r.top + (win.scrollY || 0);
        const w = Math.max(r.width || 0, im.naturalWidth || 0);
        if (w >= 38 && docY < specLimit) addG(src);
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

      return {
        deepSynced: true,
        productTag: plat,
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
        '🎉 <span style="color:#15803d;">Đã đồng bộ chuẩn 1-1 SP kèm <strong>' +
        prod.variants.length +
        ' phân hệ</strong> (' +
        (prod.sizes.length > 0 ? 'Size: ' + prod.sizes.join(', ') : 'Không phân size') +
        ')!</span>';
      return;
    }

    /* Read official shop product count if displayed on Shopee Shop header (e.g. Products: 15 / Sản phẩm: 15) */
    const readExpectedShopCount = () => {
      const topTxt = (document.body ? document.body.innerText : '').slice(0, 2600);
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

    /* Click All Products tab if present so full catalog renders */
    const allProdTab = document.querySelector('a[href*="#product_list"]');
    if (allProdTab) {
      try { allProdTab.click(); } catch (e) {}
      await sleep(450);
    }

    /* Collect links AT EVERY SCROLL STEP (prevents Shopee virtual list from unmounting top rows!) + multi-page support */
    let pageLoop = 0;
    while (!stopped && pageLoop < 8) {
      pageLoop++;
      collectVisibleLinks();
      const maxScroll = Math.max(3800, document.documentElement.scrollHeight + 800);
      for (let y = 0; y <= maxScroll && !stopped; y += 380) {
        window.scrollTo(0, y);
        await sleep(420);
        collectVisibleLinks();
        statusEl.textContent =
          '🔍 Đang quét danh sách SP trên sàn: đã thấy ' +
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
        await sleep(1100);
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

    subEl.textContent =
      'Đã gom đủ ' +
      urlSet.length +
      ' SP trên sàn — Đang mở lần lượt từng SP để lấy phân hệ & giá chuẩn 1-1...';

    let okCount = 0;
    let totalVars = 0;

    for (let i = 0; i < urlSet.length; i++) {
      if (stopped) break;
      const itemUrl = urlSet[i];
      const expectedKey = extractItemKey(itemUrl);
      const expectedSlugTitle = slugTitleFromUrl(itemUrl);

      statusEl.textContent =
        '⏳ (' + (i + 1) + '/' + urlSet.length + ') Đang mở đúng link & quét phân hệ...';
      barEl.style.width = Math.round(((i + 0.25) / urlSet.length) * 100) + '%';

      if (!workerWin || workerWin.closed) {
        workerWin = window.open(itemUrl, 'na2hand_worker', 'width=1280,height=900,left=30,top=30');
      } else {
        /* Wipe previous product DOM completely via about:blank before loading next product! */
        try { workerWin.location.replace('about:blank'); } catch (e) {}
        await sleep(180);
        workerWin.location.replace(itemUrl);
      }

      if (!workerWin) {
        statusEl.innerHTML =
          '<span style="color:#be123c;">Trình duyệt chặn cửa sổ phụ — hãy bấm biểu tượng Pop-up trên thanh địa chỉ Shopee chọn Cho phép (Allow) rồi chạy lại nhé!</span>';
        break;
      }

      let targetDoc = null;
      for (let w = 0; w < 42; w++) {
        await sleep(380);
        try {
          const d = workerWin.document;
          const curHref = d && d.location && d.location.href ? d.location.href : '';
          if (!curHref || curHref === 'about:blank') continue;
          const keyMatched = !expectedKey || curHref.indexOf(expectedKey) > -1;
          const curTitle = String((d && d.title) || '')
            .replace(/\s*\|\s*Shopee.*$/i, '')
            .trim();
          const slugMatched = titleMatchesSlug(curTitle, expectedSlugTitle);
          const hasActionText =
            d &&
            d.body &&
            /add to cart|buy now|thêm vào giỏ|mua ngay|pieces?\s*available|sản phẩm có sẵn/i.test(
              d.body.innerText || ''
            );
          const hasHydratedPrice = d ? readPriceInfo(d).min > 0 : false;

          if (d && keyMatched && d.readyState === 'complete' && slugMatched && hasActionText && (hasHydratedPrice || w >= 20)) {
            targetDoc = d;
            break;
          }
        } catch (e) {}
      }

      if (targetDoc) {
        await sleep(750);
        try {
          const prod = await extractProductDeep(targetDoc, itemUrl, expectedKey);
          if (prod && prod.name) {
            await pushToServer(prod);
            okCount++;
            totalVars += (prod.variants || []).length;
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
      await sleep(240);
    }

    if (workerWin && !workerWin.closed) {
      try { workerWin.close(); } catch (e) {}
    }

    /* Strict Two-Way 1-to-1 Reconciliation:
       Delete any Shopee-tagged item on Web that is NOT in discoveredPlatformIds!
       (Never touches Hàng tự đăng or other platforms!) */
    let prunedNote = '';
    const fullCatalogConfirmed =
      !stopped &&
      discoveredPlatformIds.length > 0 &&
      okCount > 0 &&
      (!expectedTotal || discoveredPlatformIds.length >= expectedTotal);

    if (fullCatalogConfirmed) {
      try {
        const recRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
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

    if (!stopped) {
      statusEl.innerHTML =
        '🎉 <span style="color:#15803d;">ĐỒNG BỘ 1-1 HOÀN TẤT! Đã khớp chuẩn <strong>' +
        okCount +
        '/' +
        urlSet.length +
        ' SP</strong> &amp; <strong>' +
        totalVars +
        ' phân hệ</strong> về Web!' +
        prunedNote +
        '</span>';
      subEl.textContent = 'Hàng tự đăng trên web được giữ nguyên 100% không bị ảnh hưởng.';
    }
  })();
};
