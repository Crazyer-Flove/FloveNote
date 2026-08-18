import React, { useState, useRef } from 'react';
import { handleClipboardImagePaste } from '../utils/pasteUtils';
import { IconPickerModal } from './IconPickerModal';
import { ImageInsertModal } from './ImageInsertModal';
import {
  Send,
  Hash,
  Image as ImageIcon,
  Smile,
  Sparkles,
  Maximize2,
  X,
  Check,
  Feather,
} from 'lucide-react';

interface TopComposerProps {
  onPublish: (content: string) => void;
  onOpenFullEditor: (initialContent?: string) => void;
  allExistingTags: string[];
}

export const TopComposer: React.FC<TopComposerProps> = ({
  onPublish,
  onOpenFullEditor,
  allExistingTags,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePublish = () => {
    if (!content.trim()) return;
    onPublish(content);
    setContent('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePublish();
    }
  };

  const insertTag = (tag: string) => {
    setContent((prev) => `${prev} #${tag} `);
    setShowTagPicker(false);
  };

  const insertIcon = (iconStr: string) => {
    setContent((prev) => `${prev} ${iconStr} `);
  };

  const handleInsertImage = (url: string, altText?: string) => {
    let cleanUrl = url.replace(/[\r\n]+/g, '').trim();
    if (cleanUrl.includes(' ') && !cleanUrl.startsWith('data:')) {
      cleanUrl = cleanUrl.replace(/ /g, '%20');
    }
    const cleanAlt = (altText || '图片').replace(/[\]\[\r\n]/g, '').trim();
    setContent((prev) => `${prev}\n\n![${cleanAlt}](${cleanUrl})\n\n`);
  };

  // Helper to extract image markdown syntax from content for preview strip
  const detectedImages = React.useMemo(() => {
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches: { alt: string; url: string; fullMatch: string }[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        alt: match[1],
        url: match[2].replace(/[\r\n]+/g, '').trim(),
        fullMatch: match[0],
      });
    }
    return matches;
  }, [content]);

  const removeImageFromContent = (fullMatch: string) => {
    setContent((prev) => prev.replace(fullMatch, '').replace(/\n\n\n+/g, '\n\n'));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-4 transition-all duration-200 hover:shadow-md">
      {!isExpanded ? (
        // Collapsed Placeholder
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 text-slate-400 dark:text-zinc-500 cursor-pointer group py-1"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Feather className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-sm font-normal text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200 transition-colors flex-1">
            我在想什么... (支持 Markdown 和 #标签)
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFullEditor();
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-xs flex items-center gap-1.5"
            title="打开 Typora 模式沉浸编辑器"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">全屏编辑器</span>
          </button>
        </div>
      ) : (
        // Expanded Composer Form
        <div className="flex flex-col gap-3 animate-fadeIn">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              handleClipboardImagePaste(e, (dataUrl, altName) => {
                setContent((prev) => `${prev}\n![${altName}](${dataUrl})\n`);
              });
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
              }
            }}
            onDrop={(e) => {
              const files = e.dataTransfer.files;
              if (!files || files.length === 0) return;
              let hasImg = false;
              Array.from(files).forEach((file) => {
                if (file.type.startsWith('image/')) {
                  hasImg = true;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const dataUrl = evt.target?.result as string;
                    if (dataUrl) {
                      const cleanAlt = file.name.replace(/\.[^/.]+$/, '');
                      setContent((prev) => `${prev}\n![${cleanAlt}](${dataUrl.replace(/[\r\n]+/g, '')})\n`);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              });
              if (hasImg) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            placeholder="我在想什么... (按 Ctrl+Enter 快速发布，可以直接 Ctrl+V 粘贴剪贴板图片)"
            rows={4}
            className="w-full bg-transparent text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none resize-none leading-relaxed font-mono"
            autoFocus
          />

          {/* Live Image Preview Gallery Strip */}
          {detectedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 border-t border-slate-100 dark:border-zinc-800/80">
              {detectedImages.map((img, idx) => (
                <div
                  key={`${img.url.substring(0, 30)}-${idx}`}
                  className="relative group shrink-0 w-24 h-24 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 overflow-hidden shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.alt || '预览图片'}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).alt = '加载失败';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => removeImageFromContent(img.fullMatch)}
                      className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
                      title="从内容中移除此图片"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center font-mono">
                    {img.alt || '图片'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 relative">
              {/* Hashtag Picker */}
              <button
                type="button"
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 text-xs font-medium flex items-center gap-1 transition-colors"
                title="插入标签"
              >
                <Hash className="w-4 h-4 text-indigo-500" />
                <span>标签</span>
              </button>

              {showTagPicker && (
                <div className="absolute left-0 bottom-full mb-2 z-30 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 min-w-[150px] max-h-48 overflow-y-auto">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 px-2 py-1 font-semibold">
                    快速选择标签：
                  </p>
                  {allExistingTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => insertTag(t)}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-zinc-200 rounded-lg"
                    >
                      #{t}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => insertTag('思考')}
                    className="w-full text-left px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg mt-1 border-t border-slate-100 dark:border-zinc-800"
                  >
                    + #思考
                  </button>
                </div>
              )}

              {/* Emoji / Icon Selector Trigger */}
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 text-xs font-medium flex items-center gap-1 transition-colors"
                title="选择图标与表情符号"
              >
                <Smile className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">图标表情</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 text-xs font-medium flex items-center gap-1 transition-colors"
                title="插入本地电脑图片或网络 URL"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">插入图片</span>
              </button>

              {/* Full Editor launcher */}
              <button
                type="button"
                onClick={() => {
                  onOpenFullEditor(content);
                  setIsExpanded(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-1 text-slate-600 dark:text-zinc-300 transition-colors"
                title="在 Full Typora 编辑器中打开"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Typora 模式</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                }}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 text-xs font-medium rounded-lg"
              >
                收起
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!content.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>发布</span>
              </button>
            </div>
          </div>

          {/* Image Upload/Insert Modal */}
          <ImageInsertModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            onInsertImage={handleInsertImage}
          />

          {/* Icon Picker Modal */}
          <IconPickerModal
            isOpen={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            onSelectIcon={insertIcon}
          />
        </div>
      )}
    </div>
  );
};
