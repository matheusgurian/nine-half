import { useCallback, useState } from 'react';
import { getCashboxBySellerId } from '../services/cashboxService';
import { getErrorMessage } from '../utils/errors';

export function useCashbox() {
  const [cashbox, setCashbox] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMyCashbox = useCallback(async (sellerId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getCashboxBySellerId(sellerId);
      setCashbox(data);
      return data;
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar caixa.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cashbox,
    loading,
    error,
    loadMyCashbox
  };
}

