'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/services/database/client-browser';
import { isSupabaseConfigured } from '@/lib/env';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Nothing to load if Supabase isn't configured yet — computed once at
  // render time so the "not configured" path never needs to call
  // setState from inside the effect at all.
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
