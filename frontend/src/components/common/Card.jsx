import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      'bg-surface border border-slate-800 rounded-xl overflow-hidden shadow-sm',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('p-4 border-b border-slate-800', className)} {...props}>
    {children}
  </div>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={cn('p-4', className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('p-4 border-t border-slate-800', className)} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardContent, CardFooter };
