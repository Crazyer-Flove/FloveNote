import React, { useState, useRef, useEffect } from 'react';
import { TagInfo, ViewCategory, ThemeMode, Note, Workspace } from '../types';
import {
  Pin,
  Star,
  Hash,
  Download,
  Sun,
  Moon,
  Layers,
  SlidersHorizontal,
  X,
  Feather,
  PanelLeftClose,
  PanelLeft,
  Settings,
  FolderKanban,
  BookOpen,
  Flame,
  Sparkles,
  Heart,
  Command,
  Trash2,
  ChevronDown,
  Plus,
  Check,
  Folder,
  Cloud,
  List,
  Maximize2,
} from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  tags: TagInfo[];
  activeCategory: ViewCategory;
  activeTag: string | null;
  totalNotesCount: number;
  pinnedNotesCount: number;
  favoriteNotesCount: number;
  trashNotesCount?: number;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  theme: ThemeMode;
  showStatsCard?: boolean;
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string | null) => void;
  onSelectCategory: (category: ViewCategory) => void;
  onSelectTag: (tag: string | null) => void;
  onSelectWorkspace?: (workspaceId: string) => void;
  onOpenWorkspacesManager?: () => void;
  onOpenTagManager: () => void;
  onOpenTagCloud?: () => void;
  onOpenAnalyticsModal?: () => void;
  onOpenExportModal: () => void;
  onOpenResourceManager?: () => void;
  onOpenSettings: () => void;
  onOpenSponsorModal?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleTheme: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onAddTagToNote?: (noteId: string, tagName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  tags,
  activeCategory,
  activeTag,
  totalNotesCount,
  pinnedNotesCount,
  favoriteNotesCount,
  trashNotesCount = 0,
  workspaces = [],
  activeWorkspaceId = 'default',
  theme,
  showStatsCard = true,
  selectedDate,
  onSelectDate,
  onSelectCategory,
  onSelectTag,
  onSelectWorkspace,
  onOpenWorkspacesManager,
  onOpenTagManager,
  onOpenTagCloud,
  onOpenAnalyticsModal,
  onOpenExportModal,
  onOpenResourceManager,
  onOpenSettings,
  onOpenSponsorModal,
  onOpenCommandPalette,
  onToggleTheme,
  isMobileOpen,
  onCloseMobile,
  onAddTagToNote,
}) => {
  const [dragOverTag, setDragOverTag] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [tagViewMode, setTagViewMode] = useState<'list' | 'cloud'>('list');
  const resizeRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Handle Drag resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(420, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const content = (
    <div
      style={{ width: isCollapsed ? 64 : width }}
      className="relative flex flex-col h-full bg-slate-50 dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 p-2.5 shrink-0 transition-all duration-200 ease-in-out select-none"
    >
      {/* Brand Header & Expand/Collapse Toggle */}
      <div className="flex items-center justify-between px-1 py-1.5 mb-3 border-b border-slate-200/60 dark:border-zinc-800 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Feather className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="truncate">
              <h1 className="font-sans font-bold text-sm text-slate-900 dark:text-zinc-50 tracking-tight truncate">
                FloveNote
              </h1>
              <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase font-mono truncate">
                极简 Markdown 笔记
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Feather className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
        )}

        {/* Expand / Collapse Button (Desktop) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors ${
            isCollapsed ? 'absolute -right-3 top-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-md text-indigo-500 z-30' : ''
          }`}
          title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Workspace Selector Dropdown */}
      <div className="relative mb-3 shrink-0">
        <button
          type="button"
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800/80 border border-slate-200/90 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 shadow-2xs hover:border-indigo-300 dark:hover:border-zinc-600 transition-all`}
          title={`当前工作区: ${activeWorkspace?.name || '默认工作区'}`}
        >
          <div className="flex items-center gap-2 truncate">
            <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
            {!isCollapsed && (
              <span className="truncate font-bold">{activeWorkspace?.name || '默认工作区'}</span>
            )}
          </div>
          {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </button>

        {/* Workspace Quick Switcher Menu Popup */}
        {showWorkspaceMenu && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 min-w-[200px] animate-fadeIn"
            onMouseLeave={() => setShowWorkspaceMenu(false)}
          >
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              本地工作区列表
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const wsNotesCount = notes.filter((n) => !n.deletedAt && (n.workspaceId === ws.id || (!n.workspaceId && ws.id === 'default'))).length;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      onSelectWorkspace?.(ws.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <div className="truncate leading-tight">{ws.name}</div>
                        <div className="text-[10px] opacity-60 truncate font-mono">{ws.path}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] bg-slate-200/60 dark:bg-zinc-800 px-1.5 py-0.2 rounded-full font-mono">
                        {wsNotesCount}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 my-1" />

            <button
              type="button"
              onClick={() => {
                setShowWorkspaceMenu(false);
                onOpenWorkspacesManager?.();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-left transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>选择文件夹 / 管理工作区</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Categories List */}
      <div className="space-y-1 mb-3 shrink-0">
        <button
          onClick={() => {
            onSelectCategory('all');
            onSelectTag(null);
            if (onSelectDate) onSelectDate(null);
            onCloseMobile();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs font-medium transition-colors ${
            activeCategory === 'all' && !activeTag
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold'
              : 'hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          }`}
          title="全部笔记"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
            {!isCollapsed && <span>全部笔记</span>}
          </div>
          {!isCollapsed ? (
            <span className="text-[10px] bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-mono">
              {totalNotesCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => {
            onSelectCategory('pinned');
            onSelectTag(null);
            onCloseMobile();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs font-medium transition-colors ${
            activeCategory === 'pinned'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold'
              : 'hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          }`}
          title="置顶笔记"
        >
          <div className="flex items-center gap-2.5">
            <Pin className="w-4 h-4 text-amber-500 shrink-0" />
            {!isCollapsed && <span>置顶笔记</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-mono">
              {pinnedNotesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            onSelectCategory('favorites');
            onSelectTag(null);
            onCloseMobile();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs font-medium transition-colors ${
            activeCategory === 'favorites'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold'
              : 'hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          }`}
          title="收藏笔记"
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-rose-500 shrink-0" />
            {!isCollapsed && <span>收藏笔记</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-mono">
              {favoriteNotesCount}
            </span>
          )}
        </button>

        {/* Trash / Recycle Bin Category */}
        <button
          onClick={() => {
            onSelectCategory('trash');
            onSelectTag(null);
            onCloseMobile();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs font-medium transition-colors ${
            activeCategory === 'trash'
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-semibold'
              : 'hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          }`}
          title="回收站 (保留 7 天)"
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
            {!isCollapsed && <span>回收站</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-mono">
              {trashNotesCount}
            </span>
          )}
        </button>
      </div>

      {/* Tags List & Cloud View */}
      <div className="flex-1 min-h-0 flex flex-col mb-2 overflow-hidden">
        <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
          {!isCollapsed ? (
            <>
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                <span>标签 ({tags.length})</span>
              </span>
              <div className="flex items-center gap-1">
                {/* View Mode Toggle: List vs Cloud */}
                {tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTagViewMode(tagViewMode === 'list' ? 'cloud' : 'list')}
                    className={`p-1 rounded-lg transition-colors ${
                      tagViewMode === 'cloud'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                    }`}
                    title={tagViewMode === 'list' ? '切换为侧边栏标签云视图' : '切换为列表视图'}
                  >
                    {tagViewMode === 'list' ? <Cloud className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Open Full Tag Cloud Modal */}
                {onOpenTagCloud && (
                  <button
                    type="button"
                    onClick={onOpenTagCloud}
                    className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="展开标签云全景图"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Tag Manager Button */}
                <button
                  type="button"
                  onClick={onOpenTagManager}
                  className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="管理合并标签"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenTagCloud || onOpenTagManager}
              className="mx-auto p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg"
              title="标签云/标签列表"
            >
              <Hash className="w-4 h-4 text-indigo-500" />
            </button>
          )}
        </div>

        {/* Scrollable Tag Area */}
        <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
          {tags.length === 0 ? (
            !isCollapsed && (
              <p className="px-2 py-4 text-xs text-slate-400 dark:text-zinc-600 italic text-center">
                暂无标签 (正文中写 #标签 自动提取)
              </p>
            )
          ) : tagViewMode === 'cloud' && !isCollapsed ? (
            /* Sidebar Tag Cloud Mode (Tags sized by frequency) */
            <div className="flex flex-wrap content-start items-center gap-1.5 p-1">
              {(() => {
                const max = Math.max(...tags.map((t) => t.count), 1);
                const min = Math.min(...tags.map((t) => t.count), 1);
                const range = Math.max(1, max - min);

                return tags.map((tagObj) => {
                  const isSelected = activeTag === tagObj.name;
                  const isDragHover = dragOverTag === tagObj.name;
                  const ratio = (tagObj.count - min) / range;
                  const fontSize = 11 + Math.round(ratio * 5); // 11px ~ 16px
                  const fontWeight = ratio > 0.5 ? 700 : ratio > 0.2 ? 600 : 500;

                  return (
                    <button
                      key={tagObj.name}
                      onClick={() => {
                        onSelectTag(isSelected ? null : tagObj.name);
                        onCloseMobile();
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        if (dragOverTag !== tagObj.name) setDragOverTag(tagObj.name);
                      }}
                      onDragLeave={() => {
                        if (dragOverTag === tagObj.name) setDragOverTag(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverTag(null);
                        const noteId = e.dataTransfer.getData('text/plain');
                        if (noteId && onAddTagToNote) {
                          onAddTagToNote(noteId, tagObj.name);
                        }
                      }}
                      style={{ fontSize: `${fontSize}px`, fontWeight }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl transition-all select-none border ${
                        isDragHover
                          ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500 scale-105 shadow-sm'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-1 ring-indigo-400'
                          : 'bg-white/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200'
                      }`}
                      title={`#${tagObj.name} (关联 ${tagObj.count} 篇笔记)`}
                    >
                      <Hash className="w-3 h-3 opacity-60 shrink-0" />
                      <span className="truncate max-w-[120px]">{tagObj.name}</span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        {tagObj.count}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          ) : (
            /* Sidebar Tag List Mode */
            <div className="space-y-1">
              {tags.map((tagObj) => {
                const isSelected = activeTag === tagObj.name;
                const isDragHover = dragOverTag === tagObj.name;
                return (
                  <button
                    key={tagObj.name}
                    onClick={() => {
                      onSelectTag(isSelected ? null : tagObj.name);
                      onCloseMobile();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      if (dragOverTag !== tagObj.name) setDragOverTag(tagObj.name);
                    }}
                    onDragLeave={() => {
                      if (dragOverTag === tagObj.name) setDragOverTag(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverTag(null);
                      const noteId = e.dataTransfer.getData('text/plain');
                      if (noteId && onAddTagToNote) {
                        onAddTagToNote(noteId, tagObj.name);
                      }
                    }}
                    className={`w-full flex items-center justify-between ${
                      isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-1.5'
                    } rounded-xl text-xs transition-all ${
                      isDragHover
                        ? 'bg-indigo-100 dark:bg-indigo-900/80 ring-2 ring-indigo-500 scale-[1.02] shadow-md font-bold text-indigo-700 dark:text-indigo-200'
                        : isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-400'
                    }`}
                    title={isCollapsed ? `#${tagObj.name} (${tagObj.count})` : "可拖拽笔记卡片到此标签上快速打标签"}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDragHover ? 'text-indigo-600 dark:text-indigo-300 animate-bounce' : 'text-indigo-500'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{tagObj.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono ml-2">
                        {isDragHover ? '松开打标签' : tagObj.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls: Settings, Sponsor Author & Theme Switch */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-1 shrink-0">
        {/* Sponsor Author */}
        {onOpenSponsorModal && (
          <button
            onClick={() => {
              onOpenSponsorModal();
              onCloseMobile();
            }}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
            } text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors border border-rose-200/50 dark:border-rose-900/40`}
            title="赞赏作者，支持软件开源持续迭代"
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 shrink-0 animate-pulse" />
            {!isCollapsed && <span>赞赏作者 ❤️</span>}
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2.5'
          } text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl transition-colors`}
          title="系统偏好设置"
        >
          <Settings className="w-4 h-4 text-indigo-500 shrink-0" />
          {!isCollapsed && <span>系统设置</span>}
        </button>


      </div>

      {/* Resizable handle on desktop */}
      {!isCollapsed && (
        <div
          ref={resizeRef}
          onMouseDown={() => setIsResizing(true)}
          onDoubleClick={() => setWidth(260)}
          className="hidden md:block absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-600/60 transition-colors z-20"
          title="按住拖拽调整侧边栏宽度，双击恢复默认宽度"
        />
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0">{content}</div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full animate-slideRight">{content}</div>
        </div>
      )}
    </>
  );
};
