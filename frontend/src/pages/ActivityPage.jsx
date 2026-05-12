import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivity, useActivityStats } from '../hooks/useActivity';
import { Database, Search, Filter, Clock, Activity as ActivityIcon, HardDrive, Cpu, Hash, Layers, Terminal } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ActivityPage = () => {
  const [limit, setLimit] = useState(50);
  const { data: logs, isLoading, error } = useActivity({ limit });
  const { data: stats } = useActivityStats();

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'task': return <Database size={14} className="text-primary" />;
      case 'note': return <Database size={14} className="text-warning" />;
      case 'study_session': return <Cpu size={14} className="text-accent" />;
      case 'habit': return <ActivityIcon size={14} className="text-success" />;
      case 'goal': return <ActivityIcon size={14} className="text-accent" />;
      case 'reminder': return <Clock size={14} className="text-danger" />;
      case 'context': return <Terminal size={14} className="text-primary animate-pulse" />;
      default: return <HardDrive size={14} className="text-secondary" />;
    }
  };

  const statItems = [
    { label: 'TASKS_STORE', value: stats?.tasks, color: 'text-primary' },
    { label: 'NOTES_STORE', value: stats?.notes, color: 'text-warning' },
    { label: 'HABITS_LINK', value: stats?.habits, color: 'text-success' },
    { label: 'TOTAL_LOGS', value: stats?.logs, color: 'text-accent' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 font-mono">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 border border-primary/20 text-primary">
              <Terminal size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">System_Audit_Vault</h1>
          </div>
          <p className="text-secondary text-xs font-bold uppercase tracking-widest bg-surface px-2 py-1 inline-block border border-white/5">
            Real-time memory stream of all database transactions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-success/5 border border-success/20 self-start md:self-auto">
          <span className="w-1.5 h-1.5 bg-success shadow-[0_0_8px_#00FF94] animate-pulse" />
          <span className="text-[10px] font-bold text-success uppercase tracking-widest">LIVE_DATA_STREAM</span>
        </div>
      </header>

      {/* Database Inventory */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statItems.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface/50 border border-white/10 p-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-1">
              <div className="w-1 h-1 bg-white/20" />
            </div>
            <p className="text-[9px] text-secondary font-bold uppercase tracking-[0.2em] mb-2">{item.label}</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black ${item.color} tracking-tighter`}>{item.value ?? '...'}</span>
              <span className="text-[9px] text-secondary font-medium mb-1.5 uppercase tracking-widest">Units</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-secondary uppercase tracking-[0.3em]">
          <div className="h-[1px] flex-1 bg-white/5" />
          <span>Accessing_Logs</span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-surface/30 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-danger/5 border border-danger/20 text-danger uppercase font-bold text-sm tracking-widest">
            Critical_Error: Failed to retrieve system logs.
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {logs?.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface/40 border border-white/5 hover:border-primary/20 p-5 flex items-start gap-5 group transition-all relative"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  
                  <div className="mt-1 p-2.5 bg-background border border-white/5 text-secondary group-hover:text-primary group-hover:border-primary/40 transition-colors">
                    {getEntityIcon(log.entity_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/80 bg-primary/5 px-2 py-0.5 border border-primary/10">
                          {log.entity_type}
                        </span>
                        <span className="text-[9px] font-bold text-accent flex items-center gap-0.5">
                          ID: {log.entity_id}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 border ${
                          log.action === 'created' ? 'text-success border-success/20 bg-success/5' :
                          log.action === 'deleted' || log.action === 'cancelled' ? 'text-danger border-danger/20 bg-danger/5' :
                          'text-primary border-primary/20 bg-primary/5'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary font-mono flex items-center gap-2 bg-surface/80 px-2 py-1 border border-white/5">
                        <Clock size={10} />
                        {format(parseISO(log.created_at), 'HH:mm:ss:SSS')}
                      </span>
                    </div>
                    
                    <p className="text-sm font-bold text-slate-100 mb-2 tracking-tight">{`> ${log.message}`}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-[9px] text-secondary font-bold uppercase tracking-widest">
                      <span>Source: <span className="text-slate-400">{log.source}</span></span>
                      <span>Actor: <span className="text-slate-400">{log.actor}</span></span>
                      <span className="ml-auto text-secondary/50 italic">{format(parseISO(log.created_at), 'yyyy.MM.dd')}</span>
                    </div>

                    {log.payload && (
                      <div className="mt-4 p-3 bg-background/80 border border-white/5 hidden group-hover:block transition-all">
                        <pre className="text-[9px] text-primary/60 font-mono overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
