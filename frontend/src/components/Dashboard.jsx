import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from './layout/DashboardLayout';
import IntroAnimation from './intro/IntroAnimation';
import SubjectsModule from './modules/SubjectsModule';
import TasksModule from './modules/TasksModule';
import NotesModule from './modules/NotesModule';
import ClockModule from './modules/ClockModule';
import FocusModule from './modules/FocusModule';
import AutomationModule from './modules/AutomationModule';
import AlarmNotification from './AlarmNotification';
import { getSocket } from '../lib/socket';

import { getSubjects, getTasks, getNotes, getHealth } from '../lib/api';
import { API_BASE } from '../config';

const Dashboard = () => {
    // Check if intro has already played this session
    const hasPlayedIntro = sessionStorage.getItem('nari_intro_played') === 'true';
    const [loading, setLoading] = useState(!hasPlayedIntro);
    const [subjects, setSubjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [connected, setConnected] = useState(false);
    const [disconnectTime, setDisconnectTime] = useState(null);
    const [showWarning, setShowWarning] = useState(false);
    const [triggeredAlarm, setTriggeredAlarm] = useState(null);
    const socketRef = useRef(null);

    // Mark intro as played when it completes
    const handleIntroComplete = () => {
        sessionStorage.setItem('nari_intro_played', 'true');
        setLoading(false);
    };

    // Initial data load
    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                const [s, t, n, health] = await Promise.all([
                    getSubjects().catch(() => []),
                    getTasks().catch(() => []),
                    getNotes().catch(() => []),
                    getHealth().catch(() => ({ ok: false }))
                ]);

                if (!mounted) return;

                setSubjects(s || []);
                setTasks(t || []);
                setNotes(n || []);
            } catch (e) {
                console.error("Failed to load initial data:", e);
            }
        }

        loadData();
        return () => { mounted = false; };
    }, []);

    // Socket setup
    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
            setDisconnectTime(null);
            setShowWarning(false);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
            setDisconnectTime(Date.now());
        });

        // Subject events
        socket.on('subject_added', ({ name }) => {
            console.log('Subject added via socket:', name);
            setSubjects(prev => prev.includes(name) ? prev : [...prev, name]);
        });

        socket.on('subject_removed', ({ name }) => {
            console.log('Subject removed via socket:', name);
            setSubjects(prev => prev.filter(s => s !== name));
            if (selectedSubject === name) setSelectedSubject(null);
        });

        // Task events
        socket.on('task_added', (task) => {
            console.log('Task added via socket:', task);
            setTasks(prev => [task, ...prev.filter(t => t.id !== task.id)]);
        });

        socket.on('task_updated', (task) => {
            console.log('Task updated via socket:', task);
            setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        });

        socket.on('task_deleted', ({ id }) => {
            console.log('Task deleted via socket:', id);
            setTasks(prev => prev.filter(t => t.id !== id));
        });

        // Note events
        socket.on('note_added', (note) => {
            console.log('Note added via socket:', note);
            setNotes(prev => [note, ...prev]);
        });

        socket.on('note_updated', (note) => {
            console.log('Note updated via socket:', note);
            setNotes(prev => prev.map(n => n.id === note.id ? note : n));
        });

        socket.on('note_deleted', ({ id }) => {
            console.log('Note deleted via socket:', id);
            setNotes(prev => prev.filter(n => n.id !== id));
        });

        // Alarm events
        socket.on('alarm_triggered', (alarm) => {
            console.log('Alarm triggered via socket:', alarm);
            setTriggeredAlarm(alarm);

            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ NARI Alarm', {
                    body: alarm.name,
                    icon: '/favicon.ico',
                    requireInteraction: true
                });
            }
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('subject_added');
            socket.off('subject_removed');
            socket.off('task_added');
            socket.off('task_updated');
            socket.off('task_deleted');
            socket.off('note_added');
            socket.off('note_updated');
            socket.off('note_deleted');
            socket.off('alarm_triggered');
        };
    }, []);

    // Monitor disconnection time
    useEffect(() => {
        if (!disconnectTime) return;

        const interval = setInterval(() => {
            if (Date.now() - disconnectTime > 30000) {
                setShowWarning(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [disconnectTime]);


    return (
        <>
            <AnimatePresence>
                {loading && (
                    <IntroAnimation onComplete={handleIntroComplete} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <DashboardLayout connected={connected} showWarning={showWarning}>
                            {/* Row 1: Subjects and Clock */}
                            <div className="lg:col-span-2">
                                <SubjectsModule
                                    subjects={subjects}
                                    setSubjects={setSubjects}
                                    selectedSubject={selectedSubject}
                                    setSelectedSubject={setSelectedSubject}
                                />
                            </div>

                            <ClockModule />

                            {/* Row 2: Focus Timer (full width) */}
                            <div className="lg:col-span-3">
                                <FocusModule selectedSubject={selectedSubject} />
                            </div>

                            {/* Row 3: Tasks and Notes */}
                            <TasksModule tasks={tasks} setTasks={setTasks} />
                            <NotesModule notes={notes} setNotes={setNotes} />

                            {/* Row 4: Automation (full width) */}
                            <div className="lg:col-span-3">
                                <AutomationModule />
                            </div>
                            <div className="lg:col-span-3">
                                <AutomationModule />
                            </div>
                        </DashboardLayout>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alarm Notification Modal */}
            {triggeredAlarm && (
                <AlarmNotification
                    alarm={triggeredAlarm}
                    onDismiss={() => {
                        setTriggeredAlarm(null);
                        // Optionally dismiss on backend
                        fetch(`${API_BASE}/clock/alarms/${triggeredAlarm.id}/dismiss`, { method: 'POST' });
                    }}
                    onSnooze={() => {
                        setTriggeredAlarm(null);
                        // Create a new alarm for 5 minutes from now
                        const now = new Date();
                        now.setMinutes(now.getMinutes() + 5);
                        const snoozeTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                        fetch(`${API_BASE}/clock/alarms`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: `${triggeredAlarm.name} (Snoozed)`,
                                time: snoozeTime,
                                repeat: false
                            })
                        });
                    }}
                />
            )}
        </>
    );
};

export default Dashboard;
