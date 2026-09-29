import { useCallback, useRef, useState } from 'react';
import {
  ensureChatForTransaction,
  getChatById,
  getMyChats,
  markChatAsRead,
  sendChatMessage,
  subscribeUnreadChatsCount,
  subscribeChatMessages
} from '../services/chatService';
import { getUserById } from '../services/userService';
import { getErrorMessage } from '../utils/errors';

export function useChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const unsubRef = useRef<null | (() => void)>(null);

  const loadMyChats = useCallback(async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyChats(userId);
      const peerIds = Array.from(
        new Set(
          data
            .map((chat: any) => (chat?.buyerId === userId ? chat?.sellerId : chat?.buyerId))
            .filter(Boolean)
        )
      );

      const profiles = await Promise.all(peerIds.map((id) => getUserById(String(id))));
      const profileMap = new Map<string, any>();
      profiles.forEach((profile) => {
        if (profile?.id) profileMap.set(profile.id, profile);
      });

      const enriched = data.map((chat: any) => {
        const peerId = chat?.buyerId === userId ? chat?.sellerId : chat?.buyerId;
        const peer = peerId ? profileMap.get(peerId) : null;
        const myRole = chat?.buyerId === userId ? 'comprador' : 'vendedor';
        const peerRole = chat?.buyerId === userId ? 'vendedor' : 'comprador';
        return {
          ...chat,
          peerId: peerId || null,
          peerName: peer?.nome || 'Usuário',
          myRole,
          peerRole
        };
      });

      setChats(enriched);
      return enriched;
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao carregar chats.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openChatByTransaction = useCallback(
    async ({ transactionId, userId }: { transactionId: string; userId: string }) => {
      setLoading(true);
      setError('');
      try {
        const room = await ensureChatForTransaction({ transactionId, userId });
        const fullRoom = (await getChatById(room.id)) || room;
        setChat(fullRoom);
        return fullRoom;
      } catch (err) {
        setError(getErrorMessage(err) || 'Erro ao abrir chat.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const listenMessages = useCallback((chatId: string) => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    unsubRef.current = subscribeChatMessages(chatId, setMessages);
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(async ({ chatId, senderId, text }: { chatId: string; senderId: string; text: string }) => {
    setError('');
    try {
      await sendChatMessage({ chatId, senderId, text });
    } catch (err) {
      setError(getErrorMessage(err) || 'Erro ao enviar mensagem.');
      throw err;
    }
  }, []);

  const clearMessagesListener = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  const readChat = useCallback(async ({ chatId, userId }: { chatId: string; userId: string }) => {
    try {
      await markChatAsRead({ chatId, userId });
    } catch {
      // no-op: leitura de chat nao deve quebrar UX
    }
  }, []);

  const listenUnreadCount = useCallback((userId: string) => {
    return subscribeUnreadChatsCount(userId, setUnreadCount);
  }, []);

  return {
    chats,
    chat,
    messages,
    unreadCount,
    loading,
    error,
    loadMyChats,
    openChatByTransaction,
    listenMessages,
    listenUnreadCount,
    readChat,
    clearMessagesListener,
    sendMessage
  };
}
