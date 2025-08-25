import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { parseUA } from '../../lib/parseUA';
import { normalizeBrowser } from '../../lib/normalize';

export const runtime = 'nodejs';         // Prisma precisa Node
export const dynamic = 'force-dynamic';  // não cachear

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ua = body.ua || req.headers.get('user-agent') || '';

    const { browser, deviceType, deviceBrand, deviceModel } = parseUA(ua);

    // IP e cidade (Vercel injeta geo; fora da Vercel você pode integrar Geo-IP)
    const ip =
      body.ip ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || undefined;

    const city =
      body.city ||
      (req as any).geo?.city ||
      req.headers.get('x-vercel-ip-city') || undefined;

    // Client Hints (Chromium)
    const chUa         = req.headers.get('sec-ch-ua') || undefined;
    const chUaPlatform = req.headers.get('sec-ch-ua-platform') || undefined;
    const chUaMobile   = req.headers.get('sec-ch-ua-mobile') || undefined;
    const chUaModel    = req.headers.get('sec-ch-ua-model') || undefined;

    const data: any = {
      deviceType: (deviceType as any) ?? 'UNKNOWN',
    };

    if (ip) data.ip = ip;
    if (city) data.city = city;
    if (browser) data.browser = normalizeBrowser(browser);
    if (deviceBrand) data.deviceBrand = deviceBrand;
    if (deviceModel) data.deviceModel = deviceModel;
    if (ua) data.userAgentRaw = ua;
    if (chUa) data.chUa = chUa;
    if (chUaPlatform) data.chUaPlatform = chUaPlatform;
    if (chUaMobile) data.chUaMobile = chUaMobile;
    if (chUaModel) data.chUaModel = chUaModel;

    await prisma.accessLog.create({ data });

    return NextResponse.json({ ok: true });
  } catch {
    // nunca derrube a navegação por causa do tracking
    return NextResponse.json({ ok: true });
  }
}
