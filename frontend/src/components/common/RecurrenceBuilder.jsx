import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Calendar } from 'lucide-react';

const DAYS = [
  { label: 'M', value: 'MO', full: 'Monday' },
  { label: 'T', value: 'TU', full: 'Tuesday' },
  { label: 'W', value: 'WE', full: 'Wednesday' },
  { label: 'T', value: 'TH', full: 'Thursday' },
  { label: 'F', value: 'FR', full: 'Friday' },
  { label: 'S', value: 'SA', full: 'Saturday' },
  { label: 'S', value: 'SU', full: 'Sunday' },
];

const RecurrenceBuilder = ({ value, onChange }) => {
  const [type, setType] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [manualRule, setManualRule] = useState('');

  // Parse initial value on mount or when value changes externally
  useEffect(() => {
    if (!value) {
      setType('');
      setSelectedDays([]);
      setManualRule('');
      return;
    }

    if (value === 'FREQ=DAILY') {
      setType('DAILY');
      setSelectedDays([]);
    } else if (value === 'FREQ=WEEKLY') {
      setType('WEEKLY');
      setSelectedDays([]);
    } else if (value.startsWith('FREQ=WEEKLY;BYDAY=')) {
      setType('DAYS');
      const byDayMatch = value.match(/BYDAY=([^;]+)/);
      if (byDayMatch) {
        setSelectedDays(byDayMatch[1].split(','));
      }
    } else {
      // It's a complex/manual rule
      setType('MANUAL');
      setManualRule(value);
    }
  }, [value]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === '') {
      onChange(null);
    } else if (newType === 'DAILY') {
      onChange('FREQ=DAILY');
    } else if (newType === 'WEEKLY') {
      onChange('FREQ=WEEKLY');
    } else if (newType === 'DAYS') {
      if (selectedDays.length > 0) {
        updateRRule(selectedDays);
      } else {
        onChange(null);
      }
    } else if (newType === 'MANUAL') {
      onChange(manualRule || null);
    }
  };

  const toggleDay = (dayValue) => {
    const newDays = selectedDays.includes(dayValue)
      ? selectedDays.filter((d) => d !== dayValue)
      : [...selectedDays, dayValue];
    
    // Maintain chronological order based on DAYS array
    const orderedDays = DAYS.map(d => d.value).filter(d => newDays.includes(d));
    setSelectedDays(orderedDays);
    updateRRule(orderedDays);
  };

  const updateRRule = (days) => {
    if (days.length === 0) {
      onChange(null);
    } else {
      onChange(`FREQ=WEEKLY;BYDAY=${days.join(',')}`);
    }
  };

  const handleManualChange = (val) => {
    setManualRule(val);
    onChange(val || null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
          <Calendar size={12} className="text-primary" /> Recurrence Protocol
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'One-Time', value: '' },
            { label: 'Daily', value: 'DAILY' },
            { label: 'Weekly', value: 'WEEKLY' },
            { label: 'Days', value: 'DAYS' },
            { label: 'Manual', value: 'MANUAL' },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={clsx(
                'py-3 rounded-xl border font-black uppercase tracking-wider text-[10px] transition-all',
                type === opt.value
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,242,255,0.1)]'
                  : 'bg-surface/50 border-white/5 text-secondary hover:border-white/20'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {type === 'DAYS' && (
        <div className="space-y-3 p-4 bg-surface/30 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
            Active Days (Weekly Cycle)
          </label>
          <div className="flex justify-between gap-1">
            {DAYS.map((day) => {
              const isActive = selectedDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black transition-all border',
                    isActive
                      ? 'bg-primary border-primary text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                      : 'bg-surface/30 border-white/5 text-secondary hover:border-white/20'
                  )}
                  title={day.full}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {selectedDays.length === 0 && (
            <p className="text-[9px] text-warning/80 font-bold italic ml-1">
              * Select specific days for this cycle
            </p>
          )}
        </div>
      )}

      {type === 'MANUAL' && (
        <div className="space-y-3 p-4 bg-surface/30 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
            Neural Rule Entry (RRULE)
          </label>
          <input
            type="text"
            placeholder="e.g. FREQ=MONTHLY;BYMONTHDAY=1"
            className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono text-[10px] uppercase tracking-wider"
            value={manualRule}
            onChange={(e) => handleManualChange(e.target.value.toUpperCase())}
          />
          <p className="text-[8px] text-slate-500 font-bold italic ml-1">
            Advanced protocol: Manual string injection for monthly/yearly cycles.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecurrenceBuilder;
