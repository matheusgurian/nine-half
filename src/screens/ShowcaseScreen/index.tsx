import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import ProductCard from '../../components/domain/ProductCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import { ProductCardSkeleton } from '../../components/ui/Skeleton/ProductCardSkeleton';
import { ROUTES } from '../../app/routes/routeNames';
import { PRODUCT_STATUS } from '../../constants/productStatus';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { useShowcase } from '../../hooks/useShowcase';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { themeShadows } from '../../theme/themeShadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { onlyDigits, validateDocument, validatePhone, validateRequired } from '../../utils/validators';

export default function ShowcaseScreen({ navigation }: any) {
  const { user, updatePrivateProfile } = useAuth();
  const showcaseApi = useShowcase();
  const productsApi = useProducts();
  const loadingRef = React.useRef(false);

  const [newShowcaseName, setNewShowcaseName] = React.useState('Minha Vitrine');
  const [createPublicNow, setCreatePublicNow] = React.useState(false);
  const [telefone, setTelefone] = React.useState('');
  const [documento, setDocumento] = React.useState('');
  const [endereco, setEndereco] = React.useState('');
  const [createError, setCreateError] = React.useState('');
  const [editingName, setEditingName] = React.useState('');
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [productTab, setProductTab] = React.useState<'active' | 'sold'>('active');

  React.useEffect(() => {
    setTelefone(String(user?.telefone || user?.whatsapp || ''));
    setDocumento(String(user?.documento || ''));
    setEndereco(String(user?.endereco || ''));
  }, [user?.telefone, user?.whatsapp, user?.documento, user?.endereco]);

  const loadData = React.useCallback(async () => {
    if (!user?.uid) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const found: any = await showcaseApi.loadShowcase(user.uid);
      if (found?.id) {
        setEditingName(found.nome || '');
        await productsApi.loadMyProducts(user.uid);
      }
    } finally {
      loadingRef.current = false;
    }
  }, [user?.uid, showcaseApi.loadShowcase, productsApi.loadMyProducts]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isProfileComplete = !!(
    String(user?.documento || '').trim() &&
    String(user?.endereco || '').trim() &&
    String(user?.telefone || user?.whatsapp || '').trim()
  );

  const showcaseProducts = React.useMemo(
    () => productsApi.products.filter((p: any) => p.ownerId === user?.uid),
    [productsApi.products, user?.uid]
  );
  const activeProducts = React.useMemo(
    () => showcaseProducts.filter((p: any) => p.status !== PRODUCT_STATUS.SOLD),
    [showcaseProducts]
  );
  const soldProducts = React.useMemo(
    () => showcaseProducts.filter((p: any) => p.status === PRODUCT_STATUS.SOLD),
    [showcaseProducts]
  );
  const tabProducts = productTab === 'sold' ? soldProducts : activeProducts;
  const filteredProducts = React.useMemo(
    () =>
      tabProducts.filter(
        (p: any) =>
          p.modelo?.toLowerCase().includes(search.toLowerCase()) ||
          p.marca?.toLowerCase().includes(search.toLowerCase())
      ),
    [tabProducts, search]
  );

  async function handleCreateShowcase() {
    if (!user?.uid) return;
    try {
      setCreateError('');

      if (createPublicNow) {
        if (!validateRequired(telefone) || !validateRequired(documento) || !validateRequired(endereco)) {
          setCreateError('Para publicar agora, preencha WhatsApp, CPF/CNPJ e endereço.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        if (!validatePhone(telefone)) {
          setCreateError('WhatsApp inválido. Use DDD + número (10 ou 11 dígitos).');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        if (!validateDocument(documento)) {
          setCreateError('CPF/CNPJ inválido. Use 11 ou 14 dígitos.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }

        await updatePrivateProfile({
          telefone: onlyDigits(telefone),
          documento: onlyDigits(documento),
          endereco: endereco.trim()
        });
      }

      const created = await showcaseApi.createShowcase({
        userId: user.uid,
        nome: newShowcaseName.trim() || 'Minha Vitrine',
        visivel: createPublicNow
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingName(created.nome || '');
      setCreatePublicNow(false);
      setCreateError('');
      await productsApi.loadMyProducts(user.uid);
    } catch (err: any) {
      setCreateError(err?.message || 'Não foi possível criar a vitrine agora.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  async function handleToggleVisibility() {
    if (!showcaseApi.showcase?.id) return;
    if (!isProfileComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Perfil incompleto', 'Preencha CPF, endereço e WhatsApp no perfil para ativar a vitrine pública.');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await showcaseApi.toggleVisibility(showcaseApi.showcase.id, !showcaseApi.showcase.visivel);
    } catch (err: any) {
      Alert.alert('Erro ao atualizar vitrine', err?.message || 'Não foi possível alterar a visibilidade agora.');
    }
  }

  async function handleSaveSettings() {
    if (!showcaseApi.showcase?.id) return;
    try {
      await showcaseApi.updateShowcase(showcaseApi.showcase.id, { nome: editingName.trim() || 'Minha Vitrine' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSettingsModal(false);
    } catch (_) {}
  }

  if (!showcaseApi.showcase && !showcaseApi.loading) {
    return (
        <ScreenContainer scroll backgroundColor={colors.background}>
          <Header title="Criar Loja" showBack subtitle="Configure sua vitrine para a comunidade." />
          <View style={styles.createForm}>
            <Input
              label="NOME DA VITRINE"
              value={newShowcaseName}
              onChangeText={setNewShowcaseName}
              placeholder="Ex.: Hype Store"
            />
            <View style={styles.createPublicBox}>
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>Publicar Agora</Text>
                <Text style={styles.switchSubtitle}>Se ativado, sua vitrine já será criada como pública</Text>
              </View>
              <Switch
                value={createPublicNow}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCreatePublicNow(value);
                }}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>

            {createPublicNow ? (
              <>
                <Input
                  label="WHATSAPP *"
                  value={telefone}
                  onChangeText={(v) => setTelefone(onlyDigits(v).slice(0, 11))}
                  keyboardType="phone-pad"
                  placeholder="11999998888"
                />
                <Input
                  label="CPF/CNPJ *"
                  value={documento}
                  onChangeText={(v) => setDocumento(onlyDigits(v).slice(0, 14))}
                  keyboardType="numeric"
                  placeholder="Somente números"
                />
                <Input
                  label="ENDEREÇO BASE *"
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Rua, número, bairro"
                />
              </>
            ) : null}

            {createError ? <Text style={styles.createErrorText}>{createError}</Text> : null}
            <Button title="CRIAR VITRINE" onPress={handleCreateShowcase} loading={showcaseApi.loading} />
          </View>
        </ScreenContainer>
      );
  }

  return (
    <ScreenContainer withPadding={false} backgroundColor={colors.background}>
      <View style={styles.headerPadding}>
        <Header
          title={showcaseApi.showcase?.nome?.toUpperCase() || 'MINHA VITRINE'}
          subtitle="Gerenciar Estoque"
          showBack
          rightAction={
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSettingsModal(true);
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="settings-outline" size={24} color={colors.white} />
            </Pressable>
          }
        />
      </View>

      <FlatList
        data={(showcaseApi.loading || productsApi.loading) ? [1, 2, 3, 4] : filteredProducts}
        keyExtractor={(item, index) => (showcaseApi.loading || productsApi.loading ? `skeleton-${index}` : item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.profileHeader}>
              <View style={styles.storeAvatar}>
                <Ionicons name="storefront" size={32} color={colors.primary} />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{showcaseApi.showcase?.nome}</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: showcaseApi.showcase?.visivel ? colors.success : colors.textCaption }]} />
                  <Text style={styles.statusText}>
                    {showcaseApi.showcase?.visivel ? 'VITRINE PÚBLICA' : 'VITRINE PRIVADA'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{showcaseProducts.length}</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{activeProducts.length}</Text>
                <Text style={styles.statLabel}>ESTOQUE</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{soldProducts.length}</Text>   
                <Text style={styles.statLabel}>VENDIDOS</Text>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Input
                icon="search-outline"
                placeholder="Buscar no meu estoque..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
            
            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tabBtn, productTab === 'active' && styles.tabBtnActive]}
                onPress={() => setProductTab('active')}
              >
                <Text style={[styles.tabText, productTab === 'active' && styles.tabTextActive]}>
                  Estoque ({activeProducts.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, productTab === 'sold' && styles.tabBtnActive]}
                onPress={() => setProductTab('sold')}
              >
                <Text style={[styles.tabText, productTab === 'sold' && styles.tabTextActive]}>
                  Vendidos ({soldProducts.length})
                </Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (showcaseApi.loading || productsApi.loading) {
            return (
              <View style={styles.cardWrapper}>
                <ProductCardSkeleton />
              </View>
            );
          }
          return (
            <View style={styles.cardWrapper}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.id })}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title={productTab === 'sold' ? 'NENHUM PRODUTO VENDIDO' : 'SUA VITRINE ESTÁ VAZIA'}
            description={
              productTab === 'sold'
                ? 'Os produtos vendidos aparecerão aqui.'
                : 'Comece adicionando seu primeiro sneaker ao estoque.'
            }
            actionLabel={productTab === 'sold' ? 'VER ESTOQUE ATIVO' : 'ADICIONAR PRODUTO'}
            onAction={() => {
              if (productTab === 'sold') {
                setProductTab('active');
                return;
              }
              navigation.navigate(ROUTES.PRODUCT_FORM, { mode: 'create', showcaseId: showcaseApi.showcase?.id });
            }}
          />
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate(ROUTES.PRODUCT_FORM, { mode: 'create', showcaseId: showcaseApi.showcase?.id });  
        }}
      >
        <Ionicons name="add" size={32} color={colors.black} />
      </Pressable>

      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configurações da loja</Text>
            <View style={styles.modalContent}>
              <Input label="NOME DA VITRINE" value={editingName} onChangeText={setEditingName} />
              
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Vitrine pública</Text>
                  <Text style={styles.switchSubtitle}>Ficar visível no Estoque Global</Text>
                </View>
                <Switch
                  value={!!showcaseApi.showcase?.visivel}
                  onValueChange={handleToggleVisibility}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.white}
                />
              </View>
              
              <Button title="SALVAR" onPress={handleSaveSettings} style={styles.saveBtn} />
              <Pressable style={styles.cancelBtn} onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerPadding: {
    paddingHorizontal: spacing.md
  },
  createForm: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md
  },
  createPublicBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: spacing.sm
  },
  createErrorText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
    marginBottom: spacing.sm
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: 20,
    backgroundColor: '#241D17',
    marginHorizontal: 16,
    borderRadius: 20,
  },
  storeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#34271B',
    borderWidth: 1,
    borderColor: '#58402D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...typography.h2,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 4
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  stat: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: '900',
    color: colors.white
  },
  statLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    position: 'relative'
  },
  searchInput: {
    marginBottom: 0
  },
  tabRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center'
  },
  tabBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 12
  },
  tabTextActive: {
    color: colors.primary
  },
  listContent: {
    paddingBottom: 100
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  cardWrapper: {
    width: '48%'
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...themeShadows.heavy
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  modalContent: {
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  switchText: {
    flex: 1
  },
  switchTitle: {
    ...typography.body,
    fontWeight: '900',
    color: colors.white
  },
  switchSubtitle: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2
  },
  saveBtn: {
    height: 52
  },
  cancelBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs
  },
  cancelBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '800'
  }
});
