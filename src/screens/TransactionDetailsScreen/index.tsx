import React, { useEffect, useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image, StyleSheet, Text, View, Pressable, ScrollView, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { getPaymentMethodLabel } from '../../constants/paymentMethods';
import { ROUTES } from '../../app/routes/routeNames';
import { useTransactions } from '../../hooks/useTransactions';
import { getUserById } from '../../services/userService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { themeShadows } from '../../theme/themeShadows';
import { formatCurrencyBRL, formatSizeBR } from '../../utils/formatters';

export default function TransactionDetailsScreen({ route, navigation }: any) {
  const transactionId = route.params?.transactionId;
  const { selectedTransaction, loadTransactionById, loading, error } = useTransactions();
  const [buyer, setBuyer] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!transactionId) return;
    loadTransactionById(transactionId);
  }, [transactionId, loadTransactionById]);

  useEffect(() => {
    if (selectedTransaction) {
      getUserById(selectedTransaction.buyerId).then(setBuyer);
      getUserById(selectedTransaction.sellerId).then(setSeller);
    }
  }, [selectedTransaction]);

  if (loading && !selectedTransaction) return <Loading text="GERANDO COMPROVANTE..." />;

  if (!selectedTransaction) {
    return (
      <ScreenContainer backgroundColor={colors.background}>
        <Header title="COMPROVANTE" showBack />
        <EmptyState title="NÃO ENCONTRADO" description={error || 'Não foi possível recuperar esta transação.'} />
      </ScreenContainer>
    );
  }

  const date = selectedTransaction?.completedAt?.seconds
    ? new Date(selectedTransaction.completedAt.seconds * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  async function handleShare() {
    if (!selectedTransaction) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const message = `🚀 *COMPROVANTE NINE HALF*\n` +
      `--------------------------------\n` +
      `*ID:* #${selectedTransaction.id.slice(0, 8).toUpperCase()}\n` +
      `*DATA:* ${date}\n\n` +
      `*PRODUTO:* ${selectedTransaction.productBrand?.toUpperCase()} ${selectedTransaction.productModel}\n` +
      `*TAMANHO:* ${formatSizeBR(selectedTransaction.productSize)}\n` +
      `*VALOR:* ${formatCurrencyBRL(selectedTransaction.valor)}\n` +
      `*MÉTODO:* ${getPaymentMethodLabel(selectedTransaction.paymentMethod).toUpperCase()}\n` +
      `--------------------------------\n` +
      `*VENDEDOR:* ${seller?.nome || '...'}\n` +
      `*COMPRADOR:* ${buyer?.nome || '...'}\n` +
      `--------------------------------\n` +
      `🛡️ _Autenticado pela Rede Nine Half_`;

    try {
      await Share.share({
        message,
        title: 'Comprovante de Venda - Nine Half',
      });
    } catch (err) {
      // Erro silencioso
    }
  }

  async function handleGeneratePDF() {
    if (!selectedTransaction) return;
    setPdfLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .logo { font-size: 32px; font-weight: 900; letter-spacing: 4px; margin: 0; }
            .subtitle { font-size: 10px; letter-spacing: 5px; color: #666; margin-top: 5px; }
            .status { background: #10B981; color: #fff; display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 900; margin-top: 20px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 10px; font-weight: 900; color: #999; border-bottom: 1px dashed #ddd; padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; }
            .info-grid { display: flex; flex-wrap: wrap; }
            .info-item { width: 50%; margin-bottom: 15px; }
            .label { font-size: 10px; color: #666; font-weight: 800; margin-bottom: 3px; }
            .value { font-size: 14px; font-weight: 900; }
            .product-box { display: flex; align-items: center; background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .product-details { flex: 1; }
            .brand { font-size: 10px; color: #666; font-weight: 900; }
            .model { font-size: 18px; font-weight: 900; margin: 3px 0; }
            .total-box { text-align: center; margin-top: 40px; padding: 30px; border: 2px solid #000; }
            .total-label { font-size: 12px; font-weight: 900; color: #666; }
            .total-value { font-size: 42px; font-weight: 900; margin-top: 5px; }
            .footer { text-align: center; margin-top: 50px; font-size: 9px; color: #999; font-weight: 800; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="logo">NINE HALF</h1>
            <p class="subtitle">Sneaker Specialist</p>
            <div class="status">PAGAMENTO CONFIRMADO</div>
          </div>

          <div class="section">
            <div class="section-title">DETALHES DA TRANSAÇÃO</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">ID TRANSAÇÃO</div>
                <div class="value">#${selectedTransaction.id.toUpperCase()}</div>
              </div>
              <div class="info-item">
                <div class="label">DATA</div>
                <div class="value">${date}</div>
              </div>
              <div class="info-item">
                <div class="label">MÉTODO DE PAGAMENTO</div>
                <div class="value">${getPaymentMethodLabel(selectedTransaction.paymentMethod).toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">PRODUTO</div>
            <div class="product-box">
              <div class="product-details">
                <div class="brand">${selectedTransaction.productBrand?.toUpperCase()}</div>
                <div class="model">${selectedTransaction.productModel}</div>
                <div class="value">TAMANHO: ${formatSizeBR(selectedTransaction.productSize)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">PARTES ENVOLVIDAS</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">VENDEDOR</div>
                <div class="value">${seller?.nome || '...'}</div>
              </div>
              <div class="info-item">
                <div class="label">COMPRADOR</div>
                <div class="value">${buyer?.nome || '...'}</div>
              </div>
            </div>
          </div>

          <div class="total-box">
            <div class="total-label">VALOR TOTAL</div>
            <div class="total-value">${formatCurrencyBRL(selectedTransaction.valor)}</div>
          </div>

          <div class="footer">
            AUTENTICADO PELA REDE NINE HALF • COMPROVANTE DIGITAL VÁLIDO
          </div>
        </body>
      </html>
    `;

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert('Indisponível', 'Compartilhamento de arquivos não disponível neste dispositivo.');
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background}>
      <Header 
        title="COMPROVANTE" 
        showBack 
        subtitle="Prova digital da negociação"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptTop}>
            <View style={styles.hypeLogo}>
              <Text style={styles.hypeLogoText}>NINE HALF</Text>
              <Text style={styles.hypeLogoSub}>Sneaker Specialist</Text>
            </View>
            <View style={styles.statusBadgeBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.statusText}>PAGAMENTO CONFIRMADO</Text>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRODUTO</Text>
            <View style={styles.productInfo}>
              <View style={styles.imageBox}>
                {selectedTransaction.productImageUrl ? (
                  <Image source={{ uri: selectedTransaction.productImageUrl }} style={styles.productImage} />
                ) : (
                  <Ionicons name="image-outline" size={24} color={colors.textCaption} />
                )}
              </View>
              <View style={styles.productText}>
                <Text style={styles.brandText}>{selectedTransaction.productBrand?.toUpperCase()}</Text>
                <Text style={styles.modelText}>{selectedTransaction.productModel}</Text>
                <View style={styles.sizeRow}>
                  <Text style={styles.sizeText}>TAMANHO: {formatSizeBR(selectedTransaction.productSize)}</Text>
                  <Text style={styles.colorText}>{selectedTransaction.productColor}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARTES ENVOLVIDAS</Text>
            <View style={styles.partiesRow}>
              <View style={styles.party}>
                <Text style={styles.partyLabel}>VENDEDOR</Text>
                <Text style={styles.partyValue}>{seller?.nome || '...'}</Text>
              </View>
              <View style={styles.partyArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.textCaption} />
              </View>
              <View style={styles.party}>
                <Text style={[styles.partyLabel, { textAlign: 'right' }]}>COMPRADOR</Text>
                <Text style={[styles.partyValue, { textAlign: 'right' }]}>{buyer?.nome || '...'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMAÇÕES DA TRANSAÇÃO</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DATA</Text>
                <Text style={styles.infoValue}>{date}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>MÉTODO</Text>
                <Text style={styles.infoValue}>{getPaymentMethodLabel(selectedTransaction.paymentMethod).toUpperCase()}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nº TRANSAÇÃO</Text>
                <Text style={styles.infoValue}>#{selectedTransaction.id.slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>VALOR TOTAL</Text>
            <Text style={styles.priceValue}>{formatCurrencyBRL(selectedTransaction.valor)}</Text>
          </View>

          <View style={styles.footerBranding}>
            <Ionicons name="shield-checkmark" size={14} color={colors.textCaption} />
            <Text style={styles.footerBrandingText}>AUTENTICADO PELA REDE NINE HALF</Text>
          </View>
        </View>

        <Pressable 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.black} />
          <Text style={styles.shareButtonText}>COMPARTILHAR TEXTO</Text>
        </Pressable>

        <Pressable 
          style={[styles.shareButton, { backgroundColor: colors.white, marginTop: spacing.sm }]}
          onPress={handleGeneratePDF}
          disabled={pdfLoading}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.black} />
          <Text style={styles.shareButtonText}>{pdfLoading ? 'GERANDO PDF...' : 'COMPARTILHAR PDF'}</Text>
        </Pressable>

        <Pressable
          style={[styles.shareButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm }]}
          onPress={() => navigation.navigate(ROUTES.CHAT_ROOM, { transactionId: selectedTransaction.id })}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.white} />
          <Text style={[styles.shareButtonText, { color: colors.white }]}>ABRIR CHAT DA COMPRA</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl
  },
  receiptCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    ...themeShadows.heavy,
    position: 'relative'
  },
  receiptTop: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  hypeLogo: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  hypeLogoText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 2
  },
  hypeLogoSub: {
    fontSize: 12,
    fontWeight: '800',
    color: '#606672',
    letterSpacing: 1.5,
    marginTop: 2
  },
  statusBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.success
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.success,
    letterSpacing: 0.5
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    marginVertical: spacing.lg
  },
  section: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#606672',
    marginBottom: spacing.sm,
    letterSpacing: 1
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5'
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4
  },
  productText: {
    flex: 1
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#606672',
    letterSpacing: 0.5
  },
  modelText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.black,
    marginVertical: 2
  },
  sizeRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: spacing.md
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#505661'
  },
  colorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#606672'
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  party: {
    flex: 1
  },
  partyLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#606672',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  partyValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.black
  },
  partyArrow: {
    paddingHorizontal: spacing.sm
  },
  infoGrid: {
    gap: spacing.sm
  },
  infoItem: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#606672'
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black
  },
  priceSection: {
    alignItems: 'center',
    marginVertical: spacing.sm
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#606672',
    letterSpacing: 1
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.black,
    marginTop: 4
  },
  footerBranding: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl
  },
  footerBrandingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#606672',
    letterSpacing: 1
  },
  shareButton: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    minHeight: 56,
    borderRadius: 12,
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...themeShadows.medium
  },
  shareButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 0.5
  }
});
