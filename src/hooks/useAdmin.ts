import { useCallback, useState } from 'react';
import { getAdminMetrics } from '../services/adminService';
import { getErrorMessage } from '../utils/errors';

type AdminMetrics = {
  totalUsers: number;
  totalStoreOwners: number;
  totalProductsAvailable: number;
  totalActiveReservations: number;
  totalCompletedTransactions: number;
};

const DEFAULT_METRICS: AdminMetrics = {
  totalUsers: 0,
  totalStoreOwners: 0,
  totalProductsAvailable: 0,
  totalActiveReservations: 0,
  totalCompletedTransactions: 0
};

export function useAdmin() {
  const [metrics, setMetrics] = useState<AdminMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminMetrics();
      setMetrics(data);
      return data;
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar painel admin.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metrics,
    loading,
    error,
    loadMetrics
  };
}
