import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get AI config from request headers or env
interface AiConfig {
  apiKey: string;
  provider: 'gemini' | 'openai' | 'deepseek' | 'custom';
  baseUrl?: string;
  modelName?: string;
}

const getAiConfig = (req: express.Request): AiConfig => {
  const customKey = req.headers['x-gemini-api-key'] as string | undefined;
  const customProvider = (req.headers['x-ai-provider'] as string | undefined) || 'gemini';
  const customBaseUrl = req.headers['x-ai-base-url'] as string | undefined;
  const customModelName = req.headers['x-ai-model-name'] as string | undefined;

  const apiKey = (customKey && customKey.trim()) ? customKey.trim() : (process.env.GEMINI_API_KEY || '');
  if (!apiKey) {
    throw new Error("未检测到 API Key，请在【设置 -> AI 大模型】中配置专属 API Key。");
  }

  return {
    apiKey,
    provider: (customProvider as any) || 'gemini',
    baseUrl: customBaseUrl?.trim(),
    modelName: customModelName?.trim(),
  };
};

async function callAiService(
  config: AiConfig,
  opts: {
    prompt: string;
    systemInstruction?: string;
    jsonSchemaResponse?: boolean;
  }
): Promise<string> {
  const { apiKey, provider, baseUrl, modelName } = config;

  // 1. OpenAI / DeepSeek / Custom OpenAI-compatible API
  if (provider === 'openai' || provider === 'deepseek' || provider === 'custom' || (baseUrl && !baseUrl.includes('googleapis'))) {
    const defaultBaseUrl = provider === 'deepseek'
      ? 'https://api.deepseek.com'
      : (baseUrl || 'https://api.openai.com/v1');
    const cleanBaseUrl = defaultBaseUrl.replace(/\/+$/, '');
    const url = cleanBaseUrl.endsWith('/chat/completions')
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    const defaultModel = provider === 'deepseek'
      ? 'deepseek-chat'
      : (modelName || 'gpt-4o-mini');

    const messages = [];
    if (opts.systemInstruction) {
      messages.push({ role: 'system', content: opts.systemInstruction });
    }
    messages.push({ role: 'user', content: opts.prompt });

    const payload: any = {
      model: modelName || defaultModel,
      messages,
      temperature: 0.7,
    };

    if (opts.jsonSchemaResponse) {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`[${provider.toUpperCase()} API HTTP ${res.status}]: ${errText || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // 2. Gemini API
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: baseUrl ? { baseUrl, headers: { "User-Agent": "aistudio-build" } } : { headers: { "User-Agent": "aistudio-build" } },
  });

  const model = modelName || 'gemini-3.6-flash';

  const configObj: any = {};
  if (opts.systemInstruction) {
    configObj.systemInstruction = opts.systemInstruction;
  }
  if (opts.jsonSchemaResponse) {
    configObj.responseMimeType = "application/json";
    configObj.responseSchema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Recommended tags without leading hashtags",
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents: opts.prompt,
    config: Object.keys(configObj).length ? configObj : undefined,
  });

  return response.text || '';
}

// --- API Endpoints ---

// 1. Health check
app.get("/api/health", (req, res) => {
  const customKey = req.headers['x-gemini-api-key'] as string | undefined;
  const activeKeyAvailable = !!((customKey && customKey.trim()) || process.env.GEMINI_API_KEY);
  res.json({ status: "ok", geminiKeyAvailable: activeKeyAvailable });
});

// 2. AI Connection Test
app.post("/api/ai/test", async (req, res) => {
  const startTime = Date.now();
  try {
    const config = getAiConfig(req);
    const reply = await callAiService(config, {
      prompt: "请回复一句话：'AI 大模型连通测试成功！'",
    });
    const duration = Date.now() - startTime;
    res.json({
      success: true,
      message: `连通测试成功！服务响应用时 ${duration}ms`,
      reply: reply.trim(),
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: `测试失败: ${err.message || "未能成功调通大模型服务"}`,
    });
  }
});

// 3. AI Auto-tagging suggestions
app.post("/api/gemini/suggest-tags", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    const config = getAiConfig(req);
    const resultText = await callAiService(config, {
      prompt: `分析以下笔记内容，提取3到5个最贴切的中文主题标签或分类层级（例如：“思考/随笔”、“开发/前端”、“生活/健身”、“读书笔记”）。只返回标签名称JSON数组，如 ["思考", "前端"]。

笔记内容：
${content}`,
      jsonSchemaResponse: true,
    });

    let tags: string[] = [];
    try {
      if (Array.isArray(JSON.parse(resultText))) {
        tags = JSON.parse(resultText);
      } else if (typeof JSON.parse(resultText) === 'object') {
        const parsed = JSON.parse(resultText);
        tags = parsed.tags || parsed.categories || Object.values(parsed);
      }
    } catch {
      // Fallback regex parsing
      const matches = resultText.match(/["']([^"']+)["']/g);
      if (matches) {
        tags = matches.map((m) => m.replace(/["']/g, ''));
      }
    }

    res.json({ tags });
  } catch (err: any) {
    console.error("Error in suggest-tags:", err);
    res.status(500).json({ error: err.message || "Failed to generate tags" });
  }
});

// 4. AI Note Polish, Grammar fix, TL;DR, and Continuation
app.post("/api/gemini/enhance-note", async (req, res) => {
  try {
    const { content, action } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const config = getAiConfig(req);
    let prompt = "";
    let systemInstruction = "";

    switch (action) {
      case "polish":
        systemInstruction = "你是一位精通文字编辑和排版的写作助手。修饰并优化用户的笔记，使其表达更清晰、通顺、优雅，保持 Markdown 格式不变，不要改变原意。直接输出修改后的Markdown文本。";
        prompt = `请润色并排版以下笔记：\n\n${content}`;
        break;
      case "grammar":
        systemInstruction = "你是一位严谨的文案校对专家。指出并修正文本中的错别字、标点符号误用及语法错误。直接输出修正后的完整文本。";
        prompt = `请修正以下文本中的错字与语法问题：\n\n${content}`;
        break;
      case "tldr":
        systemInstruction = "你是一位精炼总结专家。请用极简的3条Bullet Points（TL;DR）提炼笔记的核心要点。直接返回总结出的Markdown列表。";
        prompt = `请为以下笔记提炼核心要点（TL;DR）：\n\n${content}`;
        break;
      case "continue":
        systemInstruction = "你是一位有灵感的随笔写作搭档。顺着用户提供的笔记思路，自然流畅地向下续写1-2段富有深度的内容或思考延伸。保持相同口吻。";
        prompt = `请顺着以下笔记的思路向下续写：\n\n${content}`;
        break;
      default:
        return res.status(400).json({ error: "Invalid action type" });
    }

    const result = await callAiService(config, {
      prompt,
      systemInstruction,
    });

    res.json({ result });
  } catch (err: any) {
    console.error("Error in enhance-note:", err);
    res.status(500).json({ error: err.message || "Failed to process text" });
  }
});

// 5. AI Weekly Insight & Summary Report
app.post("/api/gemini/weekly-report", async (req, res) => {
  try {
    const { notesCount, activeDays, currentStreak, sampleNotes } = req.body;

    const config = getAiConfig(req);
    const prompt = `根据用户近期（过去7-30天）的笔记统计数据和代表性随记，生成一份富有见地、温暖且有启发性的「创作与思绪周报复盘」。

【统计数据】
- 周期内笔记总数：${notesCount} 条
- 活跃记录天数：${activeDays} 天
- 当前连续创作：${currentStreak} 天

【近期代表随记/摘录】：
${sampleNotes.map((n: string, i: number) => `${i + 1}. ${n.slice(0, 150)}...`).join("\n")}

请按以下格式生成一份Markdown格式周报：
### 💡 核心思考主题与灵感图景
（总结近期关注的知识点、情绪状态或兴趣迁移）

### ✨ 精彩亮点与深度碎片
（点评2-3条最具价值的文字或感悟）

### 🚀 下周灵感建议与探索指南
（给出1-2个具体可行的思考或创作延伸建议）`;

    const report = await callAiService(config, { prompt });

    res.json({ report });
  } catch (err: any) {
    console.error("Error in weekly-report:", err);
    res.status(500).json({ error: err.message || "Failed to generate report" });
  }
});

// --- Vite Middleware for Development / Static Serve in Production ---
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
