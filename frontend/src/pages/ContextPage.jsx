import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useActivity } from '../hooks/useActivity';
import { Search, Filter, Clock, Save, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import ContextEntryCard from '../components/context/ContextEntryCard';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const ContextPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    entity_type: 'context',
    startDate: null,
    endDate: null,
    limit: 50,
    offset: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { data: entries, isLoading, error, refetch } = useActivity({
    entity_type: filters.entity_type,
    limit: filters.limit,
    offset: filters.offset
  });

  // Search entries client-side (since we're getting a limited set from API)
  const filteredEntries = entries?.filter(entry => {
    const text = entry.message || entry.payload_json ? JSON.parse(entry.payload_json).text : '';
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Load more entries when near bottom
  const loadMore = () => {
    if (!hasMore || isLoading) return;
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  // Reset filters when search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    setHasMore(true);
  }, [searchTerm]);

  // Check if we have more entries
  useEffect(() => {
    if (entries && entries.length < filters.limit) {
      setHasMore(false);
    } else if (entries && entries.length === filters.limit) {
      setHasMore(true);
    }
  }, [entries, filters.limit]);

  const handleExport = async () => {
    // In a real app, this would call an export endpoint
    alert('Export functionality would be implemented here');
  };

  const handleClearFilters = () => {
    setFilters({
      entity_type: 'context',
      startDate: null,
      endDate: null,
      limit: 50,
      offset: 0
    });
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-8 max-w-4xl mx-auto space-y-4"
      >
        <div className="h-16 bg-white/5 animate-pulse rounded-2xl" />
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)}
      </motion.div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-danger font-mono uppercase tracking-widest">System Error: Failed to load context entries.</div>;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-8 max-w-6xl mx-auto pb-16"
    >
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              <Terminal size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Context Archive</h1>
          </div>
          <p className="text-secondary font-mono text-xs tracking-[0.3em] ml-16">
            {filteredEntries.length} entries matching search
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3.5 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest",
              showFilters ? "bg-secondary text-black border-secondary" : "bg-white/5 text-secondary border-white/5 hover:border-white/20"
            )}
          >
            <Filter size={16} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search context entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-700"
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
          >
            <Save size={16} /> Export
          </motion.button>
        </div>
      </motion.header>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-[2rem] border border-white/5 bg-surface/50"
        >
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex items-center gap-3">
              <Clock size={16} />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white">Date Range</span>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || null }))}
                    className="rounded-xl border border-white/5 bg-surface/50 p-2 text-white"
                  />
                  <span className="text-[10px] text-secondary">to</span>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || null }))}
                    className="rounded-xl border border-white/5 bg-surface/50 p-2 text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Terminal size={16} />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white">Entry Type</span>
                <select
                  value={filters.entity_type || 'context'}
                  onChange={(e) => {
                    setFilters(prev => ({ 
                      ...prev, 
                      entity_type: e.target.value, 
                      offset: 0 
                    }));
                    setHasMore(true);
                  }}
                  className="rounded-xl border border-white/5 bg-surface/50 p-2 text-white"
                >
                  <option value="context">Context</option>
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                  <option value="reminder">Reminder</option>
                  <option value="goal">Goal</option>
                  <option value="habit">Habit</option>
                  <option value="study_session">Study Session</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <motion.button 
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-white/5 text-secondary hover:bg-white/10 transition-colors"
            >
              Clear
            </motion.button>
            <motion.button 
              onClick={() => {
                setFilters(prev => ({ 
                  ...prev, 
                  offset: 0 
                }));
                setHasMore(true);
                refetch();
              }}
              className="ml-4 px-4 py-2 rounded-xl bg-primary text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
            >
              Apply Filters
            </motion.button>
          </div>
        </motion.div>
      )}

      {filteredEntries.length === 0 ? (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center py-24 glass-card rounded-[3rem] border border-dashed border-white/10"
        >
          <Terminal size={64} className="mx-auto text-primary/20 mb-6 animate-pulse" />
          <p className="text-xl font-bold text-white mb-2">No Context Entries Found.</p>
          <p className="text-secondary text-sm font-medium">Try adjusting your search or filters.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id || entry.timestamp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ContextEntryCard entry={entry} />
              </motion.div>
            ))}
          </div>
          
          {hasMore && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-surface border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:border-white/20 transition-all"
            >
              <Clock size={16} /> Load More Entries
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContextPage;