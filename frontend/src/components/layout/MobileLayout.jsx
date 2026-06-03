import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, BookOpen, StickyNote, 
  Cpu, Activity, Bell, Settings, Layers, X, 
  Trash2, Edit3, Plus, Clock, Target, Zap, BarChart3, Terminal,
  Navigation
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useReminders, useReminderActions } from '../../hooks/useReminders';
import { useAlarm } from '../../hooks/useAlarm';
import { alarmService } from '../../utils/alarmService';
import { notificationService } from '../../utils/notificationService';
import ReminderForm from '../reminders/ReminderForm';
import Modal from '../common/Modal';
import SettingsModal from '../common/SettingsModal';
import AssistantDrawer from './AssistantDrawer';
import { format } from 'date-fns';
import { parseUTC } from '../../utils/datetime';
import NariLogo from '../common/NariLogo';
import { useWeather } from '../../hooks/useWeather';
import { getWeatherIcon } from '../../utils/weather';
import { useSpatialAwareness } from '../../hooks/useSpatialAwareness';

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

const AnimatedBackground = ({ weather }) => {
  const weatherCode = weather?.weatherCode;
  
  const isRainy = weatherCode !== undefined && 
    ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95);
  const isFoggy = weatherCode !== undefined && (weatherCode === 45 || weatherCode === 48);
  const isSunny = weatherCode !== undefined && (weatherCode === 0 || weatherCode === 1 || weatherCode === 2);

  // Scanline properties - falls faster during rain
  const scanlineDuration = isRainy ? '1.5s' : '10s';
  const scanlineGradient = isRainy
    ? 'linear-gradient(to bottom, transparent 50%, rgba(0, 242, 255, 0.08) 50%)'
    : 'linear-gradient(to bottom, transparent 50%, rgba(0, 242, 255, 0.02) 50%)';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Scanline overlay with dynamic animation speed */}
      <div 
        className="scanline-overlay" 
        style={{ 
          animationDuration: scanlineDuration,
          backgroundImage: scanlineGradient
        }} 
      />
      
      {/* Noise background */}
      <div className="absolute inset-0 bg-noise opacity-[0.05] brightness-100 contrast-150 mix-blend-overlay"></div>
      
      {/* Dynamic Grid Background - expands and shifts to amber when sunny */}
      <motion.div 
        animate={{ 
          backgroundSize: isSunny ? '80px 80px' : '60px 60px',
          opacity: isSunny ? 0.3 : 0.2
        }}
        style={{
          backgroundImage: isSunny 
            ? 'radial-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px)' 
            : 'radial-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px)'
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0 bg-grid"
      />
      
      {/* Weather Overlays */}
      {/* Sunny: Amber Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isSunny ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-amber-400/5 mix-blend-color-dodge pointer-events-none"
      />

      {/* Rainy: Cyan Tint Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isRainy ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-accent/5 pointer-events-none"
      />

      {/* Foggy: Misty Backdrop Blur & White haze */}
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ 
          opacity: isFoggy ? 1 : 0,
          backdropFilter: isFoggy ? 'blur(12px)' : 'blur(0px)'
        }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-white/[0.03] pointer-events-none"
      />
      
      {/* Pulse effect */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 left-0 w-full h-full bg-primary/5 pointer-events-none"
      />
    </div>
  );
};

