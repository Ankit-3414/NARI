import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-80"
        >
          <div 
            className="bg-black/90 border border-primary/50 p-4 shadow-[0_0_30px_rgba(0,242,255,0.2)] backdrop-blur-md"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)' }}
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 border border-primary/20">
                <RefreshCw className="text-primary w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-primary font-mono font-bold text-sm tracking-wider uppercase">
                  {offlineReady ? 'System Offline-Ready' : 'Neural Update Available'}
                </h3>
                <p className="text-[#a0a0a0] text-[10px] mt-1 font-mono leading-relaxed">
                  {offlineReady 
                    ? 'NARI is now optimized for offline productivity.' 
                    : 'A new version of the neural interface is ready.'}
                </p>
                <div className="flex gap-2 mt-4">
                  {needRefresh && (
                    <button
                      onClick={() => updateServiceWorker(true)}
                      className="flex-1 bg-primary text-black font-mono font-bold text-[10px] py-2 uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Initialize Upgrade
                    </button>
                  )}
                  <button
                    onClick={close}
                    className="px-4 py-2 border border-primary/20 text-primary font-mono text-[10px] uppercase hover:bg-primary/10 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={close} className="text-[#606060] hover:text-primary transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReloadPrompt;
