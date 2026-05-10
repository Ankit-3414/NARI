import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-primary/20 backdrop-blur-md">
        <p className="text-white font-mono text-[10px] tracking-widest">{label}:00 HRS</p>
        <p className="text-primary font-black text-sm">INTENSITY: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00F2FF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00F2FF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis 
            dataKey="hour" 
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="intensity" 
            stroke="#00F2FF" 
            fillOpacity={1} 
            fill="url(#colorIntensity)" 
            strokeWidth={3}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
