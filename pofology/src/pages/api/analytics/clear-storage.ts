import type { NextApiRequest, NextApiResponse } from 'next';
import { inMemoryStorage } from '@/lib/analytics-storage';

/**
 * API endpoint to clear in-memory analytics storage
 * Useful for testing or resetting analytics data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const countBefore = inMemoryStorage.count();
    inMemoryStorage.clear();
    const countAfter = inMemoryStorage.count();
    
    console.log('[API Clear] 🗑️ Cleared in-memory storage. Records before:', countBefore, 'after:', countAfter);
    
    res.status(200).json({ 
      success: true, 
      clearedCount: countBefore,
      message: `Cleared ${countBefore} records from in-memory storage`
    });
  } catch (error: any) {
    console.error('[API Clear] ❌ Error clearing storage:', error);
    res.status(500).json({ 
      success: false,
      error: error?.message || 'Failed to clear storage'
    });
  }
}

