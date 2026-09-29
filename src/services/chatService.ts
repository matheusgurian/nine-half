import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { TRANSACTION_STATUS } from '../constants/transactionStatus';
import { firestore } from './firebase/firestore';

const CHATS_COLLECTION = 'chats';
const TRANSACTIONS_COLLECTION = 'transactions';

export async function ensureChatForTransaction({
  transactionId,
  userId
}: {
  transactionId: string;
  userId: string;
}) {
  return runTransaction(firestore, async (transaction) => {
    const txRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);
    const txSnap = await transaction.get(txRef);

    if (!txSnap.exists()) {
      throw new Error('Transação não encontrada.');
    }

    const tx = txSnap.data() as any;
    const isParticipant = tx?.buyerId === userId || tx?.sellerId === userId;
    if (!isParticipant) {
      throw new Error('Você não tem permissão para abrir este chat.');
    }

    if (tx?.status !== TRANSACTION_STATUS.COMPLETED) {
      throw new Error('Chat disponível apenas para vendas concluídas.');
    }

    const chatRef = doc(firestore, CHATS_COLLECTION, transactionId);
    const chatSnap = await transaction.get(chatRef);
    if (!chatSnap.exists()) {
      transaction.set(chatRef, {
        id: transactionId,
        transactionId,
        buyerId: tx.buyerId,
        sellerId: tx.sellerId,
        participants: [tx.buyerId, tx.sellerId],
        lastMessage: '',
        lastMessageAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return {
      id: transactionId,
      transactionId,
      buyerId: tx.buyerId,
      sellerId: tx.sellerId
    };
  });
}

export async function sendChatMessage({
  chatId,
  senderId,
  text
}: {
  chatId: string;
  senderId: string;
  text: string;
}) {
  const body = String(text || '').trim();
  if (!body) throw new Error('Digite uma mensagem.');

  return runTransaction(firestore, async (transaction) => {
    const chatRef = doc(firestore, CHATS_COLLECTION, chatId);
    const chatSnap = await transaction.get(chatRef);

    if (!chatSnap.exists()) {
      throw new Error('Chat não encontrado.');
    }

    const chat = chatSnap.data() as any;
    const isParticipant = chat?.buyerId === senderId || chat?.sellerId === senderId;
    if (!isParticipant) {
      throw new Error('Você não tem permissão para enviar mensagens neste chat.');
    }
    const recipientId = chat?.buyerId === senderId ? chat?.sellerId : chat?.buyerId;

    const msgRef = doc(collection(firestore, CHATS_COLLECTION, chatId, 'messages'));
    transaction.set(msgRef, {
      id: msgRef.id,
      chatId,
      senderId,
      text: body,
      createdAt: serverTimestamp()
    });

    transaction.update(chatRef, {
      lastMessage: body,
      lastMessageAt: serverTimestamp(),
      unreadBy: recipientId ? arrayUnion(recipientId) : [],
      updatedAt: serverTimestamp()
    });
  });
}

export async function markChatAsRead({ chatId, userId }: { chatId: string; userId: string }) {
  const chatRef = doc(firestore, CHATS_COLLECTION, chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const chat = snap.data() as any;
  const isParticipant = chat?.buyerId === userId || chat?.sellerId === userId;
  if (!isParticipant) return;

  await runTransaction(firestore, async (transaction) => {
    const fresh = await transaction.get(chatRef);
    if (!fresh.exists()) return;
    transaction.update(chatRef, {
      unreadBy: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
  });
}

export function subscribeChatMessages(chatId: string, onChange: (messages: any[]) => void) {
  const q = query(
    collection(firestore, CHATS_COLLECTION, chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(500)
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(items);
  });
}

export async function getChatById(chatId: string) {
  const chatRef = doc(firestore, CHATS_COLLECTION, chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getMyChats(userId: string) {
  const qBuyer = query(collection(firestore, CHATS_COLLECTION), where('buyerId', '==', userId));
  const qSeller = query(collection(firestore, CHATS_COLLECTION), where('sellerId', '==', userId));
  const [buyerSnap, sellerSnap] = await Promise.all([getDocs(qBuyer), getDocs(qSeller)]);

  const all = [...buyerSnap.docs, ...sellerSnap.docs].map((d) => ({ id: d.id, ...d.data() }));
  const unique = Array.from(new Map(all.map((item: any) => [item.id, item])).values());
  unique.sort((a: any, b: any) => (b?.updatedAt?.seconds || 0) - (a?.updatedAt?.seconds || 0));
  return unique;
}

export function subscribeUnreadChatsCount(userId: string, onChange: (count: number) => void) {
  const q = query(collection(firestore, CHATS_COLLECTION), where('unreadBy', 'array-contains', userId));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.size),
    () => onChange(0)
  );
}
