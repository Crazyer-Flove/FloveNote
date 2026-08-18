import React, { useState } from 'react';
import { Note, ExportFormat } from '../types';
import { exportNotesContent, downloadFile } from '../utils/markdownUtils';
import { Download, FileText, Code, FileCode, CheckSquare, Square, X, Upload } from 'lucide-react';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onImportBackup?: (importedNotes: Note[]) => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  notes,
  onImportBackup,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(notes.map((n) => n.id));
  const [format, setFormat] = useState<ExportFormat>('md');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAllSelected = selectedIds.length === notes.length && notes.length > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notes.map((n) => n.id));
    }
  };

  const toggleSelectNote = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = () => {
    const targetNotes = notes.filter((n) => selectedIds.includes(n.id));
    if (targetNotes.length === 0) return;

    const { filename, content, mimeType } = exportNotesContent(targetNotes, format);
    downloadFile(filename, content, mimeType);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
          onImportBackup?.(parsed);
          onClose();
        } else {
          setImportError('读取失败：JSON 备份文件格式不符合 FloveNote 数据规范');
        }
      } catch (err) {
        setImportError('JSON 解析错误：请确保选择正确的 FloveNote 备份文件');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100">批量导出与备份导入</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">勾选笔记导出为 MD、TXT、HTML 或 JSON 完整数据包</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-2">
            导出目标格式：
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'md', label: 'Markdown (.md)', icon: FileText },
              { id: 'txt', label: '纯文本 (.txt)', icon: FileCode },
              { id: 'html', label: '网页 (.html)', icon: Code },
              { id: 'json', label: '备份 (.json)', icon: Download },
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = format === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as ExportFormat)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note List Selection */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>全选 ({selectedIds.length}/{notes.length})</span>
            </button>
            <span>按最新时间排序</span>
          </div>

          {notes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
              无可用笔记
            </div>
          ) : (
            notes.map((note) => {
              const isSelected = selectedIds.includes(note.id);
              const previewText = note.content.replace(/[#*`>-]/g, '').slice(0, 60);

              return (
                <div
                  key={note.id}
                  onClick={() => toggleSelectNote(note.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-900/60'
                      : 'bg-slate-50/30 dark:bg-zinc-800/20 border-slate-200/60 dark:border-zinc-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 dark:text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 dark:text-zinc-200 line-clamp-1 font-medium">
                      {previewText || '空白笔记'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                      <span>{new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
                      {note.tags.length > 0 && (
                        <span>· {note.tags.map((t) => `#${t}`).join(' ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Restore / Import Option */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/40 flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium">
            <Upload className="w-3.5 h-3.5" />
            <span>从 JSON 备份导入恢复...</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {importError && (
            <span className="text-rose-500 text-[11px]">{importError}</span>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            已选择 {selectedIds.length} 条笔记
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出选中的笔记</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
