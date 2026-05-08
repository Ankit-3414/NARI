import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminders, useReminderActions } from '../hooks/useReminders';
import { 
  Bell, Plus, Clock, X, Trash2, Edit3, Save, 
  CheckCircle2, AlertTriangle, Zap, Search, Activity
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import Modal from '../components/common/Modal';
import { clsx } from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const ReminderForm = ({ onClose, initialData = null }) => {
  const isEditing = !!initialData;
  const actions = useReminderActions();
  const [text, setText] = useState(initialData?.remind_text || '');
  const [remindAt, setRemindAt] = useState(initialData?.remind_at ? initialData.remind_at.split('.')[0] : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !remindAt) return;

    const payload = {
      remind_text: text.trim(),
      remind_at: remindAt,
    };

    if (isEditing) {
      actions.update({ id: initialData.id, ...payload });
    } else {
      actions.create(payload);
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-background border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full relative"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-danger to-transparent" />
      
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-danger/10 rounded-xl text-danger border border-danger/20">
            <Bell size={20} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            {isEditing ? 'Modify Alert' : 'New Alert'}
          </h2>
        </div>
        <button onClick={onClose} className="text-secondary hover:text-white p-2 bg-white/5 rounded-xl transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-danger uppercase tracking-[0.2em] ml-1">Alert Payload</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. SYSTEM_CHECK_REQUIRED"
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-transparent transition-all font-bold uppercase tracking-tight"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Clock size={12} className="text-primary" /> Trigger Timestamp
          </label>
          <input
            type="datetime-local"
            required
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold color-scheme-dark"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">
            Abort
          </button>
          <button 
            type="submit" 
            className="flex-1 py-4 rounded-2xl bg-danger text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(255,0,85,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {isEditing ? <Save size={16} /> : <Plus size={16} />}
            {isEditing ? 'Update Signal' : 'Arm Signal'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const ReminderCard = ({ reminder, onEdit, onRemove, onDismiss, onSnooze }) => {
  const isTriggered = reminder.status === 'triggered';
  const isExpired = isPast(parseISO(reminder.remind_at)) && reminder.status === 'pending';

  return (
    <motion.div 
      variants={item}
      layout
      className={clsx(
        "group relative glass-card p-5 rounded-[2rem] border-white/5 transition-all duration-300 flex flex-col gap-4",
        isTriggered ? "bg-danger/5 border-danger/20 shadow-[0_0_30px_rgba(255,0,85,0.05)]" : "bg-surface/50"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-xl border",
            isTriggered ? "bg-danger/20 text-danger border-danger/30 animate-pulse" : "bg-white/5 text-secondary border-white/5"
          )}>
            <Bell size={18} />
          </div>
          <div className="min-w-0">
            <h3 className={clsx(
              "font-black uppercase tracking-tight truncate transition-colors",
              isTriggered ? "text-danger" : "text-white group-hover:text-primary"
            )}>
              {reminder.remind_text}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx(
                "text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-lg border",
                isTriggered ? "bg-danger/10 border-danger/10 text-danger" : "bg-background/50 border-white/5 text-secondary"
              )}>
                {reminder.status}
              </span>
              <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <Clock size={10} /> {format(parseISO(reminder.remind_at), 'MMM d, HH:mm')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(reminder)} className="p-2 text-secondary hover:text-white transition-colors">
            <Edit3 size={14} />
          </button>
          <button onClick={() => onRemove(reminder.id)} className="p-2 text-secondary hover:text-danger transition-colors">
            <Trash2 size={14} />
          </button>
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
            Signal Armed
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
  const { data: reminders, isLoading, error } = useReminders();
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

  const pending = reminders?.filter(r => r.status === 'pending') || [];
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
                />
              ))
            )}
          </AnimatePresence>
        </section>

        {/* Pending Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Queue</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {pending.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 text-center">
                  <Activity size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Signal queue empty.</p>
                </motion.div>
              ) : (
                pending.map(r => (
                  <ReminderCard 
                    key={r.id} 
                    reminder={r} 
                    onEdit={handleEdit} 
                    onRemove={handleRemove}
                    onDismiss={actions.dismiss}
                    onSnooze={(id) => actions.snooze({ id, minutes: 15 })}
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
