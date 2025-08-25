import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next|.*\\.(?:css|js|png|jpg|svg|ico)|api).*)'],
};

export function middleware(req: Request) {
  // Pede Client Hints (reduz "Unknown" no Chrome/Edge)
  const res = NextResponse.next();
  res.headers.set('Accept-CH', 'Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Mobile, Sec-CH-UA-Model');
  res.headers.set('Critical-CH', 'Sec-CH-UA, Sec-CH-UA-Platform');
  res.headers.set('Permissions-Policy', 'ch-ua=*; ch-ua-platform=*; ch-ua-mobile=*; ch-ua-model=*');

  // Dispara o POST /api/track sem atrasar a navegação
  try {
    const url  = new URL(req.url);
    const ip   =
      (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || undefined;
    const city = (req as any).geo?.city || req.headers.get('x-vercel-ip-city') || undefined;
    const ua   = req.headers.get('user-agent') || undefined;

    // Detectar navegador e dispositivo do User-Agent
    let browser = 'Unknown';
    let deviceType = 'DESKTOP';
    
    if (ua) {
      const uaLower = ua.toLowerCase();
      
      // Debug: ver o User-Agent
      console.log('🔍 Middleware - User-Agent:', ua);
      
      // Detecção de navegador
      if (uaLower.includes('mobile safari') || uaLower.includes('iphone') || uaLower.includes('ipad')) {
        browser = 'Mobile Safari';
        deviceType = 'MOBILE';
      } else if (uaLower.includes('samsung') || uaLower.includes('samsungbrowser')) {
        browser = 'Samsung Internet';
        deviceType = uaLower.includes('mobile') ? 'MOBILE' : 'DESKTOP';
      } else if (uaLower.includes('chrome') && !uaLower.includes('edg')) {
        browser = 'Chrome';
        deviceType = uaLower.includes('mobile') ? 'MOBILE' : 'DESKTOP';
      } else if (uaLower.includes('firefox') || uaLower.includes('fxios')) {
        browser = 'Firefox';
        deviceType = uaLower.includes('mobile') ? 'MOBILE' : 'DESKTOP';
      } else if (uaLower.includes('safari')) {
        browser = 'Safari';
        deviceType = uaLower.includes('mobile') ? 'MOBILE' : 'DESKTOP';
      } else if (uaLower.includes('edg')) {
        browser = 'Edge';
        deviceType = uaLower.includes('mobile') ? 'MOBILE' : 'DESKTOP';
      } else if (uaLower.includes('opera')) {
        browser = 'Opera';
        deviceType = uaLower.includes('mobile') ? 'MOBILE' : 'DESKTOP';
      }
      
      // Detecção de dispositivo
      if (uaLower.includes('mobile')) deviceType = 'MOBILE';
      else if (uaLower.includes('tablet') || uaLower.includes('ipad')) deviceType = 'TABLET';
      
      // Debug: ver o que foi detectado
      console.log('🔍 Middleware - Detectado:', { browser, deviceType });
    }

    fetch(`${url.origin}/api/track`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ip, city, ua, browser, deviceType }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  return res;
}
