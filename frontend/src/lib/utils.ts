export function getImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads')) {
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}${url}`
  }
  return url
}

const CURRENCY_LOCALE: Record<string, string> = {
  COP: 'es-CO',
  CLP: 'es-CL',
  USD: 'en-US',
  EUR: 'es-ES',
  UF: 'es-CL',
}

export function formatCurrency(amount: number, currency = 'COP'): string {
  const locale = CURRENCY_LOCALE[currency] || 'es-CL'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
