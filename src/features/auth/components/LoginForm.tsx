'use client';

import { useActionState } from 'react';
import { signInAction, type LoginActionState } from '../actions';

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form
      action={formAction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ptx-space-4)',
        maxWidth: '360px',
      }}
    >
      <label>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          style={{
            display: 'block',
            width: '100%',
            padding: 'var(--ptx-space-2)',
            borderRadius: 'var(--ptx-radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        />
      </label>
      <label>
        Mật khẩu
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          style={{
            display: 'block',
            width: '100%',
            padding: 'var(--ptx-space-2)',
            borderRadius: 'var(--ptx-radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        />
      </label>
      {state.error ? <p style={{ color: 'var(--status-danger)' }}>{state.error}</p> : null}
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
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}
