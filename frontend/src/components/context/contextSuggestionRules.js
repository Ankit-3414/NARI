const cleanPrefix = (text, prefix) => text.slice(prefix.length).trim();

// Enhanced suggestion builders for habit completion and study tracking
const buildHabitSuggestion = (text) => {
  const lower = text.toLowerCase();
  const habitPatterns = [
    { phrase: 'drank water', habit: 'Drink Water' },
    { phrase: 'exercised', habit: 'Exercise' },
    { phrase: 'worked out', habit: 'Exercise' },
    { phrase: 'ran', habit: 'Run' },
    { phrase: 'went for a run', habit: 'Run' },
    { phrase: 'meditated', habit: 'Meditation' },
    { phrase: 'read for', habit: 'Reading' },
    { phrase: 'studied', habit: 'Study' }
  ];

  const match = habitPatterns.find(p => lower.includes(p.phrase));
  if (match) {
    return {
      type: 'habit',
      label: `Log ${match.habit}`,
      confidence: 'rule',
      payload: {
        habit_name: match.habit,
        notes: text
      }
    };
  }
  return null;
};

const buildStudySuggestion = (text) => {
  const lower = text.toLowerCase();
  
  // Pattern: "studied [subject] for [time]"
  const studyMatch = lower.match(/studied\s+(.+?)\s+for\s+(\d+(?:\.\d+)?)\s*(hour|hr|hours|mins?)/i);
  if (studyMatch) {
    const [, subject, time, unit] = studyMatch;
    const minutes = unit.startsWith('h') ? parseFloat(time) * 60 : parseFloat(time);
    
    return {
      type: 'study',
      label: 'Log Study Session',
      confidence: 'rule',
      payload: {
        subject_id: subject.trim(),  // Will need to map to actual subject ID
        duration_minutes: Math.round(minutes),
        notes: text
      }
    };
  }
  
  // Pattern: "studied [subject]"
  const simpleStudyMatch = lower.match(/studied\s+(.+)/i);
  if (simpleStudyMatch) {
    return {
      type: 'study',
      label: 'Log Study Session',
      confidence: 'rule',
      payload: {
        subject_id: simpleStudyMatch[1].trim(),
        duration_minutes: 0,  // Default, user can adjust
        notes: text
      }
    };
  }
  
  return null;
};

const buildMoodSuggestion = (text) => {
  const lower = text.toLowerCase();
  const moodPatterns = [
    { phrase: 'feeling productive', mood: 'productive', emoji: '💪' },
    { phrase: 'feeling focused', mood: 'focused', emoji: '🎯' },
    { phrase: 'feeling tired', mood: 'tired', emoji: '😴' },
    { phrase: 'feeling stressed', mood: 'stressed', emoji: '😰' },
    { phrase: 'feeling happy', mood: 'happy', emoji: '😊' },
    { phrase: 'feeling sad', mood: 'sad', emoji: '😢' },
    { phrase: 'feeling anxious', mood: 'anxious', emoji: '😟' },
    { phrase: 'feeling energized', mood: 'energized', emoji: '⚡' },
    { phrase: 'feeling calm', mood: 'calm', emoji: '🧘' },
    { phrase: 'feeling motivated', mood: 'motivated', emoji: '🚀' }
  ];

  const match = moodPatterns.find(p => lower.includes(p.phrase));
  if (match) {
    return {
      type: 'mood',
      label: 'Log Mood',
      confidence: 'rule',
      payload: {
        mood: match.mood,
        notes: text,
        emoji: match.emoji
      }
    };
  }
  return null;
};

const titleFrom = (value, fallback) => {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned || fallback;
};

const nextDateAt = (dayOffset, hour, minute = 0) => {
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + dayOffset);
  dueAt.setHours(hour, minute, 0, 0);
  return dueAt;
};

const parseClock = (value) => {
  const match = value.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  return { hour, minute };
};

const buildReminderSuggestion = (text) => {
  const lower = text.toLowerCase();
  if (!lower.startsWith('remind me to ')) return null;

  const body = cleanPrefix(text, 'remind me to ');
  const dayOffset = lower.includes('tomorrow') ? 1 : 0;
  const clock = parseClock(body);
  if (!clock) return null;

  const title = body
    .replace(/\btomorrow\b/gi, '')
    .replace(/\btoday\b/gi, '')
    .replace(/\bat\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    .trim();

  return {
    type: 'reminder',
    label: 'Create Reminder',
    confidence: 'rule',
    payload: {
      title: titleFrom(title, 'Context reminder'),
      message: text,
      due_at: nextDateAt(dayOffset, clock.hour, clock.minute).toISOString(),
    },
  };
};

export const getContextSuggestions = (text) => {
  const value = text.trim();
  const lower = value.toLowerCase();
  const suggestions = [];

  if (!value) return suggestions;

  if (lower.startsWith('todo:') || lower.startsWith('task:')) {
    const title = cleanPrefix(value, value.includes(':') ? value.split(':')[0] + ':' : '');
    suggestions.push({
      type: 'task',
      label: 'Create Task',
      confidence: 'rule',
      payload: {
        title: titleFrom(title, 'Context task'),
        description: value,
        priority: 'normal',
      },
    });
  }

  const reminder = buildReminderSuggestion(value);
  if (reminder) suggestions.push(reminder);

  const habit = buildHabitSuggestion(value);
  if (habit) suggestions.push(habit);

  const study = buildStudySuggestion(value);
  if (study) suggestions.push(study);

  const mood = buildMoodSuggestion(value);
  if (mood) suggestions.push(mood);

  if (lower.startsWith('note:') || lower.startsWith('idea:')) {
    const prefix = value.split(':')[0] + ':';
    const content = cleanPrefix(value, prefix);
    suggestions.push({
      type: 'note',
      label: 'Save Note',
      confidence: 'rule',
      payload: {
        title: titleFrom(content.slice(0, 60), 'Context note'),
        content_markdown: value,
        tags: ['context-stream'],
      },
    });
  }

  return suggestions;
};

export const getContextText = (entry) => {
  if (entry?.text) return entry.text;
  if (entry?.message && entry.message !== 'CONTEXT LOGGED') return entry.message;

  try {
    const payload = JSON.parse(entry?.payload_json || '{}');
    return payload.text || payload.message || entry?.message || '';
  } catch {
    return entry?.message || '';
  }
};