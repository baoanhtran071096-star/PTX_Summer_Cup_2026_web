import type { ReactNode } from 'react';

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-color)',
        padding: 'var(--ptx-space-6)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
