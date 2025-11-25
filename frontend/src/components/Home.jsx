import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTasks,
  getNotes,
  getSubjects,
  getStudyStatus,
  startStudy,
  stopStudy,
  getHealth,
  deleteNote,
  updateTask,
  deleteTask,
  addSubject,
  deleteSubject,
  createTask,
  createNote,
} from "@lib/api.js";
import { getSocket } from "@lib/socket.js";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Clock from "./Clock";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [study, setStudy] = useState(null);
  const [activity, setActivity] = useState([]);
  const [connected, setConnected] = useState(false);
  const [serverOk, setServerOk] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  const addActivity = (msg) => {
    setActivity((a) => [{ msg, time: new Date().toLocaleTimeString() }, ...a.slice(0, 20)]);
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [s, t, n, ss, healthStatus] = await Promise.all([
          getSubjects().catch(() => []),
          getTasks().catch(() => []),
          getNotes().catch(() => []),
          getStudyStatus().catch(() => null),
          getHealth(),
        ]);
        if (!mounted) return;
        setSubjects(s || []);
        setTasks(t || []);
        setNotes(n || []);
        setStudy(ss);
        setServerOk(healthStatus.ok);
      } catch (e) {
        console.error("Initial load failed:", e);
        setServerOk(false);
      }
    }
    load();

    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      addActivity("🔗 Connected to backend");
    });
    socket.on("disconnect", (reason) => {
      setConnected(false);
      addActivity(`⚠️ Disconnected from backend: ${reason}`);
    });

    socket.on("task_added", (t) => {
      setTasks((prev) => [t, ...prev.filter((x) => x.id !== t.id)]);
      addActivity(`📝 Task added: ${t.title}`);
    });
    socket.on("task_updated", (t) => {
      setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      addActivity(`✅ Task updated: ${t.title}`);
    });
    socket.on("task_deleted", ({ id }) => {
      setTasks((prev) => prev.filter((x) => x.id !== id));
      addActivity(`🗑️ Task deleted: ${id}`);
    });

    socket.on("note_added", (n) => {
      setNotes((prev) => [n, ...prev]);
      addActivity(`📒 Note created: ${n.title}`);
    });
    socket.on("note_updated", (n) => {
      setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
      addActivity(`✍️ Note updated: ${n.title}`);
    });
    socket.on("note_deleted", ({ id }) => {
      setNotes((prev) => prev.filter((x) => x.id !== id));
      addActivity(`🗑️ Note deleted: ${id}`);
    });

    socket.on("subject_added", ({ name }) => {
      setSubjects((prev) => (prev.includes(name) ? prev : [...prev, name]));
      addActivity(`📚 Subject added: ${name}`);
    });
    socket.on("subject_removed", ({ name }) => {
      setSubjects((prev) => prev.filter((s) => s !== name));
      addActivity(`❌ Subject removed: ${name}`);
      if (selectedSubject === name) setSelectedSubject(null);
    });

    socket.on("study_started", (s) => {
      setStudy(s);
      setElapsed(0);
      addActivity(`⚡ Focus started: ${s.subject}`);
    });
    socket.on("study_stopped", (s) => {
      setStudy(null);
      addActivity(`💤 Focus stopped: ${s.subject}`);
      setElapsed(0);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!study) {
      clearInterval(timerRef.current);
      setElapsed(0);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);

    const startTime = new Date(study.start);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime.getTime();
      setElapsed(Math.floor(diff / 1000));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [study]);

  async function toggleStudy() {
    if (!study) {
      if (!selectedSubject) {
        alert("Please select a subject to start focus mode.");
        return;
      }
      try {
        await startStudy(selectedSubject);
      } catch (e) {
        alert("Failed to start study: " + e.message);
      }
    } else {
      try {
        await stopStudy(true);
      } catch (e) {
        alert("Failed to stop study: " + e.message);
      }
    }
  }

  const glow =
    study?.subject === "Physics"
      ? "#00FFFF"
      : study?.subject === "Chemistry"
      ? "#FF6FB3"
      : study?.subject === "Math"
      ? "#FBBF24"
      : "#00FFFF";

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-[#030417] to-[#071027] text-slate-100">
      <header className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <h1 className="font-bold text-lg tracking-wide mb-2 sm:mb-0">
          NARI — Not A Random Intelligence
        </h1>
        <div className="flex items-center gap-4 text-xs">
          <span className={serverOk && connected ? "text-emerald-400" : "text-red-400"}>
            {serverOk && connected ? "Realtime Connected" : "Disconnected"}
          </span>
          <span className="opacity-60">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <aside className="col-span-1 lg:col-span-3 bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm text-slate-400">Subjects</h2>
            <button
              onClick={handleAddSubject}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`bg-white/10 text-xs px-3 py-1 rounded-md cursor-pointer transition-all duration-200 ${selectedSubject === s ? "bg-cyan-700/50 scale-105" : "hover:bg-white/20 hover:scale-105"}`}
              >
                {s}
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s); }} className="ml-2 text-red-400 hover:text-red-300">x</button>
              </span>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 mb-2">
            <h2 className="text-sm text-slate-400">Notes</h2>
            <button onClick={handleAddNote} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">+ Add</button>
          </div>
          <div className="space-y-1 max-h-48 overflow-auto">
            {notes.slice(0, 5).map((n) => (
              <div key={n.id} className="text-xs bg-white/10 px-2 py-1 rounded-md truncate flex justify-between items-center">
                <span>{n.title}</span>
                <button onClick={() => handleDeleteNote(n.id)} className="ml-2 text-red-400 hover:text-red-300">x</button>
              </div>
            ))}
          </div>
        </aside>

        <main className="col-span-1 lg:col-span-6 flex flex-col items-center justify-start relative">
          {/* Clock wrapper: centers the clock inside the center column */}
          <div className="w-full flex justify-center items-center mt-2 z-20">
            {/* Give the Clock a constrained width so it centers properly */}
            <div className="w-48 h-auto flex justify-center items-center">
              <Clock />
            </div>
          </div>

          {/* Glowing background effect (behind) */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [`0 0 20px ${glow}`, `0 0 40px ${glow}`, `0 0 20px ${glow}`],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute top-24 left-1/2 transform -translate-x-1/2 w-80 h-80 rounded-full blur-2xl z-0"
            style={{ background: `radial-gradient(${glow}, transparent 70%)` }}
          />

          {/* Focus circle placed below the clock */}
          <div className="w-64 h-64 relative z-10 mt-12">
            <CircularProgressbar
              value={elapsed % 3600}
              maxValue={3600}
              text={`${mins}m ${secs}s`}
              styles={buildStyles({
                textColor: "#fff",
                pathColor: glow,
                trailColor: "rgba(255,255,255,0.1)",
              })}
            />
          </div>

          <h2 className="mt-6 font-semibold text-lg z-10">
            {study ? study.subject : selectedSubject ? `Selected: ${selectedSubject}` : "Idle Mode"}
          </h2>
          <button
            onClick={toggleStudy}
            className={`mt-3 px-6 py-2 rounded-full transition-transform ${study || selectedSubject ? "bg-linear-to-r from-cyan-400 to-blue-600 text-black hover:scale-105" : "bg-white/10 text-slate-400 cursor-not-allowed"}`}
            disabled={!selectedSubject && !study}
          >
            {study ? "Stop Session" : "Start Focus"}
          </button>
        </main>

        <aside className="col-span-1 lg:col-span-3 bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm text-slate-400">Tasks</h2>
            <button onClick={handleAddTask} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">+ Add</button>
          </div>
          <div className="space-y-1 max-h-48 overflow-auto">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="text-xs bg-white/10 px-2 py-1 rounded-md truncate flex justify-between items-center">
                <span>{t.title}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.status === "completed"}
                    onChange={() => handleUpdateTask(t.id, t.status === "completed" ? "pending" : "completed")}
                    className="form-checkbox text-cyan-400 rounded focus:ring-cyan-500"
                  />
                  <button onClick={() => handleDeleteTask(t.id)} className="text-red-400 hover:text-red-300">x</button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-sm text-slate-400 mt-6 mb-2">Activity</h2>
          <div className="overflow-auto max-h-48 text-xs space-y-1">
            <AnimatePresence>
              {activity.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/10 rounded-md px-2 py-1 flex justify-between"
                >
                  <span>{a.msg}</span>
                  <span className="opacity-50">{a.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      <footer className="text-center text-[10px] text-slate-500 pb-3 mt-6 lg:mt-0">
        v0.2 • Local NARI Instance • {serverOk && connected ? "🔗 Synced" : "⚠️ Waiting"}
      </footer>
    </div>
  );
}

// NOTE: helper functions referenced in the JSX (handleAddSubject, handleDeleteSubject, handleAddNote, handleDeleteNote, handleAddTask, handleUpdateTask, handleDeleteTask) should be present elsewhere in this file or in your api module. If you used the previous version of Home.jsx you already have them; keep them the same. If you removed them earlier, re-add implementations accordingly.


