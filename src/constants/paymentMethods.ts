export const PAYMENT_METHODS = {
  PIX: 'pix',
  TRANSFERENCIA: 'transferencia',
  DINHEIRO: 'dinheiro',
  CARTAO: 'cartao',
  OUTRO: 'outro'
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PAYMENT_METHODS.PIX]: 'PIX',
  [PAYMENT_METHODS.TRANSFERENCIA]: 'Transferência',
  [PAYMENT_METHODS.DINHEIRO]: 'Dinheiro',
  [PAYMENT_METHODS.CARTAO]: 'Cartão',
  [PAYMENT_METHODS.OUTRO]: 'Outro'
};

export function getPaymentMethodLabel(method?: string) {
  if (!method) return 'Não informado';
  return PAYMENT_METHOD_LABELS[method] || method;
}
