'use client';

import { useActionState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { emptyAdminActionState, type AdminActionState } from '../action-state';

type Props = {
  action: (prev: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  children: ReactNode;
  id?: string;
  style?: CSSProperties;
  /** Nhãn nút gửi. Bỏ trống khi nút nằm ngoài form (trang Cầu thủ dùng thuộc tính `form=`). */
  submitLabel?: string;
  pendingLabel?: string;
  submitStyle?: CSSProperties;
};

/**
 * Bọc mọi form quản trị để kết quả LUÔN hiện ra.
 *
 * Trước đây năm trang quản trị dùng `<form action={serverAction}>` trần. Server Action kiểu
 * đó ném lỗi mà form không có chỗ nhận, nên bấm Lưu không có thông báo nào — thành công và
 * thất bại trông giống hệt nhau, và cách duy nhất để biết là tự đi kiểm tra lại dữ liệu.
 *
 * Gom vào một component thay vì sửa từng trang: trang thứ sáu thêm sau này cũng được che, và
 * không ai phải nhớ tự nối phần hiển thị lỗi.
 *
 * Thông báo đặt SAU nút bấm vì mắt người dừng ở nút vừa bấm; đặt trước nút thì câu trả lời
 * nằm phía trên chỗ đang nhìn.
 */
export function AdminForm({
  action,
  children,
  id,
  style,
  submitLabel,
  pendingLabel,
  submitStyle,
}: Props) {
  const [state, formAction, pending] = useActionState(action, emptyAdminActionState);

  return (
    <form id={id} action={formAction} style={style}>
      {children}

      {submitLabel ? (
        <button
          type="submit"
          disabled={pending}
          style={{
            background: 'var(--interactive-primary)',
            color: 'var(--text-on-interactive-primary)',
            border: 'none',
            borderRadius: 'var(--ptx-radius-sm)',
            padding: 'var(--ptx-space-2) var(--ptx-space-4)',
            cursor: pending ? 'progress' : 'pointer',
            opacity: pending ? 0.6 : 1,
            ...submitStyle,
          }}
        >
          {pending ? (pendingLabel ?? 'Đang lưu…') : submitLabel}
        </button>
      ) : null}

      {state.error ? (
        <p role="alert" style={{ margin: 0, color: 'var(--status-danger)', fontSize: '0.9rem' }}>
          ❌ {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p role="status" style={{ margin: 0, color: 'var(--status-success)', fontSize: '0.9rem' }}>
          ✅ {state.ok}
        </p>
      ) : null}
    </form>
  );
}
