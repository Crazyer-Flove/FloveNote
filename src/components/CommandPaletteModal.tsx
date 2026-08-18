import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  Clock,
  BarChart2,
  FolderKanban,
  Pin,
  Heart,
  Settings,
  Moon,
  Sun,
  Download,
  HelpCircle,
  Hash,
  Sparkles,
  FileText,
  CornerDownLeft,
  X,
  Command,
  Maximize2,
  Filter,
  Undo2,
  Redo2,
  Cloud,
} from 'lucide-react';
import { Note, ViewMode, FilterState, ThemeMode } from '../types';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onCreateNewNote: () => void;
  onSetSearchKeyword: (kw: string) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSetCategoryFilter: (cat: 'all' | 'pinned' | 'favorites') => void;
  onResetFilters: () => void;
  onOpenSettings: () => void;
  onOpenAnalytics: () => void;
  onOpenResourceManager: () => void;
  onOpenTagCloud?: () => void;
  onOpenExportModal: () => void;
  onOpenSponsorModal: () => void;
  onToggleTheme: () => void;
  theme: ThemeMode;
  onUndo?: () => void;
  onRedo?: () => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

interface CommandItem {
  id: string;
  group: 'actions' | 'views' | 'filters' | 'settings' | 'notes';
  groupName: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNewNote,
  onSetSearchKeyword,
  onSetViewMode,
  onSetCategoryFilter,
  onResetFilters,
  onOpenSettings,
  onOpenAnalytics,
  onOpenResourceManager,
  onOpenTagCloud,
  onOpenExportModal,
  onOpenSponsorModal,
  onToggleTheme,
  theme,
  onUndo,
  onRedo,
  onShowToast,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build command list based on search query
  const commands = useMemo(() => {
    const q = query.toLowerCase().trim();

    // System Commands Definition
    const baseCommands: CommandItem[] = [
      {
        id: 'cmd-create-note',
        group: 'actions',
        groupName: '快捷操作',
        title: '新建随记笔记',
        subtitle: '即刻记录灵感、任务与随笔',
        icon: <Plus className="w-4 h-4 text-indigo-500" />,
        action: () => {
          onCreateNewNote();
          onShowToast('已打开随记编辑窗口', 'info');
        },
        badge: 'New',
      },
      {
        id: 'cmd-undo-note',
        group: 'actions',
        groupName: '快捷操作',
        title: '撤销上一步操作',
        subtitle: '恢复至变动前的笔记状态 (Command+Z)',
        icon: <Undo2 className="w-4 h-4 text-amber-500" />,
        action: () => {
          if (onUndo) onUndo();
        },
        badge: '⌘Z',
      },
      {
        id: 'cmd-redo-note',
        group: 'actions',
        groupName: '快捷操作',
        title: '重做变动操作',
        subtitle: '重新应用上一次撤销的笔记操作 (Shift+Command+Z)',
        icon: <Redo2 className="w-4 h-4 text-emerald-500" />,
        action: () => {
          if (onRedo) onRedo();
        },
        badge: '⇧⌘Z',
      },
      {
        id: 'cmd-focus-search',
        group: 'actions',
        groupName: '快捷操作',
        title: query ? `在列表中搜索 "${query}"` : '全局关键字检索',
        subtitle: '按关键字筛选匹配所有随记与标签',
        icon: <Search className="w-4 h-4 text-indigo-500" />,
        action: () => {
          if (query.trim()) {
            onSetSearchKeyword(query.trim());
            onShowToast(`已筛选关键字: ${query}`, 'info');
          }
        },
      },
      {
        id: 'cmd-view-timeline',
        group: 'views',
        groupName: '视图切换',
        title: '切换至：时间线视图',
        subtitle: '按时间先后顺流排列随记',
        icon: <Clock className="w-4 h-4 text-violet-500" />,
        action: () => {
          onSetViewMode('timeline');
          onShowToast('已切换至时间线视图', 'info');
        },
      },
      {
        id: 'cmd-view-grid',
        group: 'views',
        groupName: '视图切换',
        title: '切换至：瀑布流卡片视图',
        subtitle: '两栏/多栏自适应网格卡片',
        icon: <LayoutGrid className="w-4 h-4 text-violet-500" />,
        action: () => {
          onSetViewMode('grid');
          onShowToast('已切换至瀑布流卡片视图', 'info');
        },
      },
      {
        id: 'cmd-view-analytics',
        group: 'views',
        groupName: '视图切换',
        title: '打开：字数与统计仪表盘',
        subtitle: '查看随记趋势、热力图与字数分布',
        icon: <BarChart2 className="w-4 h-4 text-violet-500" />,
        action: () => {
          onOpenAnalytics();
        },
      },
      {
        id: 'cmd-view-tag-cloud',
        group: 'views',
        groupName: '视图切换',
        title: '打开：标签云全景图',
        subtitle: '通过字号和色彩展示标签热度与关联笔记',
        icon: <Cloud className="w-4 h-4 text-indigo-500" />,
        action: () => {
          if (onOpenTagCloud) onOpenTagCloud();
        },
      },
      {
        id: 'cmd-view-resource',
        group: 'views',
        groupName: '视图切换',
        title: '打开：.src/ 嵌入资源管理器',
        subtitle: '管理随记中的所有本地相对路径图片与文件',
        icon: <FolderKanban className="w-4 h-4 text-amber-500" />,
        action: () => {
          onOpenResourceManager();
        },
      },
      {
        id: 'cmd-filter-pinned',
        group: 'filters',
        groupName: '视图筛选',
        title: '筛选：仅看置顶笔记',
        subtitle: '展示固定在顶部的重点随记',
        icon: <Pin className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onSetCategoryFilter('pinned');
          onShowToast('已筛选置顶随记', 'info');
        },
      },
      {
        id: 'cmd-filter-favorites',
        group: 'filters',
        groupName: '视图筛选',
        title: '筛选：仅看收藏笔记',
        subtitle: '展示加星标注的随记',
        icon: <Heart className="w-4 h-4 text-rose-500" />,
        action: () => {
          onSetCategoryFilter('favorites');
          onShowToast('已筛选收藏随记', 'info');
        },
      },
      {
        id: 'cmd-filter-reset',
        group: 'filters',
        groupName: '视图筛选',
        title: '重置所有筛选条件',
        subtitle: '展示全部分类与随记卡片',
        icon: <Filter className="w-4 h-4 text-slate-400" />,
        action: () => {
          onResetFilters();
          onShowToast('已重置所有筛选器', 'info');
        },
      },
      {
        id: 'cmd-toggle-theme',
        group: 'settings',
        groupName: '偏好设置',
        title: theme === 'dark' ? '切换至：明亮主题 Mode' : '切换至：暗黑深色 Mode',
        subtitle: '调整应用视觉色彩体验',
        icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />,
        action: () => {
          onToggleTheme();
          onShowToast(`已切换至${theme === 'dark' ? '明亮' : '暗黑'}主题`, 'info');
        },
      },
      {
        id: 'cmd-settings',
        group: 'settings',
        groupName: '偏好设置',
        title: '打开：系统偏好设置中心',
        subtitle: '编辑器风格、备份路径与帮助导览',
        icon: <Settings className="w-4 h-4 text-indigo-500" />,
        action: () => {
          onOpenSettings();
        },
      },
      {
        id: 'cmd-export-batch',
        group: 'settings',
        groupName: '偏好设置',
        title: '全量随记导出与 JSON 备份',
        subtitle: '导出 Markdown / JSON / TXT 数据文件',
        icon: <Download className="w-4 h-4 text-blue-500" />,
        action: () => {
          onOpenExportModal();
        },
      },
      {
        id: 'cmd-sponsor',
        group: 'settings',
        groupName: '偏好设置',
        title: '赞赏与支持作者 ❤️',
        subtitle: '请作者喝杯咖啡，支持 FloveNote 开源持续迭代',
        icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />,
        action: () => {
          onOpenSponsorModal();
        },
      },
    ];

    // Filter system commands
    const filteredSysCommands = q
      ? baseCommands.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.subtitle?.toLowerCase().includes(q) ||
            c.groupName.toLowerCase().includes(q)
        )
      : baseCommands;

