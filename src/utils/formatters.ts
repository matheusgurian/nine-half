export function formatCurrencyBRL(value: string | number | null | undefined) {
  const normalized = Number(String(value ?? 0).replace(',', '.'));
  const amount = Number.isFinite(normalized) ? normalized : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

export function formatSizeBR(size: string | number | null | undefined) {
  const text = String(size ?? '').trim();
  if (!text) return '-';
  return `BR ${text}`;
}
