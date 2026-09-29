import { useCallback, useState } from 'react';
import {
  cancelReservation as cancelReservationService,
  getReservationById,
  getReservationsBySeller,
  getReservationsByUser,
  reserveProduct as reserveProductService
} from '../services/reservationService';
import { getErrorMessage } from '../utils/errors';

export function useReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reserveProduct = useCallback(async ({ productId, buyerId }: { productId: string; buyerId: string }) => {
    setLoading(true);
    setError('');
    try {
      return await reserveProductService({ productId, buyerId });
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao reservar produto.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelReservation = useCallback(
    async ({ reservationId, userId, cancelReason }: { reservationId: string; userId: string; cancelReason?: string }) => {
      setLoading(true);
      setError('');
      try {
        await cancelReservationService({ reservationId, userId, cancelReason });
      } catch (err) {
        setError(getErrorMessage(err) || 'Erro ao cancelar reserva.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadMyReservations = useCallback(async (buyerId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getReservationsByUser(buyerId);
      setReservations(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar reservas.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSellerReservations = useCallback(async (sellerId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getReservationsBySeller(sellerId);
      return data;
    } catch (err) {
      setError('Erro ao carregar reservas do vendedor.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReservationById = useCallback(async (reservationId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getReservationById(reservationId);
      setSelectedReservation(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar reserva.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reservations,
    selectedReservation,
    loading,
    error,
    reserveProduct,
    cancelReservation,
    loadMyReservations,
    loadSellerReservations,
    loadReservationById
  };
}
