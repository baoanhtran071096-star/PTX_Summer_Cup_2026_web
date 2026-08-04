import { uploadMediaAction } from '@/features/admin/actions';

export const dynamic = 'force-dynamic';

const BUCKETS = ['team-logos', 'player-avatars', 'gallery', 'operations-media', 'branding'] as const;

export default function AdminMediaPage() {
  return (
    <div>
      <h1>Media</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Tải lên logo đội, ảnh cầu thủ, hoặc ảnh thư viện. Sau khi tải lên, cập nhật đường dẫn tương ứng ở trang
        Đội bóng/Cầu thủ.
      </p>
      <form action={uploadMediaAction} encType="multipart/form-data" style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '420px' }}>
        <label>
          Bucket
          <select name="bucket" required style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }}>
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tên tệp lưu trữ (vd: phoenix-logo.webp)
          <input name="targetKey" required style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }} />
        </label>
        <label>
          Tệp
          <input type="file" name="file" required style={{ display: 'block', width: '100%' }} />
        </label>
        <button
          type="submit"
          style={{ background: 'var(--interactive-primary)', color: 'var(--text-on-interactive-primary)', border: 'none', borderRadius: 'var(--ptx-radius-sm)', padding: 'var(--ptx-space-2) var(--ptx-space-4)' }}
        >
          Tải lên
        </button>
      </form>
    </div>
  );
}
