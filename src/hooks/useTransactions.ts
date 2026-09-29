import { useCallback, useState } from 'react';
import {
  completeTransaction as completeTransactionService,
  getTransactionById,
  getTransactionsByBuyer,
  getTransactionsBySeller
} from '../services/transactionService';
import { getErrorMessage } from '../utils/errors';

export function useTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completeTransaction = useCallback(
    async ({
      reservationId,
      userId,
      paymentMethod
    }: {
      reservationId: string;
      userId: string;
      paymentMethod: string;
    }) => {
      setLoading(true);
      setError('');
      try {
        return await completeTransactionService({ reservationId, userId, paymentMethod });
      } catch (err) {
        setError(getErrorMessage(err) || 'Erro ao finalizar compra.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadBuyerTransactions = useCallback(async (buyerId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTransactionsByBuyer(buyerId);
      setTransactions(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar transações.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSellerTransactions = useCallback(async (sellerId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTransactionsBySeller(sellerId);
      return data;
    } catch (err) {
      setError('Erro ao carregar transações do vendedor.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTransactionById = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTransactionById(transactionId);
      setSelectedTransaction(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar transação.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyTransactions = useCallback(async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const [buyer, seller] = await Promise.all([getTransactionsByBuyer(userId), getTransactionsBySeller(userId)]);
      const merged = [...buyer, ...seller];
      const unique = merged.filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index);
      unique.sort((a: any, b: any) => (b?.completedAt?.seconds || 0) - (a?.completedAt?.seconds || 0));
      setTransactions(unique);
      return unique;
    } catch (err) {
      setError('Erro ao carregar transações.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    selectedTransaction,
    loading,
    error,
    completeTransaction,
    loadBuyerTransactions,
    loadSellerTransactions,
    loadTransactionById,
    loadMyTransactions
  };
}
