'use client';

import { useTheme } from '@/providers/ThemeProvider';
import type { Theme } from '@/types/common';

const THEME_LABELS: Record<Theme, string> = { light: '☀️ Sáng', dark: '🌙 Tối', summer: '🌴 Hè' };
const THEMES: Theme[] = ['light', 'dark', 'summer'];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Chọn giao diện" style={{ display: 'flex', gap: 'var(--ptx-space-1)' }}>
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          aria-pressed={theme === t}
          style={{
            border: `1px solid ${theme === t ? 'var(--interactive-primary)' : 'var(--border-color)'}`,
            background: theme === t ? 'var(--interactive-primary)' : 'transparent',
            color: theme === t ? 'var(--text-on-interactive-primary)' : 'inherit',
            borderRadius: 'var(--ptx-radius-pill)',
            padding: 'var(--ptx-space-1) var(--ptx-space-3)',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
