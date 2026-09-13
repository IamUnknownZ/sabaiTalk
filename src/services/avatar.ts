import * as ImagePicker from 'expo-image-picker';
import { requireSupabase } from '@/lib/supabase';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const mimeToExtension: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const extensionToMime: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function resolveImageType(asset: ImagePicker.ImagePickerAsset, responseType: string | null) {
  const declared = asset.mimeType?.toLowerCase() || responseType?.split(';')[0]?.trim().toLowerCase();
  if (declared && mimeToExtension[declared]) {
    return { mimeType: declared, extension: mimeToExtension[declared] };
  }

  const extension = asset.fileName?.split('.').pop()?.toLowerCase() ?? '';
  const inferredMime = extensionToMime[extension];
  if (inferredMime) {
    return { mimeType: inferredMime, extension: mimeToExtension[inferredMime] };
  }

  throw new Error('Avatar must be a JPEG, PNG, or WebP image.');
}

export async function pickAndUploadAvatar() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.82,
  });

  if (result.canceled || !result.assets[0]) return null;

  const client = requireSupabase();
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in.');

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
    throw new Error('Avatar must be 5 MB or smaller.');
  }

  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Could not read the selected image.');

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_AVATAR_BYTES) {
    throw new Error('Avatar must be 5 MB or smaller.');
  }

  const { mimeType, extension } = resolveImageType(asset, response.headers.get('content-type'));
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await client.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = client.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  const { error: profileError } = await client
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) throw profileError;
  return avatarUrl;
}
