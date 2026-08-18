import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteHistory } from '../types';
import { TyporaBlockEditor } from './TyporaBlockEditor';
import { formatFriendlyTime, extractTags, calculateTextStats } from '../utils/markdownUtils';
import {
  X,
  Save,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table as TableIcon,
  Sigma,
  Image as ImageIcon,
  Link as LinkIcon,
  Hash,
  Maximize2,
  Minimize2,
  History,
  RotateCcw,
  Clock,
  Loader2,
  CheckCircle2,
  Palette,
  Smile,
  Calendar,
} from 'lucide-react';
import { IconPickerModal } from './IconPickerModal';
import { NoteExportCardModal } from './NoteExportCardModal';
import { ImageInsertModal } from './ImageInsertModal';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null; // null if creating new note
  allNotes?: Note[];
  onSave: (content: string, isPinned: boolean, isFavorite: boolean, isAutoSave?: boolean) => void;
  allExistingTags: string[];
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onBiLinkClick?: (title: string) => void;
  editorFontSize?: 'sm' | 'base' | 'lg' | 'xl';
  autoSaveEnabled?: boolean;
  autoSaveDelay?: number;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  note,
  allNotes = [],
  onSave,
  allExistingTags,
  onShowToast,
  onBiLinkClick,
  editorFontSize = 'base',
  autoSaveEnabled = true,
  autoSaveDelay = 2000,
}) => {
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newCustomTagInput, setNewCustomTagInput] = useState('');
  const [showIconPickerModal, setShowIconPickerModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportImageModal, setShowExportImageModal] = useState(false);

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isInitialMount = useRef(true);

  // Extract current tags from content in real-time
  const currentTags = extractTags(content);

  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().replace(/^#+/, '');
    if (!cleanTag) return;
    // Append tag to content with a trailing space
    setContent((prev) => {
      const trimmed = prev.trimEnd();
      return `${trimmed}\n\n#${cleanTag} `;
    });
    setNewCustomTagInput('');
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    // Regex matching #tagToRemove
    const tagRegex = new RegExp(`(?:^|\\s)#${tagToRemove}(?=\\s|$|[.,!?;:])`, 'g');
    const updated = content.replace(tagRegex, '');
    setContent(updated);
  };

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setIsPinned(note.isPinned);
      setIsFavorite(note.isFavorite);
    } else {
      setContent('');
      setIsPinned(false);
      setIsFavorite(false);
    }
    setShowHistoryModal(false);
    isInitialMount.current = true;
    setAutoSaveStatus('idle');
  }, [note, isOpen]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isOpen || !content.trim() || !autoSaveEnabled) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      onSave(content, isPinned, isFavorite, true);
      setAutoSaveStatus('saved');
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [content, isPinned, isFavorite, isOpen, autoSaveEnabled, autoSaveDelay]);

  if (!isOpen) return null;

  // Append formatting text
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    setContent((prev) => prev + prefix + defaultText + suffix);
  };

  const handleInsertDateTitle = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateTitle = `# ${year}-${month}-${day}`;

    setContent((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `${dateTitle}\n\n`;
      }
      if (trimmed.startsWith(dateTitle)) {
        return prev;
      }
      return `${dateTitle}\n\n${prev}`;
    });
    onShowToast(`已在顶部自动插入日期标题: ${dateTitle}`, 'success');
  };

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content, isPinned, isFavorite);
    onClose();
  };

  // Restore snapshot version
  const handleRestoreSnapshot = (snapshot: NoteHistory) => {
    setContent(snapshot.content);
    setShowHistoryModal(false);
  };

  // Stats (accurate clean character & word count)
  const textStats = calculateTextStats(content);
  const charCount = textStats.chars;
  const wordCount = textStats.words;
  const rawCharCount = textStats.rawChars;
  const readingTime = Math.ceil(wordCount / 200) || 1;
  const histories = note?.history || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div
        className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-5xl w-full h-[90vh]'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 dark:text-zinc-100 text-base">
              {note ? '编辑笔记' : '新建笔记'}
            </span>

            {/* Auto-save status indicator */}
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>自动保存中...</span>
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/40">
                <CheckCircle2 className="w-3 h-3" />
                <span>已自动存至本地</span>
              </span>
            )}

            {histories.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 transition-colors"
                title="查看修改历史快照"
              >
                <History className="w-3.5 h-3.5" />
                <span>修改历史快照 ({histories.length})</span>
              </button>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
              title={isFullscreen ? '退出全屏' : '全屏编辑'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center flex-wrap gap-1 px-4 py-2 bg-white dark:bg-zinc-900 border-b border-slate-200/60 dark:border-zinc-800 shrink-0 text-slate-600 dark:text-zinc-400 no-scrollbar">
          <button
            onClick={() => insertFormatting('**', '**', '粗体')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="粗体 (**bold**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*', '斜体')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="斜体 (*italic*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('~~', '~~', '删除线')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="删除线 (~~strike~~)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1" />

          <button
            onClick={() => insertFormatting('# ', '', '一级标题')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="一级标题 (# H1)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('## ', '', '二级标题')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="二级标题 (## H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1" />

          <button
            onClick={() => insertFormatting('- ', '', '无序列表项')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="无序列表 (- list)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('1. ', '', '有序列表项')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="有序列表 (1. list)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ', '', '待办清单')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="待办清单 (- [ ])"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1" />

          <button
            onClick={() => insertFormatting('```typescript\n', '\n```', '// 代码块')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="代码块 (```)"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('> ', '', '引用内容')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="引用 (> quote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              insertFormatting(
                '\n| 表头1 | 表头2 |\n| :--- | :--- |\n| 单元格1 | 单元格2 |\n'
              )
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="插入表格"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertFormatting('$$ ', ' $$', 'E = mc^2')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="数学公式 ($$ formula $$)"
          >
            <Sigma className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1" />

          <button
            onClick={() => setShowImageModal(true)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-slate-600 dark:text-zinc-300 transition-colors"
            title="插入图片 (支持本地文件与网络 URL)"
          >
            <ImageIcon className="w-4 h-4 text-indigo-500" />
          </button>
          <button
            onClick={() => insertFormatting('[链接名称](', ')', 'https://example.com')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            title="插入超链接"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Icon / Emoji Picker */}
          <button
            onClick={() => setShowIconPickerModal(true)}
            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 flex items-center gap-1 text-xs font-medium"
            title="插入图标/表情符号"
          >
            <Smile className="w-4 h-4 text-amber-500" />
            <span>图标表情</span>
          </button>

          {/* Auto Insert Date Title */}
          <button
            type="button"
            onClick={handleInsertDateTitle}
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors"
            title="在编辑器顶部自动插入当前格式化日期标题 (# YYYY-MM-DD)"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>日期标题</span>
          </button>

          {/* Tag Auto-picker */}
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 flex items-center gap-1 text-xs font-medium"
              title="插入或关联标签 (#tag)"
            >
              <Hash className="w-4 h-4 text-indigo-500" />
              <span>标签</span>
            </button>

            {showTagDropdown && (
              <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 min-w-[200px] max-h-60 overflow-y-auto">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mb-1.5">
                  快速选择或输入标签：
                </p>

                {/* Custom input box */}
                <div className="flex items-center gap-1 mb-2">
                  <input
                    type="text"
                    value={newCustomTagInput}
                    onChange={(e) => setNewCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newCustomTagInput);
                      }
                    }}
                    placeholder="输入新标签..."
                    className="flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-lg focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(newCustomTagInput)}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 hover:bg-indigo-700 transition-colors"
                  >
                    添加
                  </button>
                </div>

                {allExistingTags.length > 0 && (
                  <div className="space-y-0.5 border-t border-slate-100 dark:border-zinc-800 pt-1.5">
                    {allExistingTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => handleAddTag(t)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-zinc-200 rounded-lg flex items-center justify-between"
                      >
                        <span>#{t}</span>
                        {currentTags.includes(t) && (
                          <span className="text-[10px] text-indigo-500 font-medium">已添加</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Image Button */}
          {content.trim() && (
            <button
              onClick={() => setShowExportImageModal(true)}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-1 text-xs font-semibold transition-colors ml-auto"
              title="将当前笔记导出为精美长图"
            >
              <Palette className="w-4 h-4" />
              <span>导出精美图片</span>
            </button>
          )}
        </div>

        {/* Note Tags Bar (Interactive Tag Pills Bar) */}
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-200/60 dark:border-zinc-800 flex items-center gap-2 flex-wrap shrink-0 text-xs">
          <span className="text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1 shrink-0">
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
            <span>关联标签:</span>
          </span>

          {currentTags.length === 0 ? (
            <span className="text-slate-400 dark:text-zinc-500 text-[11px] italic">
              （暂无关联标签，点击上方「标签」或在文本中打 #标签 自动解析）
            </span>
          ) : (
            currentTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40 font-medium shadow-2xs group"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 rounded-full p-0.5 transition-colors"
                  title={`移除标签 #${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}

          {/* Inline Quick Add Tag Input */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <input
              type="text"
              placeholder="+ 打标签 (按回车)"
              value={newCustomTagInput}
              onChange={(e) => setNewCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newCustomTagInput);
                }
              }}
              className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28 sm:w-36 transition-all"
            />
            {newCustomTagInput.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(newCustomTagInput)}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 hover:bg-indigo-700 transition-colors"
              >
                添加
              </button>
            )}
          </div>
        </div>

        {/* Editor Typora WYSIWYG Canvas */}
        <div className="flex-1 min-h-0 relative flex bg-slate-50/30 dark:bg-zinc-950/20 overflow-y-auto">
          <TyporaBlockEditor
            content={content}
            onChange={setContent}
            onSave={handleSave}
            fontSize={editorFontSize}
            onBiLinkClick={(title) => {
              onClose();
              onBiLinkClick?.(title);
            }}
          />
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <span>{charCount} 字</span>
            <span className="hidden sm:inline opacity-75">({rawCharCount} 字符)</span>
            <span>{wordCount} 词</span>
            <span>预计阅读 {readingTime} 分钟</span>
            <span className="hidden md:inline opacity-75">`Ctrl + Enter` 保存</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存笔记</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Snapshots Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-semibold text-sm">
                <History className="w-4 h-4 text-indigo-500" />
                <span>修改历史快照</span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {histories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  暂无历史快照版本
                </div>
              ) : (
                histories.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{formatFriendlyTime(h.timestamp)} ({new Date(h.timestamp).toLocaleString()})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(h)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-transform active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>恢复此快照</span>
                      </button>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800/60 text-xs font-mono text-slate-700 dark:text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {h.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Insert Modal */}
      <ImageInsertModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsertImage={(url, altText) => {
          let cleanUrl = url.replace(/[\r\n]+/g, '').trim();
          if (cleanUrl.includes(' ') && !cleanUrl.startsWith('data:')) {
            cleanUrl = cleanUrl.replace(/ /g, '%20');
          }
          const cleanAlt = (altText || '图片').replace(/[\]\[\r\n]/g, '').trim();
          insertFormatting(`\n\n![${cleanAlt}](${cleanUrl})\n\n`);
        }}
      />

      {/* Icon / Emoji Selection Modal */}
      <IconPickerModal
        isOpen={showIconPickerModal}
        onClose={() => setShowIconPickerModal(false)}
        onSelectIcon={(selectedIcon) => {
          insertFormatting(` ${selectedIcon} `);
        }}
      />

      {/* Export Card Image Modal */}
      <NoteExportCardModal
        isOpen={showExportImageModal}
        onClose={() => setShowExportImageModal(false)}
        note={
          note || {
            id: 'temp-preview',
            content: content,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPinned: false,
            isFavorite: false,
          }
        }
        onShowToast={onShowToast}
      />
    </div>
  );
};
