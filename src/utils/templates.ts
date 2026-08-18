import { NoteTemplate } from '../types';

export const DEFAULT_TEMPLATES: NoteTemplate[] = [
  {
    id: 'tpl-meeting',
    name: '📌 会议记录',
    description: '适用于团队例会、需求沟通与行动项安排',
    category: '工作',
    content: `## 📌 会议主题：
- **时间**：${new Date().toLocaleDateString('zh-CN')}
- **参会人员**：

---

### 📝 讨论要点
1. 
2. 

### ⚡ 行动项 (Action Items)
- [ ] 任务 1 (@负责人)
- [ ] 任务 2 (@负责人)
`,
  },
  {
    id: 'tpl-journal',
    name: '🗓️ 每日日记',
    description: '记录今日三件好事、感悟与明日规划',
    category: '生活',
    content: `## 🗓️ 今日日记 (${new Date().toLocaleDateString('zh-CN')})

### 🌟 今日三件好事
1. 
2. 
3. 

### 💡 今日感悟与思考
- 

### 🎯 明日计划
- [ ] 
`,
  },
  {
    id: 'tpl-weekly',
    name: '📊 工作周报',
    description: '总结本周主要进展、下周规划与问题瓶颈',
    category: '工作',
    content: `## 📊 本周工作总结

### 🚀 本周主要进展
- **重点项目 A**：已完成 ...
- **日常需求 B**：进行中 ...

### 🎯 下周工作计划
- [ ] 1. 
- [ ] 2. 

### 💡 遇到的问题与所需支持
- 
`,
  },
  {
    id: 'tpl-reading',
    name: '📖 读书/学习笔记',
    description: '记录书名、核心观点、精彩摘录与个人心得',
    category: '学习',
    content: `## 📖 读书笔记：《书名》
- **作者**：
- **推荐指数**：⭐⭐⭐⭐⭐

---

### 💡 核心观点
> 

### 📝 精彩摘录
1. 
2. 

### 💭 个人心得与行动指南
- 
`,
  },
  {
    id: 'tpl-tasks',
    name: '📋 待办清单',
    description: '按优先级拆分高低频任务与长期计划',
    category: '高效',
    content: `## 📋 今日待办清单

### 🔥 高优先级 (Important & Urgent)
- [ ] 

### ☕ 常规任务 (Regular)
- [ ] 

### 📌 长期关注/备忘 (Someday)
- 
`,
  },
];

const TEMPLATES_KEY = 'flovenote_custom_templates';

export function getStoredTemplates(): NoteTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const custom = JSON.parse(raw);
    return [...DEFAULT_TEMPLATES, ...custom];
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveCustomTemplates(templates: NoteTemplate[]): void {
  try {
    // Only save non-default templates
    const customOnly = templates.filter((t) => !DEFAULT_TEMPLATES.some((d) => d.id === t.id));
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customOnly));
  } catch (err) {
    console.error('Failed to save templates', err);
  }
}
