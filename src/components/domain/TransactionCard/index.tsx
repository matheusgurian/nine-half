import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getPaymentMethodLabel } from '../../../constants/paymentMethods';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { formatCurrencyBRL, formatSizeBR } from '../../../utils/formatters';
import Badge from '../../ui/Badge';

export default function TransactionCard({
  transaction,
  onPress
}: {
  transaction: any;
  onPress?: (transaction: any) => void;
}) {
  const date = transaction?.completedAt?.seconds
    ? new Date(transaction.completedAt.seconds * 1000).toLocaleDateString('pt-BR')
    : '-';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(transaction);
  };

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {transaction?.productImageUrl ? (
          <Image source={{ uri: transaction.productImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={24} color={colors.textCaption} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.brand}>{transaction?.productBrand?.toUpperCase() || 'SNEAKER'}</Text>
          <Badge label={transaction.status} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {transaction?.productModel || 'Item'}
        </Text>
        <Text style={styles.price}>{formatCurrencyBRL(transaction?.valor)}</Text>
        <Text style={styles.productMeta}>
          {formatSizeBR(transaction?.productSize)}{transaction?.productColor ? ` • ${transaction.productColor}` : ''}
        </Text>

        <View style={styles.meta}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.metaText}>Concluída em {date}</Text>
        </View>
        <Text style={styles.paymentText}>Pagamento: {getPaymentMethodLabel(transaction?.paymentMethod)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  info: {
    minWidth: 0,
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center'
  },
  header: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  brand: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 4
  },
  productMeta: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '700',
    marginTop: 2
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  paymentText: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '600',
    marginTop: 4
  }
});
