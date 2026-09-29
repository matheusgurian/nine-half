import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../../../components/layout/Header';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import EmptyState from '../../../components/ui/EmptyState';
import Loading from '../../../components/ui/Loading';
import { ROUTES } from '../../../app/routes/routeNames';
import { USER_TYPES } from '../../../constants/userTypes';
import { useAdmin } from '../../../hooks/useAdmin';
import { useAuth } from '../../../hooks/useAuth';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

function Metric({
  label,
  value,
  icon,
  isFullWidth = false
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  isFullWidth?: boolean;
}) {
  return (
    <View style={[styles.metricCard, isFullWidth && styles.fullWidthMetric]}>
      <View style={styles.metricIconBox}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.metricInfo}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { metrics, loading, error, loadMetrics } = useAdmin();
  const isAdmin = user?.tipo === USER_TYPES.ADMIN;

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;
      loadMetrics();
    }, [isAdmin, loadMetrics])
  );

  if (!isAdmin) {
    return (
      <ScreenContainer backgroundColor={colors.background}>
        <Header title="Painel Admin" showBack />
        <EmptyState
          title="Acesso restrito"
          description="Somente administradores podem acessar este painel."
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll backgroundColor={colors.background}>
      <Header
        title="PAINEL ADMIN"
        subtitle="Controle e Métricas da Plataforma"
        showBack
        rightAction={
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              loadMetrics();
            }}
            style={styles.refreshBtn}
          >
            <Ionicons name="refresh-outline" size={22} color={colors.white} />
          </Pressable>
        }
      />

      {loading && !metrics.totalUsers ? <Loading text="CARREGANDO MÉTRICAS..." /> : null}

      {!loading || metrics.totalUsers ? (
        <>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.metricsGrid}>
            <Metric label="Usuários" value={metrics.totalUsers} icon="people" />
            <Metric label="Lojistas" value={metrics.totalStoreOwners} icon="storefront" />
            <Metric label="Sneakers Ativos" value={metrics.totalProductsAvailable} icon="pricetag" />
            <Metric label="Reservas" value={metrics.totalActiveReservations} icon="bookmark" />
            <Metric label="Transações" value={metrics.totalCompletedTransactions} icon="checkmark-done" isFullWidth />
          </View>

          <View style={styles.roadmapBox}>
            <View style={styles.roadmapHeader}>
              <Ionicons name="construct-outline" size={20} color={colors.primary} />
              <Text style={styles.roadmapTitle}>GESTÃO DA PLATAFORMA</Text>
            </View>
            
            <View style={styles.actionsContainer}>
              <Pressable
                style={styles.adminActionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate(ROUTES.ADMIN_USERS);
                }}
              >
                <View style={styles.actionIconBox}>
                  <Ionicons name="people-outline" size={24} color={colors.white} />
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={styles.actionTitle}>GESTÃO DE USUÁRIOS</Text>
                  <Text style={styles.actionSubtitle}>Controlar acessos e permissões</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textCaption} />
              </Pressable>

              <View style={styles.disabledAction}>
                <View style={[styles.actionIconBox, { opacity: 0.3 }]}>
                  <Ionicons name="cart-outline" size={24} color={colors.white} />
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={[styles.actionTitle, { opacity: 0.3 }]}>MODERAÇÃO DE VITRINES</Text>
                  <Text style={styles.actionSubtitle}>Em desenvolvimento...</Text>
                </View>
              </View>

              <View style={styles.disabledAction}>
                <View style={[styles.actionIconBox, { opacity: 0.3 }]}>
                  <Ionicons name="cube-outline" size={24} color={colors.white} />
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={[styles.actionTitle, { opacity: 0.3 }]}>MODERAÇÃO DE PRODUTOS</Text>
                  <Text style={styles.actionSubtitle}>Em desenvolvimento...</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 12
  },
  metricsGrid: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  fullWidthMetric: {
    width: '100%'
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricInfo: {
    flex: 1
  },
  metricValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    marginTop: 2,
    letterSpacing: 0.5
  },
  roadmapBox: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  roadmapTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1
  },
  actionsContainer: {
    gap: spacing.sm
  },
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 45, 45, 0.3)',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  actionTextContent: {
    flex: 1
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textCaption,
    marginTop: 2,
    fontWeight: '700'
  }
});
