import { nowISODate } from '../utils/date';

export type ShowcaseModel = {
  id: string;
  userId: string;
  nome: string;
  visivel: boolean;
  createdAt: string;
  updatedAt: string;
};

export function createShowcaseModel(data: Partial<ShowcaseModel> = {}): ShowcaseModel {
  const now = nowISODate();

  return {
    id: data.id || '',
    userId: data.userId || '',
    nome: data.nome || 'Minha vitrine',
    visivel: typeof data.visivel === 'boolean' ? data.visivel : false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}
