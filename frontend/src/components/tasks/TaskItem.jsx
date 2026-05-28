import React from 'react';
import { motion } from 'framer-motion';
import { useCompleteTask } from '../../hooks/useTasks';
import { CheckCircle2, Circle, Clock, Tag, Trash2, Edit3, Activity } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { parseUTC } from '../../utils/datetime';
import { clsx } from 'clsx';

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TaskItem = ({ task, onEdit, onDelete, onInspect }) => {
  const completeMutation = useCompleteTask();
  const isDone = task.status === 'done';

  return (
    <motion.div 
      variants={item}
      layout
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
      className={clsx(
        "group relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4",
        isDone ? "bg-background/20 border-white/5 opacity-50 grayscale" : "bg-surface/50 hover:bg-surface-light border-white/5 hover:border-white/20 glass-card"
      )}
    >
      {/* Priority Glow */}
      {!isDone && (task.priority === 'urgent' || task.priority === 'high') && (
        <div className={clsx(
          "absolute left-0 top-0 bottom-0 w-1 shadow-lg",
          task.priority === 'urgent' ? 'bg-danger shadow-danger/50' : 'bg-warning shadow-warning/50'
        )} />
      )}
      
      {!isDone && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      <button 
        onClick={() => !isDone && completeMutation.mutate(task.id)}
        className={clsx(
          "flex-shrink-0 mt-0.5 transition-all duration-300 z-10",
          isDone ? "text-success" : "text-secondary hover:text-success hover:scale-110 hover:shadow-[0_0_15px_rgba(0,255,148,0.4)] rounded-full"
        )}
      >
        {isDone ? <CheckCircle2 size={24} fill="currentColor" className="text-success/20" /> : <Circle size={24} />}
      </button>
      
      <div className="flex-1 min-w-0 z-10">
        <h3 className={clsx(
          "font-bold text-lg leading-tight transition-colors",
          isDone ? 'line-through text-secondary' : 'text-slate-200 group-hover:text-white'
        )}>
          {task.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
          {task.due_date && (
            <span className={clsx(
              "text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 px-2 py-0.5 rounded border",
              isPast(parseUTC(task.due_date)) && !isToday(parseUTC(task.due_date)) && !isDone 
                ? 'text-danger bg-danger/10 border-danger/20 shadow-[0_0_10px_rgba(255,0,85,0.2)]' 
                : isToday(parseUTC(task.due_date)) && !isDone
                ? 'text-primary bg-primary/10 border-primary/20'
                : 'text-secondary bg-background/50 border-white/5'
            )}>
              <Clock size={10} />
              {isToday(parseUTC(task.due_date)) ? 'Today' : format(parseUTC(task.due_date), 'MMM d')}
            </span>
          )}
          {task.priority && task.priority !== 'normal' && (
            <span className={clsx(
              "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
              task.priority === 'urgent' ? 'text-danger bg-danger/10' : 'text-warning bg-warning/10'
            )}>
              {task.priority}
            </span>
          )}
          {task.tags?.map(tag => (
            <span key={tag} className="text-[10px] font-bold tracking-wider text-secondary bg-white/5 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Task Actions */}
      {!isDone && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,242,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onInspect(task)}
            className="p-2 rounded-xl text-secondary hover:text-primary transition-colors"
          >
            <Activity size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(task)}
            className="p-2 rounded-xl text-secondary hover:text-white transition-colors"
          >
            <Edit3 size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,0,85,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task.id)}
            className="p-2 rounded-xl text-secondary hover:text-danger transition-colors"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default TaskItem;