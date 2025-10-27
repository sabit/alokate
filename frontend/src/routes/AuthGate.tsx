import { lazy, Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';

const PinPrompt = lazy(() => import('../components/layout/PinPrompt'));

export const AuthGate = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="grid h-screen place-items-center">Loading…</div>}>
        <PinPrompt />
      </Suspense>
    );
  }

  if (location.pathname === '/') {
    return <Navigate to="/schedule" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
