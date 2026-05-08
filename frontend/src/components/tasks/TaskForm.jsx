import React, { useState } from 'react';
import { useCreateTask } from '../../hooks/useTasks';
import Button from '../common/Button';
import { X, Plus, Calendar, Flag, Tag as TagIcon, Clock } from 'lucide-react';

const TaskForm = ({ onClose }) => {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    }, {
      onSuccess: () => {
        onClose?.();
      }
    });
  };

  return (
    <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Plus size={20} className="text-primary" />
          New Task
        </h2>
        <button onClick={onClose} className="text-secondary hover:text-slate-100 p-1">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Title</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="What needs to be done?"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Description (Optional)</label>
          <textarea
            placeholder="Add details..."
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Flag size={12} /> Priority
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Due Date
            </label>
            <input
              type="date"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} /> Est. Minutes
            </label>
            <input
              type="number"
              placeholder="e.g. 30"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <TagIcon size={12} /> Tags
            </label>
            <input
              type="text"
              placeholder="tag1, tag2"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={createTask.isPending}>
            Add Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
