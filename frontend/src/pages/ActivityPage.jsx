import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivity, useActivityStats } from '../hooks/useActivity';
import { Database, Search, Filter, Clock, Activity as ActivityIcon, HardDrive, Cpu, Hash, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Card from '../components/common/Card';

const ActivityPage = () => {
  const [limit, setLimit] = useState(50);
  const { data: logs, isLoading, error } = useActivity({ limit });
  const { data: stats } = useActivityStats();

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'task': return <Database size={14} className="text-blue-400" />;
      case 'note': return <Database size={14} className="text-yellow-400" />;
      case 'study_session': return <Cpu size={14} className="text-purple-400" />;
      case 'habit': return <ActivityIcon size={14} className="text-success" />;
      case 'goal': return <ActivityIcon size={14} className="text-accent" />;
      case 'reminder': return <Clock size={14} className="text-orange-400" />;
      default: return <HardDrive size={14} className="text-slate-400" />;
    }
  };

  const statItems = [
    { label: 'Tasks', value: stats?.tasks, color: 'text-blue-400' },
    { label: 'Notes', value: stats?.notes, color: 'text-yellow-400' },
    { label: 'Habits', value: stats?.habits, color: 'text-success' },
    { label: 'Logs', value: stats?.logs, color: 'text-primary' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.2)]">
              <Database size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">System Audit Vault</h1>
          </div>
          <p className="text-secondary text-sm font-medium">Real-time memory stream of all database transactions.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Feed</span>
        </div>
      </header>

      {/* Database Inventory */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statItems.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111111] border border-slate-800 p-3 rounded-xl"
          >
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{item.label}</p>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black ${item.color}`}>{item.value ?? '...'}</span>
              <span className="text-[10px] text-slate-600 font-medium mb-1.5 uppercase">Entries</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-[#111111] animate-pulse rounded-xl border border-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-danger/5 border border-danger/20 rounded-2xl text-danger">
            Failed to retrieve system logs.
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {logs?.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111111] border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-start gap-4 group transition-all"
                >
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg group-hover:bg-slate-800 transition-colors">
                    {getEntityIcon(log.entity_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {log.entity_type}
                        </span>
                        <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                          <Hash size={10} /> {log.entity_id}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          log.action === 'created' ? 'text-success bg-success/10' :
                          log.action === 'deleted' || log.action === 'cancelled' ? 'text-danger bg-danger/10' :
                          'text-blue-400 bg-blue-400/10'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock size={10} />
                        {format(parseISO(log.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    <p className="text-sm font-bold text-slate-200 mb-1">{log.message}</p>
                    
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                      <span>Source: <span className="text-slate-400 uppercase">{log.source}</span></span>
                      <span>Actor: <span className="text-slate-400 uppercase">{log.actor}</span></span>
                      <span className="ml-auto text-slate-600 italic">{format(parseISO(log.created_at), 'MMM d, yyyy')}</span>
                    </div>

                    {log.payload && (
                      <div className="mt-3 p-2 bg-[#090909] rounded-lg border border-slate-800/50 hidden group-hover:block transition-all">
                        <pre className="text-[10px] text-slate-500 font-mono overflow-x-auto">
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
