export function normalizeBrowser(name?: string | null) {
    if (!name) return 'Unknown';
    const n = name.toLowerCase();
    
    // Detecção mais precisa de navegadores
    if (n.includes('mobile safari') || n.includes('iphone') || n.includes('ipad')) {
      return 'Mobile Safari';
    } else if (n.includes('samsung') || n.includes('samsungbrowser')) {
      return 'Samsung Internet';
    } else if (n.includes('chrome') && !n.includes('edg')) {
      return 'Chrome';
    } else if (n.includes('firefox') || n.includes('fxios')) {
      return 'Firefox';
    } else if (n.includes('safari')) {
      return 'Safari';
    } else if (n.includes('edg')) {
      return 'Edge';
    } else if (n.includes('opera')) {
      return 'Opera';
    } else if (n.includes('ie') || n.includes('trident')) {
      return 'Internet Explorer';
    } else {
      // Retornar o nome original se não conseguir normalizar
      return name;
    }
  }
  