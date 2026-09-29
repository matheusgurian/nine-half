import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import EmptyState from '../../components/ui/EmptyState';
import Loading from '../../components/ui/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useCashbox } from '../../hooks/useCashbox';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatCurrencyBRL } from '../../utils/formatters';
import { getPaymentMethodLabel } from '../../constants/paymentMethods';

export default function MyCashboxScreen() {
  const { user } = useAuth();
  const { cashbox, loading, error, loadMyCashbox } = useCashbox();

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.uid) return;
      loadMyCashbox(user.uid);
    }, [user?.uid, loadMyCashbox])
  );

  const movements = cashbox?.movements || [];

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <Header title="Meu Caixa" subtitle="Entradas recebidas nas vendas concluídas." showBack />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>TOTAL EM VENDAS</Text>
        <Text style={styles.balanceValue}>{formatCurrencyBRL(cashbox?.balance || 0)}</Text>
        <View style={styles.balanceMeta}>
          <Text style={styles.balanceMetaText}>Vendas creditadas: {cashbox?.totalSales || 0}</Text>
        </View>
      </View>

      {loading && !cashbox ? (
        <Loading text="Carregando caixa..." />
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const date = item?.completedAt?.seconds
              ? new Date(item.completedAt.seconds * 1000).toLocaleString('pt-BR')
              : '-';

            return (
              <View style={styles.row}>
                <View style={styles.thumbWrap}>
                  {item?.productImageUrl ? (
                    <Image source={{ uri: item.productImageUrl }} style={styles.thumb} />
                  ) : (
                    <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
                  )}
                </View>

                <View style={styles.info}>
                  <Text style={styles.title}>{`${item.productBrand || ''} ${item.productModel || ''}`.trim() || 'Venda'}</Text>
                  <Text style={styles.subtitle}>{`Pagamento: ${getPaymentMethodLabel(item.paymentMethod)}`}</Text>
                  <Text style={styles.subtitle}>{date}</Text>
                </View>

                <Text style={styles.value}>{`+ ${formatCurrencyBRL(item.value || 0)}`}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Sem entradas no caixa"
              description="Quando uma venda for concluída, o valor aparecerá aqui automaticamente."
              icon="wallet-outline"
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1
  },
  balanceValue: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  balanceMeta: {
    marginTop: spacing.sm
  },
  balanceMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  listContent: {
    paddingBottom: spacing.xxl
  },
  row: {
    flexWrap: 'wrap',
    rowGap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  thumb: {
    width: '100%',
    height: '100%'
  },
  info: {
    minWidth: 100,
    flex: 1,
    marginLeft: spacing.md
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  value: {
    marginLeft: spacing.sm,
    color: colors.success,
    fontSize: 14,
    fontWeight: '900'
  }
});
