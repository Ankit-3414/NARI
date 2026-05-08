import React, { useState, useEffect } from 'react';
import { useCreateHabit, useUpdateHabit } from '../../hooks/useHabits';
import { X, Plus, Repeat, Save, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const HabitForm = ({ onClose, initialData = null }) => {
  const isEditing = !!initialData;
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setFrequency(initialData.frequency || 'daily');
      setTarget(initialData.target_count || 1);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      frequency,
      target_count: parseInt(target),
    };

    if (isEditing) {
      updateHabit.mutate({ id: initialData.id, ...payload }, {
        onSuccess: () => onClose?.()
      });
    } else {
      createHabit.mutate(payload, {
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-warning to-transparent" />
      
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-xl text-warning border border-warning/20">
            {isEditing ? <Save size={20} /> : <Zap size={20} />}
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            {isEditing ? 'Modify Pattern' : 'New Pattern'}
          </h2>
        </div>
        <button onClick={onClose} className="text-secondary hover:text-white p-2 bg-white/5 rounded-xl transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-warning uppercase tracking-[0.2em] ml-1">Pattern Designation</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. NEURAL_SYNCRONIZATION"
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-warning/50 focus:border-transparent transition-all font-bold uppercase tracking-tight"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Mission Rationale</label>
          <input
            type="text"
            placeholder="Why is this pattern essential?"
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-warning/50 transition-all font-medium"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Repeat size={12} className="text-primary" /> Recurrence
            </label>
            <select
              className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold appearance-none cursor-pointer"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily" className="bg-background">DIURNAL</option>
              <option value="weekly" className="bg-background">WEEKLY</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Plus size={12} className="text-primary" /> Target
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Ops</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">
            Abort
          </button>
          <button 
            type="submit" 
            disabled={createHabit.isPending || updateHabit.isPending}
            className="flex-1 py-4 rounded-2xl bg-warning text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(255,184,0,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEditing ? <Save size={16} /> : <Plus size={16} />}
            {isEditing ? 'Update Pattern' : 'Initialize'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default HabitForm;
