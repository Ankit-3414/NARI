import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubjects, useActiveSession, useStudyActions } from '../../hooks/useStudy';
import { Play, Pause, Square, Clock, AlertCircle, Zap, Fingerprint, Activity } from 'lucide-react';
import { clsx } from 'clsx';

const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0'));
};

const StudyDashboard = () => {
  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const { data: activeSession, isLoading: loadingSession } = useActiveSession();
  const study = useStudyActions();
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Live timer logic
  useEffect(() => {
    let interval;
    if (activeSession && activeSession.status === 'running') {
      const baseSeconds = activeSession.duration_seconds;
      const startTime = new Date(activeSession.resumed_at || activeSession.created_at);
      
      const updateTimer = () => {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        setElapsed(baseSeconds + diff);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else if (activeSession && activeSession.status === 'paused') {
      setElapsed(activeSession.duration_seconds);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  if (loadingSubjects || loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="relative w-24 h-24">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-primary" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-b-2 border-accent" />
        </div>
        <p className="text-primary font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  const handleStart = () => {
    if (!selectedSubject) return;
    study.start({ subject_id: parseInt(selectedSubject), goal_text: goal });
  };

  const [h, m, s] = formatSeconds(elapsed);

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col items-center min-h-[calc(100vh-8rem)] pt-12 pb-32">
      
      <AnimatePresence mode="wait">
        {!activeSession ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            className="w-full space-y-8"
          >
            <div className="text-center space-y-4 mb-12">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(0,242,255,0.2)] mb-6">
                <Fingerprint size={40} className="text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">Initiate Focus</h2>
              <p className="text-secondary font-mono text-xs uppercase tracking-widest">Select parameters for optimal cognitive state.</p>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-[2.5rem] space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-4">Subject Directive</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100" />
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="relative w-full bg-background/50 border border-white/10 rounded-2xl p-4 md:p-5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none backdrop-blur-xl font-bold"
                  >
                    <option value="" className="text-slate-500">Select target sector...</option>
                    {subjects?.map(s => (
                      <option key={s.id} value={s.id} className="bg-background">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent ml-4">Micro-Goal (Optional)</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-accent/20 rounded-2xl blur group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100" />
                  <input 
                    type="text"
                    placeholder="Specific outcome expected..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="relative w-full bg-background/50 border border-white/10 rounded-2xl p-4 md:p-5 text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none backdrop-blur-xl font-bold placeholder:text-slate-600"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: selectedSubject && !study.isStarting ? 1.02 : 1 }}
                whileTap={{ scale: selectedSubject && !study.isStarting ? 0.98 : 1 }}
                onClick={handleStart}
                disabled={!selectedSubject || study.isStarting}
                className={clsx(
                  "w-full py-5 md:py-6 rounded-[2rem] flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden",
                  selectedSubject 
                    ? "bg-primary text-black hover:shadow-[0_0_40px_rgba(0,242,255,0.6)] hover:bg-white" 
                    : "bg-surface text-secondary border border-white/5 cursor-not-allowed"
                )}
              >
                {selectedSubject && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
                <Zap fill={selectedSubject ? "currentColor" : "none"} size={24} /> 
                {study.isStarting ? 'Engaging...' : 'Engage Link'}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="running"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center relative"
          >
            {/* Animated Rings Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] md:w-[80vw] aspect-square pointer-events-none -z-10">
              {activeSession.status === 'running' && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }} 
                    className="absolute inset-0 rounded-full border border-primary/30"
                  />
                  <motion.div 
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1 }} 
                    className="absolute inset-0 rounded-full border border-accent/20"
                  />
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
                    className="absolute inset-10 rounded-full border-t border-r border-primary/20 border-dashed"
                  />
                </>
              )}
            </div>

            <div className="space-y-4 mb-16 relative z-10 glass-card inline-block px-8 py-4 rounded-3xl mx-auto border-white/5 backdrop-blur-2xl">
              <div className="flex items-center justify-center gap-3">
                <span className={clsx(
                  "w-3 h-3 rounded-full shadow-lg",
                  activeSession.status === 'running' ? "bg-success animate-pulse shadow-success/50" : "bg-warning shadow-warning/50"
                )} />
                <span className={clsx(
                  "text-[10px] font-black uppercase tracking-[0.3em]",
                  activeSession.status === 'running' ? "text-success" : "text-warning"
                )}>
                  {activeSession.status === 'running' ? 'Neural Link Active' : 'System Suspended'}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-wider">
                {subjects?.find(s => s.id === activeSession.subject_id)?.name || 'Unknown Sector'}
              </h2>
              {activeSession.goal_text && (
                <p className="text-primary font-mono text-sm uppercase">"{activeSession.goal_text}"</p>
              )}
            </div>

            {/* Timer Display */}
            <div className="relative z-10 flex items-baseline justify-center font-black tabular-nums tracking-tighter mb-20 drop-shadow-[0_0_30px_rgba(0,242,255,0.3)]">
              <span className="text-[6rem] md:text-[9rem] text-white leading-none">{h}</span>
              <span className="text-[4rem] md:text-[6rem] text-primary/50 mx-1 md:mx-4">:</span>
              <span className="text-[6rem] md:text-[9rem] text-white leading-none">{m}</span>
              <span className="text-[4rem] md:text-[6rem] text-primary/50 mx-1 md:mx-4">:</span>
              <span className="text-[6rem] md:text-[9rem] text-primary leading-none">{s}</span>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto relative z-10">
              {activeSession.status === 'running' ? (
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => study.pause()}
                  className="glass-card bg-warning/10 hover:bg-warning text-warning hover:text-black py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors border border-warning/20 shadow-[0_0_20px_rgba(255,184,0,0.1)] group"
                >
                  <Pause fill="currentColor" size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase tracking-widest text-xs">Suspend</span>
                </motion.button>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => study.resume()}
                  className="glass-card bg-success/10 hover:bg-success text-success hover:text-black py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors border border-success/20 shadow-[0_0_20px_rgba(0,255,148,0.1)] group"
                >
                  <Play fill="currentColor" size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase tracking-widest text-xs">Resume</span>
                </motion.button>
              )}
              
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => study.stop()}
                className="glass-card bg-danger/10 hover:bg-danger text-danger hover:text-black py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors border border-danger/20 shadow-[0_0_20px_rgba(255,0,85,0.1)] group"
              >
                <Square fill="currentColor" size={32} className="group-hover:scale-110 transition-transform" />
                <span className="font-black uppercase tracking-widest text-xs">Terminate</span>
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 px-6 py-4 glass-card rounded-full max-w-sm mx-auto border-white/5">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-secondary font-black uppercase tracking-[0.2em]">Net Time</span>
                <div className="flex items-center gap-2 text-white font-mono text-sm">
                  <Activity size={14} className="text-primary" /> {formatSeconds(activeSession.duration_seconds).join(':')}
                </div>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-secondary font-black uppercase tracking-[0.2em]">Interrupts</span>
                <div className="flex items-center gap-2 text-white font-mono text-sm">
                  <AlertCircle size={14} className="text-warning" /> {activeSession.interrupt_count}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyDashboard;
