import React from 'react';
import { clsx } from 'clsx';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  loading,
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-black hover:shadow-glow-primary shadow-primary/20',
    secondary: 'bg-surface-light text-slate-100 border border-white/5 hover:border-white/10',
    danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-black',
    ghost: 'bg-transparent text-secondary hover:text-primary hover:bg-primary/5',
    outline: 'bg-transparent border border-primary/30 text-primary hover:bg-primary hover:text-black'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-6 py-2.5 text-xs',
    lg: 'px-8 py-4 text-sm'
  };

  return (
    <button
      className={clsx(
        'relative inline-flex items-center justify-center font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;
