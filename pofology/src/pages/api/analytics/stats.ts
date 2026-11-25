import type { NextApiRequest, NextApiResponse } from 'next';
import { getAnalyticsCollection } from '@/lib/mongodb';
import { inMemoryStorage } from '@/lib/analytics-storage';
import { TimeRange, VisitorIpFlowItem } from '@/types/analytics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API Stats] 📈 Fetching statistics for range:', req.query.range || 'week');
    const { range = 'week' } = req.query;

    const now = new Date();
    let startDate: Date;

    switch (range as TimeRange) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(0);
    }

    // Try MongoDB first, merge any fallback records, fallback cleanly on error
    let data: any[] = [];
    let storageSource: 'mongodb' | 'fallback' = 'mongodb';
    let storageError: string | undefined;

    try {
      const collection = await getAnalyticsCollection();
      console.log('[API Stats] 🔍 Querying MongoDB from:', startDate.toISOString());
      const queryFilter = range === 'all' ? {} : { timestamp: { $gte: startDate } };
      const allData = await collection.find(queryFilter).toArray();
      const fallbackData = inMemoryStorage.find(
        range === 'all' ? {} : { timestamp: { $gte: startDate } }
      );
      data = [...allData, ...fallbackData].filter((item: any) => !item.page?.startsWith('/admin'));
      storageSource = 'mongodb';
      console.log('[API Stats] 📊 Found', data.length, 'records from MongoDB + fallback');
    } catch (mongoError: any) {
      storageSource = 'fallback';
      storageError = mongoError?.message || 'MongoDB connection failed';
      console.warn('[API Stats] ⚠️ MongoDB unavailable, using fallback storage:', storageError);
      const allData = inMemoryStorage.find(
        range === 'all' ? {} : { timestamp: { $gte: startDate } }
      );
      data = allData.filter((item: any) => !item.page?.startsWith('/admin'));
    }

    // Calculate statistics
    // Filter out records with timeOnPage > 0 that are updates (not new page views)
    // Only count records where timeOnPage is 0, null, or undefined as actual page views
    // Also filter out records that are duplicates (same page, same sessionId, within 5 seconds)
    const contactClickEvents = data.filter(
      (d) => d.eventType === 'contact_click' || (typeof d.page === 'string' && d.page.startsWith('[CLICK]'))
    );

    const actualPageViews = data.filter((d, index) => {
      if (d.eventType === 'contact_click' || (typeof d.page === 'string' && d.page.startsWith('[CLICK]'))) {
        return false;
      }
      const timeOnPage = d.timeOnPage;
      // Only count if timeOnPage is 0, null, undefined, or not set (new page views, not updates)
      if (timeOnPage !== 0 && timeOnPage !== null && timeOnPage !== undefined && timeOnPage !== '') {
        return false;
      }

      // Additional check: filter out potential duplicates (same page + sessionId within 5 seconds)
      const currentTime = new Date(d.timestamp).getTime();
      const isDuplicate = data.slice(0, index).some((prev: any) => {
        if (prev.page === d.page && prev.sessionId === d.sessionId) {
          const prevTime = new Date(prev.timestamp).getTime();
          return Math.abs(currentTime - prevTime) < 5000; // Within 5 seconds
        }
        return false;
      });

      return !isDuplicate;
    });

    console.log('[API Stats] 🔍 Total records:', data.length, 'Actual page views (after filtering):', actualPageViews.length);
    const totalPageViews = actualPageViews.length;

    // Unique visitors = unique sessionIds from actual page views (not updates)
    const uniqueVisitors = new Set(actualPageViews.map((d) => d.sessionId)).size;
    const uniqueIPs = new Set(actualPageViews.map((d) => d.ip)).size;

    // Top pages - only count actual page views, not updates
    const pageViews = actualPageViews.reduce((acc: Record<string, number>, item) => {
      acc[item.page] = (acc[item.page] || 0) + 1;
      return acc;
    }, {});
    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 300);

    // Top countries - only count actual page views, not updates
    const countryViews = actualPageViews.reduce((acc: Record<string, number>, item) => {
      // Handle null, undefined, empty string
      const country = (item.country && item.country !== 'null' && item.country !== 'undefined') ? item.country : 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    const topCountries = Object.entries(countryViews)
      .map(([country, visitors]) => ({ country, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 300);

    // Top devices - normalize undefined values, only count actual page views
    const deviceCounts = actualPageViews.reduce((acc: Record<string, number>, item) => {
      const device = item.device || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});
    const topDevices = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .filter(item => item.device !== 'undefined'); // Filter out literal "undefined" string

    // Top browsers - normalize undefined/null values, only count actual page views
    const browserCounts = actualPageViews.reduce((acc: Record<string, number>, item) => {
      let browser = item.browser;
      // Handle null, undefined, empty string, or literal "undefined" string
      if (!browser || browser === 'undefined' || browser === 'null' || browser === '') {
        // Try to detect from userAgent as fallback
        const ua = item.userAgent || '';
        if (ua.indexOf('Edg') > -1 || ua.indexOf('Edge') > -1) {
          browser = 'Edge';
        } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
          browser = 'Chrome';
        } else if (ua.indexOf('Firefox') > -1) {
          browser = 'Firefox';
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
          browser = 'Safari';
        } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
          browser = 'Opera';
        } else {
          browser = 'Unknown';
        }
      }
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    console.log('[API Stats] 🔍 Browser counts:', browserCounts);
    const topBrowsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .filter(item => item.browser !== 'undefined') // Filter out literal "undefined" string
      .slice(0, 10);

    // Average time on page - use all data (including updates) for accurate time calculation
    const timesOnPage = data
      .filter((d) => d.timeOnPage && d.timeOnPage > 0)
      .map((d) => d.timeOnPage);
    const averageTimeOnPage =
      timesOnPage.length > 0
        ? timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length
        : 0;

    // Visitors by date - only count actual page views, not updates
    const visitorsByDateMap = actualPageViews.reduce(
      (acc: Record<string, { visitors: Set<string>; pageViews: number }>, item) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { visitors: new Set(), pageViews: 0 };
        }
        acc[date].visitors.add(item.sessionId);
        acc[date].pageViews += 1;
        return acc;
      },
      {}
    );
    const visitorsByDate = Object.entries(visitorsByDateMap)
      .map(([date, data]) => ({
        date,
        visitors: data.visitors.size,
        pageViews: data.pageViews,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Facebook-specific analytics
    const facebookVisits = actualPageViews.filter(
      (d) => d.isFacebook || !!d.fbclid || (d.referrer && d.referrer.toLowerCase().includes('facebook.com'))
    );
    const totalFacebookVisits = facebookVisits.length;
    const uniqueFacebookVisitors = new Set(facebookVisits.map((d) => d.sessionId)).size;
    const inAppBrowserCount = facebookVisits.filter(
      (d) => d.isFacebookApp || (d.appType && d.appType.includes('Facebook App')) || (d.userAgent && /FBAN|FBAV/i.test(d.userAgent))
    ).length;
    const externalBrowserCount = Math.max(0, totalFacebookVisits - inAppBrowserCount);
    const fbclidCount = facebookVisits.filter((d) => !!d.fbclid).length;

    const fbPageViews = facebookVisits.reduce((acc: Record<string, number>, item) => {
      acc[item.page] = (acc[item.page] || 0) + 1;
      return acc;
    }, {});
    const topFacebookPages = Object.entries(fbPageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const facebookSummary = {
      totalFacebookVisits,
      uniqueFacebookVisitors,
      inAppBrowserCount,
      externalBrowserCount,
      fbclidCount,
      topFacebookPages,
    };

    const totalMessengerClicks = contactClickEvents.filter(
      (d) => d.contactChannel === 'messenger' || (typeof d.page === 'string' && d.page.includes('Messenger'))
    ).length;
    const totalZaloClicks = contactClickEvents.filter(
      (d) => d.contactChannel === 'zalo' || (typeof d.page === 'string' && d.page.includes('Zalo'))
    ).length;
    const totalPhoneClicks = contactClickEvents.filter(
      (d) => d.contactChannel === 'phone' || (typeof d.page === 'string' && d.page.includes('Gọi điện'))
    ).length;
    const uniqueClickers = new Set(contactClickEvents.map((d) => d.sessionId || d.ip)).size;

    const contactClicksSummary = {
      totalMessengerClicks,
      totalZaloClicks,
      totalPhoneClicks,
      uniqueClickers,
    };

    // Map max timeOnPage per (sessionId + page) from heartbeat records so each page step shows real reading duration
    const maxTimeMap = new Map<string, number>();
    for (const d of data) {
      if (d.sessionId && d.page && typeof d.timeOnPage === 'number' && d.timeOnPage > 0) {
        const k = `${d.sessionId}::${d.page}`;
        const prev = maxTimeMap.get(k) || 0;
        if (d.timeOnPage > prev) maxTimeMap.set(k, d.timeOnPage);
      }
    }

    // Group ALL pageviews + contact clicks by unique IP into a single-row chronological User Flow
    const combinedAllEvents = [...actualPageViews, ...contactClickEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const ipFlowMap = new Map<string, VisitorIpFlowItem>();
    for (const item of combinedAllEvents) {
      const cleanIp = String(item.ip || 'unknown').replace(/^::ffff:/, '').trim() || 'unknown';
      const isFb = Boolean(
        item.isFacebook ||
        item.fbclid ||
        (item.referrer && item.referrer.toLowerCase().includes('facebook.com'))
      );
      const isFbApp = Boolean(item.isFacebookApp || (item.userAgent && /FBAN|FBAV/i.test(item.userAgent)));
      const isContactClick = Boolean(
        item.eventType === 'contact_click' ||
        (typeof item.page === 'string' && item.page.startsWith('[CLICK]'))
      );
      const resolvedAppType =
        item.appType ||
        (isFbApp ? 'Facebook App' : item.device === 'mobile' ? 'Trình duyệt di động' : 'Trình duyệt máy tính');
      const resolvedSource =
        item.trafficSource || (isFb ? 'Facebook' : item.referrer ? 'Web khác' : 'Trực tiếp');

      if (!ipFlowMap.has(cleanIp)) {
        ipFlowMap.set(cleanIp, {
          ip: cleanIp,
          firstSeen: item.timestamp,
          lastSeen: item.timestamp,
          city: item.city || 'Chưa rõ',
          country: item.country || 'Việt Nam',
          isp: item.isp || 'Chưa rõ',
          device: item.device || 'desktop',
          os: item.os || 'Unknown',
          browser: item.browser || 'Unknown',
          appType: resolvedAppType,
          isFacebook: isFb,
          isFacebookApp: isFbApp,
          fbclid: item.fbclid || undefined,
          trafficSource: resolvedSource,
          hasContactClick: isContactClick,
          pageViewCount: 0,
          contactClickCount: 0,
          totalTimeOnSite: 0,
          steps: [],
        });
      }

      const flow = ipFlowMap.get(cleanIp)!;
      flow.lastSeen = item.timestamp;
      if (item.city && item.city !== 'Chưa rõ') flow.city = item.city;
      if (item.country && item.country !== 'Unknown') flow.country = item.country;
      if (item.isp && item.isp !== 'Chưa rõ') flow.isp = item.isp;
      if (item.browser && item.browser !== 'Unknown') flow.browser = item.browser;
      if (item.os && item.os !== 'Unknown') flow.os = item.os;
      if (isFb) {
        flow.isFacebook = true;
        flow.trafficSource = 'Facebook';
      } else if (flow.trafficSource === 'Trực tiếp' && resolvedSource !== 'Trực tiếp') {
        flow.trafficSource = resolvedSource;
      }
      if (isFbApp) {
        flow.isFacebookApp = true;
        flow.appType = 'Facebook App';
      }
      if (item.fbclid && !flow.fbclid) {
        flow.fbclid = item.fbclid;
      }

      const stepTime = isContactClick
        ? 0
        : maxTimeMap.get(`${item.sessionId}::${item.page}`) || Number(item.timeOnPage || 0);

      if (isContactClick) {
        flow.hasContactClick = true;
        flow.contactClickCount += 1;
      } else {
        flow.pageViewCount += 1;
        flow.totalTimeOnSite += stepTime;
      }

      const prevStep = flow.steps[flow.steps.length - 1];
      const eventType = isContactClick ? ('contact_click' as const) : ('pageview' as const);
      if (
        prevStep &&
        prevStep.eventType === eventType &&
        prevStep.page === item.page &&
        Math.abs(new Date(item.timestamp).getTime() - new Date(prevStep.timestamp).getTime()) < 5000
      ) {
        prevStep.repeat = (prevStep.repeat || 1) + 1;
        prevStep.timestamp = item.timestamp;
      } else {
        flow.steps.push({
          timestamp: item.timestamp,
          page: item.page || '/',
          eventType,
          contactChannel: item.contactChannel || undefined,
          timeOnPage: stepTime,
          repeat: 1,
        });
      }
    }

    const ipFlows = Array.from(ipFlowMap.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );

    // Keep recentVisitors for backward compatibility
    const recentVisitors = [...combinedAllEvents]
      .reverse()
      .slice(0, 150)
      .map((item) => {
        const isFb = item.isFacebook || !!item.fbclid || (item.referrer && item.referrer.toLowerCase().includes('facebook.com'));
        const isFbApp = item.isFacebookApp || (item.userAgent && /FBAN|FBAV/i.test(item.userAgent));
        const isContactClick = item.eventType === 'contact_click' || (typeof item.page === 'string' && item.page.startsWith('[CLICK]'));
        return {
          id: item._id ? item._id.toString() : item.sessionId,
          timestamp: item.timestamp,
          ip: item.ip,
          city: item.city || 'Chưa rõ',
          country: item.country || 'Việt Nam',
          isp: item.isp || 'Chưa rõ',
          device: item.device || 'desktop',
          os: item.os || 'Unknown',
          browser: item.browser || 'Unknown',
          appType: item.appType || (isFbApp ? 'Facebook App' : (item.device === 'mobile' ? 'Trình duyệt di động' : 'Trình duyệt máy tính')),
          isFacebook: isFb,
          isFacebookApp: isFbApp,
          fbclid: item.fbclid || undefined,
          trafficSource: item.trafficSource || (isFb ? 'Facebook' : (item.referrer ? 'Web khác' : 'Trực tiếp')),
          page: item.page,
          timeOnPage: item.timeOnPage || 0,
          referrer: item.referrer || '',
          eventType: isContactClick ? ('contact_click' as const) : ('pageview' as const),
          contactChannel: item.contactChannel || undefined,
          sourcePage: item.sourcePage || undefined,
        };
      });

    const statsResult = {
      totalVisitors: ipFlows.length || uniqueIPs,
      totalPageViews,
      uniqueVisitors,
      averageTimeOnPage: Math.round(averageTimeOnPage),
      topPages,
      topCountries,
      topDevices,
      topBrowsers,
      visitorsByDate,
      facebookSummary,
      contactClicksSummary,
      recentVisitors,
      ipFlows,
      storageSource,
      storageError,
    };

    console.log('[API Stats] ✅ Returning stats:', {
      totalVisitors: statsResult.totalVisitors,
      totalPageViews: statsResult.totalPageViews,
      uniqueVisitors: statsResult.uniqueVisitors,
    });

    res.status(200).json(statsResult);
  } catch (error: any) {
    console.error('Error getting analytics stats:', error);
    // Return empty stats instead of error - don't break the UI
    res.status(200).json({
      totalVisitors: 0,
      totalPageViews: 0,
      uniqueVisitors: 0,
      averageTimeOnPage: 0,
      topPages: [],
      topCountries: [],
      topDevices: [],
      topBrowsers: [],
      visitorsByDate: [],
    });
  }
}

