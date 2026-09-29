import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { PRODUCT_STATUS } from '../constants/productStatus';
import { createProductModel } from '../models/ProductModel';
import { firestore } from './firebase/firestore';
import { buildProductSearchKeywords } from './globalStockService';
import { getPublicShowcases } from './showcaseService';

const PRODUCTS_COLLECTION = 'products';

export async function createProduct(productData) {
  const docRef = doc(collection(firestore, PRODUCTS_COLLECTION));
  
  // Busca o status atual da vitrine para garantir que o produto herde a visibilidade correta
  const showcaseRef = doc(firestore, 'showcases', productData.showcaseId);
  const showcaseSnap = await getDoc(showcaseRef);
  const showcaseVisible = showcaseSnap.exists() ? !!showcaseSnap.data()?.visivel : false;

  const product = createProductModel({
    id: docRef.id,
    ...productData,
    status: PRODUCT_STATUS.AVAILABLE
  });

  const precoNumber = Number(String(product.preco || '0').replace(',', '.')) || 0;
  const keywords = buildProductSearchKeywords({ 
    modelo: product.modelo, 
    marca: product.marca, 
    cor: product.cor
  });
  
  const payload = {
    ...product,
    imagens: Array.isArray(product.imagens) ? product.imagens : (product.imagemUrl ? [product.imagemUrl] : []),
    imagePaths: Array.isArray(product.imagePaths) ? product.imagePaths : (product.imagePath ? [product.imagePath] : []),
    modeloLower: String(product.modelo || '').toLowerCase(),
    marcaLower: String(product.marca || '').toLowerCase(),
    searchKeywords: keywords,
    precoNumber,
    showcaseVisible, // Define aqui se ele deve aparecer no global
    reservedBy: null,
    reservedAt: null,
    reservationId: null,
    soldAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  console.log('[productService] Criando produto com visibilidade:', showcaseVisible);
  await setDoc(docRef, payload);

  return { ...product, ...payload, id: docRef.id };
}

export async function getProductsByOwner(ownerId) {
  const q = query(collection(firestore, PRODUCTS_COLLECTION), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a: any, b: any) => {
      const aTime = a?.createdAt?.seconds || 0;
      const bTime = b?.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export async function getPublicAvailableProductsByOwner(ownerId: string) {
  const q = query(
    collection(firestore, PRODUCTS_COLLECTION),
    where('ownerId', '==', ownerId),
    where('showcaseVisible', '==', true),
    where('status', '==', PRODUCT_STATUS.AVAILABLE)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a: any, b: any) => {
      const aTime = a?.createdAt?.seconds || 0;
      const bTime = b?.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export async function getProductsByShowcase(showcaseId, ownerId) {
  // A vitrine já é vinculada ao dono; filtrar apenas por showcaseId evita
  // depender de índice composto desnecessário no carregamento da vitrine.
  const q = query(
    collection(firestore, PRODUCTS_COLLECTION),
    where('showcaseId', '==', showcaseId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item: any) => !ownerId || item.ownerId === ownerId)
    .sort((a: any, b: any) => {
      const aTime = a?.createdAt?.seconds || 0;
      const bTime = b?.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export async function getProductById(productId) {
  const productRef = doc(firestore, PRODUCTS_COLLECTION, productId);
  const snapshot = await getDoc(productRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getPublicAvailableProducts() {
  const showcases = await getPublicShowcases();
  const showcaseIds = showcases.map((s: any) => s.id).filter(Boolean);
  if (showcaseIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < showcaseIds.length; i += 10) {
    chunks.push(showcaseIds.slice(i, i + 10));
  }

  const all: any[] = [];
  for (const ids of chunks) {
    const q = query(
      collection(firestore, PRODUCTS_COLLECTION),
      where('showcaseId', 'in', ids),
      where('status', '==', PRODUCT_STATUS.AVAILABLE)
    );
    const snapshot = await getDocs(q);
    all.push(...snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }

  return all.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
}

export async function updateProduct(productId, data) {
  const productRef = doc(firestore, PRODUCTS_COLLECTION, productId);
  const currentSnap = await getDoc(productRef);
  const current = currentSnap.exists() ? (currentSnap.data() as any) : null;
  const payload = { ...data };
  delete payload.ownerId;
  delete payload.showcaseId;
  delete payload.status;
  delete payload.createdAt;

  if (payload.modelo || payload.marca || payload.cor !== undefined || payload.numeracao !== undefined) {
    const model = String(payload.modelo ?? current?.modelo ?? '').trim();
    const brand = String(payload.marca ?? current?.marca ?? '').trim();
    const color = String(payload.cor ?? current?.cor ?? '').trim();
    
    const keywords = buildProductSearchKeywords({ 
      modelo: model, 
      marca: brand, 
      cor: color
    });
    
    payload.modeloLower = model.toLowerCase();
    payload.marcaLower = brand.toLowerCase();
    payload.searchKeywords = keywords;
  }

  if (payload.preco !== undefined) {
    payload.precoNumber = Number(String(payload.preco || '0').replace(',', '.')) || 0;
  }

  if (Array.isArray(payload.imagens)) {
    payload.imagemUrl = payload.imagens[0] || '';
  }
  if (Array.isArray(payload.imagePaths)) {
    payload.imagePath = payload.imagePaths[0] || '';
  }

  await updateDoc(productRef, {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function deleteProduct(productId) {
  const productRef = doc(firestore, PRODUCTS_COLLECTION, productId);
  await deleteDoc(productRef);
}
