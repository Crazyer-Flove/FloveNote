import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, ExternalLink, Palette, Link } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import { LazyImage, ImageLightboxModal } from './LazyImage';
import { UrlPreviewModal } from './UrlPreviewModal';
import { ImageEditModal } from './ImageEditModal';
import { CodeBlockThemeId, TableThemeId } from '../types';

interface MarkdownRendererProps {
  content: string;
  onTagClick?: (tag: string) => void;
  onBiLinkClick?: (title: string) => void;
  onTaskToggle?: (updatedContent: string) => void;
  className?: string;
  isInteractive?: boolean;
  codeBlockTheme?: CodeBlockThemeId;
  tableTheme?: TableThemeId;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onTagClick,
  onBiLinkClick,
  onTaskToggle,
  className = '',
  isInteractive = true,
  codeBlockTheme = 'light-mac',
  tableTheme = 'modern-indigo',
}) => {
  const [zoomedImage, setZoomedImage] = useState<{ url: string; altText?: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<{ url: string; title?: string } | null>(null);
  const [editingImage, setEditingImage] = useState<{ url: string; altText?: string } | null>(null);

  // Toggle task list checkbox
  const handleCheckboxClick = (targetIndex: number) => {
    if (!onTaskToggle || !isInteractive) return;

    let taskCount = 0;
    const updatedContent = content.replace(
      /(^|\n)(\s*(?:[-*+]|\d+\.)\s*)\[([ xX])\]/g,
      (match, leading, prefix, state) => {
        if (taskCount === targetIndex) {
          taskCount++;
          const isChecked = state.trim().toLowerCase() === 'x';
          const newBox = isChecked ? '[ ]' : '[x]';
          return `${leading}${prefix}${newBox}`;
        }
        taskCount++;
        return match;
      }
    );

    onTaskToggle(updatedContent);
  };

  // Unified Image Update handler (Syncs width, rotation, caption/alt, src, or delete to Markdown)
  const handleImageUpdate = (
    oldSrc: string,
    updates: {
      newSrc?: string;
      newAlt?: string;
      newWidth?: number;
      newRotation?: number;
      newAlign?: 'left' | 'center' | 'right';
      isDelete?: boolean;
    }
  ) => {
    if (!onTaskToggle || !isInteractive) return;

    // Use safe string index search instead of RegExp compilation to avoid stack overflow on base64 data URLs
    const searchPattern = `](${oldSrc})`;
    let targetIndex = content.indexOf(searchPattern);
    let matchedOldSrc = oldSrc;

    // Fallback search if exact src not found (e.g. URI encoding differences or long base64 Data URLs)
    if (targetIndex === -1) {
      try {
        const decodedSrc = decodeURIComponent(oldSrc);
        if (content.indexOf(`](${decodedSrc})`) !== -1) {
          targetIndex = content.indexOf(`](${decodedSrc})`);
          matchedOldSrc = decodedSrc;
        }
      } catch {
        /* ignore decode error */
      }

      if (targetIndex === -1) {
        try {
          const encodedSrc = encodeURI(oldSrc);
          if (content.indexOf(`](${encodedSrc})`) !== -1) {
            targetIndex = content.indexOf(`](${encodedSrc})`);
            matchedOldSrc = encodedSrc;
          }
        } catch {
          /* ignore encode error */
        }
      }

      // Robust Data URL prefix match for base64 images
      if (targetIndex === -1 && oldSrc.startsWith('data:')) {
        const prefix = oldSrc.substring(0, Math.min(60, oldSrc.length));
        const foundIdx = content.indexOf(prefix);
        if (foundIdx !== -1) {
          const altStart = content.lastIndexOf('![', foundIdx);
          const urlEnd = content.indexOf(')', foundIdx);
          if (altStart !== -1 && urlEnd !== -1 && altStart < foundIdx && urlEnd > foundIdx) {
            const linkStart = content.indexOf('](', altStart);
            if (linkStart !== -1 && linkStart < urlEnd) {
              matchedOldSrc = content.substring(linkStart + 2, urlEnd);
              targetIndex = linkStart;
            }
          }
        }
      }
    }

    if (targetIndex === -1) {
      // General fallback for single image block or base64 data URLs
      const altStart = content.lastIndexOf('![');
      if (altStart !== -1) {
        const altEnd = content.indexOf('](', altStart);
        const urlEnd = content.indexOf(')', altEnd);
        if (altEnd !== -1 && urlEnd !== -1) {
          matchedOldSrc = content.substring(altEnd + 2, urlEnd);
          targetIndex = altEnd;
        }
      }
    }

    if (targetIndex === -1) return;

    const imgStart = content.lastIndexOf('![', targetIndex);
    if (imgStart === -1) return;

    const matchedPattern = `](${matchedOldSrc})`;
    const fullTag = content.substring(imgStart, targetIndex + matchedPattern.length);
    const altTextMatch = fullTag.match(/^!\[([^\]]*)\]/);
    const existingAltStr = altTextMatch ? altTextMatch[1] : '';

    if (updates.isDelete) {
      let endIdx = imgStart + fullTag.length;
      if (content[endIdx] === '\n') endIdx++;
      const updatedContent = content.substring(0, imgStart) + content.substring(endIdx);
      onTaskToggle(updatedContent);
      return;
    }

    let currCaption = updates.newAlt;
    let currWidth = updates.newWidth;
    let currRotation = updates.newRotation;
    let currAlign = updates.newAlign;

    if (currCaption === undefined || currWidth === undefined || currRotation === undefined || currAlign === undefined) {
      const parts = (existingAltStr || '').split('|').map((p: string) => p.trim());
      const captionParts: string[] = [];

      for (const part of parts) {
        if (!part) continue;
        if (/^\d+(?:px)?$/i.test(part)) {
          if (currWidth === undefined) currWidth = parseInt(part, 10);
        } else if (/^r(?:otate)?(\d+)$/i.test(part) || /^(\d+)deg$/i.test(part)) {
          if (currRotation === undefined) {
            const m = part.match(/\d+/);
            if (m) currRotation = parseInt(m[0], 10);
          }
        } else if (/^(left|center|right|align-left|align-center|align-right)$/i.test(part)) {
          if (currAlign === undefined) {
            currAlign = part.replace(/^align-/, '').toLowerCase() as 'left' | 'center' | 'right';
          }
        } else {
          captionParts.push(part);
        }
      }

      if (currCaption === undefined) {
        currCaption = captionParts.join('|');
      }
    }

    const newAltParts: string[] = [];
    if (currCaption) newAltParts.push(currCaption);
    if (currWidth) newAltParts.push(`${currWidth}`);
    if (currRotation && currRotation % 360 !== 0) newAltParts.push(`r${currRotation % 360}`);
    if (currAlign && currAlign !== 'center') newAltParts.push(currAlign);

    const finalAlt = newAltParts.join('|');
    const finalSrc = updates.newSrc || oldSrc;
    const replacementTag = `![${finalAlt}](${finalSrc})`;

    const updatedContent =
      content.substring(0, imgStart) + replacementTag + content.substring(imgStart + fullTag.length);

    onTaskToggle(updatedContent);
  };

  let globalCheckboxCounter = 0;

  return (
    <>
      <div className={`prose dark:prose-invert max-w-none prose-stone prose-sm md:prose-base transition-colors leading-relaxed ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          urlTransform={(url) => {
            if (!url) return '';
            let cleanUrl = url.replace(/[\r\n]+/g, '').trim();
            // Allow data URLs (base64 images), blob URLs, relative paths, http, https
            if (
              cleanUrl.startsWith('data:') ||
              cleanUrl.startsWith('blob:') ||
              cleanUrl.startsWith('/') ||
              cleanUrl.startsWith('./') ||
              cleanUrl.startsWith('../')
            ) {
              return cleanUrl;
            }
            if (cleanUrl.includes(' ') && !cleanUrl.startsWith('data:')) {
              cleanUrl = cleanUrl.replace(/ /g, '%20');
            }
            if (!/^https?:\/\//i.test(cleanUrl) && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(cleanUrl)) {
              cleanUrl = `https://${cleanUrl}`;
            }
            return cleanUrl;
          }}
          components={{
            // Custom checkbox input for task lists (- [ ] / - [x])
            input({ node, checked, type, ...props }: any) {
              if (type === 'checkbox') {
                const currentIdx = globalCheckboxCounter++;
                return (
                  <input
                    type="checkbox"
                    checked={!!checked}
                    disabled={!isInteractive}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxClick(currentIdx);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckboxClick(currentIdx);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-indigo-500 cursor-pointer accent-indigo-600 hover:scale-110 transition-transform active:scale-90 my-0 inline-block align-middle mr-2 pointer-events-auto"
                  />
                );
              }
              return <input type={type} {...props} />;
            },

            // Code blocks with custom theme selection & syntax highlighting
            code({ node, inline, className: codeClassName, children, ...props }: any) {
              const match = /language-(\w+)/.exec(codeClassName || '');
              const codeText = String(children).replace(/\n$/, '');

              if (!inline && match) {
                return <CodeBlock language={match[1]} code={codeText} defaultTheme={codeBlockTheme} isInteractive={isInteractive} />;
              }
              if (!inline && !match && codeText.includes('\n')) {
                return <CodeBlock language="text" code={codeText} defaultTheme={codeBlockTheme} isInteractive={isInteractive} />;
              }

              return (
                <code
                  className="bg-stone-200/60 dark:bg-zinc-800/80 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[0.88em] font-mono font-medium border border-stone-300/40 dark:border-zinc-700/50"
                  {...props}
                >
                  {children}
                </code>
              );
            },

            // Unordered list (supports multi-level nesting and task lists)
            ul({ children, className: ulClassName, ...props }: any) {
              const isTaskList = ulClassName?.includes('contains-task-list');
              return (
                <ul
                  className={`${
                    isTaskList ? 'pl-0 list-none' : 'list-disc pl-5 sm:pl-6'
                  } my-2 space-y-1 text-stone-700 dark:text-zinc-200 overflow-visible`}
                  {...props}
                >
                  {children}
                </ul>
              );
            },

            // Ordered list
            ol({ children, ...props }: any) {
              return (
                <ol
                  className="list-decimal pl-5 sm:pl-6 my-2 space-y-1 text-stone-700 dark:text-zinc-200 overflow-visible"
                  {...props}
                >
                  {children}
                </ol>
              );
            },

            // List item container (supports multi-level nesting and task items)
            li({ children, className: liClassName, ...props }: any) {
              const isTaskList = liClassName?.includes('task-list-item');
              return (
                <li
                  className={`my-1 leading-relaxed text-stone-700 dark:text-zinc-200 overflow-visible ${
                    isTaskList ? 'list-none pl-0' : ''
                  }`}
                  {...props}
                >
                  {renderRichText(children, onTagClick, onBiLinkClick)}
                </li>
              );
            },

            // Divider line
            hr({ ...props }: any) {
              return <hr className="my-5 border-t-2 border-dashed border-stone-300/80 dark:border-zinc-700/80" {...props} />;
            },

            // Images with zoom & context menu (rotation, caption, resize, replace, delete) support
            img({ src, alt }: any) {
              if (!src) return null;
              let cleanSrc = src.replace(/[\r\n]+/g, '').trim();

              if (cleanSrc.includes(' ') && !cleanSrc.startsWith('data:')) {
                cleanSrc = cleanSrc.replace(/ /g, '%20');
              }

              if (
                !/^https?:\/\//i.test(cleanSrc) &&
                !cleanSrc.startsWith('data:') &&
                !cleanSrc.startsWith('blob:') &&
                !cleanSrc.startsWith('/') &&
                !cleanSrc.startsWith('./') &&
                /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(cleanSrc)
              ) {
                cleanSrc = `https://${cleanSrc}`;
              }

              if (!cleanSrc) return null;

              let cleanAlt = alt || '';
              let parsedWidth: number | undefined = undefined;
              let parsedRotation: number | undefined = undefined;
              let parsedAlign: 'left' | 'center' | 'right' = 'center';

              if (cleanAlt) {
                const parts = cleanAlt.split('|').map((p: string) => p.trim());
                const captionParts: string[] = [];

                for (const part of parts) {
                  if (!part) continue;
                  if (/^\d+(?:px)?$/i.test(part)) {
                    parsedWidth = parseInt(part, 10);
                  } else if (/^r(?:otate)?(\d+)$/i.test(part) || /^(\d+)deg$/i.test(part)) {
                    const match = part.match(/\d+/);
                    if (match) parsedRotation = parseInt(match[0], 10);
                  } else if (/^(left|center|right|align-left|align-center|align-right)$/i.test(part)) {
                    parsedAlign = part.replace(/^align-/, '').toLowerCase() as 'left' | 'center' | 'right';
                  } else {
                    captionParts.push(part);
                  }
                }
                cleanAlt = captionParts.join('|');
              }

              return (
                <LazyImage
                  src={cleanSrc}
                  alt={cleanAlt}
                  initialWidth={parsedWidth}
                  initialRotation={parsedRotation}
                  initialAlign={parsedAlign}
                  isInteractive={isInteractive}
                  onOpenZoom={(url, altText) => setZoomedImage({ url, altText })}
                  onEditImage={
                    isInteractive && onTaskToggle
                      ? () => setEditingImage({ url: cleanSrc, altText: cleanAlt })
                      : undefined
                  }
                  onResizeWidth={
                    isInteractive && onTaskToggle
                      ? (newWidth) => handleImageUpdate(src, { newWidth })
                      : undefined
                  }
                  onRotateImage={
                    isInteractive && onTaskToggle
                      ? (newRotation) => handleImageUpdate(src, { newRotation })
                      : undefined
                  }
                  onChangeCaption={
                    isInteractive && onTaskToggle
                      ? (newAlt) => handleImageUpdate(src, { newAlt })
                      : undefined
                  }
                  onChangeAlign={
                    isInteractive && onTaskToggle
                      ? (newAlign) => handleImageUpdate(src, { newAlign })
                      : undefined
                  }
                  onUpdateSrc={
                    isInteractive && onTaskToggle
                      ? (newSrc) => handleImageUpdate(src, { newSrc })
                      : undefined
                  }
                  onDeleteImage={
                    isInteractive && onTaskToggle
                      ? () => handleImageUpdate(src, { isDelete: true })
                      : undefined
                  }
                />
              );
            },

            // Links with modal preview or bi-link jump
            a({ href, children }: any) {
              const linkTitle = typeof children === 'string' ? children : undefined;
              if (href && (href.startsWith('#') || href.startsWith('wikilink:'))) {
                const targetTitle = href.replace(/^(#|wikilink:)/, '').trim() || linkTitle || '';
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (targetTitle) onBiLinkClick?.(targetTitle);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  >
                    <Link className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{children}</span>
                  </button>
                );
              }
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (href) {
                      setPreviewUrl({ url: href, title: linkTitle });
                    }
                  }}
                  className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline decoration-indigo-400/40 underline-offset-4 cursor-pointer"
                  title="点击预览此网址内容"
                >
                  {children}
                  <ExternalLink className="w-3 h-3 opacity-60 inline-block" />
                </a>
              );
            },

            // Blockquotes
            blockquote({ children }: any) {
              return (
                <blockquote className="relative my-4 pl-4 pr-3 py-2.5 rounded-r-xl border-l-4 border-indigo-500 dark:border-indigo-400 bg-gradient-to-r from-indigo-50/70 via-slate-50/50 to-transparent dark:from-indigo-950/30 dark:via-zinc-900/40 text-slate-700 dark:text-zinc-200 shadow-2xs font-sans text-sm md:text-base leading-relaxed">
                  {renderRichText(children, onTagClick, onBiLinkClick)}
                </blockquote>
              );
            },

            // Tables with preset themes & responsive layout
            table({ children }: any) {
              return <StyledMarkdownTable defaultTheme={tableTheme} isInteractive={isInteractive}>{children}</StyledMarkdownTable>;
            },
            thead({ children }: any) {
              return <thead>{children}</thead>;
            },
            tbody({ children }: any) {
              return <tbody>{children}</tbody>;
            },
            tr({ children }: any) {
              return <tr>{children}</tr>;
            },
            th({ children }: any) {
              return <th className="p-3 text-left font-semibold text-xs md:text-sm tracking-wider">{renderRichText(children, onTagClick, onBiLinkClick)}</th>;
            },
            td({ children }: any) {
              return <td className="p-3 text-left align-middle text-xs md:text-sm">{renderRichText(children, onTagClick, onBiLinkClick)}</td>;
            },

            // Headings
            h1({ children }: any) {
              return <h1 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-zinc-50 mt-4 mb-2 tracking-tight">{children}</h1>;
            },
            h2({ children }: any) {
              return <h2 className="text-lg md:text-xl font-semibold text-stone-800 dark:text-zinc-100 mt-3 mb-2">{children}</h2>;
            },
            h3({ children }: any) {
              return <h3 className="text-base md:text-lg font-medium text-stone-800 dark:text-zinc-200 mt-2 mb-1">{children}</h3>;
            },

            // Custom Paragraphs (parse Hashtags inside text & handle image block containers)
            p({ children }: any) {
              const childrenArray = React.Children.toArray(children);
              const hasImage = childrenArray.some((child: any) => {
                if (!child || typeof child !== 'object') return false;
                if (child.type === LazyImage) return true;
                if (child.props && (child.props.src || child.props.node?.tagName === 'img')) return true;
                if (child.key && String(child.key).includes('img')) return true;
                return false;
              });

              if (hasImage) {
                return (
                  <div className="my-2 leading-relaxed text-stone-700 dark:text-zinc-200">
                    {renderRichText(children, onTagClick, onBiLinkClick)}
                  </div>
                );
              }

              return (
                <p className="my-2 leading-relaxed text-stone-700 dark:text-zinc-200">
                  {renderRichText(children, onTagClick, onBiLinkClick)}
                </p>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Image Lightbox Modal */}
      {zoomedImage && (
        <ImageLightboxModal
          url={zoomedImage.url}
          altText={zoomedImage.altText}
          onClose={() => setZoomedImage(null)}
        />
      )}

      {/* Image Edit Modal */}
      {editingImage && (
        <ImageEditModal
          isOpen={!!editingImage}
          initialUrl={editingImage.url}
          initialAlt={editingImage.altText}
          onClose={() => setEditingImage(null)}
          onSave={(newUrl, newAlt) => handleImageUpdate(editingImage.url, { newSrc: newUrl, newAlt })}
          onDelete={() => handleImageUpdate(editingImage.url, { isDelete: true })}
        />
      )}

      {/* URL Content Preview Modal */}
      {previewUrl && (
        <UrlPreviewModal
          url={previewUrl.url}
          title={previewUrl.title}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
};

// Helper for Code Block with macOS window controls, theme dropdown, copy action & syntax highlighting
const CodeBlock: React.FC<{
  language: string;
  code: string;
  defaultTheme?: CodeBlockThemeId;
  isInteractive?: boolean;
}> = ({
  language,
  code,
  defaultTheme = 'light-mac',
  isInteractive = true,
}) => {
  const [theme, setTheme] = useState<CodeBlockThemeId>(defaultTheme);
  const [copied, setCopied] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    setTheme(defaultTheme);
  }, [defaultTheme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeConfigs: Record<CodeBlockThemeId, {
    container: string;
    header: string;
    codeText: string;
    langBadge: string;
    copyBtn: string;
    dot1: string;
    dot2: string;
    dot3: string;
  }> = {
    'dark-mac': {
      container: 'bg-zinc-950 text-zinc-100 border-zinc-800/80',
      header: 'bg-zinc-900/90 border-zinc-800/80 text-zinc-400',
      codeText: 'text-zinc-200',
      langBadge: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/40',
      copyBtn: 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 border-zinc-700/50',
      dot1: 'bg-[#ff5f56] border border-red-600/70 ring-1 ring-black/20 shadow-xs',
      dot2: 'bg-[#ffbd2e] border border-amber-600/70 ring-1 ring-black/20 shadow-xs',
      dot3: 'bg-[#27c93f] border border-emerald-600/70 ring-1 ring-black/20 shadow-xs',
    },
    'light-mac': {
      container: 'bg-slate-50 text-slate-800 border-slate-300 dark:border-zinc-700 shadow-sm',
      header: 'bg-slate-200/90 border-slate-300 text-slate-600',
      codeText: 'text-slate-800',
      langBadge: 'text-indigo-700 bg-indigo-100 border-indigo-300',
      copyBtn: 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300',
      dot1: 'bg-[#ff5f56] border border-red-500/80 ring-1 ring-slate-400/30 shadow-xs',
      dot2: 'bg-[#ffbd2e] border border-amber-500/80 ring-1 ring-slate-400/30 shadow-xs',
      dot3: 'bg-[#27c93f] border border-emerald-500/80 ring-1 ring-slate-400/30 shadow-xs',
    },
    'dracula': {
      container: 'bg-[#282a36] text-[#f8f8f2] border-purple-900/60 shadow-lg',
      header: 'bg-[#21222c] border-purple-900/40 text-purple-300',
      codeText: 'text-[#f8f8f2]',
      langBadge: 'text-purple-300 bg-purple-950/60 border-purple-800/50',
      copyBtn: 'bg-[#44475a] hover:bg-[#6272a4] text-white border-purple-700/40',
      dot1: 'bg-[#ff5555] border border-red-600/70 ring-1 ring-black/20 shadow-xs',
      dot2: 'bg-[#f1fa8c] border border-amber-400/70 ring-1 ring-black/20 shadow-xs',
      dot3: 'bg-[#50fa7b] border border-emerald-500/70 ring-1 ring-black/20 shadow-xs',
    },
    'monokai': {
      container: 'bg-[#272822] text-[#f8f8f2] border-amber-950/60 shadow-lg',
      header: 'bg-[#1e1f1c] border-amber-900/40 text-amber-400',
      codeText: 'text-[#f8f8f2]',
      langBadge: 'text-amber-400 bg-amber-950/60 border-amber-800/50',
      copyBtn: 'bg-[#3e3d32] hover:bg-[#49483e] text-amber-200 border-amber-800/40',
      dot1: 'bg-[#f92672] border border-rose-600/70 ring-1 ring-black/20 shadow-xs',
      dot2: 'bg-[#e6db74] border border-amber-400/70 ring-1 ring-black/20 shadow-xs',
      dot3: 'bg-[#a6e22e] border border-emerald-500/70 ring-1 ring-black/20 shadow-xs',
    },
    'nord': {
      container: 'bg-[#2e3440] text-[#eceff4] border-slate-700 shadow-lg',
      header: 'bg-[#242933] border-slate-700 text-sky-300',
      codeText: 'text-[#eceff4]',
      langBadge: 'text-sky-300 bg-[#3b4252] border-sky-800/40',
      copyBtn: 'bg-[#3b4252] hover:bg-[#434c5e] text-slate-200 border-slate-600',
      dot1: 'bg-[#bf616a] border border-red-500/70 ring-1 ring-black/20 shadow-xs',
      dot2: 'bg-[#ebcb8b] border border-amber-400/70 ring-1 ring-black/20 shadow-xs',
      dot3: 'bg-[#a3be8c] border border-emerald-500/70 ring-1 ring-black/20 shadow-xs',
    },
  };

  const style = themeConfigs[theme] || themeConfigs['dark-mac'];
  const highlightedTokens = highlightSyntax(code, language, theme, isInteractive);

  return (
    <div className={`relative my-4 rounded-2xl border ${style.container} shadow-xl transition-all hover:shadow-2xl ${isInteractive ? 'overflow-hidden' : 'overflow-visible'} w-full max-w-full`}>
      {/* macOS Window Header Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${style.header} rounded-t-2xl border-b text-xs font-mono`}>
        {/* macOS Three Dots */}
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${style.dot1} inline-block transition-transform hover:scale-110 cursor-pointer`} title="关闭" />
          <span className={`w-3 h-3 rounded-full ${style.dot2} inline-block transition-transform hover:scale-110 cursor-pointer`} title="最小化" />
          <span className={`w-3 h-3 rounded-full ${style.dot3} inline-block transition-transform hover:scale-110 cursor-pointer`} title="最大化" />
        </div>

        {/* Language Tag, Theme Switcher & Copy */}
        <div className="flex items-center gap-2.5 relative">
          <span className={`uppercase tracking-widest font-semibold text-[11px] px-2 py-0.5 rounded-md border ${style.langBadge} font-mono`}>
            {language || 'code'}
          </span>

          {/* Quick Theme Switcher Button */}
          {isInteractive && (
            <button
              type="button"
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={`p-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity flex items-center gap-1 ${style.copyBtn}`}
              title="选择代码块渲染主题"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}

          {isInteractive && showThemePicker && (
            <div className="absolute right-12 top-full mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 min-w-[160px] text-xs font-sans text-slate-800 dark:text-zinc-200 animate-fadeIn">
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold px-2 py-1">
                代码高亮主题:
              </p>
              {(
                [
                  ['dark-mac', 'macOS 暗黑'],
                  ['light-mac', 'macOS 纯白'],
                  ['dracula', 'Dracula 经典'],
                  ['monokai', 'Monokai 复古'],
                  ['nord', 'Nord 极光'],
                ] as const
              ).map(([tId, tLabel]) => (
                <button
                  key={tId}
                  type="button"
                  onClick={() => {
                    setTheme(tId);
                    setShowThemePicker(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    theme === tId
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>{tLabel}</span>
                  {theme === tId && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {isInteractive && (
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium border ${style.copyBtn} transition-all active:scale-95`}
              title="复制代码"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <pre className={`p-4 rounded-b-2xl ${isInteractive ? 'overflow-x-auto' : 'whitespace-pre-wrap break-all overflow-visible'} text-xs md:text-sm font-mono leading-relaxed ${style.codeText}`}>
        <code>{highlightedTokens}</code>
      </pre>
    </div>
  );
};

// Interactive Table component with preset theme styles & responsive overflow
const StyledMarkdownTable: React.FC<{
  children: React.ReactNode;
  defaultTheme?: TableThemeId;
  isInteractive?: boolean;
}> = ({
  children,
  defaultTheme = 'modern-indigo',
  isInteractive = true,
}) => {
  const [theme, setTheme] = useState<TableThemeId>(defaultTheme);

  useEffect(() => {
    setTheme(defaultTheme);
  }, [defaultTheme]);

  const themeStyles: Record<TableThemeId, { wrapper: string; table: string }> = {
    'modern-indigo': {
      wrapper: 'border-indigo-200/80 dark:border-indigo-950/80 shadow-sm bg-white dark:bg-zinc-900',
      table: '[&_thead]:bg-gradient-to-r [&_thead]:from-indigo-600 [&_thead]:to-violet-600 [&_thead]:text-white [&_tbody_tr]:border-b [&_tbody_tr]:border-indigo-100/60 dark:[&_tbody_tr]:border-indigo-950/40 [&_tbody_tr]:hover:bg-indigo-50/40 dark:[&_tbody_tr]:hover:bg-indigo-950/30',
    },
    'zebra-stripe': {
      wrapper: 'border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900',
      table: '[&_thead]:bg-slate-800 dark:[&_thead]:bg-zinc-800 [&_thead]:text-slate-100 [&_tbody_tr:nth-child(even)]:bg-slate-50/90 dark:[&_tbody_tr:nth-child(even)]:bg-zinc-800/40 [&_tbody_tr]:border-b [&_tbody_tr]:border-slate-100 dark:[&_tbody_tr]:border-zinc-800/50 [&_tbody_tr]:hover:bg-slate-100/60 dark:[&_tbody_tr]:hover:bg-zinc-800/70',
    },
    'minimal-dark': {
      wrapper: 'border-zinc-800 shadow-md bg-zinc-950 text-zinc-100',
      table: '[&_thead]:bg-zinc-900 [&_thead]:text-indigo-400 [&_thead]:font-mono [&_tbody_tr]:border-b [&_tbody_tr]:border-zinc-800/80 [&_tbody_tr]:hover:bg-zinc-900/60 [&_td]:text-zinc-300',
    },
    'border-light': {
      wrapper: 'border-2 border-slate-300 dark:border-zinc-700 shadow-xs bg-white dark:bg-zinc-900',
      table: '[&_thead]:bg-slate-100 dark:[&_thead]:bg-zinc-800 [&_thead]:text-slate-800 dark:[&_thead]:text-zinc-100 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-zinc-700 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-zinc-800 [&_tbody_tr]:hover:bg-slate-50 dark:[&_tbody_tr]:hover:bg-zinc-800/50',
    },
    'emerald-fresh': {
      wrapper: 'border-emerald-200/80 dark:border-emerald-950/80 shadow-sm bg-white dark:bg-zinc-900',
      table: '[&_thead]:bg-gradient-to-r [&_thead]:from-emerald-600 [&_thead]:to-teal-600 [&_thead]:text-white [&_tbody_tr]:border-b [&_tbody_tr]:border-emerald-100/60 dark:[&_tbody_tr]:border-emerald-950/40 [&_tbody_tr]:hover:bg-emerald-50/40 dark:[&_tbody_tr]:hover:bg-emerald-950/30',
    },
    'amber-warm': {
      wrapper: 'border-amber-200/80 dark:border-amber-950/80 shadow-sm bg-white dark:bg-zinc-900',
      table: '[&_thead]:bg-gradient-to-r [&_thead]:from-amber-500 [&_thead]:to-orange-500 [&_thead]:text-white [&_tbody_tr]:border-b [&_tbody_tr]:border-amber-100/60 dark:[&_tbody_tr]:border-amber-950/40 [&_tbody_tr]:hover:bg-amber-50/40 dark:[&_tbody_tr]:hover:bg-amber-950/30',
    },
  };

  const currentStyle = themeStyles[theme] || themeStyles['modern-indigo'];

  return (
    <div className="my-5 space-y-1.5">
      {/* Theme Preset Selector Bar */}
      {isInteractive && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 dark:text-zinc-500 flex-wrap gap-2">
          <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            📊 数据表格 (预设渲染风格):
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {(
              [
                ['modern-indigo', '靛蓝', 'bg-indigo-500'],
                ['zebra-stripe', '斑马纹', 'bg-slate-600'],
                ['minimal-dark', '简约深色', 'bg-zinc-900'],
                ['border-light', '网格框', 'bg-slate-300'],
                ['emerald-fresh', '翡绿', 'bg-emerald-500'],
                ['amber-warm', '琥珀', 'bg-amber-500'],
              ] as const
            ).map(([key, name, colorBg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                  theme === key
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 shadow-xs scale-105 font-semibold'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colorBg}`} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Styled Table Container with Responsive Overflow */}
      <div className={`${isInteractive ? 'overflow-x-auto custom-scrollbar' : 'overflow-visible w-full'} rounded-2xl border ${currentStyle.wrapper} transition-all duration-200`}>
        <table className={`min-w-full text-left text-xs md:text-sm border-collapse ${currentStyle.table}`}>
          {children}
        </table>
      </div>
    </div>
  );
};

// Language alias mapping for PrismJS
const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  typescript: 'typescript',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  'c#': 'csharp',
  csharp: 'csharp',
  css: 'css',
  html: 'markup',
  markup: 'markup',
  xml: 'markup',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  bash: 'bash',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  sql: 'sql',
  go: 'go',
  golang: 'go',
  rs: 'rust',
  rust: 'rust',
  php: 'php',
  rb: 'ruby',
  ruby: 'ruby',
  md: 'markdown',
  markdown: 'markdown',
  docker: 'docker',
  dockerfile: 'docker',
};

function getTokenColorClass(type: string, theme: CodeBlockThemeId): string {
  switch (theme) {
    case 'light-mac':
      switch (type) {
        case 'comment': case 'prolog': case 'doctype': case 'cdata':
          return 'text-slate-400 italic';
        case 'punctuation':
          return 'text-slate-600';
        case 'property': case 'tag': case 'boolean': case 'number': case 'constant': case 'symbol': case 'deleted':
          return 'text-amber-600 font-medium';
        case 'selector': case 'attr-name': case 'string': case 'char': case 'builtin': case 'inserted':
          return 'text-emerald-600 font-medium';
        case 'operator': case 'entity': case 'url':
          return 'text-teal-700';
        case 'keyword': case 'atrule': case 'rule':
          return 'text-purple-700 font-semibold';
        case 'function': case 'class-name':
          return 'text-indigo-600 font-semibold';
        case 'regex': case 'important': case 'variable':
          return 'text-rose-600';
        default:
          return 'text-slate-800';
      }

    case 'dracula':
      switch (type) {
        case 'comment':
          return 'text-[#6272a4] italic';
        case 'string': case 'char':
          return 'text-[#f1fa8c]';
        case 'keyword': case 'atrule':
          return 'text-[#ff79c6] font-semibold';
        case 'function': case 'class-name':
          return 'text-[#50fa7b] font-medium';
        case 'property': case 'tag': case 'boolean': case 'number': case 'constant':
          return 'text-[#bd93f9] font-medium';
        case 'operator': case 'punctuation':
          return 'text-[#ff79c6]';
        case 'variable': case 'builtin':
          return 'text-[#8be9fd]';
        default:
          return 'text-[#f8f8f2]';
      }

    case 'monokai':
      switch (type) {
        case 'comment':
          return 'text-[#75715e] italic';
        case 'string': case 'char':
          return 'text-[#e6db74]';
        case 'keyword': case 'atrule':
          return 'text-[#f92672] font-semibold';
        case 'function': case 'class-name':
          return 'text-[#a6e22e] font-medium';
        case 'property': case 'tag': case 'boolean': case 'number': case 'constant':
          return 'text-[#ae81ff] font-medium';
        case 'operator': case 'punctuation':
          return 'text-[#f92672]';
        case 'variable': case 'builtin':
          return 'text-[#66d9ef]';
        default:
          return 'text-[#f8f8f2]';
      }

    case 'nord':
      switch (type) {
        case 'comment':
          return 'text-[#616e88] italic';
        case 'string': case 'char':
          return 'text-[#a3be8c]';
        case 'keyword': case 'atrule':
          return 'text-[#81a1c1] font-semibold';
        case 'function': case 'class-name':
          return 'text-[#88c0d0] font-medium';
        case 'property': case 'tag': case 'boolean': case 'number': case 'constant':
          return 'text-[#b48ead] font-medium';
        case 'operator': case 'punctuation':
          return 'text-[#81a1c1]';
        case 'variable': case 'builtin':
          return 'text-[#8fbcbb]';
        default:
          return 'text-[#eceff4]';
      }

    case 'dark-mac':
    default:
      switch (type) {
        case 'comment': case 'prolog': case 'doctype': case 'cdata':
          return 'text-zinc-500 italic';
        case 'punctuation':
          return 'text-zinc-400';
        case 'property': case 'tag': case 'boolean': case 'number': case 'constant': case 'symbol': case 'deleted':
          return 'text-amber-400 font-medium';
        case 'selector': case 'attr-name': case 'string': case 'char': case 'builtin': case 'inserted':
          return 'text-emerald-400 font-medium';
        case 'operator': case 'entity': case 'url':
          return 'text-cyan-400';
        case 'keyword': case 'atrule': case 'rule':
          return 'text-fuchsia-400 font-semibold';
        case 'function': case 'class-name':
          return 'text-indigo-400 font-semibold';
        case 'regex': case 'important': case 'variable':
          return 'text-rose-400';
        default:
          return 'text-zinc-200';
      }
  }
}

function renderPrismTokens(tokens: (string | Prism.Token)[], theme: CodeBlockThemeId): React.ReactNode {
  return tokens.map((token, index) => {
    if (typeof token === 'string') {
      return <React.Fragment key={index}>{token}</React.Fragment>;
    }

    const { type, content } = token;
    const colorClass = getTokenColorClass(type, theme);

    let innerContent: React.ReactNode = null;
    if (typeof content === 'string') {
      innerContent = content;
    } else if (Array.isArray(content)) {
      innerContent = renderPrismTokens(content, theme);
    } else {
      innerContent = renderPrismTokens([content], theme);
    }

    return (
      <span key={index} className={colorClass}>
        {innerContent}
      </span>
    );
  });
}

// PrismJS Syntax colorizer
function highlightSyntax(
  code: string,
  lang: string,
  codeTheme: CodeBlockThemeId = 'dark-mac',
  isInteractive: boolean = true
): React.ReactNode {
  if (!code) return null;

  const normalizedLang = (lang || '').toLowerCase().trim();
  const prismLangKey = LANGUAGE_ALIAS_MAP[normalizedLang] || normalizedLang;
  const grammar = Prism.languages[prismLangKey] || Prism.languages.clike || Prism.languages.javascript;

  const lines = code.split('\n');
  const isLight = codeTheme === 'light-mac';

  return (
    <div className="w-full table border-collapse">
      {lines.map((line, lineIdx) => {
        let lineContent: React.ReactNode = line || ' ';
        if (line.trim().length > 0) {
          try {
            const tokens = Prism.tokenize(line, grammar);
            lineContent = renderPrismTokens(tokens, codeTheme);
          } catch {
            lineContent = line;
          }
        }

        return (
          <div key={lineIdx} className="table-row">
            <span
              className={`table-cell pr-3 select-none text-right font-mono text-xs opacity-60 align-top w-8 shrink-0 ${
                isLight ? 'text-slate-400' : 'text-zinc-600'
              }`}
            >
              {lineIdx + 1}
            </span>
            <span className={`table-cell align-top ${isInteractive ? 'whitespace-pre' : 'whitespace-pre-wrap break-all'}`}>
              {lineContent}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Parse React children nodes to make #tags and [[WikiLinks]] interactive inline
function renderRichText(
  children: React.ReactNode,
  onTagClick?: (tag: string) => void,
  onBiLinkClick?: (title: string) => void
): React.ReactNode {
  if (typeof children !== 'string') {
    if (Array.isArray(children)) {
      return children.map((child, idx) => (
        <React.Fragment key={idx}>{renderRichText(child, onTagClick, onBiLinkClick)}</React.Fragment>
      ));
    }
    return children;
  }

  const regex = /\[\[([^\]]+)\]\]|(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5\/-]+)(?=\s|$|[.,!?;:])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(children)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(children.substring(lastIndex, matchIndex));
    }

    const wikiTitle = match[1];
    const tagName = match[2];

    if (wikiTitle) {
      parts.push(
        <button
          key={`wikilink-${matchIndex}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBiLinkClick?.(wikiTitle);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-xs font-medium whitespace-nowrap break-keep shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
          title={`跳转双链笔记: ${wikiTitle}`}
        >
          <Link className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>{wikiTitle}</span>
        </button>
      );
    } else if (tagName) {
      const leadingSpace = fullMatch.startsWith(' ') ? ' ' : '';
      parts.push(leadingSpace);
      parts.push(
        <button
          key={`tag-${matchIndex}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTagClick?.(tagName);
          }}
          className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-xs font-medium whitespace-nowrap break-keep shrink-0 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
        >
          #{tagName}
        </button>
      );
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < children.length) {
    parts.push(children.substring(lastIndex));
  }

  return parts.length > 0 ? parts : children;
}
