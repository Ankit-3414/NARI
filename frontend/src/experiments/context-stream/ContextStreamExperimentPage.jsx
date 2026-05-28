import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Circle,
  Clock,
  Edit3,
  Pause,
  Play,
  Plus,
  Square,
  Target,
  Trash2,
  Zap,
} from 'lucide-react';
import { useTasks, useCompleteTask } from '../../hooks/useTasks';
import { useActiveSession, useTodayStudyStats, useStudyActions } from '../../hooks/useStudy';
import { useDashboardSummary } from '../../hooks/useAnalytics';
import { useReminders } from '../../hooks/useReminders';
import { useGoals, useUpdateGoalProgress, useDeleteGoal } from '../../hooks/useGoals';
import RealTimeClock from '../../components/common/RealTimeClock';
import ContextInput from '../../components/common/ContextInput';
import PwaInstallButton from '../../components/ui/PwaInstallButton';
import HabitWidget from '../../components/habits/HabitWidget';
import Modal from '../../components/common/Modal';
import TaskForm from '../../components/tasks/TaskForm';
import GoalForm from '../../components/goals/GoalForm';
import ContextMemoryPanel from './ContextMemoryPanel';
import ExperimentErrorBoundary from './ExperimentErrorBoundary';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const StatCard = ({ icon: Icon, label, value, colorClass, shadowClass, gradientClass }) => (
  <motion.div
    variants={item}
    whileHover={{ y: -5, scale: 1.02 }}
    className="group relative overflow-hidden rounded-3xl p-[1px]"
  >
    <div className={clsx('absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100', gradientClass)} />

    <div className="glass-card relative z-10 flex h-full flex-col gap-4 overflow-hidden rounded-[23px] bg-surface/80 p-5">
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl transition-transform duration-700 group-hover:scale-150" />

      <div className="flex items-start justify-between">
        <div className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-background/50 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3', colorClass, shadowClass)}>
          <Icon size={24} />
        </div>
        <ArrowUpRight size={18} className="translate-x-2 text-secondary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </div>

      <div>
        <p className="text-3xl font-black tracking-tighter text-white tabular-nums md:text-4xl">{value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary md:text-[11px]">{label}</p>
      </div>
    </div>
  </motion.div>
);

const ContextStreamExperimentPage = () => {
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

  const activeTasks = tasks?.filter((task) => task.status !== 'done' && task.status !== 'cancelled') || [];
  const triggeredRemindersCount = reminders?.filter((reminder) => reminder.status === 'triggered').length || 0;

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
    <ExperimentErrorBoundary>
    <motion.div
      className="space-y-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.header
        variants={item}
        className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-center"
      >
        <div className="space-y-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-warning">
            Experimental Sandbox
          </div>
          <h1 className="glitch-text text-4xl font-black uppercase italic tracking-tighter text-white md:text-6xl">
            Context Stream Lab
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#00F2FF] animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-secondary">
              Real data // Isolated route // Today page untouched
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex-1 sm:flex-none">
            <RealTimeClock />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface/50 p-2 pr-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Activity size={24} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase leading-tight tracking-widest text-primary/60">Experiment</span>
              <span className="font-mono text-sm font-black uppercase tracking-tighter text-success">ACTIVE</span>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.section variants={item} className="space-y-6">
        <ContextInput />
        <ContextMemoryPanel />
      </motion.section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
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

      <motion.section variants={item}>
        <PwaInstallButton />
      </motion.section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeSession && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="group relative"
              >
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-xl transition duration-1000 animate-pulse-slow group-hover:opacity-50" />
                <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-background p-6 md:flex-row md:p-8">
                  <motion.div
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 z-0 h-[2px] bg-primary/50 shadow-[0_0_20px_#00F2FF]"
                  />

                  <div className="relative z-10 flex items-center gap-6">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/5 bg-surface/50 backdrop-blur-xl">
                        <BookOpen size={32} className="text-primary animate-pulse" />
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-[-4px] rounded-full border-t-2 border-r-2 border-primary/50"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-[-8px] rounded-full border-b-2 border-l-2 border-accent/50"
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#00F2FF] animate-pulse" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Deep Focus</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                          Subject {activeSession.subject_id}
                        </span>
                        <span className="text-sm font-medium text-secondary">{activeSession.goal_text || 'Standard Protocol'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/5 bg-surface/50 p-2 backdrop-blur-md">
                    {activeSession.status === 'running' ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => pause()} className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning transition-colors hover:bg-warning hover:text-black">
                        <Pause size={20} fill="currentColor" />
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resume()} className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success transition-colors hover:bg-success hover:text-black">
                        <Play size={20} fill="currentColor" />
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => stop()} className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger transition-colors hover:bg-danger hover:text-black">
                      <Square size={20} fill="currentColor" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.section variants={item} className="glass-card rounded-[2rem] p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <CheckSquare size={20} />
                </div>
                <h2 className="text-lg font-black uppercase tracking-widest text-white">Active Tasks</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
              >
                <Plus size={16} /> Add
              </motion.button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="h-20 animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-white/10 bg-surface/30 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success/50">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-white">All objectives cleared</p>
                    <p className="text-sm text-secondary">System is standing by for new inputs.</p>
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
                      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-background/50 p-4 transition-all duration-300 hover:bg-surface-light"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 origin-center scale-y-0 bg-primary transition-transform group-hover:scale-y-100" />

                      <button
                        onClick={() => completeTask(task.id)}
                        className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-secondary text-transparent transition-all hover:border-success hover:text-success hover:shadow-[0_0_10px_rgba(0,255,148,0.3)]"
                      >
                        <Circle size={12} fill="currentColor" />
                      </button>
                      <div className="z-10 min-w-0 flex-1">
                        <h4 className="truncate font-bold text-slate-200 transition-colors group-hover:text-white">{task.title}</h4>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className={clsx(
                            'rounded border border-white/5 bg-background px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
                            task.priority === 'urgent' ? 'text-danger shadow-[0_0_5px_rgba(255,0,85,0.2)]'
                              : task.priority === 'high' ? 'text-warning shadow-[0_0_5px_rgba(255,184,0,0.2)]'
                                : 'text-primary'
                          )}>
                            {task.priority}
                          </span>
                          {task.estimated_minutes && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-secondary">
                              <Clock size={12} /> {task.estimated_minutes}m
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} className="z-10 text-secondary transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.section>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <motion.div variants={item}>
            <HabitWidget />
          </motion.div>

          <motion.section variants={item} className="glass-card rounded-[2rem] p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Target size={20} />
                </div>
                <h2 className="text-lg font-black uppercase tracking-widest text-white">Directives</h2>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              {goals?.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-surface/30 py-8 text-center">
                  <p className="text-sm text-secondary">No strategic objectives defined.</p>
                </div>
              ) : (
                goals?.map((goal) => (
                  <div key={goal.id} className="group space-y-4 rounded-2xl border border-white/5 bg-background/50 p-5 transition-colors hover:border-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-bold leading-tight text-white transition-colors group-hover:text-accent">{goal.title}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => handleEditGoal(goal)} className="p-1 text-slate-600 transition-colors hover:text-white">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 text-slate-600 transition-colors hover:text-danger">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => updateGoalProgress({ id: goal.id, increment: 1 })}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-surface text-secondary shadow-lg transition-all hover:border-primary hover:bg-primary hover:text-black"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase text-secondary">
                        <span>Progress</span>
                        <span className="text-primary">{goal.current_value} / {goal.target_value} {goal.scope}</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/5 bg-surface">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (goal.current_value / (goal.target_value || 1)) * 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-white/20 hover:bg-white/5"
            >
              <Plus size={16} />
              New Directive
            </motion.button>
          </motion.section>
        </div>
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
        <TaskForm onClose={() => setIsTaskModalOpen(false)} />
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={handleCloseGoalModal}>
        <GoalForm onClose={handleCloseGoalModal} initialData={editingGoal} />
      </Modal>
    </motion.div>
    </ExperimentErrorBoundary>
  );
};

export default ContextStreamExperimentPage;
