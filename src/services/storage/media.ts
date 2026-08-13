import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';

export type MediaBucket = 'team-logos' | 'player-avatars' | 'gallery' | 'operations-media' | 'branding';

/** `path` is expected to already be a normalized ASCII object key (see scripts/migrate-r25-assets.js). */
export function getPublicMediaUrl(client: SupabaseClient, bucket: MediaBucket, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * KHÔNG dùng `upsert: true`.
 *
 * Với upsert, Storage chạy `INSERT ... ON CONFLICT DO UPDATE`, nên Postgres phải kiểm cả
 * chính sách UPDATE. Chính sách "media buckets: admin update" chỉ khai báo `using (...)` và
 * KHÔNG có `with check (...)`, nên nhánh cập nhật bị từ chối và trả về đúng câu khó hiểu
 * "new row violates row-level security policy" — nghe như lỗi quyền, thật ra là lỗi upsert.
 *
 * Đã đo trên production với cùng một token admin thật, chỉ đổi mỗi cờ này:
 *   upsert: true   → ✗ new row violates row-level security policy
 *   không upsert   → ✓ ghi được
 *
 * Bỏ upsert cũng đúng hơn về mặt vận hành: ghi đè im lặng một tấm ảnh đã có là hành vi
 * nguy hiểm. Trùng tên thì báo cho người dùng biết để họ tự chọn tên khác.
 */
export async function uploadMedia(
  client: SupabaseClient,
  bucket: MediaBucket,
  path: string,
  file: File | Blob,
  contentType: string
): Promise<void> {
  const { error } = await client.storage.from(bucket).upload(path, file, { contentType });
  if (!error) return;

  // Supabase trả 409 / "Duplicate" khi khoá đã tồn tại. Nói thẳng thay vì để lộ mã lỗi thô.
  const duplicate = /duplicate|already exists|resource already/i.test(error.message);
  throw new InfrastructureError(
    duplicate
      ? `Đã có tệp tên "${path}" trong ${bucket}. Hãy đổi tên khác rồi tải lại.`
      : `Failed to upload ${bucket}/${path}: ${error.message}`,
    error
  );
}
