import type { StateCreator } from 'zustand';
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface UIState {
  theme: 'light' | 'dark';
  offline: boolean;
  toasts: ToastMessage[];
  pendingOperations: number;
  toggleTheme: () => void;
  setOffline: (offline: boolean) => void;
  pushToast: (toast: Omit<ToastMessage, 'id'>) => string;
  dismissToast: (id: string) => void;
  beginOperation: () => void;
  endOperation: () => void;
}

const createToastId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const initializer: StateCreator<UIState> = (set) => ({
  theme: 'dark',
  offline: false,
  toasts: [],
  pendingOperations: 0,
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
  setOffline: (offline) => set({ offline }),
  pushToast: (toast) => {
    const id = createToastId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  beginOperation: () =>
    set((state) => ({
      pendingOperations: state.pendingOperations + 1,
    })),
  endOperation: () =>
    set((state) => ({
      pendingOperations: Math.max(0, state.pendingOperations - 1),
    })),
});

export const useUIStore = create<UIState>(initializer);
