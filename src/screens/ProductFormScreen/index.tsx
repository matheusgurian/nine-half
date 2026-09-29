import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/layout/Header';
import ScreenContainer from '../../components/layout/ScreenContainer';
import Button from '../../components/ui/Button';
import ImagePickerButton from '../../components/ui/ImagePickerButton';
import Input from '../../components/ui/Input';
import { PRODUCT_ORIGIN } from '../../constants/productOrigin';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { uploadProductImage } from '../../services/storageService';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { themeShadows } from '../../theme/themeShadows';
import { typography } from '../../theme/typography';
import { validatePrice, validateRequired, validateShoeSize } from '../../utils/validators';

const MAX_IMAGES = 5;
const EXPIRY_OPTIONS = [
  { label: '1h', value: 1 }, { label: '2h', value: 2 }, { label: '6h', value: 6 },
  { label: '12h', value: 12 }, { label: '24h', value: 24 }, { label: '48h', value: 48 }
];

export default function ProductFormScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { createProduct, updateProduct, deleteProduct, loadProductById, selectedProduct, loading } = useProducts();

  const mode = route.params?.mode || 'create';
  const showcaseId = route.params?.showcaseId || '';
  const productId = route.params?.productId || '';

  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [cor, setCor] = useState('');
  const [numeracao, setNumeracao] = useState('');
  const [preco, setPreco] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [origem, setOrigem] = useState(PRODUCT_ORIGIN.OWN);
  const [tempoReserva, setTempoReserva] = useState(24);
  const [descricao, setDescricao] = useState('');

  const [remoteImages, setRemoteImages] = useState<string[]>([]);
  const [remotePaths, setRemotePaths] = useState<string[]>([]);
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalImages = remoteImages.length + localImages.length;
  const imageBoxSize = (Math.min(width, 720) - (spacing.md * 2) - (spacing.sm * 2)) / 3;

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;
    loadProductById(productId);
  }, [mode, productId]);

  useEffect(() => {
    if (!selectedProduct || mode !== 'edit') return;
    setModelo(selectedProduct.modelo || '');
    setMarca(selectedProduct.marca || '');
    setCor(selectedProduct.cor || '');
    setNumeracao(String(selectedProduct.numeracao || ''));
    setPreco(String(selectedProduct.preco || ''));
    setLocalizacao(selectedProduct.localizacao || '');
    setOrigem(selectedProduct.origem || PRODUCT_ORIGIN.OWN);
    setTempoReserva(selectedProduct.tempoReserva || 24);
    setDescricao(selectedProduct.descricao || '');
    const existingImages = Array.isArray(selectedProduct.imagens)
      ? selectedProduct.imagens
      : (selectedProduct.imagemUrl ? [selectedProduct.imagemUrl] : []);
    const existingPaths = Array.isArray(selectedProduct.imagePaths)
      ? selectedProduct.imagePaths
      : (selectedProduct.imagePath ? [selectedProduct.imagePath] : []);
    setRemoteImages(existingImages.slice(0, MAX_IMAGES));
    setRemotePaths(existingPaths.slice(0, MAX_IMAGES));
  }, [selectedProduct, mode]);

  async function handlePickImage() {
    if (totalImages >= MAX_IMAGES) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFormError(`Limite máximo de ${MAX_IMAGES} imagens atingido.`);
      return;
    }

    setImageLoading(true);
    setFormError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria para selecionar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalImages((prev) => [...prev, compressed.uri].slice(0, MAX_IMAGES));
    } catch (_) {
      setFormError('Erro ao carregar imagem.');
    } finally {
      setImageLoading(false);
    }
  }

  function removeRemoteImage(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemoteImages((prev) => prev.filter((_, i) => i !== index));
    setRemotePaths((prev) => prev.filter((_, i) => i !== index));
  }

  function removeLocalImage(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDelete() {
    if (!productId) return;
    
    Alert.alert(
      'Excluir Produto',
      'Tem certeza que deseja remover este par do seu estoque? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'EXCLUIR', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.pop(2);
            } catch (err: any) {
              setFormError(err?.message || 'Erro ao excluir produto.');
            }
          }
        }
      ]
    );
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!user?.uid) {
      setFormError('Sessão expirada. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    if (
      !validateRequired(modelo) ||
      !validateRequired(marca) ||
      !validateRequired(preco) ||
      !validateRequired(numeracao) ||
      !validateRequired(localizacao) ||
      !validateRequired(origem)
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Preencha todos os campos obrigatórios.');
      setSubmitting(false);
      return;
    }
    if (!validateShoeSize(numeracao)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Numeração inválida. Use um valor entre 10 e 60.');
      setSubmitting(false);
      return;
    }
    if (!validatePrice(preco)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError('Preço inválido. Informe um valor maior que zero.');
      setSubmitting(false);
      return;
    }
    if (mode === 'create' && !showcaseId) {
      setFormError('Erro de sistema: Vitrine não encontrada.');
      setSubmitting(false);
      return;
    }

    try {
      const baseData = {
        modelo: modelo.trim(),
        marca: marca.trim(),
        cor: cor.trim(),
        numeracao: numeracao.trim(),
        preco: preco.trim(),
        localizacao: localizacao.trim(),
        origem: origem.trim(),
        tempoReserva: Number(tempoReserva),
        descricao: descricao.trim()
      };

      let currentId = productId;
      if (mode === 'edit') {
        await updateProduct(productId, baseData);
      } else {
        const created = await createProduct({
          ...baseData,
          showcaseId,
          ownerId: user.uid,
          imagens: [],
          imagePaths: [],
          imagemUrl: '',
          imagePath: ''
        });
        currentId = created.id;
      }

      const uploadedUrls: string[] = [];
      const uploadedPaths: string[] = [];
      for (let i = 0; i < localImages.length; i += 1) {
        if (remoteImages.length + uploadedUrls.length >= MAX_IMAGES) break;
        const upload = await uploadProductImage({
          userId: user.uid,
          productId: `${currentId}-${Date.now()}-${i}`,
          imageUri: localImages[i]
        });
        uploadedUrls.push(upload.imageUrl);
        uploadedPaths.push(upload.imagePath);
      }

      const finalImages = [...remoteImages, ...uploadedUrls].slice(0, MAX_IMAGES);
      const finalPaths = [...remotePaths, ...uploadedPaths].slice(0, MAX_IMAGES);
      await updateProduct(currentId, {
        imagens: finalImages,
        imagePaths: finalPaths,
        imagemUrl: finalImages[0] || '',
        imagePath: finalPaths[0] || ''
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(err?.message || 'Erro ao salvar informações.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenContainer scroll maxContentWidth={720} backgroundColor={colors.background}>
        <Header title={mode === 'edit' ? 'Editar Par' : 'Novo Par'} showBack />

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>GALERIA ({totalImages}/{MAX_IMAGES})</Text>
          
          <View style={styles.imageGrid}>
            {remoteImages.map((uri, index) => (
              <View key={`remote-${index}`} style={[styles.imageBox, { width: imageBoxSize, height: imageBoxSize }]}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <Pressable style={styles.removeBtn} onPress={() => removeRemoteImage(index)}>
                  <Ionicons name="close" size={16} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {localImages.map((uri, index) => (
              <View key={`local-${index}`} style={[styles.imageBox, { width: imageBoxSize, height: imageBoxSize }]}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <Pressable style={styles.removeBtn} onPress={() => removeLocalImage(index)}>
                  <Ionicons name="close" size={16} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {totalImages < MAX_IMAGES && (
              <Pressable 
                style={[styles.addImageBox, { width: imageBoxSize, height: imageBoxSize }]} 
                onPress={handlePickImage} 
                disabled={imageLoading}
              >
                <Ionicons name="add" size={32} color={colors.textCaption} />
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMAÇÕES BÁSICAS</Text>
            <Input label="SNEAKER / MODELO *" value={modelo} onChangeText={setModelo} placeholder="Ex.: Jordan 1 High Travis Scott" />
            <Input label="MARCA *" value={marca} onChangeText={setMarca} placeholder="Ex.: Nike" />
            <Input label="COR" value={cor} onChangeText={setCor} placeholder="Ex.: Preto e vermelho" />
            
            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="TAMANHO *"
                  value={numeracao}
                  onChangeText={(v) => setNumeracao(v.replace(/[^\d.,]/g, '').slice(0, 5))}
                  keyboardType="numeric"
                  placeholder="Ex.: 42"
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="PREÇO (R$) *"
                  value={preco}
                  onChangeText={(v) => setPreco(v.replace(/[^\d.,]/g, '').slice(0, 12))}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                />
              </View>
            </View>
            
            <Input label="LOCALIZAÇÃO" value={localizacao} onChangeText={setLocalizacao} placeholder="Cidade/Estado" />
            <Input label="DESCRIÇÃO COMPLETA" value={descricao} onChangeText={setDescricao} placeholder="Condição, box, acessórios, etc..." />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TEMPO DE RESERVA (H)</Text>
            <View style={styles.expiryGrid}>
              {EXPIRY_OPTIONS.map((opt) => (
                <Pressable 
                  key={opt.value} 
                  style={[styles.expiryBtn, tempoReserva === opt.value && styles.expiryBtnActive]} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTempoReserva(opt.value);
                  }}
                >
                  <Text style={[styles.expiryText, tempoReserva === opt.value && styles.expiryTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          <View style={styles.spacer} />
        </View>
      </ScreenContainer>

      <View style={[styles.fixedFooter, { paddingBottom: insets.bottom + spacing.md }]}>
        {mode === 'edit' && (
          <Button
            title="EXCLUIR PRODUTO"
            variant="danger"
            onPress={handleDelete}
            loading={loading}
            style={{ marginBottom: spacing.sm }}
          />
        )}
        <Button 
          title={mode === 'edit' ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR EM ESTOQUE'} 
          onPress={handleSubmit} 
          loading={loading || imageLoading || submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1.5,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageBox: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  addImageBox: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  expiryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  expiryBtn: {
    flex: 1,
    minWidth: '30%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  expiryBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  expiryText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  expiryTextActive: {
    color: colors.primary,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  spacer: {
    height: spacing.md,
  },
  fixedFooter: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  }
});
