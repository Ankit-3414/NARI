import React, { useState } from 'react';
import { 
  useSubjects, useDeleteSubject, useArchiveSubject, useRestoreSubject 
} from '../hooks/useStudy';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/common/Modal';
import SubjectForm from '../components/study/SubjectForm';
import { 
  Plus, Archive, BarChart3, Calendar, Tag, BookOpen, 
  Trash2, Edit3, ChevronRight, Activity, Search, RotateCcw, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { parseUTC } from '../utils/datetime';
import { clsx } from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const SubjectCard = React.forwardRef(({ subject, onEdit, onDelete, onRestore }, ref) => {
  SubjectCard.displayName = 'SubjectCard';
  const isArchived = !!subject.archived_at;

  return (
    <motion.div 
      ref={ref}
      variants={item}
      layout
      className={clsx(
        "group relative glass-card p-6 md:p-8 rounded-[2rem] border-white/5 hover:border-white/10 transition-all duration-500 flex flex-col h-full overflow-hidden",
        isArchived && "opacity-60 grayscale-[0.5] border-dashed"
      )}
    >
      {/* Background Glow */}
      <div className={clsx(
        "absolute -top-24 -right-24 w-48 h-48 blur-[60px] rounded-full transition-colors duration-700",
        isArchived ? "bg-secondary/5" : "bg-primary/5 group-hover:bg-primary/10"
      )} />
      
      <div className="flex justify-between items-start mb-6 z-10">
        <div className="flex-1 min-w-0">
          <h3 className={clsx(
            "font-black text-2xl tracking-tighter uppercase italic truncate transition-colors",
            isArchived ? "text-secondary" : "text-white group-hover:text-primary"
          )}>
            {subject.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx("w-1.5 h-1.5 rounded-full", isArchived ? "bg-secondary" : "bg-primary")} />
            <span className="text-[10px] font-mono text-secondary uppercase tracking-[0.2em]">
              {isArchived ? 'Archived Sector' : 'Active Sector'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isArchived ? (
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,242,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRestore(subject.id)}
              className="p-2.5 rounded-xl bg-primary/10 text-primary hover:text-white transition-colors border border-primary/20"
              title="Restore Sector"
            >
              <RotateCcw size={16} />
            </motion.button>
          ) : (
            <React.Fragment>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(subject)}
                className="p-2.5 rounded-xl bg-white/5 text-secondary hover:text-white transition-colors border border-white/5"
              >
                <Edit3 size={16} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,0,85,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(subject.id)}
                className="p-2.5 rounded-xl bg-white/5 text-secondary hover:text-danger transition-colors border border-white/5"
              >
                <Archive size={16} />
              </motion.button>
            </React.Fragment>
          )}
        </div>
      </div>
    
    {subject.description ? (
      <p className="text-secondary text-sm font-medium mb-8 line-clamp-2 z-10 flex-grow leading-relaxed">
        {subject.description}
      </p>
    ) : (
      <div className="flex-grow mb-8 italic text-slate-700 text-xs">No mission parameters defined.</div>
    )}
    
    <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/5 z-10">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/50 border border-white/5">
        <BarChart3 size={12} className="text-accent" />
        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
          LVL {subject.difficulty}
        </span>
      </div>
      
      {subject.exam_date && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/50 border border-white/5">
          <Calendar size={12} className="text-primary" />
          <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
            {format(parseUTC(subject.exam_date), 'MMM d, yyyy').toUpperCase()}
          </span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-1.5">
        {subject.tags?.map(tag => (
          <span key={tag} className="text-[9px] font-bold bg-white/5 text-slate-400 px-2 py-0.5 rounded-lg border border-white/5 uppercase tracking-tighter">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
  );
});

const SubjectsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: subjects, isLoading, error } = useSubjects(showArchived);
  const archiveSubject = useArchiveSubject();
  const restoreSubject = useRestoreSubject();

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Archive this knowledge sector? All linked data will be preserved but hidden from active views.')) {
      archiveSubject.mutate(id);
    }
  };

  const handleRestore = (id) => {
    if (window.confirm('Restore this knowledge sector to the active network?')) {
      restoreSubject.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-20 bg-white/5 animate-pulse rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2rem]" />)}
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-danger font-mono uppercase tracking-[0.3em]">Critical Error: Failed to load sectors.</div>;

  const filteredSubjects = subjects?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              <BookOpen size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Knowledge Hub</h1>
          </div>
          <p className="text-secondary font-mono text-xs tracking-[0.3em] ml-16">
            {showArchived ? 'Archived' : 'Active'} Subjects: {subjects?.length || 0}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3.5 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest",
              showArchived ? "bg-secondary text-black border-secondary" : "bg-white/5 text-secondary border-white/5 hover:border-white/20"
            )}
          >
            <Archive size={16} /> {showArchived ? 'Hide Archives' : 'View Archives'}
          </button>
          
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Filter sectors..."
              className="w-full bg-surface/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all"
          >
            <Plus size={20} /> Initialize New
          </motion.button>
        </div>
      </motion.header>

      {filteredSubjects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card rounded-[3rem] border border-dashed border-white/10"
        >
          <Activity size={64} className="mx-auto text-primary/20 mb-6 animate-pulse" />
          <p className="text-xl font-bold text-white mb-2">No matching sectors found.</p>
          <p className="text-secondary text-sm font-medium">Ready to initialize new learning parameters?</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="outline" 
            className="mt-8 px-8 py-3 rounded-xl border border-primary text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-black transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            Initialize First Subject
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredSubjects.map(subject => (
              <SubjectCard 
                key={subject.id} 
                subject={subject} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestore={handleRestore}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mobile Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-primary text-black rounded-[1.5rem] shadow-[0_0_40px_rgba(0,242,255,0.5)] flex items-center justify-center z-50 border border-white/20"
      >
        <Plus size={32} />
      </motion.button>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <SubjectForm onClose={handleCloseModal} initialData={editingSubject} />
      </Modal>
    </div>
  );
};

export default SubjectsPage;
