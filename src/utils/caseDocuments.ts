import { Note } from '../types';

export interface CaseDocumentItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  badge: string;
  icon: string;
  content: string;
  tags: string[];
}

export const SAMPLE_CASE_DOCUMENTS: CaseDocumentItem[] = [
  {
    id: 'case-markdown-mastery',
    title: '✨ FloveNote 全功能与 Markdown 深度排版实战指南',
    category: '语法与功能全景',
    tagline: '标题、列表、代码高亮、KaTeX 公式、表格、双链与智能标签全覆盖',
    badge: '实战案例 01',
    icon: '✨',
    tags: ['FloveNote', '教程/指南', 'Markdown'],
    content: `# ✨ FloveNote 全功能与 Markdown 深度排版实战指南

欢迎使用 **FloveNote** 极简 Markdown 时间轴笔记系统！本案例文档展示了 FloveNote 所支持的全部核心排版特性与互动能力。

---

### 一、 实时所见即所得体验
在编辑器中直接书写 Markdown 标记，随时敲击回车或切换光标，排版即刻呈现：
- **强调与高亮**：支持 **加粗文本**、*斜体文本*、~~删除线~~ 以及 \`行内代码 (Inline Code)\`
- **任务清单 (Task Lists)**：
  - [x] 搭建本地时间轴流式笔记
  - [x] 支持 Typora 级即时渲染
  - [x] 深度集成 KaTeX LaTeX 数学公式与高亮代码块
  - [ ] 构建个人多维知识网状图谱

---

### 二、 双向链接与智能标签
- **网状双链**：在正文中输入 \`[[知识管理/第二大脑]]\` 或 \`[[敏捷研发项目周报]]\`，即可自动生成双向链接。在卡片底部自动展示被引用出处，点击即刻穿梭跳转！
- **智能标签**：正文中直接键入 \`#标签名\`（如 #FloveNote #教程/指南 #Markdown），系统会自动提取并汇总至左侧分类树。

---

### 三、 📐 LaTeX / KaTeX 数学公式支持
支持行内公式与多行块级公式无缝渲染：
1. **爱因斯坦质能方程 (行内)**：$E = mc^2$
2. **高斯正态分布积分 (块级)**：
$$ \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi} $$
3. **欧拉恒等式与极限**：
$$ e^{i\\pi} + 1 = 0 \\quad \\text{且} \\quad \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1 $$

---

### 四、 💻 多语言代码块与 macOS 风格窗口
\`\`\`typescript
import { useState, useEffect } from 'react';

// FloveNote 响应式状态管理示例
export function useTimelineNotes(workspaceId: string) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    console.log('工作区切换，已就绪:', workspaceId);
  }, [workspaceId]);

  return { notes, count: notes.length };
}
\`\`\`

---

### 五、 📊 响应式 Markdown 表格对比
| 特性维度 | FloveNote 极简笔记 | 传统重型富文本编辑器 |
| :--- | :--- | :--- |
| **排版效率** | ⚡ **极速**（纯键盘无干扰输入） | 🐢 慢（需频繁使用鼠标点击格式栏） |
| **数据自由度** | 🌐 **开放**（纯文本 .md / JSON 备份） | 🔒 封闭（依赖专有云端数据库） |
| **资源存储** | 📂 **本地相对路径** \`.src/\` 兼容 Obsidian | ☁️ 远端图床，断网或过期无法访问 |
| **卡片分享** | 🎨 **一键导出高赞长图与高清 PDF** | 📄 仅支持普通白底打印 |

> 💡 **小贴士**：点击卡片底部的「导出卡片」图标，可将此篇笔记一键渲染为 7 种不同配色的高赞长图或高清 PDF 进行分享！`,
  },
  {
    id: 'case-agile-sprint-review',
    title: '💼 敏捷研发项目周报与系统架构复盘',
    category: '职场与研发实战',
    tagline: '周报总结、完成项核对、系统性能基准与下周计划拆解',
    badge: '实战案例 02',
    icon: '💼',
    tags: ['工作/周报', '架构设计', '敏捷开发'],
    content: `# 💼 敏捷研发项目周报与系统架构复盘

- **周期**：2026 年第 33 周 (Sprint #14)
- **主导负责人**：FloveNote 核心研发组
- **状态评估**：🟢 正常推进 (On Track)

---

### 🚀 本周主要交付成果 (Delivered)
- [x] **前端性能重构**：将虚拟长列表 DOM 节点开销降低 42%
- [x] **多工作区隔离**：完成「默认工作区」、「工作与项目」、「研习与灵感」三层本地路径映射
- [x] **历史快照回滚**：编辑过程中每 3 秒自动记录增量快照，支持可视化对比与一键恢复
- [x] **批量导出模块**：支持一次性将所选笔记打包导出为 Markdown、JSON、HTML 与纯文本

---

### ⚡ 核心架构指标对比
\`\`\`bash
# 客户端编译与启动耗时基准测试
[FloveNote Engine v2.4.0]
  ├── 首屏冷启动渲染: 38ms (提升 65%)
  ├── 10,000 字大文档即时渲染: 12ms
  └── 导出 4K 高清卡片生成耗时: 180ms
\`\`\`

| 模块名称 | 测试用例覆盖率 | 内存峰值消耗 | 状态 |
| :--- | :--- | :--- | :--- |
| **Typora 编辑器** | 98.5% | 14.2 MB | ✅ 稳定 |
| **双向链接解析器** | 100% | 4.8 MB | ✅ 极速 |
| **本地资源管家** | 96.0% | 8.1 MB | ✅ 良好 |

---

### 🎯 下周工作规划 (Next Sprint)
1. 完善跨平台快捷键支持，支持自定义键盘映射
2. 增加基于时间轴的多维度统计分析报告与导出图表
3. 优化小红书/即刻风格双列社交分享长图模版

> 🌟 **复盘金句**：代码是思想的实体化，清晰的笔记则是架构演进的导航灯。`,
  },
  {
    id: 'case-zettelkasten-method',
    title: '🧠 卡片盒笔记法 (Zettelkasten) 与个人第二大脑实践',
    category: '知识管理与思考',
    tagline: '从闪念灵感、文献萃取到永久笔记，利用双链构建网状知识森林',
    badge: '实战案例 03',
    icon: '🧠',
    tags: ['知识管理/第二大脑', '思考/方法论', '卡片盒'],
    content: `# 🧠 卡片盒笔记法 (Zettelkasten) 与个人第二大脑实践

在信息爆炸的时代，如何让记录的知识彼此产生**化学反应**？

---

### 一、 卡片笔记的三层演进模型
1. **闪念笔记 (Fleeting Notes)**：
   随时在顶部的快捷发布框中记录脑海中的灵光一闪，不求完美，但求及时捕捉。
2. **文献笔记 (Literature Notes)**：
   阅读书籍或文章时，用自己的话重新转述核心论点，并打上对应标签，如 \`#读书笔记\`。
3. **永久笔记 (Permanent Notes)**：
   提炼出能够独立存在的概念卡片，并通过 \`[[双向链接]]\` 将其穿插到现有的知识树中。

---

### 二、 网状知识链接示例
在思考本主题时，我们可以关联：
- 关联思考：[[FloveNote 全功能与 Markdown 深度排版实战指南]]
- 核心参考：[[纳瓦尔宝典读书摘录]]

> 📌 **卢曼核心理念**：
> "不要试图把卡片塞进一个固定的层级文件夹里。给每张卡片打上标签，并用双向链接连接到其他相关的卡片上。时间一长，卡片之间会自发涌现出你未曾预料到的深刻关联。"

---

### 三、 数字化工作流三步法
\`\`\`text
[随时随地输入闪念] ──> [定期归并打上 #标签] ──> [使用 [[双链]] 建立关联] ──> [网状知识大爆炸]
\`\`\`

- [x] 保持每张卡片专注于一个原子概念（Atomicity）
- [x] 多用自己的话总结，拒绝机械复制粘贴
- [x] 定期使用热力图回顾本周知识输入与输出节奏`,
  },
  {
    id: 'case-social-card-showcase',
    title: '🎨 高赞社交媒体精美卡片与长图排版心得',
    category: '排版美学与分享',
    tagline: '多款设计主题、优雅字体间距、一键复制图片与无损保存',
    badge: '实战案例 04',
    icon: '🎨',
    tags: ['排版设计', '灵感分享', '美学'],
    content: `# 🎨 高赞社交媒体精美卡片与长图排版心得

将一段深刻的文字，转换为让人眼前一亮的高清社交卡片，只需点击笔记下方的「导出卡片」！

---

### 🌈 7 种精选卡片视觉主题
1. **极简流光 (Minimalist)**：黑白灰素雅格调，适合极简技术与思想沉淀
2. **日落霞光 (Sunset)**：暖橙渐变霞光，适合生活美学与旅行手账
3. **深邃夜空 (Midnight)**：暗黑赛博夜空，极具未来科技感与沉浸感
4. **复古羊皮纸 (Parchment)**：经典暖黄怀旧质感，适合古籍摘录与哲学思辨
5. **拍立得画框 (Polaroid)**：拟真白色画框立体投影，文艺气息扑面而来
6. **清新薄荷 (Mint)**：青翠薄荷渐变，传递自然、平静与治愈
7. **梦幻薰衣草 (Lavender)**：淡雅丁香紫调，浪漫优雅的文字归宿

---

### 📝 金句摘录与排版示范
> "种一棵树最好的时间是十年前，其次是现在。"
> 
> "你生命中所有真正的回报，无论是财富、关系还是知识，都来自**复利效应**。" —— 《纳瓦尔宝典》

---

### ⚡ 导出实用技巧
- **自定义作者署名**：在导出面板中可随意定制个性化签名（如 "Flove 的思考备忘录"）
- **字数与日期徽章**：自动计算正文净字数与发布时间
- **免打印直接导出 PDF**：内置高精度 PDF 生成引擎，矢量文字清晰锐利！`,
  },
];

export function convertCaseItemToNote(item: CaseDocumentItem, workspaceId = 'default'): Note {
  const now = Date.now();
  return {
    id: `note-${item.id}-${Date.now()}`,
    workspaceId,
    content: item.content,
    tags: [...item.tags],
    createdAt: now,
    updatedAt: now,
    isPinned: item.id === 'case-markdown-mastery',
    isFavorite: true,
  };
}
