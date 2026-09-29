import { useCallback, useState } from 'react';
import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  getProductById,
  getPublicAvailableProducts,
  getProductsByOwner,
  getProductsByShowcase,
  updateProduct as updateProductService
} from '../services/productService';
import { getErrorMessage } from '../utils/errors';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createProduct = useCallback(async (productData) => {
    setLoading(true);
    setError('');
    try {
      const created = await createProductService(productData);
      setProducts((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError('Erro ao salvar produto.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyProducts = useCallback(async (ownerId) => {
    setLoading(true);
    setError('');
    try {
      const data = await getProductsByOwner(ownerId);
      setProducts(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar produtos.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProductsByShowcase = useCallback(async (showcaseId, ownerId) => {
    setLoading(true);
    setError('');
    try {
      const data = await getProductsByShowcase(showcaseId, ownerId);
      setProducts(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar produtos da vitrine.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProductById = useCallback(async (productId) => {
    setLoading(true);
    setError('');
    try {
      const data = await getProductById(productId);
      setSelectedProduct(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar produto.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGlobalAvailableProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicAvailableProducts();
      setProducts(data);
      return data;
    } catch (err) {
      setError('Erro ao carregar estoque global.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId, data) => {
    setLoading(true);
    setError('');
    try {
      await updateProductService(productId, data);
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...data } : p)));
      setSelectedProduct((prev) => (prev?.id === productId ? { ...prev, ...data } : prev));
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    setLoading(true);
    setError('');
    try {
      await deleteProductService(productId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      setSelectedProduct((prev) => (prev?.id === productId ? null : prev));
    } catch (err) {
      setError('Você não tem permissão para editar este produto.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    selectedProduct,
    loading,
    error,
    createProduct,
    loadMyProducts,
    loadProductsByShowcase,
    loadProductById,
    loadGlobalAvailableProducts,
    updateProduct,
    deleteProduct
  };
}
