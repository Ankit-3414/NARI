import React from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

const NeuralHeatmap = ({ data }) => {
  // Last 100 days for mobile-friendly view
  const days = 112; // 16 weeks
  const today = new Date();
  const startDate = subDays(today, days - 1);
  
  const dateRange = eachDayOfInterval({
    start: startDate,
    end: today
  });

  const getIntensity = (date) => {
    const entry = data?.find(d => isSameDay(parseISO(d.date), date));
    return entry ? entry.value : 0;
  };

  const getColor = (value) => {
    if (value === 0) return 'bg-white/5';
    if (value < 3) return 'bg-primary/20 shadow-[0_0_5px_rgba(0,242,255,0.2)]';
    if (value < 7) return 'bg-primary/40 shadow-[0_0_10px_rgba(0,242,255,0.4)]';
    if (value < 15) return 'bg-primary/70 shadow-[0_0_15px_rgba(0,242,255,0.6)]';
    return 'bg-primary shadow-[0_0_20px_rgba(0,242,255,0.8)]';
  };

  // Group days into weeks (columns)
  const weeks = [];
  for (let i = 0; i < dateRange.length; i += 7) {
    weeks.push(dateRange.slice(i, i + 7));
  }

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-4">
      <div className="flex gap-1.5 min-w-max">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1.5">
            {week.map((day, dIndex) => {
              const value = getIntensity(day);
              return (
                <motion.div
                  key={dIndex}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (wIndex * 0.05) + (dIndex * 0.01) }}
                  className={`w-3.5 h-3.5 rounded-[3px] transition-all cursor-crosshair ${getColor(value)}`}
                  title={`${format(day, 'MMM d, yyyy')}: ${value} events`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-secondary px-1">
        <span>{format(startDate, 'MMM d')}</span>
        <span>Neural Activity Stream</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export default NeuralHeatmap;
