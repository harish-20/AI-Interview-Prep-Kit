import { create } from 'zustand';
import { User } from '@/types/kit';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.auth.getMe();
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_session=true; path=/; max-age=604800; SameSite=Lax';
      }
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        document.cookie = 'auth_session=true; path=/; max-age=604800; SameSite=Lax';
      } else {
        document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      }
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
