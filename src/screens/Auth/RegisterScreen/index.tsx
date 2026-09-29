import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AuthLayout from '../../../components/layout/AuthLayout';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../app/routes/routeNames';
import { validateEmail, validatePassword, validateRequired } from '../../../utils/validators';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export default function RegisterScreen({ navigation }: any) {
  const { register, loading, error } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  async function handleRegister() {
    setFormError('');
    if (!validateRequired(nome)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Informe seu nome completo.');
      return;
    }
    if (!validateEmail(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('E-mail inválido.');
      return;
    }
    if (!validatePassword(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      await register({
        nome: nome.trim(),
        email: email.trim(),
        password
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  return (
    <AuthLayout mode="register" onBack={() => navigation.navigate(ROUTES.LOGIN)}>
        <View style={styles.form}>
          <Input
            icon="person-outline"
            label="Nome Completo"
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome completo"
            autoCapitalize="words"
          />
          <Input
            icon="mail-outline"
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            icon="lock-closed-outline"
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Pelo menos 6 caracteres"
            secureTextEntry
          />

          {(formError || error) ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{formError || error}</Text>
            </View>
          ) : null}

          <Button 
            title="CADASTRAR AGORA" 
            onPress={handleRegister} 
            loading={loading} 
            disabled={loading} 
            style={styles.registerButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já faz parte do time?</Text>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(ROUTES.LOGIN);
          }}>
            <Text style={styles.footerLink}> FAZER LOGIN</Text>
          </Pressable>
        </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 0,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
    marginTop: 28,
    gap: 8,
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 10,
  }
});
