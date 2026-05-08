import React, { useState } from 'react';
import { useCreateHabit } from '../../hooks/useHabits';
import Button from '../common/Button';
import { X, Plus, Repeat } from 'lucide-react';

const HabitForm = ({ onClose }) => {
  const createHabit = useCreateHabit();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    createHabit.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      target_count: parseInt(target),
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
          New Habit
        </h2>
        <button onClick={onClose} className="text-secondary hover:text-slate-100 p-1">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Habit Name</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. Meditate"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Description (Optional)</label>
          <input
            type="text"
            placeholder="Why do you do this?"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Repeat size={12} /> Frequency
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Target (per day/week)</label>
            <input
              type="number"
              min="1"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={createHabit.isPending}>
            Add Habit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HabitForm;
