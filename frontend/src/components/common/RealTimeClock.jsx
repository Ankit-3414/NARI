import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getNeuralTime } from '../../utils/datetime';

const RealTimeClock = () => {
  const [time, setTime] = useState(getNeuralTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getNeuralTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div className="flex flex-col items-end font-mono">
      <motion.div 
        key={timeStr}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-black text-white tracking-tighter tabular-nums"
      >
        {timeStr}
      </motion.div>
      <div className="text-[9px] font-bold text-primary tracking-[0.3em] uppercase opacity-70">
        {dateStr}
      </div>
    </div>
  );
};

export default RealTimeClock;
