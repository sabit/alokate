import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ConfigPage } from '../routes/ConfigPage';
import { PreferencesPage } from '../routes/PreferencesPage';
import { SchedulePage } from '../routes/SchedulePage';
import { SettingsPage } from '../routes/SettingsPage';
import { SnapshotsPage } from '../routes/SnapshotsPage';

export const createRouter = () =>
  createBrowserRouter([
    {
      path: '/',
      element: (
        <Layout>
          <Navigate to="schedule" replace />
        </Layout>
      ),
    },
    {
      path: '/config',
      element: (
        <Layout>
          <ConfigPage />
        </Layout>
      ),
    },
    {
      path: '/preferences',
      element: (
        <Layout>
          <PreferencesPage />
        </Layout>
      ),
    },
    {
      path: '/schedule',
      element: (
        <Layout>
          <SchedulePage />
        </Layout>
      ),
    },
    {
      path: '/snapshots',
      element: (
        <Layout>
          <SnapshotsPage />
        </Layout>
      ),
    },
    {
      path: '/settings',
      element: (
        <Layout>
          <SettingsPage />
        </Layout>
      ),
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
