import { TRANSACTION_STATUS } from '../constants/transactionStatus';
import { getTransactionsBySeller } from './transactionService';

function parseCurrencyToNumber(value: any): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value || '').trim();
  if (!raw) return 0;

  const normalized = raw
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCashboxBySellerId(sellerId: string) {
  const transactions = await getTransactionsBySeller(sellerId);
  const completed = transactions.filter((tx: any) => tx.status === TRANSACTION_STATUS.COMPLETED);

  const movements = completed
    .map((tx: any) => ({
      id: tx.id,
      transactionId: tx.id,
      value: parseCurrencyToNumber(tx.valor),
      paymentMethod: tx.paymentMethod || '',
      productModel: tx.productModel || 'Item',
      productBrand: tx.productBrand || '',
      productImageUrl: tx.productImageUrl || '',
      completedAt: tx.completedAt || null
    }))
    .sort((a: any, b: any) => (b?.completedAt?.seconds || 0) - (a?.completedAt?.seconds || 0));

  const balance = movements.reduce((sum: number, item: any) => sum + item.value, 0);

  return {
    sellerId,
    balance,
    totalSales: movements.length,
    movements
  };
}

