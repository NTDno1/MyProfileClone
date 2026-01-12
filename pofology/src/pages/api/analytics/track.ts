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

    // Skip tracking for admin pages
    if (req.body?.page && req.body.page.startsWith('/admin')) {
      console.log('[API Track] ⏭️ Skipping tracking for admin page:', req.body.page);
      return res.status(200).json({ success: true, skipped: true, reason: 'admin_page' });
    }

    const requestStartTime = Date.now();
    
    // Get IP from client data first, fallback to server headers
    const clientIp = req.body?.ip;
    const serverIp = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    
    const finalIp = clientIp && clientIp !== 'unknown' ? clientIp : serverIp;
    
    // Detect IP version
    const ipVersion = finalIp.includes(':') ? 'IPv6' : 'IPv4';
    
    // Detect proxy (if x-forwarded-for exists and different from socket address)
    const proxyDetected = !!(req.headers['x-forwarded-for'] || req.headers['x-real-ip']);

    // Normalize data to ensure no undefined/null values
    // Ensure browser is never null, undefined, or empty - detect from userAgent if needed
    let normalizedBrowser = req.body?.browser;
    if (!normalizedBrowser || normalizedBrowser === 'null' || normalizedBrowser === 'undefined' || normalizedBrowser === '') {
      // Try to detect browser from userAgent as fallback
      const ua = req.body?.userAgent || '';
      if (ua.indexOf('Edg') > -1 || ua.indexOf('Edge') > -1) {
        normalizedBrowser = 'Edge';
      } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
        normalizedBrowser = 'Chrome';
      } else if (ua.indexOf('Firefox') > -1) {
        normalizedBrowser = 'Firefox';
      } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        normalizedBrowser = 'Safari';
      } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
        normalizedBrowser = 'Opera';
      } else {
        normalizedBrowser = 'Unknown';
      }
      console.log('[API Track] 🔍 Browser was missing/null, detected from userAgent:', normalizedBrowser);
    }
    
    // Calculate bot score (simple heuristic)
    const ua = req.body?.userAgent || '';
    let botScore = 0;
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /http/i, /libwww/i, /perl/i, /ruby/i
    ];
    botPatterns.forEach(pattern => {
      if (pattern.test(ua)) botScore += 20;
    });
    if (!req.body?.screenWidth && !req.body?.viewportWidth) botScore += 30;
    if (!req.body?.language) botScore += 10;
    botScore = Math.min(botScore, 100);
    
    // Create request fingerprint (hash of headers + UA)
    const fingerprintString = [
      req.headers['user-agent'],
      req.headers['accept-language'],
      req.headers['accept-encoding'],
      finalIp,
    ].filter(Boolean).join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const requestFingerprint = Math.abs(hash).toString(36);
    
    // Get technical request info
    const acceptLanguage = req.headers['accept-language'] as string || undefined;
    const acceptEncoding = req.headers['accept-encoding'] as string || undefined;
    const host = req.headers['host'] as string || undefined;
    // Determine protocol from headers or connection
    const protocol = (req.headers['x-forwarded-proto'] as string)?.includes('https') || 
                     (req as any).connection?.encrypted ? 'HTTPS' : 'HTTP';
    const method = req.method || 'GET';
    const statusCode = 200; // Success response
    
    // Calculate request time (will be updated after response)
    const requestTime = Date.now() - requestStartTime;
    
    // Estimate response size (rough estimate based on data size)
    const responseSize = JSON.stringify(req.body).length;
    
    const data = {
      ...req.body,
      // Basic Info
      ip: finalIp,
      device: req.body?.device || 'desktop',
      browser: normalizedBrowser,
      browserVersion: req.body?.browserVersion || '',
      os: req.body?.os || 'Unknown',
      page: req.body?.page || '/',
      referrer: req.body?.referrer || '',
      userAgent: req.body?.userAgent || '',
      sessionId: req.body?.sessionId || '',
      country: (req.body?.country && req.body.country !== 'null' && req.body.country !== 'undefined' && req.body.country !== '') ? req.body.country : null,
      city: (req.body?.city && req.body.city !== 'null' && req.body.city !== 'undefined' && req.body.city !== '') ? req.body.city : null,
      timeOnPage: req.body?.timeOnPage !== undefined && req.body?.timeOnPage !== null ? req.body.timeOnPage : 0,
      isNewVisitor: req.body?.isNewVisitor !== undefined ? req.body.isNewVisitor : false,
      timestamp: req.body?.timestamp ? new Date(req.body.timestamp) : new Date(),
      
      // Technical Request Info
      acceptLanguage: acceptLanguage || req.body?.acceptLanguage,
      acceptEncoding: acceptEncoding || req.body?.acceptEncoding,
      connectionType: req.headers['connection'] as string || undefined,
      host: host || req.body?.host,
      protocol: protocol || req.body?.protocol,
      method: method || req.body?.method,
      statusCode: statusCode || req.body?.statusCode,
      requestTime: requestTime || req.body?.requestTime,
      responseSize: responseSize || req.body?.responseSize,
      
      // Network & Security
      ipVersion: ipVersion || req.body?.ipVersion,
      proxyDetected: proxyDetected || req.body?.proxyDetected,
      isp: req.body?.isp || null, // Will be populated by location API if available
      asn: req.body?.asn || null, // Will be populated by location API if available
      tlsVersion: (req as any).connection?.getPeerCertificate?.()?.version || undefined,
      requestFingerprint: requestFingerprint || req.body?.requestFingerprint,
      botScore: botScore || req.body?.botScore,
    };
    
    console.log('[API Track] 📊 Normalized data:', {
      browser: data.browser,
      country: data.country,
      timeOnPage: data.timeOnPage,
      page: data.page
    });

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

