const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { registerShopRoutes } = require('./shop-routes');
const {
  uploadToFileStorage,
  listProjectFiles,
  deleteProjectFile,
  rewriteLegacyBioUrls,
  cloneExistingBioFilesToContainer,
  streamFromStorageContainer
} = require('./file-storage-client');

const app = express();
const PORT = process.env.PORT || 3005;

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_IMAGES_DIR = path.join(__dirname, 'public', 'images');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const LOGS_FILE = path.join(DATA_DIR, 'analytics-logs.json');
const MONGO_SETTINGS_FILE = path.join(DATA_DIR, 'mongo-settings.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(compression());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Stream media files directly from dedicated ultra-lightweight `file-storage` container
app.get('/media/*', (req, res) => {
  const relPath = req.params[0] || '';
  streamFromStorageContainer(relPath, req, res, () => {
    const baseName = path.basename(relPath);
    const localUpload = path.join(UPLOADS_DIR, baseName);
    if (fs.existsSync(localUpload)) return res.sendFile(localUpload);
    const localImg = path.join(PUBLIC_IMAGES_DIR, baseName);
    if (fs.existsSync(localImg)) return res.sendFile(localImg);
    res.status(404).end('File not found');
  });
});

// Backward-compatible redirect/stream for any legacy /uploads/:filename links
app.get('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename || '');
  streamFromStorageContainer(`bio-link/${filename}`, req, res, () => {
    const localUpload = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(localUpload)) return res.sendFile(localUpload);
    res.status(404).end('File not found');
  });
});

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// --- MONGODB ATLAS CONNECTION (Dedicated Database `na2hand_shop` - Separated from Pofology!) ---
const DEFAULT_MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://datt19112001_db_user:1@mongodbdatnt.bc8xywz.mongodb.net/?retryWrites=true&w=majority';
const DEFAULT_DB_NAME = process.env.MONGODB_DB || 'na2hand_shop';

let mongoClient = null;
let mongoDb = null;
let mongoConnected = false;
let mongoErrorMsg = '';

function loadMongoSettings() {
  try {
    if (fs.existsSync(MONGO_SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MONGO_SETTINGS_FILE, 'utf8'));
      const savedDb = parsed.dbName && parsed.dbName !== 'signalr_chat' ? parsed.dbName : DEFAULT_DB_NAME;
      return {
        uri: parsed.uri || DEFAULT_MONGO_URI,
        dbName: savedDb
      };
    }
  } catch (e) {}
  return { uri: DEFAULT_MONGO_URI, dbName: DEFAULT_DB_NAME };
}

