import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import ProductCard from '../../components/domain/ProductCard';
import { getUserById } from '../../services/userService';
import { getProductsByOwner } from '../../services/productService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { themeShadows } from '../../theme/themeShadows';
import { ROUTES } from '../../app/routes/routeNames';

export default function PublicProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { width } = useWindowDimensions();
  
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, userProducts]: [any, any[]] = await Promise.all([
        getUserById(userId),
        getProductsByOwner(userId)
      ]);
      setSeller(userData);
      // Filtra apenas produtos que o vendedor marcou como visíveis na vitrine e estão disponíveis
      setProducts(userProducts.filter(p => p.showcaseVisible && p.status === 'disponivel'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userInitial = useMemo(() => seller?.nome?.charAt(0)?.toUpperCase() || 'S', [seller?.nome]);

  const joinedDate = useMemo(() => {
    if (seller?.createdAt?.seconds) {
      return new Date(seller.createdAt.seconds * 1000).getFullYear();
    }
    return new Date().getFullYear().toString();
  }, [seller?.createdAt]);

  if (loading) return <Loading text="ACESSANDO PASSPORT..." />;
  if (!seller) return <EmptyState title="VENDEDOR NÃO ENCONTRADO" />;

  return (
    <ScreenContainer withPadding={false} backgroundColor={colors.background}>
      <Header title="PERFIL PÚBLICO" showBack subtitle="Hype Passport Oficial" />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Passport Card */}
            <View style={styles.passportCard}>
              <View style={styles.passportTop}>
                <View style={styles.passportAvatar}>
                  <Text style={styles.passportAvatarText}>{userInitial}</Text>
                </View>
                <View style={styles.passportMainInfo}>
                  <Text style={styles.passportName}>{seller.nome?.toUpperCase()}</Text>
                  <View style={styles.memberSince}>
                    <Text style={styles.memberSinceText}>MEMBRO DESDE {joinedDate}</Text>
                  </View>
                </View>
                <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              </View>

              <View style={styles.passportDivider} />

              <View style={styles.passportStats}>
                <View style={styles.passportStatItem}>
                  <Text style={styles.passportStatValue}>{products.length}</Text>
                  <Text style={styles.passportStatLabel}>ATIVOS</Text>
                </View>
                <View style={styles.vLine} />
                <View style={styles.passportStatItem}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{seller.tipo?.toUpperCase() || 'MEMBER'}</Text>
                  </View>
                  <Text style={styles.passportStatLabel}>NÍVEL</Text>
                </View>
                <View style={styles.vLine} />
                <View style={styles.passportStatItem}>
                  <Text style={styles.passportStatValue}>{seller.cidade?.split(' ')[0].toUpperCase() || 'BR'}</Text>
                  <Text style={styles.passportStatLabel}>LOCAL</Text>
                </View>
              </View>
            </View>

            <View style={styles.vitrineHeader}>
              <Text style={styles.vitrineTitle}>VITRINE DO VENDEDOR</Text>
              <Text style={styles.vitrineSubtitle}>{products.length} itens disponíveis para reserva</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard
              product={item}
              onPress={() => navigation.push(ROUTES.PRODUCT_DETAILS, { productId: item.id })}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState 
            title="VITRINE VAZIA" 
            description="Este vendedor não possui sneakers disponíveis no momento." 
            icon="basket-outline"
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    alignItems: 'center'
  },
  passportCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...themeShadows.medium
  },
  passportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  passportAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  passportAvatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white
  },
  passportMainInfo: {
    minWidth: 0,
    flex: 1
  },
  passportName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  memberSince: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  memberSinceText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1
  },
  passportDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
    borderStyle: 'dashed'
  },
  passportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  passportStatItem: {
    flex: 1,
    alignItems: 'center'
  },
  passportStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary
  },
  passportStatLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 1
  },
  vLine: {
    width: 1,
    height: 30,
    backgroundColor: colors.border
  },
  typeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.black
  },
  vitrineHeader: {
    width: '100%',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  vitrineTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1.5
  },
  vitrineSubtitle: {
    fontSize: 12,
    color: colors.textCaption,
    marginTop: 2
  },
  listContent: {
    paddingBottom: spacing.xxl
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md
  },
  cardWrapper: {
    width: '48.5%'
  }
});
