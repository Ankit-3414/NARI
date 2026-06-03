import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks, useCompleteTask } from '../hooks/useTasks';
import { useActiveSession, useTodayStudyStats, useStudyActions } from '../hooks/useStudy';
import { useDashboardSummary } from '../hooks/useAnalytics';
import { useReminders } from '../hooks/useReminders';
import { useGoals, useUpdateGoalProgress, useDeleteGoal } from '../hooks/useGoals';
import { useWeather } from '../hooks/useWeather';
import { getWeatherIcon } from '../utils/weather';
import RealTimeClock from '../components/common/RealTimeClock';
import PwaInstallButton from '../components/ui/PwaInstallButton';
import HabitWidget from '../components/habits/HabitWidget';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import GoalForm from '../components/goals/GoalForm';
import { 
  CheckCircle2, Circle, Clock, BookOpen, Play, Pause, 
  Square, Bell, Plus, Target, Zap, ChevronRight, ArrowUpRight, Activity, CheckSquare,
  Trash2, Edit3, CloudRain, Sun, Wind, Thermometer
} from 'lucide-react';
import { clsx } from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const StatCard = ({ icon: Icon, label, value, colorClass, shadowClass, gradientClass }) => (
  <motion.div 
    variants={item}
    whileHover={{ y: -5, scale: 1.02 }}
    className="relative p-[1px] rounded-3xl overflow-hidden group"
  >
    {/* Animated Border Gradient */}
    <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r", gradientClass)} />
    
    <div className="relative h-full glass-card p-4 md:p-5 flex flex-col gap-3 md:gap-4 bg-surface/80 rounded-[23px] z-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
      
      <div className="flex justify-between items-start">
        <div className={clsx(`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-background/50 border border-white/5 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3`, colorClass, shadowClass)}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <ArrowUpRight size={18} className="text-secondary" />
        </div>
      </div>
      
      <div>
        <p className="text-2xl md:text-4xl font-black text-white tabular-nums tracking-tighter">{value}</p>
        <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-secondary mt-0.5 md:mt-1">{label}</p>
      </div>
    </div>
  </motion.div>
);

