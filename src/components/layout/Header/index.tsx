import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export default function Header({
  title,
  subtitle,
  onBack,
  rightAction,
  showBack = false
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBack?: boolean;
}) {
  const navigation = useNavigation();
  const displayTitle = title === title.toUpperCase() ? title.charAt(0) + title.slice(1).toLowerCase() : title;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          {showBack || onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={handleBack} style={styles.backButton} hitSlop={8}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.brand}><Text style={styles.brandMark}>9½</Text><Text style={styles.brandText}>NINE HALF</Text></View>
        <View style={styles.right}>
          {rightAction}
        </View>
      </View>
      
      {title ? <View style={styles.titleArea}>
        <Text accessibilityRole="header" style={styles.title}>{displayTitle}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  brandMark: { fontSize: 17, fontWeight: '900', color: colors.primary },
  brandText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: colors.textSecondary },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  left: {
    width: 48,
    height: 48,
    justifyContent: 'center',
  },
  right: {
    minWidth: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 30,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    fontWeight: '500',
    lineHeight: 21,
  }
});
