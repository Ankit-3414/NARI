import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCcw } from 'lucide-react';
import { useActivity } from '../../hooks/useActivity';
import ContextEntryCard from './ContextEntryCard';

const ContextMemoryPanel = () => {
  const { data: entries, isLoading, error, refetch, isFetching } = useActivity({
    entity_type: 'context',
    limit: 8,
  });

  return (
    <section className="glass-card rounded-[2rem] p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white">
              Memory Stream
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Raw journal entries stay untouched. Obvious commands get quiet suggestions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-secondary transition-colors hover:text-primary"
        >
          <RefreshCcw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5 text-sm font-bold text-danger">
          Could not load memory stream.
        </div>
      ) : entries?.length ? (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <motion.div
                key={entry.id || entry.timestamp}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ContextEntryCard entry={entry} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface/30 py-10 text-center">
          <p className="font-bold text-white">No memory entries yet</p>
          <p className="mt-1 text-sm text-secondary">Log context above to test the stream.</p>
        </div>
      )}
    </section>
  );
};

export default ContextMemoryPanel;