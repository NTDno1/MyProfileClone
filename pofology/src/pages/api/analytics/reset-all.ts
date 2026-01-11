import type { NextApiRequest, NextApiResponse } from 'next';
import { getAnalyticsCollection } from '@/lib/mongodb';
import { inMemoryStorage } from '@/lib/analytics-storage';

/**
 * API endpoint to reset ALL analytics data
 * - Clears MongoDB collection
 * - Clears in-memory storage
 * Useful for testing or complete reset
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let mongoCleared = false;
    let mongoCount = 0;
    
    // Clear MongoDB
    try {
      const collection = await getAnalyticsCollection();
      const result = await collection.deleteMany({});
      mongoCount = result.deletedCount || 0;
      mongoCleared = true;
      console.log('[API Reset] 🗑️ Cleared MongoDB. Deleted:', mongoCount, 'records');
    } catch (mongoError: any) {
      console.warn('[API Reset] ⚠️ MongoDB unavailable:', mongoError?.message);
    }
    
    // Clear in-memory storage
    const memoryCountBefore = inMemoryStorage.count();
    inMemoryStorage.clear();
    const memoryCountAfter = inMemoryStorage.count();
    
    console.log('[API Reset] 🗑️ Cleared in-memory storage. Records before:', memoryCountBefore, 'after:', memoryCountAfter);
    
    res.status(200).json({ 
      success: true, 
      mongoCleared,
      mongoDeleted: mongoCount,
      memoryCleared: memoryCountBefore,
      message: `Reset complete. MongoDB: ${mongoCount} records deleted, Memory: ${memoryCountBefore} records cleared`
    });
  } catch (error: any) {
    console.error('[API Reset] ❌ Error resetting analytics:', error);
    res.status(500).json({ 
      success: false,
      error: error?.message || 'Failed to reset analytics'
    });
  }
}

