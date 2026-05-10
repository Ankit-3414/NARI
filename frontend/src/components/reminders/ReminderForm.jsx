import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminderActions } from '../../hooks/useReminders';
import { useTodayTasks } from '../../hooks/useTasks';
import { useSubjects } from '../../hooks/useSubjects';
import { Bell, Clock, X, Save, Plus, Calendar as CalendarIcon, Zap, Layers, CheckSquare } from 'lucide-react';
import { format, addMinutes, addHours, addDays, parseISO, isValid } from 'date-fns';
import { clsx } from 'clsx';

const ReminderForm = ({ onClose, initialData = null }) => {
  const isEditing = !!initialData;
  const actions = useReminderActions();
  const { data: tasks } = useTodayTasks();
  const { data: subjects } = useSubjects();
  
  // State for raw datetime string
  const [remindAt, setRemindAt] = useState(
    initialData?.due_at 
      ? format(parseISO(initialData.due_at), "yyyy-MM-dd'T'HH:mm") 
      : format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm")
  );
  
  const [text, setText] = useState(initialData?.title || '');
  const [repeatRule, setRepeatRule] = useState(initialData?.repeat_rule || '');
  const [taskId, setTaskId] = useState(initialData?.task_id || '');
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || '');

  const applyPreset = (minutes) => {
    const newDate = addMinutes(new Date(), minutes);
    setRemindAt(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const setTomorrowAM = () => {
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(8, 0, 0, 0);
    setRemindAt(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !remindAt) return;

    const payload = {
      title: text.trim(),
      due_at: remindAt,
      repeat_rule: repeatRule || null,
      task_id: taskId ? parseInt(taskId) : null,
      subject_id: subjectId ? parseInt(subjectId) : null,
    };

    if (isEditing) {
      actions.update({ id: initialData.id, ...payload });
    } else {
      actions.create(payload);
    }
    onClose();
  };

  // Calculate relative time for preview
  const getTimePreview = () => {
    try {
      const target = parseISO(remindAt);
      if (!isValid(target)) return null;
      
      const now = new Date();
      const diffMs = target - now;
      if (diffMs < 0) return "Triggering Immediately";
      
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `In ${diffMins} minutes`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `In approximately ${diffHours} hours`;
      
      return `On ${format(target, 'MMM d')}`;
    } catch (e) {
      return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-background border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full relative"
    >
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent opacity-50" />
      
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-danger/10 rounded-xl text-danger border border-danger/20 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
              {isEditing ? 'Modify Signal' : 'New Signal'}
            </h2>
            <span className="text-[8px] font-mono text-danger/60 uppercase tracking-[0.3em]">Protocol_v3.4</span>
          </div>
        </div>
        <button onClick={onClose} className="text-secondary hover:text-white p-2 bg-white/5 rounded-xl transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Signal Label */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-danger uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Zap size={10} /> Signal Designation
          </label>
          <input
            autoFocus
            type="text"
            required
            placeholder="SYSTEM_ALERT_ID"
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-transparent transition-all font-black uppercase tracking-wider text-lg"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Time Calibration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} className="text-primary" /> Temporal Calibration
            </label>
            <span className="text-[10px] font-mono font-bold text-primary animate-pulse uppercase">
              {getTimePreview()}
            </span>
          </div>

          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <CalendarIcon size={18} className="text-secondary group-focus-within:text-primary transition-colors" />
             </div>
             <input
                type="datetime-local"
                required
                className="w-full bg-surface/50 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold text-lg color-scheme-dark"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
              />
          </div>

          {/* Quick Jump Presets */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '+15M', value: 15 },
              { label: '+1H', value: 60 },
              { label: '+4H', value: 240 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.value)}
                className="py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-secondary hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={setTomorrowAM}
              className="py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-secondary hover:text-accent hover:bg-accent/10 hover:border-accent/30 transition-all"
            >
              8AM
            </button>
          </div>
        </div>

        {/* Recurrence Calibration */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Zap size={10} className="text-warning" /> Recurrence Protocol
          </label>
          <select
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-warning/50 transition-all font-mono font-bold appearance-none cursor-pointer"
            value={repeatRule}
            onChange={(e) => setRepeatRule(e.target.value)}
          >
            <option value="">One-Time Directive</option>
            <option value="FREQ=DAILY">Daily Cycle</option>
            <option value="FREQ=WEEKLY">Weekly Cycle</option>
          </select>
        </div>

        {/* Tactical Links */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <CheckSquare size={10} className="text-primary" /> Linked Task
            </label>
            <select
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono appearance-none cursor-pointer"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">None</option>
              {tasks?.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Layers size={10} className="text-accent" /> Neural Hub
            </label>
            <select
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all font-mono appearance-none cursor-pointer"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">None</option>
              {subjects?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-5 rounded-2xl border border-white/10 text-secondary font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
          >
            Abort
          </button>
          <button 
            type="submit" 
            className="flex-1 py-5 rounded-2xl bg-danger text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(255,0,85,0.4)] transition-all flex items-center justify-center gap-2 group"
          >
            {isEditing ? <Save size={18} /> : <Plus size={18} />}
            <span className="group-hover:translate-x-1 transition-transform">
              {isEditing ? 'Update Signal' : 'Initialize Alert'}
            </span>
          </button>
        </div>
      </form>
      
      {/* System Decoration */}
      <div className="px-8 pb-6 flex justify-between items-center opacity-20 pointer-events-none">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 bg-white" />)}
        </div>
        <span className="text-[6px] font-mono text-white tracking-[0.5em]">NEURAL_LINK_STABLE</span>
      </div>
    </motion.div>
  );
};

export default ReminderForm;
