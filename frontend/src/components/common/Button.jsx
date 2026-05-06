import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
  const variants = {
    primary: 'bg-primary hover:bg-blue-600 text-white',
    secondary: 'bg-surface border border-slate-700 text-slate-200 hover:bg-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800 text-secondary hover:text-slate-100',
    danger: 'bg-danger hover:bg-red-600 text-white',
    success: 'bg-success hover:bg-green-600 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
