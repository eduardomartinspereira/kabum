import * as UAParser from 'ua-parser-js';

export function parseUA(ua?: string) {
  const parser = new (UAParser as any)(ua || '');
 


  const browser = parser.getBrowser().name || undefined;
  const d = parser.getDevice();
  const t = (d.type || '').toLowerCase();

  const deviceType =
    t === 'mobile' ? 'MOBILE' :
    t === 'tablet' ? 'TABLET' :
    t ? 'DESKTOP' : 'DESKTOP';

  return {
    browser,
    deviceType,
    deviceBrand: d.vendor || undefined,
    deviceModel: d.model || undefined,
  };
}
