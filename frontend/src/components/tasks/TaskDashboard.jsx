import React from 'react';
import { useTasks, useCompleteTask } from '../../hooks/useTasks';
import { CheckCircle2, Circle, Clock, Tag } from 'lucide-react';
import { format, isToday, isPast, parseISO } from 'date-fns';

const TaskItem = ({ task }) => {
  const completeMutation = useCompleteTask();
  const isDone = task.status === 'done';

  return (
    <div className={`flex items-center gap-3 p-4 mb-2 card transition-opacity ${isDone ? 'opacity-50' : ''}`}>
      <button 
        onClick={() => !isDone && completeMutation.mutate(task.id)}
        className={`flex-shrink-0 transition-colors ${isDone ? 'text-success' : 'text-secondary hover:text-primary'}`}
      >
        {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${isDone ? 'line-through text-secondary' : 'text-slate-100'}`}>
          {task.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && !isDone ? 'text-danger font-medium' : 'text-secondary'}`}>
              <Clock size={12} />
              {isToday(parseISO(task.due_date)) ? 'Today' : format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
          {task.tags?.map(tag => (
            <span key={tag} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {task.priority === 'high' || task.priority === 'urgent' && (
        <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'urgent' ? 'bg-danger' : 'bg-accent'}`} />
      )}
    </div>
  );
};

const TaskDashboard = () => {
  const { data: tasks, isLoading, error } = useTasks();

  if (isLoading) return <div className="p-8 text-center text-secondary">Loading your day...</div>;
  if (error) return <div className="p-8 text-center text-danger">Failed to load tasks.</div>;

  const pendingTasks = tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled') || [];
  const todayTasks = pendingTasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));
  const otherTasks = pendingTasks.filter(t => !t.due_date || !isToday(parseISO(t.due_date)));

  return (
    <div className="p-4 max-w-lg mx-auto">
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary">Today</h2>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{todayTasks.length}</span>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 text-center">Nothing due today. Take a break!</p>
        ) : (
          todayTasks.map(task => <TaskItem key={task.id} task={task} />)
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary">Upcoming & Backlog</h2>
        </div>
        {otherTasks.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 text-center">Clear skies ahead.</p>
        ) : (
          otherTasks.map(task => <TaskItem key={task.id} task={task} />)
        )}
      </section>
    </div>
  );
};

export default TaskDashboard;
