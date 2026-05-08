import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabits, useCompleteHabit } from '../../hooks/useHabits';
import Card from '../common/Card';
import Modal from '../common/Modal';
import HabitForm from './HabitForm';
import { CheckCircle2, Circle, Plus, Flame } from 'lucide-react';

const HabitWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: habits, isLoading } = useHabits();
  const { mutate: completeHabit } = useCompleteHabit();

  if (isLoading) return <div className="animate-pulse h-40 bg-[#111111] rounded-2xl"></div>;

  const handleComplete = (habitId) => {
    completeHabit({ habitId });
  };

  return (
    <Card title="Daily Habits" className="h-full bg-[#111111] border-slate-800 rounded-2xl shadow-xl">
      <div className="space-y-3">
        {habits?.length === 0 && (
          <p className="text-slate-500 text-sm font-medium tracking-wide">No habits tracked yet.</p>
        )}
        <AnimatePresence>
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
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                  isCompletedToday 
                    ? 'bg-success/5 border-success/20' 
                    : 'bg-[#1A1A1A] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-bold tracking-wide ${isCompletedToday ? 'text-slate-300 line-through' : 'text-slate-200'}`}>
                    {habit.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center mt-1">
                    <Flame size={10} className={isCompletedToday ? "text-orange-500 mr-1" : "mr-1"} /> 
                    Streak: {habit.current_streak}
                  </span>
                </div>
                <button 
                  onClick={() => !isCompletedToday && handleComplete(habit.id)}
                  className={`p-1 rounded-lg transition-all duration-300 ${
                    isCompletedToday 
                      ? 'text-success scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                      : 'text-slate-600 hover:text-primary hover:bg-primary/10 hover:scale-110 active:scale-95'
                  }`}
                  disabled={isCompletedToday}
                >
                  {isCompletedToday ? <CheckCircle2 size={24} fill="currentColor" className="text-success/20" /> : <Circle size={24} />}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <button 
          className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-secondary bg-[#1A1A1A] hover:bg-primary/10 hover:text-primary transition-all duration-300"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} className="mr-2" />
          Add habit
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <HabitForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </Card>
  );
};

export default HabitWidget;
