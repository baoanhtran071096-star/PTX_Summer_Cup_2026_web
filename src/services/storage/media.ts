import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';

export type MediaBucket = 'team-logos' | 'player-avatars' | 'gallery' | 'operations-media' | 'branding';

/** `path` is expected to already be a normalized ASCII object key (see scripts/migrate-r25-assets.js). */
export function getPublicMediaUrl(client: SupabaseClient, bucket: MediaBucket, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadMedia(
  client: SupabaseClient,
  bucket: MediaBucket,
  path: string,
  file: File | Blob,
  contentType: string
): Promise<void> {
  const { error } = await client.storage.from(bucket).upload(path, file, { contentType, upsert: true });
  if (error) throw new InfrastructureError(`Failed to upload ${bucket}/${path}: ${error.message}`, error);
}
