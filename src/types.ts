export interface NoteHistory {
  id: string;
  content: string;
  timestamp: number;
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdAt: number;
}

export interface Note {
  id: string;
  content: string; // Full markdown content
  tags: string[]; // Parsed hashtags like ["思考", "开发/前端"]
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  isPinned: boolean;
  isFavorite: boolean;
  history?: NoteHistory[]; // Edit history snapshots
  images?: string[]; // Attached image URLs or Base64 data
  deletedAt?: number; // Timestamp when moved to Trash (retained for 7 days)
  workspaceId?: string; // ID of the workspace folder this note belongs to
}

export interface TagInfo {
  name: string;
  count: number;
}

export type ViewCategory = 'all' | 'pinned' | 'favorites' | 'trash';

export interface FilterState {
  searchKeyword: string;
  selectedTag: string | null;
  category: ViewCategory;
  sortBy: 'newest' | 'oldest';
  dateFilter?: string | null; // YYYY-MM-DD
  weekFilter?: string | null; // YYYY-Www
  monthFilter?: string | null; // YYYY-MM
  timeRangeType?: 'all' | 'day' | 'week' | 'month';
}

export type ViewMode = 'timeline' | 'grid' | 'compact';

export type ThemeMode = 'light' | 'dark';

export type ExportFormat = 'md' | 'txt' | 'html' | 'json';

export type ToastMessage = {
  id: string;
  type: 'success' | 'info' | 'error';
  text: string;
};

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
}

export type CardThemeId = 'minimalist' | 'sunset' | 'midnight' | 'parchment' | 'polaroid' | 'mint';

export type CodeBlockThemeId = 'dark-mac' | 'light-mac' | 'dracula' | 'monokai' | 'nord';

export type TableThemeId = 'modern-indigo' | 'zebra-stripe' | 'minimal-dark' | 'border-light' | 'emerald-fresh' | 'amber-warm';

export interface AppSettings {
  defaultEditorMode: 'typora' | 'split' | 'preview';
  showStatsCard: boolean;
  autoSaveDelay: number; // in ms
  autoSaveEnabled?: boolean; // Auto-save toggle
  editorFontSize?: 'sm' | 'base' | 'lg' | 'xl'; // Editor font size
  codeBlockTheme?: CodeBlockThemeId; // Default code block style theme
  tableTheme?: TableThemeId; // Default table style theme
  autoFoldLongNotes?: boolean; // Setting for TimelineFeed long note auto-collapse (>200 chars)
  sidebarWidth: number; // e.g. 260
  isSidebarCollapsed: boolean;
  storagePath?: string; // Local default note storage directory path
  mediaStoragePath?: string; // Local default media attachments directory path
  backupPath?: string; // Local default auto-backup directory path
  geminiApiKey?: string; // Custom Big Model API Key
  aiProvider?: 'gemini' | 'openai' | 'deepseek' | 'custom'; // AI Provider
  aiBaseUrl?: string; // Custom API Base URL
  aiModelName?: string; // Custom AI Model Name
  fontFamily?: 'sans' | 'serif' | 'mono'; // App typography style
  cardDensity?: 'comfortable' | 'compact'; // Card spacing density
  activeWorkspaceId?: string; // Current active workspace
  workspaces?: Workspace[]; // List of user workspaces/folders
  themeMode?: 'light' | 'dark' | 'system'; // System theme setting
}
