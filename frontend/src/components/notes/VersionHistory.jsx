import React from 'react';
import { motion } from 'framer-motion';
import { useNoteVersions } from '../../hooks/useNotes';
import { X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { parseUTC } from '../../utils/datetime';

const VersionHistory = ({ noteId, onRestore, onClose }) => {
  const { data: versions, isLoading } = useNoteVersions(noteId);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-80 bg-surface/95 backdrop-blur-3xl border-l border-white/10 z-[70] flex flex-col shadow-2xl"
    >
      <header className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Neural History</h3>
          <span className="text-[9px] font-mono text-primary uppercase tracking-widest">Temporal Fragments</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-secondary transition-colors">
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />)}
          </div>
        ) : versions?.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw size={32} className="mx-auto text-slate-800 mb-4 opacity-20" />
            <p className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">No previous states found.</p>
          </div>
        ) : (
          versions?.map((v, i) => (
            <div key={v.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-[10px] font-mono text-primary font-bold">V.{versions.length - i}</span>
                <span className="text-[10px] text-slate-500 font-mono">{format(parseUTC(v.created_at), 'HH:mm:ss')}</span>
              </div>
              
              <div className="mb-4 relative z-10">
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">
                  {format(parseUTC(v.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                  {v.content_markdown.substring(0, 60)}...
                </p>
              </div>

              <button 
                onClick={() => { if(window.confirm('Restore this temporal state?')) onRestore(v.id); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black text-[10px] font-black uppercase tracking-widest transition-all relative z-10"
              >
                <RotateCcw size={12} /> Rollback
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default VersionHistory;