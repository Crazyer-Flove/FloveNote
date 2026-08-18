import React, { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { handleClipboardImagePaste } from '../utils/pasteUtils';
import { FileText, Sparkles, Code2, Edit3, Eye, Image as ImageIcon, Trash2 } from 'lucide-react';

interface TyporaBlockEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onSave?: () => void;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  onTagClick?: (tag: string) => void;
  onBiLinkClick?: (title: string) => void;
}

/**
 * Typora-like Block WYSIWYG Editor.
 * Automatically parses text into blocks. When user edits a block, raw Markdown is editable.
 * When user moves away, presses Enter (换行), or clicks another block, the block automatically renders as rich Markdown!
 */
export const TyporaBlockEditor: React.FC<TyporaBlockEditorProps> = ({
  content,
  onChange,
  onSave,
  fontSize = 'base',
  onTagClick,
  onBiLinkClick,
}) => {
  // Mode: 'typora' (Paragraph-Block WYSIWYG) or 'source' (Full Markdown Source)
  const [useSourceView, setUseSourceView] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(0);
  const [sourceModeBlockIndex, setSourceModeBlockIndex] = useState<number | null>(null);

  // Split content into logical paragraph blocks (preserving code blocks & empty blocks)
  const blocks = React.useMemo(() => {
    if (!content) return [''];

    const resultBlocks: string[] = [];
    const lines = content.split('\n');
    let currentBlockLines: string[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        currentBlockLines.push(line);
        continue;
      }

      if (inCodeBlock) {
        currentBlockLines.push(line);
        continue;
      }

      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        if (currentBlockLines.length > 0) {
          resultBlocks.push(currentBlockLines.join('\n'));
          currentBlockLines = [];
        } else {
          resultBlocks.push('');
        }
      } else if (trimmedLine.startsWith('![')) {
        // Isolate image lines into their own distinct block
        if (currentBlockLines.length > 0) {
          resultBlocks.push(currentBlockLines.join('\n'));
          currentBlockLines = [];
        }
        resultBlocks.push(trimmedLine);
      } else {
        currentBlockLines.push(line);
      }
    }

    if (currentBlockLines.length > 0) {
      resultBlocks.push(currentBlockLines.join('\n'));
    }

    return resultBlocks.length > 0 ? resultBlocks : [''];
  }, [content]);

  // Update a single block's content
  const handleBlockChange = (index: number, newBlockText: string) => {
    const updated = [...blocks];
    updated[index] = newBlockText;
    const combined = updated.join('\n\n');
    onChange(combined);
  };

  // Insert a new block after current index
  const handleInsertBlockAfter = (index: number, initialText: string = '') => {
    const targetIdx = Math.max(0, index);
    const updated = [...blocks];
    updated.splice(targetIdx + 1, 0, initialText);
    const combined = updated.join('\n\n');
    onChange(combined);
    setActiveBlockIndex(targetIdx + 1);
  };

  // Delete a block or merge with previous block
  const handleDeleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      onChange('');
      setActiveBlockIndex(0);
      return;
    }
    const updated = [...blocks];
    updated.splice(index, 1);
    const combined = updated.join('\n\n');
    onChange(combined);
    setActiveBlockIndex(Math.max(0, index - 1));
  };

  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-relaxed',
  };

  const handleDropFiles = (e: React.DragEvent) => {
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    let hasImage = false;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        hasImage = true;
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            const cleanAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[\]\[\r\n]/g, '').trim();
            const cleanUrl = dataUrl.replace(/[\r\n]+/g, '');
            onChange(`${content}\n\n![${cleanAlt || '图片'}](${cleanUrl})\n\n`);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (hasImage) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="w-full flex-1 max-w-3xl mx-auto py-2 px-1 sm:px-4 flex flex-col space-y-3">
      {/* Editor Status Bar & Source Code Switch */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/80 dark:bg-zinc-800/60 rounded-xl text-xs text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Typora 所见即所得书写模式（支持拖拽/粘贴本地图片）</span>
        </div>

        <button
          type="button"
          onClick={() => setUseSourceView(!useSourceView)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
            useSourceView
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-indigo-600'
          }`}
          title="切换全篇 Markdown 源码模式"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{useSourceView ? '切回 Typora 实时模式' : '全篇源码模式'}</span>
        </button>
      </div>

      {/* Editor Main Content Area */}
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
          }
        }}
        onDrop={handleDropFiles}
        className="flex-1 min-h-[360px] p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs transition-all flex flex-col"
      >
        {useSourceView ? (
          /* Full Source View */
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onSave?.();
              }
            }}
            onPaste={(e) => {
              handleClipboardImagePaste(e, (dataUrl, altName) => {
                onChange(`${content}\n![${altName}](${dataUrl})\n`);
              });
            }}
            placeholder="在此直接编辑 Markdown 全文源码..."
            className={`w-full flex-1 min-h-[300px] bg-transparent text-slate-900 dark:text-zinc-100 font-mono ${fontSizeClasses[fontSize]} focus:outline-none resize-none`}
            autoFocus
          />
        ) : (
          /* Typora Interactive Block Editor */
          <div className="flex-1 min-h-[300px] space-y-3 cursor-text" onClick={() => {
            if (activeBlockIndex === null) setActiveBlockIndex(blocks.length - 1);
          }}>
            {blocks.map((blockText, idx) => {
              const isActive = activeBlockIndex === idx;
              const isImageBlock = /^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/.test(blockText.trim()) || blockText.trim().startsWith('![');
              const isSourceModeForBlock = sourceModeBlockIndex === idx;

              return (
                <div
                  key={idx}
                  className={`group relative rounded-xl transition-all ${
                    isActive
                      ? 'p-2.5 bg-slate-50 dark:bg-zinc-800/70 border border-indigo-200 dark:border-indigo-900/60 ring-1 ring-indigo-500/20'
                      : 'p-1 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 rounded-lg'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBlockIndex(idx);
                  }}
                >
                  {isImageBlock && !isSourceModeForBlock ? (
                    <div className="relative group/imgblock">
                      {isActive && (
                        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-indigo-50/90 dark:bg-zinc-800 border border-indigo-200/80 dark:border-zinc-700 rounded-xl text-xs select-none shadow-2xs">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>图片段落 (悬停/右键可二次编辑)</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSourceModeBlockIndex(idx);
                              }}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-200 hover:text-indigo-600 text-[11px] font-medium"
                            >
                              源码模式
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(idx);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-[11px] font-medium"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      )}

                      <MarkdownRenderer
                        content={blockText}
                        isInteractive={true}
                        onTagClick={onTagClick}
                        onBiLinkClick={onBiLinkClick}
                        onTaskToggle={(newBlock) => handleBlockChange(idx, newBlock)}
                      />
                    </div>
                  ) : isActive ? (
                    <div>
                      {isImageBlock && isSourceModeForBlock && (
                        <div className="flex items-center justify-between pb-1.5 text-xs text-slate-500">
                          <span className="text-indigo-600 font-medium">Markdown 源码编辑模式:</span>
                          <button
                            type="button"
                            onClick={() => setSourceModeBlockIndex(null)}
                            className="text-xs text-indigo-600 underline font-medium"
                          >
                            返回实时图片预览
                          </button>
                        </div>
                      )}
                      <BlockTextarea
                        value={blockText}
                        fontSizeClass={fontSizeClasses[fontSize]}
                        onChange={(val) => handleBlockChange(idx, val)}
                        onEnterKey={() => {
                          handleInsertBlockAfter(idx, '');
                        }}
                        onBackspaceOnEmpty={() => {
                          handleDeleteBlock(idx);
                        }}
                        onFinishBlock={() => setActiveBlockIndex(null)}
                        onSave={onSave}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[28px] text-slate-900 dark:text-zinc-100">
                      {blockText.trim() ? (
                        <MarkdownRenderer
                          content={blockText}
                          isInteractive={true}
                          onTagClick={onTagClick}
                          onBiLinkClick={onBiLinkClick}
                          onTaskToggle={(newBlock) => handleBlockChange(idx, newBlock)}
                        />
                      ) : (
                        <span className="text-slate-300 dark:text-zinc-600 italic text-sm">
                          （空段落，点击编辑）
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Click bottom area to add new block */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleInsertBlockAfter(blocks.length - 1, '');
              }}
              className="py-3 px-4 text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition-all border border-dashed border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl mt-4 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 flex items-center justify-center gap-2 select-none active:scale-[0.99]"
              title="点击在末尾新增一个可编辑段落"
            >
              <span className="text-sm font-semibold">+</span>
              <span>点击或按 Enter 添加新段落...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface BlockTextareaProps {
  value: string;
  fontSizeClass: string;
  onChange: (val: string) => void;
  onEnterKey: () => void;
  onBackspaceOnEmpty: () => void;
  onFinishBlock?: () => void;
  onSave?: () => void;
}

const POPULAR_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'jsx',
  'tsx',
  'html',
  'css',
  'sql',
  'json',
  'yaml',
  'bash',
  'cpp',
  'csharp',
  'java',
  'go',
  'rust',
  'php',
];

const BlockTextarea: React.FC<BlockTextareaProps> = ({
  value,
  fontSizeClass,
  onChange,
  onEnterKey,
  onBackspaceOnEmpty,
  onFinishBlock,
  onSave,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isCodeBlock = value.trim().startsWith('```');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 40)}px`;
    }
  }, [value]);

  if (isCodeBlock) {
    // Parse language and inner code from markdown fence
    // ```lang\ncode...\n```
    const lines = value.split('\n');
    const firstLine = lines[0] || '```';
    const lang = firstLine.replace(/^```/, '').trim();

    // Extract middle code lines
    let codeLines = lines.slice(1);
    if (codeLines.length > 0 && codeLines[codeLines.length - 1].trim() === '```') {
      codeLines = codeLines.slice(0, -1);
    }
    const codeBody = codeLines.join('\n');

    const handleCodeBodyChange = (newCode: string) => {
      const rebuilt = `\`\`\`${lang}\n${newCode}\n\`\`\``;
      onChange(rebuilt);
    };

    const handleLangChange = (newLang: string) => {
      const rebuilt = `\`\`\`${newLang}\n${codeBody}\n\`\`\``;
      onChange(rebuilt);
    };

    const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (onFinishBlock) {
          onFinishBlock();
        } else {
          onSave?.();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onFinishBlock?.();
        return;
      }

      // Handle Tab indentation in code editor
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (e.shiftKey) {
          // Outdent (remove 2 spaces if present)
          const before = codeBody.substring(0, start);
          if (before.endsWith('  ')) {
            const updated = before.slice(0, -2) + codeBody.substring(start);
            handleCodeBodyChange(updated);
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(start - 2, start - 2);
              }
            }, 0);
          }
        } else {
          // Indent (insert 2 spaces)
          const updated = codeBody.substring(0, start) + '  ' + codeBody.substring(end);
          handleCodeBodyChange(updated);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(start + 2, start + 2);
            }
          }, 0);
        }
        return;
      }

      // Handle Backspace on empty code block
      if (e.key === 'Backspace' && codeBody === '') {
        e.preventDefault();
        onBackspaceOnEmpty();
      }
    };

    const lineCount = Math.max(1, codeBody.split('\n').length);

    return (
      <div className="my-2 rounded-2xl border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm overflow-hidden font-mono text-sm animate-fadeIn">
        {/* Typora Code Block Header Bar - Pure macOS Light Theme */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200/90 dark:border-zinc-700 select-none text-xs">
          {/* macOS window controls */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-red-500/80 ring-1 ring-slate-400/20" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-amber-500/80 ring-1 ring-slate-400/20" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-emerald-500/80 ring-1 ring-slate-400/20" />
            <span className="text-[11px] text-slate-600 dark:text-zinc-300 font-semibold ml-2">macOS 纯白代码编辑器</span>
          </div>

          {/* Language Selector & Finish Button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">语言:</span>
            <input
              type="text"
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              placeholder="javascript"
              list="language-suggestions"
              className="w-28 px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-indigo-600 dark:text-indigo-400 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <datalist id="language-suggestions">
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>

            <button
              type="button"
              onClick={() => onFinishBlock?.()}
              className="ml-2 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="完成编辑，生成高亮代码块 (Ctrl+Enter / Esc)"
            >
              <span>✓ 完成渲染</span>
            </button>
          </div>
        </div>

        {/* Typora Code Block Body Area with Line Numbers */}
        <div className="flex items-stretch min-h-[80px] p-2 bg-slate-50/50 dark:bg-zinc-950/60">
          {/* Line Numbers Column */}
          <div className="pr-3 pl-2 py-1 text-right text-slate-400 dark:text-zinc-500 select-none border-r border-slate-200/80 dark:border-zinc-800 text-xs leading-6 font-mono bg-slate-100/40 dark:bg-zinc-900/40">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            ref={textareaRef}
            value={codeBody}
            onChange={(e) => handleCodeBodyChange(e.target.value)}
            onKeyDown={handleCodeKeyDown}
            placeholder="// 在此输入代码... (按 Tab 缩进，Esc / Ctrl+Enter 完成渲染)"
            className="flex-1 pl-3 pr-2 py-1 bg-transparent text-slate-800 dark:text-zinc-100 font-mono text-sm leading-6 focus:outline-none resize-none overflow-hidden placeholder:text-slate-400 dark:placeholder:text-zinc-600"
            autoFocus
          />
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-1.5 bg-slate-100/70 dark:bg-zinc-900 border-t border-slate-200/70 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
          <span>支持 Tab 缩进 / Shift+Tab 反向缩进</span>
          <span>Esc 或 Ctrl+Enter 退出编辑并实时渲染</span>
        </div>
      </div>
    );
  }

  // Regular paragraph block textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;

    // 1. Ctrl+Enter or Cmd+Enter -> Save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave?.();
      return;
    }

    // 2. Tab or Shift+Tab Indentation
    if (e.key === 'Tab') {
      e.preventDefault();

      const textBeforeCursor = value.substring(0, selectionStart);
      const textAfterCursor = value.substring(selectionEnd);
      const lastNewlineIdx = textBeforeCursor.lastIndexOf('\n');
      const lineStartIdx = lastNewlineIdx === -1 ? 0 : lastNewlineIdx + 1;

      if (e.shiftKey) {
        // Outdent: Remove up to 2 spaces from start of line
        const lineBefore = value.substring(0, lineStartIdx);
        const lineText = value.substring(lineStartIdx);
        if (lineText.startsWith('  ')) {
          const newValue = lineBefore + lineText.substring(2);
          onChange(newValue);
          const newPos = Math.max(lineStartIdx, selectionStart - 2);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else if (lineText.startsWith(' ')) {
          const newValue = lineBefore + lineText.substring(1);
          onChange(newValue);
          const newPos = Math.max(lineStartIdx, selectionStart - 1);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      } else {
        // Indent: Add 2 spaces at start of line or at cursor
        const nextNewline = value.indexOf('\n', selectionEnd);
        const lineEndIdx = nextNewline === -1 ? value.length : nextNewline;
        const currentLine = value.substring(lineStartIdx, lineEndIdx);
        const isListOrQuote = /^\s*([-*+]|\d+\.|>)\s/.test(currentLine);

        if (isListOrQuote) {
          const newValue = value.substring(0, lineStartIdx) + '  ' + value.substring(lineStartIdx);
          onChange(newValue);
          const newPos = selectionStart + 2;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else {
          const newValue = textBeforeCursor + '  ' + textAfterCursor;
          onChange(newValue);
          const newPos = selectionStart + 2;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      }
      return;
    }

    // 3. Enter key handling (Auto-list, Auto-quote, Code block fence, New paragraph)
    if (e.key === 'Enter' && !e.shiftKey) {
      const textBeforeCursor = value.substring(0, selectionStart);
      const textAfterCursor = value.substring(selectionEnd);
      const lastNewlineIdx = textBeforeCursor.lastIndexOf('\n');
      const lineStartIdx = lastNewlineIdx === -1 ? 0 : lastNewlineIdx + 1;
      const currentLine = textBeforeCursor.substring(lineStartIdx);

      // Case 3A: Code block trigger (``` or ```lang)
      const codeFenceTriggerMatch = currentLine.match(/^\s*```([a-zA-Z0-9_-]*)\s*$/);
      if (codeFenceTriggerMatch) {
        e.preventDefault();
        const lang = codeFenceTriggerMatch[1] || 'javascript';
        const codeBlockTemplate = `\`\`\`${lang}\n\n\`\`\``;
        onChange(codeBlockTemplate);
        return;
      }

      // Case 3B: Task list item (- [ ] item or - [x] item)
      const taskListMatch = currentLine.match(/^(\s*)([-*+])\s+\[([ xX])\]\s*(.*)$/);
      if (taskListMatch) {
        e.preventDefault();
        const indent = taskListMatch[1];
        const bullet = taskListMatch[2];
        const contentStr = taskListMatch[4];

        if (contentStr.trim() === '') {
          // Exit task list mode
          const beforeLine = value.substring(0, lineStartIdx);
          const newValue = beforeLine + indent + textAfterCursor;
          onChange(newValue);
          const newPos = lineStartIdx + indent.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else {
          // Continue task list item
          const prefix = `\n${indent}${bullet} [ ] `;
          const newValue = textBeforeCursor + prefix + textAfterCursor;
          onChange(newValue);
          const newPos = selectionStart + prefix.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }

      // Case 3C: Bullet list item (- item, * item, + item)
      const bulletListMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
      if (bulletListMatch) {
        e.preventDefault();
        const indent = bulletListMatch[1];
        const bullet = bulletListMatch[2];
        const contentStr = bulletListMatch[3];

        if (contentStr.trim() === '') {
          // Exit list mode
          const beforeLine = value.substring(0, lineStartIdx);
          const newValue = beforeLine + indent + textAfterCursor;
          onChange(newValue);
          const newPos = lineStartIdx + indent.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else {
          // Continue bullet list item
          const prefix = `\n${indent}${bullet} `;
          const newValue = textBeforeCursor + prefix + textAfterCursor;
          onChange(newValue);
          const newPos = selectionStart + prefix.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }

      // Case 3D: Numbered list item (1. item)
      const numberedListMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numberedListMatch) {
        e.preventDefault();
        const indent = numberedListMatch[1];
        const num = parseInt(numberedListMatch[2], 10);
        const contentStr = numberedListMatch[3];

        if (contentStr.trim() === '') {
          // Exit numbered list mode
          const beforeLine = value.substring(0, lineStartIdx);
          const newValue = beforeLine + indent + textAfterCursor;
          onChange(newValue);
          const newPos = lineStartIdx + indent.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else {
          // Auto increment number
          const prefix = `\n${indent}${num + 1}. `;
          const newValue = textBeforeCursor + prefix + textAfterCursor;
          onChange(newValue);
          const newPos = selectionStart + prefix.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }

      // Case 3E: Blockquote (> quote)
      const quoteMatch = currentLine.match(/^(\s*)>\s*(.*)$/);
      if (quoteMatch) {
        e.preventDefault();
        const indent = quoteMatch[1];
        const contentStr = quoteMatch[2];

        if (contentStr.trim() === '') {
          // Exit blockquote mode
          const beforeLine = value.substring(0, lineStartIdx);
          const newValue = beforeLine + indent + textAfterCursor;
          onChange(newValue);
          const newPos = lineStartIdx + indent.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else {
          // Continue blockquote
          const prefix = `\n${indent}> `;
          const newValue = textBeforeCursor + prefix + textAfterCursor;
          onChange(newValue);
          const newPos = selectionStart + prefix.length;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }

      // Case 3F: Horizontal rule (---, ***, ___)
      const hrMatch = currentLine.match(/^\s*(---|\*\*\*|___)\s*$/);
      if (hrMatch) {
        e.preventDefault();
        onEnterKey();
        return;
      }

      // Case 3G: Cursor at end of block or creating a new paragraph block
      if (selectionEnd === value.length) {
        e.preventDefault();
        onEnterKey();
        return;
      } else {
        // Multi-line newline inside current block
        e.preventDefault();
        const newValue = textBeforeCursor + '\n' + textAfterCursor;
        onChange(newValue);
        const newPos = selectionStart + 1;
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
        return;
      }
    }

    // 4. Backspace on empty block
    if (e.key === 'Backspace' && value === '') {
      e.preventDefault();
      onBackspaceOnEmpty();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={(e) => {
        handleClipboardImagePaste(e, (dataUrl, altName) => {
          const cleanUrl = dataUrl.replace(/[\r\n]+/g, '');
          const cleanAlt = (altName || '粘贴图片').replace(/[\]\[\r\n]/g, '').trim();
          onChange(`${value}\n\n![${cleanAlt}](${cleanUrl})\n\n`);
        });
      }}
      placeholder="输入 Markdown... (支持 # 标题，- 列表，```代码块，支持直接 Ctrl+V 粘贴本地图片)"
      className={`w-full bg-transparent text-slate-900 dark:text-zinc-100 font-sans ${fontSizeClass} focus:outline-none resize-none overflow-hidden`}
      autoFocus
    />
  );
};

