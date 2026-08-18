import React, { useState, useEffect, useRef } from 'react';
import { resolveSrcImageUrl } from '../utils/imageStorage';
import {
  Maximize2,
  ImageOff,
  RefreshCw,
  Edit3,
  RotateCw,
  Copy,
  Check,
  X,
  Trash2,
  Type,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Download,
  Sliders,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Globe,
  Upload,
} from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt?: string;
  initialWidth?: number;
  initialRotation?: number;
  initialAlign?: 'left' | 'center' | 'right';
  isInteractive?: boolean;
  onOpenZoom?: (url: string, altText?: string) => void;
  onEditImage?: () => void;
  onResizeWidth?: (newWidth: number) => void;
  onRotateImage?: (newRotation: number) => void;
  onChangeCaption?: (newCaption: string) => void;
  onChangeAlign?: (newAlign: 'left' | 'center' | 'right') => void;
  onUpdateSrc?: (newSrc: string) => void;
  onDeleteImage?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  initialWidth,
  initialRotation = 0,
  initialAlign = 'center',
  isInteractive = true,
  onOpenZoom,
  onEditImage,
  onResizeWidth,
  onRotateImage,
  onChangeCaption,
  onChangeAlign,
  onUpdateSrc,
  onDeleteImage,
}) => {
  const [isInView, setIsInView] = useState(true);
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!src || !src.trim()) return false;
    const resolved = resolveSrcImageUrl(src);
    if (resolved && (resolved.startsWith('data:') || resolved.startsWith('blob:'))) {
      return true;
    }
    return false;
  });
  const [isError, setIsError] = useState(false);
  const [width, setWidth] = useState<number | undefined>(initialWidth);
  const [rotation, setRotation] = useState<number>(initialRotation);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>(initialAlign);
  const [caption, setCaption] = useState<string>(alt);

  const [isEditingUrlInline, setIsEditingUrlInline] = useState(false);
  const [urlInput, setUrlInput] = useState<string>(src);

  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Context menu state
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Caption inline edit modal state
  const [isEditingCaptionModal, setIsEditingCaptionModal] = useState(false);
  const [tempCaptionInput, setTempCaptionInput] = useState('');

  const containerRef = useRef<HTMLSpanElement>(null);
  const dragStartRef = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: 300 });

  const imgRef = useRef<HTMLImageElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialWidth) setWidth(initialWidth);
  }, [initialWidth]);

  useEffect(() => {
    setRotation(initialRotation);
  }, [initialRotation]);

  useEffect(() => {
    if (initialAlign) setAlign(initialAlign);
  }, [initialAlign]);

  useEffect(() => {
    setCaption(alt);
  }, [alt]);

  // Clean up Blob URLs when src changes or component unmounts
  useEffect(() => {
    if (blobUrlRef.current && blobUrlRef.current !== src) {
      if (blobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch {
          // ignore
        }
      }
      blobUrlRef.current = null;
    }
    if (src && src.startsWith('blob:')) {
      blobUrlRef.current = src;
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch {
          // ignore
        }
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Image preloader & validity check: immediately set isLoaded if complete
  useEffect(() => {
    setUrlInput(src);
    setIsError(false);

    if (!src || !src.trim()) {
      setIsError(true);
      setIsLoaded(false);
      return;
    }

    let isMounted = true;
    const resolvedUrl = resolveSrcImageUrl(src);
    const cleanSrc = resolvedUrl.replace(/[\r\n]+/g, '').trim();

    const imgObj = new Image();
    imgObj.referrerPolicy = 'no-referrer';

    const handleSuccess = () => {
      if (!isMounted) return;
      setIsLoaded(true);
      setIsError(false);
    };

    const handleError = () => {
      if (!isMounted) return;
      setIsError(true);
      setIsLoaded(false);
    };

    imgObj.onload = handleSuccess;
    imgObj.onerror = handleError;
    imgObj.src = cleanSrc;

    if (imgObj.complete) {
      if (imgObj.naturalWidth > 0) {
        handleSuccess();
      } else {
        handleError();
      }
    } else {
      setIsLoaded(false);
    }

    return () => {
      isMounted = false;
      imgObj.onload = null;
      imgObj.onerror = null;
    };
  }, [src]);

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenuPos(null);
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleGlobalClick);
    };
  }, []);

  // Preload observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle Dragging Resize (Mouse & Touch)
  const handleStartResize = (clientX: number) => {
    const currentElemWidth = containerRef.current?.getBoundingClientRect().width || width || 320;
    dragStartRef.current = { startX: clientX, startWidth: currentElemWidth };
    setIsDragging(true);

    const handleMove = (moveX: number) => {
      const deltaX = moveX - dragStartRef.current.startX;
      const newW = Math.max(120, Math.min(1200, Math.round(dragStartRef.current.startWidth + deltaX)));
      setWidth(newW);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };

    const handleEnd = (endX: number) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      setIsDragging(false);

      const deltaX = endX - dragStartRef.current.startX;
      const finalW = Math.max(120, Math.min(1200, Math.round(dragStartRef.current.startWidth + deltaX)));
      setWidth(finalW);
      if (onResizeWidth) {
        onResizeWidth(finalW);
      }
    };

    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX);
    const handleTouchEnd = (e: TouchEvent) => {
      const lastX = e.changedTouches[0] ? e.changedTouches[0].clientX : dragStartRef.current.startX;
      handleEnd(lastX);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handlePresetWidth = (presetWidth: number) => {
    setWidth(presetWidth);
    if (onResizeWidth) {
      onResizeWidth(presetWidth);
    }
  };

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    setAlign(newAlign);
    if (onChangeAlign) {
      onChangeAlign(newAlign);
    }
  };

  const handleSaveUrlInline = () => {
    const trimmed = urlInput.trim();
    if (trimmed && trimmed !== src) {
      if (onUpdateSrc) {
        onUpdateSrc(trimmed);
      } else if (onEditImage) {
        onEditImage();
      }
    }
    setIsEditingUrlInline(false);
  };

  const handleInlineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          setUrlInput(result);
          setIsError(false);
          setIsLoaded(false);
          if (onUpdateSrc) {
            onUpdateSrc(result);
          }
        }
      };
      reader.onerror = () => {
        setIsError(true);
      };
      reader.readAsDataURL(file);
    }
    setIsEditingUrlInline(false);
  };

  const handleDropFileToReplace = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          setUrlInput(result);
          setIsError(false);
          setIsLoaded(false);
          if (onUpdateSrc) {
            onUpdateSrc(result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepScale = (deltaPercent: number) => {
    const currentW = width || 680;
    const factor = 1 + deltaPercent / 100;
    const newW = Math.max(120, Math.min(1200, Math.round(currentW * factor)));
    setWidth(newW);
    if (onResizeWidth) {
      onResizeWidth(newW);
    }
  };

  const handleApplyScalePreset = (presetVal: string) => {
    if (presetVal === 'fit') {
      setWidth(undefined);
      if (onResizeWidth) onResizeWidth(680);
      return;
    }
    const pct = parseInt(presetVal, 10);
    if (!isNaN(pct)) {
      const targetW = Math.round((680 * pct) / 100);
      setWidth(targetW);
      if (onResizeWidth) {
        onResizeWidth(targetW);
      }
    }
  };

  const handleRotate = (deg: number) => {
    const newDeg = (rotation + deg) % 360;
    setRotation(newDeg);
    if (onRotateImage) {
      onRotateImage(newDeg);
    }
  };

  const handleSetExactRotation = (exactDeg: number) => {
    setRotation(exactDeg);
    if (onRotateImage) {
      onRotateImage(exactDeg);
    }
  };

  const handleSaveCaption = () => {
    setCaption(tempCaptionInput.trim());
    if (onChangeCaption) {
      onChangeCaption(tempCaptionInput.trim());
    }
    setIsEditingCaptionModal(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(src);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const alignContainerClass =
    align === 'left'
      ? 'mr-auto ml-0'
      : align === 'right'
      ? 'ml-auto mr-0'
      : 'mx-auto';

  return (
    <span
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleContextMenu}
      style={{ width: width ? `${width}px` : undefined }}
      className={`block my-4 group relative rounded-xl border transition-all ${alignContainerClass} ${
        isDragging
          ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/30'
          : 'border-slate-200/80 dark:border-zinc-800 hover:border-indigo-400/80 bg-slate-100 dark:bg-zinc-900/60'
      } ${width ? 'max-w-full' : 'w-auto'}`}
    >
      {/* Primary Floating Toolbar (Hover & Focus) */}
      {isLoaded && !isError && (
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 z-40 transition-all duration-200 pointer-events-auto ${
            hovered || isEditingUrlInline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100'
          }`}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 dark:bg-zinc-900/95 text-white backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-xs select-none">
            {/* 1. Alignment Layout Buttons (居中/左对齐/右对齐) */}
            <div className="flex items-center bg-slate-800/80 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlignChange('left');
                }}
                className={`p-1 rounded-lg transition-all cursor-pointer ${
                  align === 'left' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="左对齐布局"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlignChange('center');
                }}
                className={`p-1 rounded-lg transition-all cursor-pointer ${
                  align === 'center' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="居中对齐布局"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlignChange('right');
                }}
                className={`p-1 rounded-lg transition-all cursor-pointer ${
                  align === 'right' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="右对齐布局"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-3.5 bg-white/20" />

            {/* 2. Scale / Zoom Selector (缩放比例选择器) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStepScale(-10);
                }}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="缩小 10%"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <select
                value={
                  width
                    ? Math.round((width / 680) * 100) > 110
                      ? '100'
                      : String(Math.round((width / 680) * 100))
                    : 'fit'
                }
                onChange={(e) => {
                  e.stopPropagation();
                  handleApplyScalePreset(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800/90 dark:bg-zinc-800/90 text-indigo-300 border border-white/15 rounded-lg px-2 py-0.5 text-[11px] font-mono focus:outline-none cursor-pointer text-center font-semibold"
                title="选择缩放比例"
              >
                <option value="25">25%</option>
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="fit">自适应</option>
              </select>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStepScale(10);
                }}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="放大 10%"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-3.5 bg-white/20" />

            {/* 3. Image URL Editing Functionality (图片 URL 编辑功能) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUrlInput(src);
                setIsEditingUrlInline((prev) => !prev);
              }}
              className={`px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isEditingUrlInline
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800/80 hover:bg-indigo-600 text-slate-200'
              }`}
              title="编辑/更换图片 URL"
            >
              <Link className="w-3.5 h-3.5 text-amber-300" />
              <span>URL 编辑</span>
            </button>

            {/* Fullscreen Zoom */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenZoom?.(src, caption);
              }}
              className="p-1 text-slate-300 hover:text-sky-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="全屏放大"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Image */}
            {onDeleteImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteImage();
                }}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                title="删除图片"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inline Image URL Editing Popover Panel */}
      {isEditingUrlInline && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 dark:bg-zinc-900/95 text-white backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-3.5 shadow-2xl space-y-2.5 animate-fadeIn select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Link className="w-4 h-4" />
              <span>修改图片 URL 链接来源</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingUrlInline(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveUrlInline();
              }}
              placeholder="输入新的图片 URL (https://... 或 base64)..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-zinc-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveUrlInline}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shrink-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <label className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>或从本地更换图片文件</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInlineFileUpload}
              />
            </label>

            {onEditImage && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingUrlInline(false);
                  onEditImage();
                }}
                className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>高级图片属性</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {!isLoaded && !isError && isInteractive && (
        <div className="w-full h-44 bg-slate-200/70 dark:bg-zinc-800 animate-pulse flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 rounded-xl">
          <RefreshCw className="w-5 h-5 animate-spin mb-1.5 text-indigo-500" />
          <span className="text-xs font-medium">资源加载中...</span>
        </div>
      )}

      {/* Error Fallback Box */}
      {isError && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropFileToReplace}
          className="w-full min-h-[140px] flex flex-col items-center justify-center bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 border-2 border-dashed border-rose-300 dark:border-rose-800 rounded-2xl relative space-y-2 text-center select-none"
        >
          <ImageOff className="w-6 h-6 opacity-80" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold">图片无法加载或地址失效</p>
            {/^(file:\/\/|[a-zA-Z]:[\\/])/i.test(src) ? (
              <p className="text-[10px] text-rose-500/90 dark:text-rose-300 max-w-sm">
                检测到本地磁盘绝对路径 (<span className="font-mono">{src}</span>)。受浏览器安全沙箱限制，无法直接读取本地文件 URL。
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-xs mx-auto">
                {src}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>上传并替换为 DataURL 本地图片</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInlineFileUpload}
              />
            </label>

            {onEditImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditImage();
                }}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-semibold hover:text-indigo-600 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>修改 URL/属性</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500">提示：也可直接拖拽图片文件到此框中替换</p>
        </div>
      )}

      {/* Actual Image Tag */}
      {isInView && !isError && (
        <div className="relative overflow-hidden flex items-center justify-center rounded-xl p-1">
          <img
            ref={imgRef}
            key={src}
            src={resolveSrcImageUrl(src)}
            alt={caption || '笔记图片'}
            referrerPolicy="no-referrer"
            onLoad={() => {
              setIsLoaded(true);
              setIsError(false);
            }}
            onError={() => {
              setIsError(true);
              setIsLoaded(false);
            }}
            onClick={() => onOpenZoom?.(src, caption)}
            style={{
              transform: rotation ? `rotate(${rotation}deg)` : undefined,
              transition: 'transform 0.3s ease-in-out',
            }}
            className={`w-full h-auto object-contain mx-auto rounded-lg cursor-zoom-in transition-all duration-200 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-100 scale-100'
            }`}
            loading="eager"
          />

          {/* Hover Overlay Buttons */}
          {isLoaded && !isDragging && isInteractive && (
            <div
              className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 cursor-pointer"
              onClick={() => onOpenZoom?.(src, caption)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenZoom?.(src, caption);
                }}
                className="bg-slate-900/85 text-white hover:bg-indigo-600 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>全屏</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRotate(90);
                }}
                className="bg-slate-900/85 text-white hover:bg-indigo-600 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-all cursor-pointer"
                title="顺时针旋转90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>旋转</span>
              </button>

              {onEditImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditImage();
                  }}
                  className="bg-slate-900/85 text-white hover:bg-indigo-600 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>替换</span>
                </button>
              )}
            </div>
          )}

          {/* Draggable Handles (Bottom-Right corner & Right handle) */}
          {isLoaded && onResizeWidth && isInteractive && (
            <>
              {/* Corner Resize Handle */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartResize(e.clientX);
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleStartResize(e.touches[0].clientX);
                }}
                title="按住鼠标拖动调整图片宽度"
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 hover:bg-indigo-500 border-2 border-white dark:border-zinc-900 rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>

              {/* Right Edge Bar Handle */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStartResize(e.clientX);
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleStartResize(e.touches[0].clientX);
                }}
                title="按住鼠标左右拖动调整宽度"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-10 bg-indigo-500/80 hover:bg-indigo-600 rounded-full cursor-ew-resize z-30 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              />
            </>
          )}

          {/* Quick Width Preset Floating Bar on Hover */}
          {isLoaded && onResizeWidth && isInteractive && (hovered || isDragging) && (
            <div
              className="absolute top-2 right-2 z-30 bg-slate-900/85 text-white backdrop-blur-md px-2 py-1 rounded-xl text-[10px] font-mono flex items-center gap-1.5 shadow-lg animate-fadeIn border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-indigo-300 font-semibold px-1">
                {width ? `${width}px` : '自动'} {rotation ? `(${rotation}°)` : ''}
              </span>
              <div className="w-px h-3 bg-white/20" />
              <button
                type="button"
                onClick={() => handlePresetWidth(280)}
                className="hover:text-indigo-300 transition-colors px-1 py-0.5 rounded cursor-pointer"
              >
                小
              </button>
              <button
                type="button"
                onClick={() => handlePresetWidth(480)}
                className="hover:text-indigo-300 transition-colors px-1 py-0.5 rounded cursor-pointer"
              >
                中
              </button>
              <button
                type="button"
                onClick={() => handlePresetWidth(680)}
                className="hover:text-indigo-300 transition-colors px-1 py-0.5 rounded cursor-pointer"
              >
                大
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alt Text / Caption Label Bar */}
      {isLoaded && !isError && (isInteractive ? true : !!(caption && caption.trim())) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/80 dark:bg-zinc-900/80 border-t border-slate-200/50 dark:border-zinc-800/60 text-xs text-slate-500 dark:text-zinc-400 font-mono rounded-b-xl">
          <span className="truncate flex items-center gap-1.5">
            <Type className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">{caption || (isInteractive ? '点击右键或右侧编辑设置图片标题' : '')}</span>
          </span>
          {isInteractive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTempCaptionInput(caption);
                setIsEditingCaptionModal(true);
              }}
              className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors shrink-0 cursor-pointer"
              title="添加/修改图片标题"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Right-Click Context Menu Popover */}
      {contextMenuPos && (
        <div
          style={{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }}
          className="fixed z-50 min-w-[180px] bg-slate-900/95 dark:bg-zinc-900/95 text-white backdrop-blur-md rounded-2xl border border-slate-700/80 dark:border-zinc-700/80 shadow-2xl p-1.5 text-xs font-sans animate-fadeIn select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 border-b border-zinc-800 mb-1 flex items-center justify-between">
            <span>图片操作菜单</span>
            {rotation ? <span className="text-indigo-400 font-semibold">{rotation}°</span> : null}
          </div>

          {/* Replace Image */}
          {onEditImage && (
            <button
              type="button"
              onClick={() => {
                setContextMenuPos(null);
                onEditImage();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/80 text-left flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>替换图片来源 (URL/文件)</span>
            </button>
          )}

          {/* Edit Caption */}
          <button
            type="button"
            onClick={() => {
              setContextMenuPos(null);
              setTempCaptionInput(caption);
              setIsEditingCaptionModal(true);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/80 text-left flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>添加 / 修改图片标题</span>
          </button>

          {/* Rotate Image Submenu */}
          <div className="my-1 border-t border-zinc-800/80 pt-1">
            <div className="px-2 py-0.5 text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
              <RotateCw className="w-3 h-3 text-indigo-400" />
              <span>旋转角度设置:</span>
            </div>
            <div className="grid grid-cols-4 gap-1 px-1 py-1">
              <button
                type="button"
                onClick={() => {
                  handleSetExactRotation(0);
                  setContextMenuPos(null);
                }}
                className={`px-1 py-1 rounded-lg text-center text-[10px] transition-colors ${
                  rotation === 0 ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                0°
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSetExactRotation(90);
                  setContextMenuPos(null);
                }}
                className={`px-1 py-1 rounded-lg text-center text-[10px] transition-colors ${
                  rotation === 90 ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                90°
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSetExactRotation(180);
                  setContextMenuPos(null);
                }}
                className={`px-1 py-1 rounded-lg text-center text-[10px] transition-colors ${
                  rotation === 180 ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                180°
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSetExactRotation(270);
                  setContextMenuPos(null);
                }}
                className={`px-1 py-1 rounded-lg text-center text-[10px] transition-colors ${
                  rotation === 270 ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                270°
              </button>
            </div>
          </div>

          <div className="my-1 border-t border-zinc-800/80" />

          {/* Fullscreen Zoom */}
          <button
            type="button"
            onClick={() => {
              setContextMenuPos(null);
              onOpenZoom?.(src, caption);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/80 text-left flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>全屏放大预览</span>
          </button>

          {/* Copy Image Link */}
          <button
            type="button"
            onClick={() => {
              handleCopyLink();
              setTimeout(() => setContextMenuPos(null), 800);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/80 text-left flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>{copiedLink ? '已复制链接！' : '复制图片链接'}</span>
          </button>

          {/* Delete Image */}
          {onDeleteImage && (
            <>
              <div className="my-1 border-t border-zinc-800/80" />
              <button
                type="button"
                onClick={() => {
                  setContextMenuPos(null);
                  onDeleteImage();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-600/90 text-rose-300 hover:text-white text-left flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>从 Markdown 中删除</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Caption Modal Dialog */}
      {isEditingCaptionModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingCaptionModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-100 text-sm">
                <Type className="w-4 h-4 text-indigo-500" />
                <span>设置图片标题 / Caption</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingCaptionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 dark:text-zinc-400 font-medium">图片标题 (Alt / Caption)：</label>
              <input
                type="text"
                value={tempCaptionInput}
                onChange={(e) => setTempCaptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCaption();
                }}
                placeholder="例如：系统架构图 v1.0"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingCaptionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveCaption}
                className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 shadow-sm transition-colors"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

interface ImageLightboxModalProps {
  url: string;
  altText?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  url,
  altText,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = altText || 'flovenote-image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Top Floating Bar */}
      <div
        className="w-full max-w-2xl flex items-center justify-between px-4 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-white backdrop-blur-md z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-semibold truncate max-w-xs text-zinc-200">
          {altText || '图片预览'}
        </span>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="放大 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="缩小 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="旋转 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="复制图片链接"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="下载原图"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-rose-500/80 rounded-lg transition-colors"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Central Image View */}
      <div
        className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={altText || 'Preview'}
          referrerPolicy="no-referrer"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Bottom Hint */}
      <div className="text-[11px] text-zinc-500 font-mono z-10">
        滚轮缩放 / 点击遮罩关闭 (ESC)
      </div>
    </div>
  );
};


