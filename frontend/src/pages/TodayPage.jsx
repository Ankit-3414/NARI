import React from 'react';

const Dashboard = () => (
  <div className="p-4 space-y-6 max-w-lg mx-auto">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-slate-100">Today at a Glance</h2>
    </div>

    {/* Quick Stats Placeholder */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-surface border border-slate-800 p-4 rounded-xl">
        <p className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Focus Time</p>
        <p className="text-2xl font-bold text-primary">0h 0m</p>
      </div>
      <div className="bg-surface border border-slate-800 p-4 rounded-xl">
        <p className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Tasks Done</p>
        <p className="text-2xl font-bold text-success">0</p>
      </div>
    </div>

    <div className="bg-surface/50 border border-slate-800 border-dashed p-8 rounded-xl text-center">
      <p className="text-secondary italic">Main dashboard widgets coming soon.</p>
      <p className="mt-4 text-sm text-slate-500">Your personalized productivity hub is under construction.</p>
    </div>
  </div>
);

export default Dashboard;
