import { Platform } from 'react-native';

function getFileExtension(uri: string) {
  const raw = uri.split('?')[0];
  const parts = raw.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  return ext;
}

function getMimeTypeByExtension(ext: string) {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif'
  };
  return map[ext] || 'image/jpeg';
}

function getCloudinaryConfig() {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary não configurado. Defina EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME e EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
  }

  return { cloudName, uploadPreset };
}

export async function uploadProductImage({
  userId,
  productId,
  imageUri
}: {
  userId: string;
  productId: string;
  imageUri: string;
}) {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const extension = getFileExtension(imageUri);
  const mimeType = getMimeTypeByExtension(extension);
  const publicId = `nine-half/products/${userId}/${productId}/main`;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', publicId);
  formData.append('folder', `nine-half/products/${userId}/${productId}`);

  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('file', blob, `main.${extension}`);
  } else {
    formData.append('file', {
      uri: imageUri,
      name: `main.${extension}`,
      type: mimeType
    } as any);
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  const uploadResult = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadResult?.secure_url) {
    throw new Error(uploadResult?.error?.message || 'Erro ao enviar imagem.');
  }

  return {
    imageUrl: uploadResult.secure_url as string,
    imagePath: uploadResult.public_id as string
  };
}

// Em preset unsigned nao ha credencial segura no cliente para destroy.
// Mantemos no-op para nao quebrar fluxo; limpeza pode ser feita no painel Cloudinary.
export async function deleteProductImage(_imagePath: string) {
  return;
}

export async function getImageUrl(path: string) {
  return path || '';
}
