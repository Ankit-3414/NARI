import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BookOpen, StickyNote, Cpu, Activity, Bell, Settings, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import NariLogo from '../common/NariLogo';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      clsx(
        'relative flex flex-col items-center justify-center p-2 transition-all duration-300 group',
        isActive ? 'text-background bg-primary shadow-[0_0_20px_rgba(0,242,255,0.6)]' : 'text-secondary hover:text-primary hover:bg-white/5'
      )
    }
    style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
  >
    {({ isActive }) => (
      <>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative z-10"
        >
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </motion.div>
        
        <span className="absolute -top-10 bg-surface border border-primary/20 px-2 py-1 text-[10px] font-mono font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
          {`> ${label}`}
        </span>
      </>
    )}
  </NavLink>
);

const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="scanline-overlay" />
    <div className="absolute inset-0 bg-noise opacity-[0.05] brightness-100 contrast-150 mix-blend-overlay"></div>
    <div className="absolute inset-0 bg-grid opacity-20" style={{ backgroundSize: '60px 60px' }} />
    
    <motion.div 
      animate={{ 
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{ duration: 10, repeat: Infinity }}
      className="absolute top-0 left-0 w-full h-full bg-primary/5 pointer-events-none"
    />
  </div>
);

const MobileLayout = () => {
  const wsStatus = useUiStore((state) => state.wsStatus);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary selection:text-background font-mono">
      <AnimatedBackground />

      {/* Top Header / HUD */}
      <header className={clsx(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500 px-6 h-20 flex items-center justify-between",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-primary/20" : "bg-transparent"
      )}>
        <div className="flex items-center gap-4">
          <NariLogo size={44} />
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none uppercase italic glitch-text">NARI</span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-primary/60 uppercase tracking-[0.4em]">Personal_OS</span>
              <span className="text-[8px] font-mono text-accent animate-pulse">[v1.0.4_BETA]</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-surface/50 border border-primary/20">
            <motion.div 
              animate={wsStatus === 'connected' ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className={clsx(
                "w-1.5 h-1.5",
                wsStatus === 'connected' ? 'bg-success shadow-[0_0_8px_#00FF94]' : 'bg-danger'
              )} 
            />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">
              {wsStatus === 'connected' ? 'SYST_ONLINE' : 'SYST_OFFLINE'}
            </span>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            className="p-2 border border-white/10 text-secondary transition-colors"
          >
            <Bell size={20} />
          </motion.button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
          className="bg-surface/80 backdrop-blur-2xl border border-white/10 p-2 rounded-3xl flex items-center justify-between shadow-2xl shadow-black/50 pointer-events-auto"
        >
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
          <NavItem to="/study" icon={BookOpen} label="Focus" />
          <NavItem to="/subjects" icon={Layers} label="Hub" />
          <NavItem to="/notes" icon={StickyNote} label="Vault" />
          <NavItem to="/activity" icon={Activity} label="Activity" />
        </motion.nav>
      </div>
    </div>
  );
};

export default MobileLayout;
