import React from "react";

export default function StudyPanel({ studyStatus, onStart, onStop }) {
  async function handle() {
    if (!studyStatus) {
      const subject = prompt("Start study for subject:");
      if (!subject) return;
      await onStart(subject);
    } else {
      await onStop(true);
    }
  }

  return (
    <div className="flex gap-3">
      <button onClick={handle} className={`px-6 py-3 rounded-full ${studyStatus ? "bg-[rgba(255,255,255,0.04)]" : "bg-gradient-to-r from-cyan-400 to-blue-600 text-black"}`}>
        {studyStatus ? "Stop" : "Start Focus"}
      </button>
    </div>
  );
}
