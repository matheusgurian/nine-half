import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where
} from 'firebase/firestore';
import { PRODUCT_STATUS } from '../constants/productStatus';
import { firestore } from './firebase/firestore';

export function buildProductSearchKeywords({
  modelo,
  marca,
  cor
}: {
  modelo: string;
  marca: string;
  cor?: string;
}) {
  const normalize = (value: string) => String(value || '').trim().toLowerCase();
  const model = normalize(modelo);
  const brand = normalize(marca);
  const color = normalize(cor || '');

  const tokens = new Set<string>();
  const addTokens = (value: string) => {
    if (!value) return;
    const parts = value.split(/\s+/).filter(Boolean);
    parts.forEach((part) => tokens.add(part));
    if (parts.length > 1) {
      for (let i = 0; i < parts.length - 1; i += 1) {
        tokens.add(`${parts[i]} ${parts[i + 1]}`);
      }
    }
    tokens.add(value);
  };

  addTokens(model);
  addTokens(brand);
  addTokens(color);
  return Array.from(tokens);
}

function parsePrice(value: any) {
  const n = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function buildQuery({
  filters,
  pageSize,
  lastVisible
}: {
  filters: any;
  pageSize: number;
  lastVisible?: any;
}) {
  const constraints: any[] = [
    where('status', '==', PRODUCT_STATUS.AVAILABLE),
    where('showcaseVisible', '==', true)
  ];

  if (filters.searchText?.trim()) {
    const token = filters.searchText.trim().toLowerCase();
    constraints.push(where('searchKeywords', 'array-contains', token));
  }

  if (filters.marca?.trim()) {
    constraints.push(where('marcaLower', '==', filters.marca.trim().toLowerCase()));
  }

  if (filters.numeracao?.trim()) {
    constraints.push(where('numeracao', '==', filters.numeracao.trim()));
  }

  if (filters.origem && filters.origem !== 'todos') {
    const origem = String(filters.origem).toLowerCase();
    if (origem === 'proprio' || origem === 'parceiro') {
      constraints.push(where('origem', '==', origem));
    }
  }

  const hasPriceRange = Boolean(filters.minPrice || filters.maxPrice);
  const requestedOrderField = filters.orderByField || 'createdAt';
  const requestedDirection = filters.orderDirection || 'desc';

  // Com filtro de faixa de preco, Firestore exige que a ordenacao inicial seja no campo de faixa.
  let orderField = requestedOrderField;
  let orderDirection = requestedDirection;
  if (hasPriceRange && requestedOrderField === 'createdAt') {
    orderField = 'precoNumber';
    orderDirection = 'asc';
  }

  if (filters.minPrice) {
    constraints.push(where('precoNumber', '>=', parsePrice(filters.minPrice)));
  }
  if (filters.maxPrice) {
    constraints.push(where('precoNumber', '<=', parsePrice(filters.maxPrice)));
  }

  constraints.push(orderBy(orderField, orderDirection));
  constraints.push(limit(pageSize));

  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }

  return query(collection(firestore, 'products'), ...constraints);
}

export async function getGlobalProducts({
  userId,
  filters,
  pageSize = 10,
  lastVisible
}: {
  userId: string;
  filters: any;
  pageSize?: number;
  lastVisible?: any;
}) {
  const q = buildQuery({ filters, pageSize, lastVisible });
  const snapshot = await getDocs(q);
  const hideMyProducts = filters?.hideMyProducts === true;
  const docs = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item: any) => !(hideMyProducts && userId && item.ownerId === userId)) as any[];
  return {
    products: docs,
    lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.docs.length === pageSize
  };
}

export async function refreshGlobalProducts({
  userId,
  filters,
  pageSize = 10
}: {
  userId: string;
  filters: any;
  pageSize?: number;
}) {
  return getGlobalProducts({ userId, filters, pageSize, lastVisible: null });
}
