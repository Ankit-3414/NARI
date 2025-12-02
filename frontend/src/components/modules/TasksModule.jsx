import React, { useState } from 'react';
import ModuleCard from '../layout/ModuleCard';
import { createTask, updateTask, deleteTask } from '@lib/api';
import { CheckCircle, Circle, X, Plus } from 'lucide-react';

const TasksModule = ({ tasks = [], setTasks }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleAdd = async () => {
        if (!newTaskTitle.trim()) return;

        try {
            const newTask = await createTask(newTaskTitle.trim());
            console.log('Task created:', newTask);

            // Socket.IO will handle the state update
            setNewTaskTitle('');
            setIsAdding(false);
        } catch (e) {
            console.error("Failed to create task", e);
            alert("Failed to create task");
        }
    };

    const handleToggle = async (task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await updateTask(task.id, newStatus);
            console.log('Task toggled:', task.id);

            // Socket.IO will handle the state update
        } catch (e) {
            console.error("Failed to update task", e);
            alert("Failed to update task");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTask(id);
            console.log('Task deleted:', id);

            // Socket.IO will handle the state update
        } catch (e) {
            console.error("Failed to delete task", e);
            alert("Failed to delete task");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewTaskTitle('');
        }
    };

    return (
        <ModuleCard title="Tasks" defaultExpanded={true}>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                {tasks.length === 0 && !isAdding && (
                    <div className="text-gray-500 text-sm italic text-center py-4">No active tasks</div>
                )}

                {isAdding && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-600/20 border border-blue-500/50">
                        <Circle size={18} className="text-gray-500 flex-shrink-0" />
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Task title..."
                            autoFocus
                            className="bg-transparent outline-none text-sm text-white placeholder-gray-400 flex-1"
                        />
                        <button onClick={handleAdd} className="text-green-400 hover:text-green-300 p-1">
                            <Plus size={16} />
                        </button>
                        <button onClick={() => { setIsAdding(false); setNewTaskTitle(''); }} className="text-red-400 hover:text-red-300 p-1">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {tasks.map((t) => (
                    <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <button
                                onClick={() => handleToggle(t)}
                                className={`flex-shrink-0 transition-colors ${t.status === 'completed' ? 'text-green-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t.status === 'completed' ? <CheckCircle size={18} /> : <Circle size={18} />}
                            </button>
                            <span className={`text-sm truncate ${t.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {t.title}
                            </span>
                        </div>
                        <button
                            onClick={() => handleDelete(t.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> Add Task
                </button>
            )}
        </ModuleCard>
    );
};

export default TasksModule;
