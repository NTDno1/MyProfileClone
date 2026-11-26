const fs = require('fs');
const path = require('path');
const { rewriteLegacyBioUrls } = require('./file-storage-client');

const DEFAULT_AFFILIATE_PROFILE = {
  handle: 'na2hand',
  title: 'NA 2HAND Closet',
  subtitle: 'Tủ đồ xinh & link chính hãng tuyển chọn — nàng gõ mã số ở dưới là thấy ngay nhé ♡',
  avatar: '/media/bio-link/girlfriend-1.jpg',
  layoutMode: 'zigzag', // 'zigzag' (chuẩn Passio so le trái-phải) | 'grid' (lưới 2 cột)
  themeTone: 'blush', // 'blush' (Đồng bộ màu Shop NA 2HAND) | 'ivory' | 'oatmeal'
  showPrice: false,
  showPlatformBadge: true,
  itemsPerCategory: 12,
  _toneSyncedV2: true
};

const DEFAULT_AFFILIATE_CATEGORIES = [
  { id: 'quan-chan-vay', name: 'Quần - Chân váy', order: 1 },
  { id: 'ao', name: 'Áo', order: 2 },
  { id: 'ao-dai', name: 'Áo dài', order: 3 },
  { id: 'set', name: 'Set', order: 4 },
  { id: 'phu-kien', name: 'Phụ kiện', order: 5 },
  { id: 'giay-dep', name: 'Giày - Dép', order: 6 },
  { id: 'dam', name: 'Đầm', order: 7 },
  { id: 'tui-balo', name: 'Túi - Balo', order: 8 }
];

const DEFAULT_AFFILIATE_ITEMS = [
  {
    id: 'aff_sample_6',
    code: '06',
    name: 'Quần Jeans Ống Rộng Lưng Cao Tôn Dáng Hàn Quốc',
    categoryId: 'quan-chan-vay',
    affiliateUrl: 'https://s.shopee.vn/8VAfrswNOG',
    image: '/media/bio-link/girlfriend-1.jpg',
    platform: 'shopee',
    price: 185000,
    badge: 'HOT',
    pinned: true,
    enabled: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff_sample_5',
    code: '05',
    name: 'Chân Váy Dài Xếp Ly Cạp Cao Dáng Chữ A Thanh Lịch',
    categoryId: 'quan-chan-vay',
    affiliateUrl: 'https://s.shopee.vn/8VAfrswNOG',
    image: '/media/bio-link/girlfriend-2.jpg',
    platform: 'shopee',
    price: 165000,
    badge: '',
    pinned: false,
    enabled: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff_sample_4',
    code: '04',
    name: 'Áo Cardigan Len Mềm Phối Nơ Tiểu Thư Hàn Quốc',
    categoryId: 'ao',
    affiliateUrl: 'https://s.shopee.vn/8VAfrswNOG',
    image: '/media/bio-link/girlfriend-1.jpg',
    platform: 'shopee',
    price: 179000,
    badge: '',
    pinned: false,
    enabled: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff_sample_3',
    code: '03',
    name: 'Áo Sơ Mi Tơ Đũi Dáng Rộng Phong Cách Basic Dễ Phối',
    categoryId: 'ao',
    affiliateUrl: 'https://www.tiktok.com/@na2hand3',
    image: '/media/bio-link/girlfriend-2.jpg',
    platform: 'tiktok',
    price: 155000,
    badge: '',
    pinned: false,
    enabled: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff_sample_2',
    code: '02',
    name: 'Đầm Babydoll Hoa Nhí Dáng Xòe Công Chúa Đi Tiệc / Dạo Phố',
    categoryId: 'dam',
    affiliateUrl: 'https://s.shopee.vn/8VAfrswNOG',
    image: '/media/bio-link/girlfriend-1.jpg',
    platform: 'shopee',
    price: 215000,
    badge: 'NEW',
    pinned: false,
    enabled: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff_sample_1',
    code: '01',
    name: 'Set Kẹp Tóc Nơ Lụa & Phụ Kiện Xinh Xắn Phối Đồ',
    categoryId: 'phu-kien',
    affiliateUrl: 'https://s.shopee.vn/8VAfrswNOG',
    image: '/media/bio-link/girlfriend-2.jpg',
    platform: 'shopee',
    price: 59000,
    badge: '',
    pinned: false,
    enabled: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  }
];

