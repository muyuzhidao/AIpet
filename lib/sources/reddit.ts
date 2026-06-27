// Reddit 源:官方 OAuth(application-only,只读)抓取宠物相关 subreddit 的本周热帖。
// 公开 .json 端点已被 Reddit 403 封锁,只能走 OAuth;需要有效的 client_id + client_secret(script app)。

import type { RawItem, SourceRunResult } from "../types";

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";
const USER_AGENT = "pet-hot/0.1 (local pet-industry research)";

// 宠物相关核心 subreddit:综合 + 食品 + 养护问答。
const SUBREDDITS = ["dogs", "cats", "Pets", "DogFood", "CatAdvice"];

type RedditChild = {
  data: {
    id: string;
    title: string;
    selftext?: string;
    author?: string;
    permalink?: string;
    url?: string;
    created_utc?: number;
    score?: number;
    num_comments?: number;
    subreddit?: string;
  };
};

async function getToken(id: string, secret: string): Promise<string> {
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`token ${res.status}: ${text.slice(0, 150)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("token 响应缺少 access_token");
  return data.access_token;
}

async function fetchSubredditTop(token: string, sub: string): Promise<RedditChild[]> {
  const res = await fetch(`${API_BASE}/r/${sub}/top?t=week&limit=8`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT }
  });
  if (!res.ok) throw new Error(`r/${sub} ${res.status}`);
  const data = (await res.json()) as { data?: { children?: RedditChild[] } };
  return data.data?.children ?? [];
}

export async function fetchReddit(startedAt: string): Promise<{ items: RawItem[]; result: SourceRunResult }> {
  const id = process.env.REDDIT_CLIENT_ID ?? "";
  const secret = process.env.REDDIT_CLIENT_SECRET ?? "";

  const fail = (error: string): { items: RawItem[]; result: SourceRunResult } => ({
    items: [],
    result: {
      source: "reddit",
      fetchedVia: "reddit_api",
      status: "failed",
      itemCount: 0,
      error,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  });

  if (!id || !secret || secret.startsWith("__n8n_BLANK_VALUE_")) {
    return fail("缺少有效的 REDDIT_CLIENT_SECRET(当前为空或为占位值)");
  }

  let token: string;
  try {
    token = await getToken(id, secret);
  } catch (error) {
    return fail(`Reddit 鉴权失败: ${error instanceof Error ? error.message : String(error)}`);
  }

  const seen = new Set<string>();
  const items: RawItem[] = [];
  let failedSubs = 0;
  const fetchedAt = new Date().toISOString();

  for (const sub of SUBREDDITS) {
    try {
      const children = await fetchSubredditTop(token, sub);
      for (const { data: d } of children) {
        if (!d.id || seen.has(d.id)) continue;
        seen.add(d.id);
        const permalink = d.permalink ? `https://www.reddit.com${d.permalink}` : d.url ?? "";
        items.push({
          id: `t3_${d.id}`,
          source: "reddit",
          fetchedVia: "reddit_api",
          url: permalink,
          title: d.title ?? "",
          content: d.selftext && d.selftext.trim() ? d.selftext : d.title ?? "",
          lang: "en",
          author: d.author,
          publishedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : undefined,
          fetchedAt,
          metrics: { score: d.score ?? 0, comments: d.num_comments ?? 0 },
          extra: { subreddit: `r/${d.subreddit ?? sub}`, permalink }
        });
      }
    } catch {
      failedSubs += 1;
    }
  }

  if (items.length === 0) {
    return fail(`所有 subreddit 抓取失败(${failedSubs}/${SUBREDDITS.length})`);
  }

  return {
    items,
    result: {
      source: "reddit",
      fetchedVia: "reddit_api",
      status: failedSubs > 0 ? "partial" : "ok",
      itemCount: items.length,
      error: failedSubs > 0 ? `${failedSubs} 个 subreddit 失败` : undefined,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  };
}
