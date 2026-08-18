import React, { useState } from 'react';
import { TagInfo } from '../types';
import { Hash, Edit3, Merge, Trash2, X, Check } from 'lucide-react';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagInfo[];
  onRenameTag: (oldTag: string, newTag: string) => void;
  onMergeTags: (sourceTag: string, targetTag: string) => void;
  onDeleteTag: (tag: string) => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  tags,
  onRenameTag,
  onMergeTags,
  onDeleteTag,
}) => {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  const [mergingTag, setMergingTag] = useState<string | null>(null);
  const [targetMergeTag, setTargetMergeTag] = useState('');

  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartRename = (tag: string) => {
    setEditingTag(tag);
    setRenameInputValue(tag);
    setMergingTag(null);
    setDeletingTag(null);
  };

  const handleConfirmRename = (oldTag: string) => {
    const clean = renameInputValue.replace(/^#/, '').trim();
    if (clean && clean !== oldTag) {
      onRenameTag(oldTag, clean);
    }
    setEditingTag(null);
  };

  const handleStartMerge = (tag: string) => {
    setMergingTag(tag);
    setTargetMergeTag('');
    setEditingTag(null);
    setDeletingTag(null);
  };

  const handleConfirmMerge = (sourceTag: string) => {
    const cleanTarget = targetMergeTag.replace(/^#/, '').trim();
    if (cleanTarget && cleanTarget !== sourceTag) {
      onMergeTags(sourceTag, cleanTarget);
    }
    setMergingTag(null);
  };

  const handleConfirmDelete = (tag: string) => {
    onDeleteTag(tag);
    setDeletingTag(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100">标签管理</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">重命名、合并或从笔记中批量删除标签</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tag List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {tags.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
              暂无任何标签，在笔记正文中输入 <code className="text-indigo-500 font-semibold">#标签名</code> 即可自动生成
            </div>
          ) : (
            tags.map((tagObj) => {
              const tag = tagObj.name;
              const isEditing = editingTag === tag;
              const isMerging = mergingTag === tag;
              const isDeleting = deletingTag === tag;

              return (
                <div
                  key={tag}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col gap-2 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/40">
                        #{tag}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500 shrink-0">
                        {tagObj.count} 条笔记
                      </span>
                    </div>

                    {!isEditing && !isMerging && !isDeleting && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartRename(tag)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          title="重命名标签"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>重命名</span>
                        </button>
                        <button
                          onClick={() => handleStartMerge(tag)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          title="合并到其他标签"
                        >
                          <Merge className="w-3.5 h-3.5" />
                          <span>合并</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeletingTag(tag);
                            setEditingTag(null);
                            setMergingTag(null);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                          title="删除标签"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>删除</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rename Form */}
                  {isEditing && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                      <input
                        type="text"
                        value={renameInputValue}
                        onChange={(e) => setRenameInputValue(e.target.value)}
                        placeholder="新标签名"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleConfirmRename(tag)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> 确认
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="px-2 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-xs"
                      >
                        取消
                      </button>
                    </div>
                  )}

                  {/* Merge Form */}
                  {isMerging && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-stone-200/60 dark:border-zinc-700/60">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        将 <strong>#{tag}</strong> 合并到目标标签（笔记中的标签将被替换）：
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          value={targetMergeTag}
                          onChange={(e) => setTargetMergeTag(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">选择要合并到的目标标签...</option>
                          {tags
                            .filter((t) => t.name !== tag)
                            .map((t) => (
                              <option key={t.name} value={t.name}>
                                #{t.name} ({t.count} 条)
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleConfirmMerge(tag)}
                          disabled={!targetMergeTag}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          合并
                        </button>
                        <button
                          onClick={() => setMergingTag(null)}
                          className="px-2 py-1.5 text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg text-xs"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation */}
                  {isDeleting && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60 dark:border-zinc-700/60 text-xs text-rose-600 dark:text-rose-400">
                      <span>确定移除 #{tag} 标签？（不会删除笔记内容，仅从正文中移除标签）</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleConfirmDelete(tag)}
                          className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium"
                        >
                          确认删除
                        </button>
                        <button
                          onClick={() => setDeletingTag(null)}
                          className="px-2 py-1 text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 dark:bg-zinc-950/50 border-t border-stone-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 text-xs font-medium rounded-xl transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
