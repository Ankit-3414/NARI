import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotes, useNoteActions } from '../../hooks/useNotes';
import { useSubjects } from '../../hooks/useStudy';
import { 
  Search, Plus, ChevronRight, Save, X, Hash, 
  StickyNote, Trash2, Edit3, Calendar, Activity, Zap
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const NoteEditor = ({ note, onSave, onCancel, onRemove }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content_markdown || '');
  const [subjectId, setSubjectId] = useState(note?.subject_id || '');
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
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { if(window.confirm('Purge this fragment from memory?')) onRemove(note.id); }}
              className="p-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-black transition-all border border-danger/20"
            >
              <Trash2 size={20} />
            </motion.button>
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
      
      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 max-w-4xl mx-auto w-full">
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

const NoteCard = ({ note, onClick }) => (
  <motion.button 
    variants={item}
    layout
    onClick={onClick}
    className="w-full text-left glass-card p-6 flex items-center justify-between group border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden"
  >
    {/* Glow Line */}
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />

    <div className="min-w-0 flex-1 z-10">
      <h3 className="font-black text-xl text-white truncate mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">{note.title}</h3>
      <div className="flex items-center gap-4 text-[10px] text-secondary font-bold uppercase tracking-[0.2em]">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-primary/60" />
          <span>{format(parseISO(note.updated_at), 'MMM d, yyyy')}</span>
        </div>
        {note.subject_id && (
          <div className="flex items-center gap-1 text-accent">
            <Hash size={12} />
            <span>Sector {note.subject_id}</span>
          </div>
        )}
      </div>
    </div>
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-700 group-hover:text-primary group-hover:bg-primary/10 transition-all z-10">
      <ChevronRight size={20} />
    </div>
  </motion.button>
);

const NotesDashboard = () => {
  const { data: notes, isLoading, error } = useNotes();
  const noteActions = useNoteActions();
  const [isEditing, setIsEditing] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
         <div className="h-16 bg-white/5 animate-pulse rounded-2xl" />
         {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-danger font-mono uppercase tracking-widest">System Error: Fragment Access Denied.</div>;

  const filteredNotes = notes?.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content_markdown.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSave = (data) => {
    if (activeNote) {
      noteActions.update({ id: activeNote.id, ...data });
    } else {
      noteActions.create(data);
    }
    setIsEditing(false);
    setActiveNote(null);
  };

  const handleRemove = (id) => {
    noteActions.remove(id);
    setIsEditing(false);
    setActiveNote(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto relative min-h-[calc(100vh-8rem)] pb-32">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              <StickyNote size={24} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">The Vault</h1>
          </div>
          <p className="text-secondary font-mono text-xs tracking-widest ml-16">Stored Fragments: {notes?.length || 0}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Query database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-700"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveNote(null); setIsEditing(true); }}
            className="hidden sm:flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all"
          >
            <Plus size={20} /> New Entry
          </motion.button>
        </div>
      </motion.header>

      {filteredNotes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card rounded-[3rem] border border-dashed border-white/10"
        >
          <Zap size={64} className="mx-auto text-primary/20 mb-6 animate-pulse" />
          <p className="text-xl font-bold text-white mb-2">Vault Empty.</p>
          <p className="text-secondary text-sm font-medium">Capture a new fragment of knowledge?</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 px-8 py-3 rounded-xl border border-primary text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-black transition-all"
            onClick={() => { setActiveNote(null); setIsEditing(true); }}
          >
            Begin Capture
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredNotes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onClick={() => { setActiveNote(note); setIsEditing(true); }} 
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {isEditing && (
          <NoteEditor 
            note={activeNote} 
            onSave={handleSave} 
            onRemove={handleRemove}
            onCancel={() => { setIsEditing(false); setActiveNote(null); }} 
          />
        )}
      </AnimatePresence>

      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setActiveNote(null); setIsEditing(true); }}
        className="sm:hidden fixed bottom-24 right-6 w-16 h-16 bg-primary text-black rounded-[1.5rem] shadow-[0_0_40px_rgba(0,242,255,0.5)] flex items-center justify-center z-50 border border-white/20"
      >
        <Plus size={32} />
      </motion.button>
    </div>
  );
};

export default NotesDashboard;
