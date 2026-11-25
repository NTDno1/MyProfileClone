const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { rewriteLegacyBioUrls } = require('./file-storage-client');

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
  bankAccountNo: '0983877462',
  bankAccountName: 'NA 2HAND SHOP',
  qrNotePrefix: 'NA2HAND',
  zaloPhone: '0983877462',
  messengerUrl: 'https://www.facebook.com/anganh.764617',
  shopeeShopUrl: 'https://s.shopee.vn/8VAfrswNOG',
  tiktokShopUrl: 'https://www.tiktok.com/@na2hand3',
  liveProofEnabled: true,
  telegramBotToken: '',
  telegramChatId: '',
  syncApiKey: 'na2hand_sync_' + crypto.randomBytes(8).toString('hex')
};

function registerShopRoutes(app, { dataDir, getMongoDb, requireAuth }) {
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
    const migrated = rewriteLegacyBioUrls(raw);
    if (migrated.changed) {
      saveShopStore(migrated.data).catch(() => {});
    }
    return migrated.data;
  }

  async function getShopStoreRaw() {
    const local = loadLocalShopData();
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
        saveLocalShopData(merged);
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

  // Middleware allowing either Admin Bearer Token OR Browser Sync Key (for Chrome Extension / Playwright tool)
  async function requireAdminOrSyncKey(req, res, next) {
    // Allow CORS for Chrome Extension & Local Playwright Helper
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sync-Key');
    if (req.method === 'OPTIONS') return res.status(200).end();

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
    const store = await getShopStore();
    const publicSettings = { ...store.settings };
    delete publicSettings.telegramBotToken;
    delete publicSettings.syncApiKey;

    res.json({
      success: true,
      settings: publicSettings,
      categories: store.categories,
      products: (store.products || []).filter((p) => p.enabled !== false),
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
        const unitPrice = prod ? Number(prod.price) : Number(cartItem.price || 0);
        const qty = Math.max(1, Number(cartItem.qty || 1));
        subtotal += unitPrice * qty;

        normalizedItems.push({
          productId: cartItem.productId,
          name: prod ? prod.name : cartItem.name,
          image: prod && prod.images && prod.images[0] ? prod.images[0] : cartItem.image || '',
          price: unitPrice,
          qty,
          size: cartItem.size || 'Freesize',
          color: cartItem.color || 'Mặc định'
        });

        if (prod) {
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

  // Customer confirms they scanned and paid via QR
  app.post('/api/shop/orders/:orderCode/confirm-qr', async (req, res) => {
    const code = String(req.params.orderCode || '').trim().toUpperCase();
    const store = await getShopStore();
    const order = (store.orders || []).find((o) => String(o.orderCode).toUpperCase() === code);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    order.paymentStatus = 'customer_confirmed_qr';
    order.updatedAt = new Date().toISOString();
    await saveShopStore(store);
    res.json({
      success: true,
      message: 'Shop đã ghi nhận thông báo chuyển khoản QR của nàng! Tụi mình sẽ kiểm tra và gói hàng ngay nhé 🌸',
      order
    });
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

  // Customer Product Review
  app.post('/api/shop/reviews', async (req, res) => {
    const { productId, authorName, rating, comment } = req.body || {};
    if (!productId || !authorName || !comment) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và nội dung đánh giá nhé!' });
    }
    const store = await getShopStore();
    const star = Math.min(5, Math.max(1, Number(rating || 5)));
    const rev = {
      id: `rev_${Date.now()}`,
      productId,
      authorName: String(authorName).trim(),
      rating: star,
      comment: String(comment).trim(),
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
    const newProd = {
      id: b.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: String(b.name || 'Sản phẩm mới').trim(),
      category: String(b.category || 'vay-dam'),
      price: Math.max(0, Number(b.price || 0)),
      originalPrice: Math.max(0, Number(b.originalPrice || b.price || 0)),
      images: Array.isArray(b.images) && b.images.length > 0 ? b.images : ['/media/bio-link/girlfriend-1.jpg'],
      sizes: Array.isArray(b.sizes) && b.sizes.length > 0 ? b.sizes : ['Freesize'],
      colors: Array.isArray(b.colors) && b.colors.length > 0 ? b.colors : ['Mặc định'],
      stock: Math.max(0, Number(b.stock ?? 10)),
      sold: Math.max(0, Number(b.sold ?? 0)),
      rating: Number(b.rating || 5.0),
      reviewCount: Number(b.reviewCount || 1),
      isFlashSale: !!b.isFlashSale,
      isFeatured: b.isFeatured !== false,
      isNew: b.isNew !== false,
      sourcePlatform: b.sourcePlatform || 'manual',
      sourceUrl: b.sourceUrl || '',
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
      price: b.price !== undefined ? Number(b.price) : store.products[idx].price,
      originalPrice: b.originalPrice !== undefined ? Number(b.originalPrice) : store.products[idx].originalPrice,
      stock: b.stock !== undefined ? Number(b.stock) : store.products[idx].stock,
      updatedAt: new Date().toISOString()
    };

    await saveShopStore(store);
    res.json({ success: true, product: store.products[idx], message: 'Đã cập nhật sản phẩm!' });
  });

  // Delete Product
  app.delete('/api/shop/admin/products/:id', requireAuth, async (req, res) => {
    const store = await getShopStore();
    store.products = (store.products || []).filter((p) => p.id !== req.params.id);
    await saveShopStore(store);
    res.json({ success: true, message: 'Đã xóa sản phẩm.' });
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
  // 3. SHOPEE & TIKTOK SHOP BROWSER IMPORT ENDPOINT
  //    Receives scraped DOM/JSON products from User's Playwright Agent or Chrome Extension!
  // =========================================================================
  app.post('/api/shop/import', requireAdminOrSyncKey, async (req, res) => {
    try {
      const rawProducts = Array.isArray(req.body?.products)
        ? req.body.products
        : req.body?.product
        ? [req.body.product]
        : [];

      if (rawProducts.length === 0) {
        return res.status(400).json({ success: false, message: 'Không có dữ liệu sản phẩm để nhập.' });
      }

      const store = await getShopStore();
      let addedCount = 0;
      let updatedCount = 0;
      const importedItems = [];

      for (const item of rawProducts) {
        if (!item || !item.name) continue;

        const cleanPrice = parsePriceVnd(item.price);
        const cleanOrig = parsePriceVnd(item.originalPrice) || Math.round(cleanPrice * 1.25);
        const platform =
          item.sourcePlatform ||
          (String(item.sourceUrl || '').includes('tiktok') ? 'tiktok' : 'shopee');

        const imgs = Array.isArray(item.images)
          ? item.images.filter((u) => typeof u === 'string' && u.startsWith('http'))
          : [];

        const existingIdx = item.sourceUrl
          ? (store.products || []).findIndex((p) => p.sourceUrl && p.sourceUrl === item.sourceUrl)
          : -1;

        const productObj = {
          id: existingIdx >= 0 ? store.products[existingIdx].id : `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: String(item.name).trim(),
          category: item.category || (store.categories[0] ? store.categories[0].id : 'vay-dam'),
          price: cleanPrice > 0 ? cleanPrice : 199000,
          originalPrice: cleanOrig >= cleanPrice ? cleanOrig : cleanPrice,
          images: imgs.length > 0 ? imgs.slice(0, 8) : ['/media/bio-link/girlfriend-1.jpg'],
          sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['Freesize'],
          colors: Array.isArray(item.colors) && item.colors.length > 0 ? item.colors : ['Theo hình'],
          stock: Number(item.stock || 20),
          sold: Number(item.sold || 0),
          rating: Number(item.rating || 5.0),
          reviewCount: Number(item.reviewCount || 5),
          isFlashSale: Boolean(item.isFlashSale),
          isFeatured: true,
          isNew: true,
          sourcePlatform: platform,
          sourceUrl: item.sourceUrl || '',
          description: String(item.description || `Sản phẩm đồng bộ trực tiếp từ ${platform === 'tiktok' ? 'TikTok Shop' : 'Shopee'} chính hãng của NA 2HAND ✨`),
          enabled: true,
          createdAt: existingIdx >= 0 ? store.products[existingIdx].createdAt : new Date().toISOString(),
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

      await saveShopStore(store);
      res.json({
        success: true,
        addedCount,
        updatedCount,
        products: importedItems,
        message: `🎉 Đã đồng bộ thành công ${addedCount} sản phẩm mới & cập nhật ${updatedCount} sản phẩm từ sàn vào Shop!`
      });
    } catch (err) {
      console.error('Import error:', err);
      res.status(500).json({ success: false, message: 'Lỗi khi lưu sản phẩm đồng bộ: ' + err.message });
    }
  });
}

function parsePriceVnd(val) {
  if (typeof val === 'number' && !isNaN(val)) {
    // Shopee internal JSON sometimes stores prices multiplied by 100000
    if (val > 100000000) return Math.round(val / 100000);
    return Math.round(val);
  }
  const s = String(val || '').trim();
  if (!s) return 0;
  // Handle ranges like "150.000₫ - 220.000₫" -> take first price
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
