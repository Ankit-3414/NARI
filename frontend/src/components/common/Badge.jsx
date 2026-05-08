import React from 'react';
import { clsx } from 'clsx';

const Badge = ({ children, variant = 'primary', className }) => {
  const variants = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-white/5 text-secondary',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    low: 'bg-success/10 text-success',
    normal: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    urgent: 'bg-danger/10 text-danger shadow-[0_0_10px_rgba(255,0,85,0.2)] animate-pulse'
  };

  return (
    <span className={clsx(
      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5',
      variants[variant] || variants.primary,
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
