import type { NextApiRequest, NextApiResponse } from 'next';
import { getAnalyticsCollection } from '@/lib/mongodb';
import { inMemoryStorage } from '@/lib/analytics-storage';
import { TimeRange } from '@/types/analytics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API Stats] 📈 Fetching statistics for range:', req.query.range || 'day');
    const { range = 'day' } = req.query;

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
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Try MongoDB first, fallback to in-memory
    let data: any[] = [];
    try {
      const collection = await getAnalyticsCollection();
      console.log('[API Stats] 🔍 Querying MongoDB from:', startDate.toISOString());
      const allData = await collection
        .find({
          timestamp: { $gte: startDate },
        })
        .toArray();
      // Filter out admin pages
      data = allData.filter((item: any) => !item.page?.startsWith('/admin'));
      console.log('[API Stats] 📊 Found', data.length, 'records from MongoDB (excluding admin pages)');
      console.log('[API Stats] 🔍 Sample records:', data.slice(0, 3).map((d: any) => ({
        page: d.page,
        timeOnPage: d.timeOnPage,
        browser: d.browser,
        country: d.country,
        timestamp: d.timestamp
      })));
    } catch (mongoError: any) {
      console.warn('[API Stats] ⚠️ MongoDB unavailable, using in-memory storage:', mongoError?.message);
      console.log('[API Stats] 🔍 Querying in-memory storage from:', startDate.toISOString());
      const allData = inMemoryStorage.find({
        timestamp: { $gte: startDate },
      });
      // Filter out admin pages
      data = allData.filter((item: any) => !item.page?.startsWith('/admin'));
      console.log('[API Stats] 📊 Found', data.length, 'records from memory (total:', inMemoryStorage.count(), ', excluding admin pages)');
      console.log('[API Stats] 🔍 Sample records:', data.slice(0, 3).map((d: any) => ({
        page: d.page,
        timeOnPage: d.timeOnPage,
        browser: d.browser,
        country: d.country,
        timestamp: d.timestamp
      })));
    }

    // Calculate statistics
    // Filter out records with timeOnPage > 0 that are updates (not new page views)
    // Only count records where timeOnPage is 0, null, or undefined as actual page views
    // Also filter out records that are duplicates (same page, same sessionId, within 5 seconds)
    const actualPageViews = data.filter((d, index) => {
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
      .slice(0, 10);

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
      .slice(0, 10);

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

    const statsResult = {
      totalVisitors: uniqueIPs,
      totalPageViews,
      uniqueVisitors,
      averageTimeOnPage: Math.round(averageTimeOnPage),
      topPages,
      topCountries,
      topDevices,
      topBrowsers,
      visitorsByDate,
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

