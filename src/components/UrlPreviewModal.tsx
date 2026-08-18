import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Globe,
  ShieldCheck,
  RotateCw,
  Maximize2,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface UrlPreviewModalProps {
  url: string;
  title?: string;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const UrlPreviewModal: React.FC<UrlPreviewModalProps> = ({
  url,
  title,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Normalize URL protocol if missing
  const normalizedUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;

  let domain = normalizedUrl;
  try {
    const parsed = new URL(normalizedUrl);
    domain = parsed.hostname;
  } catch {
    // Fallback
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(normalizedUrl);
    setCopied(true);
    onShowToast?.('网址链接已成功复制到剪贴板！', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100 truncate">
                  {title || domain || '网页内容预览'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 shrink-0">
                  {domain}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono truncate">
                {normalizedUrl}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl text-xs flex items-center gap-1 transition-colors"
              title="复制网址"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline font-medium">{copied ? '已复制' : '复制网址'}</span>
            </button>

            <button
              onClick={() => setIframeKey((prev) => prev + 1)}
              className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="刷新网页内容"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleOpenExternal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              title="在新标签页中打开原始网页"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>在新标签页打开</span>
            </button>

            <div className="w-[1px] h-5 bg-slate-200 dark:bg-zinc-800 mx-1" />

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="关闭弹窗"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Website Content Notice Bar */}
        <div className="px-4 py-2 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate">
              提示：部分安全防御极高的网站（如 GitHub / 百度 / Google）限制内嵌 iFrame 播放，若页面显示空白可点击右上角【在新标签页打开】。
            </span>
          </div>
        </div>

        {/* Embedded Web View Container */}
        <div className="flex-1 min-h-0 relative bg-slate-100 dark:bg-zinc-950">
          <iframe
            key={iframeKey}
            src={normalizedUrl}
            title={title || normalizedUrl}
            className="w-full h-full border-0 bg-white dark:bg-zinc-900"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono text-[11px]">{normalizedUrl}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
          >
            关闭预览
          </button>
        </div>
      </div>
    </div>
  );
};
