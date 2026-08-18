// Client-side helper functions to call server-side Gemini API endpoints

function getAiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const customKey = localStorage.getItem('flovenote_gemini_key');
    if (customKey && customKey.trim()) {
      headers['x-gemini-api-key'] = customKey.trim();
    }
    const customProvider = localStorage.getItem('flovenote_ai_provider');
    if (customProvider && customProvider.trim()) {
      headers['x-ai-provider'] = customProvider.trim();
    }
    const customBaseUrl = localStorage.getItem('flovenote_ai_base_url');
    if (customBaseUrl && customBaseUrl.trim()) {
      headers['x-ai-base-url'] = customBaseUrl.trim();
    }
    const customModelName = localStorage.getItem('flovenote_ai_model_name');
    if (customModelName && customModelName.trim()) {
      headers['x-ai-model-name'] = customModelName.trim();
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return headers;
}

export async function testAiConnection(config?: {
  apiKey?: string;
  provider?: string;
  baseUrl?: string;
  modelName?: string;
}): Promise<{ success: boolean; message: string; reply?: string; modelUsed?: string }> {
  const headers = getAiHeaders();
  if (config?.apiKey !== undefined) headers['x-gemini-api-key'] = config.apiKey.trim();
  if (config?.provider) headers['x-ai-provider'] = config.provider.trim();
  if (config?.baseUrl !== undefined) headers['x-ai-base-url'] = config.baseUrl.trim();
  if (config?.modelName !== undefined) headers['x-ai-model-name'] = config.modelName.trim();

  try {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: `网络或服务无法访问: ${err.message || '未知错误'}`,
    };
  }
}

export async function fetchSuggestedTags(content: string): Promise<string[]> {
  try {
    const res = await fetch('/api/gemini/suggest-tags', {
      method: 'POST',
      headers: getAiHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to fetch tags');
    const data = await res.json();
    return data.tags || [];
  } catch (error) {
    console.error('Error in fetchSuggestedTags:', error);
    return [];
  }
}

export async function enhanceNoteContent(
  content: string,
  action: 'polish' | 'grammar' | 'fix_grammar' | 'tldr' | 'continue'
): Promise<string> {
  const apiAction = action === 'fix_grammar' ? 'grammar' : action;
  const res = await fetch('/api/gemini/enhance-note', {
    method: 'POST',
    headers: getAiHeaders(),
    body: JSON.stringify({ content, action: apiAction }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'AI 处理失败');
  }
  const data = await res.json();
  return data.result || '';
}

export async function fetchWeeklyReport(stats: {
  notesCount: number;
  activeDays: number;
  currentStreak: number;
  sampleNotes: string[];
}): Promise<string> {
  const res = await fetch('/api/gemini/weekly-report', {
    method: 'POST',
    headers: getAiHeaders(),
    body: JSON.stringify(stats),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || '生成周报失败');
  }
  const data = await res.json();
  return data.report || '';
}

