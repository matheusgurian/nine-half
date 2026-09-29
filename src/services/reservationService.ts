import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import { PRODUCT_STATUS } from '../constants/productStatus';
import { RESERVATION_STATUS } from '../constants/reservationStatus';
import { firestore } from './firebase/firestore';

const PRODUCTS_COLLECTION = 'products';
const SHOWCASES_COLLECTION = 'showcases';
const RESERVATIONS_COLLECTION = 'reservations';

function getMsFromTimestamp(value: any): number {
  if (!value) return 0;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

async function expireReservationIfNeeded(reservationId: string) {
  await runTransaction(firestore, async (transaction) => {
    const reservationRef = doc(firestore, RESERVATIONS_COLLECTION, reservationId);
    const reservationSnap = await transaction.get(reservationRef);
    if (!reservationSnap.exists()) return;

    const reservation = reservationSnap.data() as any;
    if (reservation?.status !== RESERVATION_STATUS.ACTIVE) return;

    const expiresAtMs = getMsFromTimestamp(reservation?.expiresAt);
    if (!expiresAtMs || expiresAtMs > Date.now()) return;

    const productRef = doc(firestore, PRODUCTS_COLLECTION, reservation.productId);
    const productSnap = await transaction.get(productRef);

    transaction.update(reservationRef, {
      status: RESERVATION_STATUS.EXPIRED,
      cancelReason: 'Tempo de reserva expirado automaticamente.',
      updatedAt: serverTimestamp()
    });

    if (productSnap.exists()) {
      const product = productSnap.data() as any;
      if (product?.status === PRODUCT_STATUS.RESERVED && product?.reservationId === reservationId) {
        transaction.update(productRef, {
          status: PRODUCT_STATUS.AVAILABLE,
          reservedBy: null,
          reservedAt: null,
          reservationId: null,
          updatedAt: serverTimestamp()
        });
      }
    }
  });
}

export async function reserveProduct({ productId, buyerId }: { productId: string; buyerId: string }) {
  try {
    const result = await runTransaction(firestore, async (transaction) => {
      const productRef = doc(firestore, PRODUCTS_COLLECTION, productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error('Produto não encontrado.');
      }

      const product = productSnap.data() as any;

      if (product.ownerId === buyerId) {
        throw new Error('Você não pode reservar seu próprio produto.');
      }

      if (product.status === PRODUCT_STATUS.RESERVED && product.reservationId) {
        const oldReservationRef = doc(firestore, RESERVATIONS_COLLECTION, String(product.reservationId));
        const oldReservationSnap = await transaction.get(oldReservationRef);

        if (oldReservationSnap.exists()) {
          const oldReservation = oldReservationSnap.data() as any;
          const oldExpiresAtMs = getMsFromTimestamp(oldReservation?.expiresAt);
          const shouldExpire =
            oldReservation?.status === RESERVATION_STATUS.ACTIVE &&
            oldExpiresAtMs > 0 &&
            oldExpiresAtMs <= Date.now();

          if (shouldExpire) {
            transaction.update(oldReservationRef, {
              status: RESERVATION_STATUS.EXPIRED,
              cancelReason: 'Tempo de reserva expirado automaticamente.',
              updatedAt: serverTimestamp()
            });

            transaction.update(productRef, {
              status: PRODUCT_STATUS.AVAILABLE,
              reservedBy: null,
              reservedAt: null,
              reservationId: null,
              updatedAt: serverTimestamp()
            });

            product.status = PRODUCT_STATUS.AVAILABLE;
            product.reservationId = null;
          }
        }
      }

      if (product.status !== PRODUCT_STATUS.AVAILABLE) {
        throw new Error('Produto já reservado ou vendido.');
      }

      const horasValidade = product.tempoReserva || 24;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + horasValidade * 60 * 60 * 1000);

      const showcaseRef = doc(firestore, SHOWCASES_COLLECTION, product.showcaseId);
      const showcaseSnap = await transaction.get(showcaseRef);
      if (!showcaseSnap.exists() || showcaseSnap.data()?.visivel !== true) {
        throw new Error('Produto indisponível para reserva.');
      }

      const reservationRef = doc(collection(firestore, RESERVATIONS_COLLECTION));

      transaction.set(reservationRef, {
        id: reservationRef.id,
        productId: product.id,
        buyerId,
        sellerId: product.ownerId,
        showcaseId: product.showcaseId,
        productModel: product.modelo || '',
        productBrand: product.marca || '',
        productColor: product.cor || '',
        productSize: String(product.numeracao || ''),
        productLocation: product.localizacao || '',
        productPrice: String(product.preco || ''),
        productImageUrl: product.imagemUrl || '',
        status: RESERVATION_STATUS.ACTIVE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        cancelReason: null
      });

      transaction.update(productRef, {
        status: PRODUCT_STATUS.RESERVED,
        reservedBy: buyerId,
        reservedAt: serverTimestamp(),
        reservationId: reservationRef.id,
        updatedAt: serverTimestamp()
      });

      return { reservationId: reservationRef.id };
    });

    return result;
  } catch (error: any) {
    if (error?.message) throw error;
    throw new Error('Erro ao reservar produto.');
  }
}

