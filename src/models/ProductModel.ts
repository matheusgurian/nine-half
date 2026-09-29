import { PRODUCT_ORIGIN } from '../constants/productOrigin';
import { PRODUCT_STATUS } from '../constants/productStatus';
import { nowISODate } from '../utils/date';

export type ProductModel = {
  id: string;
  showcaseId: string;
  ownerId: string;
  modelo: string;
  marca: string;
  cor: string;
  numeracao: string;
  preco: string;
  precoNumber: number;
  localizacao: string;
  origem: string;
  imagemUrl: string;
  imagePath: string;
  imagens: string[];
  imagePaths: string[];
  status: string;
  // Novos campos de controle
  tempoReserva: number; // Em horas
  reservedBy: string | null;
  reservedAt: any;
  reservationId: string | null;
  soldAt: any;
  // Busca
  modeloLower: string;
  marcaLower: string;
  searchKeywords: string[];
  showcaseVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export function createProductModel(data: Partial<ProductModel> = {}): ProductModel {
  const now = nowISODate();

  return {
    id: data.id || '',
    showcaseId: data.showcaseId || '',
    ownerId: data.ownerId || '',
    modelo: data.modelo || '',
    marca: data.marca || '',
    cor: data.cor || '',
    numeracao: data.numeracao || '',
    preco: data.preco || '',
    precoNumber: data.precoNumber || 0,
    localizacao: data.localizacao || '',
    origem: data.origem || PRODUCT_ORIGIN.OWN,
    imagemUrl: data.imagemUrl || '',
    imagePath: data.imagePath || '',
    imagens: data.imagens || (data.imagemUrl ? [data.imagemUrl] : []),
    imagePaths: data.imagePaths || (data.imagePath ? [data.imagePath] : []),
    status: data.status || PRODUCT_STATUS.AVAILABLE,
    tempoReserva: data.tempoReserva || 24, // Padrão 24h
    reservedBy: data.reservedBy || null,
    reservedAt: data.reservedAt || null,
    reservationId: data.reservationId || null,
    soldAt: data.soldAt || null,
    modeloLower: data.modeloLower || '',
    marcaLower: data.marcaLower || '',
    searchKeywords: data.searchKeywords || [],
    showcaseVisible: data.showcaseVisible || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}
