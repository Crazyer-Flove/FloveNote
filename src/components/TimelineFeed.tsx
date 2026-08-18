import React, { useMemo } from 'react';
import { Note, FilterState, ViewMode, CodeBlockThemeId, TableThemeId } from '../types';
import { TopComposer } from './TopComposer';
import { NoteCard } from './NoteCard';
import {
  groupNotesByDate,
  getIsoWeekString,
  getMonthString,
  formatWeekLabel,
  formatMonthLabel,
} from '../utils/markdownUtils';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Hash,
  Inbox,
  Plus,
  Calendar,
  Filter,
  CalendarDays,
  Clock,
  FoldVertical,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface TimelineFeedProps {
  notes: Note[];
  allNotes?: Note[];
  filterState: FilterState;
  viewMode: ViewMode;
  allTags: string[];
  onFilterChange: (updates: Partial<FilterState>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onPublishNote: (content: string) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote?: (id: string) => void;
  onPermanentDeleteNote?: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateContent: (id: string, newContent: string) => void;
  onOpenFullEditor: (initialContent?: string) => void;
  onTagClick: (tag: string) => void;
  onBiLinkClick?: (title: string) => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onOpenMobileMenu: () => void;
  onOpenFocusMode?: (note: Note) => void;
  onExportImage?: (note: Note) => void;
  onOpenCommandPalette?: () => void;
  onReorderNotes?: (draggedId: string, targetId: string) => void;
  onOpenHelpGuide?: () => void;
  onImportAllCaseDocuments?: () => void;
  codeBlockTheme?: CodeBlockThemeId;
  tableTheme?: TableThemeId;
  autoFoldLongNotes?: boolean;
  onToggleAutoFold?: () => void;
}

export const TimelineFeed: React.FC<TimelineFeedProps> = ({
  notes,
  allNotes = [],
  filterState,
  viewMode,
  allTags,
  onFilterChange,
  onViewModeChange,
  onPublishNote,
  onEditNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDeleteNote,
  onTogglePin,
  onToggleFavorite,
  onUpdateContent,
  onOpenFullEditor,
  onTagClick,
  onBiLinkClick,
  onShowToast,
  onOpenMobileMenu,
  onOpenFocusMode,
  onExportImage,
  onOpenCommandPalette,
  onReorderNotes,
  onOpenHelpGuide,
  onImportAllCaseDocuments,
  codeBlockTheme,
  tableTheme,
  autoFoldLongNotes = false,
  onToggleAutoFold,
}) => {
  const [draggedNoteId, setDraggedNoteId] = React.useState<string | null>(null);
  const [dropTargetNoteId, setDropTargetNoteId] = React.useState<string | null>(null);

  // Group notes chronologically
  const dateGroups = groupNotesByDate(notes);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (draggedNoteId && draggedNoteId !== id) {
      setDropTargetNoteId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    const sourceId = e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (sourceId && sourceId !== targetId && onReorderNotes) {
      onReorderNotes(sourceId, targetId);
    }
    setDraggedNoteId(null);
    setDropTargetNoteId(null);
  };

  // Compute available weeks from all notes
  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, number>();
    allNotes.forEach((n) => {
      const wStr = getIsoWeekString(new Date(n.createdAt));
      weekMap.set(wStr, (weekMap.get(wStr) || 0) + 1);
    });
    return Array.from(weekMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allNotes]);

  // Compute available months from all notes
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, number>();
    allNotes.forEach((n) => {
      const mStr = getMonthString(new Date(n.createdAt));
      monthMap.set(mStr, (monthMap.get(mStr) || 0) + 1);
    });
    return Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allNotes]);

  const currentThisWeekStr = useMemo(() => getIsoWeekString(new Date()), []);
  const currentThisMonthStr = useMemo(() => getMonthString(new Date()), []);

  return (
    <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Search & Top Controls Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-stone-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-xs"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Search Bar Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="搜索笔记关键词、正文或 #标签..."
            value={filterState.searchKeyword}
            onChange={(e) => onFilterChange({ searchKeyword: e.target.value })}
            className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs"
          />
          {filterState.searchKeyword ? (
            <button
              onClick={() => onFilterChange({ searchKeyword: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          ) : onOpenCommandPalette ? (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shadow-2xs"
              title="打开快捷命令面板 (Cmd+K)"
            >
              <span>⌘K 命令</span>
            </button>
          ) : null}
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={() =>
            onFilterChange({
              sortBy: filterState.sortBy === 'newest' ? 'oldest' : 'newest',
            })
          }
          className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
          title="切换时间轴正序/倒序"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">
            {filterState.sortBy === 'newest' ? '按最新排序' : '按最早排序'}
          </span>
        </button>

        {/* Long Notes Auto-Fold Toggle */}
        <button
          onClick={() => onToggleAutoFold?.()}
          className={`px-3 py-2.5 rounded-2xl border text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
            autoFoldLongNotes
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-semibold'
              : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
          title="开启/关闭超过 200 字长笔记自动折叠功能"
        >
          <FoldVertical className="w-3.5 h-3.5 text-indigo-500" />
          <span>{autoFoldLongNotes ? '长笔记折叠 (已开启)' : '长笔记折叠'}</span>
        </button>
      </div>

      {/* Filter Bar: Tag, Week, Month Selectors */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs custom-scrollbar">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400 dark:text-zinc-500 shrink-0 font-medium">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>多维筛选:</span>
        </div>

        {/* Tag Dropdown Filter */}
        <div className="relative shrink-0">
          <select
            value={filterState.selectedTag || ''}
            onChange={(e) => onFilterChange({ selectedTag: e.target.value || null })}
            className={`px-3 py-1.5 rounded-xl border font-medium bg-white dark:bg-zinc-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              filterState.selectedTag
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <option value="">所有标签 ({allTags.length})</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        {/* Week Dropdown Filter */}
        <div className="relative shrink-0">
          <select
            value={filterState.weekFilter || ''}
            onChange={(e) => onFilterChange({ weekFilter: e.target.value || null })}
            className={`px-3 py-1.5 rounded-xl border font-medium bg-white dark:bg-zinc-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              filterState.weekFilter
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <option value="">按周筛选 (全部)</option>
            {availableWeeks.some(([w]) => w === currentThisWeekStr) && (
              <option value={currentThisWeekStr}>📅 本周 ({formatWeekLabel(currentThisWeekStr)})</option>
            )}
            {availableWeeks.map(([wStr, count]) => (
              <option key={wStr} value={wStr}>
                {formatWeekLabel(wStr)} ({count}条)
              </option>
            ))}
          </select>
        </div>

        {/* Month Dropdown Filter */}
        <div className="relative shrink-0">
          <select
            value={filterState.monthFilter || ''}
            onChange={(e) => onFilterChange({ monthFilter: e.target.value || null })}
            className={`px-3 py-1.5 rounded-xl border font-medium bg-white dark:bg-zinc-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              filterState.monthFilter
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <option value="">按月筛选 (全部)</option>
            {availableMonths.some(([m]) => m === currentThisMonthStr) && (
              <option value={currentThisMonthStr}>🗓️ 本月 ({formatMonthLabel(currentThisMonthStr)})</option>
            )}
            {availableMonths.map(([mStr, count]) => (
              <option key={mStr} value={mStr}>
                {formatMonthLabel(mStr)} ({count}条)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Badges Indicator */}
      {(filterState.selectedTag ||
        filterState.weekFilter ||
        filterState.monthFilter ||
        filterState.searchKeyword ||
        filterState.category !== 'all' ||
        filterState.dateFilter) && (
        <div className="flex items-center gap-2 mb-6 flex-wrap bg-indigo-50/60 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 text-xs">
          <span className="text-slate-500 dark:text-zinc-400 font-medium">当前应用筛选：</span>

          {filterState.selectedTag && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>标签: #{filterState.selectedTag}</span>
              <button
                onClick={() => onFilterChange({ selectedTag: null })}
                className="hover:text-indigo-800 dark:hover:text-indigo-100 ml-1"
                title="清除标签筛选"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterState.weekFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
              <span>按周: {formatWeekLabel(filterState.weekFilter)}</span>
              <button
                onClick={() => onFilterChange({ weekFilter: null })}
                className="hover:text-emerald-800 dark:hover:text-emerald-100 ml-1"
                title="清除周筛选"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterState.monthFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>按月: {formatMonthLabel(filterState.monthFilter)}</span>
              <button
                onClick={() => onFilterChange({ monthFilter: null })}
                className="hover:text-purple-800 dark:hover:text-purple-100 ml-1"
                title="清除月筛选"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterState.dateFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>具体日期: {filterState.dateFilter}</span>
              <button
                onClick={() => onFilterChange({ dateFilter: null })}
                className="hover:text-amber-900 dark:hover:text-amber-100 ml-1"
                title="清除具体日期筛选"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterState.searchKeyword && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-medium border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <span>搜索: "{filterState.searchKeyword}"</span>
              <button
                onClick={() => onFilterChange({ searchKeyword: '' })}
                className="hover:text-slate-900 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterState.category !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-medium border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <span>分类: {filterState.category === 'pinned' ? '置顶笔记' : '特别星标'}</span>
              <button
                onClick={() => onFilterChange({ category: 'all' })}
                className="hover:text-slate-900 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={() =>
              onFilterChange({
                searchKeyword: '',
                selectedTag: null,
                weekFilter: null,
                monthFilter: null,
                dateFilter: null,
                category: 'all',
              })
            }
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 ml-auto shrink-0"
          >
            重置所有筛选
          </button>
        </div>
      )}

      {/* Top Composer Input Box */}
      <div className="mb-8">
        <TopComposer
          onPublish={onPublishNote}
          onOpenFullEditor={onOpenFullEditor}
          allExistingTags={allTags}
        />
      </div>

      {/* Timeline Stream */}
      {dateGroups.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-10 text-center my-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
            {allNotes.length === 0 ? <Sparkles className="w-7 h-7" /> : <Inbox className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base">
              {allNotes.length === 0 ? '欢迎开启你的 FloveNote 纯粹记录之旅' : '暂无匹配的笔记'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              {allNotes.length === 0
                ? '支持 Markdown 极简排版、双向链接、LaTeX 公式、Mac 风格代码块与一键长图导出。随时在上方记录，或载入实战案例！'
                : '没有找到与当前筛选条件相符的笔记，尝试重置关键字或新建笔记。'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              onClick={() => onOpenFullEditor()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建第一条笔记</span>
            </button>

            {allNotes.length === 0 && onOpenHelpGuide && (
              <button
                onClick={onOpenHelpGuide}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>实战案例文档库 & 导览</span>
              </button>
            )}

            {allNotes.length === 0 && onImportAllCaseDocuments && (
              <button
                onClick={onImportAllCaseDocuments}
                className="px-4 py-2 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-violet-200/80 dark:border-violet-800/80 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>一键导入 4 篇实战案例</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {dateGroups.map((group) => (
            <div key={group.label} className="space-y-4">
              {/* Date Group Header */}
              <div className="flex items-center gap-3 sticky top-0 z-10 py-1 bg-stone-50/90 dark:bg-zinc-950/90 backdrop-blur-xs">
                <span className="font-serif font-bold text-sm text-stone-800 dark:text-zinc-200 px-3 py-1 bg-white dark:bg-zinc-900 rounded-xl border border-stone-200/80 dark:border-zinc-800 shadow-2xs">
                  {group.label}
                </span>
                <div className="flex-1 h-[1px] bg-stone-200/70 dark:bg-zinc-800/80" />
                <span className="text-[11px] text-stone-400 dark:text-zinc-500 font-mono">
                  {group.notes.length} 条笔记
                </span>
              </div>

              {/* Grouped Note Cards */}
              <div className="space-y-4">
                {group.notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    allNotes={allNotes}
                    onEdit={onEditNote}
                    onDelete={onDeleteNote}
                    onRestore={onRestoreNote}
                    onPermanentDelete={onPermanentDeleteNote}
                    onTogglePin={onTogglePin}
                    onToggleFavorite={onToggleFavorite}
                    onUpdateContent={onUpdateContent}
                    onTagClick={onTagClick}
                    onBiLinkClick={onBiLinkClick}
                    onShowToast={onShowToast}
                    onFocusMode={onOpenFocusMode}
                    onExportImage={onExportImage}
                    onDragStartNote={handleDragStart}
                    onDragOverNote={handleDragOver}
                    onDropNote={handleDrop}
                    isDragOver={dropTargetNoteId === note.id}
                    codeBlockTheme={codeBlockTheme}
                    tableTheme={tableTheme}
                    autoFoldLongNotes={autoFoldLongNotes}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
