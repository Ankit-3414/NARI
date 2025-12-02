import React, { useState, useEffect } from 'react';
import ModuleCard from '../layout/ModuleCard';
import { Bell, X, Plus, Check, Clock as ClockIcon, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { getSocket } from '@lib/socket';

const ClockModule = () => {
    const [activeTab, setActiveTab] = useState('clock');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alarms, setAlarms] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newAlarmName, setNewAlarmName] = useState('');
    const [newAlarmDate, setNewAlarmDate] = useState('');
    const [newAlarmTime, setNewAlarmTime] = useState('');

    // Stopwatch state
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [stopwatchRunning, setStopwatchRunning] = useState(false);
    const [stopwatchInterval, setStopwatchInterval] = useState(null);

    // Timer state
    const [timerMinutes, setTimerMinutes] = useState(5);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerInterval, setTimerInterval] = useState(null);

    // Fetch alarms on mount
    useEffect(() => {
        fetch('http://localhost:5000/api/clock/alarms')
            .then(res => res.json())
            .then(data => setAlarms(data || []))
            .catch(err => console.error("Failed to fetch alarms", err));

        const socket = getSocket();

        socket.on('alarm_added', (alarm) => {
            console.log('Alarm added via socket:', alarm);
            setAlarms(prev => prev.some(a => a.id === alarm.id) ? prev : [...prev, alarm]);
        });
        socket.on('alarm_deleted', ({ id }) => setAlarms(prev => prev.filter(a => a.id !== id)));
        socket.on('alarm_updated', (alarm) => setAlarms(prev => prev.map(a => a.id === alarm.id ? alarm : a)));

        // Listen for alarm triggers
        socket.on('alarm_triggered', (alarm) => {
            console.log('Alarm triggered:', alarm);
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ NARI Alarm', {
                    body: alarm.name,
                    icon: '/favicon.ico',
                    requireInteraction: true
                });
            }
            // Also show alert
            const dismiss = window.confirm(`⏰ ALARM: ${alarm.name}\n\nClick OK to dismiss`);
            if (dismiss) {
                fetch(`http://localhost:5000/api/clock/alarms/${alarm.id}/dismiss`, { method: 'POST' });
            }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            socket.off('alarm_added');
            socket.off('alarm_deleted');
            socket.off('alarm_updated');
            socket.off('alarm_triggered');
        };
    }, []);

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Stopwatch effect
    useEffect(() => {
        if (stopwatchRunning) {
            const interval = setInterval(() => {
                setStopwatchTime(prev => prev + 10);
            }, 10);
            setStopwatchInterval(interval);
            return () => clearInterval(interval);
        } else if (stopwatchInterval) {
            clearInterval(stopwatchInterval);
        }
    }, [stopwatchRunning]);

    // Timer effect
    useEffect(() => {
        if (timerRunning && (timerMinutes > 0 || timerSeconds > 0)) {
            const interval = setInterval(() => {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) {
                        setTimerRunning(false);
                        // Show notification when timer ends
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('⏲️ NARI Timer', {
                                body: 'Timer finished!',
                                icon: '/favicon.ico'
                            });
                        }
                        alert('⏲️ Timer finished!');
                    } else {
                        setTimerMinutes(prev => prev - 1);
                        setTimerSeconds(59);
                    }
                } else {
                    setTimerSeconds(prev => prev - 1);
                }
            }, 1000);
            setTimerInterval(interval);
            return () => clearInterval(interval);
        } else if (timerInterval) {
            clearInterval(timerInterval);
        }
    }, [timerRunning, timerMinutes, timerSeconds]);

    const formatTime = (date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const formatStopwatch = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const handleAddAlarm = async () => {
        if (!newAlarmName.trim() || !newAlarmDate || !newAlarmTime) return;

        const alarmDateTime = `${newAlarmDate} ${newAlarmTime}`;

        try {
            const res = await fetch('http://localhost:5000/api/clock/alarms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newAlarmName.trim(), time: alarmDateTime, repeat: false })
            });
            if (res.ok) {
                console.log('Alarm added');
                // Socket.IO will handle the state update
                setNewAlarmName('');
                setNewAlarmDate('');
                setNewAlarmTime('');
                setIsAdding(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAlarm = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/clock/alarms/${id}`, { method: 'DELETE' });
            console.log('Alarm deleted:', id);
            // Socket.IO will handle the state update
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleAlarm = async (id, currentStatus) => {
        try {
            await fetch(`http://localhost:5000/api/clock/alarms/${id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !currentStatus })
            });
            console.log('Alarm toggled:', id);
            // Socket.IO will handle the state update
        } catch (e) {
            console.error(e);
        }
    };

    const getDefaultDateTime = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        return { date, time };
    };

    return (
        <ModuleCard title="Clock" defaultExpanded={true}>
            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-700">
                {[
                    { id: 'clock', icon: ClockIcon, label: 'Clock' },
                    { id: 'alarm', icon: Bell, label: 'Alarm' },
                    { id: 'timer', icon: Timer, label: 'Timer' },
                    { id: 'stopwatch', icon: Timer, label: 'Stopwatch' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${activeTab === tab.id
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Clock Tab */}
            {activeTab === 'clock' && (
                <div className="flex flex-col items-center py-8">
                    <div className="text-6xl font-mono font-light tracking-wider text-white mb-2">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-sm text-gray-500">
                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            )}

            {/* Alarm Tab */}
            {activeTab === 'alarm' && (
                <div className="space-y-2">
                    {isAdding && (
                        <div className="p-4 rounded-lg bg-blue-600/20 border border-blue-500/50 space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Alarm Name</label>
                                <input
                                    type="text"
                                    value={newAlarmName}
                                    onChange={(e) => setNewAlarmName(e.target.value)}
                                    placeholder="e.g., Wake up, Meeting..."
                                    autoFocus
                                    className="w-full bg-gray-800/50 outline-none text-sm text-white placeholder-gray-500 px-3 py-2 rounded"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newAlarmDate}
                                        onChange={(e) => setNewAlarmDate(e.target.value)}
                                        className="w-full bg-gray-800/50 outline-none text-sm text-white px-3 py-2 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newAlarmTime}
                                        onChange={(e) => setNewAlarmTime(e.target.value)}
                                        className="w-full bg-gray-800/50 outline-none text-sm text-white px-3 py-2 rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleAddAlarm} className="flex-1 py-2 px-3 rounded bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-sm font-medium">
                                    <Check size={14} className="inline mr-1" /> Set Alarm
                                </button>
                                <button onClick={() => { setIsAdding(false); setNewAlarmName(''); setNewAlarmDate(''); setNewAlarmTime(''); }} className="py-2 px-3 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-400 text-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {alarms.length === 0 && !isAdding && (
                        <div className="text-center py-8 text-gray-500">
                            <Bell className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No alarms set</p>
                        </div>
                    )}

                    {alarms.map(alarm => (
                        <div key={alarm.id} className={`flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors ${!alarm.enabled && 'opacity-50'}`}>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleToggleAlarm(alarm.id, alarm.enabled)} className={`p-2 rounded-lg transition-colors ${alarm.enabled ? "bg-blue-500/20 text-blue-400" : "bg-gray-700/30 text-gray-600"}`}>
                                    <Bell size={20} />
                                </button>
                                <div>
                                    <div className="text-base font-medium text-gray-200">{alarm.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{alarm.time}</div>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteAlarm(alarm.id)} className="text-gray-600 hover:text-red-400 p-2">
                                <X size={18} />
                            </button>
                        </div>
                    ))}

                    {!isAdding && (
                        <button
                            onClick={() => {
                                setIsAdding(true);
                                const { date, time } = getDefaultDateTime();
                                setNewAlarmDate(date);
                                setNewAlarmTime(time);
                            }}
                            className="w-full py-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add Alarm
                        </button>
                    )}
                </div>
            )}

            {/* Timer Tab */}
            {activeTab === 'timer' && (
                <div className="flex flex-col items-center py-8">
                    <div className="text-6xl font-mono font-light tracking-wider text-white mb-6">
                        {timerMinutes.toString().padStart(2, '0')}:{timerSeconds.toString().padStart(2, '0')}
                    </div>
                    {!timerRunning && (
                        <div className="flex gap-4 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Minutes</label>
                                <input
                                    type="number"
                                    value={timerMinutes}
                                    onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-20 bg-gray-800/50 text-white text-center py-2 rounded outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Seconds</label>
                                <input
                                    type="number"
                                    value={timerSeconds}
                                    onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    className="w-20 bg-gray-800/50 text-white text-center py-2 rounded outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setTimerRunning(!timerRunning)}
                            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
                        >
                            {timerRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
                        </button>
                        <button
                            onClick={() => { setTimerRunning(false); setTimerMinutes(5); setTimerSeconds(0); }}
                            className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium flex items-center gap-2"
                        >
                            <RotateCcw size={18} /> Reset
                        </button>
                    </div>
                </div>
            )}

            {/* Stopwatch Tab */}
            {activeTab === 'stopwatch' && (
                <div className="flex flex-col items-center py-8">
                    <div className="text-6xl font-mono font-light tracking-wider text-white mb-6">
                        {formatStopwatch(stopwatchTime)}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStopwatchRunning(!stopwatchRunning)}
                            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
                        >
                            {stopwatchRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
                        </button>
                        <button
                            onClick={() => { setStopwatchRunning(false); setStopwatchTime(0); }}
                            className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium flex items-center gap-2"
                        >
                            <RotateCcw size={18} /> Reset
                        </button>
                    </div>
                </div>
            )}
        </ModuleCard>
    );
};

export default ClockModule;
