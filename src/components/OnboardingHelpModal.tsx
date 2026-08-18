import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileText,
  Link,
  Hash,
  FolderKanban,
  Download,
  HelpCircle,
  Play,
} from 'lucide-react';

interface OnboardingHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const OnboardingHelpModal: React.FC<OnboardingHelpModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Typora 风格所见即所得体验',
      badge: '第一步：极致书写',
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      color: 'from-indigo-500 to-blue-500',
      description:
        ' FloveNote 支持类似 Typora 的极简 Markdown 实时渲染。输入 # 标题、*斜体*、**粗体** 或 - 任务列表，即可自动美化展现。',
      highlights: [
        '按回车自动创建下一块段落/列表',
        '支持快捷键 Ctrl+B/I/K 快速设置格式',
        '全屏专注模式与沉浸式沉淀思考',
      ],
      codeSample: '# 欢迎体验 FloveNote\n- [x] 极简界面\n- [ ] 知识链条',
    },
    {
      title: '双向链接网状知识库 (`[[双链]]`)',
      badge: '第二步：知识交织',
      icon: <Link className="w-6 h-6 text-violet-500" />,
      color: 'from-violet-500 to-purple-500',
      description:
        '在编辑器或快速发布框中输入 [[笔记标题]] 即可创建反向链接卡片。点击高亮的双链文本可瞬间穿梭至目标笔记！',
      highlights: [
        '自动联想已有的笔记标题',
        '卡片底座展示被引用的双链出处',
        '双链图谱助力构建个人数字花园',
      ],
      codeSample: '在思考中关联 [[项目想法]] 与 [[阅读心得]]',
    },
    {
      title: '智能 `#标签` 系统与拖拽打标签',
      badge: '第三步：灵活归类',
      icon: <Hash className="w-6 h-6 text-emerald-500" />,
      color: 'from-emerald-500 to-teal-500',
      description:
        '直接在正文中输入 #标签名，FloveNote 会自动提取并分类到左侧边栏。你还可以把笔记卡片直接拖拽到侧边栏标签上完成一秒打标签！',
      highlights: [
        '正文内自动高亮点击 #标签',
        '支持卡片鼠标拖拽至左侧标签直接打标',
        '一键合并与清理废弃标签',
      ],
      codeSample: '写下今天的状态 #工作日志 #闪念灵感',
    },
    {
      title: '本地相对路径 `.src/` 图片库',
      badge: '第四步：资源管家',
      icon: <FolderKanban className="w-6 h-6 text-amber-500" />,
      color: 'from-amber-500 to-orange-500',
      description:
        '插入的本地图片会自动转换为相对路径 `.src/img_xxxx.png` 存储。即使离线或将笔记移动到 Obsidian / Logseq / Typora 中也能保持图片路径完整！',
      highlights: [
        '支持 Ctrl+V 剪贴板截图直接粘贴',
        '资源管理器汇总所有 `.src/` 嵌入资源',
        '双击图片可无限放大与顺时针旋转',
      ],
      codeSample: '![思维导图](.src/img_20260811_idea.png)',
    },
    {
      title: '极简长图导出与全量备份',
      badge: '第五步：沉淀分享',
      icon: <Download className="w-6 h-6 text-rose-500" />,
      color: 'from-rose-500 to-pink-500',
      description:
        '满意你的文字后，可以一键将其生成优雅排版的 PNG 高清长图分享至微信/小红书/微博，也可以随时导出 Markdown 与 JSON 全量数据备份。',
      highlights: [
        '一键转换为精致社交长图',
        '自动适配日间/夜间暗黑主题导出',
        '数据纯本地存储，绝不泄露隐私',
      ],
      codeSample: '导出长图 · Markdown · JSON 格式备份',
    },
    {
      title: '实战案例文档库与最佳范式',
      badge: '第六步：实战进阶',
      icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
      color: 'from-indigo-500 to-violet-600',
      description:
        '在系统设置中的「帮助与新手引导」内置了 4 篇精选实战案例文档，包含深度 Markdown 排版、LaTeX 公式、敏捷周报与卡片盒双链实践，支持一键导入与参考！',
      highlights: [
        '内置 4 套真实场景实战示范文档',
        '支持 Markdown 源码实时预览与复制',
        '一键导入到个人笔记工作区',
      ],
      codeSample: '系统设置 -> 帮助与新手引导 -> 实战案例文档库',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (onShowToast) onShowToast('恭喜完成新手学习！开启高效笔记之旅吧 ✨', 'success');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base flex items-center gap-2">
                <span>新手快速上手指南</span>
                <span className="text-[10px] font-mono font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {currentStep + 1} / {steps.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">掌握 FloveNote 核心效率技巧</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 shrink-0">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Card Step Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Step Badge & Icon */}
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-gradient-to-tr ${currentStepData.color} text-white shadow-md`}>
              {currentStepData.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 font-mono">
                {currentStepData.badge}
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {currentStepData.title}
              </h4>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-xs">
            {currentStepData.description}
          </p>

          {/* Code or Markdown snippet display */}
          <div className="p-3 bg-slate-900 dark:bg-zinc-950 text-indigo-300 rounded-xl font-mono text-[11px] border border-slate-800 dark:border-zinc-800 shadow-inner">
            <div className="text-[9px] text-slate-500 mb-1 flex items-center justify-between">
              <span>MARKDOWN 示例预览</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed">{currentStepData.codeSample}</pre>
          </div>

          {/* Key highlights list */}
          <div className="space-y-2 pt-1">
            <p className="font-bold text-slate-700 dark:text-zinc-200 text-xs">核心亮点功能：</p>
            <ul className="space-y-1.5">
              {currentStepData.highlights.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一步</span>
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                    : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span>{currentStep === steps.length - 1 ? '开启体验' : '下一步'}</span>
            {currentStep === steps.length - 1 ? <Play className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
