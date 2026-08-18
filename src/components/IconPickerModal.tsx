import React, { useState } from 'react';
import { X, Search, Smile, Briefcase, Sparkles, Heart, Hash, Check } from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconStr: string) => void;
}

interface EmojiGroup {
  category: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EMOJI_GROUPS: EmojiGroup[] = [
  {
    category: '常用与表情',
    icon: <Smile className="w-4 h-4 text-amber-500" />,
    emojis: [
      '💡', '✨', '🔥', '🚀', '📌', '📝', '⚡', '🎯', '☕', '🌟',
      '🎨', '📚', '🏆', '💬', '❤️', '👍', '⚙️', '🔍', '📅', '📁',
      '😊', '🥳', '🤔', '😎', '✍️', '🙌', '🎉', '🍀', '💎', '🌈',
    ],
  },
  {
    category: '工作与学习',
    icon: <Briefcase className="w-4 h-4 text-indigo-500" />,
    emojis: [
      '📊', '📅', '📑', '📂', '💻', '🛠️', '🎯', '✍️', '📖', '📐',
      '✏️', '🏷️', '🔑', '🔒', '📮', '📤', '📥', '🗂️', '🔍', '🔬',
      '🎓', '💼', '📈', '📋', '🖊️', '🖥️', '⌨️', '🔋', '⚙️', '🛡️',
    ],
  },
  {
    category: '灵感与创意',
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    emojis: [
      '💡', '✨', '🎨', '🎬', '🎵', '🎧', '📷', '🌌', '🌈', '🔮',
      '🎭', '🚀', '⚡', '💎', '🌺', '🎨', '🎪', '🎤', '🎷', '🎸',
      '🛸', '🪐', '🎇', '🌠', '🧩', '🧪', '🔭', '📡', '🕹️', '🎲',
    ],
  },
  {
    category: '生活与健康',
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    emojis: [
      '☕', '🍵', '🍎', '🍕', '🏃‍♂️', '🚴‍♀️', '🏋️‍♂️', '🧘‍♀️', '🪴', '🌿',
      '☀️', '🌙', '✈️', '🚗', '🏔️', '🏖️', '🏕️', '🏡', '🐶', '🐱',
      '🌸', '🌻', '🍔', '🍣', '🍦', '🍷', '⚽', '🏀', '🎾', '🎧',
    ],
  },
  {
    category: '标记与状态',
    icon: <Hash className="w-4 h-4 text-emerald-500" />,
    emojis: [
      '✅', '❌', '❓', '❗', '⚠️', '➡️', '⬅️', '⬆️', '⬇️', '⭐️',
      '🌟', '🔴', '🟢', '🔵', '🟣', '⬛', '⬜', '🚩', '🏁', '🆔',
      '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '🅰️', '🅱️', '🆒', '🆕', '🆓',
    ],
  },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('常用与表情');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePick = (emoji: string) => {
    onSelectIcon(emoji);
    setCopiedIcon(emoji);
    setTimeout(() => {
      setCopiedIcon(null);
      onClose();
    }, 200);
  };

  const filteredGroups = EMOJI_GROUPS.map((group) => {
    if (!searchKeyword.trim()) return group;
    const filtered = group.emojis.filter((e) => e.includes(searchKeyword.trim()));
    return { ...group, emojis: filtered };
  }).filter((g) => g.emojis.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
              选择丰富图标与 Emoji
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索表情符号..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 border-none text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!searchKeyword && (
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 overflow-x-auto text-xs shrink-0">
            {EMOJI_GROUPS.map((group) => {
              const isActive = group.category === activeCategory;
              return (
                <button
                  key={group.category}
                  onClick={() => setActiveCategory(group.category)}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {group.icon}
                  <span>{group.category}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Emoji Grid List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar min-h-[220px]">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              未找到匹配图标表情
            </div>
          ) : (
            filteredGroups
              .filter((g) => searchKeyword || g.category === activeCategory)
              .map((group) => (
                <div key={group.category} className="space-y-2">
                  {searchKeyword && (
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      {group.icon}
                      <span>{group.category}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {group.emojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        onClick={() => handlePick(emoji)}
                        className={`p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:scale-110 active:scale-95 transition-all text-xl flex items-center justify-center border ${
                          copiedIcon === emoji
                            ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/50'
                            : 'border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-800/40'
                        }`}
                        title="点击插入此表情"
                      >
                        {copiedIcon === emoji ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          emoji
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