const MobileLayout = () => {
  const wsStatus = useUiStore((state) => state.wsStatus);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { weather, loading } = useWeather();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // Initialize Neural Alarms
  const { isAlarming } = useAlarm();
  const { data: reminders } = useReminders({ include_triggered: true });
  const actions = useReminderActions();
  const triggeredReminders = reminders?.filter(r => r.status === 'triggered') || [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ensure AudioContext and Notifications are initialized on user interaction
  const handleUserInteraction = () => {
    alarmService.init();
    if (Notification.permission === 'default') {
      notificationService.requestPermission();
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setIsAddModalOpen(true);
  };

  return (
    <div 
      className="min-h-screen bg-background relative selection:bg-primary selection:text-background font-mono"
      onClick={handleUserInteraction}
    >
      <AnimatedBackground weather={weather} />

      {/* Alarm Overlay for Critical Status */}
      <AnimatePresence>
        {isAlarming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none border-[10px] border-danger/30 shadow-[inset_0_0_100px_rgba(255,0,85,0.2)]"
          />
        )}
      </AnimatePresence>

      {/* Top Header / HUD */}
      <header className={clsx(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500 px-6 h-20 flex items-center justify-between",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-primary/20" : "bg-transparent"
      )}>
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity group">
          <NariLogo size={44} />
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none uppercase italic glitch-text group-hover:text-primary transition-colors">NARI</span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-primary/60 uppercase tracking-[0.4em]">Personal_OS</span>
              <span className="text-[8px] font-mono text-accent animate-pulse">[v1.0.0-alpha.10]</span>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-1.5 md:gap-5">
          {/* Online/Offline Status */}
          {!isOnline && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/50 text-danger"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
            >
              <Zap size={12} className="animate-pulse" />
              <span className="text-[10px] font-black tracking-tighter uppercase">Offline Mode</span>
            </motion.div>
          )}

          {/* Weather Widget */}
          {!loading && weather && (
            <Link 
              to="/weather"
              aria-label={`Local weather is currently ${weather.condition} at ${weather.temperature}°C. Click for 3-day forecast details.`}
              className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-surface/50 border border-primary/20 rounded-lg md:rounded-none hover:border-primary/50 hover:bg-primary/5 transition-all group shrink-0"
            >
              {getWeatherIcon(weather.weatherCode, weather.isDay, 14)}
              <span className="text-[10px] font-bold text-white font-mono leading-none group-hover:text-primary transition-colors">
                {weather.temperature}°C
              </span>
            </Link>
          )}

          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2 md:px-4 py-1.5 bg-surface/50 border border-primary/20 rounded-lg md:rounded-none shrink-0">
            <motion.div 
              animate={(wsStatus === 'connected' && isOnline) ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className={clsx(
                "w-1.5 h-1.5 rounded-full",
                (wsStatus === 'connected' && isOnline) ? 'bg-success shadow-[0_0_8px_#00FF94]' : 'bg-danger shadow-[0_0_8px_#FF0055]'
              )} 
            />
            <span className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">
              {(wsStatus === 'connected' && isOnline) ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          
          <Link 
            to="/spatial"
            className={clsx(
              "p-1.5 md:p-2 border transition-all relative rounded-xl hover:text-primary hover:border-primary/50 shrink-0",
              location.pathname === '/spatial' 
                ? "border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(0,242,255,0.3)]" 
                : "border-white/10 text-secondary"
            )}
            title="Spatial OS Map"
          >
            <Navigation size={18} />
          </Link>
          
          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAssistantOpen(true)}
            className={clsx(
              "p-1.5 md:p-2 border transition-all relative rounded-xl shrink-0",
              isAssistantOpen ? "border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(0,242,255,0.3)] animate-pulse" : "border-white/10 text-secondary"
            )}
          >
            <Cpu size={18} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 md:p-2 border border-white/10 text-secondary hover:text-white transition-all relative rounded-xl shrink-0"
          >
            <Settings size={18} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRemindersOpen(!isRemindersOpen)}
            className={clsx(
              "p-2 border transition-all relative rounded-xl",
              triggeredReminders.length > 0 ? "border-danger text-danger bg-danger/10 shadow-[0_0_15px_rgba(255,0,85,0.3)] animate-pulse" : "border-white/10 text-secondary"
            )}
          >
            <Bell size={20} />
            {triggeredReminders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-black text-[10px] font-black flex items-center justify-center rounded-sm">
                {triggeredReminders.length}
              </span>
            )}
          </motion.button>
        </div>
      </header>

      {/* Reminders Slide-over Panel */}
      <AnimatePresence>
        {isRemindersOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRemindersOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[50]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-surface/90 backdrop-blur-2xl border-l border-white/10 z-[60] p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger/10 text-danger rounded-xl">
                    <Bell size={20} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Signals</h2>
                </div>
                <button onClick={() => setIsRemindersOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-secondary">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Active Signals</span>
                  <button 
                    onClick={() => { setEditingReminder(null); setIsAddModalOpen(true); }}
                    className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {reminders?.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-surface/30">
                    <p className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">No signals in queue.</p>
                  </div>
                ) : (
                  reminders?.map(reminder => (
                    <div 
                      key={reminder.id}
                      className={clsx(
                        "p-4 rounded-2xl border transition-all group",
                        reminder.status === 'triggered' ? "bg-danger/5 border-danger/20" : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            "font-bold uppercase tracking-tight truncate",
                            reminder.status === 'triggered' ? "text-danger" : "text-white"
                          )}>
                            {reminder.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={10} className="text-secondary" />
                            <span className="text-[9px] font-mono text-secondary uppercase">
                              {format(parseUTC(reminder.due_at), 'MMM d, HH:mm')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(reminder)} className="p-1 text-secondary hover:text-white">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => { if(window.confirm('Purge signal?')) actions.remove(reminder.id) }} className="p-1 text-secondary hover:text-danger">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      {reminder.status === 'triggered' && (
                        <button 
                          onClick={() => actions.dismiss(reminder.id)}
                          className="w-full mt-3 py-1.5 bg-danger text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <button 
                  onClick={() => { setEditingReminder(null); setIsAddModalOpen(true); }}
                  className="w-full py-4 bg-surface border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/5 transition-all"
                >
                  Configure New Signal
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingReminder(null); }}>
        <ReminderForm onClose={() => { setIsAddModalOpen(false); setEditingReminder(null); }} initialData={editingReminder} />
      </Modal>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <AnimatePresence>
        {isAssistantOpen && (
          <AssistantDrawer isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={clsx(
        "relative z-10 flex flex-col",
        location.pathname === '/spatial' 
          ? "h-screen w-screen overflow-hidden pt-20 bg-background" 
          : "min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={location.pathname === '/spatial'
              ? { opacity: 0 }
              : { opacity: 0, y: 20, filter: 'blur(10px)' }
            }
            animate={location.pathname === '/spatial'
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: 'blur(0px)' }
            }
            exit={location.pathname === '/spatial'
              ? { opacity: 0 }
              : { opacity: 0, y: -20, filter: 'blur(10px)' }
            }
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 h-full w-full min-h-0 relative"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none">
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
          className="bg-surface/80 backdrop-blur-2xl border border-white/10 p-2 rounded-3xl flex items-center justify-between shadow-2xl shadow-black/50 pointer-events-auto"
        >
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
          <NavItem to="/study" icon={BookOpen} label="Focus" />
          <NavItem to="/goals" icon={Target} label="Goals" />
          <NavItem to="/habits" icon={Zap} label="Habits" />
          <NavItem to="/context" icon={Terminal} label="Context" />
          <NavItem to="/analytics" icon={BarChart3} label="Insights" />
          <NavItem to="/subjects" icon={Layers} label="Hub" />
          <NavItem to="/notes" icon={StickyNote} label="Vault" />
          <NavItem to="/activity" icon={Activity} label="Activity" />
        </motion.nav>
      </div>
    </div>
  );
};

export default MobileLayout;
