import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-primary/20 backdrop-blur-md">
        <p className="text-white font-mono text-[10px] tracking-widest uppercase">
          {format(parseISO(label), 'EEEE, MMM do')}
        </p>
        <p className="text-primary font-black text-sm">{payload[0].value} MINUTES</p>
      </div>
    );
  }
  return null;
};

const StudyTrendsChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Find max value for scaling or highlight
  const maxMinutes = Math.max(...data.map(d => d.minutes));

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), 'MMM d')}
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar 
            dataKey="minutes" 
            radius={[6, 6, 0, 0]}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.minutes === maxMinutes ? '#00F2FF' : '#00F2FF20'} 
                stroke={entry.minutes === maxMinutes ? '#00F2FF' : '#00F2FF40'}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudyTrendsChart;
