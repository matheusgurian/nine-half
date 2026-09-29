import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loading from '../../components/ui/Loading';
import { ROUTES } from '../../app/routes/routeNames';
import { PAYMENT_METHODS, getPaymentMethodLabel } from '../../constants/paymentMethods';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { useReservations } from '../../hooks/useReservations';
import { useTransactions } from '../../hooks/useTransactions';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatCurrencyBRL, formatSizeBR } from '../../utils/formatters';

export default function CheckoutScreen({ navigation, route }: any) {
  const productId = route?.params?.productId;
  const existingReservationId = route?.params?.reservationId;
  const { user } = useAuth();
  const { selectedProduct, loadProductById, loading: loadingProduct } = useProducts();
  const { reserveProduct, cancelReservation, loading: reserving } = useReservations();
  const { completeTransaction, loading: completing } = useTransactions();
  
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]>(
    PAYMENT_METHODS.PIX
  );
  const [step, setStep] = useState(1); // 1: Revisão, 2: Pagamento
  const [useMyAddress, setUseMyAddress] = useState(true);
  const [destinatarioNome, setDestinatarioNome] = useState('');
  const [destinatarioCPF, setDestinatarioCPF] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.endereco || '');
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(user?.cidade || '');
  const [deliveryCEP, setDeliveryCEP] = useState('');

  React.useEffect(() => {
    if (productId) loadProductById(productId);
  }, [productId]);

  if (loadingProduct && !selectedProduct) return <Loading text="PREPARANDO CHECKOUT..." />;
  if (!selectedProduct) return null;

  async function handleFinalize() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    let reservationId = String(existingReservationId || '');
    let createdReservationNow = false;
    try {
      if (!reservationId) {
        const reserveResult = await reserveProduct({
          productId: selectedProduct.id,
          buyerId: user.uid
        });
        reservationId = reserveResult?.reservationId || '';
        createdReservationNow = Boolean(reservationId);
      }

      if (reservationId) {
        const txResult = await completeTransaction({
          reservationId,
          userId: user.uid,
          paymentMethod
        });

        if (txResult?.transactionId) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.replace(ROUTES.TRANSACTION_DETAILS, { transactionId: txResult.transactionId });
        }
      }
    } catch (err: any) {
      if (reservationId && createdReservationNow) {
        try {
          await cancelReservation({
            reservationId,
            userId: user.uid,
            cancelReason: 'Falha na finalizacao do checkout.'
          });
        } catch (_) {}
      }

      Alert.alert('Erro no Checkout', err?.message || 'Não foi possível processar o pagamento simulado.');
    }
  }

  return (
    <ScreenContainer scroll maxContentWidth={720} backgroundColor={colors.background}>
      <Header title="CHECKOUT" showBack subtitle={step === 1 ? "Revisão do Pedido" : "Forma de Pagamento"} />

      <View style={styles.container}>
        {/* Progresso */}
        <View style={styles.progressRow}>
          <View style={[styles.progressStep, styles.stepActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={[styles.progressLine, step === 2 && styles.lineActive]} />
          <View style={[styles.progressStep, step === 2 && styles.stepActive]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
        </View>

        {step === 1 ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PRODUTO</Text>
              <View style={styles.productCard}>
                <Image source={{ uri: selectedProduct.imagemUrl }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.brandText}>{selectedProduct.marca?.toUpperCase()}</Text>
                  <Text style={styles.modelText}>{selectedProduct.modelo}</Text>
                  <Text style={styles.sizeText}>TAMANHO: {formatSizeBR(selectedProduct.numeracao)}</Text>
                </View>
                <Text style={styles.priceText}>{formatCurrencyBRL(selectedProduct.preco)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DESTINATÁRIO E ENTREGA</Text>
              
              <View style={styles.addressToggleRow}>
                <Pressable 
                  style={[styles.toggleBtn, useMyAddress && styles.toggleBtnActive]} 
                  onPress={() => {
                    setUseMyAddress(true);
                    setDeliveryAddress(user?.endereco || '');
                  }}
                >
                  <Text style={[styles.toggleBtnText, useMyAddress && styles.toggleBtnTextActive]}>MEU ENDEREÇO</Text>
                </Pressable>
                <Pressable 
                  style={[styles.toggleBtn, !useMyAddress && styles.toggleBtnActive]} 
                  onPress={() => setUseMyAddress(false)}
                >
                  <Text style={[styles.toggleBtnText, !useMyAddress && styles.toggleBtnTextActive]}>OUTRA PESSOA</Text>
                </Pressable>
              </View>

              <View style={styles.addressCard}>
                <Ionicons name={useMyAddress ? "person-outline" : "people-outline"} size={20} color={colors.primary} />
                <View style={styles.addressInfo}>
                  {useMyAddress ? (
                    <>
                      <Text style={styles.userName}>{user?.nome?.toUpperCase()}</Text>
                      <Text style={styles.addressText}>{user?.endereco || 'Endereço não cadastrado no seu perfil'}</Text>
                      <Text style={styles.addressText}>{user?.cidade || 'Cidade não cadastrada'}</Text>
                    </>
                  ) : (
                    <View style={styles.formGap}>
                      <Input 
                        label="NOME COMPLETO"
                        placeholder="Quem vai receber?"
                        value={destinatarioNome}
                        onChangeText={setDestinatarioNome}
                        style={styles.noMarginInput}
                      />
                      <Input 
                        label="CPF DO DESTINATÁRIO"
                        placeholder="000.000.000-00"
                        value={destinatarioCPF}
                        onChangeText={setDestinatarioCPF}
                        keyboardType="numeric"
                        style={styles.noMarginInput}
                      />
                      <Input 
                        label="RUA / LOGRADOURO"
                        placeholder="Ex.: Av. Paulista"
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        style={styles.noMarginInput}
                      />
                      <View style={styles.inlineRow}>
                        <View style={{ flex: 1 }}>
                          <Input 
                            label="NÚMERO"
                            placeholder="123"
                            value={deliveryNumber}
                            onChangeText={setDeliveryNumber}
                            keyboardType="numeric"
                            style={styles.noMarginInput}
                          />
                        </View>
                        <View style={{ flex: 2 }}>
                          <Input 
                            label="CEP"
                            placeholder="00000-000"
                            value={deliveryCEP}
                            onChangeText={setDeliveryCEP}
                            keyboardType="numeric"
                            style={styles.noMarginInput}
                          />
                        </View>
                      </View>
                      <Input 
                        label="CIDADE"
                        placeholder="Ex.: São Paulo"
                        value={deliveryCity}
                        onChangeText={setDeliveryCity}
                        style={styles.noMarginInput}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.spacer} />
            <Button title="CONTINUAR PARA PAGAMENTO" onPress={() => setStep(2)} />
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECIONE O MÉTODO</Text>
              <View style={styles.paymentList}>
                {[PAYMENT_METHODS.PIX, PAYMENT_METHODS.CARTAO, PAYMENT_METHODS.DINHEIRO].map((method) => (
                  <Pressable 
                    key={method} 
                    style={[styles.paymentOption, paymentMethod === method && styles.paymentActive]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Ionicons 
                      name={method === PAYMENT_METHODS.PIX ? "qr-code-outline" : method === PAYMENT_METHODS.CARTAO ? "card-outline" : "cash-outline"} 
                      size={24} 
                      color={paymentMethod === method ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
                      {getPaymentMethodLabel(method).toUpperCase()}
                    </Text>
                    <View style={[styles.radio, paymentMethod === method && styles.radioActive]}>
                      {paymentMethod === method && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrencyBRL(selectedProduct.preco)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frete</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>GRÁTIS</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>{formatCurrencyBRL(selectedProduct.preco)}</Text>
              </View>
            </View>

            <View style={styles.spacer} />
            <Button 
              title="CONFIRMAR E PAGAR" 
              onPress={handleFinalize} 
              loading={reserving || completing}
            />
            <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>VOLTAR</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4
  },
  lineActive: {
    backgroundColor: colors.primary
  },
  section: {
    marginBottom: spacing.xl
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption
  },
  modelText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    marginVertical: 2
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.md
  },
  addressInfo: {
    flex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  paymentList: {
    gap: spacing.sm
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  paymentActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.05)'
  },
  paymentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary
  },
  paymentTextActive: {
    color: colors.white
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioActive: {
    borderColor: colors.primary
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700'
  },
  summaryValue: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '800'
  },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary
  },
  spacer: {
    height: spacing.xl
  },
  backBtn: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.xs
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textCaption,
    letterSpacing: 1
  },
  addressToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  toggleBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  toggleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.1)'
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary
  },
  toggleBtnTextActive: {
    color: colors.primary
  },
  formGap: {
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  noMarginInput: {
    marginBottom: 0
  },
  inlineRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  addressInput: {
    marginBottom: 4,
  },
  addressHelper: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '700',
    fontStyle: 'italic'
  }
});
