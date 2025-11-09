import React, { useEffect, useState, useRef } from "react";
import {
  getSubjects,
  getTasks,
  getNotes,
  getStudyStatus,
  startStudy,
  stopStudy,
  getHealth,
} from "../lib/api";
import { getSocket } from "../lib/socket";
import TasksPanel from "./Panels/TasksPanel";
import NotesPanel from "./Panels/NotesPanel";
import SubjectsPanel from "./Panels/SubjectsPanel";
import StudyPanel from "./Panels/StudyPanel";
import ActivityPanel from "./Panels/ActivityPanel";
import CoreOrb from "./CoreOrb";

export default function NariFrontend() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [studyStatus, setStudyStatus] = useState(null);
  const [serverOk, setServerOk] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null); // New state for error messages
  const [activity, setActivity] = useState([]);
  const socketRef = useRef(null);

  // initial load
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
        console.log("Fetched subjects:", s); // Debugging line
        setSubjects(s || []);
        setTasks(t || []);
        setNotes(n || []);
        setStudyStatus(ss || null);
        setServerOk(healthStatus.ok);
        setErrorMessage(healthStatus.ok ? null : "Failed to connect to server or load data.");
      } catch (e) {
        console.warn("load error", e);
        setServerOk(false);
        setErrorMessage("Failed to connect to server or load data."); // Set a generic error message
      }
    }
    load();

    const socket = getSocket();
    socketRef.current = socket;

    // tasks
    socket.on("task_added", (item) => {
      setTasks((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
      pushActivity(`Task added: ${item.title}`);
    });
    socket.on("task_updated", (item) => {
      setTasks((prev) => prev.map((t) => (t.id === item.id ? item : t)));
      pushActivity(`Task updated: ${item.title}`);
    });
    socket.on("task_deleted", ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      pushActivity(`Task deleted: ${id}`);
    });

    // notes
    socket.on("note_added", (n) => {
      setNotes((prev) => [n, ...prev]);
      pushActivity(`Note added: ${n.title}`);
    });
    socket.on("note_updated", (n) => {
      setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
      pushActivity(`Note updated: ${n.title}`);
    });
    socket.on("note_deleted", ({ id }) => {
      setNotes((prev) => prev.filter((x) => x.id !== id));
      pushActivity(`Note deleted: ${id}`);
    });

    // subjects
    socket.on("subject_added", ({ name }) => {
      setSubjects((prev) => (prev.includes(name) ? prev : [...prev, name]));
      pushActivity(`Subject added: ${name}`);
    });
    socket.on("subject_removed", ({ name }) => {
      setSubjects((prev) => prev.filter((s) => s !== name));
      pushActivity(`Subject removed: ${name}`);
    });

    // study
    socket.on("study_started", (payload) => {
      setStudyStatus(payload);
      pushActivity(`Study started: ${payload.subject}`);
    });
    socket.on("study_stopped", (payload) => {
      setStudyStatus(null);
      pushActivity(`Study stopped: ${payload.subject}`);
    });

    function pushActivity(line) {
      setActivity((a) => [{ time: new Date().toLocaleTimeString(), text: line }, ...a].slice(0, 200));
    }

    return () => {
      mounted = false;
      // optional: socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#030417] to-[#071027] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <aside className="col-span-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-400/40 to-amber-400/30 flex items-center justify-center text-black font-bold">N</div>
            <div>
              <div className="text-sm text-slate-300">NARI</div>
              <div className="text-xs text-slate-500">Not A Random Intelligence</div>
            </div>
          </div>

          <div className="text-xs text-slate-400">Server</div>
          <div className={`mt-2 inline-block px-2 py-1 rounded text-xs ${serverOk ? "bg-emerald-600/80 text-black" : "bg-red-600/80 text-white"}`}>
            {serverOk ? "Online" : "Offline"}
          </div>

          <div className="mt-4">
            <SubjectsPanel subjects={subjects} setSubjects={setSubjects} />
          </div>

          <div className="mt-6">
            <div className="text-xs text-slate-400">Quick</div>
            <div className="mt-2 flex flex-col gap-2">
              <button onClick={() => window.dispatchEvent(new Event("nari:add-task"))} className="py-2 rounded-lg bg-linear-to-r from-pink-500 to-purple-500 text-sm">+ Task</button>
              <button onClick={() => window.dispatchEvent(new Event("nari:add-note"))} className="py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] text-sm">+ Note</button>
            </div>
          </div>
        </aside>

        <main className="col-span-6 rounded-3xl relative overflow-hidden p-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] border border-[rgba(255,255,255,0.03)]">
          <div className="text-center mb-4">
            <div className="text-sm text-slate-400">Mode</div>
            <div className="text-2xl font-extrabold tracking-wide">{studyStatus ? "FOCUS" : "IDLE"}</div>
            <div className="text-xs text-slate-500">{studyStatus ? `Studying: ${studyStatus.subject}` : "No subject selected"}</div>
            {errorMessage && (
              <div className="mt-2 text-red-400 text-sm">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <CoreOrb studyStatus={studyStatus} />
            <div className="mt-6">
              <StudyPanel studyStatus={studyStatus} onStart={startStudy} onStop={stopStudy} />
            </div>
          </div>
        </main>

        <aside className="col-span-3 space-y-4">
          <TasksPanel tasks={tasks} setTasks={setTasks} />
          <NotesPanel notes={notes} />
          <ActivityPanel items={activity} />
        </aside>
      </div>
    </div>
  );
}
