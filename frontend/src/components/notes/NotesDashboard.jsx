import React, { useState } from 'react';
import { useNotes, useNoteActions } from '../../hooks/useNotes';
import { useSubjects } from '../../hooks/useStudy';
import { Search, Plus, ChevronRight, Save, X, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const NoteEditor = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content_markdown || '');
  const [subjectId, setSubjectId] = useState(note?.subject_id || '');
  const { data: subjects } = useSubjects();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="h-14 bg-surface border-b border-slate-800 flex items-center justify-between px-4">
        <button onClick={onCancel} className="p-2 text-secondary"><X size={20} /></button>
        <h2 className="font-bold text-slate-100">{note ? 'Edit Note' : 'New Note'}</h2>
        <button 
          onClick={() => onSave({ title, content_markdown: content, subject_id: subjectId ? parseInt(subjectId) : null })}
          className="p-2 text-primary font-bold"
        >
          <Save size={20} />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <input 
          type="text" 
          placeholder="Title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold text-slate-100 outline-none placeholder:text-slate-700"
        />
        
        <div className="flex gap-2">
          <select 
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="text-xs bg-surface border border-slate-700 rounded-lg px-2 py-1 text-secondary outline-none"
          >
            <option value="">No Subject</option>
            {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <textarea 
          placeholder="Start writing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-transparent text-slate-300 outline-none resize-none leading-relaxed placeholder:text-slate-700"
        />
      </div>
    </div>
  );
};

const NotesDashboard = () => {
  const { data: notes, isLoading } = useNotes();
  const noteActions = useNoteActions();
  const [isEditing, setIsEditing] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [search, setSearch] = useState('');

  if (isLoading) return <div className="p-8 text-center text-secondary">Opening vault...</div>;

  const filteredNotes = notes?.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content_markdown.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data) => {
    if (activeNote) {
      noteActions.update({ id: activeNote.id, ...data });
    } else {
      noteActions.create(data);
    }
    setIsEditing(false);
    setActiveNote(null);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text"
          placeholder="Search your notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        {filteredNotes?.map(note => (
          <button 
            key={note.id}
            onClick={() => { setActiveNote(note); setIsEditing(true); }}
            className="w-full text-left card p-4 flex items-center justify-between group hover:border-primary/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-100 truncate mb-1">{note.title}</h3>
              <div className="flex items-center gap-3 text-[10px] text-secondary font-medium uppercase tracking-wider">
                <span>{format(parseISO(note.updated_at), 'MMM d, yyyy')}</span>
                {note.subject_id && (
                  <span className="flex items-center gap-0.5 text-primary">
                    <Hash size={10} /> Sub#{note.subject_id}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-700 group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      {isEditing && (
        <NoteEditor 
          note={activeNote} 
          onSave={handleSave} 
          onCancel={() => { setIsEditing(false); setActiveNote(null); }} 
        />
      )}

      <button 
        onClick={() => { setActiveNote(null); setIsEditing(true); }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
};

export default NotesDashboard;
