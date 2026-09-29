import React from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { ROUTES } from '../../app/routes/routeNames';
import { USER_TYPES } from '../../constants/userTypes';
import { colors } from '../../theme/colors';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { unreadCount, listenUnreadCount } = useChat();
  const isAdmin = user?.tipo === USER_TYPES.ADMIN;
  const lastBackPressAt = React.useRef(0);

  const firstName = user?.nome?.split(' ')[0] || 'Usuário';

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const now = Date.now();
        if (now - lastBackPressAt.current < 2000) {
          return false;
        }

        lastBackPressAt.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Pressione voltar novamente para sair', ToastAndroid.SHORT);
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  React.useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenUnreadCount(user.uid);
    return () => unsubscribe?.();
  }, [user?.uid, listenUnreadCount]);

  return (
    <ScreenContainer scroll>
      <View style={styles.topbar}><View style={styles.brand}><Text style={styles.mark}>9½</Text><Text style={styles.wordmark}>NINE HALF</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={() => navigation.navigate(ROUTES.PROFILE)} style={styles.avatar}><Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text></Pressable></View>
      <View style={styles.hero}>
        <View style={styles.heroTop}><Text style={styles.eyebrow}>PAINEL DE GESTÃO</Text><Ionicons name="arrow-forward" style={{ transform: [{ rotate: '-45deg' }] }} size={25} color={colors.primary} /></View>
        <Text accessibilityRole="header" style={styles.heroTitle}>Visão geral</Text>
        <Text style={styles.heroDescription}>Acesse seu estoque, acompanhe reservas e gerencie suas vendas.</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.GLOBAL_STOCK)} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}><Text style={styles.exploreText}>Consultar estoque global</Text><Ionicons name="arrow-forward" size={20} color={colors.background} /></Pressable>
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Estoque e anúncios</Text><Text style={styles.sectionNumber}>01 / ESTOQUE</Text></View>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.SHOWCASE)} style={({ pressed }) => [styles.storeCard, pressed && styles.pressed]}>
        <View style={styles.storeIcon}><Ionicons name="storefront-outline" size={30} color={colors.primary} /></View><View style={styles.cardBody}><Text style={styles.cardKicker}>GESTÃO DE ESTOQUE</Text><Text style={styles.cardTitle}>Minha vitrine</Text><Text style={styles.cardDescription}>Cadastre produtos e gerencie seus anúncios.</Text></View><Ionicons name="arrow-forward" size={23} color={colors.primary} />
      </Pressable>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Operações</Text><Text style={styles.sectionNumber}>02 / GESTÃO</Text></View>
      <View style={styles.grid}>
        {[{ title: 'Reservas', description: 'Acompanhe suas negociações', icon: 'bookmark-outline', route: ROUTES.MY_RESERVATIONS }, { title: 'Histórico', description: 'Suas compras e vendas', icon: 'receipt-outline', route: ROUTES.MY_TRANSACTIONS }, { title: 'Meu caixa', description: 'Resumo das vendas concluídas', icon: 'wallet-outline', route: ROUTES.MY_CASHBOX }, { title: 'Conversas', description: unreadCount ? unreadCount + ' conversa(s) com novidades' : 'Fale com compradores e vendedores', icon: 'chatbubbles-outline', route: ROUTES.MY_CHATS }].map(item => <Pressable key={item.route} accessibilityRole="button" onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}><View style={styles.gridCardTop}><Ionicons name={item.icon as any} size={23} color={colors.primary} /><Ionicons name="arrow-forward" style={{ transform: [{ rotate: '-45deg' }] }} size={17} color={colors.textCaption} /></View><Text style={styles.gridTitle}>{item.title}</Text><Text style={styles.gridDescription}>{item.description}</Text></Pressable>)}
      </View>
      {isAdmin && <Pressable accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.ADMIN_DASHBOARD)} style={styles.admin}><Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} /><Text style={styles.adminText}>Painel administrativo</Text><Ionicons name="chevron-forward" size={18} color={colors.textCaption} /></Pressable>}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { color: colors.primary, fontSize: 29, fontWeight: '900', letterSpacing: -2 },
  wordmark: { color: colors.white, fontSize: 15, fontWeight: '900', letterSpacing: 1.4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.6, fontWeight: '800', flex: 1 },
  heroTitle: { color: colors.textPrimary, fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8, marginTop: 20 },
  heroDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, maxWidth: 410, marginTop: 14 },
  exploreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, backgroundColor: colors.primary, alignSelf: 'flex-start', borderRadius: 12, minHeight: 52, paddingHorizontal: 18, marginTop: 24 },
  exploreText: { fontSize: 14, fontWeight: '700', color: colors.background },
  sectionHeading: { marginTop: 30, marginBottom: 14, gap: 6 },
  sectionTitle: { color: colors.white, fontSize: 21, fontWeight: '700', letterSpacing: -0.5 },
  sectionNumber: { color: colors.textCaption, fontSize: 10, letterSpacing: 1.3, fontWeight: '600' },
  storeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#58402D', backgroundColor: '#241D17', borderRadius: 18, padding: 20 },
  storeIcon: { width: 46, alignItems: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  cardKicker: { color: colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: 6 },
  cardDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { flexGrow: 1, flexBasis: '45%', minWidth: 130, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  gridCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  gridTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  gridDescription: { fontSize: 12, lineHeight: 19, color: colors.textSecondary, marginTop: 8 },
  admin: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 24 },
  adminText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  pressed: { opacity: 0.8 }
});
