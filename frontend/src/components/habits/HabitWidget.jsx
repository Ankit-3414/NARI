import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabits, useCompleteHabit, useDeleteHabit } from '../../hooks/useHabits';
import Modal from '../common/Modal';
import HabitForm from './HabitForm';
import { CheckCircle2, Circle, Plus, Flame, Sparkles, Trash2, Edit3, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const HabitWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  
  const { data: habits, isLoading } = useHabits();
  const { mutate: completeHabit } = useCompleteHabit();
  const deleteHabit = useDeleteHabit();

  if (isLoading) return <div className="animate-pulse h-40 glass-card rounded-[2rem]"></div>;

  const handleComplete = (habitId) => {
    completeHabit({ habitId });
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Erase this pattern from the system?')) {
      deleteHabit.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  return (
    <div className="glass-card p-6 md:p-8 rounded-[2rem]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg text-warning">
            <Sparkles size={20} />
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest text-white">Neural Patterns</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        {habits?.length === 0 && (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl bg-surface/30">
             <p className="text-secondary text-sm">No active tracking patterns.</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {habits?.map((habit) => {
            const isCompletedToday = habit.last_completed_at && 
              new Date(habit.last_completed_at).toDateString() === new Date().toDateString();

            return (
              <motion.div 
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                  isCompletedToday 
                    ? "bg-success/5 border-success/30 shadow-[0_0_20px_rgba(0,255,148,0.05)]" 
                    : "bg-background/50 border-white/5 hover:border-white/20 hover:bg-surface-light"
                )}
              >
                {/* Glowing line for active streak */}
                {!isCompletedToday && habit.current_streak > 2 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning shadow-[0_0_10px_rgba(255,184,0,0.5)]" />
                )}

                <div className="flex flex-col z-10 min-w-0">
                  <span className={clsx("text-sm font-bold tracking-wide transition-colors truncate", 
                    isCompletedToday ? 'text-secondary line-through' : 'text-slate-200 group-hover:text-white'
                  )}>
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-secondary font-mono font-bold uppercase tracking-wider flex items-center">
                      <Flame size={12} className={clsx("mr-1.5", isCompletedToday ? "text-success" : habit.current_streak > 2 ? "text-warning animate-pulse" : "text-secondary/50")} /> 
                      {habit.current_streak}
                    </span>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(habit)} className="p-1 text-slate-600 hover:text-white transition-colors">
                        <Edit3 size={10} />
                      </button>
                      <button onClick={() => handleDelete(habit.id)} className="p-1 text-slate-600 hover:text-danger transition-colors">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => !isCompletedToday && handleComplete(habit.id)}
                  className={clsx(
                    "p-1.5 rounded-xl transition-all duration-300 z-10 flex items-center justify-center border-2 shrink-0 ml-4",
                    isCompletedToday 
                      ? "text-success border-success bg-success/10 scale-110 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                      : "text-secondary border-secondary/50 hover:text-warning hover:border-warning hover:bg-warning/10 hover:scale-110 active:scale-95"
                  )}
                  disabled={isCompletedToday}
                >
                  {isCompletedToday ? <CheckCircle2 size={20} fill="currentColor" className="text-success/20" /> : <Circle size={20} fill="currentColor" className="text-transparent" />}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      <div className="mt-6">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center py-4 rounded-xl bg-surface border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:border-white/20 transition-all"
          onClick={() => { setEditingHabit(null); setIsModalOpen(true); }}
        >
          <Plus size={16} className="mr-2" />
          Add Pattern
        </motion.button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <HabitForm onClose={handleCloseModal} initialData={editingHabit} />
      </Modal>
    </div>
  );
};

export default HabitWidget;
