import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
};

const baseStyles =
  'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-400 focus-visible:outline-brand-200 dark:hover:bg-brand-600',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:outline-brand-300',
  ghost: 'bg-transparent text-slate-200 hover:bg-slate-800/60 focus-visible:outline-brand-300',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, variant = 'primary', loading = false, disabled, ...props }: ButtonProps,
    ref,
  ) => (
    <button
      ref={ref}
      className={twMerge(baseStyles, variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-r-transparent" />}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
