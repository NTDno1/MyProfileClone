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
    const HARVESTER_VERSION = 6;
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
      '<strong style="color:#d63874;font-size:14px;">🎀 NA 2HAND — Đồng Bộ 1-1 (V6 Chuẩn Kho Từng Phân Hệ)</strong>' +
      '<button id="na2h-stop" style="border:1px solid #f3b8d2;background:#fff0f6;color:#be123c;border-radius:8px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;">Dừng ✕</button>' +
      '</div>' +
      '<div id="na2h-status" style="margin-bottom:8px;font-weight:700;color:#54283b;">Đang khởi tạo trình đồng bộ 1-1 (V6)...</div>' +
      '<div style="height:8px;background:#fce7f3;border-radius:99px;overflow:hidden;margin-bottom:6px;">' +
      '<div id="na2h-bar" style="height:100%;width:4%;background:linear-gradient(90deg,#f4669d,#d63874);transition:width 0.3s;"></div>' +
      '</div>' +
      '<div id="na2h-sub" style="font-size:11.5px;color:#8c6274;">Đồng bộ chính xác 1-1 ảnh gốc, phân hệ, giá &amp; tồn kho thật từng mẫu</div>';
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

    const isAvatarOrBadgeImg = (u) =>
      /(?:^|\/|-)(?:[a-z]{2}-)?(?:11134216|11134226|11134233)-|avatar|icon|logo|badge|emoji|sprite/i.test(
        String(u || '')
      );

    const isRealPlatformImg = (u) =>
      /^https?:\/\/[^"'\s]*(?:susercontent\.com\/file\/|tiktokcdn|ibyteimg)/i.test(String(u || '')) &&
      !isAvatarOrBadgeImg(u);

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
          /^(Product Specifications|Chi tiết sản phẩm|Product Ratings|Đánh giá sản phẩm|From The Same Shop|(?:Các\s+)?Sản phẩm khác của Shop)$/i.test(
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

    /* Read exact stock shown right next to Quantity / Số lượng inside the PDP buy-box (returns number >= 0, or null if not yet rendered) */
    const readQtyStock = (doc) => {
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      const nodes = doc.querySelectorAll('div, span, p');
      let buyBoxSoldOut = false;
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (el.children.length > 3) continue;
        const r = el.getBoundingClientRect();
        const docY = r.top + sy;
        if (docY < 75 || docY > specY || r.width === 0 || r.height === 0) continue;
        const tx = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!tx || tx.length > 80) continue;
        const m1 = tx.match(/(\d[\d.,]*)\s*(?:pieces?\s*available|sản phẩm có sẵn|sp có sẵn)/i);
        if (m1) return parseInt(m1[1].replace(/[^\d]/g, ''), 10);
        const m2 = tx.match(/(?:còn lại|còn)\s*(\d[\d.,]*)\s*(?:sản phẩm|sp|chiếc)\b/i);
        if (m2) return parseInt(m2[1].replace(/[^\d]/g, ''), 10);
        if (/^(?:out of stock|sold out|đã hết hàng|tạm hết hàng|sản phẩm đã hết hàng)$/i.test(tx)) {
          buyBoxSoldOut = true;
        }
      }
      const txt = doc.body ? doc.body.innerText : '';
      const fm1 = txt.match(/(\d[\d.,]*)\s*(?:pieces?\s*available|sản phẩm có sẵn|sp có sẵn)/i);
      if (fm1) return parseInt(fm1[1].replace(/[^\d]/g, ''), 10);
      const fm2 = txt.match(/(?:còn lại|còn)\s*(\d[\d.,]*)\s*(?:sản phẩm|sp)\b/i);
      if (fm2) return parseInt(fm2[1].replace(/[^\d]/g, ''), 10);
      if (buyBoxSoldOut) return 0;
      return null;
    };

    /* Read authoritative total product stock from Product Specifications / Chi tiết sản phẩm -> Stock / Kho */
    const readSpecStock = (doc) => {
      const els = doc.querySelectorAll('label, div, span, th, td');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el.children.length > 1) continue;
        const tx = (el.textContent || '').trim();
        if (/^(?:stock|kho|kho hàng|số lượng kho)$/i.test(tx)) {
          const sib = el.nextElementSibling || (el.parentElement && el.parentElement.nextElementSibling);
          if (sib) {
            const valTx = (sib.textContent || '').trim();
            if (/^\d[\d.,]*$/.test(valTx)) {
              return parseInt(valTx.replace(/[^\d]/g, ''), 10);
            }
          }
        }
      }
      const txt = doc.body ? doc.body.innerText : '';
      const m = txt.match(/(?:^|\n)\s*(?:Stock|Kho hàng|Kho)\s*[\n:\t ]+\s*(\d{1,6})(?:\s*\n|$)/i);
      if (m) return parseInt(m[1], 10);
      return null;
    };

    const hasStockRendered = (doc) => readQtyStock(doc) !== null || readSpecStock(doc) !== null;

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
      /^(add to cart|buy now|thêm vào giỏ.*|mua ngay|mua với voucher.*|chat now|chat ngay|view shop|xem shop|follow|theo dõi|report|tố cáo|share|chia sẻ|favorite.*|yêu thích.*|size chart.*|bảng quy đổi.*|decrease|increase|giảm|tăng|\+|-|×|✕|.*change of mind.*|.*trả hàng.*|.*đổi trả.*|.*an tâm mua sắm.*|.*bảo hiểm.*|.*chính hãng.*|.*đồng kiểm.*|.*free ship.*|.*miễn phí vận chuyển.*|.*vận chuyển.*|.*shipping.*|.*spaylater.*|.*trả góp.*|.*voucher.*|.*mã giảm giá.*)$/i;

    const EXTENSION_OR_JUNK_BTN_RE =
      /\b(scrape|1688\s*sourcing|1688|sourcing|aliprice|taobao|tmall|aliexpress|search\s*by\s*image|search\s*similar|tìm\s*nguồn.*|tìm\s*hàng.*|lịch\s*sử\s*giá.*|biến\s*động\s*giá.*|tải\s*ảnh.*|download.*|copy\s*link.*|phân\s*tích.*)$/i;

    const isExtensionOrChromeNode = (el) => {
      if (!el || !el.closest) return false;
      return Boolean(
        el.closest(
          'header, nav, footer, [id*="aliprice" i], [class*="aliprice" i], [id*="1688" i], [class*="1688" i], [id*="extension" i], [class*="extension" i], [id*="sourcing" i], [class*="sourcing" i]'
        )
      );
    };

    const isBtnDisabled = (b, win) => {
      if (!b) return false;
      const cs = win.getComputedStyle(b);
      if (
        b.disabled ||
        b.getAttribute('aria-disabled') === 'true' ||
        /(?:^|\s|--)(?:disabled|sold-?out|product-variation--disabled)(?:\s|$)/i.test(b.className || '') ||
        cs.cursor === 'not-allowed' ||
        parseFloat(cs.opacity || '1') < 0.65
      ) {
        return true;
      }
      const rgbaM = String(cs.color || '').match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)/i);
      if (rgbaM && parseFloat(rgbaM[1]) < 0.42) return true;
      return false;
    };

    const getBtnSelectionSignals = (b, win) => {
      if (!b || isBtnDisabled(b, win)) {
        return { ariaChecked: false, selectedClass: false, visibleTick: false, orangeBorder: false };
      }
      const ariaChecked = b.getAttribute('aria-checked') === 'true';
      /* Avoid matching atomic CSS pseudo-classes like active:scale-95 or selected:border-red! */
      const cls = String(b.className || '');
      const selectedClass = /(?:^|\s)(?:product-variation--selected|is-selected)(?:\s|$)|(?:^|\s)[a-z0-9_-]+--selected(?:\s|$)/i.test(
        cls
      );
      let visibleTick = false;
      const tickNodes = b.querySelectorAll('[class*="tick"], svg');
      for (let i = 0; i < tickNodes.length; i++) {
        const tn = tickNodes[i];
        const tr = tn.getBoundingClientRect();
        if (tr.width < 2 || tr.height < 2) continue;
        const tcs = win.getComputedStyle(tn);
        const pcs = tn.parentElement && tn.parentElement !== b ? win.getComputedStyle(tn.parentElement) : null;
        if (
          tcs.display !== 'none' &&
          tcs.visibility !== 'hidden' &&
          parseFloat(tcs.opacity || '1') > 0.2 &&
          (!pcs || (pcs.display !== 'none' && pcs.visibility !== 'hidden' && parseFloat(pcs.opacity || '1') > 0.2))
        ) {
          visibleTick = true;
          break;
        }
      }
      let orangeBorder = false;
      const cs = win.getComputedStyle(b);
      const borderStr = String(cs.borderTopColor || cs.borderColor || '');
      const rgbM = borderStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/i);
      if (rgbM) {
        const alpha = rgbM[4] !== undefined ? parseFloat(rgbM[4]) : 1;
        if (alpha > 0.5 && Number(rgbM[1]) > 195 && Number(rgbM[2]) < 125 && Number(rgbM[3]) < 110) {
          orangeBorder = true;
        }
      }
      return { ariaChecked, selectedClass, visibleTick, orangeBorder };
    };

    /* Differential radio-group check: in any tier with >= 2 options, at most ONE button can be selected! */
    const isBtnSelectedInGroup = (btn, groupBtns, win) => {
      if (!btn) return false;
      const peers = Array.isArray(groupBtns) && groupBtns.length > 0 ? groupBtns : [btn];
      if (peers.length === 1) {
        if (btn.hasAttribute('aria-checked')) return btn.getAttribute('aria-checked') === 'true';
        const s = getBtnSelectionSignals(btn, win);
        return s.selectedClass || s.visibleTick || s.orangeBorder;
      }
      const sigList = peers.map((p) => ({ el: p, sig: getBtnSelectionSignals(p, win) }));
      const target = sigList.find((x) => x.el === btn);
      if (!target) return false;
      const keys = ['ariaChecked', 'selectedClass', 'visibleTick', 'orangeBorder'];
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        if (!target.sig[key]) continue;
        const trueCount = sigList.filter((x) => x.sig[key]).length;
        if (trueCount === 1) return true;
      }
      return false;
    };

    const selectBtnInGroup = async (btn, groupBtns, win) => {
      if (!btn || isBtnDisabled(btn, win)) return false;
      if (isBtnSelectedInGroup(btn, groupBtns, win)) return true;
      try {
        btn.scrollIntoView({ block: 'nearest' });
      } catch (e) {}
      try {
        btn.click();
      } catch (e) {}
      for (let p = 0; p < 4; p++) {
        await sleep(75);
        if (isBtnSelectedInGroup(btn, groupBtns, win)) return true;
      }
      /* Fallback synthetic pointer/mouse sequence if plain .click() was ignored */
      try {
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup'].forEach((evType) => {
          btn.dispatchEvent(new MouseEvent(evType, { bubbles: true, cancelable: true, view: win }));
        });
        btn.click();
      } catch (e) {}
      for (let p = 0; p < 4; p++) {
        await sleep(85);
        if (isBtnSelectedInGroup(btn, groupBtns, win)) return true;
      }
      return isBtnSelectedInGroup(btn, groupBtns, win);
    };

    /* Deselect any selected button in a tier group (critical between Mẫu iterations on 2-tier products so Shopee re-enables all Mẫu buttons!) */
    const deselectGroup = async (groupBtns, win) => {
      if (!Array.isArray(groupBtns) || groupBtns.length === 0) return;
      const selBtn = groupBtns.find((b) => !isBtnDisabled(b, win) && isBtnSelectedInGroup(b, groupBtns, win));
      if (!selBtn) return;
      try {
        selBtn.click();
      } catch (e) {}
      for (let p = 0; p < 4; p++) {
        await sleep(75);
        if (!isBtnSelectedInGroup(selBtn, groupBtns, win)) return;
      }
    };

    const getModelRawStock = (md) => {
      if (!md || typeof md !== 'object') return 0;
      if (md.sold_out === true || md.status === 0) return 0;
      if (md.stock !== undefined && md.stock !== null) return Math.max(0, Number(md.stock));
      if (md.normal_stock !== undefined && md.normal_stock !== null) return Math.max(0, Number(md.normal_stock));
      return 0;
    };

    const isModelSoldOut = (md) => !md || md.sold_out === true || md.status === 0 || getModelRawStock(md) <= 0;

    /* Find the DOM button group matching an exact React tier's option labels (100% immune to Shopee CSS class changes & extension buttons!) */
    const findTierGroupByOptions = (doc, win, optionsList, excludeParent) => {
      if (!Array.isArray(optionsList) || optionsList.length === 0) return null;
      const wantSet = new Set(optionsList.map((o) => String(o || '').trim().toLowerCase()).filter(Boolean));
      if (wantSet.size === 0) return null;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      const groupMap = new Map();
      const allBtns = doc.querySelectorAll('button');
      for (let i = 0; i < allBtns.length; i++) {
        const b = allBtns[i];
        if (isExtensionOrChromeNode(b)) continue;
        const r = b.getBoundingClientRect();
        const docY = r.top + sy;
        if (docY < 80 || docY > specY || r.width === 0 || r.height === 0) continue;
        const lbl = (b.innerText || '').replace(/\s+/g, ' ').trim();
        if (!lbl || !wantSet.has(lbl.toLowerCase())) continue;
        const p = b.parentElement;
        if (!p || p === excludeParent) continue;
        if (!groupMap.has(p)) groupMap.set(p, []);
        groupMap.get(p).push(b);
      }
      let best = null;
      let bestHits = 0;
      groupMap.forEach((btns, parentEl) => {
        const uniqHits = new Set(btns.map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase())).size;
        if (uniqHits > bestHits) {
          bestHits = uniqHits;
          best = {
            tierName: '',
            btns,
            parentEl,
            hasImg: btns.some((b) => Boolean(getBtnRealThumb(b)))
          };
        }
      });
      return best;
    };

    /* Find Shop Info Card Y coordinate (sits between buy-box and Product Specifications, contains the shop avatar!) */
    const getShopCardCutoffDocY = (doc) => {
      const win = doc.defaultView || window;
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      let cutoff = specY;
      const btns = doc.querySelectorAll('a, button');
      for (let i = 0; i < btns.length; i++) {
        const el = btns[i];
        const tx = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (/^(?:view shop|xem shop|chat now|chat ngay)$/i.test(tx)) {
          const r = el.getBoundingClientRect();
          const dy = r.top + sy;
          if (dy > 260 && dy < cutoff) {
            cutoff = Math.max(260, dy - 90);
          }
        }
      }
      return cutoff;
    };

    const isCircularAvatarImg = (im, win) => {
      if (!im) return false;
      if (im.closest && im.closest('[class*="avatar" i], [class*="shop-info" i], [class*="page-product__shop" i], header, nav')) {
        return true;
      }
      try {
        const cs = win.getComputedStyle(im);
        const br = String(cs.borderRadius || '');
        if (/50%|999/.test(br)) return true;
        if (im.parentElement) {
          const pcs = win.getComputedStyle(im.parentElement);
          if (/50%|999/.test(String(pcs.borderRadius || ''))) return true;
        }
      } catch (e) {}
      return false;
    };

    const findDomVariationTiers = (doc, win) => {
      const sy = win.scrollY || 0;
      const specY = getSpecCutoffDocY(doc);
      const groupMap = new Map();
      const allBtns = doc.querySelectorAll('button');
      for (let i = 0; i < allBtns.length; i++) {
        const b = allBtns[i];
        if (isExtensionOrChromeNode(b)) continue;
        const r = b.getBoundingClientRect();
        const docY = r.top + sy;
        if (docY < 80 || docY > specY || r.width === 0 || r.height === 0) continue;
        const lbl = (b.innerText || '').replace(/\s+/g, ' ').trim();
        if (!lbl || lbl.length > 44 || NON_VARIATION_BTN_RE.test(lbl) || EXTENSION_OR_JUNK_BTN_RE.test(lbl)) continue;
        const ariaLbl = (b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        if (ariaLbl && (NON_VARIATION_BTN_RE.test(ariaLbl) || EXTENSION_OR_JUNK_BTN_RE.test(ariaLbl))) continue;
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
        const hasVarAttr = btns.some(
          (b) =>
            /product-variation|variation|sApkZm/i.test(b.className || '') ||
            b.getAttribute('role') === 'radio' ||
            b.hasAttribute('aria-checked')
        );
        if (!hasImg && !hasMatchingAria && !hasVarAttr) return;
        let tierName = 'Mẫu';
        const row = parentEl.parentElement;
        if (row && row.firstElementChild && !row.firstElementChild.contains(btns[0])) {
          const cand = (row.firstElementChild.innerText || '').trim();
          if (cand && cand.length <= 26 && !EXTENSION_OR_JUNK_BTN_RE.test(cand)) tierName = cand;
        }
        tiers.push({ tierName, btns, parentEl, hasImg });
      });
      return tiers;
    };

    /* Detect whether the Shopee PDP visibly displays variation rows in DOM */
    const pageShowsVariationUI = (doc) => {
      const win = doc.defaultView || window;
      return findDomVariationTiers(doc, win).length > 0;
    };

    /* Guarantee sum(variants.stock) NEVER inflates to N * TotalStock and preserves sold-out (0) variants & (Mẫu, Size) cells! */
    const reconcileVariantsStock = (variants, authTotal, sizes) => {
      if (!Array.isArray(variants) || variants.length === 0) return;
      variants.forEach((v) => {
        if (v._isSoldOut) {
          v.stock = 0;
          if (v.sizeStocks && typeof v.sizeStocks === 'object') {
            Object.keys(v.sizeStocks).forEach((k) => {
              v.sizeStocks[k] = 0;
            });
          }
        } else if (v.sizeStocks && typeof v.sizeStocks === 'object') {
          const szSum = Object.values(v.sizeStocks).reduce((s, n) => s + Math.max(0, Number(n || 0)), 0);
          v.stock = szSum;
          if (szSum === 0) v._isSoldOut = true;
        }
      });

      const activeVars = variants.filter((v) => !v._isSoldOut && Number(v.stock ?? 0) > 0);
      if (authTotal === null || authTotal === undefined || isNaN(authTotal)) return;
      const safeTotal = Math.max(0, Math.round(Number(authTotal)));
      if (safeTotal === 0 || activeVars.length === 0) {
        variants.forEach((v) => {
          v.stock = 0;
          if (v.sizeStocks && typeof v.sizeStocks === 'object') {
            Object.keys(v.sizeStocks).forEach((k) => {
              v.sizeStocks[k] = 0;
            });
          }
        });
        return;
      }

      /* 2-Tier Matrix Reconciliation: preserve EVERY sold-out (0) (Mẫu, Size) cell! */
      const hasSizeMatrix = sizes && sizes.length > 0 && activeVars.some((v) => v.sizeStocks && typeof v.sizeStocks === 'object');
      if (hasSizeMatrix) {
        const activeCells = [];
        activeVars.forEach((v) => {
          if (!v.sizeStocks || typeof v.sizeStocks !== 'object') return;
          Object.keys(v.sizeStocks).forEach((sz) => {
            const val = Math.max(0, Number(v.sizeStocks[sz] || 0));
            if (val > 0) activeCells.push({ v, sz, val, confirmed: Boolean(v._confirmedClick) });
          });
        });
        const curMatrixSum = activeCells.reduce((s, c) => s + c.val, 0);
        if (activeCells.length > 0 && safeTotal === activeCells.length) {
          activeCells.forEach((c) => {
            c.v.sizeStocks[c.sz] = 1;
          });
        } else if (activeCells.length > 0 && (curMatrixSum > safeTotal || (curMatrixSum !== safeTotal && !activeCells.some((c) => c.confirmed)))) {
          const validConf = activeCells.filter((c) => c.confirmed && c.val < safeTotal);
          const unconf = activeCells.filter((c) => validConf.indexOf(c) === -1);
          const confSum = validConf.reduce((s, c) => s + c.val, 0);
          if (validConf.length > 0 && unconf.length > 0 && confSum + unconf.length <= safeTotal) {
            const remPool = safeTotal - confSum;
            const bShare = Math.floor(remPool / unconf.length);
            const bRem = remPool % unconf.length;
            unconf.forEach((c, idx) => {
              c.v.sizeStocks[c.sz] = bShare + (idx < bRem ? 1 : 0);
            });
          } else {
            const bShare = Math.floor(safeTotal / activeCells.length);
            const bRem = safeTotal % activeCells.length;
            activeCells.forEach((c, idx) => {
              c.v.sizeStocks[c.sz] = bShare + (idx < bRem ? 1 : 0);
            });
          }
        }
        variants.forEach((v) => {
          if (v.sizeStocks && typeof v.sizeStocks === 'object') {
            v.stock = Object.values(v.sizeStocks).reduce((s, n) => s + Math.max(0, Number(n || 0)), 0);
          }
        });
        return;
      }

      if (activeVars.length === 1 && (!sizes || sizes.length === 0)) {
        activeVars[0].stock = safeTotal;
        return;
      }
      /* Exact 1-of-1 mathematical theorem: K active variants with integer stock >= 1 summing to K => every active = 1! */
      if ((!sizes || sizes.length === 0) && safeTotal === activeVars.length) {
        activeVars.forEach((v) => {
          v.stock = 1;
        });
        return;
      }
      const curSum = activeVars.reduce((s, v) => s + Math.max(0, Number(v.stock || 0)), 0);
      const anyConfirmed = activeVars.some((v) => Boolean(v._confirmedClick));
      if (curSum > safeTotal || (curSum !== safeTotal && !anyConfirmed)) {
        const validConfirmed = activeVars.filter((v) => v._confirmedClick && v.stock > 0 && v.stock < safeTotal);
        const unconfirmed = activeVars.filter((v) => validConfirmed.indexOf(v) === -1);
        const confSum = validConfirmed.reduce((s, v) => s + v.stock, 0);
        if (validConfirmed.length > 0 && unconfirmed.length > 0 && confSum + unconfirmed.length <= safeTotal) {
          const remPool = safeTotal - confSum;
          const bShare = Math.floor(remPool / unconfirmed.length);
          const bRem = remPool % unconfirmed.length;
          unconfirmed.forEach((v, idx) => {
            v.stock = bShare + (idx < bRem ? 1 : 0);
          });
        } else {
          const baseShare = Math.floor(safeTotal / activeVars.length);
          const rem = safeTotal % activeVars.length;
          activeVars.forEach((v, idx) => {
            v.stock = baseShare + (idx < rem ? 1 : 0);
          });
        }
      }
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

      let title = readCleanDocTitle(doc);
      const domPrice = readPriceInfo(doc);
      let basePrice = domPrice.min || 0;
      let maxPrice = domPrice.max || basePrice;
      let origPrice = domPrice.orig || 0;
      let baseMainImg = readMainImg(doc);

      /* Read real DOM stock BEFORE clicking any buttons (unselected Quantity = total stock!) + Specifications -> Stock/Kho */
      const domTiersInitial = findDomVariationTiers(doc, win);
      const allTiersPreSelected =
        domTiersInitial.length > 0 &&
        domTiersInitial.every((t) => t.btns.some((b) => isBtnSelectedInGroup(b, t.btns, win)));
      const unselectedQtyStock = !allTiersPreSelected || (domTiersInitial.length === 1 && domTiersInitial[0].btns.length === 1)
        ? readQtyStock(doc)
        : null;

      try { win.scrollTo(0, 620); } catch (e) {}
      await sleep(200);
      const specStock = readSpecStock(doc);
      try { win.scrollTo(0, 0); } catch (e) {}
      await sleep(160);

      const authoritativeTotalStock = specStock !== null ? specStock : unselectedQtyStock;

      let variantGroupName = 'Mẫu';
      const variants = [];
      let sizes = [];
      let usedReactModels = false;
      let reactStockExactResolved = false;

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
          const opts0 = Array.isArray(tv0.options) ? tv0.options.map((o) => String(o || '').trim()).filter(Boolean) : [];
          const imgs0 = Array.isArray(tv0.images) ? tv0.images : [];
          if (opts0.length > 0) {
            variantGroupName = String(tv0.name || 'Mẫu').trim();
            /* STRICT 1-to-1 Size tier: ONLY populate sizes if Shopee's tier_variations[1] actually exists! */
            if (tv1 && Array.isArray(tv1.options)) {
              sizes = tv1.options
                .map((s) => String(s || '').trim())
                .filter((s) => Boolean(s) && !EXTENSION_OR_JUNK_BTN_RE.test(s));
            }

            const allModels = Array.isArray(reactItem.models) ? reactItem.models : [];
            const posModels = allModels.filter((md) => !isModelSoldOut(md));
            const reactModelSum = posModels.reduce((s, md) => s + getModelRawStock(md), 0);
            const looksMasked10 = posModels.length >= 2 && posModels.every((md) => getModelRawStock(md) === 10);
            const canTrustExactModelStock =
              authoritativeTotalStock !== null &&
              authoritativeTotalStock > 0 &&
              ((reactModelSum === authoritativeTotalStock && !looksMasked10) ||
                posModels.length === authoritativeTotalStock);

            if (canTrustExactModelStock) {
              reactStockExactResolved = true;
            }

            opts0.forEach((optLabel, idx) => {
              const matching = allModels.filter((md) => {
                if (Array.isArray(md.tier_index)) return md.tier_index[0] === idx;
                if (md.extinfo && Array.isArray(md.extinfo.tier_index)) return md.extinfo.tier_index[0] === idx;
                return String(md.name || '').split(',')[0].trim() === optLabel;
              });
              const reactSoldOut = matching.length > 0 && matching.every((md) => isModelSoldOut(md));
              const inStockM = matching.filter((md) => !isModelSoldOut(md));
              const pool = inStockM.length > 0 ? inStockM : matching;
              const mPrices = pool.map((md) => normApiPrice(md.price)).filter((p) => p > 0);
              const rawImg = imgs0[idx] || '';
              const fullVarImg = rawImg
                ? String(rawImg).indexOf('http') === 0
                  ? cleanImg(rawImg)
                  : 'https://down-vn.img.susercontent.com/file/' + rawImg
                : baseMainImg;

              let initVarStock = reactSoldOut ? 0 : 1;
              let sizeStocks = undefined;
              let sizePrices = undefined;
              const reactSizeSoldOut = {};

              if (sizes.length > 0) {
                sizeStocks = {};
                sizePrices = {};
                sizes.forEach((szLbl, sIdx) => {
                  const sm = matching.find((md) => {
                    const ti = md.tier_index || (md.extinfo && md.extinfo.tier_index);
                    if (Array.isArray(ti)) return ti[1] === sIdx;
                    return String(md.name || '').split(',')[1]?.trim() === szLbl;
                  });
                  const smSoldOut = !sm || isModelSoldOut(sm);
                  reactSizeSoldOut[szLbl] = smSoldOut;
                  const smPrice = sm ? normApiPrice(sm.price) : 0;
                  if (smPrice > 0) sizePrices[szLbl] = smPrice;

                  if (smSoldOut) {
                    sizeStocks[szLbl] = 0;
                  } else if (canTrustExactModelStock) {
                    sizeStocks[szLbl] =
                      posModels.length === authoritativeTotalStock ? 1 : getModelRawStock(sm);
                  } else {
                    sizeStocks[szLbl] = 1;
                  }
                });
                initVarStock = Object.values(sizeStocks).reduce((s, n) => s + Math.max(0, Number(n || 0)), 0);
              } else if (!reactSoldOut && canTrustExactModelStock) {
                if (posModels.length === authoritativeTotalStock) {
                  initVarStock = inStockM.length;
                } else {
                  initVarStock = inStockM.reduce((s, md) => s + getModelRawStock(md), 0);
                }
              }

              const varEntry = {
                id: 'var_' + (idx + 1),
                label: optLabel,
                image: fullVarImg,
                price: mPrices.length > 0 ? Math.min.apply(null, mPrices) : basePrice,
                stock: initVarStock,
                _reactSoldOut: reactSoldOut || (sizes.length > 0 && initVarStock === 0),
                _reactSizeSoldOut: reactSizeSoldOut,
                _confirmedClick: Boolean(canTrustExactModelStock)
              };
              if (sizeStocks) varEntry.sizeStocks = sizeStocks;
              if (sizePrices && Object.keys(sizePrices).length > 0) varEntry.sizePrices = sizePrices;
              variants.push(varEntry);
            });
            usedReactModels = true;
          }
        }
      }

      /* Measure 100% REAL unmasked per-variant & per-(Mẫu, Size) stock from live DOM buttons! */
      const domTiers = findDomVariationTiers(doc, win);
      let primary = null;
      let secondary = null;

      if (usedReactModels && variants.length > 0) {
        primary =
          findTierGroupByOptions(doc, win, variants.map((v) => v.label), null) ||
          (domTiers.length > 0 ? domTiers[domTiers.findIndex((t) => t.hasImg) >= 0 ? domTiers.findIndex((t) => t.hasImg) : 0] : null);
        if (sizes.length > 0) {
          secondary =
            findTierGroupByOptions(doc, win, sizes, primary ? primary.parentEl : null) ||
            domTiers.find((t) => t !== primary && (!primary || t.parentEl !== primary.parentEl)) ||
            null;
        }
      } else if (domTiers.length > 0) {
        const imgTierIdx = domTiers.findIndex((t) => t.hasImg);
        const primaryIdx = imgTierIdx >= 0 ? imgTierIdx : 0;
        primary = domTiers[primaryIdx];
        secondary = domTiers.find((t, idx) => idx !== primaryIdx) || null;
        if (secondary && sizes.length === 0) {
          secondary.btns.forEach((b) => {
            const s = (b.innerText || '').replace(/\s+/g, ' ').trim();
            if (s && s.length <= 20 && !EXTENSION_OR_JUNK_BTN_RE.test(s) && sizes.indexOf(s) === -1) {
              sizes.push(s);
            }
          });
        }
      }

      if (primary && primary.btns.length > 0) {
        /* Clear any pre-selected secondary button BEFORE reading initial disabled state of primary buttons! */
        if (secondary && secondary.btns.length > 0) {
          await deselectGroup(secondary.btns, win);
          await sleep(80);
        }

        if (!usedReactModels) {
          variantGroupName = primary.tierName || 'Mẫu';
          for (let k = 0; k < primary.btns.length; k++) {
            const btn = primary.btns[k];
            const label = (btn.innerText || 'Mẫu ' + (k + 1)).replace(/\s+/g, ' ').trim();
            const btnImg = getBtnRealThumb(btn);
            const dis = isBtnDisabled(btn, win);
            variants.push({
              id: 'var_' + (k + 1),
              label,
              image: btnImg || baseMainImg,
              price: basePrice || 110000,
              stock: dis ? 0 : 1,
              _domBtn: btn,
              _isSoldOut: dis,
              _reactSizeSoldOut: {},
              _confirmedClick: false
            });
          }
        } else {
          /* Map each React variant strictly to its matching DOM button */
          variants.forEach((v, idx) => {
            const normLbl = v.label.toLowerCase();
            const matchedBtn =
              primary.btns.find((b) => (b.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase() === normLbl) ||
              (primary.btns.length === variants.length ? primary.btns[idx] : null);
            v._domBtn = matchedBtn;
            const dis = Boolean(v._reactSoldOut || (matchedBtn && isBtnDisabled(matchedBtn, win)));
            v._isSoldOut = dis;
            if (dis) {
              v.stock = 0;
              if (v.sizeStocks) {
                Object.keys(v.sizeStocks).forEach((k) => {
                  v.sizeStocks[k] = 0;
                });
              }
            }
          });
        }

        const activeVars = variants.filter((v) => !v._isSoldOut);
        if (activeVars.length === 0) {
          variants.forEach((v) => {
            v.stock = 0;
            if (v.sizeStocks) {
              Object.keys(v.sizeStocks).forEach((k) => {
                v.sizeStocks[k] = 0;
              });
            }
          });
        } else if (
          sizes.length === 0 &&
          authoritativeTotalStock !== null &&
          authoritativeTotalStock === activeVars.length &&
          usedReactModels
        ) {
          /* Exact 1-of-1 theorem: K active variants summing to K total stock => every active variant = 1! */
          activeVars.forEach((v) => {
            v.stock = 1;
            v._confirmedClick = true;
          });
        } else if (reactStockExactResolved && usedReactModels) {
          /* Exact per-SKU stocks already verified against authoritativeTotalStock */
        } else if (sizes.length > 0 && secondary && secondary.btns.length > 0 && activeVars.length * secondary.btns.length <= 75) {
          /* 2-Tier Product (e.g. Mẫu + Size): measure exact stock & sold-out matrix for EVERY (Mẫu, Size) pair! */
          const totalPairs = activeVars.length * secondary.btns.length;
          for (let a = 0; a < activeVars.length && !stopped; a++) {
            const v = activeVars[a];
            if (!v._domBtn) continue;

            /* CRITICAL: Deselect any active Size button BEFORE switching Mẫu so Shopee does not disable Mẫu buttons! */
            await deselectGroup(secondary.btns, win);
            await sleep(60);

            if (isBtnDisabled(v._domBtn, win)) {
              v._isSoldOut = true;
              v.stock = 0;
              const zeroMap = {};
              sizes.forEach((sz) => {
                zeroMap[sz] = 0;
              });
              v.sizeStocks = zeroMap;
              v._confirmedClick = true;
              continue;
            }

            const pOk = await selectBtnInGroup(v._domBtn, primary.btns, win);
            if (!pOk) continue;
            await sleep(100);

            if (!usedReactModels) {
              const pNow = readPriceInfo(doc);
              if (pNow.min > 0) v.price = pNow.min;
              const activeImg = readMainImg(doc);
              if (!getBtnRealThumb(v._domBtn) && activeImg) v.image = activeImg;
            }

            let vSum = 0;
            let gotPair = false;
            const szMap = {};
            const szPriceMap = Object.assign({}, v.sizePrices || {});

            for (let s = 0; s < secondary.btns.length && !stopped; s++) {
              const sBtn = secondary.btns[s];
              const sLbl = (sBtn.innerText || '').replace(/\s+/g, ' ').trim();
              if (!sLbl) continue;

              const knownReactZero = Boolean(v._reactSizeSoldOut && v._reactSizeSoldOut[sLbl]);
              if (knownReactZero || isBtnDisabled(sBtn, win)) {
                szMap[sLbl] = 0;
                gotPair = true;
                continue;
              }

              const sOk = await selectBtnInGroup(sBtn, secondary.btns, win);
              if (!sOk) {
                if (isBtnDisabled(sBtn, win)) {
                  szMap[sLbl] = 0;
                  gotPair = true;
                }
                continue;
              }

              await sleep(100);
              let qPair = readQtyStock(doc);
              if (totalPairs > 1 && authoritativeTotalStock !== null && qPair === authoritativeTotalStock) {
                await sleep(180);
                qPair = readQtyStock(doc);
              }
              const pPair = readPriceInfo(doc);
              if (pPair.min > 0) {
                szPriceMap[sLbl] = pPair.min;
              }
              if (qPair !== null) {
                szMap[sLbl] = qPair;
                vSum += qPair;
                gotPair = true;
              }
            }

            /* Ensure every size label in `sizes` has an explicit numeric entry in szMap */
            sizes.forEach((sz) => {
              if (szMap[sz] === undefined) {
                szMap[sz] = v._reactSizeSoldOut && v._reactSizeSoldOut[sz] ? 0 : 0;
              }
            });

            if (gotPair) {
              v.stock = vSum;
              v.sizeStocks = szMap;
              if (Object.keys(szPriceMap).length > 0) {
                v.sizePrices = szPriceMap;
                const availPrices = Object.keys(szPriceMap)
                  .filter((k) => Number(szMap[k] || 0) > 0 && Number(szPriceMap[k]) > 0)
                  .map((k) => Number(szPriceMap[k]));
                if (availPrices.length > 0) v.price = Math.min.apply(null, availPrices);
              }
              if (vSum === 0) v._isSoldOut = true;
              v._confirmedClick = true;
            }
          }
          await deselectGroup(secondary.btns, win);
        } else {
          /* 1-Tier Product: click each active variant button with strict radio-group verification */
          for (let a = 0; a < activeVars.length && !stopped; a++) {
            const v = activeVars[a];
            if (!v._domBtn || primary.btns.length > 60) continue;
            const selOk = await selectBtnInGroup(v._domBtn, primary.btns, win);
            if (!usedReactModels) {
              const pNow = readPriceInfo(doc);
              if (pNow.min > 0) v.price = pNow.min;
              const activeImg = readMainImg(doc);
              if (!getBtnRealThumb(v._domBtn) && activeImg) v.image = activeImg;
            }
            if (selOk) {
              await sleep(90);
              let qNow = readQtyStock(doc);
              /* If multiple active variants exist and first read still shows total stock, allow React 160ms to flush */
              if (activeVars.length > 1 && authoritativeTotalStock !== null && qNow === authoritativeTotalStock) {
                await sleep(160);
                qNow = readQtyStock(doc);
              }
              if (qNow !== null) {
                v.stock = qNow;
                if (qNow === 0) v._isSoldOut = true;
                v._confirmedClick = true;
              }
            }
          }
        }

        reconcileVariantsStock(variants, authoritativeTotalStock, sizes);
      } else if (variants.length > 0) {
        reconcileVariantsStock(variants, authoritativeTotalStock, sizes);
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
      if (reactItem && Array.isArray(reactItem.images) && reactItem.images.length > 0) {
        reactItem.images.forEach((h) => {
          addG(String(h).indexOf('http') === 0 ? h : 'https://down-vn.img.susercontent.com/file/' + h);
        });
      } else {
        if (baseMainImg) addG(baseMainImg);
        const shopLimit = getShopCardCutoffDocY(doc);
        const allImgs = doc.querySelectorAll('img');
        for (let i = 0; i < allImgs.length && gallery.length < 25; i++) {
          const im = allImgs[i];
          if (isExtensionOrChromeNode(im) || isCircularAvatarImg(im, win)) continue;
          const src = im.currentSrc || im.src || im.getAttribute('src') || '';
          if (!isRealPlatformImg(src)) continue;
          const r = im.getBoundingClientRect();
          const docY = r.top + (win.scrollY || 0);
          const w = Math.max(r.width || 0, im.naturalWidth || 0);
          if (w >= 45 && docY >= 95 && docY < shopLimit) addG(src);
        }
      }
      variants.forEach((v) => {
        if (v.image) addG(v.image);
      });

      try { win.scrollTo(0, 750); } catch (e) {}
      await sleep(220);

      const lateSpecStock = readSpecStock(doc);
      const finalAuthTotalStock = lateSpecStock !== null ? lateSpecStock : authoritativeTotalStock;

      /* Re-run stock reconciliation if Specifications -> Stock/Kho became visible after scrolling */
      if (variants.length > 0 && finalAuthTotalStock !== null) {
        reconcileVariantsStock(variants, finalAuthTotalStock, sizes);
      }

      /* Clean temporary internal properties on variants */
      variants.forEach((v) => {
        delete v._reactSoldOut;
        delete v._reactSizeSoldOut;
        delete v._domBtn;
        delete v._isSoldOut;
        delete v._confirmedClick;
      });

      let desc = reactItem && reactItem.description ? String(reactItem.description).trim() : '';
      const fullTxt = doc.body ? doc.body.innerText : '';
      if (!desc) {
        const dm = fullTxt.match(
          /(?:Product Description|Mô tả sản phẩm)\s*\n([\s\S]{12,1800}?)(?:Product Ratings|Đánh giá sản phẩm|From The Same Shop|(?:Các\s+)?Sản phẩm khác của Shop|You May Also Like|Có thể bạn cũng thích|CUSTOMER SERVICE|CHĂM SÓC KHÁCH HÀNG|$)/i
        );
        if (dm) desc = dm[1].trim();
      }
      desc = String(desc || '')
        .replace(/(?:CUSTOMER SERVICE|CHĂM SÓC KHÁCH HÀNG)[\s\S]*$/i, '')
        .trim();

      const soldM = fullTxt.match(/(\d+)\s*(?:Sold|Đã bán)|Đã bán\s*(\d+)/i);
      const sold =
        reactItem && (reactItem.historical_sold !== undefined || reactItem.sold !== undefined)
          ? Number(reactItem.historical_sold || reactItem.sold || 0)
          : soldM
          ? parseInt(soldM[1] || soldM[2] || '0', 10)
          : 0;

      /* Compute 100% REAL total stock = sum of remaining stocks across variants (or authoritative single-item stock) */
      let stockTotal = 0;
      if (variants.length > 0) {
        stockTotal = variants.reduce((s, v) => s + Math.max(0, Number(v.stock || 0)), 0);
      } else if (finalAuthTotalStock !== null) {
        stockTotal = finalAuthTotalStock;
      } else {
        const fallbackQty = readQtyStock(doc);
        stockTotal = fallbackQty !== null ? fallbackQty : 1;
      }

      const expectedHasVars = reactItem
        ? (Array.isArray(reactItem.models) && reactItem.models.length > 1) ||
          (Array.isArray(reactItem.tier_variations) &&
            reactItem.tier_variations.some(
              (tv) => Array.isArray(tv && tv.options) && tv.options.filter(Boolean).length > 1
            ))
        : pageShowsVariationUI(doc) || maxPrice > basePrice;

      const realStockVerified = finalAuthTotalStock !== null || readQtyStock(doc) !== null || domTiers.length > 0;

      return {
        harvesterVersion: HARVESTER_VERSION,
        stockVerifiedV6: true,
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
        authoritativeTotalStock: finalAuthTotalStock,
        sold,
        description: desc,
        sourcePlatform: plat,
        sourceUrl: finalUrl,
        _expectedHasVars: expectedHasVars,
        _realStockVerified: realStockVerified
      };
    };

    /* Completeness & 1-to-1 URL Identity + Real Stock check: returns null if 100% verified, or error reason to trigger automatic retry! */
    const checkScanDefect = (prod) => {
      if (!prod || !prod.name || prod.name.length < 4) return 'Chưa đọc được tên SP';
      const urlSlugTitle = slugTitleFromUrl(prod.sourceUrl || '');
      if (urlSlugTitle && !titleMatchesSlugStrict(prod.name, urlSlugTitle)) {
        return 'Tên SP trên trang chưa khớp với đường dẫn Shopee';
      }
      const realImgs = (prod.images || []).filter(isRealPlatformImg);
      if (realImgs.length === 0) return 'Chưa tải xong ảnh gốc Shopee';
      if (!prod.price || prod.price < 1000) return 'Chưa tải xong giá bán';
      if (!prod._realStockVerified) return 'Chưa tải xong số lượng tồn kho thật trên Shopee';
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
      delete payloadProd._realStockVerified;
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
