import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Loading from '../../components/ui/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { getUserById } from '../../services/userService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ChatRoomScreen({ route }: any) {
  const transactionId = route.params?.transactionId;
  const { user } = useAuth();
  const { chat, messages, loading, error, openChatByTransaction, listenMessages, clearMessagesListener, sendMessage, readChat } = useChat();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [peerName, setPeerName] = useState('');
  const myName = user?.nome || 'Você';

  useEffect(() => {
    if (!transactionId || !user?.uid) return;
    openChatByTransaction({ transactionId, userId: user.uid }).catch(() => undefined);
  }, [transactionId, user?.uid, openChatByTransaction]);

  useEffect(() => {
    if (!chat?.id) return;
    const unsubscribe = listenMessages(chat.id);
    return () => {
      unsubscribe?.();
    };
  }, [chat?.id, listenMessages]);

  useEffect(() => {
    if (!chat?.id || !user?.uid) return;
    readChat({ chatId: chat.id, userId: user.uid });
  }, [chat?.id, user?.uid, messages.length, readChat]);

  useEffect(() => {
    let mounted = true;
    const loadPeer = async () => {
      if (!chat || !user?.uid) return;
      const peerId = chat.buyerId === user.uid ? chat.sellerId : chat.buyerId;
      if (!peerId) return;
      const profile = await getUserById(peerId);
      if (!mounted) return;
      setPeerName(profile?.nome || '');
    };
    loadPeer();
    return () => {
      mounted = false;
    };
  }, [chat, user?.uid]);

  useEffect(() => {
    return () => {
      clearMessagesListener();
    };
  }, [clearMessagesListener]);

  const canSend = useMemo(() => String(text || '').trim().length > 0 && !!chat?.id && !sending, [text, chat?.id, sending]);

  const getSenderName = useCallback(
    (senderId: string) => {
      if (!chat || !senderId) return 'Usuário';
      if (String(senderId) === String(user?.uid)) return myName;
      if (String(senderId) === String(chat?.buyerId) || String(senderId) === String(chat?.sellerId)) {
        return peerName || 'Contato';
      }
      return 'Usuário';
    },
    [chat, user?.uid, myName, peerName]
  );

  const handleSend = useCallback(async () => {
    if (!chat?.id || !user?.uid) return;
    const body = String(text || '').trim();
    if (!body) return;
    setSending(true);
    try {
      await sendMessage({ chatId: chat.id, senderId: user.uid, text: body });
      setText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err: any) {
      Alert.alert('Erro ao enviar mensagem', err?.message || 'Não foi possível enviar a mensagem agora.');
    } finally {
      setSending(false);
    }
  }, [chat?.id, user?.uid, text, sendMessage]);

  if (loading && !chat) {
    return <Loading text="Abrindo chat..." />;
  }

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <Header
        title="Chat da compra"
        subtitle={peerName ? `Conversando com ${peerName}` : 'Conversa entre comprador e vendedor.'}
        showBack
      />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.flex}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const mine = String(item?.senderId || '') === String(user?.uid || '');
            const senderName = getSenderName(String(item?.senderId || ''));
            return (
              <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowOther]}>
                <Text style={[styles.senderName, mine ? styles.senderNameMine : styles.senderNameOther]}>{senderName}</Text>
                <View style={[styles.msgBubble, mine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
                  <Text style={[styles.msgText, mine ? styles.msgTextMine : styles.msgTextOther]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Sem mensagens ainda</Text>
              <Text style={styles.emptySubtitle}>Envie a primeira mensagem para iniciar a conversa.</Text>
            </View>
          }
        />

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textCaption}
            style={styles.input}
            multiline
            maxLength={800}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Enviar mensagem" style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]} onPress={handleSend} disabled={!canSend}>
            <Ionicons name="send" size={18} color={canSend ? colors.black : colors.textCaption} />
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
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
  listContent: {
    paddingBottom: spacing.md,
    paddingTop: spacing.sm
  },
  msgRow: {
    width: '100%',
    marginBottom: spacing.sm
  },
  msgRowMine: {
    alignItems: 'flex-end'
  },
  msgRowOther: {
    alignItems: 'flex-start'
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    opacity: 0.9
  },
  senderNameMine: {
    color: colors.primary,
    textAlign: 'right'
  },
  senderNameOther: {
    color: colors.textSecondary,
    textAlign: 'left'
  },
  msgBubbleMine: {
    borderBottomRightRadius: 4,
    backgroundColor: '#343B2A'
  },
  msgBubbleOther: {
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  msgText: {
    lineHeight: 22,
    fontSize: 14
  },
  msgTextMine: {
    color: colors.white,
    fontWeight: '500'
  },
  msgTextOther: {
    color: colors.white
  },
  emptyWrap: {
    marginTop: spacing.xl,
    alignItems: 'center'
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800'
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12
  },
  composer: {
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  }
});
