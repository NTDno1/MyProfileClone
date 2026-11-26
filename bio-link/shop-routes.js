const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { rewriteLegacyBioUrls, uploadToFileStorage } = require('./file-storage-client');

const DEFAULT_CATEGORIES = [
  { id: 'vay-dam', name: 'Đầm & Váy Tiểu Thư', icon: '👗', slug: 'vay-dam' },
  { id: 'ao-xinh', name: 'Áo Kiểu & Cardigan', icon: '👚', slug: 'ao-xinh' },
  { id: 'chan-vay', name: 'Chân Váy & Quần Xinh', icon: '🎀', slug: 'chan-vay' },
  { id: 'set-bo', name: 'Set Đồ Phối Sẵn', icon: '🌸', slug: 'set-bo' },
  { id: 'phu-kien', name: 'Túi Xách & Phụ Kiện', icon: '👜', slug: 'phu-kien' },
  { id: '2hand-vip', name: '2Hand Tuyển Chọn', icon: '✨', slug: '2hand-vip' }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Đầm Babydoll Hoa Nhí Nơ Ngực Tiểu Thư Hàn Quốc',
    category: 'vay-dam',
    price: 245000,
    originalPrice: 350000,
    images: [
      '/media/bio-link/girlfriend-1.jpg',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Hồng Phấn', 'Kem Sữa'],
    stock: 15,
    sold: 68,
    rating: 5.0,
    reviewCount: 24,
    isFlashSale: true,
    isFeatured: true,
    isNew: true,
    sourcePlatform: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/@na2hand3',
    description: 'Thiết kế babydoll bồng bềnh che khuyết điểm cực đỉnh, chất voan tơ 2 lớp mềm mịn có lót lụa mát rượi. Mặc đi cafe, hẹn hò hay chụp ảnh đều xinh lung linh ✨',
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Áo Len Kẻ Sọc Cổ Tròn Phong Cách Nhật Bản Cute',
    category: 'ao-xinh',
    price: 189000,
    originalPrice: 260000,
    images: [
      '/media/bio-link/girlfriend-1.jpg',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=85'
    ],
    sizes: ['Freesize (< 58kg)'],
    colors: ['Đỏ Trắng Navy', 'Hồng Kem'],
    stock: 12,
    sold: 93,
    rating: 4.9,
    reviewCount: 31,
    isFlashSale: true,
    isFeatured: true,
    isNew: false,
    sourcePlatform: 'shopee',
    sourceUrl: 'https://s.shopee.vn/8VAfrswNOG',
    description: 'Áo len lông thỏ mềm êm không dặm ngứa, phối sọc trẻ trung tôn da trắng hồng rạng rỡ. Hàng tuyển chọn thơm phức đã giặt hấp kỹ càng 🌸',
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Áo Hai Dây Gân Tăm Cúc Ngực Xinh Xắn Dạo Phố',
    category: '2hand-vip',
    price: 125000,
    originalPrice: 185000,
    images: [
      '/media/bio-link/girlfriend-2.jpg',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=85'
    ],
    sizes: ['S', 'M'],
    colors: ['Xám Khói', 'Trắng Tinh', 'Hồng Baby'],
    stock: 9,
    sold: 52,
    rating: 5.0,
    reviewCount: 19,
    isFlashSale: false,
    isFeatured: true,
    isNew: true,
    sourcePlatform: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/@na2hand154',
    description: 'Chất thun tăm co giãn 4 chiều ôm dáng nhẹ nhàng, hàng cúc bọc xinh xỉu. Phối cùng cardigan mỏng hoặc chân váy xếp ly đều chuẩn vibe Hàn Quốc 🎀',
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Set Áo Khoác Tweed Hồng Pastel & Chân Váy Chữ A',
    category: 'set-bo',
    price: 329000,
    originalPrice: 480000,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=85'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Hồng Phấn Ánh Kim', 'Trắng Ngọc Trai'],
    stock: 7,
    sold: 41,
    rating: 4.9,
    reviewCount: 16,
    isFlashSale: true,
    isFeatured: true,
    isNew: true,
    sourcePlatform: 'shopee',
    sourceUrl: 'https://s.shopee.vn/8VAfrswNOG',
    description: 'Set dạ tweed dệt sợi kim tuyến lấp lánh nhẹ dưới nắng, cúc ngọc trai sang chảnh chuẩn tiểu thư đi tiệc, đi làm hay du lịch Đà Lạt ✨',
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    name: 'Chân Váy Xếp Ly Dáng Ngắn Kèm Quần Bảo Hộ Coquette',
    category: 'chan-vay',
    price: 159000,
    originalPrice: 220000,
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=85'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Trắng Sữa', 'Hồng Pastel', 'Đen Basic'],
    stock: 22,
    sold: 114,
    rating: 4.9,
    reviewCount: 42,
    isFlashSale: false,
    isFeatured: false,
    isNew: false,
    sourcePlatform: 'tiktok',
    sourceUrl: 'https://www.tiktok.com/@na2hand3',
    description: 'Form chữ A cạp cao hack chân dài miên man, có sẵn lớp quần lót trong an toàn tuyệt đối cho các nàng tự tin diện đồ xinh 💖',
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    name: 'Túi Đeo Vai Kẹp Nách Đính Nơ Bạc Blink Blink',
    category: 'phu-kien',
    price: 175000,
    originalPrice: 250000,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85'
    ],
    sizes: ['Size 22cm'],
    colors: ['Hồng Nhũ', 'Bạc Blink', 'Trắng Kem'],
    stock: 10,
    sold: 37,
    rating: 5.0,
    reviewCount: 14,
    isFlashSale: true,
    isFeatured: false,
    isNew: true,
    sourcePlatform: 'shopee',
    sourceUrl: 'https://s.shopee.vn/8VAfrswNOG',
    description: 'Chiếc túi nơ ánh nhũ bắt sáng cực xinh cho các buổi hẹn tối, đựng vừa điện thoại Pro Max, son phấn và ví nhỏ gọn gàng ✨',
    enabled: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_COUPONS = [
  {
    id: 'cp-1',
    code: 'XINHXINH10',
    type: 'percent', // 'percent' | 'fixed'
    value: 10,
    minOrder: 150000,
    maxDiscount: 50000,
    description: 'Giảm 10% (tối đa 50k) cho đơn từ 150k',
    enabled: true
  },
  {
    id: 'cp-2',
    code: 'FREESHIP',
    type: 'fixed',
    value: 25000,
    minOrder: 199000,
    maxDiscount: 25000,
    description: 'Hỗ trợ 25k phí vận chuyển cho đơn từ 199k',
    enabled: true
  },
  {
    id: 'cp-3',
    code: 'NA2HAND30',
    type: 'fixed',
    value: 30000,
    minOrder: 350000,
    maxDiscount: 30000,
    description: 'Giảm ngay 30.000đ cho đơn từ 350k',
    enabled: true
  },
  {
    id: 'cp-4',
    code: 'NANGTHO15',
    type: 'percent',
    value: 15,
    minOrder: 250000,
    maxDiscount: 65000,
    description: 'Quà Hộp Nơ May Mắn: Giảm 15% (tối đa 65k) đơn từ 250k',
    enabled: true
  }
];

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    authorName: 'Khánh Linh 🌸',
    rating: 5,
    comment: 'Đầm bên ngoài xinh hơn cả trong ảnh luôn ạ, gói hàng giấy thơm phức mở ra ưng xỉu!',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'rev-2',
    productId: 'prod-2',
    authorName: 'Thảo Nhi 🎀',
    rating: 5,
    comment: 'Áo len mềm mịn cực kỳ, mặc lên tôn da lắm, shop tư vấn nhiệt tình dễ thương 10 điểm!',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

const DEFAULT_SHOP_SETTINGS = {
  shopName: 'NA 2HAND Boutique',
  tagline: 'Tiệm Đồ Xinh Lung Linh Cho Nàng Thơ ✨',
  announcement: '✨ FREESHIP ĐƠN TỪ 299K • NHẬP MÃ XINHXINH10 GIẢM NGAY 10% • ĐỒ TUYỂN CHỌN THƠM PHỨC 🌸',
  heroTitle: 'Tủ Đồ Xinh Lung Linh Của Nàng ✨',
  heroSubtitle: 'Tuyển chọn những mẫu váy đầm tiểu thư, áo xinh & 2hand cao cấp chỉ có1-0-2, gói hàng thơm tho gửi trao tận tay nàng ♡',
  heroBannerImage: '/media/bio-link/girlfriend-1.jpg',
  shippingFee: 25000,
  freeShipThreshold: 299000,
  codEnabled: true,
  qrEnabled: true,
  // 'custom_image' = hiển thị ảnh QR tự tải lên / ảnh mặc định; 'vietqr' = tự sinh QR theo số tài khoản + số tiền đơn hàng
  qrMode: 'custom_image',
  qrImageUrl: '/media/bio-link/cute-qr-placeholder.svg',
  bankBin: '970422', // MB Bank
  bankName: 'MB Bank (Ngân hàng Quân Đội)',
  bankAccountNo: '0359427135',
  bankAccountName: 'NA 2HAND SHOP',
  qrNotePrefix: 'NA2HAND',
  zaloPhone: '0359427135',
  messengerUrl: 'https://www.facebook.com/anganh.764617',
  shopeeShopUrl: 'https://s.shopee.vn/8VAfrswNOG',
  tiktokShopUrl: 'https://www.tiktok.com/@na2hand3',
  liveProofEnabled: true,
  telegramBotToken: '',
  telegramChatId: '',
  syncApiKey: 'na2hand_sync_' + crypto.randomBytes(8).toString('hex')
};

