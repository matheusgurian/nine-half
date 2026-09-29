import { TRANSACTION_STATUS } from '../constants/transactionStatus';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { nowISODate } from '../utils/date';

export type TransactionModel = {
  id: string;
  productId: string;
  reservationId: string;
  buyerId: string;
  sellerId: string;
  showcaseId: string;
  valor: string;
  productModel: string;
  productBrand: string;
  productColor: string;
  productSize: string;
  productLocation: string;
  productPrice: string;
  productImageUrl: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export function createTransactionModel(data: Partial<TransactionModel> = {}): TransactionModel {
  const now = nowISODate();

  return {
    id: data.id || '',
    productId: data.productId || '',
    reservationId: data.reservationId || '',
    buyerId: data.buyerId || '',
    sellerId: data.sellerId || '',
    showcaseId: data.showcaseId || '',
    valor: data.valor || '0',
    productModel: data.productModel || '',
    productBrand: data.productBrand || '',
    productColor: data.productColor || '',
    productSize: data.productSize || '',
    productLocation: data.productLocation || '',
    productPrice: data.productPrice || '',
    productImageUrl: data.productImageUrl || '',
    paymentMethod: data.paymentMethod || PAYMENT_METHODS.OUTRO,
    status: data.status || TRANSACTION_STATUS.PENDING,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    completedAt: data.completedAt || null
  };
}
