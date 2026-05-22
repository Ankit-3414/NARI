import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminders, useReminderActions } from '../../hooks/useReminders';
import { Zap, Bell, Check, X, ShieldAlert, Rocket } from 'lucide-react';
import { differenceInMinutes, parseISO } from 'date-fns';
import { parseUTC, getNeuralTime } from '../../utils/datetime';

const MOTIVATIONAL_MESSAGES = [
  "Incoming Operation. Are we locking in?",
  "System Check: Activity approaches. Ready to crush it?",
  "Best of luck today. Are you deploying for this mission?",
  "The window is opening. Confirm your readiness.",
  "Neural link established. Proceed to objective?",
  "Tactical alert: Next session is imminent. Status?",
];

const PreFlightIntercept = () => {
  const { data: reminders } = useReminders(
    { active_only: true },
    { refetchInterval: 5000 }
  );
  const { lockIn, skip } = useReminderActions();
  const [activeIntercept, setActiveIntercept] = useState(null);

  // Check for upcoming reminders (next 60 minutes) that aren't locked in
  useEffect(() => {
    if (!reminders) return;

    const now = getNeuralTime();
    const upcoming = reminders.find(r => {
      if (r.is_locked_in || r.status !== 'scheduled') return false;
      const dueAt = parseUTC(r.due_at);
      const diff = differenceInMinutes(dueAt, now);
      return diff >= 0 && diff <= 60;
    });

    if (upcoming) {
      setActiveIntercept(upcoming);
    } else {
      setActiveIntercept(null);
    }
  }, [reminders]);

  const message = useMemo(() => {
    return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  }, [activeIntercept?.id]);

  if (!activeIntercept) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-2xl p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          className="max-w-xl w-full bg-surface border-2 border-primary/20 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,255,255,0.15)] relative overflow-hidden"
        >
          {/* Background Scanner Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <div className="h-full w-px bg-primary absolute left-1/2 top-0 animate-[scan_3s_ease-in-out_infinite]" />
          </div>

          <div className="relative z-10 space-y-10 text-center">
            <div className="flex justify-center">
              <div className="p-6 bg-primary/10 rounded-3xl text-primary border border-primary/20 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <ShieldAlert size={48} className="animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">
                Pre-Flight Intercept
              </h1>
              <p className="text-slate-400 font-mono text-sm uppercase tracking-[0.3em]">
                {activeIntercept.title}
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 italic text-xl font-medium text-white/90">
              "{message}"
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => skip(activeIntercept.id)}
                className="flex-1 py-6 rounded-2xl border-2 border-white/10 text-secondary font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-3 group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform" />
                Abort Today
              </button>
              <button
                onClick={() => lockIn(activeIntercept.id)}
                className="flex-1 py-6 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_40px_rgba(0,255,255,0.5)] transition-all flex items-center justify-center gap-3 group"
              >
                <Rocket size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                Confirm Deployment
              </button>
            </div>
          </div>

          {/* Bottom Tags */}
          <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center opacity-40">
            <div className="flex gap-2">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-primary rounded-full" />
            </div>
            <span className="text-[8px] font-mono text-white tracking-[0.5em]">AUTH_REQUIRED:USER_01</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreFlightIntercept;
