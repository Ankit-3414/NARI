import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodayTasks, useCompleteTask } from '../hooks/useTasks';
import { useActiveSession, useTodayStudyStats, useStudyActions } from '../hooks/useStudy';
import { useDashboardSummary } from '../hooks/useAnalytics';
import { useReminders } from '../hooks/useReminders';
import { useGoals, useUpdateGoalProgress } from '../hooks/useGoals';
import HabitWidget from '../components/habits/HabitWidget';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import GoalForm from '../components/goals/GoalForm';
import { CheckCircle2, Circle, Clock, Flame, BookOpen, Play, Pause, Square, Bell, Plus, Target, TrendingUp } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TodayPage = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  const { data: tasks, isLoading: tasksLoading } = useTodayTasks();
  const { data: summary } = useDashboardSummary();
  const { mutate: completeTask } = useCompleteTask();
  const { data: activeSession } = useActiveSession();
  const { data: stats } = useTodayStudyStats();
  const { data: reminders } = useReminders();
  const { data: goals } = useGoals();
  const { mutate: updateGoalProgress } = useUpdateGoalProgress();
  const { pause, resume, stop } = useStudyActions();

  const activeTasks = tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled') || [];
  const triggeredRemindersCount = reminders?.filter(r => r.status === 'triggered').length || 0;

  return (
    <motion.div 
      className="p-4 space-y-6 max-w-4xl mx-auto pb-20"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">Today</h1>
          <p className="text-secondary text-sm font-medium tracking-wide">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/reminders" className="relative p-2 text-secondary hover:text-primary transition-colors">
          <Bell size={24} />
          {triggeredRemindersCount > 0 && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-danger rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
        </Link>
      </motion.header>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.2)]">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-secondary uppercase font-bold tracking-wider">Focus Time</p>
            <p className="text-xl font-bold text-slate-100">{stats?.total_hours || 0}h</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 shadow-lg hover:shadow-success/5 transition-all duration-300">
          <div className="p-2.5 bg-success/10 rounded-xl text-success shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-secondary uppercase font-bold tracking-wider">Tasks Done</p>
            <p className="text-xl font-bold text-slate-100">{summary?.tasks_done_today || 0}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Session Widget */}
          <AnimatePresence>
            {activeSession && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 p-5 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(var(--color-primary),0.15)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 animate-pulse" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/20 rounded-xl text-primary animate-pulse shadow-[0_0_20px_rgba(var(--color-primary),0.4)]">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-lg tracking-tight">Studying Subject #{activeSession.subject_id}</h3>
                      <p className="text-sm text-primary font-medium">{activeSession.goal_text || 'Deep Work Session'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {activeSession.status === 'running' ? (
                      <button onClick={() => pause()} className="p-3 rounded-xl bg-[#0D0D0D] border border-slate-700 text-primary hover:bg-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Pause size={20} fill="currentColor" />
                      </button>
                    ) : (
                      <button onClick={() => resume()} className="p-3 rounded-xl bg-[#0D0D0D] border border-slate-700 text-success hover:bg-success/20 transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                        <Play size={20} fill="currentColor" />
                      </button>
                    )}
                    <button onClick={() => stop()} className="p-3 rounded-xl bg-[#0D0D0D] border border-slate-700 text-danger hover:bg-danger/20 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <Square size={20} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Today's Tasks */}
          <motion.div variants={item}>
            <Card title="Today's Tasks" className="bg-[#111111] border-slate-800 rounded-2xl shadow-xl">
              <div className="space-y-2">
                {tasksLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-xl"></div>)}
                  </div>
                ) : activeTasks.length === 0 ? (
                  <p className="text-slate-500 text-sm font-medium py-6 text-center tracking-wide">No tasks due today. Enjoy your day!</p>
                ) : (
                  <AnimatePresence>
                    {activeTasks.map(task => (
                      <motion.div 
                        key={task.id} 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center space-x-4 p-3 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-slate-800 hover:border-slate-700 group transition-all"
                      >
                        <button 
                          onClick={() => completeTask(task.id)}
                          className="text-slate-600 hover:text-success transition-all hover:scale-110 active:scale-90"
                        >
                          <Circle size={22} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 truncate">{task.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={task.priority}>{task.priority}</Badge>
                            {task.estimated_minutes && (
                              <span className="text-[10px] text-slate-500 font-bold flex items-center tracking-wider">
                                <Clock size={10} className="mr-1 text-slate-600" /> {task.estimated_minutes}m
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <button 
                  className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-secondary bg-[#1A1A1A] hover:bg-primary/10 hover:text-primary transition-all duration-300"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus size={18} className="mr-2" />
                  Add a task
                </button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <motion.div variants={item} className="space-y-6">
          <HabitWidget />

          <Card title="Active Goals" className="bg-[#111111] border-slate-800 rounded-2xl shadow-xl">
            <div className="space-y-4">
              {goals?.length === 0 ? (
                <p className="text-slate-500 text-sm font-medium tracking-wide">No active goals.</p>
              ) : (
                goals?.map(goal => (
                  <div key={goal.id} className="space-y-2 bg-[#1A1A1A] p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-200 tracking-wide">{goal.title}</span>
                      <button 
                        onClick={() => updateGoalProgress({ id: goal.id, increment: 1 })}
                        className="text-primary hover:text-white bg-primary/10 hover:bg-primary p-1 rounded-md transition-all hover:scale-110 active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      <span>{goal.current_value} / {goal.target_value || '-'}</span>
                      <span>{goal.scope}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <button 
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-secondary bg-[#1A1A1A] hover:bg-primary/10 hover:text-primary transition-all duration-300"
                onClick={() => setIsGoalModalOpen(true)}
              >
                <Plus size={18} className="mr-2" />
                Set a goal
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
        <TaskForm onClose={() => setIsTaskModalOpen(false)} />
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)}>
        <GoalForm onClose={() => setIsGoalModalOpen(false)} />
      </Modal>
    </motion.div>
  );
};

export default TodayPage;
