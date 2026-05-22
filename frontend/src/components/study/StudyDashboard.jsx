import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubjects, useActiveSession, useStudyActions } from '../../hooks/useStudy';
import { 
  Play, Pause, Square, Clock, AlertCircle, Zap, Fingerprint, 
  Activity, Target, ChevronRight, Hash, Shield, Box
} from 'lucide-react';
import { clsx } from 'clsx';
import { parseUTC, getNeuralTime } from '../../utils/datetime';

const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0'));
};

const HUDCircle = ({ progress, active }) => (
  <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-12">
    {/* Background Glow */}
    <div className={clsx(
      "absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000",
      active ? "bg-primary/20 opacity-100" : "bg-warning/10 opacity-50"
    )} />
    
    {/* SVG HUD Layers */}
    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
      {/* Outer Static Ring */}
      <circle
        cx="50" cy="50" r="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-white/5"
      />
      
      {/* Dotted Inner Ring */}
      <circle
        cx="50" cy="50" r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="1 4"
        className="text-white/10"
      />

      {/* Primary Progress Ring */}
      <motion.circle
        cx="50" cy="50" r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="283"
        initial={{ strokeDashoffset: 283 }}
        animate={{ strokeDashoffset: 283 - (283 * (progress % 60) / 60) }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className={clsx("transition-colors duration-500", active ? "text-primary" : "text-warning")}
      />

      {/* Rotating Detail Rings */}
      {active && (
        <motion.circle
          cx="50" cy="50" r="46.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="10 80"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="text-primary/40"
        />
      )}
    </svg>

    {/* Center Icon/Visual */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={clsx(
        "w-48 h-48 rounded-full border border-white/5 flex flex-col items-center justify-center backdrop-blur-md relative overflow-hidden",
        active ? "bg-primary/5" : "bg-warning/5"
      )}>
        <motion.div 
          animate={active ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {active ? <Activity size={32} className="text-primary" /> : <Shield size={32} className="text-warning" />}
        </motion.div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-secondary">
          {active ? 'Analyzing' : 'Ready'}
        </span>
      </div>
    </div>
  </div>
);

const SubjectCard = ({ subject, selected, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={clsx(
      "relative p-5 rounded-3xl border transition-all duration-300 text-left group overflow-hidden",
      selected 
        ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
        : "bg-surface/40 border-white/5 hover:border-white/20"
    )}
  >
    {selected && (
      <div className="absolute top-0 right-0 p-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    )}
    <Hash size={16} className={clsx("mb-3 transition-colors", selected ? "text-primary" : "text-secondary")} />
    <h4 className="font-black text-white uppercase tracking-tight truncate">{subject.name}</h4>
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
        Difficulty: {subject.difficulty || 'Normal'}
      </span>
    </div>
  </motion.button>
);

const StudyDashboard = () => {
  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const { data: activeSession, isLoading: loadingSession } = useActiveSession();
  const study = useStudyActions();
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (activeSession && activeSession.status === 'running') {
      const baseSeconds = activeSession.duration_seconds;
      const startTime = parseUTC(activeSession.resumed_at || activeSession.created_at);
      const updateTimer = () => {
        const now = getNeuralTime();
        const diff = Math.floor((now - startTime) / 1000);
        setElapsed(baseSeconds + Math.max(0, diff));
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
    <div className="p-4 max-w-4xl mx-auto min-h-[calc(100vh-8rem)] pt-8 pb-32">
      <AnimatePresence mode="wait">
        {!activeSession ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Mission_Control</h2>
                </div>
                <p className="text-secondary font-mono text-[10px] uppercase tracking-[0.3em] ml-2">Initialize cognitive focus session.</p>
              </div>
              <div className="bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <Shield size={20} className="text-primary/60" />
                <span className="text-[10px] font-mono text-secondary uppercase tracking-widest leading-none">Security Protocol: Active</span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Side: Subject Selection */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Target size={14} /> Available Sectors
                  </h3>
                  <span className="text-[10px] font-mono text-secondary">{subjects?.length || 0} DEPLOYABLE</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {subjects?.map(s => (
                    <SubjectCard 
                      key={s.id} 
                      subject={s} 
                      selected={selectedSubject === s.id.toString()}
                      onClick={() => setSelectedSubject(s.id.toString())}
                    />
                  ))}
                </div>
              </div>

              {/* Right Side: Configuration */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-6 glass-card p-8 rounded-[2.5rem] border-white/5 bg-surface/30">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                      <Box size={14} /> Objective_Scope
                    </label>
                    <input 
                      type="text"
                      placeholder="Specify mission outcome..."
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-background/50 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-accent outline-none font-bold placeholder:text-slate-600 transition-all"
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: selectedSubject ? 1.02 : 1 }}
                    whileTap={{ scale: selectedSubject ? 0.98 : 1 }}
                    onClick={handleStart}
                    disabled={!selectedSubject || study.isStarting}
                    className={clsx(
                      "w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-500 overflow-hidden group",
                      selectedSubject 
                        ? "bg-primary text-black shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:shadow-primary/40" 
                        : "bg-surface/50 text-secondary border border-white/5 cursor-not-allowed opacity-50"
                    )}
                  >
                    <Zap fill={selectedSubject ? "currentColor" : "none"} size={28} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Execute_Link</span>
                  </motion.button>
                </div>

                <div className="p-6 border border-dashed border-white/10 rounded-3xl opacity-50">
                  <div className="flex items-start gap-4 text-secondary">
                    <AlertCircle size={16} className="shrink-0 mt-1" />
                    <p className="text-[10px] font-mono leading-relaxed uppercase">
                      Attention: Focus session will be logged to NARI core memory. Ensure optimal environmental variables.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="running"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            {/* HUD Header */}
            <div className="flex items-center gap-12 mb-12">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary mb-1">Target Sector</p>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {subjects?.find(s => s.id === activeSession.subject_id)?.name || 'Unknown'}
                </h3>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className={clsx("w-2 h-2 rounded-full animate-pulse", activeSession.status === 'running' ? 'bg-success' : 'bg-warning')} />
                  <span className={clsx("text-xs font-black uppercase tracking-widest", activeSession.status === 'running' ? 'text-success' : 'text-warning')}>
                    {activeSession.status === 'running' ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Circular HUD Timer */}
            <HUDCircle progress={elapsed} active={activeSession.status === 'running'} />

            {/* Main Timer Display */}
            <div className="flex items-baseline justify-center font-black tabular-nums tracking-tighter mb-16">
              <span className="text-6xl sm:text-7xl md:text-9xl text-white leading-none">{h}</span>
              <span className="text-3xl sm:text-4xl md:text-6xl text-primary/40 mx-2 md:mx-4">:</span>
              <span className="text-6xl sm:text-7xl md:text-9xl text-white leading-none">{m}</span>
              <span className="text-3xl sm:text-4xl md:text-6xl text-primary/40 mx-2 md:mx-4">:</span>
              <span className="text-6xl sm:text-7xl md:text-9xl text-primary leading-none shadow-[0_0_20px_rgba(0,242,255,0.3)]">{s}</span>
            </div>

            {/* Tactical Controls */}
            <div className="flex items-center gap-8 w-full max-w-lg">
              <div className="flex-1">
                {activeSession.status === 'running' ? (
                  <motion.button 
                    whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => study.pause()}
                    className="w-full bg-warning/10 hover:bg-warning text-warning hover:text-black py-8 rounded-[2.5rem] flex flex-col items-center gap-3 border border-warning/20 transition-all group"
                  >
                    <Pause fill="currentColor" size={32} />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Suspend_Link</span>
                  </motion.button>
                ) : (
                  <motion.button 
                    whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => study.resume()}
                    className="w-full bg-success/10 hover:bg-success text-success hover:text-black py-8 rounded-[2.5rem] flex flex-col items-center gap-3 border border-success/20 transition-all group"
                  >
                    <Play fill="currentColor" size={32} />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Resume_Link</span>
                  </motion.button>
                )}
              </div>
              
              <div className="flex-1">
                <motion.button 
                  whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => study.stop()}
                  className="w-full bg-danger/10 hover:bg-danger text-danger hover:text-black py-8 rounded-[2.5rem] flex flex-col items-center gap-3 border border-danger/20 transition-all group"
                >
                  <Square fill="currentColor" size={32} />
                  <span className="font-black uppercase tracking-[0.2em] text-[10px]">Terminate_Link</span>
                </motion.button>
              </div>
            </div>

            {/* Session Stats HUD */}
            <div className="grid grid-cols-2 gap-8 mt-16 w-full max-w-sm">
              <div className="glass-card p-4 rounded-2xl border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Net_Time</p>
                  <p className="text-sm font-bold text-white font-mono">{formatSeconds(activeSession.duration_seconds).join(':')}</p>
                </div>
              </div>
              <div className="glass-card p-4 rounded-2xl border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Interrupts</p>
                  <p className="text-sm font-bold text-white font-mono">{activeSession.interrupt_count}</p>
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
