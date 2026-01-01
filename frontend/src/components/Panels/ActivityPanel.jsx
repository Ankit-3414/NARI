import React from "react";

export default function ActivityPanel({ items = [] }) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm text-slate-300 font-semibold">Activity</h2>
        <div className="text-xs text-slate-500">Live</div>
      </div>
      <div className="text-xs text-slate-400 space-y-2 max-h-40 overflow-auto">
        {items.length === 0 && <div>No activity yet</div>}
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between">
            <div>{it.text}</div>
            <div className="text-slate-500 text-xs">{it.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
