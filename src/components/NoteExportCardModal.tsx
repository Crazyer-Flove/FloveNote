import React, { useState, useRef } from 'react';
import { Note, CardThemeId, CodeBlockThemeId, TableThemeId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatFriendlyTime, calculateTextStats } from '../utils/markdownUtils';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  Sparkles,
  Palette,
  Check,
  Feather,
  Calendar,
  FileText,
  User,
  Loader2,
  FileCheck2,
  Type,
  Maximize2,
  Copy,
} from 'lucide-react';

interface NoteExportCardModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  codeBlockTheme?: CodeBlockThemeId;
  tableTheme?: TableThemeId;
}

interface CardThemeOption {
  id: CardThemeId;
  name: string;
  previewBg: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  badgeBg: string;
}

const CARD_THEMES: CardThemeOption[] = [
  {
    id: 'minimalist',
    name: '极简流光',
    previewBg: 'bg-stone-100 border-stone-300',
    cardBg: 'bg-white border border-stone-200/90 shadow-xl text-stone-800',
    textColor: 'text-stone-800',
    accentColor: 'text-stone-900 border-stone-800',
    badgeBg: 'bg-stone-100 text-stone-700 border border-stone-200',
  },
  {
    id: 'sunset',
    name: '日落霞光',
    previewBg: 'bg-gradient-to-r from-amber-400 to-rose-500',
    cardBg: 'bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 border border-amber-200/80 shadow-2xl text-slate-800',
    textColor: 'text-slate-800',
    accentColor: 'text-rose-600 border-rose-500',
    badgeBg: 'bg-rose-100/90 text-rose-800 border border-rose-200',
  },
  {
    id: 'midnight',
    name: '深邃夜空',
    previewBg: 'bg-zinc-900 border-zinc-700',
    cardBg: 'bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-900 text-zinc-100 border border-zinc-800 shadow-2xl',
    textColor: 'text-zinc-100',
    accentColor: 'text-indigo-400 border-indigo-500',
    badgeBg: 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60',
  },
  {
    id: 'parchment',
    name: '复古羊皮纸',
    previewBg: 'bg-amber-100 border-amber-300',
    cardBg: 'bg-[#fdf8ed] text-[#3d2f26] border border-[#e6d7c3] shadow-xl',
    textColor: 'text-[#3d2f26]',
    accentColor: 'text-[#8c5222] border-[#8c5222]',
    badgeBg: 'bg-[#f2e3d0] text-[#6e4623] border border-[#e2cfb9]',
  },
  {
    id: 'polaroid',
    name: '拍立得画框',
    previewBg: 'bg-slate-200 border-slate-400',
    cardBg: 'bg-white p-8 border-4 border-slate-100 shadow-2xl ring-1 ring-slate-200/80 text-slate-800',
    textColor: 'text-slate-800',
    accentColor: 'text-indigo-600 border-indigo-600',
    badgeBg: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
  {
    id: 'mint',
    name: '清新薄荷',
    previewBg: 'bg-emerald-100 border-emerald-300',
    cardBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 border border-emerald-200/80 shadow-xl text-teal-950',
    textColor: 'text-teal-950',
    accentColor: 'text-emerald-600 border-emerald-600',
    badgeBg: 'bg-emerald-100/90 text-emerald-800 border border-emerald-200',
  },
  {
    id: 'lavender' as any,
    name: '梦幻薰衣草',
    previewBg: 'bg-purple-200 border-purple-400',
    cardBg: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-100 border border-purple-200/80 shadow-xl text-purple-950',
    textColor: 'text-purple-950',
    accentColor: 'text-purple-600 border-purple-500',
    badgeBg: 'bg-purple-100/90 text-purple-800 border border-purple-200',
  },
];

export const NoteExportCardModal: React.FC<NoteExportCardModalProps> = ({
  note,
  isOpen,
  onClose,
  onShowToast,
  codeBlockTheme,
  tableTheme,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('minimalist');
  const [authorName, setAuthorName] = useState('FloveNote 随想');
  const [showWatermark, setShowWatermark] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [statMode, setStatMode] = useState<'cleanChars' | 'words' | 'rawLength'>('cleanChars');
  const [cardFontSize, setCardFontSize] = useState<'compact' | 'standard' | 'large'>('standard');
  const [cardWidth, setCardWidth] = useState<'standard' | 'wide'>('standard');
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'image' | 'pdf' | null>(null);
  const [customFilename, setCustomFilename] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !note) return null;

  const currentTheme = CARD_THEMES.find((t) => t.id === selectedTheme) || CARD_THEMES[0];

  // Calculate accurate plain text statistics stripping Markdown syntax
  const textStats = calculateTextStats(note.content);

  const getStatDisplayText = () => {
    if (statMode === 'words') return `${textStats.words} 词`;
    if (statMode === 'rawLength') return `${note.content.length} 字符`;
    return `${textStats.chars} 字`; // default clean characters
  };

  const prepareImagesAndRenderData = async () => {
    if (!cardRef.current) return null;

    const el = cardRef.current;

    // Pre-wait for images inside cardRef to ensure no blank or unrendered images
    const images = Array.from(el.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 2000);
            }
          })
      )
    );

    // Wait for web fonts & KaTeX layout settling
    if (document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Compute exact unclipped layout dimensions
    const exactWidth = el.scrollWidth || el.offsetWidth;
    const exactHeight = Math.max(el.scrollHeight, el.offsetHeight);

    const dataUrl = await toPng(el, {
      cacheBust: false,
      pixelRatio: 2.5, // Crisp high DPI render
      width: exactWidth,
      height: exactHeight,
      style: {
        overflow: 'visible',
        maxHeight: 'none',
        height: 'auto',
        transform: 'none',
        transition: 'none',
      },
    });

    return dataUrl;
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setExportType('image');

    try {
      const dataUrl = await prepareImagesAndRenderData();
      if (!dataUrl) return;

      const timeStr = new Date(note.createdAt).toISOString().slice(0, 10);
      const suggestedName = customFilename.trim()
        ? (customFilename.endsWith('.png') ? customFilename : `${customFilename}.png`)
        : `FloveNote_${timeStr}_${note.id.slice(0, 6)}.png`;

      // 1. Try native File System Access API if supported
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: 'PNG 图片文件 (*.png)',
                accept: { 'image/png': ['.png'] },
              },
            ],
          });
          const blob = await (await fetch(dataUrl)).blob();
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          onShowToast(`卡片图片已成功保存至您选择的路径！`, 'success');
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') return;
          console.warn('showSaveFilePicker unsupported or cancelled, fallback to direct download', pickerErr);
        }
      }

      // 2. Direct browser link download
      const link = document.createElement('a');
      link.download = suggestedName;
      link.href = dataUrl;
      link.click();

      onShowToast('精美卡片图片导出成功！', 'success');
    } catch (err) {
      console.error('Failed to export image', err);
      onShowToast('导出图片失败，请重试', 'error');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportPdf = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setExportType('pdf');

    try {
      const dataUrl = await prepareImagesAndRenderData();
      if (!dataUrl) return;

      // Get natural dimensions from image data URL
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pxWidth = img.naturalWidth;
      const pxHeight = img.naturalHeight;

      // Convert pixel dimensions to points (pt) for PDF page
      // pixelRatio is 2.5, 1 px = 0.75 pt at 96 DPI
      const ptWidth = (pxWidth * 0.75) / 2.5;
      const ptHeight = (pxHeight * 0.75) / 2.5;

      const pdf = new jsPDF({
        orientation: ptWidth > ptHeight ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [ptWidth + 32, ptHeight + 32], // exact fit card with neat padding
      });

      pdf.addImage(dataUrl, 'PNG', 16, 16, ptWidth, ptHeight);

      const timeStr = new Date(note.createdAt).toISOString().slice(0, 10);
      const pdfSuggestedName = customFilename.trim()
        ? (customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`)
        : `FloveNote_${timeStr}_${note.id.slice(0, 6)}.pdf`;

      // Try showSaveFilePicker if available
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: pdfSuggestedName,
            types: [
              {
                description: 'PDF 文档 (*.pdf)',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });
          const pdfArrayBuffer = pdf.output('arraybuffer');
          const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          onShowToast(`PDF 文件已成功保存至您选择的路径！`, 'success');
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') return;
          console.warn('File picker save failed for PDF, direct download fallback', pickerErr);
        }
      }

      // Direct PDF file download (no browser print dialog)
      pdf.save(pdfSuggestedName);
      onShowToast('高清 PDF 文档已生成并开始下载！', 'success');
    } catch (err) {
      console.error('Failed to export PDF', err);
      onShowToast('导出 PDF 失败，请重试', 'error');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setExportType('image');

    try {
      const dataUrl = await prepareImagesAndRenderData();
      if (!dataUrl) return;

      const blob = await (await fetch(dataUrl)).blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        onShowToast('卡片图片已复制到剪贴板，可直接在聊天工具中粘贴！', 'success');
      } else {
        onShowToast('当前浏览器环境暂不支持直接复制图片，请使用下载按钮', 'info');
      }
    } catch (err) {
      console.error('Failed to copy card image', err);
      onShowToast('复制图片失败，请直接下载图片', 'error');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const getFontSizeClass = () => {
    if (cardFontSize === 'compact') return 'text-xs leading-relaxed';
    if (cardFontSize === 'large') return 'text-base leading-relaxed';
    return 'text-sm leading-relaxed'; // standard
  };

  const getCardWidthClass = () => {
    if (cardWidth === 'wide') return 'max-w-xl';
    return 'max-w-lg'; // standard
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
              导出精美卡片图片 & 高清 PDF
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Controls Sidebar (Left) */}
          <div className="md:col-span-4 p-5 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 overflow-y-auto space-y-5 text-xs custom-scrollbar">
            {/* Theme Selector */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-2">
                选择卡片视觉主题：
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CARD_THEMES.map((theme) => {
                  const isSelected = theme.id === selectedTheme;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1.5 items-start text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                          {theme.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className={`w-full h-3 rounded-md ${theme.previewBg}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout & Font controls */}
            <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
              <label className="block font-medium text-slate-700 dark:text-zinc-300">
                卡片尺寸与字号：
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block mb-1">卡片宽度</span>
                  <select
                    value={cardWidth}
                    onChange={(e) => setCardWidth(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs"
                  >
                    <option value="standard">标准宽度 (520px)</option>
                    <option value="wide">宽幅展示 (640px)</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400 block mb-1">正文字号</span>
                  <select
                    value={cardFontSize}
                    onChange={(e) => setCardFontSize(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs"
                  >
                    <option value="compact">紧凑 (13px)</option>
                    <option value="standard">标准 (14px)</option>
                    <option value="large">舒展 (16px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customize Options */}
            <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
              <label className="block font-medium text-slate-700 dark:text-zinc-300">
                卡片内容与元素设置：
              </label>

              <div>
                <span className="text-slate-500 dark:text-zinc-400 block mb-1">署名 / 标题</span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="如：FloveNote 随想"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <span className="text-slate-500 dark:text-zinc-400 block mb-1">自定义文件名</span>
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="如: 每日随想笔记"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                />
              </div>

              <div>
                <span className="text-slate-500 dark:text-zinc-400 block mb-1">字数统计模式</span>
                <select
                  value={statMode}
                  onChange={(e) => setStatMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 text-xs"
                >
                  <option value="cleanChars">实际正文字数 ({textStats.chars} 字 - 已排除 Markdown 符号)</option>
                  <option value="words">总词数 ({textStats.words} 词)</option>
                  <option value="rawLength">原始字符长度 ({note.content.length} 字符)</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(e) => setShowDate(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>显示创建时间</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStats}
                    onChange={(e) => setShowStats(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>显示字数统计徽章</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTags}
                    onChange={(e) => setShowTags(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>显示笔记分类标签</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>显示 FloveNote 底部水印</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card Preview Area (Right) */}
          <div className="md:col-span-8 p-6 bg-slate-200/60 dark:bg-zinc-950 overflow-y-auto flex items-center justify-center custom-scrollbar">
            {/* The actual element captured by html-to-image */}
            <div
              ref={cardRef}
              className={`w-full ${getCardWidthClass()} p-7 rounded-2xl transition-none overflow-visible ${currentTheme.cardBg}`}
            >
              {/* Card Header Badge */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Feather className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-none">{authorName || 'FloveNote'}</div>
                    {showDate && (
                      <div className="text-[11px] opacity-75 mt-1 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(note.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {showStats && (
                  <div className={`px-3 py-1 rounded-full text-xs font-mono font-medium whitespace-nowrap break-keep shrink-0 inline-flex items-center justify-center leading-none ${currentTheme.badgeBg}`}>
                    {getStatDisplayText()}
                  </div>
                )}
              </div>

              {/* Note Content Rendered */}
              <div className={`py-2 min-h-[140px] ${getFontSizeClass()}`}>
                <MarkdownRenderer
                  content={note.content}
                  isInteractive={false}
                  codeBlockTheme={codeBlockTheme}
                  tableTheme={tableTheme}
                  className={selectedTheme === 'midnight' ? 'dark' : ''}
                />
              </div>

              {/* Note Tags if any */}
              {showTags && note.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-4 mt-4 border-t border-black/10 dark:border-white/10">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap break-keep shrink-0 inline-flex items-center gap-1 leading-none ${currentTheme.badgeBg}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Card Watermark Footer */}
              {showWatermark && (
                <div className="pt-5 mt-3 flex items-center justify-between text-[10px] opacity-65 border-t border-dashed border-black/10 dark:border-white/10 font-mono">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>记录生活与思考 · FloveNote</span>
                  </span>
                  <span>{formatFriendlyTime(note.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium"
            >
              取消
            </button>
            <button
              onClick={handleCopyImage}
              disabled={isExporting}
              className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="复制卡片图片到系统剪贴板，方便直接粘贴到微信/QQ等"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              <span>复制图片</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="直接导出并下载高清 PDF 文件"
            >
              {isExporting && exportType === 'pdf' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>正在导出 PDF...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>导出为 PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              {isExporting && exportType === 'image' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在渲染图片...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>下载精美图片</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

