import { useCallback, useMemo, useState } from 'react';
import {
  getUsersPaginated,
  toggleUserActive,
  updateUserRole
} from '../services/adminService';
import { getErrorMessage } from '../utils/errors';

export function useAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadInitialUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getUsersPaginated({ pageSize: 20 });
      setUsers(result.users);
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar usuários.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreUsers = useCallback(async () => {
    if (!hasMore || loadingMore || !lastVisible) return;
    setLoadingMore(true);
    setError('');
    try {
      const result = await getUsersPaginated({ pageSize: 20, lastVisible });
      setUsers((prev) => [...prev, ...result.users]);
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar mais usuários.');
      throw err;
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, lastVisible, loadingMore]);

  const changeUserRole = useCallback(async (userId: string, tipo: string) => {
    setLoading(true);
    setError('');
    try {
      await updateUserRole({ userId, tipo });
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, tipo } : item)));
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao atualizar tipo de usuário.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeUserActiveStatus = useCallback(async (userId: string, ativo: boolean, reason?: string) => {
    setLoading(true);
    setError('');
    try {
      await toggleUserActive({ userId, ativo, reason });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId
            ? { ...item, ativo, blockedReason: ativo ? '' : reason || 'Bloqueado por administração.' }
            : item
        )
      );
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao atualizar status do usuário.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return users;
    return users.filter((item) => {
      const name = String(item?.nome || '').toLowerCase();
      const email = String(item?.email || '').toLowerCase();
      const tipo = String(item?.tipo || '').toLowerCase();
      return name.includes(text) || email.includes(text) || tipo.includes(text);
    });
  }, [searchText, users]);

  return {
    users,
    filteredUsers,
    loading,
    loadingMore,
    error,
    hasMore,
    searchText,
    setSearchText,
    loadInitialUsers,
    loadMoreUsers,
    changeUserRole,
    changeUserActiveStatus
  };
}
