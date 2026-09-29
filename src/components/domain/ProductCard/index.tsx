import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { themeShadows } from '../../../theme/themeShadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { formatCurrencyBRL, formatSizeBR } from '../../../utils/formatters';
import Badge from '../../ui/Badge';

export default function ProductCard({ 
  product, 
  onPress 
}: { 
  product: any; 
  onPress: () => void;
}) {
  const mainImage = (Array.isArray(product.imagens) && product.imagens.length > 0)
    ? product.imagens[0]
    : product.imagemUrl;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed
      ]} 
      accessibilityRole="button"
      accessibilityLabel={[product.marca, product.modelo, formatCurrencyBRL(product.preco)].filter(Boolean).join(' ')}
      onPress={handlePress}
    >
      <View style={styles.imageBox}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color={colors.textCaption} />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <Badge label={product.status} />
        </View>
        <View style={styles.sizeOverlay}>
          <Text style={styles.sizeOverlayText}>{formatSizeBR(product.numeracao)}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.brandText}>{product.marca?.toUpperCase()}</Text>
        <Text style={styles.modelText} numberOfLines={2}>{product.modelo}</Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.priceValue}>{formatCurrencyBRL(product.preco)}</Text>
          <View style={styles.actionCircle}>
            <Ionicons name="arrow-forward" size={18} color={colors.black} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: '100%',
    ...themeShadows.medium
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    borderColor: colors.primary
  },
  imageBox: {
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '88%',
    height: '82%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  sizeOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sizeOverlayText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '900'
  },
  infoBox: {
    padding: spacing.md,
    gap: 2
  },
  brandText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1
  },
  modelText: {
    minHeight: 40,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  footerRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white
  },
  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
