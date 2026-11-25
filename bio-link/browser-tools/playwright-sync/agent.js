const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 3899;
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');

let browserContext = null;

async function getVisibleBrowserContext() {
  if (browserContext) {
    try {
      // Kiểm tra context còn mở không
      browserContext.pages();
      return browserContext;
    } catch {
      browserContext = null;
    }
  }

  try {
    // Ưu tiên mở chính trình duyệt Google Chrome thật trên máy người dùng
    browserContext = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1360, height: 860 },
      args: ['--disable-blink-features=AutomationControlled']
    });
  } catch {
    // Dự phòng mở Chromium của Playwright nếu máy chưa cài Chrome ở đường dẫn mặc định
    browserContext = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: false,
      viewport: { width: 1360, height: 860 }
    });
  }

  browserContext.on('close', () => {
    browserContext = null;
  });

  return browserContext;
}

async function extractFromShopeeOrTiktok(targetUrl) {
  const ctx = await getVisibleBrowserContext();
  const page = await ctx.newPage();

  try {
    console.log(`🌸 Đang mở trình duyệt tới: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3500);

    const finalUrl = page.url();
    const pageTitle = await page.title();

    // Kiểm tra nếu sàn yêu cầu người dùng tự đăng nhập hoặc xác minh trên trình duyệt thật (Tuyệt đối không can thiệp CAPTCHA)
    const isBlockedOrLogin = await page.evaluate(() => {
      const url = location.href.toLowerCase();
      const txt = (document.body?.innerText || '').slice(0, 1500).toLowerCase();
      if (url.includes('/buyer/login') || url.includes('/verify')) return 'login_or_verify';
      if (
        txt.includes('xác minh bạn là con người') ||
        txt.includes('verify you are human') ||
        txt.includes('kéo thanh trượt để xác minh')
      ) {
        return 'verify_gate';
      }
      return '';
    });

    if (isBlockedOrLogin) {
      return {
        success: false,
        gated: true,
        products: [],
        message:
          'Trình duyệt Chrome đã mở! Trang Shopee/TikTok đang yêu cầu bạn đăng nhập hoặc xác minh thủ công trên cửa sổ Chrome vừa bật. Hãy đăng nhập trên cửa sổ đó xong rồi bấm nút Kéo Sản Phẩm lại nhé!'
      };
    }

    // Tự động cuộn mượt để tải hình ảnh lazy-load
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 550);
      await page.waitForTimeout(650);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(900);

    // Tự động rê chuột / click nhẹ qua các thumbnail ảnh sản phẩm nhỏ (nếu đang ở trang chi tiết 1 sản phẩm) để lấy ảnh HD
    const thumbHandles = await page.$$('img');
    let clickedThumbs = 0;
    for (const handle of thumbHandles) {
      if (clickedThumbs >= 6) break;
      try {
        const box = await handle.boundingBox();
        if (box && box.width >= 48 && box.width <= 110 && box.height >= 48 && box.height <= 110 && box.y < 700) {
          await handle.hover().catch(() => {});
          await page.waitForTimeout(220);
          clickedThumbs++;
        }
      } catch {}
    }

    // Trích xuất dữ liệu chuẩn từ JSON-LD + DOM hiển thị thực tế trên trình duyệt
    const extracted = await page.evaluate(() => {
      const url = location.href;
      const platform = url.includes('tiktok') ? 'tiktok' : 'shopee';
      const results = [];

      // 1. Thử đọc Schema Product chuẩn (JSON-LD) nếu có
      let ldProduct = null;
      document.querySelectorAll('script[type="application/ld+json"]').forEach((sc) => {
        try {
          const parsed = JSON.parse(sc.textContent || '{}');
          const list = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of list) {
            if (item && item['@type'] === 'Product' && item.name) {
              ldProduct = item;
            }
          }
        } catch {}
      });

      const isSingleProductUrl =
        /-i\.\d+\.\d+/.test(url) ||
        /\/product\/\d+/.test(url) ||
        /\/view\/product\//.test(url) ||
        Boolean(ldProduct);

      if (isSingleProductUrl) {
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

        // Quét giá hiển thị trực tiếp trên DOM nếu JSON-LD thiếu
        const priceCandidates = [];
        document.querySelectorAll('div, span').forEach((el) => {
          if (el.children.length > 0) return;
          const t = (el.innerText || '').trim();
          if (/^[₫đ]?\s*\d{2,3}([.,]\d{3})+\s*[₫đ]?$/.test(t)) {
            const digits = parseInt(t.replace(/[^\d]/g, ''), 10);
            if (digits >= 15000 && digits <= 20000000) {
              const style = window.getComputedStyle(el);
              if (style.textDecorationLine.includes('line-through')) {
                if (!originalPrice) originalPrice = digits;
              } else {
                priceCandidates.push(digits);
              }
            }
          }
        });
        if (!price && priceCandidates.length > 0) {
          price = priceCandidates[0];
        }

        // Lấy bộ ảnh chất lượng cao
        const images = [];
        if (ldProduct?.image) {
          const ldImgs = Array.isArray(ldProduct.image) ? ldProduct.image : [ldProduct.image];
          ldImgs.forEach((u) => {
            if (typeof u === 'string' && u.startsWith('http') && !images.includes(u)) images.push(u);
          });
        }
        document.querySelectorAll('img').forEach((img) => {
          const src = (img.currentSrc || img.src || '').replace(/_tn$/, '');
          if (
            src.startsWith('http') &&
            (img.naturalWidth >= 280 || img.width >= 260) &&
            !src.includes('avatar') &&
            !src.includes('icon') &&
            !images.includes(src)
          ) {
            images.push(src);
          }
        });

        // Quét phân loại Màu sắc / Kích cỡ từ các nút chọn phân loại
        const sizes = [];
        const colors = [];
        document.querySelectorAll('button, [role="radio"], [aria-label]').forEach((btn) => {
          const txt = (btn.innerText || '').trim();
          if (!txt || txt.length > 24 || btn.children.length > 2) return;
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
          results.push({
            name,
            price: price || 199000,
            originalPrice: originalPrice || 0,
            images: images.slice(0, 8),
            sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
            colors: colors.length > 0 ? colors : ['Theo hình'],
            description: String(description).slice(0, 900),
            sourcePlatform: platform,
            sourceUrl: url,
            isFlashSale: true
          });
        }
      }

      // 2. Nếu là trang Danh sách cả Shop (nhiều thẻ sản phẩm <a>)
      if (results.length === 0) {
        const seenUrls = new Set();
        document.querySelectorAll('a[href]').forEach((a) => {
          if (results.length >= 20) return;
          const href = a.href || '';
          const isProdLink =
            /-i\.\d+\.\d+/.test(href) ||
            /\/product\/\d+/.test(href) ||
            /\/view\/product\//.test(href);
          if (!isProdLink || seenUrls.has(href)) return;

          const imgEl = a.querySelector('img');
          const imgSrc = imgEl ? (imgEl.currentSrc || imgEl.src || '').replace(/_tn$/, '') : '';
          const rawText = (a.innerText || '').trim();
          if (!rawText || rawText.length < 6) return;

          const lines = rawText
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 2);

          const titleLine = lines.find((l) => l.length >= 10 && !/^[₫đ\d.,%\s-]+$/.test(l));
          const priceMatch =
            rawText.match(/(\d{2,3}(?:[.,]\d{3})+)\s*[₫đ]?/) ||
            rawText.match(/[₫đ]\s*(\d{2,3}(?:[.,]\d{3})+)/);

          if (titleLine) {
            seenUrls.add(href);
            results.push({
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

      return results;
    });

    console.log(`✅ Đã bóc tách được ${extracted.length} sản phẩm từ "${pageTitle}" (${finalUrl})`);
    // Giữ tab mở thêm 1.5s cho người dùng nhìn thấy rồi đóng tab con (giữ nguyên cửa sổ profile để nhớ đăng nhập)
    await page.waitForTimeout(1500);
    await page.close().catch(() => {});

    if (extracted.length === 0) {
      return {
        success: false,
        products: [],
        message:
          'Chưa tìm thấy sản phẩm trên trang này. Hãy dán trực tiếp link chi tiết 1 sản phẩm Shopee/TikTok Shop hoặc đảm bảo bạn đã đăng nhập trên cửa sổ Chrome của công cụ nhé!'
      };
    }

    return {
      success: true,
      products: extracted
    };
  } catch (err) {
    await page.close().catch(() => {});
    return {
      success: false,
      products: [],
      message: `Lỗi khi điều khiển trình duyệt: ${err.message}`
    };
  }
}

// Local HTTP Bridge cho trang /shop-admin gọi trực tiếp từ trình duyệt người dùng
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Request-Private-Network');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true, agent: 'NA 2HAND Playwright Companion', port: PORT }));
  }

  if (req.method === 'POST' && req.url === '/extract') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { targetUrl, serverUrl, syncKey } = JSON.parse(body || '{}');
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, message: 'Thiếu targetUrl!' }));
        }

        const result = await extractFromShopeeOrTiktok(targetUrl);
        if (!result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify(result));
        }

        // Đẩy thẳng danh sách sản phẩm vừa cào được lên Server Shop (MongoDB `na2hand_shop`)
        if (serverUrl && syncKey) {
          const importRes = await fetch(`${serverUrl.replace(/\/$/, '')}/api/shop/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sync-Key': syncKey
            },
            body: JSON.stringify({ products: result.products })
          });
          const importJson = await importRes.json();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify(importJson));
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(
          JSON.stringify({
            success: true,
            products: result.products,
            message: `Đã lấy được ${result.products.length} sản phẩm!`
          })
        );
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('==============================================================');
  console.log(`🎀 NA 2HAND Playwright Browser Sync đang chạy tại: http://127.0.0.1:${PORT}`);
  console.log('🚀 Giờ bạn hãy mở trang /shop-admin -> Tab 3 -> Bấm "Mở Trình Duyệt & Kéo Sản Phẩm"!');
  console.log('💡 Lần đầu mở Shopee/TikTok nếu sàn hỏi đăng nhập, bạn chỉ cần đăng nhập 1 lần trên cửa sổ Chrome bật lên, các lần sau tool tự nhớ phiên của bạn!');
  console.log('==============================================================');
});
