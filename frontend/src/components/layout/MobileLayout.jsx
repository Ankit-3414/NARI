import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BookOpen, StickyNote, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex flex-col items-center justify-center flex-1 h-full transition-colors",
      isActive ? "text-primary" : "text-secondary hover:text-slate-200"
    )}
  >
    <Icon size={22} />
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </NavLink>
);

const MobileLayout = () => {
  const location = useLocation();
  
  // Map paths to titles for the Top Bar
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/study')) return 'Focus';
    if (path.startsWith('/notes')) return 'Notes';
    return 'NARI';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 h-14 bg-surface/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-slate-100">{getTitle()}</h1>
        <button className="p-2 text-secondary hover:text-slate-100">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-slate-800 flex items-center justify-around z-20 pb-safe">
        <NavItem to="/" icon={LayoutDashboard} label="Home" />
        <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
        <NavItem to="/study" icon={BookOpen} label="Study" />
        <NavItem to="/notes" icon={StickyNote} label="Notes" />
      </nav>
    </div>
  );
};

export default MobileLayout;
