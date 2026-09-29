import { getFirestore } from 'firebase/firestore';
import { firestore } from './config';

// Este arquivo se torna obsoleto, pois firestore agora é exportado de config.ts
// Mantido para não quebrar outras importações, mas idealmente seria removido.
export { firestore };
