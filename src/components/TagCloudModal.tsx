import React, { useState, useMemo } from 'react';
import { TagInfo, Note } from '../types';
import {
  Cloud,
  X,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
  Hash,
  Palette,
  Shuffle
} from 'lucide-react';

interface TagCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagInfo[];
  notes: Note[];
  activeTag: string | null;
  onSelectTag: (tagName: string | null) => void;
  onOpenTagManager?: () => void;
  onShowToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

type ColorSchemeId = 'indigo' | 'rainbow' | 'sunset' | 'emerald' | 'mono';
type SortMode = 'count-desc' | 'count-asc' | 'alphabetical' | 'random';

export const TagCloudModal: React.FC<TagCloudModalProps> = ({
  isOpen,
  onClose,
  tags,
  notes,
  activeTag,
  onSelectTag,
  onOpenTagManager,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [colorScheme, setColorScheme] = useState<ColorSchemeId>('rainbow');
  const [sortMode, setSortMode] = useState<SortMode>('count-desc');
  const [previewTag, setPreviewTag] = useState<string | null>(activeTag || (tags[0]?.name ?? null));
  const [randomSeed, setRandomSeed] = useState(1);
  const [copied, setCopied] = useState(false);

  // Calculate tag frequency boundaries
  const { minCount, maxCount, totalNotesWithTags, avgCount, topTag } = useMemo(() => {
    if (tags.length === 0) {
      return { minCount: 0, maxCount: 0, totalNotesWithTags: 0, avgCount: 0, topTag: null };
    }
    let min = Infinity;
    let max = 0;
    let sum = 0;
    let top = tags[0];

    for (const t of tags) {
      if (t.count < min) min = t.count;
      if (t.count > max) {
        max = t.count;
        top = t;
      }
      sum += t.count;
    }

    const uniqueTaggedNotes = new Set(
      notes.filter((n) => !n.deletedAt && n.tags && n.tags.length > 0).map((n) => n.id)
    ).size;

    return {
      minCount: min === Infinity ? 0 : min,
      maxCount: max,
      totalNotesWithTags: uniqueTaggedNotes,
      avgCount: (sum / tags.length).toFixed(1),
      topTag: top,
    };
  }, [tags, notes]);

  // Filter and sort tags
  const processedTags = useMemo(() => {
    let result = tags.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    switch (sortMode) {
      case 'count-desc':
        return [...result].sort((a, b) => b.count - a.count);
      case 'count-asc':
        return [...result].sort((a, b) => a.count - b.count);
      case 'alphabetical':
        return [...result].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      case 'random':
        // Deterministic pseudo-shuffle with seed
        return [...result].sort((a, b) => {
          const hashA = (a.name.charCodeAt(0) * 31 + randomSeed) % 100;
          const hashB = (b.name.charCodeAt(0) * 31 + randomSeed) % 100;
          return hashA - hashB;
        });
      default:
        return result;
    }
  }, [tags, searchQuery, sortMode, randomSeed]);

  // Notes under the currently previewed tag
  const previewNotes = useMemo(() => {
    if (!previewTag) return [];
    return notes
      .filter((n) => !n.deletedAt && n.tags && n.tags.includes(previewTag))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, previewTag]);

  if (!isOpen) return null;

  // Calculate dynamic typography scale & weight for a tag (font size: 12px -> 30px)
  const getTagStyle = (count: number, index: number, isSelected: boolean) => {
    const range = Math.max(1, maxCount - minCount);
    const ratio = (count - minCount) / range; // 0.0 to 1.0

    // Font size in rem or px
    const fontSize = 12 + Math.round(ratio * 16); // 12px ~ 28px
    const fontWeight = ratio > 0.6 ? 700 : ratio > 0.3 ? 600 : 500;
    const paddingX = 8 + Math.round(ratio * 10); // 8px ~ 18px
    const paddingY = 4 + Math.round(ratio * 5); // 4px ~ 9px

    // Dynamic Colors based on selected color scheme & tag index / ratio
    let bgStyle = '';
    let textColor = '';
    let borderColor = '';
    let badgeBg = '';

    if (colorScheme === 'indigo') {
      const alpha = 0.08 + ratio * 0.25;
      bgStyle = isSelected
        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
        : `bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60`;
      badgeBg = isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-200/70 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200';
    } else if (colorScheme === 'sunset') {
      bgStyle = isSelected
        ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400'
        : `bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60`;
      badgeBg = isSelected ? 'bg-amber-800 text-amber-100' : 'bg-amber-200/70 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200';
    } else if (colorScheme === 'emerald') {
      bgStyle = isSelected
        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
        : `bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60`;
      badgeBg = isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200';
    } else if (colorScheme === 'mono') {
      bgStyle = isSelected
        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700';
      badgeBg = isSelected ? 'bg-slate-700 dark:bg-zinc-300 text-slate-100 dark:text-zinc-900' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400';
    } else {
      // Rainbow palette based on hash/index
      const palettes = [
        { bg: 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60', badge: 'bg-indigo-200/70 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200' },
        { bg: 'bg-violet-50/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-800/60', badge: 'bg-violet-200/70 dark:bg-violet-900/80 text-violet-800 dark:text-violet-200' },
        { bg: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/60', badge: 'bg-sky-200/70 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200' },
        { bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60', badge: 'bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200' },
        { bg: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60', badge: 'bg-amber-200/70 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200' },
        { bg: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60', badge: 'bg-rose-200/70 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200' },
        { bg: 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800/60', badge: 'bg-teal-200/70 dark:bg-teal-900/80 text-teal-800 dark:text-teal-200' },
      ];
      const p = palettes[index % palettes.length];
      bgStyle = isSelected
        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
        : `${p.bg} hover:brightness-95 dark:hover:brightness-110`;
      badgeBg = isSelected ? 'bg-indigo-800 text-indigo-100' : p.badge;
    }

    return {
      fontSize: `${fontSize}px`,
      fontWeight,
      padding: `${paddingY}px ${paddingX}px`,
      bgStyle,
      badgeBg,
      ratio,
    };
  };

  const handleCopyTags = () => {
    const text = tags.map((t) => `#${t.name} (${t.count})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onShowToast) onShowToast('已复制全部标签清单至剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyFilterAndClose = (tagName: string) => {
    onSelectTag(tagName);
    onClose();
    if (onShowToast) onShowToast(`已过滤展示标签: #${tagName}`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-5xl w-full border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  标签云全景图 (Tag Cloud)
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                  {tags.length} 个独立标签
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                标签字体与尺寸直观映射笔记关联频率，点击可即时预览与快速定位
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTagManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTagManager();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="打开标签合并/重命名管理面板"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">标签管理</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyTags}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
              title="复制全部标签文本列表"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? '已复制' : '复制清单'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="px-6 py-2.5 bg-slate-50/80 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>覆盖打标笔记: <strong>{totalNotesWithTags}</strong> 篇</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>最高频标签: <strong className="text-slate-800 dark:text-zinc-200">#{topTag?.name || '无'}</strong> ({topTag?.count || 0}次)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>平均频次: <strong>{avgCount}</strong> 次/标签</span>
            </span>
          </div>

          {/* Color Palette Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            {(
              [
                { id: 'rainbow', name: '多彩' },
                { id: 'indigo', name: '经典紫' },
                { id: 'emerald', name: '翠绿' },
                { id: 'sunset', name: '暖橙' },
                { id: 'mono', name: '极简' },
              ] as const
            ).map((scheme) => (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setColorScheme(scheme.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  colorScheme === scheme.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'
                }`}
              >
                {scheme.name}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: Search, Sort & Shuffle */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索筛选标签名称..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-zinc-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px] font-medium mr-1">排序:</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="count-desc">频率从高到低</option>
                <option value="count-asc">频率从低到高</option>
                <option value="alphabetical">拼音/字母 A-Z</option>
                <option value="random">随机云混排布局</option>
              </select>
            </div>

            {sortMode === 'random' && (
              <button
                type="button"
                onClick={() => setRandomSeed((prev) => prev + 1)}
                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors"
                title="重新洗牌云布局"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area: Left Tag Cloud Canvas + Right Note Preview */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Tag Cloud Canvas */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-wrap content-start items-center justify-center gap-2.5 sm:gap-3.5 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/40 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950/60 custom-scrollbar">
            {processedTags.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Hash className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                  {searchQuery ? '未找到匹配的标签' : '暂无可用标签'}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  在笔记正文中输入 #标签名（如 #工作/周报、#灵感）即可自动生成
                </p>
              </div>
            ) : (
              processedTags.map((tagObj, idx) => {
                const isPreview = previewTag === tagObj.name;
                const isMainActive = activeTag === tagObj.name;
                const style = getTagStyle(tagObj.count, idx, isPreview);

                return (
                  <button
                    key={tagObj.name}
                    type="button"
                    onClick={() => setPreviewTag(tagObj.name)}
                    onDoubleClick={() => handleApplyFilterAndClose(tagObj.name)}
                    style={{
                      fontSize: style.fontSize,
                      fontWeight: style.fontWeight,
                      padding: style.padding,
                    }}
                    className={`group inline-flex items-center gap-1.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-2xs hover:scale-105 hover:shadow-md ${style.bgStyle}`}
                    title={`#${tagObj.name} (关联 ${tagObj.count} 篇笔记)\n单击右侧预览，双击直接在主界面过滤`}
                  >
                    <Hash className="w-[0.8em] h-[0.8em] opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="tracking-tight">{tagObj.name}</span>
                    <span
                      className={`text-[0.65em] font-mono font-bold px-1.5 py-0.2 rounded-full transition-colors ${style.badgeBg}`}
                    >
                      {tagObj.count}
                    </span>
                    {isMainActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="当前主界面筛选中" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right/Bottom Note Preview Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 flex flex-col shrink-0 max-h-64 md:max-h-none overflow-hidden">
            {previewTag ? (
              <>
                <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900/60">
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-zinc-100 text-xs">
                      <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">#{previewTag}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      共关联 {previewNotes.length} 篇笔记
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyFilterAndClose(previewTag)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-2xs transition-all flex items-center gap-1 shrink-0 active:scale-98"
                  >
                    <span>跳转筛选</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Preview Note Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {previewNotes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">该标签暂无关联笔记</p>
                  ) : (
                    previewNotes.map((note) => {
                      const firstLine = note.content.trim().split('\n')[0].replace(/^[#\s*->]+/, '') || '无标题笔记';
                      const snippet = note.content.trim().split('\n').slice(1).join(' ').slice(0, 75);
                      return (
                        <div
                          key={note.id}
                          onClick={() => handleApplyFilterAndClose(previewTag)}
                          className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                        >
                          <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                            <span className="truncate">{firstLine}</span>
                          </h5>
                          {snippet && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                              {snippet}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{new Date(note.updatedAt).toLocaleDateString('zh-CN')}</span>
                            </span>
                            <span className="text-indigo-500 font-medium group-hover:underline">
                              查看笔记 →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-600 space-y-2">
                <Sparkles className="w-8 h-8 opacity-40" />
                <p className="text-xs">点击左侧任意标签卡片即可在此处预览关联的笔记列表</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & close */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 shrink-0">
          <span>💡 提示：双击标签卡片可直接跳转至主时间线筛选该标签</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold rounded-xl transition-colors text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
