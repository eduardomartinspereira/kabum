export function normalizeBrowser(name?: string | null) {
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
  