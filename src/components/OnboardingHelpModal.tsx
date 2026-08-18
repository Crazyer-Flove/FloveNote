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
  Cloud,
  FolderKanban,
  Download,
  HelpCircle,
  Play,
  Command,
  Flame,
  HardDrive,
  Check,
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
      title: 'Typora 风格所见即所得与 KaTeX 公式',
      badge: '第一步：极致输入',
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      color: 'from-indigo-500 to-blue-500',
      description:
        'FloveNote 支持极简 Markdown 实时渲染。输入 # 标题、*斜体*、**粗体**、- [ ] 交互式待办任务列表，以及 $E=mc^2$ 与多行矩阵数学公式，即可即时美化呈现。',
      highlights: [
        '即时渲染标题、多语言代码高亮与 KaTeX 数学公式',
        '交互式待办任务项，点击复选框即时更新正文状态',
        '支持 Ctrl+B/I/Z/Y 等经典编辑器快捷键',
      ],
      codeSample: '# 欢迎体验 FloveNote\n- [x] 极简时间轴记录\n$$ \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi} $$',
    },
    {
      title: '双向链接网状知识库 (`[[双链]]`)',
      badge: '第二步：知识交织',
      icon: <Link className="w-6 h-6 text-violet-500" />,
      color: 'from-violet-500 to-purple-500',
      description:
        '在编辑器或顶部快捷发布框中输入 [[笔记标题]] 即可创建原子卡片级双向链接。卡片底部自动计算出所有反向引用出处，点击链接瞬间高亮穿梭！',
      highlights: [
        '自动联想补全已有笔记标题与别名',
        '卡片底座智能解析反向链接 (Backlinks) 与引用来源',
        '践行卢曼卡片盒笔记法，彻底告别孤立知识点',
      ],
      codeSample: '在思考中交织 [[架构设计思路]] 与 [[项目研发周报]]',
    },
    {
      title: '智能 `#标签`、标签云与批量管理',
      badge: '第三步：立体归类',
      icon: <Cloud className="w-6 h-6 text-emerald-500" />,
      color: 'from-emerald-500 to-teal-500',
      description:
        '正文中键入 #标签名 自动提取分类。支持可视化「标签云全景图」按使用频率自适应缩放字号，支持侧边栏拖拽打标、标签一键重命名、合并与全量清空。',
      highlights: [
        '正文内自动提取 #标签，支持卡片鼠标拖拽至左侧标签直接打标',
        '动态标签云 (Tag Cloud)：字号直观映射笔记关联热度，内置多套配色',
        '标签管理面板支持一键重命名、多标签合并与一键安全清空',
      ],
      codeSample: '记录今天的闪念与复盘 #工作/周报 #深度思考 #架构',
    },
    {
      title: '本地电脑工作区与原生文件夹目录绑定',
      badge: '第四步：原生存储',
      icon: <HardDrive className="w-6 h-6 text-amber-500" />,
      color: 'from-amber-500 to-orange-500',
      description:
        '通过浏览器原生 File System Access API 直连电脑任意物理目录（如 ~/Documents/FloveNote），自动映射 Notes 正文、.src/ 媒体资源与 Backups 快照目录。',
      highlights: [
        '直连本地物理文件夹，一键即时同步写入磁盘与扫描导入',
        '图片媒体自动存储至 .src/ 相对路径，与 Obsidian / Typora 100% 互通',
        '支持创建与切换多工作区，每个工作区独立隔离物理路径',
      ],
      codeSample: 'Notes/ (正文 Markdown) + .src/ (本地图片) + Backups/ (快照)',
    },
    {
      title: '7 色社交卡片长图与免打印矢量 PDF 导出',
      badge: '第五步：高赞分享',
      icon: <Download className="w-6 h-6 text-rose-500" />,
      color: 'from-rose-500 to-pink-500',
      description:
        '提供极简流光、日落霞光、复古羊皮纸、深邃夜空等 7 款精美调色盘，一键生成像素级高清社交长图复制到剪贴板，或直接导出高质量分页矢量 PDF。',
      highlights: [
        '7 款设计师精心调优配色方案与高保真矢量排版',
        '一键复制卡片图片至剪贴板，秒发微信 / 小红书 / 即刻 / Slack',
        '直接导出免浏览器打印弹窗的高清矢量分页 PDF',
      ],
      codeSample: '一键生成高赞卡片长图 · 矢量 PDF · Markdown ZIP 全量备份',
    },
    {
      title: '全局命令面板 (`Cmd+K`) 与效率快捷键',
      badge: '第六步：极速驾驭',
      icon: <Command className="w-6 h-6 text-cyan-500" />,
      color: 'from-cyan-500 to-blue-600',
      description:
        '按下 Ctrl+K (Windows) 或 Cmd+K (Mac) 即可唤起万能命令面板，支持拼音模糊搜索笔记、视图切换、触发全屏专注模式、执行标签云与系统偏好配置。',
      highlights: [
        'Ctrl+K / Cmd+K：秒级呼出全局命令面板与全文模糊检索',
        'Ctrl+N：快速新建笔记；Ctrl+Enter：保存并即时发布',
        'Ctrl+Z / Ctrl+Y：毫秒级历史时光机增量回退与重做',
      ],
      codeSample: 'Cmd+K 唤起搜索面板 · 键盘上下键极速导航 · Enter 立即执行',
    },
    {
      title: '沉浸专注写作与打卡贡献热力图',
      badge: '第七步：习惯养成',
      icon: <Flame className="w-6 h-6 text-orange-500" />,
      color: 'from-orange-500 to-amber-500',
      description:
        '提供无干扰全屏专注模式，配合 GitHub 风格的全年写作打卡热力图，精准追踪每日记录字数、活跃天数与连续创作打卡，让持续思考看得见。',
      highlights: [
        '全屏 Focus Mode 纯净无干扰打字机视野',
        'GitHub 风格写作热力图，直观呈现年度写作活跃度',
        '支持点击热力图具体日期卡片，一秒定位当天所有笔记',
      ],
      codeSample: '今日已完成 1,280 字 · 连续打卡 14 天 · 保持思考的心流状态',
    },
    {
      title: '实战案例文档库与零门槛导入',
      badge: '第八步：进阶实践',
      icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
      color: 'from-indigo-500 to-violet-600',
      description:
        '系统内置 4 篇高水准实战案例文档，覆盖 Markdown 排版全景、KaTeX 公式手册、敏捷研发周报与个人卡片盒第二大脑，随时供您参考或一键导入个人笔记库！',
      highlights: [
        '内置 4 套专业场景实战示范文档，支持实时预览与源码复制',
        '一键导入到当前工作区，零冗余干净体验与丰富示范兼备',
        '随时在「系统设置 -> 帮助与新手引导」中重温与查阅',
      ],
      codeSample: '系统设置 -> 帮助与新手引导 -> 实战案例文档库 -> 一键导入',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (onShowToast) onShowToast('恭喜完成新手导览！开启您的高效笔记与知识沉淀之旅吧 ✨', 'success');
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
              <p className="text-xs text-slate-500 dark:text-zinc-400">掌握 FloveNote 核心效率黑科技</p>
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
