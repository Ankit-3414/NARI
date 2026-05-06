import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function EntranceAnimation({ userName = 'Ankit', onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1500),  // Start compression
      setTimeout(() => setPhase(2), 3500),  // NARI to top
      setTimeout(() => setPhase(3), 4400),  // Welcome message
      setTimeout(() => onComplete(), 6600),  // Exit
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const userNameLetters = userName.split('');
  const fullText = 'Not A Random Intelligence';
  const nariText = 'NARI';

  // Letters before NARI (positions 0-9)
  const leftLetters = 'Not A Rand'.split('');
  // Letters after NARI (positions 16-24)
  const rightLetters = 'om Intelligence'.split('');

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Phase 0: Full text display */}
      {phase === 0 && (
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {fullText}
        </motion.h1>
      )}

      {/* Phase 1: Compression animation - letters collapse inward toward center */}
      {phase === 1 && (
        <div className="relative flex justify-center items-center">
          {/* Left letters collapse right */}
          <div className="flex absolute">
            {leftLetters.map((letter, i) => (
              <motion.span
                key={`left-${i}`}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: '400%', opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeInOut', delay: i * 0.05 }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* NARI - stays in center */}
          <motion.div
            className="flex"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {nariText.split('').map((letter, i) => (
              <motion.span
                key={`nari-${i}`}
                className="text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-purple-500 mx-1"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring', damping: 12 }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          {/* Right letters collapse left */}
          <div className="flex absolute">
            {rightLetters.map((letter, i) => (
              <motion.span
                key={`right-${i}`}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: '-400%', opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeInOut', delay: i * 0.05 }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Phase 2 & 3: NARI at top */}
      {phase >= 2 && (
        <motion.div
          className="absolute top-16"
          initial={{ top: '50%', y: '-50%' }}
          animate={{ top: '4rem', y: '0%' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <div className="flex">
            {nariText.split('').map((letter, i) => (
              <motion.span
                key={i}
                className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-purple-500 mx-1"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Phase 3: Welcome message */}
      {phase === 3 && (
        <motion.div
          className="absolute top-40 sm:top-48"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center">
            <motion.p
              className="text-lg sm:text-xl text-slate-300 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Welcome back,
            </motion.p>
            <div className="flex justify-center items-center space-x-1">
              {userNameLetters.map((letter, index) => (
                <motion.span
                  key={index}
                  className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}