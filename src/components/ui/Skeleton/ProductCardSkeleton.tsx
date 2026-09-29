import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

const SkeletonPiece = ({ style }: any) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.25],
  });

  return <Animated.View style={[styles.piece, style, { opacity }]} />;
};

export const ProductCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <SkeletonPiece style={styles.imageBox} />
      <View style={styles.info}>
        <SkeletonPiece style={styles.badge} />
        <SkeletonPiece style={styles.title} />
        <SkeletonPiece style={styles.subtitle} />
        <View style={styles.footer}>
          <SkeletonPiece style={styles.price} />
          <SkeletonPiece style={styles.action} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  piece: {
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageBox: {
    aspectRatio: 1,
    width: '100%',
  },
  info: {
    padding: spacing.md,
  },
  badge: {
    width: 60,
    height: 16,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  title: {
    width: '90%',
    height: 20,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  subtitle: {
    width: '60%',
    height: 14,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  price: {
    width: 80,
    height: 24,
    borderRadius: 4,
  },
  action: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
