import React from 'react';
import HabitWidget from '../components/habits/HabitWidget';
import { Zap } from 'lucide-react';

const HabitsPage = () => {
  return (
    <div className="pb-20 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={28} className="text-warning" />
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Patterns</h1>
      </div>
      <div className="max-w-2xl mx-auto">
        <HabitWidget />
      </div>
    </div>
  );
};

export default HabitsPage;
