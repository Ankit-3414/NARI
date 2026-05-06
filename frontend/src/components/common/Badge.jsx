import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Badge = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    success: 'bg-success/20 text-success border border-success/30',
    danger: 'bg-danger/20 text-danger border border-danger/30',
    warning: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
    accent: 'bg-accent/20 text-accent border border-accent/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
