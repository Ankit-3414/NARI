import React, { useState } from 'react';
import { Check, FileText, ListPlus, BellPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useCreateTask } from '../../hooks/useTasks';
import { useReminderActions } from '../../hooks/useReminders';
import { useNoteActions } from '../../hooks/useNotes';
import { useCreateHabit } from '../../hooks/useHabits';

const iconByType = {
  task: ListPlus,
  reminder: BellPlus,
  note: FileText,
};

const SuggestionActions = ({ suggestions = [], entryId }) => {
  const [completed, setCompleted] = useState({});
  const createTask = useCreateTask();
  const reminders = useReminderActions();
  const notes = useNoteActions();
  const createHabit = useCreateHabit();

  if (suggestions.length === 0) return null;

   const handleConvert = (suggestion) => {
     const key = `${entryId}-${suggestion.type}`;
     const onSuccess = () => setCompleted((current) => ({ ...current, [key]: true }));

     if (suggestion.type === 'task') {
       createTask.mutate(suggestion.payload, { onSuccess });
     } else if (suggestion.type === 'reminder') {
       reminders.create(suggestion.payload, { onSuccess });
     } else if (suggestion.type === 'note') {
       notes.create(suggestion.payload, { onSuccess });
     } else if (suggestion.type === 'habit') {
       // For habit completion, try to find existing habit by name first
       // Fall back to creating new habit if not found
       const habitName = suggestion.payload.habit_name;
       // We'll implement a simple approach: create the habit if it doesn't exist
       // In a production app, you'd want to search habits first
       createHabit.mutate({
         name: habitName,
         frequency: 'daily',  // Default frequency
         notes: suggestion.payload.notes
       }, { onSuccess });
     } else if (suggestion.type === 'study') {
       // For study session, create a study session
       // First try to find subject by name, otherwise we'll need to handle this differently
       const subjectName = suggestion.payload.subject_id;
       // For now, we'll create a note with the study details since we don't have subject lookup
       // A better implementation would search for existing subject
       notes.create({
         title: `Study Session: ${subjectName}`,
         content_markdown: suggestion.payload.notes,
         tags: ['study', 'context-stream']
       }, { onSuccess });
     } else if (suggestion.type === 'mood') {
       // For mood logging, create a note with mood info
       notes.create({
         title: `Mood: ${suggestion.payload.mood} ${suggestion.payload.emoji || ''}`,
         content_markdown: suggestion.payload.notes,
         tags: ['mood', 'context-stream']
       }, { onSuccess });
     }
   };

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {suggestions.map((suggestion) => {
        const key = `${entryId}-${suggestion.type}`;
        const Icon = completed[key] ? Check : iconByType[suggestion.type];

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleConvert(suggestion)}
            disabled={completed[key]}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
              completed[key]
                ? 'border-success/20 bg-success/10 text-success'
                : 'border-primary/20 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10'
            )}
          >
            <Icon size={13} />
            {completed[key] ? 'Created' : suggestion.label}
          </button>
        );
      })}
    </div>
  );
};

export default SuggestionActions;