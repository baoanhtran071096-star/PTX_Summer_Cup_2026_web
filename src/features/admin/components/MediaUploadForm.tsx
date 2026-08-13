'use client';

import { useActionState, useState } from 'react';
import { uploadMediaAction, type UploadMediaState } from '../actions';

const BUCKETS = ['team-logos', 'player-avatars', 'gallery', 'operations-media', 'branding'] as const;

const initialState: UploadMediaState = { error: null, uploaded: null };

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 'var(--ptx-space-2)',
  borderRadius: 'var(--ptx-radius-sm)',
  border: '1px solid var(--border-color)',
};

/**
 * Biến tên tệp gốc thành khoá lưu trữ an toàn cho URL.
 *
 * Tên thật thường có dấu và khoảng trắng — "logo công đoàn kết hợp PTX.jpg". Để nguyên thì
 * mọi chỗ dùng về sau đều phải mã hoá URL, và quên một chỗ là 404 rất khó lần. Bỏ dấu bằng
 * NFD rồi tước dấu phụ, phần còn lại về chữ thường nối bằng gạch ngang, giữ nguyên đuôi.
 */
function toSafeKey(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ext ? `${slug || 'tep'}.${ext}` : slug || 'tep';
}

export function MediaUploadForm() {
  const [state, formAction, pending] = useActionState(uploadMediaAction, initialState);
  const [targetKey, setTargetKey] = useState('');

  return (
    <form action={formAction} style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '460px' }}>
      <label>
        Bucket
        <select name="bucket" required defaultValue="gallery" style={inputStyle}>
          {BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label>
        Tệp
        <input
          type="file"
          name="file"
          required
          accept="image/*,video/mp4"
          style={{ display: 'block', width: '100%' }}
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            // Điền sẵn tên an toàn ngay khi chọn tệp — vẫn sửa được, nhưng người dùng
            // không phải tự nghĩ ra một tên hợp lệ, và không còn gõ thiếu đuôi.
            if (f) setTargetKey(toSafeKey(f.name));
          }}
        />
      </label>

      <label>
        Tên tệp lưu trữ
        <input
          name="targetKey"
          required
          value={targetKey}
          onChange={(e) => setTargetKey(e.currentTarget.value)}
          placeholder="phoenix-logo.webp"
          style={inputStyle}
        />
        <span style={{ display: 'block', marginTop: 'var(--ptx-space-1)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Chữ không dấu, không khoảng trắng, phải có đuôi tệp. Tối đa 10 MB.
        </span>
      </label>

      {state.error ? (
        <p role="alert" style={{ margin: 0, color: 'var(--status-danger)' }}>
          ❌ {state.error}
        </p>
      ) : null}

      {state.uploaded ? (
        <p role="status" style={{ margin: 0, color: 'var(--status-success)' }}>
          ✅ Đã tải lên <code>{state.uploaded}</code>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          background: 'var(--interactive-primary)',
          color: 'var(--text-on-interactive-primary)',
          border: 'none',
          borderRadius: 'var(--ptx-radius-sm)',
          padding: 'var(--ptx-space-2) var(--ptx-space-4)',
          cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Đang tải lên…' : 'Tải lên'}
      </button>
    </form>
  );
}