export async function cancelReservation({
  reservationId,
  userId,
  cancelReason
}: {
  reservationId: string;
  userId: string;
  cancelReason?: string;
}) {
  try {
    await runTransaction(firestore, async (transaction) => {
      const reservationRef = doc(firestore, RESERVATIONS_COLLECTION, reservationId);
      const reservationSnap = await transaction.get(reservationRef);

      if (!reservationSnap.exists()) {
        throw new Error('Reserva não encontrada.');
      }

      const reservation = reservationSnap.data() as any;

      if (reservation.status !== RESERVATION_STATUS.ACTIVE) {
        throw new Error('Reserva não está ativa.');
      }

      if (reservation.buyerId !== userId && reservation.sellerId !== userId) {
        throw new Error('Você não tem permissão para cancelar esta reserva.');
      }

      const productRef = doc(firestore, PRODUCTS_COLLECTION, reservation.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error('Produto não encontrado.');
      }

      transaction.update(reservationRef, {
        status: RESERVATION_STATUS.CANCELED,
        cancelReason: cancelReason || 'Cancelada pelo usuário.',
        updatedAt: serverTimestamp()
      });

      transaction.update(productRef, {
        status: PRODUCT_STATUS.AVAILABLE,
        reservedBy: null,
        reservedAt: null,
        reservationId: null,
        updatedAt: serverTimestamp()
      });
    });
  } catch (error: any) {
    if (error?.message) throw error;
    throw new Error('Erro ao cancelar reserva.');
  }
}

export async function getReservationsByUser(userId: string) {
  const qBuyer = query(collection(firestore, RESERVATIONS_COLLECTION), where('buyerId', '==', userId));
  const qSeller = query(collection(firestore, RESERVATIONS_COLLECTION), where('sellerId', '==', userId));

  const [snapBuyer, snapSeller] = await Promise.all([getDocs(qBuyer), getDocs(qSeller)]);

  const all = [...snapBuyer.docs, ...snapSeller.docs].map((d) => ({ id: d.id, ...d.data() }));
  const unique = Array.from(new Map(all.map((item: any) => [item.id, item])).values());

  const expiredIds = unique
    .filter((item: any) => item?.status === RESERVATION_STATUS.ACTIVE)
    .filter((item: any) => {
      const expiresAtMs = getMsFromTimestamp(item?.expiresAt);
      return expiresAtMs > 0 && expiresAtMs <= Date.now();
    })
    .map((item: any) => item.id);

  if (expiredIds.length > 0) {
    await Promise.all(expiredIds.map((id: string) => expireReservationIfNeeded(id)));

    const [freshBuyer, freshSeller] = await Promise.all([getDocs(qBuyer), getDocs(qSeller)]);
    const refreshed = [...freshBuyer.docs, ...freshSeller.docs].map((d) => ({ id: d.id, ...d.data() }));
    const refreshedUnique = Array.from(new Map(refreshed.map((item: any) => [item.id, item])).values());
    return refreshedUnique.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
  }

  return unique.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
}

export async function getReservationsBySeller(sellerId: string) {
  const qSeller = query(collection(firestore, RESERVATIONS_COLLECTION), where('sellerId', '==', sellerId));
  const snap = await getDocs(qSeller);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
}

export async function getReservationById(reservationId: string) {
  const reservationRef = doc(firestore, RESERVATIONS_COLLECTION, reservationId);
  const snap = await getDoc(reservationRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
