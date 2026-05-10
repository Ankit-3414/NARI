import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const terminalLines = [
  { text: "Initializing NARI Core...", delay: 0 },
  { text: "Loading Neural Architectures...", delay: 400 },
  { text: "Establishing Biometric Link...", delay: 800 },
  { text: "Synchronizing Personal OS...", delay: 1200 },
  { text: "Access Granted. Welcome, Ankit.", delay: 1800, color: "text-primary" },
];

const ASCII_LOGO = `
 ███▄    █   ▄▄▄       ██▀███   ██▓
 ██ ▀█   █  ▒████▄    ▓██ ▒ ██▒▓██▒
▓██  ▀█ ██▒ ▒██  ▀█▄  ▓██ ░▄█ ▒▒██▒
▓██▒  ▐▌██▒ ░██▄▄▄▄██ ▒██▀▀█▄  ░██░
▒██░   ▓██░  ▓█   ▓██▒░██▓ ▒██▒░██░
░ ▒░   ▒ ▒   ▒▒   ▓▒█░░ ▒▓ ░▒▓░░▓  
░ ░░   ░ ▒░   ▒   ▒▒ ░  ░▒ ░ ▒░ ▒ ░
   ░   ░ ░    ░   ▒     ░░   ░  ▒ ░
         ░        ░  ░   ░      ░  
`;

const GlitchText = ({ children, className }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.span
        animate={{
          x: [0, -2, 2, -1, 0],
          opacity: [1, 0.8, 1, 0.9, 1],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: "mirror",
        }}
        className="absolute inset-0 text-danger blur-[1px] mix-blend-screen opacity-50"
      >
        {children}
      </motion.span>
      <motion.span
        animate={{
          x: [0, 2, -2, 1, 0],
          opacity: [1, 0.9, 1, 0.8, 1],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          repeatType: "mirror",
        }}
        className="absolute inset-0 text-primary blur-[1px] mix-blend-screen opacity-50"
      >
        {children}
      </motion.span>
      <span className="relative z-10">{children}</span>
    </div>
  );
};

export default function NeuralEntrance({ onComplete }) {
  const [lineIndex, setLineIndex] = useState(-1);
  const [showLogo, setShowLogo] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    // Sequence timing
    const sequence = async () => {
      // 1. Terminal Boot
      for (let i = 0; i < terminalLines.length; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 500 : 400));
        setLineIndex(i);
      }

      // 2. Show Logo
      await new Promise(r => setTimeout(r, 600));
      setShowLogo(true);

      // 3. Final Expansion
      await new Promise(r => setTimeout(r, 2000));
      setIsExpanding(true);

      // 4. Exit
      await new Promise(r => setTimeout(r, 1000));
      onComplete();
    };

    sequence();
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden font-mono"
      initial={{ opacity: 1 }}
      animate={isExpanding ? { 
        backgroundColor: "#ffffff",
        transition: { duration: 0.8, ease: "easeIn" }
      } : {}}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-scanline pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-50 opacity-20 bg-grid" style={{ backgroundSize: '40px 40px' }} />

      <div className="max-w-2xl w-full px-8 space-y-12 z-10">
        {/* Terminal Section */}
        <div className="space-y-2 min-h-[160px]">
          <AnimatePresence>
            {terminalLines.map((line, i) => (
              i <= lineIndex && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs md:text-sm flex items-center gap-3 ${line.color || 'text-secondary'}`}
                >
                  <span className="text-primary/40">[{ (i * 0.42).toFixed(2) }s]</span>
                  <span className="tracking-widest uppercase">
                    { i === lineIndex ? (
                      <GlitchText>{line.text}</GlitchText>
                    ) : line.text }
                  </span>
                  { i === lineIndex && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-2 h-4 bg-primary inline-block"
                    />
                  )}
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* ASCII Logo Section */}
        <div className="relative py-12 flex justify-center">
          <AnimatePresence>
            {showLogo && (
              <motion.pre
                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  filter: "blur(0px)",
                  textShadow: [
                    "0 0 10px #00F2FF",
                    "0 0 20px #00F2FF",
                    "0 0 10px #00F2FF"
                  ]
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-[6px] md:text-[10px] leading-[1] text-primary font-bold tracking-tighter whitespace-pre text-center"
              >
                {ASCII_LOGO}
              </motion.pre>
            )}
          </AnimatePresence>

          {/* Background Pulse */}
          <AnimatePresence>
            {showLogo && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.1 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary rounded-full blur-[100px]"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Loading Bar */}
        <div className="w-full h-[2px] bg-white/5 relative overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_#00F2FF]"
          />
        </div>
      </div>

      {/* Decorative Corner Brackets */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/20" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/20" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/20" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/20" />
    </motion.div>
  );
}
