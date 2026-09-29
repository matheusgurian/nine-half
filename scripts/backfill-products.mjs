/**
 * Backfill de campos de busca/filtro em produtos antigos.
 *
 * Uso (PowerShell):
 * $env:BACKFILL_EMAIL="usuario@dominio.com"
 * $env:BACKFILL_PASSWORD="senha"
 * $env:BACKFILL_CONFIRM="YES"
 * node .\scripts\backfill-products.mjs
 *
 * Requisitos:
 * - .env do projeto preenchido com EXPO_PUBLIC_FIREBASE_*
 * - usuário do BACKFILL_EMAIL deve ser dono dos produtos que serão atualizados
 * - não roda sem BACKFILL_CONFIRM=YES
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function buildKeywords(modelo, marca) {
  const tokens = new Set();
  const add = (value) => {
    if (!value) return;
    const parts = value.split(/\s+/).filter(Boolean);
    parts.forEach((part) => tokens.add(part));
    if (parts.length > 1) {
      for (let i = 0; i < parts.length - 1; i += 1) {
        tokens.add(`${parts[i]} ${parts[i + 1]}`);
      }
    }
    tokens.add(value);
  };
  add(normalize(modelo));
  add(normalize(marca));
  return Array.from(tokens);
}

function parsePrice(value) {
  const n = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
}

async function main() {
  if (process.env.BACKFILL_CONFIRM !== 'YES') {
    throw new Error('Defina BACKFILL_CONFIRM=YES para executar.');
  }

  const firebaseConfig = {
    apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID')
  };

  const email = getEnv('BACKFILL_EMAIL');
  const password = getEnv('BACKFILL_PASSWORD');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userId = cred.user.uid;
  console.log(`[backfill] autenticado como ${email} (${userId})`);

  const q = query(collection(db, 'products'), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  console.log(`[backfill] produtos encontrados: ${snap.size}`);

  let updated = 0;
  for (const item of snap.docs) {
    const p = item.data();
    const showcaseRef = doc(db, 'showcases', p.showcaseId);
    const showcaseSnap = await getDoc(showcaseRef);
    const showcaseVisible = showcaseSnap.exists() ? !!showcaseSnap.data()?.visivel : false;

    const payload = {
      modeloLower: normalize(p.modelo),
      marcaLower: normalize(p.marca),
      searchKeywords: buildKeywords(p.modelo, p.marca),
      precoNumber: parsePrice(p.preco),
      showcaseVisible,
      updatedAt: serverTimestamp()
    };

    await updateDoc(item.ref, payload);
    updated += 1;
    console.log(`[backfill] atualizado: ${item.id}`);
  }

  console.log(`[backfill] concluído. total atualizados: ${updated}`);
}

main().catch((err) => {
  console.error('[backfill] erro:', err.message);
  process.exit(1);
});

