<div align="center">

# ✨ FloveNote

### 极简现代化 Markdown 时间轴笔记与个人第二大脑知识系统

<p align="center">
  <strong>像记录动态一样捕捉灵感 · 像维基百科一样构建双链知识森林 · 一键导出高赞社交长图与高清 PDF</strong>
</p>

[![GitHub stars](https://img.shields.io/github/stars/Crazyer-Flove/FloveNote?style=for-the-badge&logo=github&color=6366f1)](https://github.com/Crazyer-Flove/FloveNote/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Crazyer-Flove/FloveNote?style=for-the-badge&logo=github&color=8b5cf6)](https://github.com/Crazyer-Flove/FloveNote/network/members)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

[在线体验](https://github.com/Crazyer-Flove/FloveNote) · [提交 Issue 建议](https://github.com/Crazyer-Flove/FloveNote/issues) · [更新日志](https://github.com/Crazyer-Flove/FloveNote/releases) · [赞赏支持](#-赞赏作者--sponsor)

---

</div>

## 📖 项目简介 (Introduction)

**FloveNote** 是一款为创作者、开发者与思考者量身打造的**极简主义流式 Markdown 时间轴笔记系统**。

在传统笔记软件中，我们常常被繁琐的文件夹层级分类、复杂的排版菜单和封闭的专有格式所束缚。FloveNote 重新回归记录的初心——**以时间轴为流，以双向链接为网，以纯粹 Markdown 为核**。无需构思复杂的目录架构，随手敲下灵感，系统自动编排流式时间轴，并支持构建原子级卡片双向网状图谱。

---

## 🌟 核心亮点特性 (Key Features)

### 1. ⏱️ 流式时间轴记录 (Timeline Stream)
- 像在社交平台发布动态一样顺畅自然，顶层即输即发。
- 自动按**今日、昨日、本周、按月**智能归集编排。
- 支持按热度、修改时间、发布时间、纯文本全文即时检索与日期跨度筛选。

### 2. ✍️ Typora 级 Live Markdown 实时渲染
- 纯键盘优先，支持加粗 `**Text**`、斜体 `*Text*`、删除线 `~~Text~~`、高亮、行内代码与引用块。
- 交互式交互任务清单 `- [ ]` / `- [x]`，点击复选框直接在正文同步状态。
- 多级列表自适应缩进与排版。

### 3. 🧠 双向网状链接与知识沉淀 (`[[双链]]`)
- 在笔记中直接键入 `[[某篇笔记标题]]`，即可实现网状双向引用。
- 卡片底部**自动解析出所有反向链接与引用出处**，点击直接穿梭高亮关联笔记。
- 彻底打破知识孤岛，践行卢曼卡片盒笔记法（Zettelkasten）。

### 4. 🏷️ 智能标签与拖拽归类
- 正文中输入 `#工作/周报` 或 `#闪念灵感`，系统实时提取标签树。
- 支持鼠标拖拽卡片直接扔到左侧边栏对应标签上快速打标。
- 标签管理面板支持**一键标签重命名、标签合并与死链清理**。

### 5. 📐 KaTeX 数学公式与多语言代码高亮
- 深度集成 **KaTeX**：支持行内质能公式 `$E=mc^2$` 与复杂多行矩阵、高斯积分块级公式 `$$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$`。
- 多语言语法高亮（TypeScript, JavaScript, Python, Rust, Go, SQL, Bash 等），配备 macOS 经典红黄绿控制台窗口顶栏与一键复制按钮。

### 6. 🎨 高赞社交卡片生成与免打印高清 PDF 导出
- **7 款设计师调色板**：极简流光、日落霞光、深邃夜空、复古羊皮纸、拍立得画框、清新薄荷、梦幻薰衣草。
- **高精度矢量排版**：精准字数统计、日期时间戳与个性化作者签名。
- **一键复制卡片图片**到系统剪贴板（直接粘贴发送至微信/QQ/Slack），或直接导出免浏览器打印的高清矢量 PDF。

### 7. 📁 本地相对路径 `.src/` 资源管家
- 粘贴截图或拖入本地图片时，自动存入 `.src/img_xxxx.png` 规范相对路径。
- 与 **Obsidian、Typora、Logseq** 本地知识库 100% 互通兼容，无缝导入导出。
- 内置可视化「资源管理器」，统一预览、管理并复用所有历史上传图片。

### 8. 🛡️ 多工作区隔离、历史快照与全量备份
- 支持自由创建与切换独立工作区（如「个人日常」、「研发工作」、「研习知识库」）。
- 编辑过程中每 3 秒自动记录增量快照，支持时间轴快照比对与一键时光回滚。
- 支持全量导出为 **Markdown (.md ZIP)、JSON 结构化备份、HTML、纯文本**，支持一键无损导入恢复。

---

## 📸 功能实景展示 (Visual Showcase)

| 核心模块 | 功能展示与说明 |
| :--- | :--- |
| **流式时间轴主界面** | <div align="center"><img src="https://raw.githubusercontent.com/Crazyer-Flove/FloveNote/main/public/alipay-qr.png" width="80" alt="FloveNote Timeline" /><br/><sub>时间轴流式编排 · 顶部快捷发布框 · 多维分类筛选</sub></div> |
| **Typora 实时 Markdown** | 纯净无干扰书写，公式、代码块、表格、任务项与双链无缝实时渲染 |
| **7 色卡片 & PDF 导出器** | 极简流光 / 日落 / 赛博深邃 / 羊皮纸等多款配色，一键复制图片与生成高清 PDF |
| **实战案例文档库** | 系统设置内置《Markdown 全功能排版指南》、《敏捷研发周报》、《第二大脑实践》案例 |

---

## 📊 产品对比 (Feature Matrix)

| 维度对比 | FloveNote | 传统备忘录 / 待办软件 | Notion / 语雀 | 纯 Obsidian |
| :--- | :---: | :---: | :---: | :---: |
| **记录阻力** | ⚡ **零门槛**（即发即走） | ⚪ 一般 | 🐢 较重（需选模板/建页面） | ⚪ 一般 |
| **数据隐私** | 🔒 **100% 本地存储** | ☁️ 依赖云端厂商 | ☁️ 闭源云端数据库 | 🔒 本地文件 |
| **双向链接图谱** | ✅ **原生卡片级双链** | ❌ 不支持 | ⚠️ 页面级关联 | ✅ 原生支持 |
| **公式与代码高亮** | ✅ **KaTeX + Prism** | ❌ 仅纯文本 | ✅ 支持 | ✅ 支持插件 |
| **社交卡片长图导出** | 🎨 **内置 7 色高清长图** | ❌ 截屏变形 | ❌ 仅白底打印 | ❌ 需配置社区插件 |
| **Obsidian `.src/` 兼容** | ✅ **完全兼容** | ❌ 不兼容 | ❌ 专有格式 | ✅ 原生标准 |

---

## 🛠️ 技术栈架构 (Tech Stack)

- **核心框架**：[React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vitejs.dev/)
- **样式方案**：[Tailwind CSS](https://tailwindcss.com/) + CSS Variables
- **图标系统**：[Lucide React](https://lucide.dev/)
- **动效库**：[Motion](https://motion.dev/)
- **Markdown & 语法解析**：
  - [KaTeX](https://katex.org/) - 极速 LaTeX 数学公式渲染
  - [Prism.js](https://prismjs.com/) - 现代代码块语法着色
  - 自研双向链接 `[[WikiLink]]` 与 `#标签` 正则解析引擎
- **导出引擎**：
  - [html-to-image](https://github.com/bubkoo/html-to-image) - 高保真 DOM 像素级图片光栅化
  - [jsPDF](https://github.com/parallax/jsPDF) - 矢量 PDF 自动分页渲染
- **数据持久化**：
  - 本地离线优先存储（LocalStorage + IndexedDB / File System Access API）

---

## 🚀 快速开始 (Quick Start)

### 环境要求
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [npm](https://www.npmjs.com/) `>= 9.0.0` 或 [pnpm](https://pnpm.io/) / [yarn](https://yarnpkg.com/)

### 安装与启动

1. **克隆项目到本地**
```bash
git clone https://github.com/Crazyer-Flove/FloveNote.git
cd FloveNote
```

2. **安装项目依赖**
```bash
npm install
# 或者使用 pnpm
# pnpm install
```

3. **启动本地开发服务器**
```bash
npm run dev
```
启动完成后，在浏览器打开 `http://localhost:3000` 即可畅享极简记录。

4. **构建生产版本**
```bash
npm run build
```
编译产物将输出至 `dist/` 目录，可直接部署至任何静态托管平台（如 Vercel、Cloudflare Pages、GitHub Pages 或 Nginx）。

---

## ⌨️ 快捷键速查表 (Keyboard Shortcuts)

| 快捷键 (Mac / Windows) | 动作说明 |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | 唤起**全局全局命令面板 (Command Palette)** |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> | 快速弹出新建笔记编辑器 |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> | 保存并发布当前笔记内容 |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> / <kbd>Cmd</kbd> + <kbd>B</kbd> | 选中文本快速加粗 `**粗体**` |
| <kbd>Ctrl</kbd> + <kbd>I</kbd> / <kbd>Cmd</kbd> + <kbd>I</kbd> | 选中文本快速设为 `*斜体*` |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | 撤销上一步操作 (Undo) |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | 重做上一步操作 (Redo) |
| <kbd>Esc</kbd> | 关闭当前打开的弹窗或浮层 |

---

## 📂 项目目录结构 (Directory Structure)

```text
FloveNote/
├── public/                  # 静态公共资源 (赞赏二维码等)
│   ├── alipay-qr.png
│   └── wechat-qr.png
├── src/
│   ├── components/          # 核心 UI 与业务功能组件
│   │   ├── AnalyticsModal.tsx        # 写作热力图与统计分析
│   │   ├── BatchExportModal.tsx      # 全量批量导出与恢复备份
│   │   ├── CommandPaletteModal.tsx   # 全局命令搜索面板 (Cmd+K)
│   │   ├── ContributionHeatmap.tsx   # GitHub 风格写作打卡热力图
│   │   ├── FocusModeModal.tsx        # 沉浸式全屏专注写作模式
│   │   ├── MarkdownRenderer.tsx      # 高性能 Markdown 渲染引擎
│   │   ├── NoteCard.tsx              # 时间轴卡片组件
│   │   ├── NoteEditorModal.tsx       # Typora 风格全功能编辑器
│   │   ├── NoteExportCardModal.tsx   # 7 色卡片长图 & PDF 导出器
│   │   ├── OnboardingHelpModal.tsx   # 新手交互式 6 步上手导览
│   │   ├── ResourceManagerModal.tsx  # .src/ 本地相对图片资源管家
│   │   ├── SettingsModal.tsx         # 系统偏好与实战案例文档库
│   │   ├── Sidebar.tsx               # 响应式可伸缩侧边栏与标签树
│   │   ├── SponsorAuthorModal.tsx    # 赞赏支持作者模块
│   │   ├── TagManagerModal.tsx       # 智能标签合并与重命名管家
│   │   ├── TimelineFeed.tsx          # 时间轴流式主视口
│   │   ├── Toast.tsx                 # 轻量交互反馈通知
│   │   ├── TopComposer.tsx           # 顶部即发灵感快捷输入框
│   │   └── TyporaBlockEditor.tsx     # 块级所见即所得编辑器
│   ├── utils/               # 工具函数与业务核心逻辑
│   │   ├── caseDocuments.ts          # 精选实战案例文档库 (4 套范例)
│   │   ├── markdownUtils.ts          # 文本统计、日期编排与 Markdown 解析
│   │   ├── storage.ts                # 本地存储持久化与工作区隔离
│   │   └── templates.ts              # 常用笔记模板库
│   ├── types.ts             # 全局 TypeScript 接口定义
│   ├── App.tsx              # 应用顶层状态编排与路由调度
│   ├── main.tsx             # 客户端主挂载入口
│   └── index.css            # Tailwind 样式引入与主题变量
├── package.json             # 依赖管理配置
├── tsconfig.json            # TypeScript 编译选项
└── README.md                # 项目文档
```

---

## ☕ 赞赏作者 (Sponsor)

如果您喜欢 **FloveNote**，或者它在日常记录、知识沉淀与技术周报中为您带来了便利与愉悦，欢迎扫描下方二维码请作者喝杯咖啡 ☕，支持软件的持续开源维护与功能演进！

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="public/wechat-qr.png" width="220" alt="微信赞赏码" /><br/>
        <strong>💚 微信支付 (WeChat Pay)</strong>
      </td>
      <td align="center">
        <img src="public/alipay-qr.png" width="220" alt="支付宝赞赏码" /><br/>
        <strong>💙 支付宝 (Alipay)</strong>
      </td>
    </tr>
  </table>
  <p><em>每一份支持都是作者持续精进与打磨的最佳动力，非常感谢您的认可与陪伴！✨</em></p>
</div>

---

## 🤝 参与贡献 (Contributing)

热烈欢迎提交 Pull Request、报告 Bug 或提出新功能建议！

1. Fork 本仓库 (`https://github.com/Crazyer-Flove/FloveNote`)
2. 新建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送至该分支 (`git push origin feature/AmazingFeature`)
5. 新建 Pull Request

---

## 📄 开源许可证 (License)

本项目基于 [MIT License](LICENSE) 协议开源。你可以自由地使用、修改、分发与部署本项目。

<div align="center">
  <br />
  <p>Made with ❤️ by <a href="https://github.com/Crazyer-Flove">Crazyer-Flove</a> & Open Source Community</p>
</div>
