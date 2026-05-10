import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, ResponsiveContainer, 
  PolarRadiusAxis, Tooltip 
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-4 border border-primary/20 backdrop-blur-xl">
        <p className="text-white font-black uppercase text-xs mb-2 tracking-widest">{data.subject}</p>
        <div className="space-y-1">
          <p className="text-[10px] text-secondary">Tasks: <span className="text-white font-mono">{data.tasks}</span></p>
          <p className="text-[10px] text-secondary">Study: <span className="text-white font-mono">{data.study_hours}h</span></p>
          <p className="text-[10px] text-primary">Score: <span className="font-mono">{data.score}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

const SubjectRadar = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#ffffff10" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
          />
          <Radar
            name="Neural Hub Distribution"
            dataKey="score"
            stroke="#00F2FF"
            fill="#00F2FF"
            fillOpacity={0.2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectRadar;
