import { useCallback, useState } from 'react';
import {
  createShowcase as createShowcaseService,
  getShowcaseByUserId,
  toggleShowcaseVisibility as toggleShowcaseVisibilityService,
  updateShowcase as updateShowcaseService
} from '../services/showcaseService';
import { getErrorMessage } from '../utils/errors';
import { useAuth } from './useAuth';

export function useShowcase() {
  const { user } = useAuth();
  const [showcase, setShowcase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadShowcase = useCallback(async (userId) => {
    setLoading(true);
    setError('');
    try {
      const data = await getShowcaseByUserId(userId);
      setShowcase(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar vitrine.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createShowcase = useCallback(async ({ userId, nome, visivel }) => {
    setLoading(true);
    setError('');
    try {
      const data = await createShowcaseService({ userId, nome, visivel });
      setShowcase(data);
      return data;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShowcase = useCallback(async (showcaseId, data) => {
    setLoading(true);
    setError('');
    try {
      await updateShowcaseService(showcaseId, data);
      setShowcase((prev) => (prev ? { ...prev, ...data } : prev));
    } catch (err) {
      setError('Erro ao atualizar vitrine.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVisibility = useCallback(async (showcaseId, visivel) => {
    if (!user?.uid) {
      setError('Usuário não autenticado.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Agora passamos o UID do usuário para satisfazer as regras de busca do Firestore
      await toggleShowcaseVisibilityService(showcaseId, visivel, user.uid);
      setShowcase((prev) => (prev ? { ...prev, visivel } : prev));
    } catch (err) {
      setError('Erro ao atualizar visibilidade da vitrine.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  return {
    showcase,
    loading,
    error,
    createShowcase,
    loadShowcase,
    updateShowcase,
    toggleVisibility
  };
}
