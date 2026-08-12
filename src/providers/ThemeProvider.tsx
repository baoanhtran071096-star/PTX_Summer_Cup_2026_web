'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Theme } from '@/types/common';

const STORAGE_KEY = 'ptx_theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isValidTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'summer';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always 'light' on both the server render and the client's FIRST
  // render — reading localStorage in a useState lazy initializer would
  // make that first client render differ from the server's HTML,
  // which React silently fails to reconcile for some attributes
  // (a real bug found via E2E: a theme button's aria-pressed got stuck
  // permanently wrong after reload). Applying the persisted theme in
  // an effect, after mount, keeps hydration consistent — the real
  // theme applies via a normal state update microseconds later
  // instead of during hydration itself.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Justified exception: syncing from an external system (localStorage)
    // that's genuinely unavailable during SSR — there's no synchronous
    // alternative that keeps the first client render matching the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isValidTheme(stored)) setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