const TodayPage = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: summary } = useDashboardSummary();
  const { mutate: completeTask } = useCompleteTask();
  const { data: activeSession } = useActiveSession();
  const { data: stats } = useTodayStudyStats();
  const { data: reminders } = useReminders({ include_triggered: true });
  const { data: goals } = useGoals();
  const { mutate: updateGoalProgress } = useUpdateGoalProgress();
  const deleteGoal = useDeleteGoal();
  const { pause, resume, stop } = useStudyActions();
  const { weather, loading: weatherLoading } = useWeather();

  const activeTasks = tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled') || [];
  const triggeredRemindersCount = reminders?.filter(r => r.status === 'triggered').length || 0;

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Terminate this strategic objective?')) {
      deleteGoal.mutate(id);
    }
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <motion.div 
      className="space-y-6 md:space-y-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Dynamic Welcome Header */}
      <motion.header 
        variants={item}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12"
      >
        <div className="space-y-1">
          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic glitch-text">
            Operational Overview
          </h1>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00F2FF]" />
            <p className="text-secondary font-mono text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] uppercase">
              System Health: Optimal // Neural Link Established
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex-1 sm:flex-none">
            <RealTimeClock />
          </div>
          
          {/* Weather Mini-Widget in Header */}
          <div className="flex items-center gap-3 bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-2 pr-4 md:pr-6 min-h-[56px] md:min-h-[64px]">
            {weatherLoading ? (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                 <CloudRain size={20} className="text-white/20" />
              </div>
            ) : weather ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, 24)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest leading-tight">{weather.city}</span>
                  <span className="text-sm md:text-lg font-black text-white uppercase tracking-tighter font-mono">{weather.temperature}°C</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-danger/10 flex items-center justify-center border border-danger/20">
                  <Wind size={20} className="text-danger" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-danger/60 uppercase tracking-widest leading-tight">Sensors</span>
                  <span className="text-xs font-black text-danger/80 uppercase tracking-tighter font-mono">OFFLINE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          icon={Clock} 
          label="Focus Time" 
          value={`${stats?.total_hours || 0}h`}
          colorClass="text-primary"
          shadowClass="shadow-[0_0_30px_rgba(0,242,255,0.2)]"
          gradientClass="from-primary to-accent"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Tasks Done" 
          value={summary?.tasks_done_today || 0}
          colorClass="text-success"
          shadowClass="shadow-[0_0_30px_rgba(0,255,148,0.2)]"
          gradientClass="from-success to-primary"
        />
        <StatCard 
          icon={Zap} 
          label="Active Streak" 
          value={summary?.max_habit_streak || 0}
          colorClass="text-warning"
          shadowClass="shadow-[0_0_30px_rgba(255,184,0,0.2)]"
          gradientClass="from-warning to-danger"
        />
        <StatCard 
          icon={Bell} 
          label="Alerts" 
          value={triggeredRemindersCount}
          colorClass="text-danger"
          shadowClass="shadow-[0_0_30px_rgba(255,0,85,0.2)]"
          gradientClass="from-danger to-accent"
        />
      </div>

      {/* PWA Deployment Trigger */}
      <motion.section variants={item}>
        <PwaInstallButton />
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Tasks & Focus */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          
          {/* Enhanced Active Session - High Tech HUD Style */}
          <AnimatePresence mode="wait">
            {activeSession && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-[1.5rem] md:rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse-slow"></div>
                <div className="relative bg-background border border-white/10 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                  {/* Background scanner line */}
                  <motion.div 
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-primary/50 shadow-[0_0_20px_#00F2FF] z-0"
                  />
                  
                  <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/5 bg-surface/50 flex items-center justify-center backdrop-blur-xl">
                        <BookOpen size={28} className="md:w-8 md:h-8 text-primary animate-pulse" />
                      </div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-4px] rounded-full border-t-2 border-r-2 border-primary/50"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-8px] rounded-full border-b-2 border-l-2 border-accent/50"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1 md:mb-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00F2FF]" />
                        <h3 className="font-black text-xl md:text-2xl text-white tracking-tighter uppercase truncate">Deep Focus</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-mono font-bold uppercase tracking-wider">
                          Subject {activeSession.subject_id}
                        </span>
                        <span className="text-secondary text-xs md:text-sm font-medium truncate">{activeSession.goal_text || 'Standard Protocol'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10 bg-surface/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md w-full md:w-auto justify-center">
                    {activeSession.status === 'running' ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => pause()} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-warning/10 text-warning hover:bg-warning hover:text-black flex items-center justify-center transition-colors">
                        <Pause size={18} className="md:w-5 md:h-5" fill="currentColor" />
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resume()} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-success/10 text-success hover:bg-success hover:text-black flex items-center justify-center transition-colors">
                        <Play size={18} className="md:w-5 md:h-5" fill="currentColor" />
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => stop()} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-black flex items-center justify-center transition-colors">
                      <Square size={18} className="md:w-5 md:h-5" fill="currentColor" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Optimized Task List */}
          <motion.section variants={item} className="glass-card p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <CheckSquare size={18} className="md:w-5 md:h-5" />
                </div>
                <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-white">Active Tasks</h2>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 font-bold text-[10px] md:text-xs uppercase tracking-wider"
              >
                <Plus size={14} className="md:w-4 md:h-4" /> Add
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="py-8 md:py-12 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl bg-surface/30">
                   <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-success/10 flex items-center justify-center text-success/50">
                     <CheckCircle2 size={24} className="md:w-8 md:h-8" />
                   </div>
                   <div>
                     <p className="text-white font-bold text-sm md:text-base">All objectives cleared</p>
                     <p className="text-secondary text-[10px] md:text-sm">System is standing by for new inputs.</p>
                   </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {activeTasks.map((task, index) => (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative overflow-hidden bg-background/50 hover:bg-surface-light border border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all duration-300"
                    >
                      {/* Left glowing edge on hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                      
                      <button 
                        onClick={() => completeTask(task.id)}
                        className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-secondary flex items-center justify-center text-transparent hover:border-success hover:text-success hover:shadow-[0_0_10px_rgba(0,255,148,0.3)] transition-all z-10 shrink-0"
                      >
                        <Circle size={10} className="md:w-3 md:h-3" fill="currentColor" />
                      </button>
                      <div className="flex-1 min-w-0 z-10">
                        <h4 className="font-bold text-slate-200 text-sm md:text-base truncate group-hover:text-white transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={clsx(
                            "px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-background border border-white/5",
                            task.priority === 'urgent' ? 'text-danger shadow-[0_0_5px_rgba(255,0,85,0.2)]' : 
                            task.priority === 'high' ? 'text-warning shadow-[0_0_5px_rgba(255,184,0,0.2)]' : 'text-primary'
                          )}>
                            {task.priority}
                          </span>
                          {task.estimated_minutes && (
                            <span className="text-[9px] md:text-[10px] text-secondary font-mono flex items-center gap-1">
                              <Clock size={10} /> {task.estimated_minutes}m
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all z-10 shrink-0" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>
        </div>

        {/* Right Column: Habits & Goals */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <motion.div variants={item}>
             <HabitWidget />
          </motion.div>

          <motion.section variants={item} className="glass-card p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  <Target size={18} className="md:w-5 md:h-5" />
                </div>
                <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-white">Directives</h2>
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4 mb-6">
              {goals?.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl bg-surface/30">
                  <p className="text-secondary text-[10px] md:text-sm">No strategic objectives defined.</p>
                </div>
              ) : (
                goals?.map(goal => (
                  <div key={goal.id} className="bg-background/50 border border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl space-y-3 md:space-y-4 hover:border-white/10 transition-colors group">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-xs md:text-sm font-bold text-white leading-tight group-hover:text-accent transition-colors">{goal.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditGoal(goal)} className="p-1 text-slate-600 hover:text-white transition-colors">
                            <Edit3 size={10} className="md:w-3 md:h-3" />
                          </button>
                          <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 text-slate-600 hover:text-danger transition-colors">
                            <Trash2 size={10} className="md:w-3 md:h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => updateGoalProgress({ id: goal.id, increment: 1 })}
                          className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-lg md:rounded-xl bg-surface border border-white/5 text-secondary flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all shadow-lg"
                        >
                          <Plus size={14} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="flex justify-between items-center text-[8px] md:text-[10px] font-mono uppercase text-secondary">
                        <span>Progress</span>
                        <span className="text-primary">{goal.current_value} / {goal.target_value} {goal.scope}</span>
                      </div>
                      <div className="relative h-1.5 md:h-2 w-full bg-surface rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl bg-surface border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] md:text-xs hover:bg-white/5 hover:border-white/20 transition-all"
            >
              <Plus size={14} className="md:w-4 md:h-4" />
              New Directive
            </motion.button>
          </motion.section>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
        <TaskForm onClose={() => setIsTaskModalOpen(false)} />
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={handleCloseGoalModal}>
        <GoalForm onClose={handleCloseGoalModal} initialData={editingGoal} />
      </Modal>
    </motion.div>
  );
};

export default TodayPage;
