import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESERVATION_STATUS } from '../../../constants/reservationStatus';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { formatCurrencyBRL, formatSizeBR } from '../../../utils/formatters';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

export default function ReservationCard({
  reservation,
  userId,
  nowMs,
  onCancel,
  cancelLoading,
  onComplete,
  completeLoading
}: {
  reservation: any;
  userId: string;
  nowMs?: number;
  onCancel: (reservation: any) => void;
  cancelLoading?: boolean;
  onComplete?: (reservation: any) => void;
  completeLoading?: boolean;
}) {
  const isSeller = reservation.sellerId === userId;
  const isActive = reservation.status === RESERVATION_STATUS.ACTIVE;

  const date = reservation?.createdAt?.seconds
    ? new Date(reservation.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
    : '-';

  const expiresSeconds = reservation?.expiresAt?.seconds;
  const expiresNanos = reservation?.expiresAt?.nanoseconds || 0;
  const expiresMs = expiresSeconds ? expiresSeconds * 1000 + Math.floor(expiresNanos / 1000000) : 0;
  const remainingMs = expiresMs > 0 ? expiresMs - (nowMs || Date.now()) : 0;

  const formatRemaining = (ms: number) => {
    const clamped = Math.max(0, ms);
    const totalSec = Math.floor(clamped / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const remainingLabel = expiresMs > 0 ? formatRemaining(remainingMs) : '-';
  const isExpiredByTime = isActive && expiresMs > 0 && remainingMs <= 0;
  const remainingColor = isExpiredByTime
    ? colors.danger
    : remainingMs <= 15 * 60 * 1000
      ? colors.warning
      : colors.success;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.productBlock}>
          <View style={styles.imageContainer}>
            {reservation?.productImageUrl ? (
              <Image source={{ uri: reservation.productImageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={20} color={colors.textCaption} />
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.brand}>{reservation?.productBrand?.toUpperCase() || 'SNEAKER'}</Text>
            <Text numberOfLines={1} style={styles.title}>{reservation?.productModel || 'Item'}</Text>
            <Text style={styles.price}>{formatCurrencyBRL(reservation?.productPrice)}</Text>
            <Text style={styles.metaProduct}>
              {formatSizeBR(reservation?.productSize)}
              {reservation?.productColor ? ` • ${reservation.productColor}` : ''}
            </Text>
          </View>
        </View>
        <Badge label={reservation.status} />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaLeft}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textCaption} />
            <Text style={styles.metaText}>Iniciada em {date}</Text>
          </View>
          {isActive && expiresMs > 0 ? (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={remainingColor} />
              <Text style={[styles.metaText, { color: remainingColor, fontWeight: '800' }]}>
                {isExpiredByTime ? 'Tempo esgotado' : `Expira em ${remainingLabel}`}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.roleLabel}>
          {isSeller ? 'VOCÊ É O VENDEDOR' : 'VOCÊ É O COMPRADOR'}
        </Text>
      </View>

      {isActive && (
        <View style={styles.actions}>
          {onComplete ? (
            <>
              <Button
                title={isSeller ? 'Confirmar venda' : 'Finalizar compra'}
                variant="primary"
                onPress={() => onComplete?.(reservation)}
                loading={!!completeLoading}
                disabled={!!completeLoading || !!cancelLoading}
                fullWidth={false}
                style={styles.actionBtn}
              />
              <Button
                title="Liberar"
                variant="secondary"
                onPress={() => onCancel(reservation)}
                loading={!!cancelLoading}
                disabled={!!completeLoading || !!cancelLoading}
                fullWidth={false}
                style={styles.actionBtn}
              />
            </>
          ) : (
            <Button
              title="CANCELAR RESERVA"
              variant="secondary"
              onPress={() => onCancel(reservation)}
              loading={!!cancelLoading}
              disabled={!!completeLoading || !!cancelLoading}
            />
          )}
        </View>
      )}
    </View>
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
  },
  header: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productBlock: {
    minWidth: 160,
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.sm,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    minWidth: 0,
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 4,
  },
  metaProduct: {
    fontSize: 12,
    color: colors.textCaption,
    fontWeight: '700',
    marginTop: 3
  },
  meta: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaLeft: {
    flex: 1,
    gap: 4
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    letterSpacing: 0.5,
  },
  actions: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    minWidth: 130,
    paddingHorizontal: spacing.sm,
    flex: 1,
    minHeight: 44,
  }
});
