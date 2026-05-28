import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotes, useNoteActions } from '../../hooks/useNotes';
import { 
  Search, Plus, StickyNote, Zap, Archive
} from 'lucide-react';
import { clsx } from 'clsx';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const NotesDashboard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: notes, isLoading, error } = useNotes({ include_archived: showArchived });
  const noteActions = useNoteActions();

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

  const handleRestoreArchived = (id) => {
    if (window.confirm('Restore this fragment to active memory?')) {
      noteActions.restoreArchived(id);
    }
  };

  const filteredNotes = notes?.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content_markdown.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
         <div className="h-16 bg-white/5 animate-pulse rounded-2xl" />
         {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-danger font-mono uppercase tracking-widest">System Error: Fragment Access Denied.</div>;

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
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Neural Cache</h1>
          </div>
          <p className="text-secondary font-mono text-xs tracking-widest ml-16 uppercase opacity-60">
            {showArchived ? 'Archived' : 'Active'} Fragments: {notes?.length || 0}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3.5 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest",
              showArchived ? "bg-secondary text-black border-secondary" : "bg-white/5 text-secondary border-white/5 hover:border-white/20"
            )}
          >
            <Archive size={16} /> {showArchived ? 'Hide Archives' : 'View Archives'}
          </button>

          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Query database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                 onClick={(n) => {
                   if(n.archived_at) return;
                   setActiveNote(n); 
                   setIsEditing(true); 
                 }}
                onRestore={handleRestoreArchived}
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
            onRestore={noteActions.restore}
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