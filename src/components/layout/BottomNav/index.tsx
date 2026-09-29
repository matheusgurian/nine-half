import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../../../app/routes/routeNames';
import { colors } from '../../../theme/colors';

const items = [
  { route: ROUTES.DASHBOARD, label: 'Início', icon: 'grid-outline' },
  { route: ROUTES.GLOBAL_STOCK, label: 'Explorar', icon: 'search-outline' },
  { route: ROUTES.SHOWCASE, label: 'Vitrine', icon: 'storefront-outline' },
  { route: ROUTES.MY_CHATS, label: 'Conversas', icon: 'chatbubbles-outline' },
  { route: ROUTES.PROFILE, label: 'Perfil', icon: 'person-outline' }
];
const mainRoutes: string[] = [...items.map(item => item.route), ROUTES.MY_RESERVATIONS, ROUTES.MY_TRANSACTIONS, ROUTES.MY_CASHBOX, ROUTES.ADMIN_DASHBOARD, ROUTES.ADMIN_USERS];
export default function BottomNav() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (!mainRoutes.includes(route.name) || keyboardOpen) return null;
  return <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}><View style={styles.nav}>
    {items.map(item => {
      const selected = route.name === item.route;
      return <Pressable key={item.route} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }} onPress={() => { if (!selected) navigation.navigate(item.route); }} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <View style={[styles.icon, selected && styles.activeIcon]}><Ionicons name={item.icon as any} size={20} color={selected ? colors.primary : colors.textCaption} /></View>
        <Text style={[styles.label, selected && styles.activeLabel]}>{item.label}</Text>
      </Pressable>;
    })}
  </View></View>;
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  nav: { width: '100%', maxWidth: 960, alignSelf: 'center', flexDirection: 'row', paddingHorizontal: 8 },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  icon: { width: 42, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: 'rgba(249,115,22,0.12)' },
  label: { fontSize: 10, color: colors.textCaption, fontWeight: '600' },
  activeLabel: { color: colors.primary, fontWeight: '800' },
  pressed: { opacity: 0.65 }
});
