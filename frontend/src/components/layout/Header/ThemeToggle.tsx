import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import { Button } from '../../shared/Button';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </Button>
  );
};
