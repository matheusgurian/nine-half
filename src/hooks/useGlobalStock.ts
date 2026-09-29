import { useCallback, useEffect, useRef, useState } from 'react';
import { getGlobalProducts, refreshGlobalProducts } from '../services/globalStockService';

export const DEFAULT_GLOBAL_FILTERS = {
  searchText: '',
  marca: '',
  numeracao: '',
  origem: 'todos',
  hideMyProducts: false,
  minPrice: '',
  maxPrice: '',
  orderByField: 'createdAt',
  orderDirection: 'desc'
};

function buildReadableError(err: any, fallback: string) {
  if (err?.code === 'failed-precondition' && typeof err?.message === 'string') {
    const linkMatch = err.message.match(/https:\/\/console\.firebase\.google\.com\/\S+/);
    const indexLink = linkMatch?.[0] || '';
    if (indexLink) {
      return `Falta criar indice no Firestore. Abra o link no erro e clique em Create: ${indexLink}`;
    }
    return 'Falta criar indice no Firestore para este filtro.';
  }
  return err?.message || fallback;
}

export function useGlobalStock(userId: string) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_GLOBAL_FILTERS);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadInitialProducts = useCallback(
    async (nextFilters?: any) => {
      const effectiveFilters = nextFilters ?? filtersRef.current;
      setLoading(true);
      setError('');
      try {
        const result = await refreshGlobalProducts({
          userId,
          filters: effectiveFilters,
          pageSize: 10
        });
        setProducts(result.products);
        setLastVisible(result.lastVisible);
        setHasMore(result.hasMore);
      } catch (err: any) {
        setError(buildReadableError(err, 'Erro ao carregar estoque global.'));
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || loadingMore || !lastVisible) return;
    setLoadingMore(true);
    setError('');
    try {
      const result = await getGlobalProducts({
        userId,
        filters: filtersRef.current,
        pageSize: 10,
        lastVisible
      });
      setProducts((prev) => [...prev, ...result.products]);
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(buildReadableError(err, 'Erro ao carregar mais produtos.'));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, userId, lastVisible]);

  const refreshProducts = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const result = await refreshGlobalProducts({
        userId,
        filters: filtersRef.current,
        pageSize: 10
      });
      setProducts(result.products);
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(buildReadableError(err, 'Erro ao atualizar produtos.'));
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const updateFilters = useCallback((partial: any) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_GLOBAL_FILTERS);
  }, []);

  return {
    products,
    loading,
    loadingMore,
    refreshing,
    error,
    filters,
    hasMore,
    loadInitialProducts,
    loadMoreProducts,
    refreshProducts,
    updateFilters,
    clearFilters
  };
}
