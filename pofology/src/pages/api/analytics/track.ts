import type { NextApiRequest, NextApiResponse } from 'next';
import { getAnalyticsCollection } from '@/lib/mongodb';
import { inMemoryStorage } from '@/lib/analytics-storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API Track] 📊 Received tracking request:', {
      page: req.body?.page,
      device: req.body?.device,
      browser: req.body?.browser,
      ip: req.body?.ip,
    });

    // Get IP from client data first, fallback to server headers
    const clientIp = req.body?.ip;
    const serverIp = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    const data = {
      ...req.body,
      ip: clientIp && clientIp !== 'unknown' ? clientIp : serverIp,
      timestamp: req.body?.timestamp ? new Date(req.body.timestamp) : new Date(),
    };

    // Try MongoDB first
    try {
      const collection = await getAnalyticsCollection();
      console.log('[API Track] 💾 Inserting data into MongoDB...');
      const result = await collection.insertOne(data);
      console.log('[API Track] ✅ Successfully inserted to MongoDB:', result.insertedId);
      return res.status(200).json({ success: true, insertedId: result.insertedId, storage: 'mongodb' });
    } catch (mongoError: any) {
      console.warn('[API Track] ⚠️ MongoDB unavailable, using in-memory storage:', mongoError?.message);
      
      // Fallback to in-memory storage
      const result = inMemoryStorage.insert(data);
      console.log('[API Track] ✅ Stored in memory:', result.insertedId);
      return res.status(200).json({ 
        success: true, 
        insertedId: result.insertedId,
        storage: 'memory',
        message: 'Stored in memory (MongoDB unavailable)'
      });
    }
  } catch (error: any) {
    console.error('[API Track] ❌ Error tracking analytics:', error?.message || error);
    res.status(200).json({ 
      success: false,
      message: 'Analytics tracking failed',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

