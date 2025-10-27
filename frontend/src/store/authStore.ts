import type { StateCreator } from 'zustand';
import { create } from 'zustand';

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  reset: () => void;
}

const initializer: StateCreator<AuthState, [], [], AuthState> = (set) => ({
  token: null,
  isAuthenticated: false,
  setToken: (token: string | null) =>
    set({
      token,
      isAuthenticated: Boolean(token),
    }),
  reset: () => set({ token: null, isAuthenticated: false }),
});

export const useAuthStore = create<AuthState>(initializer);