async function initMongoConnection(customUri, customDbName) {
  const settings = loadMongoSettings();
  const uri = customUri || settings.uri;
  const dbName = customDbName || settings.dbName;

  if (customUri || customDbName) {
    fs.writeFileSync(MONGO_SETTINGS_FILE, JSON.stringify({ uri, dbName }, null, 2), 'utf8');
  }

  try {
    if (mongoClient) {
      await mongoClient.close().catch(() => {});
    }
    mongoClient = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
      socketTimeoutMS: 30000,
      maxPoolSize: 8
    });
    await mongoClient.connect();
    mongoClient.on('close', () => {
      mongoConnected = false;
      mongoDb = null;
    });
    mongoDb = mongoClient.db(dbName);
    mongoConnected = true;
    mongoErrorMsg = '';
    console.log(`✅ [MongoDB Atlas] Đã kết nối tới database riêng "${dbName}" (tách biệt hoàn toàn khỏi Pofology)`);

    // Sync Bio config between MongoDB `na2hand_shop` and local disk (auto-rewriting legacy /uploads/ links -> /media/bio-link/)
    const col = mongoDb.collection('bio_config');
    const remoteDoc = await col.findOne({ _id: 'main_bio_config' });
    if (remoteDoc && remoteDoc.config) {
      const migrated = rewriteLegacyBioUrls(remoteDoc.config);
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(migrated.data, null, 2), 'utf8');
      if (migrated.changed) {
        await col.updateOne(
          { _id: 'main_bio_config' },
          { $set: { config: migrated.data, updatedAt: new Date() } }
        );
      }
    } else {
      const localCfg = loadConfigFromFile();
      await col.updateOne(
        { _id: 'main_bio_config' },
        { $set: { config: localCfg, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    // Write Keep-Alive heartbeat into `na2hand_shop`
    await mongoDb.collection('keepalive_heartbeats').updateOne(
      { _id: 'na2hand_keepalive' },
      { $set: { lastPingAt: new Date() }, $inc: { pingCount: 1 } },
      { upsert: true }
    );

    return true;
  } catch (err) {
    mongoConnected = false;
    mongoDb = null;
    mongoErrorMsg = err.message || 'Không thể kết nối MongoDB Atlas';
    console.warn(`⚠️ [MongoDB] Chưa kết nối được (${mongoErrorMsg}). Hệ thống sẽ tự động thử kết nối lại định kỳ.`);
    return false;
  }
}

// Auto-reconnect & Keep-Alive scheduler every 5 minutes if disconnected, or every 6 hours if connected
setInterval(async () => {
  if (!mongoConnected || !mongoDb) {
    await initMongoConnection();
  } else {
    try {
      await mongoDb.collection('keepalive_heartbeats').updateOne(
        { _id: 'na2hand_keepalive' },
        { $set: { lastPingAt: new Date() }, $inc: { pingCount: 1 } },
        { upsert: true }
      );
    } catch {
      mongoConnected = false;
      mongoDb = null;
    }
  }
}, 5 * 60 * 1000);

// Default configuration with 100% REAL counters starting at 0
const DEFAULT_CONFIG = {
  profile: {
    name: 'HIKARI MAEVE',
    subtitle: 'Fashion | Lifestyle | Influencer',
    quote: "Fashion inspo for the girl who's always on the go ✨",
    avatar: '/media/bio-link/girlfriend-1.jpg',
    verifiedBadge: true
  },
  theme: {
    template: 'template2',
    preset: 'blush-rose',
    primaryColor: '#d97793',
    secondaryColor: '#f7d6e0',
    accentColor: '#b55672',
    bgType: 'image-overlay',
    bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    portraitBgImage: '/media/bio-link/girlfriend-1.jpg',
    bgGradientStart: '#f6c4d2',
    bgGradientMid: '#e89ab2',
    bgGradientEnd: '#c8738e',
    bgOverlayColor: '#8d435b',
    bgOverlayOpacity: 35,
    bgBlur: 3,
    avatarFrame: 'organic',
    avatarSize: 124,
    buttonStyle: 'frosted-light',
    buttonRadius: 'pill',
    buttonBgColor: '#ffffff',
    buttonBgOpacity: 88,
    buttonTextColor: '#522938',
    textColor: '#ffffff',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Plus Jakarta Sans',
    uppercaseLinks: true,
    particleEffect: 'bokeh',
    socialPosition: 'bottom'
  },
  links: [
    {
      id: 'link-1',
      title: 'FASHION STORE',
      subtitle: 'Bộ sưu tập thời trang & Lookbook mới nhất',
      url: 'https://shopee.vn',
      icon: 'shopping-bag',
      badge: 'HOT',
      shimmer: true,
      enabled: true,
      clicks: 0
    },
    {
      id: 'link-2',
      title: 'INSPIRATION',
      subtitle: 'Góc phối đồ OOTD & phong cách sống mỗi ngày',
      url: 'https://www.instagram.com',
      icon: 'sparkles',
      badge: '',
      shimmer: false,
      enabled: true,
      clicks: 0
    },
    {
      id: 'link-3',
      title: 'BEAUTY TIPS',
      subtitle: 'Bí quyết skincare & makeup trong veo tự nhiên',
      url: 'https://www.tiktok.com',
      icon: 'heart',
      badge: 'NEW',
      shimmer: false,
      enabled: true,
      clicks: 0
    },
    {
      id: 'link-4',
      title: 'FREE E-BOOK',
      subtitle: 'Tải miễn phí cẩm nang định hình phong cách cá nhân',
      url: 'https://drive.google.com',
      icon: 'book-open',
      badge: 'FREE',
      shimmer: false,
      enabled: true,
      clicks: 0
    }
  ],
  featuredCard: {
    enabled: true,
    title: 'GET MY ENTIRE COLLECTION',
    subtitle: 'Khám phá trọn bộ sưu tập yêu thích của mình',
    url: 'https://shopee.vn',
    image: '/media/bio-link/girlfriend-2.jpg',
    clicks: 0
  },
  socials: [
    { id: 'soc-1', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com', enabled: true, clicks: 0 },
    { id: 'soc-2', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com', enabled: true, clicks: 0 },
    { id: 'soc-3', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com', enabled: true, clicks: 0 },
    { id: 'soc-4', platform: 'mail', label: 'Email', url: 'mailto:hello@hikarimaeve.com', enabled: true, clicks: 0 },
    { id: 'soc-5', platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com', enabled: false, clicks: 0 },
    { id: 'soc-6', platform: 'shopee', label: 'Shopee', url: 'https://shopee.vn', enabled: false, clicks: 0 },
    { id: 'soc-7', platform: 'zalo', label: 'Zalo', url: 'https://zalo.me', enabled: false, clicks: 0 },
    { id: 'soc-8', platform: 'threads', label: 'Threads', url: 'https://threads.net', enabled: false, clicks: 0 }
  ],
  seo: {
    pageTitle: 'Hikari Maeve ✨ Fashion • Lifestyle • Influencer',
    metaDescription: "Fashion inspo for the girl who's always on the go. Khám phá cửa hàng thời trang, bí quyết làm đẹp và bộ sưu tập mới nhất.",
    showShareButton: true,
    footerText: 'Made with ♡ by My Love'
  },
  analytics: {
    totalViews: 0
  }
};

function loadConfigFromFile() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed,
      profile: { ...DEFAULT_CONFIG.profile, ...(parsed.profile || {}) },
      theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme || {}) },
      featuredCard: { ...DEFAULT_CONFIG.featuredCard, ...(parsed.featuredCard || {}) },
      seo: { ...DEFAULT_CONFIG.seo, ...(parsed.seo || {}) },
      analytics: { ...DEFAULT_CONFIG.analytics, ...(parsed.analytics || {}) }
    };
    const migrated = rewriteLegacyBioUrls(merged);
    if (migrated.changed) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(migrated.data, null, 2), 'utf8');
    }
    return migrated.data;
  } catch (err) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

