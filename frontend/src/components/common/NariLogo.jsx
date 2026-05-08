import React from 'react';
import { motion } from 'framer-motion';

const NariLogo = ({ size = 40, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]"
      >
        {/* Retro Bracket Frame */}
        <path
          d="M20 10 H10 V90 H20"
          stroke="#00F2FF"
          strokeWidth="4"
          strokeLinecap="square"
        />
        <path
          d="M80 10 H90 V90 H80"
          stroke="#00F2FF"
          strokeWidth="4"
          strokeLinecap="square"
        />

        {/* Central 'N' - Stylized and Sharp */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d="M30 75 V25 L70 75 V25"
          stroke="#00F2FF"
          strokeWidth="8"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />

        {/* Decorative Data Points */}
        <rect x="15" y="15" width="4" height="4" fill="#7000FF" />
        <rect x="81" y="81" width="4" height="4" fill="#7000FF" />
        
        {/* Animated Scanning Line */}
        <motion.rect
          animate={{ 
            y: [10, 80, 10],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          x="15" 
          y="10" 
          width="70" 
          height="1" 
          fill="#00F2FF"
          style={{ filter: 'blur(1px)' }}
        />
      </svg>
    </div>
  );
};

export default NariLogo;
