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
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
