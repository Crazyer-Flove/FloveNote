import { Note } from '../types';
import { extractTags } from './markdownUtils';

export interface LocalDirectoryPaths {
  rootPath: string;
  notesPath: string;
  mediaPath: string;
  backupPath: string;
}

export interface SyncStats {
  success: boolean;
  notesCount: number;
  imagesCount: number;
  backupFileName: string;
  error?: string;
}

/**
 * Checks if the browser supports the File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Normalizes and derives the sub-folder paths (Notes, .src, Backups) from a given root folder path
 */
export function deriveSubPaths(rootPath: string): LocalDirectoryPaths {
  const cleanRoot = rootPath.trim().replace(/[/\\]+$/, '');
  const isWindows = cleanRoot.includes('\\') && !cleanRoot.includes('/');
  const sep = isWindows ? '\\' : '/';

  return {
    rootPath: cleanRoot || '~/Documents/FloveNote',
    notesPath: `${cleanRoot}${sep}Notes`,
    mediaPath: `${cleanRoot}${sep}.src`,
    backupPath: `${cleanRoot}${sep}Backups`,
  };
}

/**
 * Prompts user to pick a local computer folder using File System Access API
 */
export async function pickLocalDirectory(): Promise<{
  handle: any;
  name: string;
  derivedPaths: LocalDirectoryPaths;
} | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    const folderName = handle.name || 'FloveNote-Vault';
    // Construct friendly default path display
    const simulatedPath = `~/Documents/${folderName}`;
    const derivedPaths = deriveSubPaths(simulatedPath);

    return {
      handle,
      name: folderName,
      derivedPaths,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User cancelled picker
      return null;
    }
    console.error('Error selecting local directory:', err);
    throw err;
  }
}

/**
 * Sanitizes a string for use as a safe filename
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

/**
 * Helper to write a file inside a directory handle
 */
async function writeFileToHandle(dirHandle: any, fileName: string, content: string | Blob): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Converts a Note to clean standard Markdown with YAML Frontmatter
 */
export function formatNoteToMarkdownWithFrontmatter(note: Note): string {
  const createdIso = new Date(note.createdAt).toISOString();
  const updatedIso = new Date(note.updatedAt).toISOString();
  const tagsYaml = note.tags.length > 0 ? `\ntags:\n${note.tags.map((t) => `  - ${t}`).join('\n')}` : '';

  const frontmatter = `---
id: "${note.id}"
created: "${createdIso}"
updated: "${updatedIso}"
pinned: ${note.isPinned}
favorite: ${note.isFavorite}${tagsYaml}
---

`;

  return frontmatter + note.content;
}

/**
 * Synchronizes and writes all active notes, image assets, and backup files to the chosen local directory handle
 */
