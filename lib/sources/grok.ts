// X 内容源:经第三方 Grok 代理(OpenAI 兼容)检索 X 上的宠物行业一手讨论。
// Grok multi-agent 模型具备 X 实时检索能力;用语义化 prompt 让它筛选真实痛点帖,
// 输出结构化 JSON,再解析成带原文链接的 RawItem。
// 注意:该模型单次开销可达百万级 token(multi-agent 内部注入大量帖子),仅在包月/不限量代理下适合进每日更新。

import type { RawItem, SourceRunResult } from "../types";

const MODEL = "grok-4.20-multi-agent-high";

const SYSTEM_PROMPT =
  "You research pet-industry product opportunities on X. Semantically filter, never keyword-match. Only return posts you actually retrieved from X.";

const USER_PROMPT = [
  "Find recent X posts where real pet owners express product pain points, unmet needs, or strong opinions about pet products",
  "— e.g. cat litter dust/odor/tracking, senior dog joint & mobility, pet food ingredients/allergies, smart feeders & water fountains, pet-safe odor/pest cleaners, pet anxiety/grooming.",
  'STRICTLY EXCLUDE posts using "dog food" etc. as slang, insults, jokes, or unrelated metaphors, and exclude pure ads/promotions.',
  "Only posts genuinely about pet product needs.",
  "Return ONLY a JSON array (max 10), each item with keys: text (the post), author (@handle), url (real X post link), theme (short), why_relevant (short).",
  "No prose outside the JSON."
].join(" ");

type GrokPost = {
  text?: string;
  author?: string;
  url?: string;
  theme?: string;
  why_relevant?: string;
};

function hasChinese(text: string): boolean {
  return /[一-鿿]/.test(text);
}

// 从模型回复里稳健提取 JSON 数组(容忍 ```json 围栏或前后多余文字)。
function extractJsonArray(text: string): GrokPost[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const parsed: unknown = JSON.parse(candidate.slice(start, end + 1));
    return Array.isArray(parsed) ? (parsed as GrokPost[]) : [];
  } catch {
    return [];
  }
}

export async function fetchGrok(startedAt: string): Promise<{ items: RawItem[]; result: SourceRunResult }> {
  const baseUrl = (process.env.GROK_BASE_URL ?? "").replace(/\/+$/, "");
  const apiKey = process.env.GROK_API_KEY ?? "";

  const fail = (error: string): { items: RawItem[]; result: SourceRunResult } => ({
    items: [],
    result: {
      source: "x",
      fetchedVia: "x_grok",
      status: "failed",
      itemCount: 0,
      error,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  });

  if (!baseUrl || !apiKey) return fail("缺少 GROK_BASE_URL 或 GROK_API_KEY,请检查 .env");

  // multi-agent 模型响应慢(数十秒至两分钟),设置足够超时并可中断。
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 220_000);
  let content = "";
  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT }
        ],
        stream: false
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return fail(`Grok ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    content = data.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    return fail(`Grok 请求异常: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timer);
  }

  const posts = extractJsonArray(content);
  const seen = new Set<string>();
  const items: RawItem[] = [];
  const fetchedAt = new Date().toISOString();

  for (const post of posts) {
    const url = (post.url ?? "").trim();
    const text = (post.text ?? "").trim();
    if (!url || !text || seen.has(url)) continue;
    seen.add(url);
    items.push({
      id: url,
      source: "x",
      fetchedVia: "x_grok",
      url,
      title: text,
      content: text,
      lang: hasChinese(text) ? "zh" : "en",
      fetchedAt,
      extra: { author: post.author, theme: post.theme, whyRelevant: post.why_relevant }
    });
  }

  if (items.length === 0) {
    return fail(`Grok 未解析出有效帖子(回复长度 ${content.length})`);
  }

  return {
    items,
    result: {
      source: "x",
      fetchedVia: "x_grok",
      status: "ok",
      itemCount: items.length,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  };
}