function registerShopRoutes(app, { dataDir, getMongoDb, requireAuth, recordAnalyticsEvent }) {
  const SHOP_FILE = path.join(dataDir, 'shop-store.json');

  function loadLocalShopData() {
    try {
      if (!fs.existsSync(SHOP_FILE)) {
        const initial = {
          settings: DEFAULT_SHOP_SETTINGS,
          categories: DEFAULT_CATEGORIES,
          products: DEFAULT_PRODUCTS,
          coupons: DEFAULT_COUPONS,
          orders: [],
          reviews: DEFAULT_REVIEWS
        };
        fs.writeFileSync(SHOP_FILE, JSON.stringify(initial, null, 2), 'utf8');
        return JSON.parse(JSON.stringify(initial));
      }
      const parsed = JSON.parse(fs.readFileSync(SHOP_FILE, 'utf8'));
      return {
        settings: { ...DEFAULT_SHOP_SETTINGS, ...(parsed.settings || {}) },
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
        products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_PRODUCTS,
        coupons: Array.isArray(parsed.coupons) ? parsed.coupons : DEFAULT_COUPONS,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : DEFAULT_REVIEWS
      };
    } catch (e) {
      return {
        settings: { ...DEFAULT_SHOP_SETTINGS },
        categories: [...DEFAULT_CATEGORIES],
        products: [...DEFAULT_PRODUCTS],
        coupons: [...DEFAULT_COUPONS],
        orders: [],
        reviews: [...DEFAULT_REVIEWS]
      };
    }
  }

  function saveLocalShopData(store) {
    fs.writeFileSync(SHOP_FILE, JSON.stringify(store, null, 2), 'utf8');
  }

  // Sync between MongoDB `na2hand_shop` database and local cache
  // (auto-rewrites legacy /uploads/... links -> /media/bio-link/... served by `file-storage` container)
  async function getShopStore() {
    const raw = await getShopStoreRaw();
    // Ensure NANGTHO15 lucky-box coupon exists for interactive gift box
    if (Array.isArray(raw.coupons) && !raw.coupons.some((c) => c.code === 'NANGTHO15')) {
      raw.coupons.push({
        id: 'cp-4',
        code: 'NANGTHO15',
        type: 'percent',
        value: 15,
        minOrder: 250000,
        maxDiscount: 65000,
        description: 'Quà Hộp Nơ May Mắn: Giảm 15% (tối đa 65k) đơn từ 250k',
        enabled: true
      });
    }
    const migrated = rewriteLegacyBioUrls(raw);
    if (migrated.changed) {
      saveShopStore(migrated.data).catch(() => {});
    }
    return migrated.data;
  }

  async function getShopStoreRaw() {
    const local = loadLocalShopData();
    if (Array.isArray(local.products) && repairAndMigrateProductsStore(local.products)) {
      saveLocalShopData(local);
    }
    const db = getMongoDb();
    if (!db) return local;

    try {
      const col = db.collection('shop_state');
      const remote = await col.findOne({ _id: 'na2hand_main_store' });
      if (remote && remote.store) {
        const merged = {
          settings: { ...DEFAULT_SHOP_SETTINGS, ...(remote.store.settings || {}) },
          categories: remote.store.categories || local.categories,
          products: remote.store.products || local.products,
          coupons: remote.store.coupons || local.coupons,
          orders: remote.store.orders || local.orders,
          reviews: remote.store.reviews || local.reviews
        };
        let settingsChanged = false;
        if (!merged.settings.zaloPhone || merged.settings.zaloPhone === '0983877462') {
          merged.settings.zaloPhone = '0359427135';
          settingsChanged = true;
        }
        if (merged.settings.bankAccountNo === '0983877462') {
          merged.settings.bankAccountNo = '0359427135';
          settingsChanged = true;
        }
        if (Array.isArray(merged.products)) {
          if (repairAndMigrateProductsStore(merged.products)) {
            settingsChanged = true;
          }
        }
        saveLocalShopData(merged);
        if (settingsChanged) {
          await col.updateOne(
            { _id: 'na2hand_main_store' },
            { $set: { store: merged, updatedAt: new Date() } }
          );
          await syncCollectionsForAtlasUI(db, merged);
        }
        return merged;
      } else {
        await col.updateOne(
          { _id: 'na2hand_main_store' },
          { $set: { store: local, updatedAt: new Date() } },
          { upsert: true }
        );
        // Also mirror individual collections in `na2hand_shop` for easy browsing in MongoDB Atlas UI!
        await syncCollectionsForAtlasUI(db, local);
        return local;
      }
    } catch (err) {
      return local;
    }
  }

  async function syncCollectionsForAtlasUI(db, store) {
    if (!db) return;
    try {
      // Mirror products & orders into dedicated collections in `na2hand_shop` so Atlas Data Explorer shows neat tables
      const prodCol = db.collection('products');
      await prodCol.deleteMany({});
      if (store.products && store.products.length > 0) {
        await prodCol.insertMany(store.products.map((p) => ({ ...p })));
      }

      const ordCol = db.collection('orders');
      await ordCol.deleteMany({});
      if (store.orders && store.orders.length > 0) {
        await ordCol.insertMany(store.orders.map((o) => ({ ...o })));
      }
    } catch {}
  }

  async function saveShopStore(store) {
    saveLocalShopData(store);
    const db = getMongoDb();
    if (db) {
      try {
        await db.collection('shop_state').updateOne(
          { _id: 'na2hand_main_store' },
          { $set: { store, updatedAt: new Date() } },
          { upsert: true }
        );
        await syncCollectionsForAtlasUI(db, store);
      } catch (err) {
        console.warn('[Shop MongoDB] Lỗi lưu dữ liệu shop:', err.message);
      }
    }
  }

  // Send Telegram Notification on New Order
  async function notifyOrderTelegram(settings, order) {
    const token = (settings.telegramBotToken || '').trim();
    const chatId = (settings.telegramChatId || '').trim();
    if (!token || !chatId) return;

    try {
      const itemsText = (order.items || [])
        .map((it) => `  • ${it.name} (${it.color || ''} ${it.size || ''}) x${it.qty} = ${(it.price * it.qty).toLocaleString('vi-VN')}đ`)
        .join('\n');

      const text = [
        `🛍️ <b>ĐƠN HÀNG MỚI TỪ SHOP NA 2HAND!</b> ✨`,
        `━━━━━━━━━━━━━━━━━━`,
        `🧾 <b>Mã đơn:</b> <code>${order.orderCode}</code>`,
        `👧 <b>Khách hàng:</b> ${order.customerName}`,
        `📞 <b>SĐT:</b> <code>${order.customerPhone}</code>`,
        `📍 <b>Địa chỉ:</b> ${order.address}, ${order.district || ''}, ${order.province || ''}`,
        `💳 <b>Thanh toán:</b> ${order.paymentMethod === 'qr' ? '📱 Quét mã QR trực tiếp' : '💵 Nhận hàng thanh toán (COD)'}`,
        `📦 <b>Sản phẩm:</b>\n${itemsText}`,
        `💰 <b>Tổng thanh toán:</b> <b>${Number(order.totalAmount).toLocaleString('vi-VN')}đ</b>`,
        order.note ? `📝 <b>Ghi chú:</b> ${order.note}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML'
        })
      });
    } catch {}
  }

  // Middleware allowing either Admin Bearer Token OR Browser Sync Key
  async function requireAdminOrSyncKey(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sync-Key');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    }

    const syncKey = req.headers['x-sync-key'] || req.body?.syncKey || req.query?.syncKey;
    if (syncKey) {
      const store = await getShopStore();
      if (syncKey === store.settings.syncApiKey) {
        return next();
      }
    }
    return requireAuth(req, res, next);
  }

  app.options('/api/shop/import', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sync-Key');
    res.status(200).end();
  });

  // =========================================================================
  // 1. PUBLIC STOREFRONT ROUTES
  // =========================================================================

  app.get('/api/shop/storefront', async (req, res) => {
    if (typeof recordAnalyticsEvent === 'function') {
      recordAnalyticsEvent(req, {
        type: 'shop_view',
        targetTitle: 'Vào Cửa hàng /shop',
        targetUrl: '/shop'
      }).catch(() => {});
    }
    const store = await getShopStore();
    const publicSettings = { ...store.settings };
    delete publicSettings.telegramBotToken;
    delete publicSettings.syncApiKey;

    res.json({
      success: true,
      settings: publicSettings,
      categories: store.categories,
      products: (store.products || []).filter((p) => p.enabled !== false && !p.isLocked),
      coupons: (store.coupons || []).filter((c) => c.enabled !== false),
      reviews: (store.reviews || []).slice(0, 50)
    });
  });

  app.post('/api/shop/coupon/validate', async (req, res) => {
    const { code, subtotal } = req.body || {};
    const cleanCode = String(code || '').trim().toUpperCase();
    const amount = Number(subtotal || 0);

    const store = await getShopStore();
    const found = (store.coupons || []).find(
      (c) => c.enabled !== false && String(c.code).toUpperCase() === cleanCode
    );

    if (!found) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn nàng ơi 🥺' });
    }

    if (amount < Number(found.minOrder || 0)) {
      return res.status(400).json({
        success: false,
        message: `Đơn tối thiểu ${Number(found.minOrder).toLocaleString('vi-VN')}đ mới áp dụng được mã ${found.code} nhé!`
      });
    }

    let discount =
      found.type === 'percent'
        ? Math.round((amount * Number(found.value)) / 100)
        : Number(found.value);

    if (found.maxDiscount && discount > Number(found.maxDiscount)) {
      discount = Number(found.maxDiscount);
    }
    discount = Math.min(discount, amount);

    res.json({
      success: true,
      coupon: found,
      discount,
      message: `Áp dụng mã ${found.code} giảm ngay ${discount.toLocaleString('vi-VN')}đ thành công! ✨`
    });
  });

  // Place Order (Supports Direct QR Scan & COD)
  app.post('/api/shop/orders', async (req, res) => {
    try {
      const body = req.body || {};
      const items = Array.isArray(body.items) ? body.items : [];
      if (!body.customerName || !body.customerPhone || !body.address || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ Họ tên, Số điện thoại, Địa chỉ nhận hàng và chọn ít nhất 1 sản phẩm nhé!'
        });
      }

      const store = await getShopStore();
      let subtotal = 0;
      const normalizedItems = [];

      for (const cartItem of items) {
        const prod = (store.products || []).find((p) => p.id === cartItem.productId);
        const qty = Math.max(1, Number(cartItem.qty || 1));
        const matchedVar =
          prod && Array.isArray(prod.variants) && cartItem.variantLabel
            ? prod.variants.find(
                (v) => String(v.label || '').trim().toLowerCase() === String(cartItem.variantLabel || '').trim().toLowerCase()
              )
            : null;

        const unitPrice = matchedVar && Number(matchedVar.price) > 0
          ? Number(matchedVar.price)
          : prod
          ? Number(prod.price)
          : Number(cartItem.price || 0);
        subtotal += unitPrice * qty;

        normalizedItems.push({
          productId: cartItem.productId,
          name: prod ? prod.name : cartItem.name,
          image:
            (matchedVar && matchedVar.image) ||
            cartItem.image ||
            (prod && prod.images && prod.images[0] ? prod.images[0] : ''),
          price: unitPrice,
          qty,
          size: cartItem.size || 'Freesize',
          color: cartItem.color || 'Mặc định',
          variantLabel: cartItem.variantLabel || ''
        });

        if (prod) {
          if (matchedVar && matchedVar.stock !== undefined) {
            matchedVar.stock = Math.max(0, Number(matchedVar.stock || 0) - qty);
          }
          prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
          prod.sold = Number(prod.sold || 0) + qty;
        }
      }

      // Coupon calculation
      let discount = 0;
      let appliedCoupon = '';
      if (body.couponCode) {
        const cleanCode = String(body.couponCode).trim().toUpperCase();
        const cp = (store.coupons || []).find(
          (c) => c.enabled !== false && String(c.code).toUpperCase() === cleanCode
        );
        if (cp && subtotal >= Number(cp.minOrder || 0)) {
          discount =
            cp.type === 'percent'
              ? Math.round((subtotal * Number(cp.value)) / 100)
              : Number(cp.value);
          if (cp.maxDiscount && discount > Number(cp.maxDiscount)) {
            discount = Number(cp.maxDiscount);
          }
          discount = Math.min(discount, subtotal);
          appliedCoupon = cp.code;
        }
      }

      const freeThreshold = Number(store.settings.freeShipThreshold || 299000);
      const baseShip = Number(store.settings.shippingFee || 25000);
      const shippingFee = subtotal >= freeThreshold ? 0 : baseShip;
      const totalAmount = Math.max(0, subtotal - discount + shippingFee);

      const orderCode = `NA${String(Date.now()).slice(-6)}`;
      const paymentMethod = body.paymentMethod === 'qr' ? 'qr' : 'cod';

      // Build QR payment payload
      const transferNote = `${store.settings.qrNotePrefix || 'NA2HAND'} ${orderCode}`;
      let qrDisplayUrl = store.settings.qrImageUrl || '/media/bio-link/cute-qr-placeholder.svg';
      if (
        store.settings.qrMode === 'vietqr' &&
        store.settings.bankBin &&
        store.settings.bankAccountNo
      ) {
        qrDisplayUrl = `https://img.vietqr.io/image/${encodeURIComponent(
          store.settings.bankBin
        )}-${encodeURIComponent(
          store.settings.bankAccountNo
        )}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
          transferNote
        )}&accountName=${encodeURIComponent(store.settings.bankAccountName || '')}`;
      }

      const newOrder = {
        id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        orderCode,
        customerName: String(body.customerName).trim(),
        customerPhone: String(body.customerPhone).trim(),
        customerEmail: String(body.customerEmail || '').trim(),
        province: String(body.province || '').trim(),
        district: String(body.district || '').trim(),
        address: String(body.address).trim(),
        note: String(body.note || '').trim(),
        scentChoice: String(body.scentChoice || 'Hương Đào Trắng').trim(),
        giftWrap: Boolean(body.giftWrap),
        giftCardMessage: String(body.giftCardMessage || '').trim(),
        items: normalizedItems,
        subtotal,
        discount,
        couponCode: appliedCoupon,
        shippingFee,
        totalAmount,
        paymentMethod, // 'qr' | 'cod'
        paymentStatus: 'pending', // 'pending' | 'customer_confirmed_qr' | 'paid'
        orderStatus: 'pending', // 'pending' | 'confirmed' | 'packing' | 'shipping' | 'completed' | 'cancelled'
        transferNote,
        qrDisplayUrl,
        createdAt: new Date().toISOString()
      };

      store.orders.unshift(newOrder);
      await saveShopStore(store);
      notifyOrderTelegram(store.settings, newOrder);
      if (typeof recordAnalyticsEvent === 'function') {
        recordAnalyticsEvent(req, {
          type: 'order',
          targetTitle: `Đặt đơn #${newOrder.orderCode} (${Number(newOrder.totalAmount).toLocaleString('vi-VN')}đ)`,
          targetUrl: '/shop'
        }).catch(() => {});
      }

      res.status(201).json({
        success: true,
        message: 'Đặt hàng thành công! Cảm ơn nàng đã ủng hộ tiệm nhé 💖',
        order: newOrder,
        paymentInfo: {
          method: paymentMethod,
          qrDisplayUrl,
          bankName: store.settings.bankName,
          bankAccountNo: store.settings.bankAccountNo,
          bankAccountName: store.settings.bankAccountName,
          transferNote,
          totalAmount
        }
      });
    } catch (err) {
      console.error('Order creation error:', err);
      res.status(500).json({ success: false, message: 'Có lỗi khi tạo đơn hàng, vui lòng thử lại!' });
    }
  });

  // Customer confirms they scanned and paid via QR (with optional transfer screenshot uploaded to file-storage)
  app.post('/api/shop/orders/:orderCode/confirm-qr', async (req, res) => {
    const code = String(req.params.orderCode || '').trim().toUpperCase();
    const store = await getShopStore();
    const order = (store.orders || []).find((o) => String(o.orderCode).toUpperCase() === code);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    const { receiptDataUrl } = req.body || {};
    if (receiptDataUrl && typeof receiptDataUrl === 'string' && receiptDataUrl.startsWith('data:image/')) {
      try {
        const up = await uploadToFileStorage({
          project: 'bio-link',
          folder: 'receipts',
          filename: `bill_${order.orderCode}.jpg`,
          dataUrl: receiptDataUrl
        });
        order.receiptImageUrl = up.url;
      } catch (e) {}
    }

    order.paymentStatus = 'customer_confirmed_qr';
    order.updatedAt = new Date().toISOString();
    await saveShopStore(store);
    res.json({
      success: true,
      message: 'Tiệm đã nhận được xác nhận chuyển khoản của nàng! Tụi mình sẽ kiểm tra và gói hàng ướp hương ngay nhé.',
      order
    });
  });

  // Customer cancels a pending order (restores stock automatically)
  app.post('/api/shop/orders/:orderCode/cancel', async (req, res) => {
    const code = String(req.params.orderCode || '').trim().toUpperCase();
    const phone = String(req.body?.phone || '').replace(/\s+/g, '');
    const store = await getShopStore();
    const order = (store.orders || []).find((o) => String(o.orderCode).toUpperCase() === code);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    if (phone && String(order.customerPhone || '').replace(/\s+/g, '') !== phone) {
      return res.status(403).json({ success: false, message: 'Số điện thoại xác thực không khớp với đơn hàng.' });
    }
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được tiệm xác nhận/đóng gói nên không thể tự hủy. Nàng nhắn Zalo để tiệm hỗ trợ nhé!'
      });
    }
    order.orderStatus = 'cancelled';
    order.updatedAt = new Date().toISOString();
    for (const it of order.items || []) {
      const prod = (store.products || []).find((p) => p.id === it.productId);
      if (prod) {
        prod.stock = Number(prod.stock || 0) + Number(it.qty || 1);
        prod.sold = Math.max(0, Number(prod.sold || 0) - Number(it.qty || 1));
      }
    }
    await saveShopStore(store);
    res.json({ success: true, order, message: `Đã hủy đơn #${order.orderCode} thành công.` });
  });

  // Order Tracking Lookup by Phone or Order Code
  app.get('/api/shop/orders/track', async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 4) {
      return res.status(400).json({ success: false, message: 'Nhập Mã đơn hàng (VD: NA123456) hoặc Số điện thoại đặt hàng nhé!' });
    }
    const store = await getShopStore();
    const matched = (store.orders || []).filter(
      (o) =>
        String(o.orderCode || '').toLowerCase() === q ||
        String(o.customerPhone || '').replace(/\s+/g, '') === q.replace(/\s+/g, '')
    );
    res.json({
      success: true,
      orders: matched.slice(0, 20)
    });
  });

  // Customer Product Review (with optional OOTD photo stored in file-storage container)
  app.post('/api/shop/reviews', async (req, res) => {
    const { productId, authorName, rating, comment, photoDataUrl, fitNote } = req.body || {};
    if (!productId || !authorName || !comment) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và nội dung đánh giá nhé!' });
    }
    const store = await getShopStore();
    const star = Math.min(5, Math.max(1, Number(rating || 5)));

    let photoUrl = '';
    if (photoDataUrl && typeof photoDataUrl === 'string' && photoDataUrl.startsWith('data:image/')) {
      try {
        const up = await uploadToFileStorage({
          project: 'bio-link',
          folder: 'reviews',
          filename: `ootd_${Date.now()}.jpg`,
          dataUrl: photoDataUrl
        });
        photoUrl = up.url;
      } catch (e) {}
    }

    const rev = {
      id: `rev_${Date.now()}`,
      productId,
      authorName: String(authorName).trim().slice(0, 50),
      rating: star,
      comment: String(comment).trim().slice(0, 500),
      fitNote: String(fitNote || '').trim().slice(0, 60),
      photoUrl,
      createdAt: new Date().toISOString()
    };
    store.reviews.unshift(rev);

    const prod = (store.products || []).find((p) => p.id === productId);
    if (prod) {
      const prodRevs = store.reviews.filter((r) => r.productId === productId);
      const avg = prodRevs.reduce((s, r) => s + Number(r.rating || 5), 0) / prodRevs.length;
      prod.rating = Number(avg.toFixed(1));
      prod.reviewCount = prodRevs.length;
    }

    await saveShopStore(store);
    res.json({ success: true, review: rev, message: 'Cảm ơn đánh giá đáng yêu của nàng! 💕' });
  });

  // =========================================================================
  // 2. ADMIN E-COMMERCE MANAGEMENT ROUTES
  // =========================================================================

  app.get('/api/shop/admin/overview', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const db = getMongoDb();

    const validOrders = (store.orders || []).filter((o) => o.orderStatus !== 'cancelled');
    const totalRevenue = validOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const pendingOrders = (store.orders || []).filter((o) => o.orderStatus === 'pending').length;
    const qrWaitingOrders = (store.orders || []).filter((o) => o.paymentStatus === 'customer_confirmed_qr').length;

    res.json({
      success: true,
      mongoConnected: Boolean(db),
      mongoDbName: db ? db.databaseName : 'na2hand_shop',
      metrics: {
        totalRevenue,
        totalOrders: (store.orders || []).length,
        pendingOrders,
        qrWaitingOrders,
        totalProducts: (store.products || []).length,
        lowStockProducts: (store.products || []).filter((p) => Number(p.stock || 0) <= 3).length
      },
      store
    });
  });

  // Save/Create Product
  app.post('/api/shop/admin/products', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const b = req.body || {};
    const rawSrc = cleanSourceUrl(b.sourceUrl || '');
    const platItemId = extractPlatformItemId(rawSrc);
    const newProd = {
      id: b.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: String(b.name || 'Sản phẩm mới').trim(),
      category: String(b.category || 'vay-dam'),
      price: Math.max(0, Number(b.price || 0)),
      maxPrice: Math.max(0, Number(b.maxPrice || b.price || 0)),
      originalPrice: Math.max(0, Number(b.originalPrice || b.price || 0)),
      images: Array.isArray(b.images) && b.images.length > 0 ? b.images.map(cleanCdnImageUrl) : ['/media/bio-link/girlfriend-1.jpg'],
      sizes: Array.isArray(b.sizes) ? b.sizes.filter(Boolean) : [],
      colors: Array.isArray(b.colors) ? b.colors.filter(Boolean) : [],
      variantGroupName: String(b.variantGroupName || 'Mẫu').trim(),
      variants: normalizeVariantsList(b.variants, b.price),
      stock: Math.max(0, Number(b.stock ?? 10)),
      sold: Math.max(0, Number(b.sold ?? 0)),
      rating: Number(b.rating || 5.0),
      reviewCount: Number(b.reviewCount || 1),
      isFlashSale: !!b.isFlashSale,
      isFeatured: b.isFeatured !== false,
      isNew: b.isNew !== false,
      isLocked: Boolean(b.isLocked),
      originType: platItemId ? 'cloned' : 'local',
      platformItemId: platItemId || '',
      sourcePlatform: platItemId ? (rawSrc.includes('tiktok') ? 'tiktok' : 'shopee') : (b.sourcePlatform || 'manual'),
      sourceUrl: rawSrc,
      description: String(b.description || ''),
      enabled: b.enabled !== false,
      createdAt: new Date().toISOString()
    };

    store.products.unshift(newProd);
    await saveShopStore(store);
    res.json({ success: true, product: newProd, message: 'Đã thêm sản phẩm mới vào cửa hàng! ✨' });
  });

  // Update Product
  app.put('/api/shop/admin/products/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const idx = (store.products || []).findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });

    const b = req.body || {};
    store.products[idx] = {
      ...store.products[idx],
      ...b,
      sourceUrl: b.sourceUrl !== undefined ? cleanSourceUrl(b.sourceUrl) : store.products[idx].sourceUrl,
      images: Array.isArray(b.images) ? b.images.map(cleanCdnImageUrl) : store.products[idx].images,
      variants: Array.isArray(b.variants)
        ? normalizeVariantsList(b.variants, b.price ?? store.products[idx].price)
        : store.products[idx].variants,
      price: b.price !== undefined ? Number(b.price) : store.products[idx].price,
      originalPrice: b.originalPrice !== undefined ? Number(b.originalPrice) : store.products[idx].originalPrice,
      stock: b.stock !== undefined ? Number(b.stock) : store.products[idx].stock,
      updatedAt: new Date().toISOString()
    };

    await saveShopStore(store);
    res.json({ success: true, product: store.products[idx], message: 'Đã cập nhật sản phẩm!' });
  });

  // Toggle Lock on a Single Product
  app.post('/api/shop/admin/products/:id/toggle-lock', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const prod = (store.products || []).find((p) => p.id === req.params.id);
    if (!prod) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });

    prod.isLocked = !prod.isLocked;
    prod.updatedAt = new Date().toISOString();
    await saveShopStore(store);
    res.json({
      success: true,
      isLocked: prod.isLocked,
      product: prod,
      message: prod.isLocked
        ? `🔒 Đã khóa "${prod.name.slice(0, 32)}..." (Ẩn trên web & bảo vệ không cho sửa/xóa)!`
        : `🔓 Đã mở khóa "${prod.name.slice(0, 32)}..." (Hiển thị trở lại trên web)!`
    });
  });

  // Bulk Lock / Unlock All Non-Platform-Cloned Local Web Products ("các sản phẩm sẵn trên web")
  app.post('/api/shop/admin/products/lock-local', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const shouldLock = req.body?.locked !== false;
    let count = 0;
    (store.products || []).forEach((p) => {
      if (!isPlatformClonedProduct(p)) {
        p.isLocked = shouldLock;
        count++;
      }
    });
    await saveShopStore(store);
    res.json({
      success: true,
      count,
      message: shouldLock
        ? `🔒 Đã khóa toàn bộ ${count} sản phẩm sẵn trên web (không phải clone từ sàn)!`
        : `🔓 Đã mở khóa ${count} sản phẩm sẵn trên web!`
    });
  });

  // Delete Product
  app.delete('/api/shop/admin/products/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const target = (store.products || []).find((p) => p.id === req.params.id);
    if (target && target.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm này đang được Khóa (🔒)! Hãy bấm Mở khóa trước nếu bạn thực sự muốn xóa.'
      });
    }
    store.products = (store.products || []).filter((p) => p.id !== req.params.id);
    await saveShopStore(store);
    res.json({ success: true, message: 'Đã xóa sản phẩm.' });
  });

  // Duplicate Product
  app.post('/api/shop/admin/products/:id/duplicate', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const orig = (store.products || []).find((p) => p.id === req.params.id);
    if (!orig) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm gốc.' });
    const clone = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: `${orig.name} (Bản sao)`,
      sold: 0,
      createdAt: new Date().toISOString()
    };
    store.products.unshift(clone);
    await saveShopStore(store);
    res.json({ success: true, product: clone, message: 'Đã nhân bản sản phẩm thành công!' });
  });

  // Delete Review
  app.delete('/api/shop/admin/reviews/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    store.reviews = (store.reviews || []).filter((r) => r.id !== req.params.id);
    await saveShopStore(store);
    res.json({ success: true, reviews: store.reviews, message: 'Đã xóa đánh giá.' });
  });

  // Update Order Status / Payment Status
  app.put('/api/shop/admin/orders/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const order = (store.orders || []).find((o) => o.id === req.params.id || o.orderCode === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });

    if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
    if (req.body.adminNote !== undefined) order.adminNote = req.body.adminNote;
    order.updatedAt = new Date().toISOString();

    await saveShopStore(store);
    res.json({ success: true, order, message: `Đã cập nhật trạng thái đơn ${order.orderCode}!` });
  });

  // Categories & Coupons Management
  app.post('/api/shop/admin/categories', requireAuth, async (req, res) => {
    const { name, icon } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Thiếu tên danh mục.' });
    const store = await getShopStore();
    const slug = String(name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

    const cat = { id: `${slug}-${Date.now().toString().slice(-3)}`, name: String(name).trim(), icon: icon || '🌸', slug };
    store.categories.push(cat);
    await saveShopStore(store);
    res.json({ success: true, categories: store.categories });
  });

  app.delete('/api/shop/admin/categories/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    store.categories = (store.categories || []).filter((c) => c.id !== req.params.id);
    await saveShopStore(store);
    res.json({ success: true, categories: store.categories });
  });

  app.post('/api/shop/admin/coupons', requireAuth, async (req, res) => {
    const b = req.body || {};
    if (!b.code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá.' });
    const store = await getShopStore();
    const cp = {
      id: `cp_${Date.now()}`,
      code: String(b.code).trim().toUpperCase(),
      type: b.type === 'percent' ? 'percent' : 'fixed',
      value: Number(b.value || 10),
      minOrder: Number(b.minOrder || 0),
      maxDiscount: Number(b.maxDiscount || 100000),
      description: String(b.description || ''),
      enabled: true
    };
    store.coupons.unshift(cp);
    await saveShopStore(store);
    res.json({ success: true, coupons: store.coupons, message: `Đã tạo mã ${cp.code}!` });
  });

  app.delete('/api/shop/admin/coupons/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    store.coupons = (store.coupons || []).filter((c) => c.id !== req.params.id);
    await saveShopStore(store);
    res.json({ success: true, coupons: store.coupons });
  });

  // Update Shop Settings & QR Payment Config
  app.put('/api/shop/admin/settings', requireAuth, async (req, res) => {
    const store = await getShopStore();
    const incoming = req.body || {};
    store.settings = {
      ...store.settings,
      ...incoming,
      shippingFee: Number(incoming.shippingFee ?? store.settings.shippingFee),
      freeShipThreshold: Number(incoming.freeShipThreshold ?? store.settings.freeShipThreshold),
      syncApiKey: store.settings.syncApiKey // preserve sync key unless regenerated
    };
    await saveShopStore(store);
    res.json({ success: true, settings: store.settings, message: 'Đã lưu cài đặt cửa hàng & thanh toán QR!' });
  });

  // =========================================================================
  // 3. SINGLE-CLICK AUTO SHOP SYNC + DEEP INNER VARIANT SYNC
  // =========================================================================
  async function saveImportedItemsToStore(rawProducts) {
    const store = await getShopStore();
    let addedCount = 0;
    let updatedCount = 0;
    let totalVariantsSynced = 0;
    const importedItems = [];

    for (const item of rawProducts) {
      if (!item || !item.name) continue;

      const cleanName = String(item.name).trim();
      const cleanedIncomingUrl = cleanSourceUrl(item.sourceUrl || '');
      const incomingItemId = item.platformItemId || extractPlatformItemId(cleanedIncomingUrl);

      // STRICT 1-TO-1 ISOLATION: Match ONLY platform-cloned products (NEVER touch local/built-in web products!)
      const existingIdx = (store.products || []).findIndex((p) => {
        if (!isPlatformClonedProduct(p)) return false;
        if (p.isLocked) return false;

        const existingUrl = cleanSourceUrl(p.sourceUrl || '');
        const existingItemId = p.platformItemId || extractPlatformItemId(existingUrl);

        if (incomingItemId && existingItemId) {
          return incomingItemId === existingItemId;
        }
        if (
          cleanedIncomingUrl &&
          existingUrl &&
          isSpecificProductUrl(cleanedIncomingUrl) &&
          cleanedIncomingUrl === existingUrl
        ) {
          return true;
        }
        if (!incomingItemId && !existingItemId) {
          return String(p.name || '').trim().toLowerCase() === cleanName.toLowerCase();
        }
        return false;
      });

      const prev = existingIdx >= 0 ? store.products[existingIdx] : null;
      const baseIncomingPrice = parsePriceVnd(item.price) || (prev ? prev.price : 110000);

      // 1-to-1 inner variants & per-variant prices
      const incomingVariants = normalizeVariantsList(item.variants, baseIncomingPrice);
      const finalVariants = Array.isArray(item.variants)
        ? incomingVariants
        : prev && Array.isArray(prev.variants)
        ? prev.variants
        : [];

      if (finalVariants.length > 0) {
        totalVariantsSynced += finalVariants.length;
      }

      // Compute exact min price & maxPrice across variants so price ranges & per-variant prices match Shopee 1-1!
      const inStockVarPrices = finalVariants
        .filter((v) => Number(v.stock ?? 0) > 0 && Number(v.price) > 0)
        .map((v) => Number(v.price));
      const allVarPrices = finalVariants
        .filter((v) => Number(v.price) > 0)
        .map((v) => Number(v.price));
      const pricePool = inStockVarPrices.length > 0 ? inStockVarPrices : allVarPrices;

      const cleanPrice = pricePool.length > 0 ? Math.min(...pricePool) : baseIncomingPrice;
      const maxVariantPrice = allVarPrices.length > 0 ? Math.max(...allVarPrices) : cleanPrice;
      const cleanMaxPrice = Math.max(cleanPrice, parsePriceVnd(item.maxPrice) || 0, maxVariantPrice);
      const rawOrig = parsePriceVnd(item.originalPrice);
      const cleanOrig = rawOrig > cleanMaxPrice ? rawOrig : cleanMaxPrice;

      const rawImgs = Array.isArray(item.images) ? item.images : [];
      const imgSet = [];
      const addImg = (u) => {
        const cu = cleanCdnImageUrl(u);
        if (cu && (cu.startsWith('http') || cu.startsWith('/media/')) && !imgSet.includes(cu)) {
          imgSet.push(cu);
        }
      };
      rawImgs.forEach(addImg);
      finalVariants.forEach((v) => {
        if (v.image) addImg(v.image);
      });
      if (imgSet.length === 0 && prev && Array.isArray(prev.images)) {
        prev.images.forEach(addImg);
      }

      let finalSourceUrl = cleanedIncomingUrl;
      if (prev && isSpecificProductUrl(prev.sourceUrl) && !isSpecificProductUrl(cleanedIncomingUrl)) {
        finalSourceUrl = cleanSourceUrl(prev.sourceUrl);
      }

      const platform =
        item.sourcePlatform ||
        (String(finalSourceUrl || '').includes('tiktok')
          ? 'tiktok'
          : prev?.sourcePlatform && prev.sourcePlatform !== 'manual'
          ? prev.sourcePlatform
          : 'shopee');

      const computedStock =
        finalVariants.length > 0
          ? finalVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stock ?? 0)), 0)
          : Number(item.stock ?? prev?.stock ?? 1);

      const derivedColors =
        finalVariants.length > 0
          ? finalVariants.map((v) => v.label)
          : Array.isArray(item.colors)
          ? item.colors.filter(Boolean)
          : [];

      // STRICT 1-TO-1 SIZE SYNC: If Shopee has NO Size tier, sizes MUST be [] (NEVER invent S/M/L or Freesize!)
      const derivedSizes = Array.isArray(item.sizes)
        ? item.sizes.map((s) => String(s || '').trim()).filter(Boolean)
        : [];

      const finalDesc =
        item.description && String(item.description).trim().length > 10
          ? String(item.description).trim()
          : prev?.description ||
            `Sản phẩm đồng bộ 1-1 trực tiếp từ ${platform === 'tiktok' ? 'TikTok Shop' : 'Shopee'} chính hãng của NA 2HAND.`;

      const productObj = {
        id: prev ? prev.id : `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        originType: 'cloned',
        platformItemId: incomingItemId || prev?.platformItemId || '',
        isLocked: prev ? Boolean(prev.isLocked) : false,
        name: cleanName,
        category: item.category || prev?.category || inferCategoryFromName(cleanName, store.categories),
        price: cleanPrice > 0 ? cleanPrice : 110000,
        maxPrice: cleanMaxPrice > cleanPrice ? cleanMaxPrice : cleanPrice,
        originalPrice: cleanOrig >= cleanMaxPrice ? cleanOrig : cleanMaxPrice,
        images: imgSet.length > 0 ? imgSet.slice(0, 25) : ['/media/bio-link/girlfriend-1.jpg'],
        sizes: derivedSizes,
        colors: derivedColors,
        variantGroupName: String(item.variantGroupName || prev?.variantGroupName || 'Mẫu').trim(),
        variants: finalVariants,
        stock: computedStock,
        sold: Number(item.sold ?? prev?.sold ?? 0),
        rating: Number(item.rating || prev?.rating || 5.0),
        reviewCount: Number(item.reviewCount || prev?.reviewCount || 5),
        isFlashSale: rawOrig > cleanMaxPrice,
        isFeatured: true,
        isNew: true,
        sourcePlatform: platform,
        sourceUrl: finalSourceUrl,
        description: finalDesc,
        enabled: prev ? prev.enabled !== false : true,
        createdAt: prev ? prev.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        store.products[existingIdx] = productObj;
        updatedCount++;
      } else {
        store.products.unshift(productObj);
        addedCount++;
      }
      importedItems.push(productObj);
    }

    if (importedItems.length > 0) {
      await saveShopStore(store);
    }
    return { addedCount, updatedCount, totalVariantsSynced, importedItems };
  }

  async function resolveShortShopUrl(inputUrl) {
    let current = String(inputUrl || '').trim();
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
    for (let hop = 0; hop < 6; hop++) {
      try {
        const res = await fetch(current, {
          redirect: 'manual',
          headers: { 'User-Agent': ua, 'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8' }
        });
        const loc = res.headers.get('location');
        if (loc && res.status >= 300 && res.status < 400) {
          current = new URL(loc, current).toString();
        } else {
          break;
        }
      } catch {
        break;
      }
    }
    try {
      const u = new URL(current);
      if (u.hostname.includes('shopee.vn') && !u.pathname.includes('/search')) {
        u.search = '';
        current = u.toString();
      }
    } catch {}
    return cleanSourceUrl(current);
  }

  function extractProductsFromHtmlOrJson(html, baseUrl) {
    const platform = String(baseUrl || '').includes('tiktok') ? 'tiktok' : 'shopee';
    const found = [];
    const seenKeys = new Set();

    const pushCandidate = (cand) => {
      if (!cand || !cand.name) return;
      const cleanName = String(cand.name)
        .replace(/\s*\|\s*Shopee.*$/i, '')
        .replace(/\s*-\s*TikTok.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (
        cleanName.length < 4 ||
        /^shopee việt nam|^shopee vietnam|^tiktok\s*-?\s*make your day/i.test(cleanName)
      ) {
        return;
      }
      const cleanUrl = cleanSourceUrl(cand.sourceUrl || baseUrl);
      const key = (extractPlatformItemId(cleanUrl) || cleanUrl || cleanName).toLowerCase();
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      found.push({
        ...cand,
        name: cleanName.slice(0, 160),
        sourcePlatform: cand.sourcePlatform || platform,
        sourceUrl: cleanUrl
      });
    };

    // 0. Pasted Single Product Detail Page HTML (with inner Variation Buttons like LS1..LS15!)
    const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    const detailVariants = [];
    const detailSizes = [];
    let bMatch;
    while ((bMatch = buttonRegex.exec(html)) !== null) {
      const attrs = bMatch[1] || '';
      const inner = bMatch[2] || '';
      const label = inner
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      if (!label || label.length > 42) continue;
      if (
        /^(add to cart|buy now|thêm vào giỏ.*|mua ngay|chat now|chat ngay|view shop|xem shop|follow|theo dõi|report|tố cáo|share|chia sẻ|favorite.*|yêu thích.*|đăng nhập|login|sign up|search|decrease|increase|giảm|tăng|\+|-|×|✕)$/i.test(
          label
        )
      ) {
        continue;
      }
      const imgInBtn = (inner.match(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/i) || [])[1];
      const hasVarHint =
        Boolean(imgInBtn) ||
        /variation|sApkZm|option|sku|tier/i.test(attrs) ||
        /aria-label=["'][^"']+["']/i.test(attrs);
      if (!hasVarHint) continue;

      const isDisabled =
        /\bdisabled\b/i.test(attrs) ||
        /aria-disabled=["']true["']/i.test(attrs) ||
        /disabled|sold-?out/i.test(attrs);

      if (!imgInBtn && /^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|Freesize)$/i.test(label)) {
        if (!detailSizes.includes(label.toUpperCase())) detailSizes.push(label);
      } else {
        detailVariants.push({
          label,
          image: imgInBtn ? cleanCdnImageUrl(imgInBtn) : '',
          stock: isDisabled ? 0 : 1
        });
      }
    }

    const looksLikeProductDetail =
      detailVariants.length > 0 ||
      isSpecificProductUrl(baseUrl) ||
      /Product Specifications|Product Description|Chi tiết sản phẩm|Mô tả sản phẩm|pieces?\s*available|sản phẩm có sẵn/i.test(
        html
      );

    if (looksLikeProductDetail && detailVariants.length > 0) {
      // Extract title from breadcrumb last text, h1, title tag, or first prominent heading before Sold/price
      let pdpTitle =
        (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, ' ').trim() ||
        (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/<[^>]+>/g, ' ').trim() ||
        '';
      if (!pdpTitle) {
        const plainTop = html
          .slice(0, 28000)
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&');
        const topLines = plainTop
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length >= 6);
        const soldIdx = topLines.findIndex((l) => /^\d+\s*sold$|^đã bán\s*\d+/i.test(l));
        if (soldIdx > 0) {
          for (let k = soldIdx - 1; k >= Math.max(0, soldIdx - 4); k--) {
            if (topLines[k].length >= 10 && !/^shopee|women clothes|jeans$/i.test(topLines[k])) {
              pdpTitle = topLines[k];
              break;
            }
          }
        }
      }

      const plainAll = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
      const pdpPriceMatch =
        plainAll.match(/(\d{2,3}(?:[.,]\d{3})+)\s*[₫đ]/) ||
        plainAll.match(/[₫đ]\s*(\d{2,3}(?:[.,]\d{3})+)/);
      const pdpPrice = pdpPriceMatch ? parsePriceVnd(pdpPriceMatch[0]) : 110000;

      // Gallery images from susercontent / tiktokcdn
      const galleryImgs = [];
      const allImgRe = /<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/gi;
      let gi;
      while ((gi = allImgRe.exec(html)) !== null && galleryImgs.length < 25) {
        const rawU = gi[1];
        if (!/susercontent\.com\/file\/|tiktokcdn|ibyteimg/i.test(rawU)) continue;
        if (/avatar|icon|logo|badge|emoji|sprite/i.test(rawU)) continue;
        const cu = cleanCdnImageUrl(rawU);
        if (cu && !galleryImgs.includes(cu)) galleryImgs.push(cu);
      }

      // Extract description after "Product Description" or "Mô tả sản phẩm"
      let descText = '';
      const descMatch = plainAll.match(/(?:Product Description|Mô tả sản phẩm)\s*\n([\s\S]{15,1800}?)(?:Product Ratings|Đánh giá sản phẩm|From The Same Shop|Sản phẩm khác của Shop|$)/i);
      if (descMatch) {
        descText = descMatch[1]
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .join('\n')
          .slice(0, 1500);
      }

      // Extract canonical / share link if present in HTML
      const canonUrl =
        (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["'](https?:\/\/[^"']+)["']/i) || [])[1] ||
        (html.match(/https?:\/\/shopee\.vn\/[^\s"'<>]+-i\.\d+\.\d+/i) || [])[0] ||
        baseUrl;

      if (pdpTitle) {
        pushCandidate({
          name: pdpTitle,
          price: pdpPrice,
          images: galleryImgs,
          sizes: detailSizes,
          variantGroupName: 'Mẫu',
          variants: detailVariants.map((v, idx) => ({
            id: `var_${idx + 1}`,
            label: v.label,
            image: v.image || galleryImgs[0] || '',
            price: pdpPrice,
            stock: v.stock
          })),
          description: descText,
          sourceUrl: canonUrl
        });
        return found;
      }
    }

    // 1. JSON-LD (Product & ItemList)
    const ldRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = ldRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(m[1].trim());
        const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
        while (queue.length > 0) {
          const node = queue.shift();
          if (!node || typeof node !== 'object') continue;
          if (node['@type'] === 'ItemList' && Array.isArray(node.itemListElement)) {
            node.itemListElement.forEach((el) => queue.push(el.item || el));
          } else if (node['@type'] === 'Product' && node.name) {
            const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            const imgs = Array.isArray(node.image) ? node.image : node.image ? [node.image] : [];
            pushCandidate({
              name: node.name,
              price: offer?.price || offer?.lowPrice || 0,
              originalPrice: offer?.highPrice || 0,
              images: imgs.filter((x) => typeof x === 'string').map(cleanCdnImageUrl),
              description: node.description || '',
              sourceUrl: node.url || baseUrl
            });
          }
        }
      } catch {}
    }

    // 2. Embedded SSR State (__UNIVERSAL_DATA_FOR_REHYDRATION__, __NEXT_DATA__, SIGI_STATE, RENDER_DATA)
    const stateRegex =
      /<script[^>]*id=["'](?:__UNIVERSAL_DATA_FOR_REHYDRATION__|__NEXT_DATA__|SIGI_STATE|RENDER_DATA)["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((m = stateRegex.exec(html)) !== null) {
      try {
        const rawJson = m[1].trim().startsWith('%7B') ? decodeURIComponent(m[1].trim()) : m[1];
        const root = JSON.parse(rawJson);
        const walk = (obj, depth = 0) => {
          if (!obj || typeof obj !== 'object' || depth > 18 || found.length >= 100) return;
          if (Array.isArray(obj)) {
            for (const el of obj) walk(el, depth + 1);
            return;
          }

          // Shopee item_basic / item node (including tier_variations & models if present!)
          if (obj.name && (obj.itemid || obj.item_id) && (obj.price || obj.price_min)) {
            const rawImgs = Array.isArray(obj.images)
              ? obj.images
              : obj.image
              ? [obj.image]
              : [];
            const fullImgs = rawImgs.map((h) =>
              String(h).startsWith('http')
                ? cleanCdnImageUrl(h)
                : `https://down-vn.img.susercontent.com/file/${h}`
            );
            const shopId = obj.shopid || obj.shop_id || '';
            const itemId = obj.itemid || obj.item_id || '';

            const ssrVariants = [];
            let ssrSizes = [];
            let groupTitle = 'Mẫu';
            if (Array.isArray(obj.tier_variations) && obj.tier_variations[0]) {
              const tv = obj.tier_variations[0];
              groupTitle = tv.name || 'Mẫu';
              const opts = Array.isArray(tv.options) ? tv.options : [];
              const tvImgs = Array.isArray(tv.images) ? tv.images : [];
              if (obj.tier_variations[1] && Array.isArray(obj.tier_variations[1].options)) {
                ssrSizes = obj.tier_variations[1].options.map((s) => String(s || '').trim()).filter(Boolean);
              }
              opts.forEach((optName, idx) => {
                const matchingModels = Array.isArray(obj.models)
                  ? obj.models.filter((md) => {
                      if (Array.isArray(md.extinfo?.tier_index)) return md.extinfo.tier_index[0] === idx;
                      return String(md.name || '').split(',')[0].trim() === String(optName).trim();
                    })
                  : [];
                const inStockModels = matchingModels.filter((md) => Number(md.stock ?? 0) > 0);
                const chosenPool = inStockModels.length > 0 ? inStockModels : matchingModels;
                const modelPrices = chosenPool.map((md) => parsePriceVnd(md.price)).filter((p) => p > 0);
                const totalOptStock = matchingModels.length > 0
                  ? matchingModels.reduce((acc, md) => acc + Math.max(0, Number(md.stock ?? 0)), 0)
                  : 1;
                ssrVariants.push({
                  id: `var_${idx + 1}`,
                  label: optName,
                  image: tvImgs[idx]
                    ? String(tvImgs[idx]).startsWith('http')
                      ? cleanCdnImageUrl(tvImgs[idx])
                      : `https://down-vn.img.susercontent.com/file/${tvImgs[idx]}`
                    : fullImgs[0] || '',
                  price: modelPrices.length > 0 ? Math.min(...modelPrices) : parsePriceVnd(obj.price || obj.price_min),
                  stock: totalOptStock
                });
              });
            }

            pushCandidate({
              name: obj.name,
              price: obj.price_min || obj.price,
              maxPrice: obj.price_max || obj.price,
              originalPrice: obj.price_before_discount || 0,
              images: fullImgs,
              sizes: ssrSizes,
              variantGroupName: groupTitle,
              variants: ssrVariants,
              description: obj.description || '',
              sold: obj.historical_sold || obj.sold || 0,
              sourcePlatform: 'shopee',
              sourceUrl: shopId && itemId ? `https://shopee.vn/product/${shopId}/${itemId}` : baseUrl
            });
          }

          // TikTok Shop productInfo / productBase node
          if (
            (obj.productBase?.title || (obj.title && (obj.product_id || obj.productId))) &&
            (obj.productBase?.price || obj.price || obj.real_price || obj.market_price)
          ) {
            const pTitle = obj.productBase?.title || obj.title;
            const rawPrice =
              obj.productBase?.price?.real_price ||
              obj.real_price?.price_val ||
              obj.price?.real_price ||
              obj.price ||
              0;
            const imgs = [];
            const imgCandidates = obj.productBase?.images || obj.images || (obj.cover ? [obj.cover] : []);
            if (Array.isArray(imgCandidates)) {
              imgCandidates.forEach((im) => {
                if (typeof im === 'string' && im.startsWith('http')) imgs.push(cleanCdnImageUrl(im));
                else if (Array.isArray(im?.url_list) && im.url_list[0]) imgs.push(cleanCdnImageUrl(im.url_list[0]));
                else if (Array.isArray(im?.thumb_url_list) && im.thumb_url_list[0]) imgs.push(cleanCdnImageUrl(im.thumb_url_list[0]));
              });
            }
            const pid = obj.product_id || obj.productId || '';
            pushCandidate({
              name: pTitle,
              price: rawPrice,
              images: imgs,
              sold: obj.sold_count || obj.soldCount || 0,
              sourcePlatform: 'tiktok',
              sourceUrl: pid ? `https://www.tiktok.com/view/product/${pid}` : baseUrl
            });
          }

          for (const v of Object.values(obj)) {
            if (v && typeof v === 'object') walk(v, depth + 1);
          }
        };
        walk(root, 0);
      } catch {}
    }

    // 3. Anchors & Pasted HTML Product Cards (<a href="...">...<img src="...">...₫195.000...</a>)
    const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = anchorRegex.exec(html)) !== null && found.length < 100) {
      let href = (m[1] || '').replace(/&amp;/g, '&');
      const inner = m[2] || '';
      if (!/-i\.\d+\.\d+|\/product\/\d+|\/view\/product\/|shopee\.vn\/.+-i\./i.test(href)) continue;
      try {
        href = new URL(href, baseUrl || 'https://shopee.vn').toString();
      } catch {}

      const imgMatch =
        inner.match(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/i) || [];
      const imgUrl = cleanCdnImageUrl(imgMatch[1] || '');

      const plain = inner
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
      const lines = plain
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 2);

      const titleLine = lines.find(
        (l) =>
          l.length >= 8 &&
          !/^[₫đ\d.,%\s-]+$/i.test(l) &&
          !/^(yêu thích|mall|đã bán|tài trợ|ad|flash sale)$/i.test(l)
      );
      const priceMatch =
        plain.match(/(\d{2,3}(?:[.,]\d{3})+)\s*[₫đ]?/) ||
        plain.match(/[₫đ]\s*(\d{2,3}(?:[.,]\d{3})+)/) ||
        plain.match(/\b(\d{2,3})k\b/i);

      if (titleLine) {
        pushCandidate({
          name: titleLine,
          price: priceMatch ? priceMatch[0] : 189000,
          images: imgUrl ? [imgUrl] : [],
          sourceUrl: cleanSourceUrl(href)
        });
      }
    }

    // 3b. Div-based Product Grid Cards
    if (found.length === 0) {
      const imgTagRegex = /<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
      let imMatch;
      while ((imMatch = imgTagRegex.exec(html)) !== null && found.length < 80) {
        const imgUrl = cleanCdnImageUrl(imMatch[1]);
        if (/avatar|icon|logo|emoji|badge|flag|sprite/i.test(imgUrl)) continue;
        const afterHtml = html.slice(imMatch.index, imMatch.index + 950);
        const plain = afterHtml
          .replace(/<[^>]+>/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&');
        const lines = plain
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 2);
        const priceLine = lines.find(
          (l) => /(\d{2,3}(?:[.,]\d{3})+)\s*[₫đ]|[₫đ]\s*(\d{2,3}(?:[.,]\d{3})+)/.test(l)
        );
        const titleLine = lines.find(
          (l) =>
            l.length >= 8 &&
            l !== priceLine &&
            !/^[₫đ\d.,%\s-]+$/i.test(l) &&
            !/^(yêu thích|mall|đã bán|tài trợ|ad|flash sale|mua ngay)$/i.test(l)
        );
        if (titleLine && priceLine) {
          pushCandidate({
            name: titleLine,
            price: priceLine,
            images: [imgUrl],
            sourceUrl: baseUrl
          });
        }
      }
    }

    // 4. OpenGraph single-product fallback
    if (found.length === 0) {
      const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || [])[1];
      const ogImg = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1];
      const ogPrice = (html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i) || [])[1];
      if (ogTitle && (/-i\.\d+\.\d+|\/product\/|\/view\/product\//.test(baseUrl) || ogPrice)) {
        pushCandidate({
          name: ogTitle,
          price: ogPrice || 199000,
          images: ogImg ? [cleanCdnImageUrl(ogImg)] : [],
          sourceUrl: baseUrl
        });
      }
    }

    return found;
  }

  // Unified 1-Click Auto-Sync Endpoint
  app.post('/api/shop/auto-sync', requireAuth, async (req, res) => {
    try {
      const store = await getShopStore();
      const syncKey = store.settings?.syncApiKey || '';
      const { targetUrl, pastedHtml, pastedText } = req.body || {};

      // Mode B: Instant parse of copied Shop page OR Product Detail page (including inner variants LS1..LS15!)
      if (pastedHtml || pastedText) {
        const base = targetUrl || 'https://shopee.vn';
        let extracted = [];
        if (pastedHtml) {
          extracted = extractProductsFromHtmlOrJson(String(pastedHtml), base);
        }
        if (extracted.length === 0 && pastedText) {
          const lines = String(pastedText)
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          for (let i = 0; i < lines.length; i++) {
            const pMatch =
              lines[i].match(/^[₫đ]?\s*(\d{2,3}(?:[.,]\d{3})+)\s*[₫đ]?$/) ||
              lines[i].match(/^(\d{2,3})k$/i);
            if (pMatch && i > 0) {
              for (let b = i - 1; b >= Math.max(0, i - 3); b--) {
                const cand = lines[b];
                if (
                  cand.length >= 10 &&
                  !/^[₫đ\d.,%\s-]+$/.test(cand) &&
                  !/^(yêu thích|xu hướng|đã bán|giảm)/i.test(cand)
                ) {
                  extracted.push({
                    name: cand,
                    price: pMatch[0],
                    sourceUrl: base,
                    sourcePlatform: base.includes('tiktok') ? 'tiktok' : 'shopee'
                  });
                  break;
                }
              }
            }
          }
        }

        if (extracted.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Chưa nhận diện được sản phẩm trong nội dung vừa sao chép. Hãy nhấn Ctrl+A rồi Ctrl+C trên trang Shop hoặc trang Chi tiết sản phẩm rồi bấm lại nhé!'
          });
        }

        const saved = await saveImportedItemsToStore(extracted);
        const varNote =
          saved.totalVariantsSynced > 0 ? ` (kèm ${saved.totalVariantsSynced} phân hệ con ở trong)` : '';
        return res.json({
          success: true,
          syncKey,
          addedCount: saved.addedCount,
          updatedCount: saved.updatedCount,
          totalVariantsSynced: saved.totalVariantsSynced,
          products: saved.importedItems,
          message: `🎉 Đã kéo về thành công ${saved.addedCount} sản phẩm mới & cập nhật ${saved.updatedCount} sản phẩm${varNote}!`
        });
      }

      // Mode A: Direct URL Auto-Sync from Server
      if (!targetUrl || !/^https?:\/\//i.test(String(targetUrl).trim())) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng dán đường dẫn hợp lệ (bắt đầu bằng https://...) của Shop Shopee hoặc TikTok Shop!'
        });
      }

      const resolvedUrl = await resolveShortShopUrl(targetUrl);
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

      const pageRes = await fetch(resolvedUrl, {
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
        }
      });
      const html = await pageRes.text();
      const extracted = extractProductsFromHtmlOrJson(html, resolvedUrl);

      if (extracted.length > 0) {
        const saved = await saveImportedItemsToStore(extracted);
        return res.json({
          success: true,
          syncKey,
          resolvedUrl,
          addedCount: saved.addedCount,
          updatedCount: saved.updatedCount,
          totalVariantsSynced: saved.totalVariantsSynced,
          products: saved.importedItems,
          message: `🎉 Đã tự động kéo thành công ${saved.addedCount} sản phẩm mới & cập nhật ${saved.updatedCount} sản phẩm từ ${resolvedUrl}!`
        });
      }

      return res.json({
        success: true,
        needsBrowserClipboard: true,
        syncKey,
        addedCount: 0,
        updatedCount: 0,
        resolvedUrl,
        platform: resolvedUrl.includes('tiktok') ? 'tiktok' : 'shopee',
        message: 'Đã nhận diện đúng địa chỉ Shop: ' + resolvedUrl
      });
    } catch (err) {
      console.error('Auto-sync error:', err);
      return res.status(500).json({
        success: false,
        message: 'Không thể kết nối tới đường dẫn này: ' + err.message
      });
    }
  });

  // =========================================================================
  // 4. DIRECT PRODUCT & STRICT 1-TO-1 RECONCILIATION ENDPOINT
  // =========================================================================
  app.post('/api/shop/import', requireAdminOrSyncKey, async (req, res) => {
    try {
      const bodyObj =
        typeof req.body === 'string'
          ? JSON.parse(req.body)
          : req.body || {};
      const rawProducts = Array.isArray(bodyObj.products)
        ? bodyObj.products
        : bodyObj.product
        ? [bodyObj.product]
        : [];

      let saved = { addedCount: 0, updatedCount: 0, totalVariantsSynced: 0, importedItems: [] };
      if (rawProducts.length > 0) {
        saved = await saveImportedItemsToStore(rawProducts);
      }

      // Optional 1-to-1 Full Shop Reconciliation: removes stale/duplicate clones for `reconcilePlatform`
      // while NEVER touching non-cloned local products or locked products!
      let prunedCount = 0;
      if (bodyObj.reconcilePlatform && Array.isArray(bodyObj.activePlatformItemIds) && bodyObj.activePlatformItemIds.length > 0) {
        const targetPlat = bodyObj.reconcilePlatform;
        const activeSet = new Set(bodyObj.activePlatformItemIds.filter(Boolean));
        const seenKeptIds = new Set();
        const store = await getShopStore();

        const beforeLen = (store.products || []).length;
        const keptClonesMap = new Map();
        const untouchedProducts = [];

        for (const p of store.products || []) {
          // NEVER touch non-cloned local web products ("không đả động tới SP không phải clone từ sàn")
          if (!isPlatformClonedProduct(p, targetPlat) || p.isLocked) {
            untouchedProducts.push(p);
            continue;
          }
          const pid = p.platformItemId || extractPlatformItemId(p.sourceUrl || '');
          if (pid && activeSet.has(pid) && !seenKeptIds.has(pid)) {
            seenKeptIds.add(pid);
            keptClonesMap.set(pid, p);
          }
        }

        // Preserve the exact 1-to-1 Shopee display order from activePlatformItemIds, followed by untouched local products
        const orderedClones = bodyObj.activePlatformItemIds
          .map((id) => keptClonesMap.get(id))
          .filter(Boolean);

        store.products = [...orderedClones, ...untouchedProducts];
        prunedCount = Math.max(0, beforeLen - store.products.length);
        await saveShopStore(store);
      }

      if (rawProducts.length === 0 && !bodyObj.reconcilePlatform) {
        return res.status(400).json({ success: false, message: 'Không có dữ liệu sản phẩm để nhập.' });
      }

      const varNote =
        saved.totalVariantsSynced > 0 ? ` (kèm ${saved.totalVariantsSynced} phân hệ con)` : '';
      const pruneNote = prunedCount > 0 ? ` • Đã dọn ${prunedCount} bản ghi lệch/cũ để khớp chuẩn 1-1` : '';
      res.json({
        success: true,
        addedCount: saved.addedCount,
        updatedCount: saved.updatedCount,
        prunedCount,
        totalVariantsSynced: saved.totalVariantsSynced,
        products: saved.importedItems,
        message: `🎉 Đồng bộ 1-1 thành công: +${saved.addedCount} mới, cập nhật ${saved.updatedCount} SP${varNote}${pruneNote}!`
      });
    } catch (err) {
      console.error('Import error:', err);
      res.status(500).json({ success: false, message: 'Lỗi khi lưu sản phẩm đồng bộ: ' + err.message });
    }
  });
}

