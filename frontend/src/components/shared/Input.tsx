import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2)}`;

    return (
      <label className="block text-sm font-medium text-slate-200" htmlFor={inputId}>
        {label}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            'mt-2 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400',
            error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500' : '',
            className,
          )}
          {...props}
        />
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </label>
    );
  },
);

Input.displayName = 'Input';
