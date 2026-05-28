import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Hash, ChevronRight, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { parseUTC } from '../../utils/datetime';
import { clsx } from 'clsx';

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const NoteCard = React.forwardRef(({ note, onClick, onRestore }, ref) => {
  const isArchived = !!note.archived_at;

  return (
    <motion.button 
      ref={ref}
      variants={item}
      layout
      onClick={() => onClick(note)}
      className={clsx(
        "w-full text-left glass-card p-6 flex items-center justify-between group border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden",
        isArchived && "opacity-60 grayscale-[0.5] border-dashed"
      )}
    >
      {/* Glow Line */}
      {!isArchived && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />}

      <div className="min-w-0 flex-1 z-10">
        <h3 className={clsx(
          "font-black text-xl truncate mb-2 uppercase tracking-tight transition-colors",
          isArchived ? "text-slate-500" : "text-white group-hover:text-primary"
        )}>
          {note.title}
        </h3>
        <div className="flex items-center gap-4 text-[10px] text-secondary font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className={clsx(isArchived ? "text-slate-600" : "text-primary/60")} />
            <span>{format(parseUTC(note.updated_at), 'MMM d, yyyy')}</span>
          </div>
          {note.subject_id && (
            <div className={clsx("flex items-center gap-1", isArchived ? "text-slate-600" : "text-accent")}>
              <Hash size={12} />
              <span>Sector {note.subject_id}</span>
            </div>
          )}
          {isArchived && (
            <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded border border-secondary/20">ARCHIVED</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 z-10">
        {isArchived ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onRestore(note.id); }}
            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all border border-primary/20"
            title="Restore Fragment"
          >
            <RotateCcw size={18} />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-700 group-hover:text-primary group-hover:bg-primary/10 transition-all">
            <ChevronRight size={20} />
          </div>
        )}
      </div>
    </motion.button>
  );
});

NoteCard.displayName = 'NoteCard';

export default NoteCard;