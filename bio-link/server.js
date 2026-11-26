const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { registerShopRoutes } = require('./shop-routes');
const { registerAffiliateRoutes } = require('./affiliate-routes');
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
app.use(express.text({ type: 'text/plain', limit: '25mb' }));

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
      let cfgChanged = migrated.changed;
      if (!Array.isArray(migrated.data.socials)) migrated.data.socials = [];
      const zaloIdx = migrated.data.socials.findIndex((s) => s && s.platform === 'zalo');
      if (zaloIdx === -1) {
        migrated.data.socials.push({
          id: 'soc-zalo',
          platform: 'zalo',
          label: 'Zalo',
          url: 'https://zalo.me/0359427135',
          enabled: true,
          clicks: 0
        });
        cfgChanged = true;
      } else if (
        !migrated.data.socials[zaloIdx].url ||
        migrated.data.socials[zaloIdx].url === 'https://zalo.me' ||
        migrated.data.socials[zaloIdx].url.includes('0983877462')
      ) {
        migrated.data.socials[zaloIdx].url = 'https://zalo.me/0359427135';
        migrated.data.socials[zaloIdx].enabled = true;
        cfgChanged = true;
      }
      if (!Array.isArray(migrated.data.links)) migrated.data.links = [];
      const hasAffLink = migrated.data.links.some((l) => l && (l.id === 'link-affiliate' || l.url === '/affiliate'));
      if (!hasAffLink) {
        migrated.data.links.splice(1, 0, {
          id: 'link-affiliate',
          title: 'TỦ ĐỒ AFFILIATE & LINK ĐỒ XINH',
          subtitle: '',
          url: '/affiliate',
          icon: 'sparkles',
          badge: 'NEW',
          shimmer: true,
          enabled: true,
          clicks: 0
        });
        cfgChanged = true;
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(migrated.data, null, 2), 'utf8');
      if (cfgChanged) {
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

    // Sync unified Admin Account (/admin & /shop-admin) with MongoDB `na2hand_shop`
    await syncAuthWithMongo(mongoDb);

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
    { id: 'soc-7', platform: 'zalo', label: 'Zalo', url: 'https://zalo.me/0359427135', enabled: true, clicks: 0 },
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

// --- UNIFIED AUTH HELPERS (Shared 100% between /admin and /shop-admin) ---
const AUTH_SYNC_VERSION = 'unified_admin_123_v2';
const TOKEN_SIGN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'na2hand_unified_secret_2026';

function loadAuth() {
  const defaultAuth = { username: 'admin', password: '123', syncVersion: AUTH_SYNC_VERSION };
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      fs.writeFileSync(AUTH_FILE, JSON.stringify(defaultAuth, null, 2), 'utf8');
      return defaultAuth;
    }
    const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    // Auto-reset once to admin / 123 when upgrading to unified v2
    if (parsed.syncVersion !== AUTH_SYNC_VERSION) {
      fs.writeFileSync(AUTH_FILE, JSON.stringify(defaultAuth, null, 2), 'utf8');
      return defaultAuth;
    }
    return {
      username: parsed.username || 'admin',
      password: String(parsed.password ?? '123'),
      syncVersion: AUTH_SYNC_VERSION
    };
  } catch (err) {
    return defaultAuth;
  }
}

