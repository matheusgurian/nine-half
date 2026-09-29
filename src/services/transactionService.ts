import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { PRODUCT_STATUS } from '../constants/productStatus';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { RESERVATION_STATUS } from '../constants/reservationStatus';
import { TRANSACTION_STATUS } from '../constants/transactionStatus';
import { createTransactionModel } from '../models/TransactionModel';
import { firestore } from './firebase/firestore';

const PRODUCTS_COLLECTION = 'products';
const RESERVATIONS_COLLECTION = 'reservations';
const TRANSACTIONS_COLLECTION = 'transactions';

export async function completeTransaction({
  reservationId,
  userId,
  paymentMethod
}: {
  reservationId: string;
  userId: string;
  paymentMethod: string;
}) {
  if (!paymentMethod) {
    throw new Error('Selecione um método de pagamento.');
  }

  try {
    const result = await runTransaction(firestore, async (transaction) => {
      const reservationRef = doc(firestore, RESERVATIONS_COLLECTION, reservationId);
      const reservationSnap = await transaction.get(reservationRef);

      if (!reservationSnap.exists()) {
        throw new Error('Reserva não encontrada.');
      }

      const reservation = reservationSnap.data() as any;

      if (reservation.status !== RESERVATION_STATUS.ACTIVE) {
        throw new Error('Reserva não está ativa.');
      }

      if (reservation.buyerId !== userId) {
        throw new Error('Apenas o comprador que reservou pode finalizar a compra.');
      }

      const productRef = doc(firestore, PRODUCTS_COLLECTION, reservation.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error('Produto não encontrado.');
      }

      const product = productSnap.data() as any;

      if (product.status !== PRODUCT_STATUS.RESERVED) {
        throw new Error('Produto não está reservado.');
      }

      if (product.reservationId !== reservationId) {
        throw new Error('Reserva inválida para este produto.');
      }

      const txRef = doc(collection(firestore, TRANSACTIONS_COLLECTION));
      const txModel = createTransactionModel({
        id: txRef.id,
        productId: reservation.productId,
        reservationId: reservationId,
        buyerId: reservation.buyerId,
        sellerId: reservation.sellerId,
        showcaseId: reservation.showcaseId,
        valor: String(product.preco || '0'),
        productModel: reservation.productModel || product.modelo || '',
        productBrand: reservation.productBrand || product.marca || '',
        productColor: reservation.productColor || product.cor || '',
        productSize: reservation.productSize || String(product.numeracao || ''),
        productLocation: reservation.productLocation || product.localizacao || '',
        productPrice: reservation.productPrice || String(product.preco || ''),
        productImageUrl: reservation.productImageUrl || product.imagemUrl || '',
        paymentMethod: paymentMethod || PAYMENT_METHODS.OUTRO,
        status: TRANSACTION_STATUS.COMPLETED
      });

      transaction.set(txRef, {
        ...txModel,
        cashboxCredited: true,
        cashboxCreditedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      transaction.update(reservationRef, {
        status: RESERVATION_STATUS.COMPLETED,
        updatedAt: serverTimestamp()
      });

      transaction.update(productRef, {
        status: PRODUCT_STATUS.SOLD,
        soldAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { transactionId: txRef.id };
    });

    return result;
  } catch (error: any) {
    if (error?.message) throw error;
    throw new Error('Erro ao finalizar compra.');
  }
}

export async function getTransactionsByBuyer(buyerId: string) {
  const q = query(collection(firestore, TRANSACTIONS_COLLECTION), where('buyerId', '==', buyerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b?.completedAt?.seconds || 0) - (a?.completedAt?.seconds || 0));
}

export async function getTransactionsBySeller(sellerId: string) {
  const q = query(collection(firestore, TRANSACTIONS_COLLECTION), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b?.completedAt?.seconds || 0) - (a?.completedAt?.seconds || 0));
}

export async function getTransactionById(transactionId: string) {
  const txRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);
  const snap = await getDoc(txRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
