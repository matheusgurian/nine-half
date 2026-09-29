import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';
import { PRODUCT_STATUS } from '../constants/productStatus';
import { RESERVATION_STATUS } from '../constants/reservationStatus';
import { TRANSACTION_STATUS } from '../constants/transactionStatus';
import { USER_TYPES } from '../constants/userTypes';
import { firestore } from './firebase/firestore';

const USERS_COLLECTION = 'users';
const PRODUCTS_COLLECTION = 'products';
const RESERVATIONS_COLLECTION = 'reservations';
const TRANSACTIONS_COLLECTION = 'transactions';

export async function getAdminMetrics() {
  const usersRef = collection(firestore, USERS_COLLECTION);
  const productsRef = collection(firestore, PRODUCTS_COLLECTION);
  const reservationsRef = collection(firestore, RESERVATIONS_COLLECTION);
  const transactionsRef = collection(firestore, TRANSACTIONS_COLLECTION);

  const [usersSnap, storeOwnersSnap, productsAvailableSnap, reservationsActiveSnap, transactionsCompletedSnap] =
    await Promise.all([
      getDocs(usersRef),
      getDocs(query(usersRef, where('tipo', '==', USER_TYPES.STORE_OWNER))),
      getDocs(query(productsRef, where('status', '==', PRODUCT_STATUS.AVAILABLE))),
      getDocs(query(reservationsRef, where('status', '==', RESERVATION_STATUS.ACTIVE))),
      getDocs(query(transactionsRef, where('status', '==', TRANSACTION_STATUS.COMPLETED)))
    ]);

  return {
    totalUsers: usersSnap.size,
    totalStoreOwners: storeOwnersSnap.size,
    totalProductsAvailable: productsAvailableSnap.size,
    totalActiveReservations: reservationsActiveSnap.size,
    totalCompletedTransactions: transactionsCompletedSnap.size
  };
}

export async function getUsersPaginated({
  pageSize = 20,
  lastVisible
}: {
  pageSize?: number;
  lastVisible?: any;
}) {
  const constraints: any[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }

  const q = query(collection(firestore, USERS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  const users = snap.docs.map((item) => ({ id: item.id, ...item.data() })) as any[];

  return {
    users,
    lastVisible: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === pageSize
  };
}

export async function getAdminUserById(userId: string) {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
}

export async function updateUserRole({
  userId,
  tipo
}: {
  userId: string;
  tipo: string;
}) {
  if (![USER_TYPES.ADMIN, USER_TYPES.STORE_OWNER, USER_TYPES.COMMON].includes(tipo as any)) {
    throw new Error('Tipo de usuário inválido.');
  }

  const userRef = doc(firestore, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    tipo,
    updatedAt: serverTimestamp()
  });
}

export async function toggleUserActive({
  userId,
  ativo,
  reason
}: {
  userId: string;
  ativo: boolean;
  reason?: string;
}) {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    ativo,
    blockedReason: ativo ? '' : reason || 'Bloqueado por administração.',
    updatedAt: serverTimestamp()
  });
}
