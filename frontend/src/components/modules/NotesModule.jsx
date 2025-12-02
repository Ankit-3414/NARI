import React, { useState } from 'react';
import ModuleCard from '../layout/ModuleCard';
import { createNote, deleteNote } from '@lib/api';
import { X, Plus } from 'lucide-react';

const NotesModule = ({ notes = [], setNotes }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');

    const handleAdd = async () => {
        if (!newNoteTitle.trim()) return;

        try {
            await createNote(newNoteTitle.trim(), newNoteContent.trim());
            console.log('Note created');

            // Socket.IO will handle the state update
            setNewNoteTitle('');
            setNewNoteContent('');
            setIsAdding(false);
        } catch (e) {
            console.error("Failed to create note", e);
            alert("Failed to create note");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNote(id);
            console.log('Note deleted:', id);

            // Socket.IO will handle the state update
        } catch (e) {
            console.error("Failed to delete note", e);
            alert("Failed to delete note");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleAdd();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewNoteTitle('');
            setNewNoteContent('');
        }
    };

    return (
        <ModuleCard title="Quick Notes" defaultExpanded={true}>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                {notes.length === 0 && !isAdding && (
                    <div className="text-gray-500 text-sm italic text-center py-4">No notes yet</div>
                )}

                {isAdding && (
                    <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                        <input
                            type="text"
                            value={newNoteTitle}
                            onChange={(e) => setNewNoteTitle(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Note title..."
                            autoFocus
                            className="w-full bg-transparent outline-none text-sm font-medium text-yellow-200 placeholder-yellow-400/50 mb-2"
                        />
                        <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Content (optional, Ctrl+Enter to save)..."
                            rows={2}
                            className="w-full bg-transparent outline-none text-xs text-gray-300 placeholder-gray-500 resize-none mb-2"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 py-1 px-3 rounded bg-yellow-600/30 hover:bg-yellow-600/40 text-yellow-300 text-xs">
                                Save
                            </button>
                            <button onClick={() => { setIsAdding(false); setNewNoteTitle(''); setNewNoteContent(''); }} className="py-1 px-3 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-400 text-xs">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="group p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors relative"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-yellow-200 truncate">{note.title}</h4>
                                {note.content && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{note.content}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(note.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1 flex-shrink-0"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> Add Note
                </button>
            )}
        </ModuleCard>
    );
};

export default NotesModule;
