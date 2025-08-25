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

    fetch(`${url.origin}/api/track`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ip, city, ua }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  return res;
}
