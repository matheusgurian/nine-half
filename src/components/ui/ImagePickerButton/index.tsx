import React from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import * as Haptics from 'expo-haptics';

export default function ImagePickerButton({
  onPress,
  loading
}: {
  onPress: () => void;
  loading?: boolean;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]} 
      onPress={handlePress}
      disabled={loading}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="camera" size={32} color={colors.primary} />
        </View>
        <Text style={styles.text}>{loading ? 'CARREGANDO...' : 'ADICIONAR FOTO'}</Text>
        <Text style={styles.subtext}>JPG OU PNG • MÁX 5MB</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    width: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  pressed: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  text: {
    ...typography.body,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1,
  },
  subtext: {
    ...typography.caption,
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 10
  }
});
