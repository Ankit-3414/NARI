import React, { useState, useEffect } from 'react';
import { useSubjects, useActiveSession, useStudyActions } from '../../hooks/useStudy';
import { Play, Pause, Square, BookOpen, Clock, AlertCircle } from 'lucide-react';

const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
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
      // Calculate elapsed time including time since last resume/start
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

  if (loadingSubjects || loadingSession) return <div className="p-8 text-center text-secondary">Readying focus room...</div>;

  const handleStart = () => {
    if (!selectedSubject) return;
    study.start({ subject_id: parseInt(selectedSubject), goal_text: goal });
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center min-h-[80vh] justify-center">
      {!activeSession ? (
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Ready to Focus?</h2>
            <p className="text-secondary text-sm">Select a subject to begin your session.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Subject</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-surface border border-slate-700 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-primary outline-none appearance-none"
              >
                <option value="">Choose a subject...</option>
                {subjects?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Goal (Optional)</label>
              <input 
                type="text"
                placeholder="What are you working on?"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-surface border border-slate-700 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <button 
              onClick={handleStart}
              disabled={!selectedSubject || study.isStarting}
              className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-lg"
            >
              <Play fill="currentColor" /> Start Session
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-10 text-center">
          <div className="space-y-2">
            <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest">
              {activeSession.status === 'running' ? 'Focusing' : 'On Break'}
            </span>
            <h2 className="text-xl font-bold text-slate-100">
              {subjects?.find(s => s.id === activeSession.subject_id)?.name || 'Subject'}
            </h2>
            {activeSession.goal_text && (
              <p className="text-secondary italic">"{activeSession.goal_text}"</p>
            )}
          </div>

          <div className="text-6xl font-mono font-bold text-slate-100 tabular-nums">
            {formatSeconds(elapsed)}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {activeSession.status === 'running' ? (
              <button 
                onClick={() => study.pause()}
                className="bg-slate-700 hover:bg-slate-600 text-slate-100 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >
                <Pause fill="currentColor" /> Pause
              </button>
            ) : (
              <button 
                onClick={() => study.resume()}
                className="bg-success/20 hover:bg-success/30 text-success py-4 rounded-2xl flex items-center justify-center gap-2 font-bold border border-success/30"
              >
                <Play fill="currentColor" /> Resume
              </button>
            )}
            
            <button 
              onClick={() => study.stop()}
              className="bg-danger/20 hover:bg-danger/30 text-danger py-4 rounded-2xl flex items-center justify-center gap-2 font-bold border border-danger/30"
            >
              <Square fill="currentColor" /> Stop
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-secondary font-medium">
            <div className="flex items-center gap-1">
              <Clock size={14} /> Total: {formatSeconds(activeSession.duration_seconds)}
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle size={14} /> Pauses: {activeSession.interrupt_count}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyDashboard;
