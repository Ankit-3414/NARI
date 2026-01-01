import React, { useEffect, useState, useRef } from "react";
import {
  getSubjects,
  getTasks,
  getNotes,
  getStudyStatus,
  startStudy,
  stopStudy,
  getHealth,
  getActivityLog,
} from "../lib/api";
import { getSocket } from "../lib/socket";
import TasksPanel from "./Panels/TasksPanel";
import NotesPanel from "./Panels/NotesPanel";
import SubjectsPanel from "./Panels/SubjectsPanel";
import StudyPanel from "./Panels/StudyPanel";
import ActivityPanel from "./Panels/ActivityPanel";
import CoreOrb from "./CoreOrb";
import Clock from "./Clock";

export default function NariFrontend() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [studyStatus, setStudyStatus] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null); // New state for selected subject
  const [elapsedTime, setElapsedTime] = useState(0); // New state for elapsed time
  const [serverOk, setServerOk] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null); // New state for error messages
  const [activity, setActivity] = useState([]);
  const socketRef = useRef(null);

  function pushActivity(line) {
    setActivity((a) => [{ time: new Date().toLocaleTimeString(), text: line }, ...a].slice(0, 200));
  }

  // initial load
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [s, t, n, ss, healthStatus, activityLog] = await Promise.all([
          getSubjects().catch(() => []),
          getTasks().catch(() => []),
          getNotes().catch(() => []),
          getStudyStatus().catch(() => null),
          getHealth(),
          getActivityLog().catch((e) => {
            console.error("Failed to fetch activity log:", e);
            return [];
          }),
        ]);
        if (!mounted) return;
        console.log("Fetched subjects:", s); // Debugging line
        setSubjects(s || []);
        setTasks(t || []);
        setNotes(n || []);
        setStudyStatus(ss || null);
        setActivity(activityLog || []);
        setServerOk(healthStatus.ok);
        setErrorMessage(healthStatus.ok ? null : "Failed to connect to server or load data.");
      } catch (e) {
        console.warn("load error", e);
        setServerOk(false);
        setErrorMessage("Failed to connect to server or load data."); // Set a generic error message
      }
    }
    console.log("NARI Frontend v0.3.1 - Activity Log Update");
    load();

    const socket = getSocket();
    socketRef.current = socket;

    // tasks
    // tasks
    socket.on("task_added", (item) => {
      setTasks((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
    });
    socket.on("task_updated", (item) => {
      setTasks((prev) => prev.map((t) => (t.id === item.id ? item : t)));
    });
    socket.on("task_deleted", ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

    // notes
    // notes
    socket.on("note_added", (n) => {
      setNotes((prev) => [n, ...prev]);
    });
    socket.on("note_updated", (n) => {
      setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
    });
    socket.on("note_deleted", ({ id }) => {
      setNotes((prev) => prev.filter((x) => x.id !== id));
    });

    // subjects
    // subjects
    socket.on("subject_added", ({ name }) => {
      setSubjects((prev) => (prev.includes(name) ? prev : [...prev, name]));
    });
    socket.on("subject_removed", ({ name }) => {
      setSubjects((prev) => prev.filter((s) => s !== name));
    });

    // study
    // study
    socket.on("study_started", (payload) => {
      setStudyStatus(payload);
    });
    socket.on("study_stopped", (payload) => {
      setStudyStatus(null);
      setElapsedTime(0); // Reset elapsed time on stop
    });

    // activity
    socket.on("activity_logged", (item) => {
      setActivity((prev) => [item, ...prev].slice(0, 200));
    });

    return () => {
      mounted = false;
      // optional: socket.disconnect();
    };
  }, []);

  // Elapsed time calculation
  useEffect(() => {
    let elapsedTimerId;
    if (studyStatus && studyStatus.start) {
      const startTime = new Date(studyStatus.start).getTime();
      elapsedTimerId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (elapsedTimerId) {
      clearInterval(elapsedTimerId);
    }

    return () => {
      if (elapsedTimerId) {
        clearInterval(elapsedTimerId);
      }
    };
  }, [studyStatus, setElapsedTime]);

  const formatElapsedTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#030417] to-[#071027] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <aside className="col-span-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <img src="/nari_logo.png" alt="NARI Logo" className="w-12 h-12 rounded-full object-cover shadow-lg border border-cyan-500/20" />
            <div>
              <h1 className="text-sm text-slate-300 font-bold">NARI</h1>
              <div className="text-xs text-slate-500">Not A Random Intelligence</div>
            </div>
          </div>

          <h3 className="text-xs text-slate-400 font-semibold">Server</h3>
          <div className={`mt-2 inline-block px-2 py-1 rounded text-xs ${serverOk ? "bg-emerald-600/80 text-black" : "bg-red-600/80 text-white"}`}>
            {serverOk ? "Online" : "Offline"}
          </div>

          <div className="mt-4">
            <SubjectsPanel subjects={subjects} setSubjects={setSubjects} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} />
          </div>

          <div className="mt-6">
            <h3 className="text-xs text-slate-400 font-semibold">Quick</h3>
            <div className="mt-2 flex flex-col gap-2">
              <button onClick={() => window.dispatchEvent(new Event("nari:add-task"))} className="py-2 rounded-lg bg-linear-to-r from-pink-500 to-purple-500 text-sm font-medium hover:brightness-110 active:scale-95 transition-all text-white shadow-lg shadow-purple-500/20" aria-label="Add new task">+ Task</button>
              <button onClick={() => window.dispatchEvent(new Event("nari:add-note"))} className="py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm hover:bg-[rgba(255,255,255,0.1)] active:scale-95 transition-all" aria-label="Add new note">+ Note</button>
            </div>
          </div>
        </aside>

        <main className="col-span-6 rounded-3xl relative overflow-hidden p-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] border border-[rgba(255,255,255,0.03)]">
          <Clock />
          <div className="text-center mb-4">
            <h3 className="text-sm text-slate-400 font-semibold mb-1">Mode</h3>
            <div className="text-2xl font-extrabold tracking-wide text-white drop-shadow-md">{studyStatus ? "FOCUS" : "IDLE"}</div>
            <div className="text-xs text-slate-500">
              {studyStatus ? (
                <>
                  Studying: {studyStatus.subject} ({formatElapsedTime(elapsedTime)})
                </>
              ) : (
                selectedSubject ? `Selected: ${selectedSubject}` : "No subject selected"
              )}
            </div>
            {errorMessage && (
              <div className="mt-2 text-red-400 text-sm">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <CoreOrb studyStatus={studyStatus} />
            <div className="mt-6">
              <StudyPanel studyStatus={studyStatus} onStart={startStudy} onStop={stopStudy} selectedSubject={selectedSubject} />
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
