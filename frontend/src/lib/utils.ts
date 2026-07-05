export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <g transform="translate(200,150)" fill="none" stroke="#d1d5db" stroke-width="2">
        <rect x="-40" y="-30" width="80" height="60" rx="4"/>
        <circle cx="-10" cy="-10" r="8"/>
        <path d="M-40,30 L10,0 L25,15 L40,5 L40,30 Z"/>
      </g>
      <text x="200" y="195" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="14">Sin imagen</text>
    </svg>`,
  );

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) {
    const base = import.meta.env.VITE_API_URL || '';
    return `${base}${url}`;
  }
  return url;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
}

const CURRENCY_LOCALE: Record<string, string> = {
  COP: 'es-CO',
  CLP: 'es-CL',
  USD: 'en-US',
  EUR: 'es-ES',
  UF: 'es-CL',
};

export function formatCurrency(amount: number, currency = 'COP'): string {
  if (currency === 'UF') {
    return `UF ${amount.toLocaleString('es-CL')}`;
  }
  const locale = CURRENCY_LOCALE[currency] || 'es-CL';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('es-CL')}`;
  }
}
