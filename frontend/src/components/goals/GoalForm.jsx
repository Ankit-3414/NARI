import React, { useState, useEffect } from 'react';
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals';
import { X, Plus, Target, Calendar, List, Save, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const GoalForm = ({ onClose, initialData = null }) => {
  const isEditing = !!initialData;
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('weekly');
  const [target, setTarget] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setScope(initialData.scope || 'weekly');
      setTarget(initialData.target_value || '');
      setDueDate(initialData.due_date ? initialData.due_date.split('T')[0] : '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      scope,
      target_value: target ? parseInt(target) : null,
      due_date: dueDate || null,
    };

    if (isEditing) {
      updateGoal.mutate({ id: initialData.id, ...payload }, {
        onSuccess: () => onClose?.()
      });
    } else {
      createGoal.mutate(payload, {
        onSuccess: () => onClose?.()
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-background border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full relative"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
      
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl text-accent border border-accent/20">
            {isEditing ? <Save size={20} /> : <Target size={20} />}
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            {isEditing ? 'Modify Directive' : 'New Directive'}
          </h2>
        </div>
        <button onClick={onClose} className="text-secondary hover:text-white p-2 bg-white/5 rounded-xl transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-accent uppercase tracking-[0.2em] ml-1">Directive Objective</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. STRATEGIC_ASCENSION"
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all font-bold uppercase tracking-tight"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <List size={12} className="text-primary" /> Scope
            </label>
            <select
              className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold appearance-none cursor-pointer"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="daily" className="bg-background">DIURNAL</option>
              <option value="weekly" className="bg-background">SEPTIMAL</option>
              <option value="monthly" className="bg-background">LUNAR</option>
              <option value="quarterly" className="bg-background">PHASE</option>
              <option value="yearly" className="bg-background">SOLAR</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Calendar size={12} className="text-primary" /> Deadline
            </label>
            <input
              type="date"
              className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold color-scheme-dark"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Target Magnitude</label>
          <div className="relative">
            <input
              type="number"
              placeholder="e.g. 100"
              className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Units</span>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">
            Abort
          </button>
          <button 
            type="submit" 
            disabled={createGoal.isPending || updateGoal.isPending}
            className="flex-1 py-4 rounded-2xl bg-accent text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(112,0,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEditing ? <Save size={16} /> : <Plus size={16} />}
            {isEditing ? 'Update Directive' : 'Engage'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default GoalForm;
