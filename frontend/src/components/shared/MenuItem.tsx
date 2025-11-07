import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface MenuItemProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}

export const MenuItem = ({ label, disabled = false, onClick, icon, className }: MenuItemProps) => {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) {
      return;
    }

    // Handle Enter and Space keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const baseStyles =
    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors focus-visible:outline-none';

  const enabledStyles = 'text-slate-100 hover:bg-slate-800/80 focus-visible:bg-slate-800/80 cursor-pointer';

  const disabledStyles = 'text-slate-500 cursor-not-allowed opacity-60';

  return (
    <div
      role="menuitem"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={twMerge(baseStyles, disabled ? disabledStyles : enabledStyles, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </div>
  );
};
