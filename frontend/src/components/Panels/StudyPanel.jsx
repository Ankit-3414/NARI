import React from "react";

export default function StudyPanel({ studyStatus, onStart, onStop, selectedSubject }) {
  async function handle() {
    if (studyStatus) {
      await onStop();
    } else if (selectedSubject) {
      await onStart(selectedSubject);
    }
  }

  return (
    <div className="text-center">
      <button
        onClick={handle}
        disabled={!selectedSubject && !studyStatus}
        className={`px-6 py-3 rounded-full transition-all duration-200
          ${studyStatus
            ? "bg-[rgba(255,255,255,0.04)] text-slate-400 cursor-not-allowed"
            : selectedSubject
              ? "bg-linear-to-r from-cyan-400 to-blue-600 text-black hover:scale-105"
              : "bg-[rgba(255,255,255,0.04)] text-slate-600 cursor-not-allowed"}
        `}
        aria-label={studyStatus ? "Stop Focus Timer" : "Start Focus Timer"}
      >
        {studyStatus ? "Stop Focus" : "Start Focus"}
      </button>
    </div>
  );
}