    // Search Notes Matching query
    const noteCommands: CommandItem[] = [];
    if (q) {
      const matchedNotes = notes
        .filter((n) => {
          const contentMatch = n.content.toLowerCase().includes(q);
          const tagMatch = n.tags.some((t) => t.toLowerCase().includes(q));
          return contentMatch || tagMatch;
        })
        .slice(0, 6);

      matchedNotes.forEach((n) => {
        const firstLine = n.content.trim().split('\n')[0].replace(/^#+\s*/, '') || '无标题随记';
        const snippet = n.content.replace(/[\r\n]+/g, ' ').substring(0, 50);

        noteCommands.push({
          id: `note-item-${n.id}`,
          group: 'notes',
          groupName: '随记搜索匹配',
          title: firstLine,
          subtitle: snippet,
          icon: <FileText className="w-4 h-4 text-emerald-500" />,
          action: () => {
            onSelectNote(n);
            onShowToast(`已打开随记: ${firstLine.substring(0, 15)}`, 'success');
          },
          badge: n.tags[0] ? `#${n.tags[0]}` : undefined,
        });
      });
    }

    return [...noteCommands, ...filteredSysCommands];
  }, [
    query,
    notes,
    onCreateNewNote,
    onSetSearchKeyword,
    onSetViewMode,
    onOpenAnalytics,
    onOpenResourceManager,
    onSetCategoryFilter,
    onResetFilters,
    theme,
    onToggleTheme,
    onOpenSettings,
    onOpenExportModal,
    onOpenSponsorModal,
    onSelectNote,
    onShowToast,
  ]);

  // Handle keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < commands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : commands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commands[selectedIndex]) {
        commands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure active index scrolls into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const activeEl = listEl.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[10vh] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="输入关键词搜索随记或执行快捷命令..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-zinc-500 bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-slate-300/40 dark:border-zinc-700/40 shrink-0">
            <span>ESC 关闭</span>
          </span>
        </div>

        {/* Command List Container */}
        <div ref={listRef} className="p-2 overflow-y-auto max-h-[60vh] space-y-1 text-xs">
          {commands.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-zinc-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700 animate-pulse" />
              <p className="font-semibold">未找到匹配的命令或随记</p>
              <p className="text-[11px]">可尝试更换搜索关键词 或 按 ESC 退出</p>
            </div>
          ) : (
            commands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const isFirstInGroup =
                idx === 0 || commands[idx - 1].group !== cmd.group;

              return (
                <React.Fragment key={cmd.id}>
                  {isFirstInGroup && (
                    <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono tracking-wider uppercase flex items-center justify-between">
                      <span>{cmd.groupName}</span>
                    </div>
                  )}

                  <div
                    data-index={idx}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800'
                        }`}
                      >
                        {cmd.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate flex items-center gap-2">
                          <span>{cmd.title}</span>
                          {cmd.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                              }`}
                            >
                              {cmd.badge}
                            </span>
                          )}
                        </div>
                        {cmd.subtitle && (
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected
                                ? 'text-indigo-100'
                                : 'text-slate-400 dark:text-zinc-500'
                            }`}
                          >
                            {cmd.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                          <span>回车执行</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/90 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="px-1 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded font-bold">↑↓</span>
              <span>切换选中</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded font-bold">↵</span>
              <span>确认</span>
            </span>
          </div>

          <span className="flex items-center gap-1">
            <Command className="w-3 h-3 text-indigo-500" />
            <span>FloveNote Quick Command Palette</span>
          </span>
        </div>
      </div>
    </div>
  );
};
