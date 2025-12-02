import React, { useState } from 'react';
import ModuleCard from '../layout/ModuleCard';
import { addSubject, deleteSubject } from '@lib/api';
import { X, Plus } from 'lucide-react';

const SubjectsModule = ({ subjects = [], setSubjects, selectedSubject, setSelectedSubject }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');

    const handleAdd = async () => {
        if (!newSubjectName.trim()) return;

        try {
            await addSubject(newSubjectName.trim());
            console.log('Subject added:', newSubjectName.trim());

            // Socket.IO will handle the state update
            setNewSubjectName('');
            setIsAdding(false);
        } catch (e) {
            console.error("Failed to add subject", e);
            alert("Failed to add subject");
        }
    };

    const handleRemove = async (name) => {
        try {
            await deleteSubject(name);
            console.log('Subject deleted:', name);

            // Socket.IO will handle the state update
        } catch (e) {
            console.error("Failed to delete subject", e);
            alert("Failed to delete subject");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewSubjectName('');
        }
    };

    return (
        <ModuleCard title="Subjects" defaultExpanded={true}>
            <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                    <div
                        key={s}
                        onClick={() => setSelectedSubject(s)}
                        className={`
              group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
              ${selectedSubject === s
                                ? "bg-blue-600/20 border-blue-500/50 text-blue-100"
                                : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"}
            `}
                    >
                        <span className="text-sm font-medium">{s}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(s); }}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {isAdding ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/50">
                        <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Subject name..."
                            autoFocus
                            className="bg-transparent outline-none text-sm text-white placeholder-gray-400 w-32"
                        />
                        <button onClick={handleAdd} className="text-green-400 hover:text-green-300">
                            <Plus size={14} />
                        </button>
                        <button onClick={() => { setIsAdding(false); setNewSubjectName(''); }} className="text-red-400 hover:text-red-300">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 text-gray-400 hover:text-white border border-dashed border-gray-700 hover:border-gray-500 transition-all text-sm"
                    >
                        + Add Subject
                    </button>
                )}
            </div>
        </ModuleCard>
    );
};

export default SubjectsModule;
