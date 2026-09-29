import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../../components/layout/Header';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Loading from '../../../components/ui/Loading';
import { USER_TYPES } from '../../../constants/userTypes';
import { useAdminUsers } from '../../../hooks/useAdminUsers';
import { useAuth } from '../../../hooks/useAuth';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

function RoleBadge({ tipo }: { tipo: string }) {
  const styleByRole: Record<string, { bg: string; border: string; text: string }> = {
    [USER_TYPES.ADMIN]: { bg: 'rgba(249, 115, 22, 0.18)', border: colors.primary, text: colors.primary },
    [USER_TYPES.STORE_OWNER]: { bg: 'rgba(16, 185, 129, 0.18)', border: colors.success, text: colors.success },
    [USER_TYPES.COMMON]: { bg: 'rgba(148, 163, 184, 0.18)', border: colors.border, text: colors.textSecondary }
  };

  const current = styleByRole[tipo] || styleByRole[USER_TYPES.COMMON];

  return (
    <View style={[styles.roleBadge, { backgroundColor: current.bg, borderColor: current.border }]}>
      <Text style={[styles.roleText, { color: current.text }]}>{String(tipo || USER_TYPES.COMMON).toUpperCase()}</Text>
    </View>
  );
}

export default function AdminUsersScreen({ navigation }: any) {
  const { user } = useAuth();
  const {
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
  } = useAdminUsers();

  const [roleModalUser, setRoleModalUser] = useState<any>(null);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const isAdmin = user?.tipo === USER_TYPES.ADMIN;

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;
      loadInitialUsers();
    }, [isAdmin, loadInitialUsers])
  );

  const roleOptions = useMemo(
    () => [USER_TYPES.ADMIN, USER_TYPES.STORE_OWNER, USER_TYPES.COMMON],
    []
  );

  async function handleChangeRole(nextRole: string) {
    if (!roleModalUser?.id) return;
    setRoleUpdating(true);
    try {
      await changeUserRole(roleModalUser.id, nextRole);
      setRoleModalUser(null);
    } finally {
      setRoleUpdating(false);
    }
  }

  function handleToggleActive(targetUser: any) {
    const currentlyActive = targetUser?.ativo !== false;
    if (targetUser?.id === user?.uid && currentlyActive) {
      Alert.alert('Ação bloqueada', 'Você não pode se bloquear.');
      return;
    }

    Alert.alert(
      currentlyActive ? 'Bloquear usuário' : 'Desbloquear usuário',
      currentlyActive
        ? 'Deseja bloquear este usuário?'
        : 'Deseja desbloquear este usuário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: currentlyActive ? 'Bloquear' : 'Desbloquear',
          style: currentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await changeUserActiveStatus(
                targetUser.id,
                !currentlyActive,
                currentlyActive ? 'Bloqueado por administrador.' : ''
              );
            } catch (err: any) {
              Alert.alert('Erro ao atualizar usuário', err?.message || 'Não foi possível atualizar o status agora.');
            }
          }
        }
      ]
    );
  }

  if (!isAdmin) {
    return (
      <ScreenContainer backgroundColor={colors.background}>
        <Header title="Usuários" showBack />
        <EmptyState
          title="Acesso restrito"
          description="Somente administradores podem acessar esta tela."
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background}>
      <Header title="Usuários" subtitle="Gestão administrativa de contas." showBack />

      <Input
        label="BUSCAR"
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Nome, e-mail ou tipo..."
        icon="search-outline"
      />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && filteredUsers.length === 0 ? (
        <Loading text="CARREGANDO USUÁRIOS..." />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMoreUsers}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoad}>
                <Button
                  title={loadingMore ? 'CARREGANDO...' : 'CARREGAR MAIS'}
                  onPress={loadMoreUsers}
                  loading={loadingMore}
                  variant="secondary"
                  fullWidth={false}
                />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isActive = item?.ativo !== false;
            return (
              <View style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item?.nome?.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{item?.nome || 'Sem nome'}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{item?.email || '-'}</Text>
                  </View>
                  <RoleBadge tipo={item?.tipo} />
                </View>

                <View style={styles.divider} />

                <View style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : colors.danger }]} />
                    <Text style={[styles.statusText, { color: isActive ? colors.success : colors.danger }]}>
                      {isActive ? 'CONTA ATIVA' : 'CONTA BLOQUEADA'}
                    </Text>
                  </View>
                  {!isActive && item?.blockedReason ? (
                    <Text style={styles.reasonText} numberOfLines={1}>{item.blockedReason}</Text>
                  ) : null}
                </View>

                <View style={styles.actionsRow}>
                  <Pressable 
                    style={[styles.actionBtnBase, styles.secondaryAction]}
                    onPress={() => setRoleModalUser(item)}
                  >
                    <Ionicons name="shield-outline" size={16} color={colors.white} />
                    <Text style={styles.actionBtnText}>TIPO</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.actionBtnBase, isActive ? styles.dangerAction : styles.successAction]}
                    onPress={() => handleToggleActive(item)}
                  >
                    <Ionicons name={isActive ? "lock-closed-outline" : "lock-open-outline"} size={16} color={colors.white} />
                    <Text style={styles.actionBtnText}>{isActive ? 'BLOQUEAR' : 'ATIVAR'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Sem usuários"
              description="Nenhum usuário encontrado para o filtro informado."
              actionLabel="LIMPAR BUSCA"
              onAction={() => setSearchText('')}
            />
          }
        />
      )}

      <Modal
        visible={!!roleModalUser}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar tipo</Text>
            <Text style={styles.modalSubtitle}>{roleModalUser?.nome || '-'}</Text>
            {roleOptions.map((option) => (
              <Pressable
                key={option}
                style={styles.modalOption}
                onPress={() => handleChangeRole(option)}
                disabled={roleUpdating}
              >
                <Text style={styles.modalOptionText}>{option.toUpperCase()}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.modalOption, styles.modalCancel]} onPress={() => setRoleModalUser(null)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 12
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl
  },
  userCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '900'
  },
  userEmail: {
    fontSize: 12,
    color: colors.textCaption,
    marginTop: 2,
    fontWeight: '700'
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  roleText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    opacity: 0.5
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  reasonText: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '700',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm
  },
  actionsRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionBtnBase: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 130,
    padding: spacing.sm,
  },
  actionBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: colors.white,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
  },
  secondaryAction: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  dangerAction: {
    backgroundColor: colors.danger
  },
  successAction: {
    backgroundColor: colors.success
  },
  footerLoad: {
    alignItems: 'center',
    marginTop: spacing.sm
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl
  },
  modalTitle: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '900'
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg
  },
  modalOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center'
  },
  modalOptionText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1
  },
  modalCancel: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  modalCancelText: {
    color: colors.textCaption,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1
  }
});
