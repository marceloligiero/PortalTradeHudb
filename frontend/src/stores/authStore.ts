import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'STUDENT' | 'TRAINEE' | 'TRAINER' | 'ADMIN' | 'MANAGER' | 'GESTOR';
  is_active: boolean;
  is_pending?: boolean;
  is_trainer?: boolean;
  is_tutor?: boolean;
  is_liberador?: boolean;
}

export const getEffectiveRole = (user: User | null) =>
  user?.is_pending ? 'TRAINEE' : user?.role;
export const hasAdminAccess = (user: User | null) =>
  !user?.is_pending && (user?.role === 'ADMIN' || user?.role === 'GESTOR');
export const canWrite = (user: User | null) =>
  !user?.is_pending && user?.role !== 'GESTOR';

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
      name: 'auth-storage',
      // sessionStorage: cleared on tab close, not accessible cross-tab (C04 fix)
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
