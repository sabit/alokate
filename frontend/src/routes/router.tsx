import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGate } from '../routes/AuthGate';
import { ConfigPage } from '../routes/ConfigPage';
import { PreferencesPage } from '../routes/PreferencesPage';
import { SchedulePage } from '../routes/SchedulePage';
import { SettingsPage } from '../routes/SettingsPage';
import { SnapshotsPage } from '../routes/SnapshotsPage';

export const createRouter = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <AuthGate />,
      children: [
        { index: true, element: <Navigate to="schedule" replace /> },
        { path: 'config', element: <ConfigPage /> },
        { path: 'preferences', element: <PreferencesPage /> },
        { path: 'schedule', element: <SchedulePage /> },
        { path: 'snapshots', element: <SnapshotsPage /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
