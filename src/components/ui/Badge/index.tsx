import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

const statusStyles: Record<string, { bg: string; text: string }> = {
  disponivel: { bg: '#DDF3E5', text: '#195A39' },
  reservado: { bg: '#F8E8C8', text: '#755018' },
  vendido: { bg: '#DEE2E7', text: '#414955' },
  ativa: { bg: '#DDF3E5', text: '#195A39' },
  cancelada: { bg: '#F9DEDC', text: '#8C302C' },
  concluida: { bg: '#DDF3E5', text: '#195A39' },
  expirada: { bg: '#DEE2E7', text: '#414955' },
  pendente: { bg: '#F8E8C8', text: '#755018' },
  publica: { bg: '#DDE9F9', text: '#305A91' },
  privada: { bg: '#DEE2E7', text: '#414955' },
  novo: { bg: '#FBE4D4', text: '#85431A' },
  usado: { bg: '#DEE2E7', text: '#414955' }
};

const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  ativa: 'Ativa',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
  expirada: 'Expirada',
  pendente: 'Pendente',
  publica: 'Pública',
  privada: 'Privada',
  novo: 'Novo',
  usado: 'Usado'
};

type BadgeProps = {
  label: string;
  style?: ViewStyle;
};

export default function Badge({ label, style }: BadgeProps) {
  const normalizedLabel = String(label || '').toLowerCase();
  const displayLabel = statusLabels[normalizedLabel] || label;
  const badgeStyle = statusStyles[normalizedLabel] || {
    bg: colors.border,
    text: colors.textSecondary
  };

  return (
    <View style={[styles.badge, { backgroundColor: badgeStyle.bg }, style]}>
      <Text style={[styles.text, { color: badgeStyle.text }]}>{displayLabel.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 7,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
