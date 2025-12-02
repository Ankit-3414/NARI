import React, { useState, useEffect } from 'react';
import ModuleCard from '../layout/ModuleCard';
import { getSocket } from '@lib/socket';
import { Activity, Bell, CheckCircle, BookOpen, Trash2, Plus, Clock } from 'lucide-react';

const AutomationModule = () => {
    const [logs, setLogs] = useState([
        { id: Date.now(), type: 'SYSTEM', message: 'NARI system initialized', time: new Date().toLocaleTimeString(), icon: Activity }
    ]);

    useEffect(() => {
        const socket = getSocket();

        // Study session events
        socket.on('study_started', (data) => {
            addLog('STUDY', `Started focus session: ${data.subject}`, BookOpen, 'text-blue-400');
        });

        socket.on('study_stopped', () => {
            addLog('STUDY', 'Focus session ended', BookOpen, 'text-blue-400');
        });

        // Subject events
        socket.on('subject_added', ({ name }) => {
            addLog('SUBJECT', `Added subject: ${name}`, Plus, 'text-green-400');
        });

        socket.on('subject_removed', ({ name }) => {
            addLog('SUBJECT', `Removed subject: ${name}`, Trash2, 'text-red-400');
        });

        // Task events
        socket.on('task_added', (task) => {
            addLog('TASK', `Created task: ${task.title}`, Plus, 'text-green-400');
        });

        socket.on('task_updated', (task) => {
            const status = task.status === 'completed' ? 'completed' : 'updated';
            addLog('TASK', `Task ${status}: ${task.title}`, CheckCircle, 'text-yellow-400');
        });

        socket.on('task_deleted', ({ id }) => {
            addLog('TASK', `Deleted task #${id}`, Trash2, 'text-red-400');
        });

        // Note events
        socket.on('note_added', (note) => {
            addLog('NOTE', `Created note: ${note.title}`, Plus, 'text-green-400');
        });

        socket.on('note_deleted', ({ id }) => {
            addLog('NOTE', `Deleted note #${id}`, Trash2, 'text-red-400');
        });

        // Alarm events
        socket.on('alarm_added', (alarm) => {
            addLog('ALARM', `Set alarm: ${alarm.name} at ${alarm.time}`, Bell, 'text-purple-400');
        });

        socket.on('alarm_triggered', (alarm) => {
            addLog('ALARM', `⏰ ALARM TRIGGERED: ${alarm.name}`, Bell, 'text-red-500 font-bold');
        });

        socket.on('alarm_deleted', ({ id }) => {
            addLog('ALARM', `Deleted alarm #${id}`, Trash2, 'text-red-400');
        });

        // Automation events
        socket.on('automation_event', (event) => {
            addLog('AUTO', event.message || JSON.stringify(event), Activity, 'text-cyan-400');
        });

        return () => {
            socket.off('study_started');
            socket.off('study_stopped');
            socket.off('subject_added');
            socket.off('subject_removed');
            socket.off('task_added');
            socket.off('task_updated');
            socket.off('task_deleted');
            socket.off('note_added');
            socket.off('note_deleted');
            socket.off('alarm_added');
            socket.off('alarm_triggered');
            socket.off('alarm_deleted');
            socket.off('automation_event');
        };
    }, []);

    const addLog = (type, message, icon, color) => {
        setLogs(prev => [{
            id: Date.now() + Math.random(),
            type,
            message,
            time: new Date().toLocaleTimeString(),
            icon,
            color
        }, ...prev].slice(0, 100)); // Keep last 100 logs
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'STUDY': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'TASK': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'NOTE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'ALARM': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'SUBJECT': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
            case 'AUTO': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <ModuleCard title="Activity Feed" defaultExpanded={true}>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Activity className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No activity yet. Start using NARI!</p>
                    </div>
                )}

                {logs.map(log => {
                    const IconComponent = log.icon || Activity;
                    return (
                        <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors border-l-2 border-transparent hover:border-blue-500/50"
                        >
                            <div className={`p-2 rounded-lg ${getTypeColor(log.type)}`}>
                                <IconComponent size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getTypeColor(log.type)}`}>
                                        {log.type}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">{log.time}</span>
                                </div>
                                <p className={`text-sm ${log.color || 'text-gray-300'}`}>{log.message}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {logs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 text-center">
                    {logs.length} event{logs.length !== 1 ? 's' : ''} logged
                </div>
            )}
        </ModuleCard>
    );
};

export default AutomationModule;
