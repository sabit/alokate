import { useUIStore } from '../../../store/uiStore';

export const ConnectionBadge = () => {
  const offline = useUIStore((state) => state.offline);
  const pendingOperations = useUIStore((state) => state.pendingOperations);

  const syncing = !offline && pendingOperations > 0;

  const badgeClass = offline
    ? 'bg-amber-500/15 text-amber-300'
    : syncing
      ? 'bg-sky-500/15 text-sky-100'
      : 'bg-emerald-500/15 text-emerald-300';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${badgeClass}`}
    >
      <span
        className={`flex h-2.5 w-2.5 items-center justify-center rounded-full ${
          offline ? 'bg-amber-400' : syncing ? 'bg-transparent' : 'bg-emerald-400'
        }`}
        aria-hidden="true"
      >
        {syncing && (
          <span className="h-2 w-2 rounded-full border border-current/80 border-r-transparent border-t-transparent animate-spin" />
        )}
      </span>
      {offline ? 'Offline mode' : syncing ? 'Syncing…' : 'Live sync'}
    </span>
  );
};