async function saveConfigEverywhere(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  if (mongoConnected && mongoDb) {
    try {
      await mongoDb.collection('bio_config').updateOne(
        { _id: 'main_bio_config' },
        { $set: { config, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      console.warn('[MongoDB] Lỗi ghi bio_config:', err.message);
    }
  }
}

// --- REAL ANALYTICS EVENT LOGGING (MongoDB + Local JSON) ---
function loadLocalLogs() {
  try {
    if (!fs.existsSync(LOGS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveLocalLogs(logs) {
  const trimmed = logs.slice(0, 500); // Keep latest 500 events locally
  fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

function parseVisitorInfo(req, extra = {}) {
  const ua = String(req.headers['user-agent'] || extra.userAgent || '');
  const ip =
    req.headers['cf-connecting-ip'] ||
    (req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : '') ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  // Detect Device & OS
  let device = 'Desktop';
  let os = 'Khác';
  if (/iPhone/i.test(ua)) {
    device = 'iPhone';
    os = 'iOS';
  } else if (/iPad/i.test(ua)) {
    device = 'iPad';
    os = 'iPadOS';
  } else if (/Android/i.test(ua)) {
    device = 'Android';
    const match = ua.match(/Android\s+([\d.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Windows/i.test(ua)) {
    device = 'Máy tính';
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'MacBook/Mac';
    os = 'macOS';
  }

  // Detect In-App Browsers & Standard Browsers
  let browser = 'Trình duyệt';
  let isSocialApp = false;
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) {
    browser = 'Facebook App';
    isSocialApp = true;
  } else if (/Messenger/i.test(ua)) {
    browser = 'Messenger App';
    isSocialApp = true;
  } else if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) {
    browser = 'TikTok App';
    isSocialApp = true;
  } else if (/Instagram/i.test(ua)) {
    browser = 'Instagram App';
    isSocialApp = true;
  } else if (/Zalo/i.test(ua)) {
    browser = 'Zalo App';
    isSocialApp = true;
  } else if (/Edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  }

  // Detect Traffic Source
  const referrer = String(extra.referrer || req.headers['referer'] || '');
  const fbclid = extra.fbclid || null;
  let trafficSource = 'Trực tiếp';
  if (fbclid || /facebook\.com|fb\.com|m\.me/i.test(referrer) || /FBAN|FBAV|Messenger/i.test(ua)) {
    trafficSource = 'Facebook';
  } else if (/tiktok\.com/i.test(referrer) || /TikTok|musical_ly/i.test(ua)) {
    trafficSource = 'TikTok';
  } else if (/instagram\.com/i.test(referrer) || /Instagram/i.test(ua)) {
    trafficSource = 'Instagram';
  } else if (/zalo/i.test(referrer) || /Zalo/i.test(ua)) {
    trafficSource = 'Zalo';
  } else if (/google\./i.test(referrer)) {
    trafficSource = 'Google';
  } else if (referrer && !referrer.includes(req.headers.host || '')) {
    try {
      trafficSource = new URL(referrer).hostname;
    } catch (e) {
      trafficSource = 'Giới thiệu';
    }
  }

  return {
    ip: String(ip).replace(/^::ffff:/, ''),
    device,
    os,
    browser,
    isSocialApp,
    trafficSource,
    referrer,
    fbclid,
    userAgent: ua
  };
}

async function recordAnalyticsEvent(req, eventData) {
  const visitor = parseVisitorInfo(req, eventData);
  const logItem = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: eventData.type || 'view', // 'view' | 'click'
    targetId: eventData.targetId || null,
    targetTitle: eventData.targetTitle || (eventData.type === 'view' ? 'Xem trang Bio' : 'Click Link'),
    targetUrl: eventData.targetUrl || '/',
    ...visitor,
    timestamp: new Date().toISOString()
  };

  // 1. Save to local logs
  const logs = loadLocalLogs();
  logs.unshift(logItem);
  saveLocalLogs(logs);

  // 2. Save strictly to dedicated `na2hand_shop.bio_analytics` collection on MongoDB Atlas
  if (mongoConnected && mongoDb) {
    try {
      await mongoDb.collection('bio_analytics').insertOne({
        ...logItem,
        timestamp: new Date(logItem.timestamp)
      });
    } catch (err) {
      console.warn('[MongoDB] Lỗi ghi sự kiện bio_analytics:', err.message);
    }
  }

  return logItem;
}

// --- AUTH HELPERS ---
function loadAuth() {
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      const defaultAuth = { username: 'admin', password: '123' };
      fs.writeFileSync(AUTH_FILE, JSON.stringify(defaultAuth, null, 2), 'utf8');
      return defaultAuth;
    }
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  } catch (err) {
    return { username: 'admin', password: '123' };
  }
}

function saveAuth(auth) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf8');
}

const activeTokens = new Set();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
  }
  next();
}

// --- API ROUTES ---

// Get bio configuration & optionally track real page view
app.get('/api/config', async (req, res) => {
  const config = loadConfigFromFile();

  if (req.query.track === '1') {
    config.analytics.totalViews = (Number(config.analytics.totalViews) || 0) + 1;
    await saveConfigEverywhere(config);
    await recordAnalyticsEvent(req, {
      type: 'view',
      targetTitle: 'Truy cập trang Bio',
      referrer: req.query.ref || req.headers['referer'] || '',
      fbclid: req.query.fbclid || null
    });
  }

  res.json({
    success: true,
    data: config,
    mongo: {
      connected: mongoConnected,
      dbName: loadMongoSettings().dbName
    }
  });
});

// Track real link, featured card, or social icon click
app.post('/api/click', async (req, res) => {
  const { id, title, url, referrer, fbclid } = req.body || {};
  if (!id) return res.status(400).json({ success: false });

  const config = loadConfigFromFile();
  let targetTitle = title || id;
  let targetUrl = url || '';
  let updatedClicks = 0;

  if (id === 'featured-card' && config.featuredCard) {
    config.featuredCard.clicks = (Number(config.featuredCard.clicks) || 0) + 1;
    updatedClicks = config.featuredCard.clicks;
    targetTitle = `Banner: ${config.featuredCard.title || 'Featured Card'}`;
    targetUrl = config.featuredCard.url || '';
  } else {
    const link = (config.links || []).find((l) => l.id === id);
    if (link) {
      link.clicks = (Number(link.clicks) || 0) + 1;
      updatedClicks = link.clicks;
      targetTitle = link.title;
      targetUrl = link.url;
    } else {
      const soc = (config.socials || []).find((s) => s.id === id || s.platform === id);
      if (soc) {
        soc.clicks = (Number(soc.clicks) || 0) + 1;
        updatedClicks = soc.clicks;
        targetTitle = `MXH: ${soc.label || soc.platform}`;
        targetUrl = soc.url;
      }
    }
  }

  await saveConfigEverywhere(config);
  await recordAnalyticsEvent(req, {
    type: 'click',
    targetId: id,
    targetTitle,
    targetUrl,
    referrer,
    fbclid
  });

  res.json({ success: true, clicks: updatedClicks });
});

// Get detailed real-time analytics & visitor logs for Admin
app.get('/api/analytics', requireAuth, async (req, res) => {
  const config = loadConfigFromFile();
  let recentLogs = loadLocalLogs();

  if (mongoConnected && mongoDb) {
    try {
      const mongoLogs = await mongoDb
        .collection('bio_analytics')
        .find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      if (mongoLogs.length > 0) {
        recentLogs = mongoLogs;
      }
    } catch (e) {}
  }

  const totalViews = Number(config.analytics?.totalViews) || 0;
  const linksClicks = (config.links || []).reduce((sum, l) => sum + (Number(l.clicks) || 0), 0);
  const fcClicks = Number(config.featuredCard?.clicks) || 0;
  const socClicks = (config.socials || []).reduce((sum, s) => sum + (Number(s.clicks) || 0), 0);
  const totalClicks = linksClicks + fcClicks + socClicks;
  const activeLinks = (config.links || []).filter((l) => l.enabled !== false).length;
  const ctr = totalViews > 0 ? Math.min(100, Number(((totalClicks / totalViews) * 100).toFixed(1))) : 0;

  const uniqueIps = new Set(recentLogs.map((l) => l.ip).filter(Boolean)).size;
  const settings = loadMongoSettings();

  res.json({
    success: true,
    summary: {
      totalViews,
      totalClicks,
      activeLinks,
      ctr,
      uniqueVisitors: uniqueIps
    },
    mongo: {
      connected: mongoConnected,
      dbName: settings.dbName,
      uriMasked: settings.uri.replace(/:([^:@]+)@/, ':****@'),
      error: mongoErrorMsg
    },
    recentLogs: recentLogs.slice(0, 50)
  });
});

// Configure or reconnect MongoDB from Admin
app.post('/api/mongo/connect', requireAuth, async (req, res) => {
  const { uri, dbName } = req.body || {};
  const ok = await initMongoConnection(uri, dbName);
  const settings = loadMongoSettings();
  res.json({
    success: ok,
    connected: mongoConnected,
    dbName: settings.dbName,
    error: mongoErrorMsg,
    message: ok
      ? `Đã kết nối thành công tới MongoDB (${settings.dbName})!`
      : `Không thể kết nối MongoDB: ${mongoErrorMsg}`
  });
});

// Admin Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const auth = loadAuth();

  if (
    String(username || '').trim().toLowerCase() === String(auth.username).toLowerCase() &&
    String(password || '') === String(auth.password)
  ) {
    const token = crypto.randomBytes(24).toString('hex');
    activeTokens.add(token);
    return res.json({
      success: true,
      token,
      username: auth.username
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Tên đăng nhập hoặc mật khẩu không đúng!'
  });
});

// Verify token
app.get('/api/auth/verify', requireAuth, (req, res) => {
  const auth = loadAuth();
  res.json({ success: true, username: auth.username });
});

// Update full config (Preserves real click & view counters!)
app.put('/api/config', requireAuth, async (req, res) => {
  try {
    const current = loadConfigFromFile();
    const incoming = req.body || {};

    // Preserve real click counts on existing links
    const currentClicksMap = new Map((current.links || []).map((l) => [l.id, Number(l.clicks) || 0]));
    const incomingLinks = Array.isArray(incoming.links)
      ? incoming.links.map((l) => ({
          ...l,
          clicks: currentClicksMap.has(l.id) ? currentClicksMap.get(l.id) : Number(l.clicks) || 0
        }))
      : current.links;

    const updated = {
      profile: { ...current.profile, ...(incoming.profile || {}) },
      theme: { ...current.theme, ...(incoming.theme || {}) },
      links: incomingLinks,
      featuredCard: {
        ...current.featuredCard,
        ...(incoming.featuredCard || {}),
        clicks: Number(current.featuredCard?.clicks) || 0
      },
      socials: Array.isArray(incoming.socials) ? incoming.socials : current.socials,
      seo: { ...current.seo, ...(incoming.seo || {}) },
      analytics: current.analytics
    };

    await saveConfigEverywhere(updated);
    res.json({ success: true, message: 'Đã lưu thay đổi thành công!', data: updated });
  } catch (err) {
    console.error('Error saving config:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu cấu hình.' });
  }
});

// Reset analytics to 0 or restore default config
app.post('/api/reset', requireAuth, async (req, res) => {
  const { type } = req.body || {};
  if (type === 'analytics') {
    const config = loadConfigFromFile();
    config.analytics.totalViews = 0;
    config.links = (config.links || []).map((l) => ({ ...l, clicks: 0 }));
    if (config.featuredCard) config.featuredCard.clicks = 0;
    config.socials = (config.socials || []).map((s) => ({ ...s, clicks: 0 }));
    await saveConfigEverywhere(config);
    saveLocalLogs([]);
    if (mongoConnected && mongoDb) {
      await mongoDb.collection('bio_analytics').deleteMany({}).catch(() => {});
    }
    return res.json({ success: true, message: 'Đã đặt lại toàn bộ thống kê thực tế về 0.', data: config });
  }

  const fresh = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  await saveConfigEverywhere(fresh);
  return res.json({ success: true, message: 'Đã khôi phục cấu hình mẫu mặc định.', data: fresh });
});

// Change admin credentials
app.post('/api/password', requireAuth, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  const auth = loadAuth();

  if (String(currentPassword || '') !== String(auth.password)) {
    return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác!' });
  }
  if (!newPassword || String(newPassword).length < 3) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự.' });
  }

  const updatedAuth = {
    username: String(newUsername || auth.username).trim() || 'admin',
    password: String(newPassword)
  };
  saveAuth(updatedAuth);
  res.json({ success: true, message: 'Đổi thông tin đăng nhập thành công!' });
});

