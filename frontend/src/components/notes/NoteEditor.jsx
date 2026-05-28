import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubjects } from '../../hooks/useStudy';
import { ChevronRight, Save, X, History, Trash2, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import VersionHistory from './VersionHistory';

const NoteEditor = ({ note, onSave, onCancel, onRemove, onRestore }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content_markdown || '');
  const [subjectId, setSubjectId] = useState(note?.subject_id || '');
  const [showHistory, setShowHistory] = useState(false);
  const { data: subjects } = useSubjects();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col md:inset-4 md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-2xl overflow-hidden"
    >
      <header className="h-20 bg-surface/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel} 
            className="p-2.5 rounded-xl bg-white/5 text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </motion.button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-black uppercase tracking-widest text-white leading-none">
              {note ? 'Edit Fragment' : 'New Fragment'}
            </h2>
            <span className="text-[9px] font-mono text-primary uppercase tracking-[0.3em]">System.IO</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {note && (
            <>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHistory(!showHistory)}
                className={clsx(
                  "p-2.5 rounded-xl transition-all border",
                  showHistory ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(0,242,255,0.4)]" : "bg-white/5 text-secondary border-white/5 hover:border-white/20"
                )}
              >
                <History size={20} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { if(window.confirm('Purge this fragment from memory?')) onRemove(note.id); }}
                className="p-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-black transition-all border border-danger/20"
              >
                <Trash2 size={20} />
              </motion.button>
            </>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSave({ title, content_markdown: content, subject_id: subjectId ? parseInt(subjectId) : null })}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
          >
            <Save size={18} /> Save
          </motion.button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 max-w-4xl mx-auto w-full relative">
        <AnimatePresence>
          {showHistory && (
            <VersionHistory 
              noteId={note.id} 
              onClose={() => setShowHistory(false)} 
              onRestore={(vId) => {
                onRestore({ id: note.id, versionId: vId });
                setShowHistory(false);
              }}
            />
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-primary" />
             <input 
              type="text" 
              placeholder="ENTRY_DESIGNATION" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-3xl md:text-5xl font-black text-white outline-none placeholder:text-slate-800 uppercase tracking-tighter"
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center ml-4">
            <div className="relative">
              <select 
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="appearance-none bg-surface/50 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors outline-none cursor-pointer pr-10"
              >
                <option value="" className="bg-background">General Knowledge</option>
                {subjects?.map(s => <option key={s.id} value={s.id} className="bg-background">{s.name.toUpperCase()}</option>)}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-slate-600" />
            </div>
            
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
            
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest flex items-center gap-2">
               <Activity size={12} /> Auto-Sync Active
            </span>
          </div>
        </div>

        <textarea 
          placeholder="INITIATING_THOUGHT_CAPTURE..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[50vh] bg-transparent text-slate-300 outline-none resize-none leading-relaxed placeholder:text-slate-800 text-lg md:text-xl font-medium"
        />
      </div>
    </motion.div>
  );
};

export default NoteEditor;