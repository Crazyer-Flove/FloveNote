import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatFriendlyTime, exportNotesContent, downloadFile } from '../utils/markdownUtils';
import {
  Minimize2,
  Edit3,
  Pin,
  Star,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  Type,
  Maximize2,
  Sliders,
  Trash2,
} from 'lucide-react';

interface FocusModeModalProps {
  note: Note;
  allNotes: Note[];
  onClose: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateContent: (id: string, newContent: string) => void;
  onSelectNote: (note: Note) => void;
  onTagClick: (tag: string) => void;
  onBiLinkClick?: (title: string) => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  note,
  allNotes,
  onClose,
  onEditNote,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite,
  onUpdateContent,
  onSelectNote,
  onTagClick,
  onBiLinkClick,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [contentWidth, setContentWidth] = useState<'normal' | 'wide' | 'full'>('normal');

  // Find index of current note in allNotes for prev/next navigation
  const currentIndex = allNotes.findIndex((n) => n.id === note.id);
  const prevNote = currentIndex > 0 ? allNotes[currentIndex - 1] : null;
  const nextNote = currentIndex >= 0 && currentIndex < allNotes.length - 1 ? allNotes[currentIndex + 1] : null;

  // Listen to keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && prevNote) {
        onSelectNote(prevNote);
      } else if (e.key === 'ArrowRight' && nextNote) {
        onSelectNote(nextNote);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, prevNote, nextNote, onSelectNote]);

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    onShowToast('笔记源码已复制', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const { filename, content, mimeType } = exportNotesContent([note], 'md');
    downloadFile(filename, content, mimeType);
    onShowToast(`已导出: ${filename}`, 'success');
  };

  // Font size class mapping
  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-relaxed',
  };

  // Width class mapping
  const widthClasses = {
    normal: 'max-w-2xl',
    wide: 'max-w-4xl',
    full: 'max-w-full px-8',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col overflow-hidden animate-fadeIn select-text">
      {/* Top Navigation & Toolbar Header */}
      <header className="h-14 px-6 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        {/* Left Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition-colors shadow-2xs"
            title="退出专注模式 (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-indigo-500" />
            <span>退出专注阅读</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
            <span>{formatFriendlyTime(note.createdAt)}</span>
            {note.isPinned && (
              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                <Pin className="w-3 h-3 fill-indigo-500" />
                <span>置顶</span>
              </span>
            )}
            {note.isFavorite && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-amber-500" />
                <span>收藏</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Previous / Next Note Nav Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            disabled={!prevNote}
            onClick={() => prevNote && onSelectNote(prevNote)}
            className="p-1 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={prevNote ? '上一篇 (Left)' : '已是第一篇'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono px-2 text-slate-500 dark:text-zinc-400">
            {currentIndex >= 0 ? `${currentIndex + 1} / ${allNotes.length}` : '专注模式'}
          </span>

          <button
            disabled={!nextNote}
            onClick={() => nextNote && onSelectNote(nextNote)}
            className="p-1 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={nextNote ? '下一篇 (Right)' : '已是最后一篇'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Typography customization & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Font Size Selector */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs">
            <Type className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-0.5 rounded-md ${
                fontSize === 'sm' ? 'bg-white dark:bg-zinc-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              小
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-0.5 rounded-md ${
                fontSize === 'base' ? 'bg-white dark:bg-zinc-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              中
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-0.5 rounded-md ${
                fontSize === 'lg' ? 'bg-white dark:bg-zinc-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              大
            </button>
          </div>

          {/* Width Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setContentWidth('normal')}
              className={`px-2 py-0.5 rounded-md ${
                contentWidth === 'normal' ? 'bg-white dark:bg-zinc-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              标准宽度
            </button>
            <button
              onClick={() => setContentWidth('wide')}
              className={`px-2 py-0.5 rounded-md ${
                contentWidth === 'wide' ? 'bg-white dark:bg-zinc-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              宽屏阅读
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

          {/* Pin & Favorite */}
          <button
            onClick={() => onToggleFavorite(note.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title="收藏"
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => onTogglePin(note.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.isPinned
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title="置顶"
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Copy Markdown */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="复制代码"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="导出为 .md"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => {
              onClose();
              onEditNote(note);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs transition-colors"
            title="在大编辑器中编辑"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>编辑笔记</span>
          </button>
        </div>
      </header>

      {/* Main Focus Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-12 custom-scrollbar">
        <div className={`mx-auto ${widthClasses[contentWidth]} transition-all duration-300`}>
          {/* Document Content Rendering */}
          <div className={fontSizeClasses[fontSize]}>
            <MarkdownRenderer
              content={note.content}
              onTagClick={(tag) => {
                onClose();
                onTagClick(tag);
              }}
              onBiLinkClick={(title) => {
                onClose();
                onBiLinkClick?.(title);
              }}
              onTaskToggle={(newContent) => onUpdateContent(note.id, newContent)}
            />
          </div>

          {/* Footer Tags */}
          {note.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-8 mt-12 border-t border-slate-200/80 dark:border-zinc-800/80">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">关联标签:</span>
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onClose();
                    onTagClick(tag);
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Hotkey Indicator */}
      <footer className="px-6 py-2 bg-white/50 dark:bg-zinc-900/50 border-t border-slate-200/60 dark:border-zinc-800/60 text-center text-[11px] text-slate-400 dark:text-zinc-500 font-mono flex items-center justify-between shrink-0">
        <span>键盘快捷键：[Esc] 退出专注阅读 | [← / →] 切换前后笔记</span>
        <span>FloveNote 专注阅读模式</span>
      </footer>
    </div>
  );
};