// Upload file directly to dedicated `file-storage` Docker container
app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    const { dataUrl, filename, folder, overwriteExactName } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ success: false, message: 'Dữ liệu file không hợp lệ.' });
    }

    const result = await uploadToFileStorage({
      project: 'bio-link',
      folder: folder || '',
      filename: filename || 'image.jpg',
      dataUrl,
      overwriteExactName: Boolean(overwriteExactName)
    });

    return res.json({
      success: true,
      url: result.url,
      relPath: result.relPath,
      size: result.size,
      message: 'Tải file lên Container Lưu Trữ Tập Trung thành công!'
    });
  } catch (err) {
    console.error('Upload to file-storage error:', err);
    res.status(500).json({ success: false, message: 'Không thể lưu file vào container lưu trữ: ' + err.message });
  }
});

// Admin endpoint to inspect & manage files stored in `file-storage` container
app.get('/api/storage/files', requireAuth, async (req, res) => {
  try {
    const data = await listProjectFiles('bio-link');
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/storage/files', requireAuth, async (req, res) => {
  try {
    const { relPath } = req.body || {};
    if (!relPath) return res.status(400).json({ success: false, message: 'Thiếu đường dẫn file.' });
    const data = await deleteProjectFile(relPath);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Register Full E-Commerce Shop Routes (MongoDB `na2hand_shop`)
registerShopRoutes(app, {
  dataDir: DATA_DIR,
  getMongoDb: () => (mongoConnected ? mongoDb : null),
  requireAuth
});

// Page Routes
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/shop-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop-admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize MongoDB connection, auto-clone any legacy files to `file-storage` container, and start server
initMongoConnection().finally(() => {
  cloneExistingBioFilesToContainer({
    uploadsDir: UPLOADS_DIR,
    publicImagesDir: PUBLIC_IMAGES_DIR
  }).catch(() => {});
  setTimeout(() => {
    cloneExistingBioFilesToContainer({
      uploadsDir: UPLOADS_DIR,
      publicImagesDir: PUBLIC_IMAGES_DIR
    }).catch(() => {});
  }, 10000);

  app.listen(PORT, () => {
    console.log(`🌸 Bio Link đang chạy tại:        http://localhost:${PORT}`);
    console.log(`🛍️ Shop Bán Hàng Online (Cute):   http://localhost:${PORT}/shop`);
    console.log(`✨ Quản trị Bio Link:             http://localhost:${PORT}/admin`);
    console.log(`🎀 Quản trị Cửa Hàng Online:      http://localhost:${PORT}/shop-admin`);
  });
});
