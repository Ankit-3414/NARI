import React from "react";
import { createNote, deleteNote } from "../../lib/api";

export default function NotesPanel({ notes = [] }) {
  async function add() {
    const title = prompt("Note title");
    if (!title) return;
    try {
      await createNote({ title, content: "" });
    } catch (e) {
      alert("Create failed: " + e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this note?")) return;
    try {
      await deleteNote(id);
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm text-slate-300 font-semibold">Notes</h2>
        <button onClick={add} className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-colors" aria-label="Add new note">+ Add</button>
      </div>
      <div className="space-y-2 max-h-44 overflow-auto">
        {notes.length === 0 && <div className="text-xs text-slate-500">No notes</div>}
        {notes.slice(0, 50).map((n) => (
          <div key={n.id} className="p-2 rounded-md bg-[rgba(255,255,255,0.01)]">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{n.title}</div>
              <button onClick={() => remove(n.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors" aria-label="Delete note">x</button>
            </div>
            <div className="text-xs text-slate-500">{new Date(n.created).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
