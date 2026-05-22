import Dexie from 'dexie';

export const db = new Dexie('nari_local_db');

db.version(1).stores({
  tasks: '++id, title, status, priority, created_at, updated_at',
  notes: '++id, title, content_markdown, created_at, updated_at',
  subjects: '++id, name, color, created_at',
  study_sessions: '++id, subject_id, status, started_at, duration_seconds',
  goals: '++id, title, target_value, current_value, status',
  habits: '++id, title, current_streak, last_completed_at',
  activity_logs: '++id, entity_type, entity_id, action, timestamp',
  sync_queue: '++id, action, entity, data, timestamp' // For background sync
});

// Helper to add to sync queue
export const queueSync = async (action, entity, data) => {
  await db.sync_queue.add({
    action,
    entity,
    data,
    timestamp: new Date().toISOString()
  });
};
