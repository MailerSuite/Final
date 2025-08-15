export function formatNumber(
  value: unknown,
  decimals = 2,
  fallback = '—'
): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value as number)
  return Number.isFinite(num) ? num.toFixed(decimals) : fallback
}
