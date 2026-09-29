import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import EmptyState from '../../components/ui/EmptyState';
import Loading from '../../components/ui/Loading';
import { ROUTES } from '../../app/routes/routeNames';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

function formatLastMessageTime(ts: any) {
  const seconds = ts?.seconds;
  if (!seconds) return '';
  const date = new Date(seconds * 1000);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function MyChatsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { chats, loading, error, loadMyChats } = useChat();

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      loadMyChats(user.uid);
    }, [user?.uid, loadMyChats])
  );

  const openChat = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(ROUTES.CHAT_ROOM, { transactionId: item.transactionId || item.id });
  };

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <Header title="Mensagens" subtitle="Converse com comprador e vendedor." showBack />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && chats.length === 0 ? (
        <Loading text="Carregando conversas..." />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const hasUnread = Array.isArray(item?.unreadBy) && item.unreadBy.includes(user?.uid);
            const lastTime = formatLastMessageTime(item?.lastMessageAt);
            return (
              <Pressable style={styles.card} onPress={() => openChat(item)}>
                <View style={styles.avatar}>
                  <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.body}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.peerName || 'Usuário'}
                    </Text>
                    {lastTime ? <Text style={styles.time}>{lastTime}</Text> : null}
                  </View>
                  <Text style={styles.role} numberOfLines={1}>
                    {item.peerRole === 'vendedor' ? 'Vendedor' : 'Comprador'}
                  </Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage || 'Sem mensagens ainda'}
                  </Text>
                </View>
                {hasUnread ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>Nova</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textCaption} />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Nenhuma conversa"
              description="Quando uma compra for concluída, o chat aparecerá aqui."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)'
  },
  body: {
    flex: 1,
    gap: 2
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm
  },
  name: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '800'
  },
  role: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700'
  },
  preview: {
    color: colors.textSecondary,
    fontSize: 12
  },
  time: {
    color: colors.textCaption,
    fontSize: 12,
    fontWeight: '600'
  },
  unreadBadge: {
    backgroundColor: colors.danger,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800'
  }
});
