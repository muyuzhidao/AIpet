// Tavily 搜索源:抓取新闻门户与独立站内容,产出规范化的 RawItem。
// 支持多个 API key,某个 key 失败(额度/鉴权)时自动切换到下一个。
// 用语义搜索(topic=general)保证垂直相关性,并对结果做宠物相关性过滤兜底。

import type { RawItem, SourceRunResult } from "../types";
import { fetchWithTimeout } from "../http";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw_content?: string | null;
  published_date?: string;
};

type TavilyResponse = {
  query: string;
  results: TavilyResult[];
};

// 宠物行业机会检索词:中英混合,覆盖主要品类与痛点。
const TAVILY_QUERIES: string[] = [
  "宠物行业 新品 趋势",
  "猫砂 低粉尘 除味 评测 痛点",
  "宠物 智能 喂食器 饮水机 使用体验",
  "老年犬 关节 营养 零食 适口性",
  "pet product trends",
  "cat litter dust free asthma friendly",
  "dog joint mobility supplement chews",
  "pet safe enzyme odor cleaner",
  "DTC pet food brand breed specific"
];

// 相关性兜底:标题或正文需命中宠物词,否则视为泛新闻丢弃。
const PET_TERMS = /pet|dog|cat|puppy|kitten|feline|canine|litter|kibble|宠物|猫|犬|狗|喵|汪|铲屎|宠/i;

function getKeys(): string[] {
  const raw = process.env.TAVILY_API_KEYS ?? process.env.TAVILY_API_KEY ?? "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function hasChinese(text: string): boolean {
  return /[一-鿿]/.test(text);
}

function isPetRelated(text: string): boolean {
  return PET_TERMS.test(text);
}

async function searchOnce(query: string, key: string): Promise<TavilyResult[]> {
  const res = await fetchWithTimeout(
    TAVILY_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        query,
        topic: "general", // 语义搜索,垂直相关性高于 news
        search_depth: "basic", // basic = 1 credit/次,贴合零成本
        max_results: 6,
        include_raw_content: false
      })
    },
    30_000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as TavilyResponse;
  return data.results ?? [];
}

// 多 key 故障切换:逐个尝试,直到某个 key 成功。
async function searchWithFailover(query: string, keys: string[]): Promise<TavilyResult[]> {
  let lastError: unknown;
  for (const key of keys) {
    try {
      return await searchOnce(query, key);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("没有可用的 Tavily key");
}

export async function fetchTavily(startedAt: string): Promise<{ items: RawItem[]; result: SourceRunResult }> {
  const keys = getKeys();

  if (keys.length === 0) {
    return {
      items: [],
      result: {
        source: "independent_site",
        fetchedVia: "tavily",
        status: "failed",
        itemCount: 0,
        error: "缺少 TAVILY_API_KEYS,请检查 .env",
        startedAt,
        finishedAt: new Date().toISOString()
      }
    };
  }

  const seen = new Set<string>();
  const items: RawItem[] = [];
  let failedQueries = 0;

  for (const query of TAVILY_QUERIES) {
    try {
      const results = await searchWithFailover(query, keys);
      for (const r of results) {
        if (!r.url || seen.has(r.url)) continue;
        const blob = `${r.title ?? ""} ${r.content ?? ""}`;
        if (!isPetRelated(blob)) continue; // 丢弃不相关的泛新闻
        seen.add(r.url);
        items.push({
          id: r.url,
          source: "independent_site",
          fetchedVia: "tavily",
          url: r.url,
          title: r.title ?? r.url,
          content: r.content ?? "",
          lang: hasChinese(blob) ? "zh" : "en",
          publishedAt: r.published_date,
          fetchedAt: new Date().toISOString(),
          extra: { query, score: r.score }
        });
      }
    } catch {
      failedQueries += 1;
    }
  }

  const status: SourceRunResult["status"] = items.length === 0 ? "failed" : failedQueries > 0 ? "partial" : "ok";

  return {
    items,
    result: {
      source: "independent_site",
      fetchedVia: "tavily",
      status,
      itemCount: items.length,
      error: failedQueries > 0 ? `${failedQueries}/${TAVILY_QUERIES.length} 个查询失败` : undefined,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  };
}
