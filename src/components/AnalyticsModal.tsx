import React from 'react';
import { Note } from '../types';
import { ContributionHeatmap } from './ContributionHeatmap';
import { NotesStatsCard } from './NotesStatsCard';
import { X, Flame, Sparkles } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string | null) => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  notes,
  selectedDate,
  onSelectDate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xs">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base flex items-center gap-2">
                <span>创作热力图与思考复盘</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                  {notes.length} 条笔记
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Section 1: Contribution Heatmap */}
          <div>
            <ContributionHeatmap
              notes={notes}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                if (onSelectDate) onSelectDate(d);
                if (d) onClose(); // Close modal on picking date
              }}
              compact={false}
            />
          </div>

          {/* Section 2: Detailed Stats & Bar Charts */}
          <div>
            <NotesStatsCard notes={notes} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>点击热力图中的方块可按日期筛选历史笔记</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-medium transition-colors"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};
