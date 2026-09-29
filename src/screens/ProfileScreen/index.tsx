import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useReservations } from '../../hooks/useReservations';
import { useTransactions } from '../../hooks/useTransactions';
import { ROUTES } from '../../app/routes/routeNames';
import { onlyDigits, validateCep, validateDocument, validatePhone, validateRequired } from '../../utils/validators';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { themeShadows } from '../../theme/themeShadows';
import { getErrorMessage } from '../../utils/errors';

export default function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const { user, logout, updateProfile, updatePrivateProfile, error: authError } = useAuth();
  const { reservations, loadMyReservations } = useReservations();
  const { transactions, loadMyTransactions } = useTransactions();
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [documento, setDocumento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('');
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const logoutInFlight = useRef(false);

  useEffect(() => {
    setNome(user?.nome || '');
    setTelefone(user?.telefone || '');
    setDocumento(user?.documento || '');
    setEndereco(user?.endereco || '');
    setCep(user?.cep || '');
    setCidade(user?.cidade || '');
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    loadMyReservations(user.uid).catch(() => undefined);
    loadMyTransactions(user.uid).catch(() => undefined);
  }, [user?.uid, loadMyReservations, loadMyTransactions]);

  const userInitial = useMemo(() => user?.nome?.charAt(0)?.toUpperCase() || 'S', [user?.nome]);

  const joinedDate = useMemo(() => {
    if (user?.createdAt?.seconds) {
      return new Date(user.createdAt.seconds * 1000).getFullYear();
    }
    return new Date().getFullYear().toString();
  }, [user?.createdAt]);

  const handleLogout = () => {
    setLogoutError('');
    setConfirmingLogout(true);
  };

  const confirmLogout = async () => {
    if (logoutInFlight.current) return;
    logoutInFlight.current = true;
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
    } catch (err) {
      setLogoutError(getErrorMessage(err));
    } finally {
      logoutInFlight.current = false;
      setLoggingOut(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');

    if (!validateRequired(nome)) {
      setError('Informe seu nome.');
      return;
    }
    if (validateRequired(telefone) && !validatePhone(telefone)) {
      setError('WhatsApp inválido. Use DDD + número (10 ou 11 dígitos).');
      return;
    }
    if (validateRequired(documento) && !validateDocument(documento)) {
      setError('CPF/CNPJ inválido. Use 11 ou 14 dígitos.');
      return;
    }
    if (validateRequired(cep) && !validateCep(cep)) {
      setError('CEP inválido. Use 8 dígitos.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ nome: nome.trim(), cidade: cidade.trim() });
      await updatePrivateProfile({
        telefone: onlyDigits(telefone),
        documento: onlyDigits(documento),
        endereco: endereco.trim(),
        cep: onlyDigits(cep)
      });
      setShowEditForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Perfil atualizado', 'Suas informações foram salvas.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll backgroundColor={colors.background}>
      <Header title="MEU PERFIL" showBack subtitle="Estatísticas e configurações" />

      <View style={styles.content}>
        <View style={styles.passportCard}>
          <View style={styles.passportTop}>
            <View style={styles.passportAvatar}>
              <Text style={styles.passportAvatarText}>{userInitial}</Text>
            </View>
            <View style={styles.passportMainInfo}>
              <Text style={styles.passportName}>{user?.nome?.toUpperCase() || 'USUÁRIO'}</Text>
              <Text style={styles.passportEmail}>{user?.email}</Text>
              <View style={styles.memberSince}>
                <Text style={styles.memberSinceText}>MEMBRO DESDE {joinedDate}</Text>
              </View>
            </View>
            <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.passportDivider} />

          <View style={styles.passportStats}>
            <View style={styles.passportStatItem}>
              <Text style={styles.passportStatValue}>{transactions?.length || 0}</Text>
              <Text style={styles.passportStatLabel}>VENDAS</Text>
            </View>
            <View style={styles.vLine} />
            <View style={styles.passportStatItem}>
              <Text style={styles.passportStatValue}>{reservations?.length || 0}</Text>
              <Text style={styles.passportStatLabel}>RESERVAS</Text>
            </View>
            <View style={styles.vLine} />
            <View style={styles.passportStatItem}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{user?.tipo?.toUpperCase() || 'MEMBER'}</Text>
              </View>
              <Text style={styles.passportStatLabel}>NÍVEL</Text>
            </View>
          </View>
        </View>

        {!showEditForm ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>GESTÃO DE CONTA</Text>

              <Pressable style={styles.menuBtn} onPress={() => setShowEditForm(true)}>
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuTextContent}>
                  <Text style={styles.menuTitle}>DADOS PESSOAIS</Text>
                  <Text style={styles.menuSubtitle}>Nome, cidade, documento e endereço</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textCaption} />
              </Pressable>

              <Pressable style={styles.menuBtn} onPress={() => navigation.navigate(ROUTES.MY_TRANSACTIONS)}>
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="receipt-outline" size={20} color={colors.success} />
                </View>
                <View style={styles.menuTextContent}>
                  <Text style={styles.menuTitle}>HISTÓRICO DE VENDAS</Text>
                  <Text style={styles.menuSubtitle}>Todas as suas transações concluídas</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textCaption} />
              </Pressable>

              <Pressable style={styles.menuBtn} onPress={() => Alert.alert('Em breve', 'Módulo de segurança em desenvolvimento.')}>
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.danger} />
                </View>
                <View style={styles.menuTextContent}>
                  <Text style={styles.menuTitle}>SEGURANÇA</Text>
                  <Text style={styles.menuSubtitle}>Alterar senha e privacidade</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textCaption} />
              </Pressable>
            </View>

            <View style={styles.logoutSection}>
              {logoutError || authError ? (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorText}>
                  {logoutError || authError}
                </Text>
              ) : null}
              {confirmingLogout ? (
                <View style={styles.logoutConfirmation}>
                  <Text style={styles.logoutPrompt}>Tem certeza de que deseja encerrar sua sessão?</Text>
                  <Button title="SAIR DA CONTA" onPress={confirmLogout} variant="danger" loading={loggingOut} />
                  <Button title="CANCELAR" onPress={() => setConfirmingLogout(false)} variant="ghost" disabled={loggingOut} />
                </View>
              ) : (
                <Button title="ENCERRAR SESSÃO" onPress={handleLogout} variant="secondary" style={styles.logoutBtn} />
              )}
              <Text style={styles.versionText}>NINE HALF / SUA REDE DE SNEAKERS</Text>
            </View>
          </>
        ) : (
          <View style={styles.editSection}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>EDITAR PERFIL</Text>
              <Pressable onPress={() => setShowEditForm(false)}>
                <Text style={styles.cancelText}>CANCELAR</Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              <Input label="NOME COMPLETO" value={nome} onChangeText={setNome} placeholder="Seu nome" />
              <Input
                label="WHATSAPP"
                value={telefone}
                onChangeText={(v) => setTelefone(onlyDigits(v).slice(0, 11))}
                placeholder="11999998888"
                keyboardType="phone-pad"
              />
              <Input label="CIDADE" value={cidade} onChangeText={setCidade} placeholder="Ex.: São Paulo - SP" />
              <Input
                label="CPF/CNPJ"
                value={documento}
                onChangeText={(v) => setDocumento(onlyDigits(v).slice(0, 14))}
                placeholder="Somente números"
                keyboardType="numeric"
              />
              <Input label="ENDEREÇO BASE" value={endereco} onChangeText={setEndereco} placeholder="Rua, número, bairro" />
              <Input
                label="CEP"
                value={cep}
                onChangeText={(v) => setCep(onlyDigits(v).slice(0, 8))}
                placeholder="Somente números"
                keyboardType="numeric"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button title="SALVAR ALTERAÇÕES" onPress={handleSaveProfile} loading={saving} style={styles.saveBtn} />
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.md,
    alignItems: 'center'
  },
  passportCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...themeShadows.medium
  },
  passportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  passportAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  passportAvatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white
  },
  passportMainInfo: {
    minWidth: 0,
    flex: 1
  },
  passportName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  passportEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  memberSince: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  memberSinceText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1
  },
  passportDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
    borderStyle: 'dashed'
  },
  passportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  passportStatItem: {
    flex: 1,
    alignItems: 'center'
  },
  passportStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary
  },
  passportStatLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 1
  },
  vLine: {
    width: 1,
    height: 30,
    backgroundColor: colors.border
  },
  typeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.black
  },
  section: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
    width: '100%'
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    paddingHorizontal: 4
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuTextContent: {
    flex: 1
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textCaption,
    marginTop: 2,
    fontWeight: '600'
  },
  logoutSection: {
    marginTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    width: '100%'
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1
  },
  logoutConfirmation: {
    width: '100%',
    gap: spacing.sm
  },
  logoutPrompt: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  versionText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textCaption,
    marginTop: spacing.xl,
    letterSpacing: 2
  },
  editSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%'
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  editTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.danger
  },
  form: {
    gap: spacing.xs
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm
  },
  saveBtn: {
    marginTop: spacing.md
  }
});
