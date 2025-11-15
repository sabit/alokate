import { 
  Cog6ToothIcon, 
  HeartIcon, 
  CalendarDaysIcon, 
  CameraIcon, 
  WrenchScrewdriverIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SaveSnapshotButton } from './SaveSnapshotButton';
import { SnapshotList } from './SnapshotList';

const navItems = [
  { label: 'Config', to: '/config', icon: Cog6ToothIcon },
  { label: 'Preferences', to: '/preferences', icon: HeartIcon },
  { label: 'Schedule', to: '/schedule', icon: CalendarDaysIcon },
  { label: 'Snapshots', to: '/snapshots', icon: CameraIcon },
  { label: 'Settings', to: '/settings', icon: WrenchScrewdriverIcon },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside className={`flex flex-col border-r border-white/10 bg-slate-950/70 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`}>
      <div className="flex items-center justify-between px-4 py-5">
        {!isCollapsed && (
          <div>
            <p className="text-lg font-semibold">Alokate</p>
            <p className="text-xs text-slate-400">Faculty Scheduler</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      {!isCollapsed && <SaveSnapshotButton />}
      <nav className="flex-1 space-y-1 px-2 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title={item.label}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
      {!isCollapsed && (
        <>
          <div className="h-0.5 bg-white/5" />
          <SnapshotList />
        </>
      )}
    </aside>
  );
};
