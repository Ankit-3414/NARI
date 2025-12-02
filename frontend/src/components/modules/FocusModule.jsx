import React, { useState, useEffect, useRef } from 'react';
import ModuleCard from '../layout/ModuleCard';
import { getStudyStatus, startStudy, stopStudy } from '@lib/api';
import { getSocket } from '@lib/socket';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Play, Square } from 'lucide-react';

const FocusModule = ({ selectedSubject }) => {
    const [study, setStudy] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        // Load initial study status
        getStudyStatus()
            .then(status => {
                console.log('Initial study status:', status);
                setStudy(status);
            })
            .catch(() => setStudy(null));

        // Setup socket listeners
        const socket = getSocket();

        socket.on('study_started', (s) => {
            console.log('Study started via socket:', s);
            setStudy(s);
            setElapsed(0);
        });

        socket.on('study_stopped', () => {
            console.log('Study stopped via socket');
            setStudy(null);
            setElapsed(0);
        });

        return () => {
            socket.off('study_started');
            socket.off('study_stopped');
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

    const handleToggleStudy = async () => {
        if (!study) {
            if (!selectedSubject) {
                alert('Please select a subject first');
                return;
            }
            try {
                const result = await startStudy(selectedSubject);
                console.log('Study started:', result);
                // Update state immediately (don't wait for socket)
                setStudy(result);
                setElapsed(0);
            } catch (e) {
                console.error('Failed to start study:', e);
                alert('Failed to start focus session');
            }
        } else {
            try {
                await stopStudy(true);
                console.log('Study stopped');
                // Update state immediately (don't wait for socket)
                setStudy(null);
                setElapsed(0);
            } catch (e) {
                console.error('Failed to stop study:', e);
                alert('Failed to stop focus session');
            }
        }
    };

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    const glow = study?.subject === 'Physics' ? '#00FFFF'
        : study?.subject === 'Chemistry' ? '#FF6FB3'
            : study?.subject === 'Math' ? '#FBBF24'
                : '#00FFFF';

    return (
        <ModuleCard title="Focus Timer" defaultExpanded={true}>
            <div className="flex flex-col items-center py-4">
                {/* Circular Progress */}
                <div className="w-48 h-48 mb-6 relative">
                    <CircularProgressbar
                        value={elapsed % 3600}
                        maxValue={3600}
                        text={`${mins}m ${secs}s`}
                        styles={buildStyles({
                            textColor: '#fff',
                            pathColor: glow,
                            trailColor: 'rgba(255,255,255,0.1)',
                            textSize: '14px'
                        })}
                    />
                    {study && (
                        <div
                            className="absolute inset-0 rounded-full blur-2xl opacity-30 -z-10"
                            style={{ background: `radial-gradient(${glow}, transparent 70%)` }}
                        />
                    )}
                </div>

                {/* Subject Display */}
                <h3 className="text-lg font-semibold mb-4 text-gray-200">
                    {study ? study.subject : selectedSubject ? `Selected: ${selectedSubject}` : 'No Subject Selected'}
                </h3>

                {/* Control Button */}
                <button
                    onClick={handleToggleStudy}
                    disabled={!selectedSubject && !study}
                    className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${study || selectedSubject
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }
          `}
                >
                    {study ? (
                        <>
                            <Square size={18} />
                            Stop Session
                        </>
                    ) : (
                        <>
                            <Play size={18} />
                            Start Focus
                        </>
                    )}
                </button>

                {/* Session Info */}
                {study && (
                    <div className="mt-4 text-xs text-gray-500">
                        Session started at {new Date(study.start).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </ModuleCard>
    );
};

export default FocusModule;
