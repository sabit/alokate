import { NavLink } from 'react-router-dom';
import { SaveSnapshotButton } from './SaveSnapshotButton';
import { SnapshotList } from './SnapshotList';

const navItems = [
  { label: 'Config', to: '/config' },
  { label: 'Preferences', to: '/preferences' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Snapshots', to: '/snapshots' },
  { label: 'Settings', to: '/settings' },
];

export const Sidebar = () => (
  <aside className="flex w-72 flex-col border-r border-white/10 bg-slate-950/70">
    <div className="flex items-center justify-between px-4 py-5">
      <div>
        <p className="text-lg font-semibold">Alokate</p>
        <p className="text-xs text-slate-400">Faculty Scheduler</p>
      </div>
      <SaveSnapshotButton />
    </div>
    <nav className="flex-1 space-y-1 px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }: { isActive: boolean }) =>
            `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
    <div className="h-0.5 bg-white/5" />
    <SnapshotList />
  </aside>
);
