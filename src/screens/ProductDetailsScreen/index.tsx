import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Header from '../../components/layout/Header';
import Loading from '../../components/ui/Loading';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { ROUTES } from '../../app/routes/routeNames';
import { PRODUCT_STATUS } from '../../constants/productStatus';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { useReservations } from '../../hooks/useReservations';
import { getUserById } from '../../services/userService';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { themeShadows } from '../../theme/themeShadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatCurrencyBRL, formatSizeBR } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errors';

export default function ProductDetailsScreen({ navigation, route }: any) {
  const productId = route.params?.productId;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { selectedProduct, loadProductById, loading } = useProducts();
  const { reserveProduct, loading: reserving } = useReservations();

  const [seller, setSeller] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reservationFeedback, setReservationFeedback] = useState<{
    kind: 'profile' | 'success' | 'error';
    message: string;
  } | null>(null);
  const reservationInFlight = useRef(false);

  useEffect(() => {
    if (!productId) return;
    loadProductById(productId);
  }, [productId]);

  useEffect(() => {
    if (!selectedProduct?.ownerId) return;
    getUserById(selectedProduct.ownerId).then(setSeller).catch(() => setSeller(null));
  }, [selectedProduct?.ownerId]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedProduct?.id]);

  if (loading && !selectedProduct) return <Loading text="DESBLOQUEANDO SNEAKER..." />;
  if (!selectedProduct) return <EmptyState title="PRODUTO NÃO ENCONTRADO" />;

  const productImages = Array.isArray(selectedProduct.imagens) && selectedProduct.imagens.length > 0
    ? selectedProduct.imagens
    : (selectedProduct.imagemUrl ? [selectedProduct.imagemUrl] : []);
  const selectedImage = productImages[selectedImageIndex] || '';

  const isOwner = selectedProduct.ownerId === user?.uid;
  const canReserve = !isOwner && selectedProduct.status === PRODUCT_STATUS.AVAILABLE;
  const isProfileComplete = !!(
    String(user?.documento || '').trim() &&
    String(user?.endereco || '').trim() &&
    String(user?.telefone || user?.whatsapp || '').trim()
  );

  async function handleReserve() {
    if (reservationInFlight.current || reservationFeedback?.kind === 'success') return;
    if (!user?.uid) {
      setReservationFeedback({ kind: 'error', message: 'Faça login novamente para reservar.' });
      return;
    }

    if (!isProfileComplete) {
      const missingFields: string[] = [];
      if (!String(user?.documento || '').trim()) missingFields.push('CPF/CNPJ');
      if (!String(user?.endereco || '').trim()) missingFields.push('Endereço');
      if (!String(user?.telefone || user?.whatsapp || '').trim()) missingFields.push('WhatsApp');

      setReservationFeedback({
        kind: 'profile',
        message: `Para reservar este sneaker, complete seu perfil: ${missingFields.join(', ')}.`
      });
      return;
    }

    reservationInFlight.current = true;
    setReservationFeedback(null);
    try {
      await reserveProduct({ productId: selectedProduct.id, buyerId: user.uid });
      setReservationFeedback({
        kind: 'success',
        message: 'Reserva confirmada! Você pode finalizar a compra em Minhas Reservas.'
      });
    } catch (err: any) {
      setReservationFeedback({ kind: 'error', message: getErrorMessage(err) });
    } finally {
      reservationInFlight.current = false;
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenContainer scroll withPadding={false} backgroundColor={colors.background}>
        <View style={styles.headerAbsolute}>
          <Header title="" showBack />
        </View>

        <View style={[styles.heroContainer, { height: Math.min(width, 460) }]}>
          <View style={styles.imageStage}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.heroImage} resizeMode="contain" />
            ) : (
              <Ionicons name="image-outline" size={64} color={colors.border} />
            )}
          </View>
          <View style={styles.heroOverlay}>
            <Badge label={selectedProduct.status} />
            <View style={styles.conditionChip}>
              <Text style={styles.conditionText}>{selectedProduct.condicao?.toUpperCase() || 'NOVO'}</Text>
            </View>
          </View>
        </View>

        {productImages.length > 1 && (
          <View style={styles.galleryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {productImages.map((uri: string, index: number) => (
                <Pressable
                  key={`${uri}-${index}`}
                  style={[styles.thumb, selectedImageIndex === index && styles.thumbActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedImageIndex(index);
                  }}
                >
                  <Image source={{ uri }} style={styles.thumbImage} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.mainContent}>
          <View style={styles.brandBox}>
            <Text style={styles.brandName}>{selectedProduct.marca?.toUpperCase()}</Text>
            <View style={styles.originTag}>
              <Text style={styles.originText}>{selectedProduct.origem === 'proprio' ? 'OFFICIAL' : 'PARCEIRO'}</Text>
            </View>
          </View>
          
          <Text style={styles.productTitle}>{selectedProduct.modelo}</Text>
          <Text style={styles.productPrice}>{formatCurrencyBRL(selectedProduct.preco)}</Text>

          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Ionicons name="resize-outline" size={16} color={colors.primary} />
              <View>
                <Text style={styles.specLabel}>TAMANHO</Text>
                <Text style={styles.specValue}>{formatSizeBR(selectedProduct.numeracao)}</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
              <View>
                <Text style={styles.specLabel}>COR</Text>
                <Text style={styles.specValue}>{selectedProduct.cor || 'Original'}</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <View>
                <Text style={styles.specLabel}>RESERVA</Text>
                <Text style={styles.specValue}>{selectedProduct.tempoReserva || 24}H</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
              <View>
                <Text style={styles.specLabel}>AUTÊNTICO</Text>
                <Text style={styles.specValue}>VERIFICADO</Text>
              </View>
            </View>
          </View>

          {!isOwner && seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VENDEDOR RESPONSÁVEL</Text>
              <Pressable 
                style={styles.sellerCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate(ROUTES.PUBLIC_PROFILE, { userId: seller.id });
                }}
              >
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerInitial}>{seller.nome?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.sellerMeta}>
                  <Text style={styles.sellerName}>{seller.nome?.toUpperCase()}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={colors.primary} />
                    <Text style={styles.locationText}>{seller.cidade || 'Brasil'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.border} />
              </Pressable>
            </View>
          )}

          {selectedProduct.descricao && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HISTÓRIA E DETALHES</Text>
              <Text style={styles.descriptionText}>{selectedProduct.descricao}</Text>
            </View>
          )}

          <View style={styles.safeBottom} />
        </View>
      </ScreenContainer>

      <View style={[styles.actionFooter, { paddingBottom: insets.bottom + spacing.md }]}>
        {reservationFeedback ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.reservationFeedback,
              reservationFeedback.kind === 'success' && styles.reservationSuccess,
              reservationFeedback.kind === 'error' && styles.reservationError
            ]}
          >
            {reservationFeedback.message}
          </Text>
        ) : null}
        {reservationFeedback?.kind === 'success' ? (
          <Button title="VER MINHAS RESERVAS" onPress={() => navigation.navigate(ROUTES.MY_RESERVATIONS)} />
        ) : canReserve && user ? (
          <>
            {reservationFeedback?.kind === 'profile' && !isProfileComplete ? (
              <Button title="COMPLETAR MEU PERFIL" onPress={() => navigation.navigate(ROUTES.PROFILE)} />
            ) : (
              <Button title="RESERVAR AGORA" onPress={handleReserve} loading={reserving} />
            )}
          </>
        ) : isOwner ? (
          <Button
            title="GERENCIAR ANÚNCIO"
            variant="secondary"
            onPress={() => navigation.navigate(ROUTES.PRODUCT_FORM, { mode: 'edit', productId: selectedProduct.id })}
          />
        ) : (
          <Button
            title={!user ? "LOGAR PARA RESERVAR" : selectedProduct.status === PRODUCT_STATUS.RESERVED ? "SNEAKER RESERVADO" : "SNEAKER VENDIDO"}
            variant="secondary"
            disabled={selectedProduct.status !== PRODUCT_STATUS.AVAILABLE}
            onPress={() => {
              if (!user) {
                navigation.goBack();
              }
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerAbsolute: {
    paddingHorizontal: spacing.md,
    zIndex: 10
  },
  heroContainer: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  imageStage: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    alignItems: 'flex-end',
    gap: spacing.xs
  },
  conditionChip: {
    backgroundColor: colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1
  },
  galleryContainer: {
    marginTop: -32,
    zIndex: 20
  },
  galleryScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...themeShadows.soft
  },
  thumbActive: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  mainContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4
  },
  brandName: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    letterSpacing: 2
  },
  originTag: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  originText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary
  },
  productTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    lineHeight: 36
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginTop: spacing.sm
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  specItem: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    letterSpacing: 0.5
  },
  specValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    letterSpacing: 1.5,
    marginBottom: spacing.md
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sellerInitial: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  sellerMeta: {
    flex: 1
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700'
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500'
  },
  safeBottom: {
    height: spacing.md
  },
  actionFooter: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reservationFeedback: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  reservationSuccess: {
    color: colors.success
  },
  reservationError: {
    color: colors.danger
  }
});
