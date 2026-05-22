import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Cpu } from 'lucide-react';

const PwaInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the NARI installation');
    } else {
      console.log('User dismissed the NARI installation');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group cursor-pointer overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-primary/50 to-accent/50 hover:from-primary hover:to-accent transition-all duration-500 shadow-[0_0_20px_rgba(0,242,255,0.15)]"
        onClick={handleInstall}
      >
        <div className="bg-surface/90 backdrop-blur-md px-6 py-4 rounded-[15px] flex items-center gap-4 group-hover:bg-transparent transition-colors duration-500">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-white/10 group-hover:text-black transition-all">
            <Download size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Local Deployment</h4>
            <p className="text-[10px] font-mono text-secondary group-hover:text-black/80">Install NARI for native neural experience</p>
          </div>
          <div className="ml-auto">
            <Cpu size={16} className="text-primary/40 group-hover:text-black/40 animate-pulse" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PwaInstallButton;
