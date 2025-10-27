import { XMarkIcon } from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';

const variantStyles = {
  success: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-50',
  error: 'border-rose-500/60 bg-rose-500/10 text-rose-50',
  info: 'border-slate-500/60 bg-slate-800/90 text-slate-100',
} as const;

export const ToastContainer = () => {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex w-80 items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-xl shadow-black/30 backdrop-blur ${variantStyles[toast.variant]}`}
        >
          <div className="text-sm font-medium">{toast.message}</div>
          <button
            type="button"
            className="mt-0.5 rounded-md p-1 text-slate-200/80 transition hover:bg-white/10 hover:text-white"
            onClick={() => dismissToast(toast.id)}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Dismiss toast</span>
          </button>
        </div>
      ))}
    </div>
  );
};
