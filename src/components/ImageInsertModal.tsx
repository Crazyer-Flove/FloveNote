import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Link as LinkIcon, Check, Loader2, FolderCheck, HardDrive } from 'lucide-react';
import { saveImageToLocalSrcFolder } from '../utils/imageStorage';

interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (url: string, altText?: string) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
}) => {
  const [tab, setTab] = useState<'local' | 'url'>('local');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [savedRelativePath, setSavedRelativePath] = useState<string | null>(null);
  const [useSrcFolder, setUseSrcFolder] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const cleanAlt = file.name.replace(/\.[^/.]+$/, '');
    if (!altText) {
      setAltText(cleanAlt);
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      let result = event.target?.result as string;
      if (result) {
        result = result.replace(/[\r\n]+/g, '');
        setLocalPreview(result);

        // Auto-save to .src/ folder
        const { relativePath } = saveImageToLocalSrcFolder(result, file.name);
        setSavedRelativePath(relativePath);
        setTab('local');
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      console.error('Failed to read image file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteInModal = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          break;
        }
      }
    }
  };

  const handleConfirmInsert = () => {
    let finalUrl = '';
    if (tab === 'local' && localPreview) {
      if (useSrcFolder && savedRelativePath) {
        finalUrl = savedRelativePath;
      } else {
        finalUrl = localPreview;
      }
    } else if (tab === 'url' && imageUrl.trim()) {
      finalUrl = imageUrl.trim();
    } else if (savedRelativePath && useSrcFolder) {
      finalUrl = savedRelativePath;
    } else if (localPreview) {
      finalUrl = localPreview;
    } else if (imageUrl.trim()) {
      finalUrl = imageUrl.trim();
    }

    if (!finalUrl) return;

    // Clean whitespace and linebreaks from URL
    finalUrl = finalUrl.replace(/[\r\n]+/g, '').trim();
    if (finalUrl.includes(' ') && !finalUrl.startsWith('data:')) {
      finalUrl = finalUrl.replace(/ /g, '%20');
    }

    const cleanAlt = (altText || '图片').replace(/[\]\[\r\n]/g, '').trim();
    onInsertImage(finalUrl, cleanAlt);
    resetAndClose();
  };

  const resetAndClose = () => {
    setImageUrl('');
    setAltText('');
    setLocalPreview(null);
    setSavedRelativePath(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div
      onPaste={handlePasteInModal}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-100 text-sm">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>插入图片 (支持本地电脑与网络网址)</span>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-950/50 p-1 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('local')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'local'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>本地电脑选择</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'url'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>输入网络网址</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {tab === 'local' ? (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-zinc-800/40 transition-colors flex flex-col items-center justify-center gap-2 group min-h-[140px]"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-semibold text-xs">读取本地图片中...</span>
                  </div>
                ) : localPreview ? (
                  <div className="relative group/preview w-full max-h-40 overflow-hidden rounded-xl">
                    <img
                      src={localPreview}
                      alt="Local Preview"
                      className="w-full h-36 object-contain rounded-xl bg-slate-100 dark:bg-zinc-950"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl">
                      点击或拖拽更换图片
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-zinc-200">
                        点击选择或直接拖拽/粘贴图片
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        支持拖拽文件、剪贴板 Ctrl+V 粘贴与上传
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {localPreview && (
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>相对路径存储 (.src/ 文件夹)</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-emerald-700 dark:text-emerald-300">
                      <input
                        type="checkbox"
                        checked={useSrcFolder}
                        onChange={(e) => setUseSrcFolder(e.target.checked)}
                        className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>使用 .src/ 相对路径</span>
                    </label>
                  </div>
                  <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 break-all bg-white/80 dark:bg-emerald-900/30 p-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                    {useSrcFolder && savedRelativePath
                      ? `![${altText || '图片'}](${savedRelativePath})`
                      : `![${altText || '图片'}](data:image/png;base64,...)`}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  图片描述 / Alt 名称 (可选):
                </label>
                <input
                  type="text"
                  placeholder="例如：极简思考草图"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmInsert();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  图片网络 URL 链接:
                </label>
                <input
                  type="text"
                  placeholder="如 https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmInsert();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  图片描述 / Alt 名称 (可选):
                </label>
                <input
                  type="text"
                  placeholder="例如：示例配图"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmInsert();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {imageUrl.trim() && (
                <div className="p-2 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/80">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1">图片实时预览:</p>
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    className="max-h-32 rounded-lg object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).alt = '图片加载失败，请检查 URL';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={resetAndClose}
            className="px-4 py-2 text-slate-600 dark:text-zinc-400 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirmInsert}
            disabled={isLoading || (tab === 'local' ? !localPreview : !imageUrl.trim())}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>确认插入图片</span>
          </button>
        </div>
      </div>
    </div>
  );
};
