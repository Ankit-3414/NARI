import React from 'react';
import { motion } from 'framer-motion';
import { useStudyTrends, useTaskStats, useAnalyticsSummary } from '../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Award, BookOpen, CheckCircle2, Activity, Zap } from 'lucide-react';
import { clsx } from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const AnalyticsPage = () => {
  const { data: studyTrends } = useStudyTrends(7);
  const { data: taskStats } = useTaskStats();
  const { data: summary } = useAnalyticsSummary();

  const taskData = taskStats ? [
    { name: 'Completed', value: taskStats.completed, fill: '#00FF94' },
    { name: 'Pending', value: taskStats.pending, fill: '#00F2FF' }
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-white font-bold mb-1">{new Date(label).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <p className="text-primary font-mono">{`${payload[0].value} minutes`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-32"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={item} className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
          <Activity size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Telemetry</h1>
          <p className="text-secondary font-mono tracking-widest text-xs mt-1">System Performance & Patterns</p>
        </div>
      </motion.header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-warning/10 rounded-2xl text-warning border border-warning/20 shadow-[0_0_15px_rgba(255,184,0,0.2)] group-hover:scale-110 transition-transform">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-1">Max Streak</p>
              <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{summary?.max_habit_streak || 0}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-success/10 rounded-2xl text-success border border-success/20 shadow-[0_0_15px_rgba(0,255,148,0.2)] group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-1">Win Rate</p>
              <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{taskStats?.completion_rate || 0}<span className="text-xl text-secondary">%</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,242,255,0.2)] group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-1">Focus Time</p>
              <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{summary?.study_minutes_today || 0}<span className="text-xl text-secondary">m</span></p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study Trends Chart */}
        <motion.div variants={item} className="lg:col-span-8 glass-card p-6 md:p-8 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Focus Velocity (7D)</h2>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-secondary">MINUTES</div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTrends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666', fontSize: 10, fontFamily: 'monospace' }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar 
                  dataKey="minutes" 
                  fill="#00F2FF" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                >
                  {studyTrends?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === studyTrends.length - 1 ? '#00F2FF' : '#00A3AD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Task Pie Chart */}
        <motion.div variants={item} className="lg:col-span-4 glass-card p-6 md:p-8 rounded-[2rem] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Load Dist</h2>
          </div>
          <div className="flex-1 min-h-[250px] relative w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="drop-shadow-lg" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-white">{taskStats?.total || 0}</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Tasks</span>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6 mt-6 p-4 bg-background/50 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_#00FF94]"></div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">Done</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#00F2FF]"></div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">Pending</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
