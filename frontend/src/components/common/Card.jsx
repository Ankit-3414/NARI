import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Card = ({ className, children, title, ...props }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    className={cn(
      'bg-surface border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/5',
      className
    )}
    {...props}
  >
    {title && (
      <div className="p-4 pb-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
          {title}
        </h2>
      </div>
    )}
    {children}
  </motion.div>
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
export default Card;
