import React, { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, BookOpen, StickyNote, 
  Cpu, Activity, Bell, Settings, Layers, X, 
  Trash2, Edit3, Plus, Clock, Target, Zap, BarChart3, Terminal,
  Navigation, Menu
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

const NavItem = ({ to, icon: Icon, label, showLabel = false, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      clsx(
        'relative flex flex-col items-center justify-center p-2 transition-all duration-300 group min-w-[44px] min-h-[44px]',
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
          <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        </motion.div>
        
        {showLabel ? (
          <span className={clsx(
            "text-[9px] font-mono font-bold uppercase tracking-wider mt-1 transition-colors relative z-10",
            isActive ? "text-background" : "text-secondary group-hover:text-primary"
          )}>
            {label}
          </span>
        ) : (
          label && (
            <span className="absolute -top-10 bg-surface border border-primary/20 px-2 py-1 text-[10px] font-mono font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block whitespace-nowrap">
              {`> ${label}`}
            </span>
          )
        )}
      </>
    )}
  </NavLink>
);

const SystemMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-surface border-t border-primary/30 z-[70] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-5 border-b border-white/5">
           <h2 className="text-xs font-mono font-black uppercase tracking-[0.3em] text-primary">System_Index</h2>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-secondary"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto grid grid-cols-3 gap-4 pb-12">
          <NavItem to="/goals" icon={Target} label="Goals" showLabel onClick={onClose} />
          <NavItem to="/habits" icon={Zap} label="Habits" showLabel onClick={onClose} />
          <NavItem to="/context" icon={Terminal} label="Context" showLabel onClick={onClose} />
          <NavItem to="/analytics" icon={BarChart3} label="Insights" showLabel onClick={onClose} />
          <NavItem to="/subjects" icon={Layers} label="Hub" showLabel onClick={onClose} />
          <NavItem to="/notes" icon={StickyNote} label="Vault" showLabel onClick={onClose} />
          <NavItem to="/activity" icon={Activity} label="Activity" showLabel onClick={onClose} />
          <NavItem to="/spatial" icon={Navigation} label="Map" showLabel onClick={onClose} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const AnimatedBackground = ({ weather }) => {
  const weatherCode = weather?.weatherCode;
  
  const isRainy = weatherCode !== undefined && 
    ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95);
  const isFoggy = weatherCode !== undefined && (weatherCode === 45 || weatherCode === 48);
  const isSunny = weatherCode !== undefined && (weatherCode === 0 || weatherCode === 1 || weatherCode === 2);

  const scanlineDuration = isRainy ? '1.5s' : '10s';
  const scanlineGradient = isRainy
    ? 'linear-gradient(to bottom, transparent 50%, rgba(0, 242, 255, 0.08) 50%)'
    : 'linear-gradient(to bottom, transparent 50%, rgba(0, 242, 255, 0.02) 50%)';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div 
        className="scanline-overlay" 
        style={{ 
          animationDuration: scanlineDuration,
          backgroundImage: scanlineGradient
        }} 
      />
      <div className="absolute inset-0 bg-noise opacity-[0.05] brightness-100 contrast-150 mix-blend-overlay"></div>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isSunny ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-amber-400/5 mix-blend-color-dodge pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isRainy ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-accent/5 pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ 
          opacity: isFoggy ? 1 : 0,
          backdropFilter: isFoggy ? 'blur(12px)' : 'blur(0px)'
        }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-white/[0.03] pointer-events-none"
      />
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
  const { currentCoords } = useSpatialAwareness();
  const { weather, loading } = useWeather(currentCoords);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

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

      <header className={clsx(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500 px-4 md:px-6 h-16 md:h-20 flex items-center justify-between",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-primary/20" : "bg-transparent"
      )}>
        <Link to="/" className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity group">
          <NariLogo size={window.innerWidth < 640 ? 32 : 44} />
          <div className="flex flex-col">
            <span className="font-black text-lg md:text-2xl tracking-tighter text-white leading-none uppercase italic glitch-text group-hover:text-primary transition-colors">NARI</span>
            <span className="text-[7px] md:text-[8px] font-mono text-primary/60 uppercase tracking-[0.4em] hidden sm:block">Personal_OS</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          {!loading && weather && (
            <Link 
              to="/weather"
              className="flex items-center gap-2 px-2 py-1.5 bg-surface/50 border border-primary/20 rounded-lg hover:border-primary/50 transition-all group shrink-0"
            >
              {getWeatherIcon(weather.weatherCode, weather.isDay, 12)}
              <span className="text-[10px] font-bold text-white font-mono leading-none group-hover:text-primary transition-colors hidden sm:inline">
                {weather.temperature}°C
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2 px-2 py-1.5 bg-surface/50 border border-primary/20 rounded-lg shrink-0">
            <motion.div 
              animate={(wsStatus === 'connected' && isOnline) ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className={clsx(
                "w-1.5 h-1.5 rounded-full",
                (wsStatus === 'connected' && isOnline) ? 'bg-success shadow-[0_0_8px_#00FF94]' : 'bg-danger shadow-[0_0_8px_#FF0055]'
              )} 
            />
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-secondary hidden lg:inline">
              {(wsStatus === 'connected' && isOnline) ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAssistantOpen(true)}
            className={clsx(
              "p-2 border transition-all relative rounded-xl shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center",
              isAssistantOpen ? "border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(0,242,255,0.3)] animate-pulse" : "border-white/10 text-secondary bg-surface/50"
            )}
          >
            <Cpu size={18} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 border border-white/10 text-secondary hover:text-white transition-all relative rounded-xl shrink-0 bg-surface/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Settings size={18} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1, color: '#00F2FF' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRemindersOpen(!isRemindersOpen)}
            className={clsx(
              "p-2 border transition-all relative rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center",
              triggeredReminders.length > 0 ? "border-danger text-danger bg-danger/10 shadow-[0_0_15px_rgba(255,0,85,0.3)] animate-pulse" : "border-white/10 text-secondary bg-surface/50"
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
                    className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                          <button onClick={() => handleEdit(reminder)} className="p-2 text-secondary hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => { if(window.confirm('Purge signal?')) actions.remove(reminder.id) }} className="p-2 text-secondary hover:text-danger min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      {reminder.status === 'triggered' && (
                        <button 
                          onClick={() => actions.dismiss(reminder.id)}
                          className="w-full mt-3 py-3 bg-danger text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white transition-colors min-h-[44px]"
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
                  className="w-full py-4 bg-surface border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/5 transition-all min-h-[44px]"
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
      
      <SystemMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className={clsx(
        "relative z-10 flex flex-col",
        location.pathname === '/spatial' 
          ? "h-screen w-screen overflow-hidden pt-16 bg-background" 
          : "min-h-screen pt-20 pb-28 px-4 md:px-8 max-w-7xl mx-auto"
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

      <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[280px] md:max-w-lg px-4 pointer-events-auto">
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
          className="bg-surface/90 backdrop-blur-2xl border border-primary/20 p-1.5 rounded-2xl flex items-center justify-between shadow-2xl shadow-black/50"
        >
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
          <NavItem to="/study" icon={BookOpen} label="Focus" />
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="relative flex flex-col items-center justify-center p-2 transition-all duration-300 group min-w-[44px] min-h-[44px] text-secondary hover:text-primary"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
          >
            <Menu size={22} />
          </button>
        </motion.nav>
      </div>
    </div>
  );
};

export default MobileLayout;
