import React, { useState, useEffect } from 'react';
import { useCreateSubject, useUpdateSubject } from '../../hooks/useStudy';
import { X, Plus, Tag as TagIcon, BarChart3, Calendar, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const SubjectForm = ({ onClose, initialData = null }) => {
  const isEditing = !!initialData;
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [priority, setPriority] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setDifficulty(initialData.difficulty || 3);
      setPriority(initialData.priority || 0);
      setExamDate(initialData.exam_date ? initialData.exam_date.split('T')[0] : '');
      setTags(initialData.tags ? initialData.tags.join(', ') : '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      difficulty: parseInt(difficulty),
      priority: parseInt(priority),
      exam_date: examDate || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    if (isEditing) {
      updateSubject.mutate({ id: initialData.id, ...payload }, {
        onSuccess: () => onClose?.()
      });
    } else {
      createSubject.mutate(payload, {
        onSuccess: () => onClose?.()
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-background border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-lg w-full relative"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
            {isEditing ? <Save size={20} /> : <Plus size={20} />}
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            {isEditing ? 'Modify Directive' : 'New Directive'}
          </h2>
        </div>
        <motion.button 
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="text-secondary hover:text-white p-2 bg-white/5 rounded-xl transition-colors"
        >
          <X size={20} />
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Subject Designation</label>
          <input
            autoFocus
            type="text"
            required
            placeholder="e.g. QUANTUM COMPUTING"
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all font-bold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Mission Parameters</label>
          <textarea
            placeholder="Describe the learning objectives..."
            rows={3}
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all font-medium"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <BarChart3 size={12} className="text-accent" /> Difficulty
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="5"
                className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">/ 5</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Calendar size={12} className="text-primary" /> Evaluation
            </label>
            <input
              type="date"
              className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold color-scheme-dark"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <TagIcon size={12} className="text-primary" /> Classifiers
          </label>
          <input
            type="text"
            placeholder="tech, math, logic..."
            className="w-full bg-surface/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button" 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-white/10 text-secondary font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
          >
            Abort
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={createSubject.isPending || updateSubject.isPending}
            className="flex-1 py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEditing ? <Save size={16} /> : <Plus size={16} />}
            {isEditing ? 'Update Directive' : 'Execute Plan'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default SubjectForm;
