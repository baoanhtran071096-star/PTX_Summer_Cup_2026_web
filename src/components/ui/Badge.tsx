import type { ReactNode } from 'react';

/**
 * `accentColor` accepts a semantic-token reference (e.g.
 * 'var(--team-color-p)') — never a raw hex value (Architecture v1.3
 * §14). Team colors themselves are already tokenized in
 * design-system/semantic/sports.css.
 */
export function Badge({ children, accentColor }: { children: ReactNode; accentColor?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--ptx-space-1)',
        padding: '2px 10px',
        borderRadius: 'var(--ptx-radius-pill)',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: accentColor ?? 'var(--interactive-secondary)',
        border: `1px solid ${accentColor ?? 'var(--interactive-secondary)'}`,
      }}
    >
      {children}
    </span>
  );
}
