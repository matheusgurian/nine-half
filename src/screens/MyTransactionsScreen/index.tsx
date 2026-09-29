import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import TransactionCard from '../../components/domain/TransactionCard';
import EmptyState from '../../components/ui/EmptyState';
import Loading from '../../components/ui/Loading';
import { ROUTES } from '../../app/routes/routeNames';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

type TabType = 'all' | 'buy' | 'sell';

export default function MyTransactionsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { transactions, loadMyTransactions, loading, error } = useTransactions();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      loadMyTransactions(user.uid);
    }, [user?.uid, loadMyTransactions])
  );

  const handleTransactionPress = (transaction: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(ROUTES.TRANSACTION_DETAILS, { transactionId: transaction.id });
  };

  const buyCount = useMemo(
    () => transactions.filter((item: any) => item.buyerId === user?.uid).length,
    [transactions, user?.uid]
  );
  const sellCount = useMemo(
    () => transactions.filter((item: any) => item.sellerId === user?.uid).length,
    [transactions, user?.uid]
  );

  const filteredTransactions = useMemo(() => {
    if (!user?.uid) return [];
    if (activeTab === 'buy') return transactions.filter((item: any) => item.buyerId === user.uid);
    if (activeTab === 'sell') return transactions.filter((item: any) => item.sellerId === user.uid);
    return transactions;
  }, [activeTab, transactions, user?.uid]);

  const emptyState = useMemo(() => {
    if (activeTab === 'buy') {
      return {
        title: 'Sem compras concluídas',
        description: 'Finalize uma reserva como comprador para ver suas compras aqui.'
      };
    }
    if (activeTab === 'sell') {
      return {
        title: 'Sem vendas concluídas',
        description: 'Quando você vender um produto, a venda aparecerá nesta aba.'
      };
    }
    return {
      title: 'Sem transações',
      description: 'Conclua suas negociações para gerar um histórico de compras e vendas.'
    };
  }, [activeTab]);

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background}>
      <Header title="Histórico" subtitle="Suas compras e vendas concluídas." showBack />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.tabsRow}>
        <TabButton label={`Todas (${transactions.length})`} active={activeTab === 'all'} onPress={() => setActiveTab('all')} />
        <TabButton label={`Compras (${buyCount})`} active={activeTab === 'buy'} onPress={() => setActiveTab('buy')} />
        <TabButton label={`Vendas (${sellCount})`} active={activeTab === 'sell'} onPress={() => setActiveTab('sell')} />
      </View>

      {loading && transactions.length === 0 ? (
        <Loading text="BUSCANDO HISTÓRICO..." />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <TransactionCard transaction={item} onPress={handleTransactionPress} />}
          ListEmptyComponent={<EmptyState title={emptyState.title} description={emptyState.description} icon="receipt-outline" />}
        />
      )}
    </ScreenContainer>
  );
}

function TabButton({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
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
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  tabButton: {
    minHeight: 48,
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center'
  },
  tabButtonActive: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderColor: colors.primary
  },
  tabText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  tabTextActive: {
    color: colors.white
  },
  listContent: {
    paddingBottom: spacing.xxl
  }
});
