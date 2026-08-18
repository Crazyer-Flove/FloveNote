import React, { useState } from 'react';
import { AppSettings, ThemeMode, Note, ExportFormat, Workspace } from '../types';
import { ContributionHeatmap } from './ContributionHeatmap';
import { exportNotesContent, downloadFile, formatFriendlyTime } from '../utils/markdownUtils';
import { SAMPLE_CASE_DOCUMENTS, CaseDocumentItem } from '../utils/caseDocuments';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  X,
  Settings,
  Sliders,
  BarChart2,
  Sun,
  Moon,
  Check,
  Folder,
  HardDrive,
  FolderOpen,
  Download,
  Upload,
  Type,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  Flame,
  HelpCircle,
  BookOpen,
  Play,
  Trash2,
  FolderKanban,
  RotateCcw,
  Plus,
  Monitor,
  Laptop,
  AlertTriangle,
  FolderPlus,
  Copy,
  FileCheck2,
  Bookmark,
  ChevronRight,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { OnboardingHelpModal } from './OnboardingHelpModal';

interface SettingsModalProps {
  settings: AppSettings;
  notes?: Note[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onClose: () => void;
  onResetSampleData: () => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onExportBackup?: () => void;
  onImportBackup?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectDateFilter?: (date: string | null) => void;
  onRestoreNote?: (id: string) => void;
  onPermanentDeleteNote?: (id: string) => void;
  onEmptyTrash?: () => void;
  onSwitchWorkspace?: (id: string) => void;
  onAddWorkspace?: (ws: Workspace) => void;
  onDeleteWorkspace?: (id: string) => void;
  onImportCaseDocument?: (item: CaseDocumentItem) => void;
  onImportAllCaseDocuments?: () => void;
  initialTab?: 'editor' | 'analytics' | 'batch_export' | 'appearance' | 'paths' | 'workspaces' | 'trash' | 'help';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  notes = [],
  onUpdateSettings,
  theme,
  onToggleTheme,
  onClose,
  onResetSampleData,
  onShowToast,
  onExportBackup,
  onImportBackup,
  onSelectDateFilter,
  onRestoreNote,
  onPermanentDeleteNote,
  onEmptyTrash,
  onSwitchWorkspace,
  onAddWorkspace,
  onDeleteWorkspace,
  onImportCaseDocument,
  onImportAllCaseDocuments,
  initialTab = 'editor',
}) => {
  const [activeTab, setActiveTab] = useState<
    'editor' | 'analytics' | 'batch_export' | 'appearance' | 'paths' | 'workspaces' | 'trash' | 'help'
  >(initialTab);
  const [showHelpTour, setShowHelpTour] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(SAMPLE_CASE_DOCUMENTS[0].id);

  // New Workspace Input state
  const [newWsName, setNewWsName] = useState('');
  const [newWsPath, setNewWsPath] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isAddingWs, setIsAddingWs] = useState(false);

  // Trash Notes
  const trashNotes = notes.filter((n) => Boolean(n.deletedAt));

  // Storage Paths state
  const [storagePath, setStoragePath] = useState(settings.storagePath || '~/Documents/FloveNote/Notes');
  const [mediaStoragePath, setMediaStoragePath] = useState(settings.mediaStoragePath || '~/Documents/FloveNote/Assets');
  const [backupPath, setBackupPath] = useState(settings.backupPath || '~/Documents/FloveNote/Backups');

  // Directory picker helper
  const handlePickLocalFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          const path = `~/Documents/${dirHandle.name}`;
          setNewWsPath(path);
          if (!newWsName) setNewWsName(dirHandle.name);
          onShowToast(`已选择本地文件夹: ${dirHandle.name}`, 'success');
        }
      } else {
        onShowToast('浏览器不支持原生文件夹选择器，可手动输入本地文件夹路径', 'info');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onShowToast('选择文件夹失败或取消', 'info');
      }
    }
  };

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) {
      onShowToast('请填写工作区名称', 'error');
      return;
    }
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name: newWsName.trim(),
      path: newWsPath.trim() || `~/Documents/FloveNote/${newWsName.trim()}`,
      description: newWsDesc.trim() || '自定义本地文件工作区',
      createdAt: Date.now(),
    };

    const currentWorkspaces = settings.workspaces || [];
    const updatedWorkspaces = [...currentWorkspaces, ws];

    onUpdateSettings({
      ...settings,
      workspaces: updatedWorkspaces,
      activeWorkspaceId: ws.id,
    });

    if (onAddWorkspace) onAddWorkspace(ws);
    if (onSwitchWorkspace) onSwitchWorkspace(ws.id);

    setNewWsName('');
    setNewWsPath('');
    setNewWsDesc('');
    setIsAddingWs(false);
    onShowToast(`工作区 "${ws.name}" 创建成功并已自动切换！`, 'success');
  };

  // Batch Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('md');
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set(notes.map((n) => n.id)));

  const handleSavePaths = () => {
    onUpdateSettings({
      ...settings,
      storagePath,
      mediaStoragePath,
      backupPath,
    });
    onShowToast('默认保存路径已成功更新！', 'success');
  };

  const handleResetPaths = () => {
    const defaultNotes = '~/Documents/FloveNote/Notes';
    const defaultMedia = '~/Documents/FloveNote/Assets';
    const defaultBackup = '~/Documents/FloveNote/Backups';
    setStoragePath(defaultNotes);
    setMediaStoragePath(defaultMedia);
    setBackupPath(defaultBackup);
    onUpdateSettings({
      ...settings,
      storagePath: defaultNotes,
      mediaStoragePath: defaultMedia,
      backupPath: defaultBackup,
    });
    onShowToast('已恢复默认保存路径', 'info');
  };

  // Batch Export execution
  const handleExecuteBatchExport = () => {
    const notesToExport = notes.filter((n) => selectedNoteIds.has(n.id));
    if (notesToExport.length === 0) {
      onShowToast('请至少选择一条笔记进行导出', 'info');
      return;
    }
    const result = exportNotesContent(notesToExport, exportFormat);
    downloadFile(result.filename, result.content, result.mimeType);
    onShowToast(`成功批量导出 ${notesToExport.length} 条笔记！`, 'success');
  };

  const toggleSelectAllExportNotes = () => {
    if (selectedNoteIds.size === notes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(notes.map((n) => n.id)));
    }
  };

  const toggleSelectNoteForExport = (id: string) => {
    const updated = new Set(selectedNoteIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedNoteIds(updated);
  };

  // Compute statistics
  const totalNotes = notes.length;
  const totalWords = notes.reduce((acc, n) => acc + n.content.trim().length, 0);
  const totalTags = new Set(notes.flatMap((n) => n.tags)).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-zinc-100 font-bold text-base">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
              <Settings className="w-5 h-5" />
            </div>
            <span>系统设置中心</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content (Left Sidebar + Right Tab Panel) */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Vertical Navigation Sidebar */}
          <div className="w-full sm:w-60 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50 p-3 flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-y-auto text-xs custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>编辑器偏好</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                <span>创作热力图与统计</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('batch_export')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'batch_export'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>批量导出</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'appearance'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="w-4 h-4 text-violet-500 shrink-0" />
                <span>界面与外观</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workspaces')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'workspaces'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-blue-500 shrink-0" />
                <span>本地工作区</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'trash'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>回收站</span>
              </div>
              {trashNotes.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'trash'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {trashNotes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paths')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'paths'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                <span>保存路径与备份</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium flex items-center justify-between gap-2.5 transition-all text-xs text-left shrink-0 ${
                activeTab === 'help'
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>帮助与新手引导</span>
              </div>
            </button>
          </div>

          {/* Right Tab Body Content Panel */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-700 dark:text-zinc-300 custom-scrollbar">
          {/* TAB 1: Editor Preferences */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Typora 所见即所得书写体验说明</span>
                </h4>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                  编辑器已全面升级为无缝 Typora 所见即所得模式。当编写 Markdown 标题、列表、加粗、代码块等语法时，按下 Enter 换行或切行即可自动渲染为精致展示排版，再次点击对应段落即可展开源码即时编辑。
                </p>
              </div>

              {/* Editor Font Size Adjustment */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">编辑器正文字号</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">调整输入正文时的基础字号呈现</p>
                </div>
                <select
                  value={settings.editorFontSize || 'base'}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      editorFontSize: e.target.value as 'sm' | 'base' | 'lg' | 'xl',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sm">小号 (14px)</option>
                  <option value="base">标准 (16px - 推荐)</option>
                  <option value="lg">大号 (18px)</option>
                  <option value="xl">特大号 (20px)</option>
                </select>
              </div>

              {/* Auto Save Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">自动保存功能</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">停止输入后自动将修改写回本地卡片</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      autoSaveEnabled: !(settings.autoSaveEnabled ?? true),
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.autoSaveEnabled ?? true ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.autoSaveEnabled ?? true ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Save Delay */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">自动保存防抖间隔</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">停止打字后写回本地的等待时长</p>
                </div>
                <select
                  value={settings.autoSaveDelay}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      autoSaveDelay: Number(e.target.value),
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1000}>1 秒（实时极速）</option>
                  <option value={2000}>2 秒（标准推荐）</option>
                  <option value={5000}>5 秒（流畅稳健）</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Contribution Heatmap & Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              {/* Heatmap Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>创作热力图 (Contribution Heatmap)</span>
                </h4>
                <ContributionHeatmap notes={notes} onSelectDate={onSelectDateFilter} />
              </div>

              {/* Statistics Overview Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">笔记总条数</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalNotes}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">全站总字数</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalWords}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">活跃标签数</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalTags}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Batch Export */}
          {activeTab === 'batch_export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">选择批量导出目标格式</h4>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">将多条笔记合并打包导出为对应文件</p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs">
                    {(['md', 'txt', 'html', 'json'] as ExportFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`px-3 py-1.5 rounded-lg uppercase font-mono font-bold transition-colors ${
                          exportFormat === fmt
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-xs">
                  <button
                    onClick={toggleSelectAllExportNotes}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    {selectedNoteIds.size === notes.length ? '取消全选' : '全选所有笔记 (' + notes.length + ' 条)'}
                  </button>

                  <span className="text-slate-500 dark:text-zinc-400">
                    已勾选 <strong className="text-indigo-600 dark:text-indigo-400">{selectedNoteIds.size}</strong> / {notes.length} 条笔记
                  </span>
                </div>

                {/* Note selection checklist */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notes.map((n) => (
                    <label
                      key={n.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNoteIds.has(n.id)}
                        onChange={() => toggleSelectNoteForExport(n.id)}
                        className="w-4 h-4 rounded-md text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="font-mono text-slate-400 shrink-0">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                      <span className="truncate flex-1 font-medium text-slate-800 dark:text-zinc-200">
                        {n.content.slice(0, 50).replace(/\n/g, ' ')}...
                      </span>
                    </label>
                  ))}
                </div>

                {/* Export execute button */}
                <button
                  type="button"
                  onClick={handleExecuteBatchExport}
                  disabled={selectedNoteIds.size === 0}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>导出所选 ({selectedNoteIds.size}) 条笔记为 .{exportFormat.toUpperCase()}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Appearance & Theme */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Dark / Light / System Theme Options */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 space-y-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">系统外观主题模式</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    当前处于：{theme === 'dark' ? '深色夜间模式 (Dark)' : '亮色白昼模式 (Light)'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ ...settings, themeMode: 'light' });
                      if (theme === 'dark') onToggleTheme();
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                      (settings.themeMode || 'light') === 'light' && theme === 'light'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span>☀️ 亮色白昼</span>
                  </button>

                  {/* Dark */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ ...settings, themeMode: 'dark' });
                      if (theme === 'light') onToggleTheme();
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                      (settings.themeMode || 'light') === 'dark' || theme === 'dark'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span>🌙 经典夜间</span>
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ ...settings, themeMode: 'system' });
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if ((prefersDark && theme !== 'dark') || (!prefersDark && theme !== 'light')) {
                        onToggleTheme();
                      }
                      onShowToast('已设置为跟随系统主题', 'info');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                      settings.themeMode === 'system'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-sky-500" />
                    <span>💻 跟随系统</span>
                  </button>
                </div>
              </div>

              {/* Font Family Selection */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">界面排版字体 (Font Family)</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">选择全局笔记与卡片呈现字体</p>
                </div>
                <select
                  value={settings.fontFamily || 'sans'}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      fontFamily: e.target.value as 'sans' | 'serif' | 'mono',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sans">现代无衬线 (Sans-Serif)</option>
                  <option value="serif">优雅衬线体 (Serif)</option>
                  <option value="mono">极客等宽体 (Monospace)</option>
                </select>
              </div>

              {/* Code Block Style Theme */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 space-y-2">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">默认代码块样式 (Code Block Theme)</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">设置 Markdown 代码块渲染的外观风格 (带 macOS 红黄绿小圆点)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {(
                    [
                      ['dark-mac', 'macOS 暗黑', 'bg-zinc-900 text-zinc-100 border-zinc-800'],
                      ['light-mac', 'macOS 纯白', 'bg-slate-100 text-slate-800 border-slate-300'],
                      ['dracula', 'Dracula 经典', 'bg-[#282a36] text-purple-300 border-purple-900/60'],
                      ['monokai', 'Monokai 复古', 'bg-[#272822] text-amber-400 border-amber-900/60'],
                      ['nord', 'Nord 极光北欧', 'bg-[#2e3440] text-sky-300 border-slate-700'],
                    ] as const
                  ).map(([cId, cLabel, cStyle]) => {
                    const isSelected = (settings.codeBlockTheme || 'light-mac') === cId;
                    return (
                      <button
                        key={cId}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            codeBlockTheme: cId,
                          })
                        }
                        className={`p-2.5 rounded-xl text-left border flex items-center justify-between text-xs font-semibold transition-all ${cStyle} ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span>{cLabel}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table Theme Selector */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 space-y-2">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">默认表格排版主题 (Markdown Table Theme)</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">设置 Markdown 数据表格预设渲染主题</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {(
                    [
                      ['modern-indigo', '靛蓝渐变', 'bg-indigo-600 text-white'],
                      ['zebra-stripe', '斑马交替纹', 'bg-slate-700 text-slate-100'],
                      ['minimal-dark', '简约极客黑', 'bg-zinc-950 text-indigo-400'],
                      ['border-light', '网格边框', 'bg-slate-200 text-slate-800'],
                      ['emerald-fresh', '翡绿高雅', 'bg-emerald-600 text-white'],
                      ['amber-warm', '琥珀暖调', 'bg-amber-500 text-white'],
                    ] as const
                  ).map(([tId, tLabel, tStyle]) => {
                    const isSelected = (settings.tableTheme || 'modern-indigo') === tId;
                    return (
                      <button
                        key={tId}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            tableTheme: tId,
                          })
                        }
                        className={`p-2.5 rounded-xl text-left border border-slate-200 dark:border-zinc-700 flex items-center justify-between text-xs font-semibold transition-all ${tStyle} ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span>{tLabel}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats Card Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">侧边栏展示每周创作曲线</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">在侧边栏顶部展示每周卡片生成动态</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      showStatsCard: !settings.showStatsCard,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.showStatsCard ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.showStatsCard ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB: Workspaces / Local Resource Manager */}
          {activeTab === 'workspaces' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-indigo-500" />
                  <span>本地文件夹工作区说明</span>
                </h4>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                  你可以关联不同的本地文件夹作为独立工作区（例如：工作笔记、个人日记、项目灵感）。切换工作区后将实时加载呈现对应工作区的笔记内容。
                </p>
              </div>

              {/* Add New Workspace Form */}
              {!isAddingWs ? (
                <button
                  type="button"
                  onClick={() => setIsAddingWs(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-98"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>选择本地文件夹 / 添加新工作区</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-700">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-indigo-500" />
                      <span>添加关联工作区</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingWs(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                        工作区名称 *
                      </label>
                      <input
                        type="text"
                        value={newWsName}
                        onChange={(e) => setNewWsName(e.target.value)}
                        placeholder="例如: 🚀 架构设计灵感 / 📔 个人思考"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                        本地文件夹路径
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWsPath}
                          onChange={(e) => setNewWsPath(e.target.value)}
                          placeholder="~/Documents/FloveNote/Work"
                          className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handlePickLocalFolder}
                          className="px-3 py-2 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span>选择目录</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                        简短说明 (可选)
                      </label>
                      <input
                        type="text"
                        value={newWsDesc}
                        onChange={(e) => setNewWsDesc(e.target.value)}
                        placeholder="例如: 专门存储项目架构与思路日记"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingWs(false)}
                      className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateWorkspace}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-2xs transition-colors"
                    >
                      保存并切换
                    </button>
                  </div>
                </div>
              )}

              {/* Workspaces List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  已关联的工作区列表 ({(settings.workspaces || []).length})
                </h4>

                <div className="space-y-2">
                  {(settings.workspaces || []).map((ws) => {
                    const isActive = (settings.activeWorkspaceId || 'default') === ws.id;
                    const wsNotesCount = notes.filter(
                      (n) => !n.deletedAt && (n.workspaceId === ws.id || (!n.workspaceId && ws.id === 'default'))
                    ).length;

                    return (
                      <div
                        key={ws.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                            <Folder className="w-4 h-4" />
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs">
                                {ws.name}
                              </span>
                              {isActive && (
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                                  当前使用中
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                              {ws.path}
                            </p>
                            {ws.description && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                {ws.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                            {wsNotesCount} 条笔记
                          </span>

                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ ...settings, activeWorkspaceId: ws.id });
                                if (onSwitchWorkspace) onSwitchWorkspace(ws.id);
                                onShowToast(`已成功切换至工作区: ${ws.name}`, 'success');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-xl transition-colors"
                            >
                              切换
                            </button>
                          ) : null}

                          {ws.id !== 'default' && (
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = (settings.workspaces || []).filter((w) => w.id !== ws.id);
                                const nextActive = isActive ? 'default' : settings.activeWorkspaceId;
                                onUpdateSettings({
                                  ...settings,
                                  workspaces: filtered,
                                  activeWorkspaceId: nextActive,
                                });
                                if (onDeleteWorkspace) onDeleteWorkspace(ws.id);
                                onShowToast(`已移除工作区 "${ws.name}"`, 'info');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="移除此工作区"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Trash / Recycle Bin */}
          {activeTab === 'trash' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>回收站保留机制说明</span>
                  </h4>
                  <p className="text-xs text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                    被删除的随记笔记将暂存在回收站中保留 <strong>7 天</strong>，在此期间你可以随时一键恢复。超过 7 天的随记将被系统自动安全清理。
                  </p>
                </div>

                {trashNotes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onEmptyTrash) onEmptyTrash();
                      else onShowToast('已清空回收站', 'info');
                    }}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-semibold shrink-0 shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空回收站</span>
                  </button>
                )}
              </div>

              {trashNotes.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-1">
                    回收站空空如也
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    暂无任何删除的随记笔记。
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    回收站笔记 ({trashNotes.length} 条)
                  </div>

                  <div className="space-y-2">
                    {trashNotes.map((note) => {
                      const daysRemaining = note.deletedAt
                        ? Math.max(1, 7 - Math.floor((Date.now() - note.deletedAt) / (1000 * 60 * 60 * 24)))
                        : 7;

                      return (
                        <div
                          key={note.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="truncate min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                              <span className="text-rose-500 font-semibold">
                                还剩 {daysRemaining} 天自动清除
                              </span>
                              <span>·</span>
                              <span>删除于: {formatFriendlyTime(note.deletedAt || note.updatedAt)}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                              {note.content.slice(0, 80).replace(/\n/g, ' ')}...
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (onRestoreNote) onRestoreNote(note.id);
                                else onShowToast('已恢复笔记', 'success');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>恢复</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onPermanentDeleteNote) onPermanentDeleteNote(note.id);
                                else onShowToast('已彻底删除', 'info');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>彻底删除</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'paths' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-indigo-500" />
                    <span>默认笔记保存目录 (Notes Storage)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={storagePath}
                      onChange={(e) => setStoragePath(e.target.value)}
                      placeholder="例如: ~/Documents/FloveNote/Notes"
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPath = prompt('请输入新的默认笔记保存目录路径：', storagePath);
                        if (newPath && newPath.trim()) setStoragePath(newPath.trim());
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-200/70 dark:bg-zinc-700 hover:bg-slate-300 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>更改</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-emerald-500" />
                    <span>媒体附件存储目录 (Assets Path)</span>
                  </label>
                  <input
                    type="text"
                    value={mediaStoragePath}
                    onChange={(e) => setMediaStoragePath(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>归档备份存放路径 (Backup Path)</span>
                  </label>
                  <input
                    type="text"
                    value={backupPath}
                    onChange={(e) => setBackupPath(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetPaths}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    重置为系统默认路径
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePaths}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-2xs transition-colors"
                  >
                    保存路径配置
                  </button>
                </div>
              </div>

              {/* Backup & Restore Data */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 space-y-3">
                <p className="font-semibold text-slate-800 dark:text-zinc-200">全量 JSON 数据备份与还原</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">直接导出全量 JSON 或从已有 JSON 文件恢复笔记</p>

                <div className="flex items-center gap-3 pt-1">
                  {onExportBackup && (
                    <button
                      type="button"
                      onClick={onExportBackup}
                      className="px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>导出 JSON 全量备份</span>
                    </button>
                  )}

                  {onImportBackup && (
                    <label className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-200/80 dark:bg-zinc-700/80 border border-slate-300 dark:border-zinc-600 rounded-xl hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>导入 JSON 备份恢复</span>
                      <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Sample Data Reset */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">恢复系统初始示例数据</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">重置笔记库为初始示例精选集</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('确定要恢复系统初始示例笔记吗？此操作将覆盖现有内容。')) {
                      onResetSampleData();
                      onShowToast('已成功重置示例数据！', 'success');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-200 transition-colors"
                >
                  重置示例数据
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: Help & Onboarding Guide */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              {/* Tour trigger hero banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-200" />
                    <h4 className="font-bold text-sm">FloveNote 新手极速上手学习导览</h4>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                    Interactive Tour
                  </span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  想要快速掌握所见即所得编辑、双链笔记关联 `[[标题]]`、`.src/` 本地图片存储与导出长图等核心黑科技？点击下方按钮开启 5 步交互导览！
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowHelpTour(true)}
                    className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>启动分步交互教程 Tour</span>
                  </button>
                  {onImportAllCaseDocuments && (
                    <button
                      type="button"
                      onClick={() => {
                        onImportAllCaseDocuments();
                        onClose();
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>一键导入全套实战案例</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Case Documents Interactive Reader */}
              <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                      实战案例文档库 (Case Studies & Best Practices)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    精选 4 篇深度排版实战范例，支持实时预览与一键导入
                  </span>
                </div>

                {/* Case Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_CASE_DOCUMENTS.map((doc) => {
                    const isSelected = selectedCaseId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedCaseId(doc.id)}
                        className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                            : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{doc.icon}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            {doc.badge}
                          </span>
                        </div>
                        <p className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-zinc-200'}`}>
                          {doc.title.replace(/^[^\s]+\s*/, '')}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Current Active Case Document Box */}
                {(() => {
                  const currentDoc =
                    SAMPLE_CASE_DOCUMENTS.find((d) => d.id === selectedCaseId) || SAMPLE_CASE_DOCUMENTS[0];
                  return (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-700/90 overflow-hidden shadow-xs">
                      {/* Document Header Bar */}
                      <div className="p-3.5 bg-slate-100/70 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {currentDoc.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 rounded-full font-semibold border border-indigo-200 dark:border-indigo-800">
                              {currentDoc.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {currentDoc.tagline}
                          </p>
                        </div>

                        {/* Action Buttons for Document */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentDoc.content);
                              onShowToast('案例文档 Markdown 源码已复制到剪贴板！', 'success');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="复制 Markdown 源码"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>复制源码</span>
                          </button>

                          {onImportCaseDocument && (
                            <button
                              type="button"
                              onClick={() => {
                                onImportCaseDocument(currentDoc);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                              title="将此案例文档添加到当前工作区笔记列表"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>导入此案例到笔记</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live Rendered Content */}
                      <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
                        <MarkdownRenderer content={currentDoc.content} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">✍️</span>
                    <span>Typora 所见即所得</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    支持实时 Markdown 格式美化。直接输入 `#` 标题、`*斜体*`、`**加粗**` 与 `- [ ]` 快捷列表。
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">🔗</span>
                    <span>双向链接 (`[[标题]]`)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    用双括号创建卡片级关联与跳转。让不同的想法彼此碰撞交织，构建个人第二大脑。
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">🏷️</span>
                    <span>智能标签与拖拽</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    正文中输入 `#标签` 自动提取。鼠标长按笔记卡片可直接拖拽放置到左侧标签分类。
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">📁</span>
                    <span>`.src/` 本地图片库</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    本地图片统一保存在 `.src/` 相对路径下，兼容 Obsidian 与 Typora 本地文件流转。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Onboarding Help Tour Modal */}
        <OnboardingHelpModal
          isOpen={showHelpTour}
          onClose={() => setShowHelpTour(false)}
          onShowToast={onShowToast}
        />

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200/80 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-2xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>完成并关闭</span>
          </button>
        </div>
      </div>
    </div>
  );
};
