import type { NextApiRequest, NextApiResponse } from 'next';
import { getAnalyticsCollection } from '@/lib/mongodb';
import { inMemoryStorage } from '@/lib/analytics-storage';

/**
 * API endpoint to fix undefined values in analytics data
 * This should be run once to migrate old data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API Fix] 🔧 Starting to fix undefined values...');
    
    let fixedCount = 0;
    
    // Try MongoDB first
    try {
      const collection = await getAnalyticsCollection();
      
      // Find all documents with undefined device or browser
      const docsToFix = await collection.find({
        $or: [
          { device: { $exists: false } },
          { device: null },
          { device: 'undefined' },
          { browser: { $exists: false } },
          { browser: null },
          { browser: 'undefined' },
        ]
      }).toArray();
      
      console.log('[API Fix] 📊 Found', docsToFix.length, 'documents to fix');
      
      // Update each document
      for (const doc of docsToFix) {
        const update: any = {};
        
        if (!doc.device || doc.device === 'undefined' || doc.device === null) {
          update.device = 'desktop';
        }
        if (!doc.browser || doc.browser === 'undefined' || doc.browser === null) {
          update.browser = 'Unknown';
        }
        if (!doc.os || doc.os === 'undefined' || doc.os === null) {
          update.os = 'Unknown';
        }
        
        if (Object.keys(update).length > 0) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: update }
          );
          fixedCount++;
        }
      }
      
      console.log('[API Fix] ✅ Fixed', fixedCount, 'documents in MongoDB');
    } catch (mongoError: any) {
      console.warn('[API Fix] ⚠️ MongoDB unavailable, fixing in-memory storage:', mongoError?.message);
      
      // Fix in-memory storage
      const allData = inMemoryStorage.getAll();
      for (const item of allData) {
        let needsUpdate = false;
        const update: any = {};
        
        if (!item.device || item.device === 'undefined' || item.device === null) {
          update.device = 'desktop';
          needsUpdate = true;
        }
        if (!item.browser || item.browser === 'undefined' || item.browser === null) {
          update.browser = 'Unknown';
          needsUpdate = true;
        }
        if (!item.os || item.os === 'undefined' || item.os === null) {
          update.os = 'Unknown';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          Object.assign(item, update);
          fixedCount++;
        }
      }
      
      console.log('[API Fix] ✅ Fixed', fixedCount, 'items in memory');
    }
    
    res.status(200).json({ 
      success: true, 
      fixedCount,
      message: `Successfully fixed ${fixedCount} records`
    });
  } catch (error: any) {
    console.error('[API Fix] ❌ Error fixing undefined values:', error);
    res.status(500).json({ 
      success: false,
      error: error?.message || 'Failed to fix undefined values'
    });
  }
}

