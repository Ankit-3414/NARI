import React, { useState } from 'react';
import { useCreateGoal } from '../../hooks/useGoals';
import Button from '../common/Button';
import { X, Plus, Target, Calendar, List } from 'lucide-react';

const GoalForm = ({ onClose }) => {
  const createGoal = useCreateGoal();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('weekly');
  const [target, setTarget] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createGoal.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      scope,
      target_value: target ? parseInt(target) : undefined,
      due_date: dueDate || undefined,
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
          <Target size={20} className="text-primary" />
          Set New Goal
        </h2>
        <button onClick={onClose} className="text-secondary hover:text-slate-100 p-1">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Goal Title</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="What do you want to achieve?"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <List size={12} /> Scope
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Target Date
            </label>
            <input
              type="date"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Target Value (Optional)</label>
          <input
            type="number"
            placeholder="e.g. 10 (hours, tasks, etc.)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={createGoal.isPending}>
            Set Goal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;
