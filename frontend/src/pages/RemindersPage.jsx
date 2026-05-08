import React from 'react';
import { useReminders, useReminderActions } from '../hooks/useReminders';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Bell, BellOff, Clock, CheckCircle2, Trash2, Zap } from 'lucide-react';

const RemindersPage = () => {
  const { data: reminders, isLoading } = useReminders();
  const { snooze, dismiss, remove } = useReminderActions();

  if (isLoading) return <div className="p-4 animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface rounded-xl"></div>)}</div>;

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reminders</h1>
          <p className="text-secondary text-sm">Manage your notifications and alerts</p>
        </div>
      </header>

      <div className="space-y-4">
        {reminders?.length === 0 && (
          <div className="text-center py-20 bg-surface/30 rounded-2xl border border-dashed border-slate-800">
            <BellOff size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-secondary italic">No active reminders.</p>
          </div>
        )}

        {reminders?.map((reminder) => (
          <div key={reminder.id} className={`p-4 rounded-xl border transition-all ${
            reminder.status === 'triggered' 
              ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
              : 'bg-surface border-slate-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  reminder.status === 'triggered' ? 'bg-primary text-white animate-bounce' : 'bg-slate-800 text-secondary'
                }`}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">{reminder.title}</h3>
                  {reminder.message && <p className="text-sm text-secondary mt-1">{reminder.message}</p>}
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-xs flex items-center text-secondary">
                      <Clock size={12} className="mr-1" />
                      {new Date(reminder.due_at).toLocaleString()}
                    </span>
                    <Badge variant={reminder.status}>{reminder.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                {reminder.status === 'triggered' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => snooze({ id: reminder.id, minutes: 15 })} className="text-primary">
                      Snooze 15m
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => dismiss(reminder.id)}>
                      Dismiss
                    </Button>
                  </>
                )}
                {reminder.status !== 'triggered' && (
                  <Button variant="ghost" size="sm" onClick={() => remove(reminder.id)} className="text-danger hover:bg-danger/10">
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersPage;
