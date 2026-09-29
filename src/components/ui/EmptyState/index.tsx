import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../Button';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export default function EmptyState({
  title = 'SEM RESULTADOS',
  description = 'Nada por aqui no momento.',
  actionLabel,
  onAction,
  icon = 'archive-outline'
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button 
            title={actionLabel} 
            variant="secondary" 
            onPress={onAction} 
            fullWidth={false}
            style={styles.button}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    minHeight: 240,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: colors.background
  },
  iconWrap: {
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 1
  },
  desc: {
    lineHeight: 22,
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 14,
  },
  action: {
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    maxWidth: '100%',
  }
});
