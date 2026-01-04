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
      data = await collection
        .find({
          timestamp: { $gte: startDate },
        })
        .toArray();
      console.log('[API Stats] 📊 Found', data.length, 'records from MongoDB');
    } catch (mongoError: any) {
      console.warn('[API Stats] ⚠️ MongoDB unavailable, using in-memory storage:', mongoError?.message);
      console.log('[API Stats] 🔍 Querying in-memory storage from:', startDate.toISOString());
      data = inMemoryStorage.find({
        timestamp: { $gte: startDate },
      });
      console.log('[API Stats] 📊 Found', data.length, 'records from memory (total:', inMemoryStorage.count(), ')');
    }

    // Calculate statistics
    const totalPageViews = data.length;
    const uniqueVisitors = new Set(data.map((d) => d.sessionId)).size;
    const uniqueIPs = new Set(data.map((d) => d.ip)).size;

    // Top pages
    const pageViews = data.reduce((acc: Record<string, number>, item) => {
      acc[item.page] = (acc[item.page] || 0) + 1;
      return acc;
    }, {});
    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top countries
    const countryViews = data.reduce((acc: Record<string, number>, item) => {
      const country = item.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    const topCountries = Object.entries(countryViews)
      .map(([country, visitors]) => ({ country, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Top devices
    const deviceCounts = data.reduce((acc: Record<string, number>, item) => {
      acc[item.device] = (acc[item.device] || 0) + 1;
      return acc;
    }, {});
    const topDevices = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Top browsers
    const browserCounts = data.reduce((acc: Record<string, number>, item) => {
      acc[item.browser] = (acc[item.browser] || 0) + 1;
      return acc;
    }, {});
    const topBrowsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average time on page
    const timesOnPage = data
      .filter((d) => d.timeOnPage && d.timeOnPage > 0)
      .map((d) => d.timeOnPage);
    const averageTimeOnPage =
      timesOnPage.length > 0
        ? timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length
        : 0;

    // Visitors by date
    const visitorsByDateMap = data.reduce(
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

