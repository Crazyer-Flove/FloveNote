import React, { useMemo, useState } from 'react';
import { Note } from '../types';
import { Flame, Calendar as CalendarIcon, Sparkles, ChevronRight } from 'lucide-react';

interface ContributionHeatmapProps {
  notes: Note[];
  onSelectDate?: (dateStr: string | null) => void;
  selectedDate?: string | null;
  compact?: boolean;
}

interface DayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number; // 0-6 (Sun-Sat)
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  notes,
  onSelectDate,
  selectedDate,
  compact = false,
}) => {
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);

  // Generate matrix data for past 12 weeks (84 days) or past 8 weeks if compact
  const weeksCount = compact ? 8 : 12;

  const { weeksData, totalActiveDays, currentStreak, maxStreak, totalPeriodNotes } = useMemo(() => {
    const now = new Date();
    // Normalize to end of today
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Map notes to YYYY-MM-DD
    const noteCountsByDate: Record<string, number> = {};
    notes.forEach((note) => {
      const d = new Date(note.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      noteCountsByDate[key] = (noteCountsByDate[key] || 0) + 1;
    });

    // Determine grid start date: align to Sunday X weeks ago
    const daysToSubtract = weeksCount * 7 - 1;
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
    // Align start date to previous Sunday
    const startDayOfWeek = startDate.getDay(); // 0 is Sun
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const cells: DayCell[] = [];
    const curr = new Date(startDate);

    let activeDaysCount = 0;
    let periodNotesSum = 0;

    // Loop through days until today
    while (curr <= todayEnd || cells.length < weeksCount * 7) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const count = noteCountsByDate[dateStr] || 0;
      if (count > 0) {
        activeDaysCount++;
        periodNotesSum += count;
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3 || count === 4) level = 3;
      else if (count >= 5) level = 4;

      cells.push({
        date: new Date(curr),
        dateStr,
        count,
        level,
        dayOfWeek: curr.getDay(),
      });

      curr.setDate(curr.getDate() + 1);
    }

    // Group cells into weeks (7 days per column)
    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    // Calculate Streak (consecutive active days)
    let streak = 0;
    let maxStr = 0;
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if today has notes
    const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (!noteCountsByDate[todayStr]) {
      // Check yesterday if today hasn't started yet
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (noteCountsByDate[key] && noteCountsByDate[key] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate max streak across all dates in map
    let tempStr = 0;
    const sortedDates = Object.keys(noteCountsByDate).sort();
    let prevD: Date | null = null;
    sortedDates.forEach((dStr) => {
      const parts = dStr.split('-').map(Number);
      const curD = new Date(parts[0], parts[1] - 1, parts[2]);
      if (prevD) {
        const diffDays = Math.round((curD.getTime() - prevD.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStr++;
        } else {
          tempStr = 1;
        }
      } else {
        tempStr = 1;
      }
      if (tempStr > maxStr) maxStr = tempStr;
      prevD = curD;
    });

    return {
      weeksData: weeks,
      totalActiveDays: activeDaysCount,
      currentStreak: streak,
      maxStreak: Math.max(streak, maxStr),
      totalPeriodNotes: periodNotesSum,
    };
  }, [notes, weeksCount]);

  // Heatmap Color Scale Classes
  const getCellColor = (level: 0 | 1 | 2 | 3 | 4, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-amber-400 dark:bg-amber-500 ring-2 ring-indigo-600 dark:ring-indigo-400 scale-110 z-10';
    }
    switch (level) {
      case 0:
        return 'bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700/80';
      case 1:
        return 'bg-indigo-200 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-300';
      case 2:
        return 'bg-indigo-400 dark:bg-indigo-700 hover:bg-indigo-500';
      case 3:
        return 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700';
      case 4:
        return 'bg-indigo-700 dark:bg-indigo-400 hover:bg-indigo-800';
    }
  };

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-3.5 shadow-2xs transition-all">
      {/* Header with Flame & Streak Counter */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-500">
            <Flame className="w-4 h-4 fill-orange-500 stroke-orange-600" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-slate-800 dark:text-zinc-100 flex items-center gap-1">
              <span>创作日历热力图</span>
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
              近 {weeksCount} 周记录频次
            </span>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="flex items-center gap-2">
          {currentStreak > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold font-mono shadow-xs flex items-center gap-1 animate-pulse">
              <span>🔥 连续 {currentStreak} 天</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {totalActiveDays} <span className="text-[10px] font-normal text-slate-400">活跃天</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="relative pt-1">
        <div className="flex items-start gap-1 overflow-x-auto pb-1 custom-scrollbar">
          {/* Day of Week Labels (Show Sun, Tue, Thu, Sat) */}
          <div className="grid grid-rows-7 gap-1 pr-1 text-[9px] font-mono text-slate-400 dark:text-zinc-500 select-none">
            {dayLabels.map((lbl, idx) => (
              <div key={idx} className="h-3 w-3 flex items-center justify-center">
                {idx % 2 === 1 ? lbl : ''}
              </div>
            ))}
          </div>

          {/* Weeks Columns */}
          <div className="flex gap-1">
            {weeksData.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1">
                {week.map((cell) => {
                  const isSelected = selectedDate === cell.dateStr;
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => {
                        if (onSelectDate) {
                          onSelectDate(isSelected ? null : cell.dateStr);
                        }
                      }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-3 h-3 rounded-[3px] transition-all transform cursor-pointer ${getCellColor(
                        cell.level,
                        isSelected
                      )}`}
                      title={`${cell.dateStr}: ${cell.count} 条笔记`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Hover / Active Day Details Bar */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
          <div>
            {hoveredCell ? (
              <span className="font-medium text-slate-800 dark:text-zinc-200">
                {hoveredCell.dateStr} ·{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {hoveredCell.count}
                </strong>{' '}
                条笔记
              </span>
            ) : selectedDate ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                已筛选: {selectedDate}
              </span>
            ) : (
              <span>点击方块可按日期筛选笔记</span>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-1 select-none">
            <span className="text-[9px] opacity-70">少</span>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-zinc-800" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-200 dark:bg-indigo-950" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-400 dark:bg-indigo-700" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-600 dark:bg-indigo-500" />
            <span className="text-[9px] opacity-70">多</span>
          </div>
        </div>
      </div>
    </div>
  );
};
