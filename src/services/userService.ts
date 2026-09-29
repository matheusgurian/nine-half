import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createUserModel, createUserPrivateModel } from '../models/UserModel';
import { USER_TYPES } from '../constants/userTypes';
import { firestore } from './firebase/firestore';

const USERS_COLLECTION = 'users';
const USERS_PRIVATE_COLLECTION = 'users_private';

export async function createUserProfile(userData: any) {
  const publicUser = createUserModel(userData);
  const privateUser = createUserPrivateModel({
    id: publicUser.id,
    documento: userData?.documento || '',
    endereco: userData?.endereco || '',
    cep: userData?.cep || '',
    telefone: userData?.telefone || ''
  });

  const userRef = doc(firestore, USERS_COLLECTION, publicUser.id);
  const userPrivateRef = doc(firestore, USERS_PRIVATE_COLLECTION, privateUser.id);

  await Promise.all([
    setDoc(userRef, {
      ...publicUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }),
    setDoc(userPrivateRef, {
      ...privateUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  ]);

  return publicUser;
}

export async function ensureUserProfiles({
  uid,
  email,
  nome
}: {
  uid: string;
  email?: string;
  nome?: string;
}) {
  const userRef = doc(firestore, USERS_COLLECTION, uid);
  const userPrivateRef = doc(firestore, USERS_PRIVATE_COLLECTION, uid);

  const [publicSnap, privateSnap] = await Promise.all([getDoc(userRef), getDoc(userPrivateRef)]);

  const createTasks: Promise<any>[] = [];

  if (!publicSnap.exists()) {
    const fallbackName = String(nome || '').trim() || String(email || '').split('@')[0] || 'Usuário';
    createTasks.push(
      setDoc(
        userRef,
        {
          id: uid,
          nome: fallbackName,
          email: email || '',
          tipo: USER_TYPES.COMMON,
          bio: '',
          whatsapp: '',
          cidade: '',
          verificado: false,
          ativo: true,
          blockedReason: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    );
  }

  if (!privateSnap.exists()) {
    createTasks.push(
      setDoc(
        userPrivateRef,
        {
          id: uid,
          documento: '',
          endereco: '',
          cep: '',
          telefone: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    );
  }

  if (createTasks.length > 0) {
    await Promise.all(createTasks);
  }
}

export async function getUserById(userId: string) {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data()
  } as any;
}

export async function getMyPrivateProfile(userId: string) {
  const userPrivateRef = doc(firestore, USERS_PRIVATE_COLLECTION, userId);
  const snapshot = await getDoc(userPrivateRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as any;
}

export async function updateUserProfile(userId: string, data: any) {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  const payload: Record<string, any> = { ...data };

  delete payload.id;
  delete payload.email;
  delete payload.createdAt;
  delete payload.tipo;
  delete payload.documento;
  delete payload.telefone;
  delete payload.endereco;
  delete payload.cep;

  await updateDoc(userRef, {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export async function updateMyPrivateProfile(userId: string, data: any) {
  const userPrivateRef = doc(firestore, USERS_PRIVATE_COLLECTION, userId);
  const payload: Record<string, any> = { ...data };

  delete payload.id;
  delete payload.createdAt;
  delete payload.email;
  delete payload.nome;
  delete payload.tipo;
  delete payload.bio;
  delete payload.whatsapp;
  delete payload.cidade;
  delete payload.verificado;

  await updateDoc(userPrivateRef, {
    ...payload,
    updatedAt: serverTimestamp()
  });
}
