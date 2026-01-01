import React, { useEffect, useRef } from "react";

export default function ActivityPanel({ items = [] }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  return (
    <div className="bg-[#0c0d15] border border-cyan-500/20 rounded-2xl p-4 flex flex-col h-[400px] shadow-2xl shadow-cyan-500/5">
      <div className="flex justify-between items-center mb-3 border-b border-cyan-500/10 pb-2">
        <h2 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold font-mono">System Console</h2>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 text-[11px] font-mono leading-relaxed overflow-y-auto space-y-1 scrollbar-hide custom-terminal-scroll"
      >
        {items.length === 0 && (
          <div className="text-slate-600 italic">Initializing NARI kernel...</div>
        )}
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 group animate-in fade-in slide-in-from-left-1 duration-300">
            <span className="text-slate-600 shrink-0">[{it.time}]</span>
            <span className={`
              ${it.text.includes('API:') ? 'text-blue-400' :
                it.text.includes('Task') ? 'text-purple-400' :
                  it.text.includes('Study') ? 'text-amber-400' :
                    'text-slate-300'}
            `}>
              {it.text}
            </span>
          </div>
        ))}
        <div className="text-cyan-500 animate-pulse inline-block w-2 h-3 bg-cyan-500 align-middle ml-1"></div>
      </div>

      <div className="mt-2 text-[9px] text-slate-700 font-mono text-right uppercase italic">
        root@nari:~$ line_active
      </div>

      <style jsx>{`
        .custom-terminal-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-terminal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-terminal-scroll::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.1);
          border-radius: 10px;
        }
        .custom-terminal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.3);
        }
      `}</style>
    </div>
  );
}

