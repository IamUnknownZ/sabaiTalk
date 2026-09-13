import * as ImagePicker from 'expo-image-picker';
import { requireSupabase } from '@/lib/supabase';

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
  const response = await fetch(asset.uri);
  const buffer = await response.arrayBuffer();
  const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await client.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: asset.mimeType ?? 'image/jpeg',
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
