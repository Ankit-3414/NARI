import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Activity } from 'lucide-react';
import { useLogContext } from '../../hooks/useContext';
import { clsx } from 'clsx';

const ContextInput = ({ onLogged }) => {
  const [text, setText] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { mutate: logContext, isPending: isLoading } = useLogContext();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    logContext(text, {
      onSuccess: () => {
        setText('');
        if (onLogged) onLogged();
      }
    });
  };

  return (
    <div className="w-full mb-8 relative group">
      {/* Decorative background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <form 
        onSubmit={handleSubmit}
        className="relative bg-surface/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-2 flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-focus-within:border-primary/50 group-focus-within:shadow-[0_0_30px_rgba(0,242,255,0.15)] transition-all duration-500 overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-accent rounded-l-[2rem] opacity-50" />
        
        <div className="pl-6 pr-3 py-3 flex items-center justify-center pointer-events-none">
          <Activity size={20} className={clsx("transition-colors duration-300", text.trim() ? "text-primary" : "text-secondary")} />
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="LOG_CONTEXT..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none text-white text-lg md:text-xl font-medium focus:outline-none focus:ring-0 placeholder:text-slate-600 placeholder:font-mono placeholder:tracking-widest uppercase py-4"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim() || isLoading}
          className={clsx(
            "p-4 rounded-xl flex items-center justify-center transition-all duration-300 mr-1",
            !text.trim() || isLoading 
              ? "bg-white/5 text-secondary cursor-not-allowed" 
              : "bg-primary text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.5)]"
          )}
        >
          <Send size={24} className={clsx(isLoading && 'animate-pulse')} />
        </motion.button>
       </form>
       
       {!isOnline && (
         <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/20 border border-warning/30">
           <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
           <span className="text-[9px] font-bold uppercase tracking-wider text-warning">Offline Queue</span>
         </div>
       )}
       
       <div className="flex items-center gap-2 mt-3 ml-8 text-[9px] font-mono text-secondary uppercase tracking-[0.2em]">
         <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
         NARI Input Pipeline / Frictionless Stream
       </div>
    </div>
  );
};

export default ContextInput;
