import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get IP from headers
    const ip = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    // Try to get location from ipapi.co server-side (no CORS)
    // Skip if IP is localhost or private
    if (ip && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          
          // Check for rate limit error
          if (data.error && data.reason === 'RateLimited') {
            console.warn('ipapi.co rate limited, returning IP only');
          } else if (!data.error) {
            return res.status(200).json({
              ip: data.ip || ip,
              country: data.country_name || data.country || undefined,
              city: data.city || undefined,
            });
          }
        }
      } catch (error: any) {
        // If ipapi.co fails (rate limit, timeout, etc), just return IP
        if (error?.name !== 'AbortError') {
          console.warn('Location API failed, returning IP only:', error?.message || error);
        }
      }
    }

    // Fallback: return IP only
    res.status(200).json({
      ip,
      country: undefined,
      city: undefined,
    });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(200).json({
      ip: 'unknown',
      country: undefined,
      city: undefined,
    });
  }
}

