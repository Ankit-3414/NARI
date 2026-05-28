import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks, useDeleteTask } from '../../hooks/useTasks';
import { 
  CheckSquare, Plus, Search, Sparkles
} from 'lucide-react';
import { isToday } from 'date-fns';
import { parseUTC } from '../../utils/datetime';
import Modal from '../common/Modal';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import TaskHistory from './TaskHistory';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TaskDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: tasks, isLoading, error } = useTasks();
  const deleteTask = useDeleteTask();

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleInspect = (task) => {
    setActiveTask(task);
    setIsHistoryOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Purge this objective from the system?')) {
      deleteTask.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setActiveTask(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 glass-card animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-danger font-mono uppercase tracking-widest">System Error: Failed to retrieve objectives.</div>;

  const filteredTasks = tasks?.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const pendingTasks = filteredTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const todayTasks = pendingTasks.filter(t => t.due_date && isToday(parseUTC(t.due_date)));
  const otherTasks = pendingTasks.filter(t => !t.due_date || !isToday(parseUTC(t.due_date)));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto relative min-h-[calc(100vh-8rem)] pb-32">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              <CheckSquare size={24} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Objectives</h1>
          </div>
          <p className="text-secondary font-mono text-xs tracking-widest ml-16">Active Directives: {pendingTasks.length}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search objectives..."
              className="w-full bg-surface/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
          >
            <Plus size={16} /> New Objective
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Priority: Today</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/20 font-bold font-mono">
              {todayTasks.length} ACTIVE
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {todayTasks.length === 0 ? (
              <motion.div variants={item} className="py-12 glass-card rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 border-dashed border-white/10">
                <Sparkles size={32} className="text-primary/40" />
                <div>
                  <p className="text-white font-bold text-lg">No critical objectives today.</p>
                  <p className="text-secondary text-sm">System resources optimal.</p>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {todayTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onInspect={handleInspect}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-secondary">Backlog</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherTasks.length === 0 && todayTasks.length > 0 ? (
               <motion.div variants={item} className="col-span-full py-8 text-center bg-surface/30 rounded-[2rem] border border-white/5">
                 <p className="text-secondary text-sm font-mono uppercase tracking-widest">Backlog empty.</p>
               </motion.div>
            ) : otherTasks.length === 0 && todayTasks.length === 0 ? (
              null
            ) : (
              <AnimatePresence mode="popLayout">
                {otherTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onInspect={handleInspect}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </motion.div>

      {/* Floating Action Button (Mobile) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-24 right-6 w-16 h-16 bg-primary text-black rounded-[1.5rem] shadow-[0_0_40px_rgba(0,242,255,0.5)] flex items-center justify-center z-50 border border-white/20"
      >
        <Plus size={32} />
      </motion.button>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <TaskForm onClose={handleCloseModal} initialData={editingTask} />
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={handleCloseHistory}>
        <TaskHistory taskId={activeTask?.id} onClose={handleCloseHistory} />
      </Modal>
    </div>
  );
};

export default TaskDashboard;