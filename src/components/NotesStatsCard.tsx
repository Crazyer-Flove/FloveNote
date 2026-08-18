import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart2, Calendar } from 'lucide-react';

interface NotesStatsCardProps {
  notes: Note[];
}

type Period = 'week' | 'month' | 'year';

export const NotesStatsCard: React.FC<NotesStatsCardProps> = ({ notes }) => {
  const [period, setPeriod] = useState<Period>('week');
  const [isExpanded, setIsExpanded] = useState(true);

  const statsData = useMemo(() => {
    const now = new Date();

    if (period === 'week') {
      // Last 7 days
      const days = [];
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

        const count = notes.filter(
          (n) => n.createdAt >= dayStart && n.createdAt <= dayEnd
        ).length;

        const label = i === 0 ? '今天' : dayNames[d.getDay()];
        days.push({ label, count, dateStr: `${d.getMonth() + 1}/${d.getDate()}` });
      }
      return days;
    }

    if (period === 'month') {
      // Last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = d.getTime();
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthEnd = nextMonth.getTime() - 1;

        const count = notes.filter(
          (n) => n.createdAt >= monthStart && n.createdAt <= monthEnd
        ).length;

        const label = `${d.getMonth() + 1}月`;
        months.push({ label, count, yearMonth: `${d.getFullYear()}/${d.getMonth() + 1}` });
      }
      return months;
    }

    // Yearly: Last 4 years
    const years = [];
    const currentYear = now.getFullYear();
    for (let i = 3; i >= 0; i--) {
      const yr = currentYear - i;
      const yearStart = new Date(yr, 0, 1).getTime();
      const yearEnd = new Date(yr + 1, 0, 1).getTime() - 1;

      const count = notes.filter(
        (n) => n.createdAt >= yearStart && n.createdAt <= yearEnd
      ).length;

      years.push({ label: `${yr}年`, count });
    }
    return years;
  }, [notes, period]);

  const periodTotal = useMemo(() => {
    return statsData.reduce((acc, curr) => acc + curr.count, 0);
  }, [statsData]);

  return (
    <div className="mb-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 p-3 shadow-2xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>笔记趋势</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-mono">
            +{periodTotal}
          </span>
        </button>

        {/* Period Selector */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-zinc-900 rounded-lg text-[10px] font-medium">
          <button
            onClick={() => setPeriod('week')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              period === 'week'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            周
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              period === 'month'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            月
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              period === 'year'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            年
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {isExpanded && (
        <div className="pt-1">
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] px-2 py-1 rounded-lg shadow-lg border border-slate-700">
                          <p className="font-semibold">{data.label}</p>
                          <p className="text-indigo-300">{data.count} 条笔记</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 mt-1 px-1">
            <span>
              {period === 'week' ? '过去 7 天' : period === 'month' ? '过去 6 个月' : '历年分布'}
            </span>
            <span className="flex items-center gap-0.5 text-indigo-500 font-medium">
              <TrendingUp className="w-3 h-3" />
              新增趋势
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
