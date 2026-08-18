import React, { useState } from 'react';
import { Note, CodeBlockThemeId, TableThemeId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatFriendlyTime, exportNotesContent, downloadFile } from '../utils/markdownUtils';
import {
  Pin,
  Star,
  Edit3,
  Copy,
  Trash2,
  MoreHorizontal,
  Check,
  Download,
  History,
  GripVertical,
  Maximize2,
  ImageIcon,
  Palette,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface NoteCardProps {
  note: Note;
  allNotes?: Note[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateContent: (id: string, newContent: string) => void;
  onTagClick: (tag: string) => void;
  onBiLinkClick?: (title: string) => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onFocusMode?: (note: Note) => void;
  onExportImage?: (note: Note) => void;
  onDragStartNote?: (e: React.DragEvent, noteId: string) => void;
  onDragOverNote?: (e: React.DragEvent, noteId: string) => void;
  onDropNote?: (e: React.DragEvent, targetNoteId: string) => void;
  isDragOver?: boolean;
  codeBlockTheme?: CodeBlockThemeId;
  tableTheme?: TableThemeId;
  autoFoldLongNotes?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  allNotes = [],
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  onTogglePin,
  onToggleFavorite,
  onUpdateContent,
  onTagClick,
  onBiLinkClick,
  onShowToast,
  onFocusMode,
  onExportImage,
  onDragStartNote,
  onDragOverNote,
  onDropNote,
  isDragOver = false,
  codeBlockTheme,
  tableTheme,
  autoFoldLongNotes = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongNote = note.content.length > 200;
  const shouldFold = autoFoldLongNotes && isLongNote && !isExpanded;
  const isInTrash = Boolean(note.deletedAt);

  const daysRemaining = note.deletedAt
    ? Math.max(1, 7 - Math.floor((Date.now() - note.deletedAt) / (1000 * 60 * 60 * 24)))
    : 7;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    onShowToast('Markdown 源码已复制到剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const handleSingleExport = () => {
    const { filename, content, mimeType } = exportNotesContent([note], 'md');
    downloadFile(filename, content, mimeType);
    onShowToast(`已导出笔记: ${filename}`, 'success');
    setShowMenu(false);
  };

  const historyCount = note.history?.length || 0;

  return (
    <div className="relative pl-6 sm:pl-8 group/card transition-all">
      {/* Vertical Timeline Bar & Bullet Node */}
      <div className="absolute left-0 top-3 bottom-0 w-[2px] bg-slate-200/80 dark:bg-zinc-800/80 group-last/card:bg-transparent" />
      <div
        className={`absolute left-[-4px] top-3.5 w-2.5 h-2.5 rounded-full border-2 transition-all duration-200 group-hover/card:scale-150 group-hover/card:border-indigo-500 group-hover/card:shadow-md ${
          note.isPinned
            ? 'bg-indigo-600 border-indigo-200 dark:border-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-slate-300 dark:bg-zinc-700 border-white dark:border-zinc-900'
        }`}
      />

      {/* Main Card Container with Hover Scale & Elevation */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', note.id);
          e.dataTransfer.setData('application/json', JSON.stringify({ noteId: note.id }));
          e.dataTransfer.effectAllowed = 'copyMove';
          onDragStartNote?.(e, note.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOverNote?.(e, note.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDropNote?.(e, note.id);
        }}
        className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 p-5 shadow-xs hover:shadow-xl hover:scale-[1.012] hover:-translate-y-0.5 ${
          isDragOver
            ? 'ring-2 ring-indigo-500 border-indigo-500 scale-[1.02] shadow-lg bg-indigo-50/30 dark:bg-indigo-950/30'
            : note.isPinned
            ? 'border-indigo-200/90 dark:border-indigo-950/80 bg-indigo-50/20 dark:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800'
            : 'border-slate-200/80 dark:border-zinc-800/80 hover:border-indigo-200/80 dark:hover:border-zinc-700'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-zinc-800/60 text-xs text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Drag Handle */}
            <div
              className="p-1 text-slate-300 dark:text-zinc-600 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-colors"
              title="按住拖拽调整笔记位置"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            <span className="font-medium text-slate-600 dark:text-zinc-400">
              {formatFriendlyTime(note.createdAt)}
            </span>

            {/* Trash Status Banner */}
            {isInTrash && (
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md font-medium text-[11px] border border-rose-200/60 dark:border-rose-900/40">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>回收站 (还剩 {daysRemaining} 天自动清除)</span>
              </span>
            )}

            {/* Pin Indicator */}
            {!isInTrash && note.isPinned && (
              <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md font-medium text-[11px] border border-indigo-200/60 dark:border-indigo-900/40">
                <Pin className="w-3 h-3 fill-indigo-500" />
                <span>置顶</span>
              </span>
            )}

            {/* Favorite Indicator */}
            {!isInTrash && note.isFavorite && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md font-medium text-[11px] border border-amber-200/60 dark:border-amber-900/40">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>收藏</span>
              </span>
            )}

            {/* Modification History Snapshot Indicator */}
            {!isInTrash && historyCount > 0 && (
              <button
                onClick={() => onEdit(note)}
                className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors"
                title={`包含 ${historyCount} 条修改历史快照，点击查看恢复`}
              >
                <History className="w-3 h-3 text-indigo-500" />
                <span>{historyCount} 快照</span>
              </button>
            )}
          </div>

          {/* Quick Actions Bar */}
          {isInTrash ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onRestore) onRestore(note.id);
                  else onShowToast('恢复笔记', 'info');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all active:scale-95 shadow-2xs"
                title="将此笔记恢复回原有工作区"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复笔记</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onPermanentDelete) onPermanentDelete(note.id);
                  else onDelete(note.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-all active:scale-95 shadow-2xs"
                title="彻底永久删除此笔记（不可撤销）"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>彻底删除</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 transition-all duration-200">
            {/* Star Favorite Quick Action */}
            <button
              onClick={() => {
                onToggleFavorite(note.id);
                onShowToast(note.isFavorite ? '已取消收藏' : '已添加至收藏', 'info');
              }}
              className={`p-1.5 rounded-xl transition-all duration-150 active:scale-90 ${
                note.isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
              }`}
              title={note.isFavorite ? '取消特别收藏' : '快速设为特别收藏'}
            >
              <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Pin Quick Action */}
            <button
              onClick={() => {
                onTogglePin(note.id);
                onShowToast(note.isPinned ? '已取消置顶' : '已快速置顶笔记', 'info');
              }}
              className={`p-1.5 rounded-xl transition-all duration-150 active:scale-90 ${
                note.isPinned
                  ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/50 shadow-2xs'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30'
              }`}
              title={note.isPinned ? '取消置顶' : '快速位置置顶'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-indigo-500' : ''}`} />
            </button>

            {/* Focus Mode Button */}
            {onFocusMode && (
              <button
                onClick={() => onFocusMode(note)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all active:scale-90"
                title="全屏沉浸专注模式"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Export Image Button */}
            {onExportImage && (
              <button
                onClick={() => onExportImage(note)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all active:scale-90"
                title="生成精美长图分享卡片"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            )}

            {/* Edit Note Button */}
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
              title="编辑此笔记"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Actions Menu Popup */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                title="更多菜单"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 min-w-[140px] text-xs animate-fadeIn"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {onFocusMode && (
                    <button
                      onClick={() => {
                        onFocusMode(note);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-left"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>专注模式</span>
                    </button>
                  )}
                  {onExportImage && (
                    <button
                      onClick={() => {
                        onExportImage(note);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-left font-medium"
                    >
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />
                      <span>导出精美图片</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopyMarkdown}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-left"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>复制代码</span>
                  </button>
                  <button
                    onClick={handleSingleExport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-left"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 .md</span>
                  </button>
                  <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 my-1" />
                  <button
                    onClick={() => {
                      onDelete(note.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-left font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除笔记</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Card Body - Markdown Rendered */}
        <div className={`relative transition-all duration-300 ${shouldFold ? 'max-h-48 overflow-hidden' : 'py-1'}`}>
          <MarkdownRenderer
            content={note.content}
            onTagClick={onTagClick}
            onBiLinkClick={onBiLinkClick}
            onTaskToggle={(newContent) => onUpdateContent(note.id, newContent)}
            codeBlockTheme={codeBlockTheme}
            tableTheme={tableTheme}
          />
          {shouldFold && (
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 dark:from-zinc-900 dark:via-zinc-900/90 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Long Note Expand/Collapse Toggle Button */}
        {autoFoldLongNotes && isLongNote && (
          <div className="mt-2 flex items-center justify-center pt-1 border-t border-slate-100/80 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-900/50 transition-all active:scale-95 shadow-2xs"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              <span>{isExpanded ? '收起全文' : `显示全文 (共 ${note.content.length} 字)`}</span>
            </button>
          </div>
        )}

        {/* Tags Footer */}
        {note.tags.length > 0 && (
          <div className="pt-3 mt-3 border-t border-slate-100/80 dark:border-zinc-800/50">
            <div className="flex items-center gap-1.5 flex-wrap">
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="px-2.5 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
