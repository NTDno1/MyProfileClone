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

    // Try to get location from multiple APIs (fallback chain)
    // Skip if IP is localhost or private
    const isPrivateIP = ip && (
      ip.startsWith('127.') || 
      ip.startsWith('192.168.') || 
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.') ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip === '0.0.0.0'
    );
    
    if (ip && ip !== 'unknown' && !isPrivateIP) {
      // Try ipapi.co first
      try {
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), 3000);
        
        const response1 = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: controller1.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeout1);

        if (response1.ok) {
          const data1 = await response1.json();
          
          if (!data1.error && (data1.country_name || data1.country)) {
            console.log('[Location API] ✅ Got location from ipapi.co:', data1.country_name || data1.country);
            return res.status(200).json({
              ip: data1.ip || ip,
              country: data1.country_name || data1.country || undefined,
              city: data1.city || undefined,
            });
          }
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.warn('[Location API] ⚠️ ipapi.co failed:', error?.message || error);
        }
      }

      // Fallback: Try ip-api.com
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 3000);
        
        const response2 = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,query`, {
          signal: controller2.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeout2);

        if (response2.ok) {
          const data2 = await response2.json();
          
          if (data2.status === 'success' && data2.country) {
            console.log('[Location API] ✅ Got location from ip-api.com:', data2.country);
            return res.status(200).json({
              ip: data2.query || ip,
              country: data2.country || undefined,
              city: data2.city || undefined,
            });
          }
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.warn('[Location API] ⚠️ ip-api.com failed:', error?.message || error);
        }
      }

      // Fallback: Try ipgeolocation.io (free tier)
      try {
        const controller3 = new AbortController();
        const timeout3 = setTimeout(() => controller3.abort(), 2000);
        
        const response3 = await fetch(`https://api.ipgeolocation.io/ipgeo?ip=${ip}`, {
          signal: controller3.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeout3);

        if (response3.ok) {
          const data3 = await response3.json();
          
          if (data3.country_name) {
            console.log('[Location API] ✅ Got location from ipgeolocation.io:', data3.country_name);
            return res.status(200).json({
              ip: data3.ip || ip,
              country: data3.country_name || undefined,
              city: data3.city || undefined,
            });
          }
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.warn('[Location API] ⚠️ ipgeolocation.io failed:', error?.message || error);
        }
      }
    } else if (isPrivateIP) {
      console.log('[Location API] ⚠️ Private IP detected, cannot get location:', ip);
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

