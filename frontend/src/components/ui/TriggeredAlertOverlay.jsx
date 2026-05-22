import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Volume2, Clock } from 'lucide-react';

const TriggeredAlertOverlay = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  // We only show the top-most alert in full-screen mode
  const activeAlert = alerts[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden">
      {/* Intense Background Pulsing Layers */}
      <motion.div 
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="absolute inset-0 bg-danger" 
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80" />
      
      {/* Animated Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeAlert.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="relative z-20 w-full max-w-lg p-8 flex flex-col items-center text-center gap-8"
        >
          {/* Signal Icon with Heavy Glow */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-32 h-32 rounded-[2.5rem] bg-danger text-black flex items-center justify-center shadow-[0_0_100px_rgba(255,0,85,0.6)]"
            >
              <Bell size={64} fill="currentColor" />
            </motion.div>
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-black border-4 border-danger flex items-center justify-center">
              <span className="text-danger font-black text-xs animate-pulse">!</span>
            </div>
          </div>

          {/* Alert Identity */}
          <div className="space-y-4">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex items-center justify-center gap-3"
            >
              <div className="h-[2px] w-8 bg-danger/50" />
              <span className="text-[12px] font-mono text-danger font-black uppercase tracking-[0.5em]">Neural_Link_Breached</span>
              <div className="h-[2px] w-8 bg-danger/50" />
            </motion.div>
            
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none italic">
              {activeAlert.title}
            </h1>
            
            <p className="text-danger text-xl font-bold tracking-widest uppercase opacity-80 animate-bounce">
              {activeAlert.message || 'Immediate action required'}
            </p>
          </div>

          {/* Dismissal Control */}
          <div className="w-full space-y-4">
            <button
              onClick={() => {
                onDismiss(activeAlert.id);
              }}
              className="w-full py-8 rounded-[2rem] bg-danger text-black font-black uppercase tracking-[0.3em] text-2xl shadow-[0_0_50px_rgba(255,0,85,0.4)] hover:shadow-[0_0_80px_rgba(255,0,85,0.7)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-4">
                <X size={32} strokeWidth={4} />
                Terminate Signal
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </button>
            
            <div className="flex items-center justify-center gap-6 text-white/30 font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Clock size={12} /> {new Date().toLocaleTimeString()}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>NARI_OS_ALARM_V2</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TriggeredAlertOverlay;
