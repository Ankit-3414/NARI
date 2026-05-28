import React from 'react';
import { useTaskHistory } from '../../hooks/useTasks';
import { Activity, X } from 'lucide-react';
import { format } from 'date-fns';
import { parseUTC } from '../../utils/datetime';
import { clsx } from 'clsx';

const TaskHistory = ({ taskId, onClose }) => {
  const { data: history, isLoading } = useTaskHistory(taskId);

  return (
    <div className="flex flex-col h-full bg-surface/50 backdrop-blur-xl">
      <header className="p-6 border-b border-white/5 flex items-center justify-between bg-surface/80">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Objective Audit</h2>
          <p className="text-[10px] text-primary font-mono tracking-widest uppercase">Temporal Log Stream</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-secondary hover:text-white transition-colors">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
          </div>
        ) : history?.length === 0 ? (
          <div className="text-center py-24">
            <Activity size={48} className="mx-auto text-slate-800 mb-6 opacity-20" />
            <p className="text-secondary font-mono text-xs uppercase tracking-[0.2em]">No historical data points.</p>
          </div>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/20 before:to-transparent">
            {history?.map((entry, index) => (
              <div key={entry.id} className="relative flex items-center group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-surface group-hover:border-primary transition-colors shrink-0 relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                   <div className={clsx(
                     "w-2 h-2 rounded-full",
                     entry.action === 'created' ? 'bg-success shadow-[0_0_8px_rgba(0,255,148,0.5)]' :
                     entry.action === 'completed' ? 'bg-primary shadow-[0_0_8px_rgba(0,242,255,0.5)]' : 'bg-warning'
                   )} />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all ml-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{entry.action}</span>
                    <time className="text-[10px] font-mono text-slate-500">{format(parseUTC(entry.created_at), 'MMM d, HH:mm')}</time>
                  </div>
                  <div className="text-xs text-secondary leading-relaxed font-medium">
                    {entry.description || `Task status shifted to ${entry.action}`}
                  </div>
                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                      {Object.entries(entry.changes).map(([key, val]) => (
                        <span key={key} className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400">
                          {key}: <span className="text-white">{String(val)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskHistory;