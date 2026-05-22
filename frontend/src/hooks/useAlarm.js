import { useEffect } from 'react';
import { useReminders } from './useReminders';
import { alarmService } from '../utils/alarmService';

/**
 * Hook to monitor triggered reminders and handle the audible alarm.
 */
export const useAlarm = () => {
  const { data: reminders } = useReminders({ include_triggered: true });
  
  useEffect(() => {
    if (!reminders) return;

    // Check if there are any active triggered reminders
    const activeAlarms = reminders.filter(r => r.status === 'triggered');

    if (activeAlarms.length > 0) {
      // Start the pulsing neural alarm
      alarmService.playAlarm();
    } else {
      // All clear - silence the system
      alarmService.stopAlarm();
    }

    // Cleanup on unmount
    return () => alarmService.stopAlarm();
  }, [reminders]);

  return { isAlarming: reminders?.some(r => r.status === 'triggered') };
};
