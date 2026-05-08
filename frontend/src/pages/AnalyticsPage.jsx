import React from 'react';
import { useStudyTrends, useTaskStats, useAnalyticsSummary } from '../hooks/useAnalytics';
import Card from '../components/common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Award, BookOpen, CheckCircle2 } from 'lucide-react';

const AnalyticsPage = () => {
  const { data: studyTrends } = useStudyTrends(7);
  const { data: taskStats } = useTaskStats();
  const { data: summary } = useAnalyticsSummary();

  const taskData = taskStats ? [
    { name: 'Completed', value: taskStats.completed, fill: '#10b981' },
    { name: 'Pending', value: taskStats.pending, fill: '#3b82f6' }
  ] : [];

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
        <p className="text-secondary text-sm">Insights into your productivity patterns</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary uppercase font-bold tracking-wider">Best Streak</p>
              <p className="text-2xl font-bold text-slate-100">{summary?.max_habit_streak || 0} days</p>
            </div>
          </div>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success/20 rounded-lg text-success">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary uppercase font-bold tracking-wider">Completion Rate</p>
              <p className="text-2xl font-bold text-slate-100">{taskStats?.completion_rate || 0}%</p>
            </div>
          </div>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary uppercase font-bold tracking-wider">Avg. Study</p>
              <p className="text-2xl font-bold text-slate-100">{summary?.study_minutes_today || 0}m today</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Study Trends Chart */}
        <Card title="Study Time (Last 7 Days)">
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Pie Chart */}
        <Card title="Task Distribution">
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-xs text-secondary">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-secondary">Pending</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
