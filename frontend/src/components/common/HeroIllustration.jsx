import React from 'react';
import { motion } from 'framer-motion';

const HeroIllustration = ({ className = "" }) => {
  return (
    <div className={`relative w-full max-w-lg aspect-square mx-auto ${className}`}>
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]"
      >
        {/* Background Hexagon Grid */}
        <defs>
          <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path d="M25 0 L50 14.4 L50 28.8 L25 43.4 L0 28.8 L0 14.4 Z" fill="none" stroke="rgba(0, 242, 255, 0.1)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />

        {/* Outer Rotating Ring */}
        <motion.circle
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          cx="200" cy="200" r="160"
          stroke="#00F2FF"
          strokeWidth="1"
          strokeDasharray="20 40"
          style={{ transformOrigin: 'center' }}
        />

        {/* Middle Pulsing Ring */}
        <motion.circle
          animate={{ 
            r: [120, 130, 120],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          cx="200" cy="200" r="120"
          stroke="#7000FF"
          strokeWidth="2"
        />

        {/* Central Core - The 'Intelligence' */}
        <g transform="translate(200, 200)">
          {/* Geometric Core */}
          <motion.path
            animate={{ 
              rotate: -360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            d="M0 -60 L52 -30 V30 L0 60 L-52 30 V-30 Z"
            fill="rgba(0, 242, 255, 0.1)"
            stroke="#00F2FF"
            strokeWidth="3"
          />

          {/* Core Glow */}
          <circle r="20" fill="#00F2FF" className="blur-xl opacity-50" />
          <circle r="5" fill="#00F2FF" />

          {/* Data Lines Shooting Out */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.line
              key={i}
              initial={{ x2: 0, y2: 0 }}
              animate={{ 
                x2: 150 * Math.cos((angle * Math.PI) / 180),
                y2: 150 * Math.sin((angle * Math.PI) / 180),
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              x1="0" y1="0"
              stroke="#00F2FF"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Terminal Corner Ornaments */}
        <path d="M20 20 H60 M20 20 V60" stroke="#00F2FF" strokeWidth="2" />
        <path d="M380 20 H340 M380 20 V60" stroke="#00F2FF" strokeWidth="2" />
        <path d="M20 380 H60 M20 380 V340" stroke="#00F2FF" strokeWidth="2" />
        <path d="M380 380 H340 M380 380 V340" stroke="#00F2FF" strokeWidth="2" />
      </svg>
      
      {/* HUD Text Overlays */}
      <div className="absolute top-8 left-8 text-[8px] font-mono text-primary/50 flex flex-col gap-1">
        <span>CORE_TEMP: 32.4°C</span>
        <span>LATENCY: 12ms</span>
        <span>MEMORY_LOAD: 42%</span>
      </div>
      <div className="absolute bottom-8 right-8 text-[8px] font-mono text-accent/50 flex flex-col items-end gap-1">
        <span>SYST_Uptime: 1024:12:05</span>
        <span>ENCRYPTION: AES-256</span>
        <span>AUTH_STATUS: VERIFIED</span>
      </div>
    </div>
  );
};

export default HeroIllustration;
