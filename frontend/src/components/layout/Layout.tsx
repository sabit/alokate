import type { ReactNode } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useSchedulerBootstrap } from '../../hooks/useSchedulerBootstrap';
import { ToastContainer } from '../shared/ToastContainer';
import { Header } from './Header/Header';
import { Sidebar } from './Sidebar/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  useAutoSave();
  const { initializing, error } = useSchedulerBootstrap();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-slate-900/40 p-6">
          {initializing && (
            <div className="mb-4 rounded-lg border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-200">
              Loading scheduler data…
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              Local storage error: {error}
            </div>
          )}
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
