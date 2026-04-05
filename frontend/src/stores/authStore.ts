import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants/storageKeys';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'USUARIO' | 'FORMADOR' | 'GERENTE' | 'CHEFE_EQUIPE' | 'DIRETOR' | 'ADMIN';
  is_active: boolean;
  is_pending?: boolean;
  // Permission flags — use these for access control, not the role column
  is_admin?: boolean;
  is_diretor?: boolean;
  is_gerente?: boolean;
  is_chefe_equipe?: boolean;
  is_formador?: boolean;
  is_tutor?: boolean;
  is_liberador?: boolean;
  is_referente?: boolean;
}

export const getEffectiveRole = (user: User | null) =>
  user?.is_pending ? 'USUARIO' : user?.role;
export const hasAdminAccess = (user: User | null) =>
  !user?.is_pending && !!(user?.is_admin || user?.is_diretor);
export const canWrite = (user: User | null) =>
  !user?.is_pending && !!(user?.is_admin || user?.is_diretor || user?.is_gerente ||
    user?.is_chefe_equipe || user?.is_formador || user?.is_tutor || user?.is_liberador);

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
      // sessionStorage: cleared on tab close, not accessible cross-tab (C04 fix)
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