function cleanImageHd(u) {
  if (!u || typeof u !== 'string') return '';
  return u
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/@resize[^"'\s?]*/gi, '')
    .replace(/_tn(?=$|\?)/i, '');
}

function detectPlatform(url) {
  const s = String(url || '').toLowerCase();
  if (s.includes('shopee')) return 'shopee';
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('lazada')) return 'lazada';
  return 'other';
}

function computeNextCode(items) {
  let maxNum = 0;
  for (const it of items || []) {
    const n = parseInt(String(it.code || '').replace(/[^\d]/g, ''), 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  const next = maxNum + 1;
  return next < 10 ? `0${next}` : String(next);
}

function registerAffiliateRoutes(app, { dataDir, getMongoDb, requireAuth, recordAnalyticsEvent }) {
  const AFF_FILE = path.join(dataDir, 'affiliate-store.json');

  function loadLocalAffiliateStore() {
    try {
      if (!fs.existsSync(AFF_FILE)) {
        const initial = {
          profile: { ...DEFAULT_AFFILIATE_PROFILE },
          categories: JSON.parse(JSON.stringify(DEFAULT_AFFILIATE_CATEGORIES)),
          items: JSON.parse(JSON.stringify(DEFAULT_AFFILIATE_ITEMS)),
          totalViews: 0,
          totalClicks: 0
        };
        fs.writeFileSync(AFF_FILE, JSON.stringify(initial, null, 2), 'utf8');
        return initial;
      }
      const parsed = JSON.parse(fs.readFileSync(AFF_FILE, 'utf8'));
      return {
        profile: { ...DEFAULT_AFFILIATE_PROFILE, ...(parsed.profile || {}) },
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : JSON.parse(JSON.stringify(DEFAULT_AFFILIATE_CATEGORIES)),
        items: Array.isArray(parsed.items) ? parsed.items : [],
        totalViews: Number(parsed.totalViews || 0),
        totalClicks: Number(parsed.totalClicks || 0)
      };
    } catch {
      return {
        profile: { ...DEFAULT_AFFILIATE_PROFILE },
        categories: JSON.parse(JSON.stringify(DEFAULT_AFFILIATE_CATEGORIES)),
        items: JSON.parse(JSON.stringify(DEFAULT_AFFILIATE_ITEMS)),
        totalViews: 0,
        totalClicks: 0
      };
    }
  }

  function saveLocalAffiliateStore(store) {
    fs.writeFileSync(AFF_FILE, JSON.stringify(store, null, 2), 'utf8');
  }

  async function mirrorAffiliateItemsToAtlas(db, items) {
    if (!db) return;
    try {
      const col = db.collection('affiliate_items');
      await col.deleteMany({});
      if (Array.isArray(items) && items.length > 0) {
        await col.insertMany(items.map((x) => ({ ...x })));
      }
    } catch {}
  }

  async function getAffiliateStore() {
    const local = loadLocalAffiliateStore();
    const db = getMongoDb();
    if (!db) return local;

    try {
      const col = db.collection('affiliate_state');
      const remote = await col.findOne({ _id: 'na2hand_affiliate_main' });
      if (remote && remote.store) {
        const merged = {
          profile: { ...DEFAULT_AFFILIATE_PROFILE, ...(remote.store.profile || {}) },
          categories:
            Array.isArray(remote.store.categories) && remote.store.categories.length > 0
              ? remote.store.categories
              : local.categories,
          items: Array.isArray(remote.store.items) ? remote.store.items : local.items,
          totalViews: Number(remote.store.totalViews ?? local.totalViews ?? 0),
          totalClicks: Number(remote.store.totalClicks ?? local.totalClicks ?? 0)
        };
        let upgradedTone = false;
        if (!remote.store.profile?._toneSyncedV2) {
          merged.profile.themeTone = 'blush';
          merged.profile._toneSyncedV2 = true;
          if (merged.profile.subtitle === 'Search khung tìm kiếm phía dưới là siêu nhanh 👇') {
            merged.profile.subtitle = DEFAULT_AFFILIATE_PROFILE.subtitle;
          }
          upgradedTone = true;
        }
        const migrated = rewriteLegacyBioUrls(merged);
        saveLocalAffiliateStore(migrated.data);
        if (migrated.changed || upgradedTone) {
          await col.updateOne(
            { _id: 'na2hand_affiliate_main' },
            { $set: { store: migrated.data, updatedAt: new Date() } }
          );
        }
        return migrated.data;
      } else {
        await col.updateOne(
          { _id: 'na2hand_affiliate_main' },
          { $set: { store: local, updatedAt: new Date() } },
          { upsert: true }
        );
        await mirrorAffiliateItemsToAtlas(db, local.items);
        return local;
      }
    } catch {
      return local;
    }
  }

  async function saveAffiliateStore(store) {
    saveLocalAffiliateStore(store);
    const db = getMongoDb();
    if (db) {
      try {
        await db.collection('affiliate_state').updateOne(
          { _id: 'na2hand_affiliate_main' },
          { $set: { store, updatedAt: new Date() } },
          { upsert: true }
        );
        await mirrorAffiliateItemsToAtlas(db, store.items);
      } catch (err) {
        console.warn('[Affiliate MongoDB] Lỗi lưu dữ liệu affiliate:', err.message);
      }
    }
  }

  // Sort items: pinned first, then descending numeric code (like 179, 178, 177... on Passio), then newest
  function sortAffiliateItems(items) {
    return [...(items || [])].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      const na = parseInt(String(a.code || '').replace(/[^\d]/g, ''), 10);
      const nb = parseInt(String(b.code || '').replace(/[^\d]/g, ''), 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  // =========================================================================
  // 1. PUBLIC AFFILIATE SHOWCASE API
  // =========================================================================
  app.get('/api/affiliate/public', async (req, res) => {
    const store = await getAffiliateStore();

    if (req.query.track === '1') {
      store.totalViews = Number(store.totalViews || 0) + 1;
      saveAffiliateStore(store).catch(() => {});
      if (typeof recordAnalyticsEvent === 'function') {
        recordAnalyticsEvent(req, {
          type: 'affiliate_view',
          targetTitle: 'Xem trang Affiliate (/affiliate)',
          targetUrl: '/affiliate'
        }).catch(() => {});
      }
    }

    const cats = [...(store.categories || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const enabledItems = sortAffiliateItems((store.items || []).filter((it) => it && it.enabled !== false));

    res.json({
      success: true,
      profile: store.profile,
      categories: cats,
      items: enabledItems
    });
  });

  // Track real click on an Affiliate item
  app.post('/api/affiliate/click/:id', async (req, res) => {
    try {
      const store = await getAffiliateStore();
      const item = (store.items || []).find((x) => x.id === req.params.id);
      if (item) {
        item.clicks = Number(item.clicks || 0) + 1;
        store.totalClicks = Number(store.totalClicks || 0) + 1;
        await saveAffiliateStore(store);

        if (typeof recordAnalyticsEvent === 'function') {
          recordAnalyticsEvent(req, {
            type: 'affiliate_click',
            targetTitle: `Affiliate #${item.code || ''}: ${String(item.name || '').slice(0, 48)}`,
            targetUrl: item.affiliateUrl || '/affiliate'
          }).catch(() => {});
        }
      }
      res.json({ success: true });
    } catch {
      res.json({ success: false });
    }
  });

  // =========================================================================
  // 2. DEDICATED AFFILIATE ADMIN API (/affiliate-admin)
  // =========================================================================
  app.get('/api/affiliate/admin/overview', requireAuth, async (req, res) => {
    const store = await getAffiliateStore();
    const db = getMongoDb();
    const sortedItems = sortAffiliateItems(store.items || []);
    const cats = [...(store.categories || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    const totalClicks = sortedItems.reduce((s, x) => s + Number(x.clicks || 0), 0);
    const topItem = [...sortedItems].sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0))[0] || null;

    res.json({
      success: true,
      mongoConnected: Boolean(db),
      mongoDbName: db ? db.databaseName : 'na2hand_shop',
      nextCode: computeNextCode(sortedItems),
      metrics: {
        totalItems: sortedItems.length,
        activeItems: sortedItems.filter((x) => x.enabled !== false).length,
        totalCategories: cats.length,
        totalViews: Number(store.totalViews || 0),
        totalClicks,
        topItemName: topItem && topItem.clicks > 0 ? `${topItem.code ? topItem.code + '. ' : ''}${topItem.name}` : 'Chưa có lượt bấm',
        topItemClicks: topItem ? Number(topItem.clicks || 0) : 0
      },
      store: {
        ...store,
        categories: cats,
        items: sortedItems
      }
    });
  });

  // Create Affiliate Item
  app.post('/api/affiliate/admin/items', requireAuth, async (req, res) => {
    const b = req.body || {};
    if (!b.name || !b.affiliateUrl) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Tên sản phẩm và Link Affiliate!'
      });
    }

    const store = await getAffiliateStore();
    const code = String(b.code || '').trim() || computeNextCode(store.items);
    const newItem = {
      id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code,
      name: String(b.name).trim(),
      categoryId: String(b.categoryId || (store.categories[0]?.id || 'quan-chan-vay')),
      affiliateUrl: String(b.affiliateUrl).trim(), // Keep exact affiliate tracking link untouched!
      image: cleanImageHd(b.image) || '/media/bio-link/girlfriend-1.jpg',
      platform: b.platform || detectPlatform(b.affiliateUrl),
      price: Math.max(0, Number(b.price || 0)),
      badge: String(b.badge || '').trim().slice(0, 24),
      pinned: Boolean(b.pinned),
      enabled: b.enabled !== false,
      clicks: 0,
      createdAt: new Date().toISOString()
    };

    store.items.unshift(newItem);
    await saveAffiliateStore(store);
    res.json({
      success: true,
      item: newItem,
      nextCode: computeNextCode(store.items),
      message: `Đã đăng sản phẩm Affiliate #${newItem.code} thành công! ✨`
    });
  });

  // Bulk Import Multiple Affiliate Items
  app.post('/api/affiliate/admin/items/bulk', requireAuth, async (req, res) => {
    const { linesText, categoryId } = req.body || {};
    if (!linesText || !String(linesText).trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng dán danh sách sản phẩm cần đăng hàng loạt!' });
    }

    const store = await getAffiliateStore();
    const defaultCat = categoryId || store.categories[0]?.id || 'quan-chan-vay';
    const rawLines = String(linesText)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let added = 0;
    for (const line of rawLines) {
      const parts = line.split('|').map((p) => p.trim());
      let code = '';
      let name = '';
      let affiliateUrl = '';
      let image = '';

      if (parts.length >= 4) {
        [code, name, affiliateUrl, image] = parts;
      } else if (parts.length === 3) {
        if (/^https?:\/\//i.test(parts[1])) {
          [name, affiliateUrl, image] = parts;
        } else {
          [code, name, affiliateUrl] = parts;
        }
      } else if (parts.length === 2) {
        [name, affiliateUrl] = parts;
      } else {
        continue;
      }

      if (!name || !/^https?:\/\//i.test(affiliateUrl)) continue;
      const finalCode = code || computeNextCode(store.items);

      store.items.unshift({
        id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code: finalCode,
        name,
        categoryId: defaultCat,
        affiliateUrl,
        image: cleanImageHd(image) || '/media/bio-link/girlfriend-1.jpg',
        platform: detectPlatform(affiliateUrl),
        price: 0,
        badge: '',
        pinned: false,
        enabled: true,
        clicks: 0,
        createdAt: new Date().toISOString()
      });
      added++;
    }

    if (added === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không đọc được dòng hợp lệ. Hãy nhập theo cú pháp: Tên sản phẩm | Link Affiliate | Link Ảnh (tùy chọn)'
      });
    }

    await saveAffiliateStore(store);
    res.json({
      success: true,
      addedCount: added,
      message: `🎉 Đã đăng hàng loạt thành công ${added} sản phẩm Affiliate!`
    });
  });

  // Optional 1-Click Clone from existing Shop products into Affiliate Showcase
  app.post('/api/affiliate/admin/import-from-shop', requireAuth, async (req, res) => {
    try {
      const db = getMongoDb();
      let shopProducts = [];
      if (db) {
        const shopDoc = await db.collection('shop_state').findOne({ _id: 'na2hand_main_store' });
        shopProducts = shopDoc?.store?.products || [];
      }
      if (shopProducts.length === 0) {
        const localShopFile = path.join(dataDir, 'shop-store.json');
        if (fs.existsSync(localShopFile)) {
          shopProducts = JSON.parse(fs.readFileSync(localShopFile, 'utf8')).products || [];
        }
      }

      const store = await getAffiliateStore();
      let added = 0;

      for (const sp of shopProducts) {
        if (!sp || !sp.name || !sp.sourceUrl) continue;
        const exists = (store.items || []).some(
          (x) =>
            x.affiliateUrl === sp.sourceUrl ||
            String(x.name || '').trim().toLowerCase() === String(sp.name || '').trim().toLowerCase()
        );
        if (exists) continue;

        const lower = String(sp.name).toLowerCase();
        let catId = store.categories[0]?.id || 'quan-chan-vay';
        const matchCat = (re) => store.categories.find((c) => re.test(`${c.id} ${c.name}`));
        if (/quần|jeans|jean|chân váy/.test(lower)) catId = matchCat(/quan-chan-vay|quần|váy/i)?.id || catId;
        else if (/áo dài/.test(lower)) catId = matchCat(/ao-dai|áo dài/i)?.id || catId;
        else if (/áo|hoodie|sweater|cardigan|sơ mi/.test(lower)) catId = matchCat(/^ao\b|áo/i)?.id || catId;
        else if (/đầm|babydoll/.test(lower)) catId = matchCat(/dam|đầm/i)?.id || catId;
        else if (/set|bộ/.test(lower)) catId = matchCat(/set/i)?.id || catId;
        else if (/dép|giày|guốc/.test(lower)) catId = matchCat(/giay-dep|dép|giày/i)?.id || catId;
        else if (/túi|balo/.test(lower)) catId = matchCat(/tui-balo|túi/i)?.id || catId;
        else if (/sticker|kẹp|nơ|phụ kiện/.test(lower)) catId = matchCat(/phu-kien|phụ kiện/i)?.id || catId;

        store.items.push({
          id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          code: computeNextCode(store.items),
          name: sp.name,
          categoryId: catId,
          affiliateUrl: sp.sourceUrl,
          image: (sp.images && sp.images[0]) || '/media/bio-link/girlfriend-1.jpg',
          platform: detectPlatform(sp.sourceUrl),
          price: Number(sp.price || 0),
          badge: '',
          pinned: false,
          enabled: true,
          clicks: 0,
          createdAt: new Date().toISOString()
        });
        added++;
      }

      if (added > 0) await saveAffiliateStore(store);
      res.json({
        success: true,
        addedCount: added,
        message:
          added > 0
            ? `🎉 Đã đồng bộ nhanh ${added} sản phẩm từ Shop sang trang Affiliate (bạn có thể thay link hoa hồng rút gọn tùy ý)!`
            : 'Tất cả sản phẩm có link sàn trong Shop đều đã có trên trang Affiliate!'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update Affiliate Item
  app.put('/api/affiliate/admin/items/:id', requireAuth, async (req, res) => {
    const store = await getAffiliateStore();
    const idx = (store.items || []).findIndex((x) => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm Affiliate.' });

    const b = req.body || {};
    store.items[idx] = {
      ...store.items[idx],
      ...b,
      code: b.code !== undefined ? String(b.code).trim() : store.items[idx].code,
      name: b.name !== undefined ? String(b.name).trim() : store.items[idx].name,
      affiliateUrl: b.affiliateUrl !== undefined ? String(b.affiliateUrl).trim() : store.items[idx].affiliateUrl,
      image: b.image !== undefined ? cleanImageHd(b.image) : store.items[idx].image,
      price: b.price !== undefined ? Math.max(0, Number(b.price || 0)) : store.items[idx].price,
      updatedAt: new Date().toISOString()
    };

    await saveAffiliateStore(store);
    res.json({ success: true, item: store.items[idx], message: 'Đã cập nhật sản phẩm Affiliate!' });
  });

  // Duplicate Affiliate Item
  app.post('/api/affiliate/admin/items/:id/duplicate', requireAuth, async (req, res) => {
    const store = await getAffiliateStore();
    const orig = (store.items || []).find((x) => x.id === req.params.id);
    if (!orig) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm gốc.' });

    const clone = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code: computeNextCode(store.items),
      clicks: 0,
      createdAt: new Date().toISOString()
    };
    store.items.unshift(clone);
    await saveAffiliateStore(store);
    res.json({ success: true, item: clone, message: `Đã nhân bản thành mã #${clone.code}!` });
  });

  // Delete Affiliate Item
  app.delete('/api/affiliate/admin/items/:id', requireAuth, async (req, res) => {
    const store = await getAffiliateStore();
    store.items = (store.items || []).filter((x) => x.id !== req.params.id);
    await saveAffiliateStore(store);
    res.json({ success: true, message: 'Đã xóa sản phẩm Affiliate.' });
  });

  // Categories CRUD
  app.post('/api/affiliate/admin/categories', requireAuth, async (req, res) => {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục!' });
    }
    const store = await getAffiliateStore();
    const slug =
      String(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

    const maxOrder = (store.categories || []).reduce((m, c) => Math.max(m, Number(c.order || 0)), 0);
    store.categories.push({
      id: `${slug}-${Date.now().toString().slice(-3)}`,
      name: String(name).trim(),
      order: maxOrder + 1
    });
    await saveAffiliateStore(store);
    res.json({ success: true, categories: store.categories, message: 'Đã thêm danh mục mới!' });
  });

  app.put('/api/affiliate/admin/categories/reorder', requireAuth, async (req, res) => {
    const { orderedIds } = req.body || {};
    const store = await getAffiliateStore();
    if (Array.isArray(orderedIds)) {
      orderedIds.forEach((id, idx) => {
        const c = (store.categories || []).find((x) => x.id === id);
        if (c) c.order = idx + 1;
      });
      await saveAffiliateStore(store);
    }
    res.json({ success: true, categories: store.categories });
  });

  app.delete('/api/affiliate/admin/categories/:id', requireAuth, async (req, res) => {
    const store = await getAffiliateStore();
    store.categories = (store.categories || []).filter((c) => c.id !== req.params.id);
    await saveAffiliateStore(store);
    res.json({ success: true, categories: store.categories, message: 'Đã xóa danh mục.' });
  });

  // Profile & Theme Settings
  app.put('/api/affiliate/admin/profile', requireAuth, async (req, res) => {
    const store = await getAffiliateStore();
    const b = req.body || {};
    store.profile = {
      ...store.profile,
      ...b,
      itemsPerCategory: Math.max(4, Number(b.itemsPerCategory || store.profile.itemsPerCategory || 12))
    };
    await saveAffiliateStore(store);
    res.json({ success: true, profile: store.profile, message: 'Đã lưu giao diện & hồ sơ trang Affiliate!' });
  });

  // Auto-fetch OpenGraph / JSON-LD preview from an Affiliate URL without modifying the tracking link
  app.post('/api/affiliate/admin/fetch-meta', requireAuth, async (req, res) => {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(String(url).trim())) {
      return res.status(400).json({ success: false, message: 'Vui lòng dán đường dẫn hợp lệ trước!' });
    }

    try {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
      let current = String(url).trim();
      for (let hop = 0; hop < 6; hop++) {
        try {
          const r = await fetch(current, { redirect: 'manual', headers: { 'User-Agent': ua } });
          const loc = r.headers.get('location');
          if (loc && r.status >= 300 && r.status < 400) {
            current = new URL(loc, current).toString();
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      let name = '';
      let image = '';
      let price = 0;

      // Try extracting slug title directly from unwrapped Shopee URL even if Shopee hides HTML behind login!
      const slugMatch = current.match(/shopee\.vn\/([^/?#]+)-i\.\d+\.\d+/i);
      if (slugMatch) {
        try {
          name = decodeURIComponent(slugMatch[1]).replace(/-/g, ' ').trim();
        } catch {}
      }

      try {
        const pageRes = await fetch(current, { headers: { 'User-Agent': ua } });
        const html = await pageRes.text();
        const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || [])[1];
        const ogImg = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1];
        const ogPrice = (html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i) || [])[1];
        if (ogTitle && !/^shopee|^tiktok/i.test(ogTitle.trim())) {
          name = ogTitle.replace(/\s*\|\s*Shopee.*$/i, '').replace(/\s*-\s*TikTok.*$/i, '').trim();
        }
        if (ogImg) image = cleanImageHd(ogImg);
        if (ogPrice) price = Number(String(ogPrice).replace(/[^\d]/g, '') || 0);
      } catch {}

      res.json({
        success: true,
        resolvedUrl: current,
        platform: detectPlatform(current),
        name,
        image,
        price,
        message: name
          ? 'Đã tự động đọc thông tin từ đường dẫn!'
          : 'Đã nhận diện sàn! Bạn hãy nhập tên hoặc tải ảnh sản phẩm lên nhé.'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Không thể đọc metadata: ' + err.message });
    }
  });
}

module.exports = { registerAffiliateRoutes };
