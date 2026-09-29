import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { ROUTES } from '../routes/routeNames';
import DashboardScreen from '../../screens/DashboardScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import ShowcaseScreen from '../../screens/ShowcaseScreen';
import ProductFormScreen from '../../screens/ProductFormScreen';
import ProductDetailsScreen from '../../screens/ProductDetailsScreen';
import PublicProfileScreen from '../../screens/PublicProfileScreen';
import GlobalStockScreen from '../../screens/GlobalStockScreen';
import MyReservationsScreen from '../../screens/MyReservationsScreen';
import MyTransactionsScreen from '../../screens/MyTransactionsScreen';
import MyChatsScreen from '../../screens/MyChatsScreen';
import MyCashboxScreen from '../../screens/MyCashboxScreen';
import TransactionDetailsScreen from '../../screens/TransactionDetailsScreen';
import ChatRoomScreen from '../../screens/ChatRoomScreen/index';
import CheckoutScreen from '../../screens/CheckoutScreen';
import AdminDashboardScreen from '../../screens/Admin/AdminDashboardScreen';
import AdminUsersScreen from '../../screens/Admin/AdminUsersScreen';
import Loading from '../../components/ui/Loading';
import { colors } from '../../theme/colors';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

function PrivateNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Custom headers used in screens
      }}
    >
      <Stack.Screen name={ROUTES.DASHBOARD} component={DashboardScreen} />
      <Stack.Screen name={ROUTES.SHOWCASE} component={ShowcaseScreen} />
      <Stack.Screen name={ROUTES.GLOBAL_STOCK} component={GlobalStockScreen} />
      <Stack.Screen name={ROUTES.PRODUCT_FORM} component={ProductFormScreen} />
      <Stack.Screen name={ROUTES.PRODUCT_DETAILS} component={ProductDetailsScreen} />
      <Stack.Screen name={ROUTES.PUBLIC_PROFILE} component={PublicProfileScreen} />
      <Stack.Screen name={ROUTES.CHECKOUT} component={CheckoutScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={ROUTES.MY_RESERVATIONS} component={MyReservationsScreen} />
      <Stack.Screen name={ROUTES.MY_TRANSACTIONS} component={MyTransactionsScreen} />
      <Stack.Screen name={ROUTES.MY_CHATS} component={MyChatsScreen} />
      <Stack.Screen name={ROUTES.MY_CASHBOX} component={MyCashboxScreen} />
      <Stack.Screen name={ROUTES.TRANSACTION_DETAILS} component={TransactionDetailsScreen} />
      <Stack.Screen name={ROUTES.CHAT_ROOM} component={ChatRoomScreen} />
      <Stack.Screen name={ROUTES.ADMIN_DASHBOARD} component={AdminDashboardScreen} />
      <Stack.Screen name={ROUTES.ADMIN_USERS} component={AdminUsersScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <Loading text="Autenticando..." />;

  return (
    <NavigationContainer theme={MyTheme}>
      {user ? <PrivateNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
