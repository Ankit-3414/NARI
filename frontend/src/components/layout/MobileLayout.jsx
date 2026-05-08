import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BookOpen, StickyNote, Settings, Tag, Cpu, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

import { useUiStore } from '../../store/uiStore';
import RealTimeClock from '../common/RealTimeClock';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
      isActive ? "text-primary scale-110" : "text-secondary hover:text-slate-200 hover:scale-105"
    )}
  >
    <Icon size={22} className={({ isActive }) => (isActive ? "drop-shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" : "")} />
    <span className="text-[10px] mt-1 font-bold tracking-wide">{label}</span>
  </NavLink>
);

const MobileLayout = () => {
  const location = useLocation();
  const wsStatus = useUiStore((state) => state.wsStatus);
  
  // Map paths to titles for the Top Bar
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/study')) return 'Focus';
    if (path.startsWith('/notes')) return 'Notes';
    if (path.startsWith('/subjects')) return 'Subjects';
    if (path.startsWith('/reminders')) return 'Reminders';
    if (path.startsWith('/analytics')) return 'Analytics';
    if (path.startsWith('/activity')) return 'System Vault';
    return 'NARI';
  };

  const statusColor = {
    connected: 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    connecting: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
    disconnected: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D] text-slate-100 pb-16 selection:bg-primary/30">
      {/* Top App Bar - Glassmorphism */}
      <header className="sticky top-0 z-40 h-16 bg-[#0D0D0D]/70 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20">
            <Cpu size={18} className="text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-sm font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              NARI
            </h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider">{getTitle()}</span>
          </div>
        </div>

        {/* Right: Clock & Status */}
        <div className="flex items-center gap-4">
          <RealTimeClock />
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full transition-all duration-500", statusColor[wsStatus])} title={`WS: ${wsStatus}`} />
            <NavLink to="/activity" className={({ isActive }) => cn("p-2 text-secondary transition-colors", isActive ? "text-primary" : "hover:text-primary")}>
              <Database size={20} />
            </NavLink>
            <button className="p-2 -mr-2 text-secondary hover:text-primary transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Page Transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 overflow-x-hidden pt-4"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0D0D0D]/90 backdrop-blur-xl border-t border-slate-800/50 flex items-center justify-around z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <NavItem to="/" icon={LayoutDashboard} label="Home" />
        <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
        <NavItem to="/study" icon={BookOpen} label="Focus" />
        <NavItem to="/subjects" icon={Tag} label="Tags" />
        <NavItem to="/notes" icon={StickyNote} label="Notes" />
      </nav>
    </div>
  );
};

export default MobileLayout;
