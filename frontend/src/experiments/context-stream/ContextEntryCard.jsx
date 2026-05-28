import React from 'react';
import { format } from 'date-fns';
import { Terminal, Clock } from 'lucide-react';
import { parseUTC } from '../../utils/datetime';
import { getContextSuggestions, getContextText } from './contextSuggestionRules';
import SuggestionActions from './SuggestionActions';

const ContextEntryCard = ({ entry }) => {
  const text = getContextText(entry);
  const suggestions = getContextSuggestions(text);
  const createdAt = entry.created_at || entry.timestamp;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-background/50 p-4 transition-all hover:border-primary/20 hover:bg-surface/60">
      <div className="absolute left-0 top-0 bottom-0 w-1 origin-center scale-y-0 bg-primary transition-transform group-hover:scale-y-100" />

      <div className="flex items-start gap-4">
        <div className="mt-1 rounded-xl border border-white/5 bg-surface p-2 text-primary">
          <Terminal size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest">
            <span className="border border-primary/10 bg-primary/5 px-2 py-0.5 text-primary/80">
              Memory
            </span>
            <span className="border border-white/5 bg-surface px-2 py-0.5 text-secondary">
              {entry.source || 'api'}
            </span>
            {createdAt && (
              <span className="ml-auto flex items-center gap-1 text-secondary">
                <Clock size={10} />
                {format(parseUTC(createdAt), 'MMM d, HH:mm')}
              </span>
            )}
          </div>

          <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-100">
            {text || 'Context entry'}
          </p>

          <SuggestionActions suggestions={suggestions} entryId={entry.id || entry.timestamp} />
        </div>
      </div>
    </article>
  );
};

export default ContextEntryCard;