async function saveAuth(auth) {
  const payload = {
    username: String(auth.username || 'admin').trim() || 'admin',
    password: String(auth.password ?? '123'),
    syncVersion: AUTH_SYNC_VERSION
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(payload, null, 2), 'utf8');
  if (mongoConnected && mongoDb) {
    try {
      await mongoDb.collection('admin_auth').updateOne(
        { _id: 'shared_admin_account' },
        { $set: { ...payload, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch {}
  }
  return payload;
}

async function syncAuthWithMongo(db) {
  if (!db) return;
  try {
    const col = db.collection('admin_auth');
    const remote = await col.findOne({ _id: 'shared_admin_account' });
    if (remote && remote.syncVersion === AUTH_SYNC_VERSION && remote.username && remote.password !== undefined) {
      const synced = {
        username: remote.username,
        password: String(remote.password),
        syncVersion: AUTH_SYNC_VERSION
      };
      fs.writeFileSync(AUTH_FILE, JSON.stringify(synced, null, 2), 'utf8');
    } else {
      const resetAuth = { username: 'admin', password: '123', syncVersion: AUTH_SYNC_VERSION };
      fs.writeFileSync(AUTH_FILE, JSON.stringify(resetAuth, null, 2), 'utf8');
      await col.updateOne(
        { _id: 'shared_admin_account' },
        { $set: { ...resetAuth, updatedAt: new Date() } },
        { upsert: true }
      );
      console.log('🔐 [Auth] Đã đồng bộ tài khoản dùng chung (/admin & /shop-admin): tk=admin | mk=123');
    }
  } catch {}
}

function issueUnifiedToken(auth) {
  const sig = crypto
    .createHmac('sha256', TOKEN_SIGN_SECRET)
    .update(`${String(auth.username).toLowerCase()}:${auth.password}`)
    .digest('hex');
  return `na2u_${sig}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookieToken = parseCookies(req).na2hand_admin_token || '';
  const token = bearerToken || cookieToken;

  const auth = loadAuth();
  const expected = issueUnifiedToken(auth);

  if (!token || token !== expected) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập hết hạn hoặc mật khẩu vừa thay đổi. Vui lòng đăng nhập lại!'
    });
  }
  next();
}

// --- API ROUTES ---

// Get bio configuration & optionally track real page view
app.get('/api/config', async (req, res) => {
  const config = loadConfigFromFile();
  if (!config.seo) config.seo = {};
  config.seo.footerText = 'Made with ♡ by My Love';

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

// Helper: Group raw events by IP into a single-row chronological User Action Flow
function buildIpFlowsFromLogs(rawLogs) {
  const ipMap = new Map();

  // Sort oldest -> newest so steps inside each IP are in chronological order
  const chronological = [...rawLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const ev of chronological) {
    const ip = String(ev.ip || 'unknown').replace(/^::ffff:/, '').trim() || 'unknown';
    const ts = new Date(ev.timestamp);
    const tsIso = isNaN(ts.getTime()) ? new Date().toISOString() : ts.toISOString();

    if (!ipMap.has(ip)) {
      ipMap.set(ip, {
        ip,
        firstSeen: tsIso,
        lastSeen: tsIso,
        device: ev.device || 'Khác',
        os: ev.os || '',
        browser: ev.browser || 'Trình duyệt',
        trafficSource: ev.trafficSource || 'Trực tiếp',
        isSocial: Boolean(ev.trafficSource && ev.trafficSource !== 'Trực tiếp'),
        viewCount: 0,
        clickCount: 0,
        shopCount: 0,
        steps: []
      });
    }

    const group = ipMap.get(ip);
    group.lastSeen = tsIso;
    if (ev.device && ev.device !== 'Khác') group.device = ev.device;
    if (ev.os && ev.os !== 'Khác') group.os = ev.os;
    if (ev.browser && ev.browser !== 'Trình duyệt') group.browser = ev.browser;
    if (ev.trafficSource && ev.trafficSource !== 'Trực tiếp') {
      group.trafficSource = ev.trafficSource;
      group.isSocial = true;
    }

    const evType = ev.type || 'view';
    if (evType === 'click' || evType === 'order') {
      group.clickCount++;
    } else if (evType === 'shop_view') {
      group.shopCount++;
      group.viewCount++;
    } else {
      group.viewCount++;
    }

    const title =
      ev.targetTitle ||
      (evType === 'click' ? 'Bấm Link' : evType === 'shop_view' ? 'Vào Cửa hàng /shop' : 'Xem trang Bio');

    // Merge consecutive identical view refreshes within 4 seconds so rapid F5 doesn't clutter the 1-line flow
    const prevStep = group.steps[group.steps.length - 1];
    if (
      prevStep &&
      prevStep.type === evType &&
      prevStep.title === title &&
      Math.abs(new Date(tsIso).getTime() - new Date(prevStep.timestamp).getTime()) < 4000
    ) {
      prevStep.repeat = (prevStep.repeat || 1) + 1;
      prevStep.timestamp = tsIso;
    } else {
      group.steps.push({
        type: evType,
        title,
        url: ev.targetUrl || '/',
        timestamp: tsIso,
        repeat: 1
      });
    }
  }

  // Sort IP rows by most recent activity descending
  return Array.from(ipMap.values()).sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
}

// Get detailed real-time analytics & IP-grouped visitor flows (with range & 30-row pagination)
app.get('/api/analytics', requireAuth, async (req, res) => {
  const config = loadConfigFromFile();
  const range = String(req.query.range || 'week'); // 'day' | 'week' | 'month' | 'year' | 'all'
  const filter = String(req.query.filter || 'all'); // 'all' | 'clicked' | 'social' | 'shop'
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '30'), 10) || 30));

  const now = new Date();
  let startDate = new Date(0);
  if (range === 'day') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const localLogs = loadLocalLogs().filter((l) => new Date(l.timestamp) >= startDate);
  let allLogs = localLogs;

  if (mongoConnected && mongoDb) {
    try {
      const query = range === 'all' ? {} : { timestamp: { $gte: startDate } };
      const mongoLogs = await mongoDb
        .collection('bio_analytics')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(5000)
        .toArray();

      // Merge MongoDB + local logs deduplicated by id
      const seenIds = new Set();
      const merged = [];
      for (const item of [...mongoLogs, ...localLogs]) {
        const key = item.id || (item._id ? String(item._id) : `${item.ip}_${item.timestamp}`);
        if (!seenIds.has(key)) {
          seenIds.add(key);
          merged.push(item);
        }
      }
      allLogs = merged;
    } catch (e) {}
  }

  const allFlows = buildIpFlowsFromLogs(allLogs);

  const counts = {
    all: allFlows.length,
    clicked: allFlows.filter((f) => f.clickCount > 0).length,
    social: allFlows.filter((f) => f.isSocial).length,
    shop: allFlows.filter((f) => f.shopCount > 0).length
  };

  let filteredFlows = allFlows;
  if (filter === 'clicked') {
    filteredFlows = allFlows.filter((f) => f.clickCount > 0);
  } else if (filter === 'social') {
    filteredFlows = allFlows.filter((f) => f.isSocial);
  } else if (filter === 'shop') {
    filteredFlows = allFlows.filter((f) => f.shopCount > 0);
  }

  const totalItems = filteredFlows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedFlows = filteredFlows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalViews = Number(config.analytics?.totalViews) || 0;
  const linksClicks = (config.links || []).reduce((sum, l) => sum + (Number(l.clicks) || 0), 0);
  const fcClicks = Number(config.featuredCard?.clicks) || 0;
  const socClicks = (config.socials || []).reduce((sum, s) => sum + (Number(s.clicks) || 0), 0);
  const totalClicks = linksClicks + fcClicks + socClicks;
  const activeLinks = (config.links || []).filter((l) => l.enabled !== false).length;
  const ctr = totalViews > 0 ? Math.min(100, Number(((totalClicks / totalViews) * 100).toFixed(1))) : 0;

  const settings = loadMongoSettings();

  res.json({
    success: true,
    summary: {
      totalViews,
      totalClicks,
      activeLinks,
      ctr,
      uniqueVisitors: allFlows.length
    },
    mongo: {
      connected: mongoConnected,
      dbName: settings.dbName,
      uriMasked: settings.uri.replace(/:([^:@]+)@/, ':****@'),
      error: mongoErrorMsg
    },
    range,
    filter,
    counts,
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    },
    ipFlows: pagedFlows,
    recentLogs: allLogs.slice(0, 50)
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

// Admin Login (Unified for both /admin and /shop-admin)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const auth = loadAuth();

  if (
    String(username || '').trim().toLowerCase() === String(auth.username).toLowerCase() &&
    String(password || '') === String(auth.password)
  ) {
    const token = issueUnifiedToken(auth);
    res.setHeader(
      'Set-Cookie',
      `na2hand_admin_token=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
    );
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

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'na2hand_admin_token=; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ success: true });
});

// Verify token
app.get('/api/auth/verify', requireAuth, (req, res) => {
  const auth = loadAuth();
  res.json({ success: true, username: auth.username, token: issueUnifiedToken(auth) });
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
      seo: {
        ...current.seo,
        ...(incoming.seo || {}),
        footerText: 'Made with ♡ by My Love'
      },
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

// Change admin credentials (syncs immediately across /admin, /shop-admin & MongoDB)
app.post('/api/password', requireAuth, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  const auth = loadAuth();

  if (String(currentPassword || '') !== String(auth.password)) {
    return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác!' });
  }
  if (!newPassword || String(newPassword).length < 3) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự.' });
  }

  const saved = await saveAuth({
    username: String(newUsername || auth.username).trim() || 'admin',
    password: String(newPassword)
  });
  const newToken = issueUnifiedToken(saved);
  res.setHeader(
    'Set-Cookie',
    `na2hand_admin_token=${encodeURIComponent(newToken)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  );
  res.json({
    success: true,
    token: newToken,
    username: saved.username,
    message: 'Đã đổi thông tin đăng nhập đồng bộ cho cả trang Bio Admin & Shop Admin!'
  });
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

// Register Full E-Commerce Shop Routes & Passio-Style Affiliate Showcase Routes (MongoDB `na2hand_shop`)
registerShopRoutes(app, {
  dataDir: DATA_DIR,
  getMongoDb: () => (mongoConnected ? mongoDb : null),
  requireAuth,
  recordAnalyticsEvent
});

registerAffiliateRoutes(app, {
  dataDir: DATA_DIR,
  getMongoDb: () => (mongoConnected ? mongoDb : null),
  requireAuth,
  recordAnalyticsEvent
});

// Page Routes
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/shop-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop-admin.html'));
});

app.get('/affiliate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'affiliate.html'));
});

app.get('/affiliate-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'affiliate-admin.html'));
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
