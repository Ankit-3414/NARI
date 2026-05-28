import React from 'react';
import { motion } from 'framer-motion';
import { 
  useTemporalPerformance, 
  useNeuralHeatmap, 
  useSubjectDistribution,
  useTaskStats,
  useStudyTrends
} from '../hooks/useAnalytics';
import PerformanceChart from '../components/analytics/PerformanceChart';
import NeuralHeatmap from '../components/analytics/NeuralHeatmap';
import SubjectRadar from '../components/analytics/SubjectRadar';
import StudyTrendsChart from '../components/analytics/StudyTrendsChart';
import { 
  BarChart3, Activity, Brain, Clock, 
  Target, Zap, TrendingUp, ShieldCheck, LineChart
} from 'lucide-react';

const AnalyticsPage = () => {
  const { data: temporal, isLoading: temporalLoading } = useTemporalPerformance();
  const { data: heatmap, isLoading: heatmapLoading } = useNeuralHeatmap();
  const { data: distribution, isLoading: distLoading } = useSubjectDistribution();
  const { data: taskStats, isLoading: taskLoading } = useTaskStats();
  const { data: studyTrends, isLoading: trendsLoading } = useStudyTrends(14);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-32 space-y-8"
    >
      {/* Header HUD */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <BarChart3 size={32} className="text-primary" /> Neural Insights
          </h1>
          <p className="text-secondary font-mono text-[10px] tracking-[0.3em] mt-2 ml-1">Behavioral Pattern Analysis_v1.0</p>
        </div>
        <div className="hidden md:flex gap-2">
          <div className="px-4 py-2 glass-card border-primary/20 rounded-xl flex items-center gap-3">
            <ShieldCheck size={16} className="text-success" />
            <span className="text-[10px] font-black uppercase text-secondary">Local Sync: Active</span>
          </div>
        </div>
      </motion.div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <TrendingUp size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Rating</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{taskStats?.completion_rate || 0}%</span>
            <span className="text-xs text-secondary font-mono">Avg Completion</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center gap-3 text-accent">
            <Clock size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Peak Window</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white uppercase">
              {temporal?.length > 0 
                ? `${temporal.reduce((prev, current) => (prev.intensity > current.intensity) ? prev : current).hour}:00` 
                : 'N/A'}
            </span>
            <span className="text-xs text-secondary font-mono">Max Intensity</span>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <Target size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Neural Load</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{distribution?.length || 0}</span>
            <span className="text-xs text-secondary font-mono">Active Hubs</span>
          </div>
        </motion.div>
      </div>

      {/* Heatmap Stream */}
      <motion.section variants={item} className="glass-card p-8 rounded-[2.5rem] border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Activity Stream</h2>
          </div>
        </div>
        <NeuralHeatmap data={heatmap} />
      </motion.section>

      {/* Study Trends */}
      <motion.section variants={item} className="glass-card p-8 rounded-[2.5rem] border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LineChart size={20} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Focus Velocity</h2>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-secondary uppercase tracking-widest">
            Last 14 Days
          </div>
        </div>
        <StudyTrendsChart data={studyTrends} />
      </motion.section>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Temporal Distribution */}
        <motion.section variants={item} className="glass-card p-8 rounded-[2.5rem] border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <Brain size={20} className="text-accent" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Temporal Calibration</h2>
          </div>
          <PerformanceChart data={temporal} />
          <p className="text-[10px] text-secondary font-mono mt-6 text-center uppercase tracking-wider">
            Intensity mapping across 24-hour cycle
          </p>
        </motion.section>

        {/* Subject Radar */}
        <motion.section variants={item} className="glass-card p-8 rounded-[2.5rem] border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <Zap size={20} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Hub Energy Allocation</h2>
          </div>
          <SubjectRadar data={distribution} />
        </motion.section>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
