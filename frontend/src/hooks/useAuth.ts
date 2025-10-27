import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { isAuthenticated, token, setToken, reset } = useAuthStore();

  return useMemo(
    () => ({
      isAuthenticated,
      token,
      login: (newToken: string) => setToken(newToken),
      logout: () => reset(),
    }),
    [isAuthenticated, token, setToken, reset],
  );
};
