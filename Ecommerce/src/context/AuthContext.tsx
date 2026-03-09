/**
 * AuthContext — Sub-Sprint 3
 *
 * Single source of truth for the authenticated user. Backed by TanStack Query
 * so the /users/me result is cached, deduped across components, and auto-refetched
 * on window focus.
 *
 * Usage:
 *   const { user, isLoading, logout } = useAuth();
 */

import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../components/api';
import { logout as doLogout } from '../components/utils/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'vendeur' | 'fournisseur' | 'specialiste';

export interface AuthUser {
  id: number;
  nom: string;
  email: string;
  role: UserRole;
  actif?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/users/me');
        return res.data as AuthUser;
      } catch {
        // api.ts interceptor already handles 401 → refresh → redirect.
        // We only reach here for non-401 errors or after refresh failure.
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  const logout = async () => {
    // Clear the cached user before navigation so no stale state leaks
    queryClient.removeQueries({ queryKey: ['me'] });
    await doLogout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ── Role metadata (shared across the app) ────────────────────────────────────

export const ROLE_META: Record<UserRole, { label: string; classes: string }> = {
  admin:       { label: 'Admin',        classes: 'bg-rose-100 text-rose-700 border-rose-200' },
  vendeur:     { label: 'Vendeur',      classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  fournisseur: { label: 'Fournisseur',  classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  specialiste: { label: 'Spécialiste',  classes: 'bg-violet-100 text-violet-700 border-violet-200' },
};
