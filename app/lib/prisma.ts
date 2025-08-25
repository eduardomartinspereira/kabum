// src/lib/prisma.ts  (ou "@/lib/prisma")
import { PrismaClient, AccessLog_deviceType} from '@prisma/client';

/**
 * Evita múltiplas instâncias em dev (HMR).
 */
declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error'],
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
}

export const prisma: PrismaClient =
  globalThis.__PRISMA__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__PRISMA__ = prisma;
}

/* ========================================================================
 * Helpers específicos para "acessos"
 * ===================================================================== */

/**
 * Tipagem de entrada para salvar um acesso.
 * (todos os campos são opcionais para não travar a gravação)
 */
export type AccessLogInput = {
  userId?: string | null;
  ip?: string | null;
  city?: string | null;

  // resultados do UA parser
  browser?: string | null;
  deviceType?: AccessLog_deviceType | null;     // 'MOBILE' | 'DESKTOP' | 'TABLET' | ...

  deviceBrand?: string | null;
  deviceModel?: string | null;

  // extras para reduzir "Unknown" no futuro
  userAgentRaw?: string | null;
  chUa?: string | null;               // Sec-CH-UA
  chUaPlatform?: string | null;       // Sec-CH-UA-Platform
  chUaMobile?: string | null;         // Sec-CH-UA-Mobile
  chUaModel?: string | null;          // Sec-CH-UA-Model
};

/**
 * Normaliza/bucketa o nome do navegador para reduzir variações
 * e concentrar métricas (ex.: "Mobile Safari" -> "Safari iOS").
 */
export function normalizeBrowser(name?: string | null): string | null {
  if (!name) return 'Outros';
  const n = name.toLowerCase();

  if (n === 'unknown') return 'Outros';
  if (n.includes('samsung')) return 'Samsung Internet';
  if (n.includes('edg')) return 'Edge';
  if (n.includes('mobile safari')) return 'Safari iOS';
  if (n === 'safari') return 'Safari';
  if (n.includes('fxios') || n.includes('firefox')) return 'Firefox';
  if (n.includes('crios')) return 'Chrome iOS';
  if (n.includes('chrome')) return 'Chrome';
  return name;
}

/**
 * Fallback seguro para o enum DeviceType.
 */
export function coerceDeviceType(t?: AccessLog_deviceType | string | null): AccessLog_deviceType {
  const v = String(t || '').toUpperCase();
  if (v === 'MOBILE') return AccessLog_deviceType.MOBILE;
  if (v === 'DESKTOP') return AccessLog_deviceType.DESKTOP;
  if (v === 'TABLET') return AccessLog_deviceType.TABLET;
  if (v === 'BOT') return AccessLog_deviceType.BOT;
  return AccessLog_deviceType.UNKNOWN;
}

/**
 * Salva um acesso no banco, com normalizações básicas.
 * Use isso na tua rota /api/track depois de parsear o User-Agent e Client Hints.
 */
export async function saveAccessLog(input: AccessLogInput): Promise<void> {
  console.log('📝 saveAccessLog chamada com input:', input);
  
  try {
    const data: any = {
      deviceType: coerceDeviceType(input.deviceType),
    };

    if (input.userId != null) data.userId = Number(input.userId);
    if (input.ip) data.ip = input.ip;
    if (input.city) data.city = input.city;
    
    // Detectar navegador automaticamente se não fornecido
    if (input.browser) {
      data.browser = normalizeBrowser(input.browser);
    } else if (input.userAgentRaw) {
      // Tentar extrair navegador do userAgent se disponível
      const ua = input.userAgentRaw.toLowerCase();
      
      // Detecção mais precisa de navegadores
      if (ua.includes('mobile safari') || ua.includes('iphone') || ua.includes('ipad')) {
        data.browser = 'Mobile Safari';
      } else if (ua.includes('samsung') || ua.includes('samsungbrowser')) {
        data.browser = 'Samsung Internet';
      } else if (ua.includes('chrome') && !ua.includes('edg')) {
        data.browser = 'Chrome';
      } else if (ua.includes('firefox') || ua.includes('fxios')) {
        data.browser = 'Firefox';
      } else if (ua.includes('safari')) {
        data.browser = 'Safari';
      } else if (ua.includes('edg')) {
        data.browser = 'Edge';
      } else if (ua.includes('opera')) {
        data.browser = 'Opera';
      } else if (ua.includes('ie') || ua.includes('trident')) {
        data.browser = 'Internet Explorer';
      } else {
        data.browser = 'Unknown';
      }
    }
    
    if (input.deviceBrand) data.deviceBrand = input.deviceBrand;
    if (input.deviceModel) data.deviceModel = input.deviceModel;
    if (input.userAgentRaw) data.userAgentRaw = input.userAgentRaw;
    if (input.chUa) data.chUa = input.chUa;
    if (input.chUaPlatform) data.chUaPlatform = input.chUaPlatform;
    if (input.chUaMobile) data.chUaMobile = input.chUaMobile;
    if (input.chUaModel) data.chUaModel = input.chUaModel;

    console.log('📊 Dados preparados para AccessLog:', data);
    
    const result = await prisma.accessLog.create({ data });
    console.log('✅ AccessLog criado com sucesso:', result.id);
  } catch (err) {
    // não propaga para não quebrar a navegação/rota
    if (process.env.NODE_ENV === 'development') {
      console.error('[saveAccessLog] erro ao gravar', err);
    }
  }
}

/**
 * (Opcional) Health-check simples para start-up/tests.
 */
export async function prismaHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
