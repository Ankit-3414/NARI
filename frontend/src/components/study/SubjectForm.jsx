import React, { useState } from 'react';
import { useCreateSubject } from '../../hooks/useStudy';
import Button from '../common/Button';
import { X, Plus, Tag as TagIcon, BarChart3, Calendar } from 'lucide-react';

const SubjectForm = ({ onClose }) => {
  const createSubject = useCreateSubject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [priority, setPriority] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    createSubject.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      difficulty: parseInt(difficulty),
      priority: parseInt(priority),
      exam_date: examDate || undefined,
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
          New Subject
        </h2>
        <button onClick={onClose} className="text-secondary hover:text-slate-100 p-1">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Subject Name</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. Computer Science"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Description (Optional)</label>
          <textarea
            placeholder="What are you learning?"
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <BarChart3 size={12} /> Difficulty (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Exam Date
            </label>
            <input
              type="date"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
            <TagIcon size={12} /> Tags
          </label>
          <input
            type="text"
            placeholder="college, tech, math"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={createSubject.isPending}>
            Create Subject
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
