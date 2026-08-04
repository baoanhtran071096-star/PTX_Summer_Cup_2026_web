import type { ReactNode } from 'react';

/**
 * `accentColor`/`textColor` accept a semantic-token reference (e.g.
 * 'var(--team-color-p)') — never a raw hex value (Architecture v1.3
 * §14). Team colors themselves are already tokenized in
 * design-system/semantic/sports.css. `textColor` defaults to
 * `accentColor` but can be overridden when the accent color doesn't
 * meet text contrast requirements (see constants/teamColors.ts).
 */
export function Badge({
  children,
  accentColor,
  textColor,
}: {
  children: ReactNode;
  accentColor?: string;
  textColor?: string;
}) {
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
        color: textColor ?? accentColor ?? 'var(--interactive-secondary)',
        border: `1px solid ${accentColor ?? 'var(--interactive-secondary)'}`,
      }}
    >
      {children}
    </span>
  );
}
