import React, { useState } from 'react';
import { useGoals, useUpdateGoalProgress, useDeleteGoal } from '../hooks/useGoals';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, CheckCircle2, Edit3, Trash2, Activity } from 'lucide-react';
import Modal from '../components/common/Modal';
import GoalForm from '../components/goals/GoalForm';

const GoalsPage = () => {
  const { data: goals, isLoading } = useGoals('active');
  const updateProgress = useUpdateGoalProgress();
  const deleteGoal = useDeleteGoal();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this directive?')) {
      deleteGoal.mutate(id);
    }
  };

  const handleProgress = (id, current, target) => {
    if (target && current < target) {
      updateProgress.mutate({ id, increment: 1 });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-40 glass-card rounded-[2rem]"></div>;
  }

  return (
    <div className="pb-20 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Target size={28} className="text-accent" /> Directives
        </h1>
        <button 
          onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
          className="p-3 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-black transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {(!goals || goals.length === 0) ? (
        <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl bg-surface/30">
          <p className="text-secondary text-sm font-mono uppercase tracking-widest">No active directives.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const progressPercent = goal.target_value 
                ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) 
                : 0;

              return (
                <motion.div 
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-surface">
                    {goal.target_value && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-accent"
                      />
                    )}
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-surface/50 text-secondary border border-white/5">
                          {goal.scope}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-xs text-secondary mt-1">{goal.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(goal)} className="p-1.5 bg-surface rounded-lg text-secondary hover:text-white transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="p-1.5 bg-surface rounded-lg text-secondary hover:text-danger transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {goal.target_value ? (
                        <>
                          <button 
                            onClick={() => handleProgress(goal.id, goal.current_value, goal.target_value)}
                            disabled={goal.current_value >= goal.target_value}
                            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-accent hover:bg-accent/10 transition-all disabled:opacity-50"
                          >
                            <Plus size={16} />
                          </button>
                          <div>
                            <span className="text-xl font-mono font-bold text-white">{goal.current_value}</span>
                            <span className="text-sm font-mono text-secondary"> / {goal.target_value}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-mono text-secondary flex items-center gap-2">
                          <Activity size={14} /> No specific target
                        </div>
                      )}
                    </div>
                    
                    {goal.target_value && goal.current_value >= goal.target_value && (
                      <div className="flex items-center gap-1 text-success text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-success/10 border border-success/20">
                        <CheckCircle2 size={12} /> Reached
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGoal(null); }}>
        <GoalForm onClose={() => { setIsModalOpen(false); setEditingGoal(null); }} initialData={editingGoal} />
      </Modal>
    </div>
  );
};

export default GoalsPage;
