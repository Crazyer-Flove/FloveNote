import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Link as LinkIcon, Check, Trash2 } from 'lucide-react';

interface ImageEditModalProps {
  isOpen: boolean;
  initialUrl: string;
  initialAlt?: string;
  onClose: () => void;
  onSave: (newUrl: string, newAlt?: string) => void;
  onDelete?: () => void;
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  initialUrl,
  initialAlt = '',
  onClose,
  onSave,
  onDelete,
}) => {
  const [tab, setTab] = useState<'url' | 'local'>('url');
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [altText, setAltText] = useState(initialAlt);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrl(initialUrl);
    setAltText(initialAlt || '');
    setLocalPreview(null);
  }, [initialUrl, initialAlt]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (!altText) {
      setAltText(file.name.replace(/\.[^/.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      let result = event.target?.result as string;
      if (result) {
        result = result.replace(/[\r\n]+/g, '');
        setLocalPreview(result);
        setImageUrl(result);
        setTab('local');
      }
    };
    reader.onerror = () => {
      console.error('Failed to read image file');
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

  const handleConfirmSave = () => {
    let finalUrl = tab === 'local' && localPreview ? localPreview : imageUrl.trim();
    if (!finalUrl && localPreview) finalUrl = localPreview;
    if (!finalUrl && imageUrl) finalUrl = imageUrl.trim();

    if (finalUrl) {
      finalUrl = finalUrl.replace(/[\r\n]+/g, '').trim();
      if (finalUrl.includes(' ') && !finalUrl.startsWith('data:')) {
        finalUrl = finalUrl.replace(/ /g, '%20');
      }
      const cleanAlt = altText.replace(/[\]\[\r\n]/g, '').trim();
      onSave(finalUrl, cleanAlt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-100 text-sm">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>二次编辑图片属性与图片源</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-950/50 p-1 gap-1 text-xs font-medium">
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
            <span>网络图片网址</span>
          </button>
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
            <span>更换本地文件</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {tab === 'url' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  图片网络 URL 链接:
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  图片描述 / Alt 标注:
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="图片描述"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Preview */}
              {imageUrl && (
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/80 text-center">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1.5 font-medium">修改后图片预览:</p>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-36 rounded-lg object-contain mx-auto border border-slate-200/60 dark:border-zinc-700"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-zinc-800/40 transition-colors flex flex-col items-center justify-center gap-2 group"
              >
                {localPreview || imageUrl ? (
                  <div className="relative group/preview w-full max-h-40 overflow-hidden rounded-xl">
                    <img
                      src={localPreview || imageUrl}
                      alt="Local Preview"
                      className="w-full h-36 object-contain rounded-xl bg-slate-100 dark:bg-zinc-950"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl">
                      点击更换新的本地图片
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-zinc-200">
                        点击选择新本地文件替换
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

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  图片描述 / Alt 标注:
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="图片描述"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除图片</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-zinc-400 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>保存修改</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
