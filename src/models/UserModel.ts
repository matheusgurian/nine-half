import { USER_TYPES } from '../constants/userTypes';
import { nowISODate } from '../utils/date';

export type UserModel = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  // Campos publicos
  bio?: string;
  whatsapp?: string;
  cidade?: string;
  verificado?: boolean;
  ativo?: boolean;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserPrivateModel = {
  id: string;
  // Campos sensiveis (somente dono)
  documento?: string; // CPF ou CNPJ
  endereco?: string;
  cep?: string;
  telefone?: string;
  createdAt: string;
  updatedAt: string;
};

export function createUserModel(data: Partial<UserModel> = {}): UserModel {
  const now = nowISODate();

  return {
    id: data.id || '',
    nome: data.nome || '',
    email: data.email || '',
    tipo: data.tipo || USER_TYPES.COMMON,
    bio: data.bio || '',
    whatsapp: data.whatsapp || '',
    cidade: data.cidade || '',
    verificado: data.verificado || false,
    ativo: data.ativo !== false,
    blockedReason: data.blockedReason || '',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

export function createUserPrivateModel(data: Partial<UserPrivateModel> = {}): UserPrivateModel {
  const now = nowISODate();

  return {
    id: data.id || '',
    documento: data.documento || '',
    endereco: data.endereco || '',
    cep: data.cep || '',
    telefone: data.telefone || '',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}