export async function syncWorkspaceToDirectoryHandle(
  rootHandle: any,
  notes: Note[],
  options?: {
    notesDirName?: string;
    mediaDirName?: string;
    backupDirName?: string;
  }
): Promise<SyncStats> {
  try {
    const notesDirName = options?.notesDirName || 'Notes';
    const mediaDirName = options?.mediaDirName || '.src';
    const backupDirName = options?.backupDirName || 'Backups';

    // 1. Create or get Notes sub-directory
    const notesDirHandle = await rootHandle.getDirectoryHandle(notesDirName, { create: true });

    // 2. Create or get .src / Media sub-directory
    const mediaDirHandle = await rootHandle.getDirectoryHandle(mediaDirName, { create: true });

    // 3. Create or get Backups sub-directory
    const backupDirHandle = await rootHandle.getDirectoryHandle(backupDirName, { create: true });

    let writtenNotes = 0;
    let writtenImages = 0;

    // Filter active (non-trash) notes
    const activeNotes = notes.filter((n) => !n.deletedAt);

    // Track used filenames to prevent overwrite collisions
    const usedFileNames = new Set<string>();

    for (const note of activeNotes) {
      // Determine clean filename from first line or title
      const firstLine = note.content.split('\n')[0].replace(/^[#\s\-*]+/, '').trim();
      let baseName = sanitizeFileName(firstLine || `note_${note.id.slice(0, 8)}`);
      if (!baseName) baseName = `note_${note.id.slice(0, 8)}`;

      let finalFileName = `${baseName}.md`;
      let counter = 1;
      while (usedFileNames.has(finalFileName)) {
        finalFileName = `${baseName}_${counter}.md`;
        counter++;
      }
      usedFileNames.add(finalFileName);

      const fileContent = formatNoteToMarkdownWithFrontmatter(note);
      await writeFileToHandle(notesDirHandle, finalFileName, fileContent);
      writtenNotes++;

      // Export embedded base64 images if present in note content
      const base64ImgRegex = /!\[(.*?)\]\((data:image\/([a-zA-Z]+);base64,([^\)]+))\)/g;
      let match;
      while ((match = base64ImgRegex.exec(note.content)) !== null) {
        const alt = match[1] || 'image';
        const format = match[3] || 'png';
        const base64Data = match[4];
        const imgFileName = sanitizeFileName(`${alt}_${Date.now()}.${format}`);

        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: `image/${format}` });
          await writeFileToHandle(mediaDirHandle, imgFileName, blob);
          writtenImages++;
        } catch (e) {
          console.warn('Failed to parse and save image:', e);
        }
      }
    }

    // 4. Save JSON Full Backup snapshot
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `flovenote_backup_${timestampStr}.json`;
    const backupData = JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        notesCount: notes.length,
        notes,
      },
      null,
      2
    );
    await writeFileToHandle(backupDirHandle, backupFileName, backupData);

    // Also write a README.md explaining the folder layout
    const readmeContent = `# FloveNote 本地工作目录

本项目由 [FloveNote](https://github.com/Crazyer-Flove/FloveNote) 自动生成与同步。

## 目录结构说明
- \`/${notesDirName}/\`: 所有 Markdown 原生笔记文件，支持 Typora、Obsidian、Logseq 等直接打开。
- \`/${mediaDirName}/\`: 笔记中引用的本地图片与媒体附件。
- \`/${backupDirName}/\`: 包含版本快照与全量 JSON 备份，随时可导入回溯。

*最后同步时间: ${new Date().toLocaleString()}*
`;
    await writeFileToHandle(rootHandle, 'README.md', readmeContent);

    return {
      success: true,
      notesCount: writtenNotes,
      imagesCount: writtenImages,
      backupFileName,
    };
  } catch (err: any) {
    console.error('Failed to sync to directory handle:', err);
    return {
      success: false,
      notesCount: 0,
      imagesCount: 0,
      backupFileName: '',
      error: err?.message || '同步到本地文件夹失败',
    };
  }
}

/**
 * Reads all Markdown (.md) notes from a local directory handle and returns parsed Notes
 */
export async function readNotesFromDirectoryHandle(rootHandle: any, workspaceId: string = 'default'): Promise<Note[]> {
  const importedNotes: Note[] = [];

  async function processDirectory(dirHandle: any) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && (entry.name.endsWith('.md') || entry.name.endsWith('.markdown'))) {
        if (entry.name.toLowerCase() === 'readme.md') continue;
        try {
          const file = await entry.getFile();
          const text = await file.text();

          let content = text;
          let createdAt = file.lastModified || Date.now();
          let updatedAt = file.lastModified || Date.now();
          let isPinned = false;
          let isFavorite = false;

          // Parse YAML Frontmatter if present
          if (text.startsWith('---')) {
            const endMatch = text.indexOf('---', 3);
            if (endMatch !== -1) {
              const frontmatterRaw = text.substring(3, endMatch);
              content = text.substring(endMatch + 3).trim();

              const createdMatch = frontmatterRaw.match(/created:\s*["']?([^"'\n]+)/i);
              if (createdMatch && createdMatch[1]) {
                const parsedDate = Date.parse(createdMatch[1]);
                if (!isNaN(parsedDate)) createdAt = parsedDate;
              }

              const updatedMatch = frontmatterRaw.match(/updated:\s*["']?([^"'\n]+)/i);
              if (updatedMatch && updatedMatch[1]) {
                const parsedDate = Date.parse(updatedMatch[1]);
                if (!isNaN(parsedDate)) updatedAt = parsedDate;
              }

              if (/pinned:\s*true/i.test(frontmatterRaw)) isPinned = true;
              if (/favorite:\s*true/i.test(frontmatterRaw)) isFavorite = true;
            }
          }

          const tags = extractTags(content);

          importedNotes.push({
            id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            content,
            tags,
            createdAt,
            updatedAt,
            isPinned,
            isFavorite,
            workspaceId,
            history: [],
          });
        } catch (e) {
          console.warn(`Could not read file ${entry.name}:`, e);
        }
      } else if (entry.kind === 'directory' && entry.name === 'Notes') {
        // Recurse into Notes subfolder
        await processDirectory(entry);
      }
    }
  }

  await processDirectory(rootHandle);
  return importedNotes;
}
