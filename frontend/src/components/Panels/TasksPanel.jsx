import React from "react";
import { createTask, updateTask, deleteTask } from "../../lib/api";

export default function TasksPanel({ tasks = [], setTasks }) {
  async function add() {
    const title = prompt("Task title");
    if (!title) return;
    try {
      await createTask({ title, priority: "normal" });
      // backend will emit socket event which updates list; optionally fetch again
    } catch (e) {
      alert("Failed to create task: " + e.message);
    }
  }

  async function toggle(t) {
    try {
      await updateTask(t.id, { status: t.status === "completed" ? "pending" : "completed" });
    } catch (e) {
      alert("Update failed");
    }
  }

  async function remove(id) {
    if (!confirm("Delete task?")) return;
    try {
      await deleteTask(id);
    } catch (e) {
      alert("Delete failed");
    }
  }

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-300">Tasks</div>
        <button onClick={add} className="text-xs px-2 py-1 rounded bg-cyan-500/80 text-black">+ Add</button>
      </div>
      <div className="space-y-2 max-h-48 overflow-auto">
        {tasks.length === 0 && <div className="text-xs text-slate-500">No tasks</div>}
        {tasks.slice(0, 50).map((t) => (
          <div key={t.id} className={`p-3 rounded-lg flex justify-between items-center ${t.status === "completed" ? "opacity-60 line-through" : ""}`}>
            <div>
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-xs text-slate-500">{t.priority} • {t.due || "—"}</div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => toggle(t)} className="text-xs px-2 py-1 rounded bg-[rgba(0,255,255,0.06)]">{t.status === "completed" ? "Undo" : "Done"}</button>
              <button onClick={() => remove(t.id)} className="text-xs text-red-400">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
