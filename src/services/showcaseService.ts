import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { firestore } from './firebase/firestore';
import { createShowcaseModel } from '../models/ShowcaseModel';

const SHOWCASES_COLLECTION = 'showcases';

export async function createShowcase({ userId, nome, visivel = false }) {
  const docRef = doc(collection(firestore, SHOWCASES_COLLECTION));
  const showcase = createShowcaseModel({ id: docRef.id, userId, nome, visivel });
  await setDoc(docRef, {
    ...showcase,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return showcase;
}

export async function getShowcaseByUserId(userId) {
  const q = query(collection(firestore, SHOWCASES_COLLECTION), where('userId', '==', userId), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const first = snapshot.docs[0];
  return { id: first.id, ...first.data() };
}

export async function updateShowcase(showcaseId, data) {
  const showcaseRef = doc(firestore, SHOWCASES_COLLECTION, showcaseId);
  await updateDoc(showcaseRef, { ...data, updatedAt: serverTimestamp() });
}

export async function toggleShowcaseVisibility(showcaseId: string, visivel: boolean, userId: string) {
  const showcaseRef = doc(firestore, SHOWCASES_COLLECTION, showcaseId);

  // Mudanca principal da vitrine
  await updateDoc(showcaseRef, { visivel, updatedAt: serverTimestamp() });

  // Sincronizacao de produtos (best-effort)
  try {
    const q = query(collection(firestore, 'products'), where('showcaseId', '==', showcaseId));
    const productsSnapshot = await getDocs(q);
    if (productsSnapshot.empty) return;

    const batch = writeBatch(firestore);
    let updates = 0;

    productsSnapshot.docs.forEach((item) => {
      const data = item.data() as any;
      if (data?.ownerId !== userId) return;
      updates += 1;
      batch.update(item.ref, {
        showcaseVisible: visivel,
        updatedAt: serverTimestamp()
      });
    });

    if (updates > 0) {
      await batch.commit();
    }
  } catch (error: any) {
    console.warn('[showcaseService] Vitrine atualizada, mas houve falha ao sincronizar produtos:', error?.message || error);
  }
}

export async function getPublicShowcases() {
  const q = query(collection(firestore, SHOWCASES_COLLECTION), where('visivel', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
