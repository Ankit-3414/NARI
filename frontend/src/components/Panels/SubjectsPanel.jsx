import React from "react";
import { addSubject, deleteSubject } from "../../lib/api";

export default function SubjectsPanel({ subjects = [], setSubjects, selectedSubject, setSelectedSubject }) {
  async function add() {
    const name = prompt("Subject name");
    if (!name) return;
    try {
      await addSubject(name);
      // backend socket will update list
    } catch (e) {
      alert("Add failed");
    }
  }

  async function remove(name) {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      await deleteSubject(name);
    } catch (e) {
      alert("Delete failed");
    }
  }

  return (
    <div>
      <div className="text-xs text-slate-400">Subjects</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {subjects.map((s) => (
          <div
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-all duration-200
              ${selectedSubject === s ? "bg-cyan-700/50 scale-105" : "bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] hover:scale-105"}`}
          >
            <span className="text-sm">{s}</span>
            <button onClick={(e) => { e.stopPropagation(); remove(s); }} className="text-xs text-red-400">x</button>
          </div>
        ))}
        <button onClick={add} className="px-3 py-1 text-xs rounded-md bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]">+ Add</button>
      </div>
    </div>
  );
}
