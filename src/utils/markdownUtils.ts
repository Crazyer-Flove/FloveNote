import { Note, ExportFormat } from '../types';

/**
 * Parses tags matching #tag or #nested/tag pattern from markdown content.
 * Ignores code blocks and URLs.
 */
export function calculateTextStats(content: string): { chars: number; words: number; cjkChars: number; rawChars: number } {
  if (!content) return { chars: 0, words: 0, cjkChars: 0, rawChars: 0 };

  const rawChars = content.length;
  let text = content;

  // 1. Remove code block syntax delimiters ```...``` (keep inner text)
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    const lines = match.split('\n');
    if (lines.length > 2) {
      return lines.slice(1, -1).join(' ');
    }
    return match.replace(/`/g, '');
  });

  // 2. Remove inline backticks `code`
  text = text.replace(/`([^`]+)`/g, '$1');

  // 3. Remove image tags ![alt](url) -> keep alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 4. Remove link syntax [text](url) -> keep text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 5. Remove HTML tags <tag>
  text = text.replace(/<[^>]*>/g, '');

  // 6. Remove Markdown headings (#), blockquotes (>), list markers (-, *, +, 1.)
  text = text.replace(/^[ \t]*[#>\-+*]\s+/gm, '');
  text = text.replace(/^[ \t]*\d+\.\s+/gm, '');
  text = text.replace(/[\*_~#]/g, '');

  const cleanText = text.trim();

  // Count CJK characters
  const cjkMatches = cleanText.match(/[\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf\u20000-\u2a6df]/g);
  const cjkChars = cjkMatches ? cjkMatches.length : 0;

  // Count non-CJK English words
  const nonCjkText = cleanText.replace(/[\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf\u20000-\u2a6df]/g, ' ');
  const englishWords = nonCjkText.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const words = cjkChars + englishWords;
  const chars = cleanText.replace(/\s+/g, '').length;

  return { chars, words, cjkChars, rawChars };
}

export function extractTags(content: string): string[] {
  if (!content) return [];
  
  // Remove inline and fenced code blocks to avoid false tags inside code
  const codeBlockRegex = /```[\s\S]*?```|`[^`]*`/g;
  const cleanedContent = content.replace(codeBlockRegex, '');

  // Match #tag or #category/subcategory
  // Tags should start with letter/chinese/number after #, and not be hex colors or heading markers at start of line without space
  // Standard markdown heading is # Title (with space)
  // Hashtag is #tag (without space after #)
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5\/-]+)(?=\s|$|[.,!?;:])/g;
  const tagsSet = new Set<string>();

  let match;
  while ((match = tagRegex.exec(cleanedContent)) !== null) {
    const tag = match[1].trim();
    // Ignore pure numbers or empty tags
    if (tag && !/^\d+$/.test(tag)) {
      tagsSet.add(tag);
    }
  }

  return Array.from(tagsSet);
}

/**
 * Format timestamp to friendly time string
 */
export function formatFriendlyTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  const yearStr = date.getFullYear() === now.getFullYear() ? '' : `${date.getFullYear()}年`;
  const monthStr = `${date.getMonth() + 1}月${date.getDate()}日`;
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  return `${yearStr}${monthStr} ${timeStr}`;
}

/**
 * Group notes by timeline date headings
 */
export function groupNotesByDate(notes: Note[]): { label: string; notes: Note[] }[] {
  const groupsMap = new Map<string, Note[]>();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

  notes.forEach((note) => {
    const date = new Date(note.createdAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    
    let groupLabel = '';
    if (dateKey === todayStr) {
      groupLabel = '今天';
    } else if (dateKey === yesterdayStr) {
      groupLabel = '昨天';
    } else {
      groupLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    if (!groupsMap.has(groupLabel)) {
      groupsMap.set(groupLabel, []);
    }
    groupsMap.get(groupLabel)!.push(note);
  });

  return Array.from(groupsMap.entries()).map(([label, notesList]) => ({
    label,
    notes: notesList,
  }));
}

/**
 * Generates export content for a single note or array of notes
 */
export function exportNotesContent(notes: Note[], format: ExportFormat): { filename: string; content: string; mimeType: string } {
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'json') {
    return {
      filename: `FloveNote_Backup_${timestamp}.json`,
      content: JSON.stringify(notes, null, 2),
      mimeType: 'application/json',
    };
  }

  if (format === 'txt') {
    const textContent = notes.map((note) => {
      const time = new Date(note.createdAt).toLocaleString('zh-CN');
      const tags = note.tags.length > 0 ? `标签: ${note.tags.map(t => `#${t}`).join(' ')}\n` : '';
      return `----------------------------------------\n时间: ${time}\n${tags}\n${note.content}\n`;
    }).join('\n');

    return {
      filename: `FloveNote_Export_${timestamp}.txt`,
      content: textContent,
      mimeType: 'text/plain',
    };
  }

  if (format === 'html') {
    const htmlBody = notes.map((note) => {
      const time = new Date(note.createdAt).toLocaleString('zh-CN');
      const tagsHtml = note.tags.map(t => `<span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;">#${t}</span>`).join('');
      return `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;font-family:system-ui,-apple-system,sans-serif;">
          <div style="font-size:13px;color:#6b7280;margin-bottom:8px;display:flex;justify-content:space-between;">
            <span>${time}</span>
            <div>${tagsHtml}</div>
          </div>
          <div style="line-height:1.6;color:#1f2937;white-space:pre-wrap;">${escapeHtml(note.content)}</div>
        </div>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FloveNote Notes Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111827; background: #fafafa; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
  </style>
</head>
<body>
  <h1>FloveNote 笔记导出 (${notes.length} 条)</h1>
  ${htmlBody}
</body>
</html>`;

    return {
      filename: `FloveNote_Export_${timestamp}.html`,
      content: fullHtml,
      mimeType: 'text/html',
    };
  }

  // Default Markdown (.md)
  const mdContent = notes.map((note) => {
    const time = new Date(note.createdAt).toLocaleString('zh-CN');
    const tags = note.tags.length > 0 ? `\n\n> 标签: ${note.tags.map(t => `#${t}`).join(' ')}` : '';
    return `<!-- Note ID: ${note.id} | Created: ${time} -->\n${note.content}${tags}\n\n---`;
  }).join('\n\n');

  return {
    filename: `FloveNote_Export_${timestamp}.md`,
    content: mdContent,
    mimeType: 'text/markdown',
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper to get ISO Week string 'YYYY-Www' for a Date object
 */
export function getIsoWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Helper to get Month string 'YYYY-MM' for a Date object
 */
export function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Helper to get friendly week label from 'YYYY-Www' string
 */
export function formatWeekLabel(weekStr: string): string {
  if (!weekStr) return '';
  const parts = weekStr.split('-W');
  if (parts.length !== 2) return weekStr;
  const year = parseInt(parts[0], 10);
  const weekNum = parseInt(parts[1], 10);
  return `${year}年第${weekNum}周`;
}

/**
 * Helper to get friendly month label from 'YYYY-MM' string
 */
export function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length !== 2) return monthStr;
  return `${parts[0]}年${parts[1]}月`;
}

/**
 * Triggers browser file download
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
