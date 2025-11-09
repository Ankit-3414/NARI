import React from "react";
import { motion } from "framer-motion";

export default function CoreOrb({ studyStatus }) {
  return (
    <motion.div
      animate={ studyStatus ? { scale: [1, 1.06, 1] } : { scale: [1, 1.02, 1] } }
      transition={{ repeat: Infinity, duration: 6 }}
      className="relative"
    >
      <div style={{ width: 220, height: 220 }} className="rounded-full bg-[conic-gradient(from_0deg,_#00ffff22,_#ff6fb322,_#00ffff22)] blur-2xl opacity-40"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-400/40 to-blue-600/10 flex items-center justify-center text-xl font-mono">
          {studyStatus ? new Date(studyStatus.start).toLocaleTimeString() : "—"}
        </div>
      </div>
    </motion.div>
  );
}