function isPlatformClonedProduct(p, platformFilter = null) {
  if (!p) return false;
  if (p.originType === 'local' || /^prod-\d+$/.test(String(p.id || ''))) return false;
  const pid = p.platformItemId || extractPlatformItemId(p.sourceUrl || '');
  if (!pid && p.originType !== 'cloned') return false;
  if (platformFilter) return p.sourcePlatform === platformFilter;
  return p.sourcePlatform === 'shopee' || p.sourcePlatform === 'tiktok';
}

function normalizeSlugWords(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractSlugFromShopeeUrl(url) {
  const m = String(url || '').match(/shopee\.vn\/([^/?#]+)-i\.(\d+)\.(\d+)/i);
  if (!m) return null;
  let decoded = m[1];
  try {
    decoded = decodeURIComponent(m[1]);
  } catch {}
  return {
    cleanUrl: `https://shopee.vn/${m[1]}-i.${m[2]}.${m[3]}`,
    platformItemId: `shopee_${m[2]}_${m[3]}`,
    normTitle: normalizeSlugWords(decoded)
  };
}

function repairAndMigrateProductsStore(products) {
  let changed = false;

  // 1. Collect pool of all real Shopee item URLs currently in store so any shifted URLs are reunited 1-to-1 with their true product
  const shopeeUrlPool = [];
  for (const p of products) {
    if (!p) continue;
    if (typeof p.sourceUrl === 'string' && p.sourceUrl.includes('&amp;')) {
      p.sourceUrl = cleanSourceUrl(p.sourceUrl);
      changed = true;
    }
    const parsed = extractSlugFromShopeeUrl(p.sourceUrl);
    if (parsed && !shopeeUrlPool.some((x) => x.platformItemId === parsed.platformItemId)) {
      shopeeUrlPool.push(parsed);
    }
  }

  for (const p of products) {
    if (!p) continue;

    // Mark built-in sample web products (`prod-1`..`prod-6` or manual items without item IDs) as `originType: 'local'`
    if (/^prod-\d+$/.test(String(p.id || '')) || (!extractPlatformItemId(p.sourceUrl || '') && !p.platformItemId)) {
      if (p.originType !== 'local') {
        p.originType = 'local';
        changed = true;
      }
      continue;
    }

    if (p.originType !== 'cloned') {
      p.originType = 'cloned';
      changed = true;
    }

    // Reunite any shifted Shopee clone with its true Shopee URL by matching normalized product name against URL slug
    if (p.sourcePlatform === 'shopee' && shopeeUrlPool.length > 0) {
      const pNorm = normalizeSlugWords(p.name);
      const curSlug = extractSlugFromShopeeUrl(p.sourceUrl);
      if (!curSlug || curSlug.normTitle !== pNorm) {
        const usedIds = new Set(
          products
            .filter((o) => o && o !== p)
            .map((o) => o.platformItemId || extractPlatformItemId(o.sourceUrl || ''))
            .filter(Boolean)
        );
        const exactMatch =
          shopeeUrlPool.find((u) => u.normTitle === pNorm && !usedIds.has(u.platformItemId)) ||
          shopeeUrlPool.find((u) => u.normTitle === pNorm) ||
          shopeeUrlPool.find(
            (u) => (pNorm.startsWith(u.normTitle) || u.normTitle.startsWith(pNorm)) && !usedIds.has(u.platformItemId)
          );
        if (exactMatch && p.sourceUrl !== exactMatch.cleanUrl) {
          p.sourceUrl = exactMatch.cleanUrl;
          p.platformItemId = exactMatch.platformItemId;
          changed = true;
        }
      }
      if (!p.platformItemId) {
        p.platformItemId = extractPlatformItemId(p.sourceUrl || '');
        if (p.platformItemId) changed = true;
      }
    }

    // Remove accidental quantity +/- ghost variants ("Decrease", "Increase")
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      const cleanedVars = p.variants.filter(
        (v) => v && !/^(decrease|increase|giảm|tăng|\+|-)$/i.test(String(v.label || '').trim())
      );
      if (cleanedVars.length !== p.variants.length) {
        p.variants = cleanedVars;
        changed = true;
      }
    }

    // Clear fake default ['S', 'M', 'L'] sizes on Shopee clones that did not come from a real 2nd tier
    if (
      p.sourcePlatform === 'shopee' &&
      Array.isArray(p.sizes) &&
      p.sizes.join(',') === 'S,M,L'
    ) {
      p.sizes = [];
      changed = true;
    }
  }

  // Deduplicate cloned products sharing the exact same platformItemId (keep the richer one with more variants)
  const seenClonedPids = new Map();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p || p.originType !== 'cloned' || !p.platformItemId) continue;
    const prevIdx = seenClonedPids.get(p.platformItemId);
    if (prevIdx === undefined) {
      seenClonedPids.set(p.platformItemId, i);
    } else {
      const prevP = products[prevIdx];
      const prevVars = Array.isArray(prevP.variants) ? prevP.variants.length : 0;
      const curVars = Array.isArray(p.variants) ? p.variants.length : 0;
      if (curVars > prevVars) {
        products.splice(prevIdx, 1);
      } else {
        products.splice(i, 1);
      }
      changed = true;
      i = -1;
      seenClonedPids.clear();
    }
  }

  return changed;
}

function cleanCdnImageUrl(u) {
  if (!u || typeof u !== 'string') return '';
  return u
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/@resize[^"'\s?]*/gi, '')
    .replace(/_tn(?=$|\?)/i, '');
}

function cleanSourceUrl(u) {
  if (!u || typeof u !== 'string') return '';
  let s = u.trim().replace(/&amp;/g, '&');
  const shopeeItemMatch = s.match(/^(https?:\/\/(?:www\.)?shopee\.vn\/[^?#]+-i\.\d+\.\d+)/i);
  if (shopeeItemMatch) {
    return shopeeItemMatch[1];
  }
  return s;
}

function isSpecificProductUrl(u) {
  return /-i\.\d+\.\d+|\/product\/\d+\/\d+|\/view\/product\/\d+|\/video\/\d+/i.test(String(u || ''));
}

function extractPlatformItemId(u) {
  const s = String(u || '');
  const m1 = s.match(/-i\.(\d+)\.(\d+)/);
  if (m1) return `shopee_${m1[1]}_${m1[2]}`;
  const m2 = s.match(/shopee\.vn\/product\/(\d+)\/(\d+)/i);
  if (m2) return `shopee_${m2[1]}_${m2[2]}`;
  const m3 = s.match(/\/view\/product\/(\d+)/i);
  if (m3) return `tiktok_${m3[1]}`;
  return '';
}

function normalizeVariantsList(rawVariants, fallbackPrice = 110000) {
  if (!Array.isArray(rawVariants)) return [];
  const out = [];
  const seen = new Set();
  for (let i = 0; i < rawVariants.length && out.length < 80; i++) {
    const v = rawVariants[i];
    if (!v) continue;
    const label = String(v.label || v.name || '').trim();
    if (!label || /^(decrease|increase|giảm|tăng|\+|-|×|✕)$/i.test(label)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const vPrice = parsePriceVnd(v.price) || parsePriceVnd(fallbackPrice) || 110000;
    out.push({
      id: v.id || `var_${i + 1}`,
      label: label.slice(0, 50),
      image: cleanCdnImageUrl(v.image || ''),
      price: vPrice,
      stock: v.stock !== undefined ? Math.max(0, Number(v.stock)) : 1
    });
  }
  return out;
}

function inferSizesFromTitle(title) {
  const m = String(title || '').match(/\bsize\s*(XXS|XS|S|M|L|XL|XXL|2XL|Freesize)\b/i);
  if (m) return [m[1].toUpperCase()];
  return ['S', 'M', 'L'];
}

function inferCategoryFromName(name, categories = []) {
  const lower = String(name || '').toLowerCase();
  const findCat = (regex) => categories.find((c) => regex.test(`${c.id} ${c.name}`));
  if (/quần|jeans|jean|culottes|short|chân váy/.test(lower)) {
    const c = findCat(/chan-vay|quan|jeans|váy/i);
    if (c) return c.id;
  }
  if (/áo|hoodie|sweater|cardigan|sơ mi|croptop|khoác/.test(lower)) {
    const c = findCat(/ao-kieu|áo/i);
    if (c) return c.id;
  }
  if (/sticker|dép|kẹp|nơ|túi|phụ kiện|mũ|tất|vớ/.test(lower)) {
    const c = findCat(/phu-kien|phụ kiện/i);
    if (c) return c.id;
  }
  if (/set|combo bộ/.test(lower)) {
    const c = findCat(/set-do|set/i);
    if (c) return c.id;
  }
  return categories[0] ? categories[0].id : 'vay-dam';
}

function parsePriceVnd(val) {
  if (typeof val === 'number' && !isNaN(val)) {
    if (val > 100000000) return Math.round(val / 100000);
    return Math.round(val);
  }
  const s = String(val || '').trim();
  if (!s) return 0;
  const firstPart = s.split('-')[0].trim();
  if (/k$/i.test(firstPart)) {
    const n = parseFloat(firstPart.replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : Math.round(n * 1000);
  }
  const digits = firstPart.replace(/[^\d]/g, '');
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
}

module.exports = { registerShopRoutes };
