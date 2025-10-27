import { useCallback } from 'react';
import type { ToastVariant } from '../store/uiStore';
import { useUIStore } from '../store/uiStore';

const DEFAULT_DURATION = 4000;

export const useToast = () => {
  const pushToast = useUIStore((state) => state.pushToast);
  const dismissToast = useUIStore((state) => state.dismissToast);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = DEFAULT_DURATION) => {
      const id = pushToast({ message, variant });

      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast, pushToast],
  );

  const success = useCallback(
    (message: string, duration?: number) => show(message, 'success', duration ?? DEFAULT_DURATION),
    [show],
  );

  const error = useCallback(
    (message: string, duration?: number) => show(message, 'error', duration ?? DEFAULT_DURATION),
    [show],
  );

  const info = useCallback(
    (message: string, duration?: number) => show(message, 'info', duration ?? DEFAULT_DURATION),
    [show],
  );

  return {
    success,
    error,
    info,
    dismiss: dismissToast,
  };
};
