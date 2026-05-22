import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminders, useReminderActions } from '../hooks/useReminders';
import { 
  Bell, Plus, Clock, X, Trash2, Edit3, Save, 
  CheckCircle2, AlertTriangle, Zap, Search, Activity
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { parseUTC } from '../utils/datetime';
import Modal from '../components/common/Modal';
import ReminderForm from '../components/reminders/ReminderForm';
import { clsx } from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const ReminderCard = ({ reminder, onEdit, onRemove, onDismiss, onSnooze, onToggleActive }) => {
  const isTriggered = reminder.status === 'triggered';
  const isActive = reminder.is_active;

  return (
    <motion.div 
      variants={item}
      layout
      className={clsx(
        "group relative glass-card p-5 rounded-[2rem] border-white/5 transition-all duration-300 flex flex-col gap-4",
        isTriggered ? "bg-danger/5 border-danger/20 shadow-[0_0_30px_rgba(255,0,85,0.05)]" : "bg-surface/50",
        !isActive && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-xl border transition-all",
            isTriggered ? "bg-danger/20 text-danger border-danger/30 animate-pulse" : 
            isActive ? "bg-white/5 text-secondary border-white/5" : "bg-black/20 text-slate-600 border-white/5"
          )}>
            <Bell size={18} />
          </div>
          <div className="min-w-0">
            <h3 className={clsx(
              "font-black uppercase tracking-tight truncate transition-colors",
              isTriggered ? "text-danger" : 
              isActive ? "text-white group-hover:text-primary" : "text-slate-500"
            )}>
              {reminder.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx(
                "text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-lg border",
                isTriggered ? "bg-danger/10 border-danger/10 text-danger" : "bg-background/50 border-white/5 text-secondary"
              )}>
                {isActive ? reminder.status : 'inactive'}
              </span>
              <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <Clock size={10} /> {format(parseUTC(reminder.due_at), 'MMM d, HH:mm')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Active/Deactivate Toggle */}
          <button 
            onClick={() => onToggleActive(reminder.id, !isActive)}
            className={clsx(
              "w-8 h-4 rounded-full relative transition-all duration-300",
              isActive ? "bg-primary/40" : "bg-white/10"
            )}
          >
            <div className={clsx(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
              isActive ? "left-4.5 bg-primary shadow-[0_0_8px_#00F2FF]" : "left-0.5 bg-slate-600"
            )} />
          </button>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(reminder)} className="p-2 text-secondary hover:text-white transition-colors">
              <Edit3 size={14} />
            </button>
            <button onClick={() => onRemove(reminder.id)} className="p-2 text-secondary hover:text-danger transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isTriggered ? (
          <button 
            onClick={() => onDismiss(reminder.id)}
            className="flex-1 py-2 rounded-xl bg-danger text-black font-black uppercase tracking-widest text-[9px] hover:bg-white transition-all shadow-lg"
          >
            Acknowledge
          </button>
        ) : (
          <button 
            disabled 
            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-700 font-bold uppercase tracking-widest text-[9px] cursor-default"
          >
            {isActive ? 'Signal Armed' : 'Signal Offline'}
          </button>
        )}
        <button 
          onClick={() => onSnooze(reminder.id)}
          className="px-4 py-2 rounded-xl bg-surface-light border border-white/5 text-secondary hover:text-white font-bold uppercase tracking-widest text-[9px] transition-all"
        >
          Snooze
        </button>
      </div>
    </motion.div>
  );
};

const RemindersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const { data: reminders, isLoading, error } = useReminders({ include_triggered: true });
  const actions = useReminderActions();

  if (isLoading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
       <div className="h-20 bg-white/5 animate-pulse rounded-[2rem]" />
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-[2rem]" />)}
       </div>
    </div>
  );

  if (error) return <div className="p-8 text-center text-danger font-mono uppercase tracking-widest">System Error: Signal Retrieval Failed.</div>;

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleRemove = (id) => {
    if (window.confirm('Purge this signal from the broadcast queue?')) {
      actions.remove(id);
    }
  };

  const scheduled = reminders?.filter(r => r.status === 'scheduled' || r.status === 'snoozed') || [];
  const triggered = reminders?.filter(r => r.status === 'triggered') || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex items-end justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,85,0.2)]">
              <Bell size={24} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Signal Center</h1>
          </div>
          <p className="text-secondary font-mono text-xs tracking-widest ml-16">Active Signals: {reminders?.length || 0}</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingReminder(null); setIsModalOpen(true); }}
          className="hidden sm:flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-danger text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(255,0,85,0.4)] transition-all"
        >
          <Plus size={20} /> Arm New
        </motion.button>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Triggered Section */}
        <section className="lg:col-span-4 space-y-6">
           <div className="flex items-center gap-3 px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-danger">Triggered</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-danger/30 to-transparent" />
          </div>
          
          <AnimatePresence mode="popLayout">
            {triggered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 glass-card rounded-[2rem] text-center border-dashed border-white/5 bg-surface/20">
                 <CheckCircle2 size={32} className="mx-auto text-success/20 mb-4" />
                 <p className="text-secondary text-[10px] font-bold uppercase tracking-widest">No active alerts</p>
              </motion.div>
            ) : (
              triggered.map(r => (
                <ReminderCard 
                  key={r.id} 
                  reminder={r} 
                  onEdit={handleEdit} 
                  onRemove={handleRemove}
                  onDismiss={actions.dismiss}
                  onSnooze={(id) => actions.snooze({ id, minutes: 15 })}
                  onToggleActive={(id, active) => actions.update({ id, is_active: active })}
                />
              ))
            )}
          </AnimatePresence>
        </section>

        {/* Scheduled Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Queue</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {scheduled.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 text-center">
                  <Activity size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Signal queue empty.</p>
                </motion.div>
              ) : (
                scheduled.map(r => (
                  <ReminderCard 
                    key={r.id} 
                    reminder={r} 
                    onEdit={handleEdit} 
                    onRemove={handleRemove}
                    onDismiss={actions.dismiss}
                    onSnooze={(id) => actions.snooze({ id, minutes: 15 })}
                    onToggleActive={(id, active) => actions.update({ id, is_active: active })}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setEditingReminder(null); setIsModalOpen(true); }}
        className="sm:hidden fixed bottom-24 right-6 w-16 h-16 bg-danger text-black rounded-[1.5rem] shadow-[0_0_40px_rgba(255,0,85,0.5)] flex items-center justify-center z-50 border border-white/20"
      >
        <Plus size={32} />
      </motion.button>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingReminder(null); }}>
        <ReminderForm onClose={() => { setIsModalOpen(false); setEditingReminder(null); }} initialData={editingReminder} />
      </Modal>
    </div>
  );
};

export default RemindersPage;
