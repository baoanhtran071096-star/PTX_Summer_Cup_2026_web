import type { ReactNode } from 'react';

/** Distinct AI-identity surface (--ai-* tokens) so AI content reads as
 * a distinct assistant layer, never blended into primary brand actions
 * (docs/architecture §15). */
export function AIAnalysisCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--ai-surface)',
        border: '1px solid var(--ai-accent)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--ptx-space-4)',
      }}
    >
      {children}
    </div>
  );
}
