import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface TrackingData {
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
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
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

  // Detect Browser
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
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
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : '';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera';
    const match = ua.match(/(?:Opera|OPR)\/(\d+)/);
    version = match ? match[1] : '';
  }

  return { browser, version, os };
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
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

  const trackingData: TrackingData = {
    ip: locationInfo.ip || 'unknown',
    country: locationInfo.country,
    city: locationInfo.city,
    device,
    browser,
    browserVersion: version,
    os,
    page,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sessionId,
    timeOnPage,
    isNewVisitor: isNew,
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

export function AnalyticsTracking() {
  const router = useRouter();
  const pageStartTimeRef = useRef(Date.now());
  const currentPageRef = useRef(router.asPath);

  useEffect(() => {
    console.log('[Analytics] 🚀 Initializing analytics tracking on page:', currentPageRef.current);
    
    // Track initial page view
    trackPageView(currentPageRef.current);

    // Track page change
    const handleRouteChangeStart = () => {
      console.log('[Analytics] 🔄 Route change started');
      // Calculate time on previous page
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (timeOnPage > 0) {
        // Update previous page view with time on page
        trackPageView(currentPageRef.current, timeOnPage);
      }
      // Reset timer for new page
      pageStartTimeRef.current = Date.now();
    };

    const handleRouteChangeComplete = (url: string) => {
      currentPageRef.current = url;
      // Track new page view
      trackPageView(url);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Track time on page when leaving
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (timeOnPage > 0) {
        const device = getDeviceType();
        const { browser, version, os } = getBrowserInfo();
        const sessionId = getSessionId();
        
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            ip: 'unknown',
            device,
            browser,
            browserVersion: version,
            os,
            page: currentPageRef.current,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            sessionId,
            timeOnPage,
            isNewVisitor: false,
            timestamp: new Date().toISOString(),
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track time on page periodically (every 30 seconds)
    const interval = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      // Update current page view with accumulated time
      if (timeOnPage >= 30) {
        trackPageView(currentPageRef.current, timeOnPage);
        pageStartTimeRef.current = Date.now(); // Reset after tracking
      }
    }, 30000);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  return null;
}

