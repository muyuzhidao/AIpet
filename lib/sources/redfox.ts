// RedFoxHub 国内社媒数据源:经其数据 API 抓取抖音 / 小红书 / 公众号内容,产出规范化 RawItem。
// 认证用 header REDFOX_API_KEY。抖音、小红书是关键词搜索;公众号是按账号 + 时间范围拉取。

import type { RawItem, SourceKind, SourceRunResult } from "../types";
import { fetchWithTimeout } from "../http";

const API_BASE = "https://redfox.hk/story/api";

// 抖音 / 小红书共用的宠物行业机会关键词。
const PET_KEYWORDS = ["猫砂", "狗粮", "猫粮", "宠物零食", "宠物用品", "宠物健康", "老年犬", "宠物饮水机"];

// 监控的宠物行业公众号(account = 微信号)。
const WECHAT_ACCOUNTS: Array<{ account: string; name: string }> = [
  { account: "chongyejia", name: "宠业家" },
  { account: "cwhync", name: "宠物行业白皮书" },
  { account: "petsnotes", name: "Pet Notes宠物商业研究" },
  { account: "caaa-pet", name: "中国畜牧业协会宠物产业分会" },
  { account: "gh_88102aa4d356", name: "宠经说" },
  { account: "petnosis", name: "宠物行业观察" },
  { account: "cyjdata", name: "宠业家数据库" },
  { account: "petmarketers", name: "宠物营销界" },
  { account: "SPIA_2016", name: "山东省宠物行业协会" },
  { account: "xieduimiandelaoyang", name: "斜对面的老阳" },
  { account: "gouliangzj", name: "狗子哥宠物" },
  { account: "cls1761", name: "杨Sir宠物圈" }
];

type ListResponse = { code?: number; msg?: string; data?: { total?: number; hasMore?: boolean; list?: unknown[] } };

// 北京时间 "YYYY-MM-DD HH:mm:ss" → 带时区 ISO。
function cnToIso(value?: string): string | undefined {
  if (!value) return undefined;
  const t = value.trim().replace(" ", "T");
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t) ? `${t}+08:00` : undefined;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// 剥离 "#标签",拆出正文与去重话题。
function parseHashtags(text: string): { body: string; tags: string[] } {
  const tags = [...new Set((text.match(/#[^\s#]+/g) ?? []).map((t) => t.slice(1)).filter(Boolean))];
  const body = text.replace(/#[^\s#]+/g, " ").replace(/\s+/g, " ").trim();
  return { body, tags };
}

function failResult(source: SourceKind, error: string, startedAt: string): SourceRunResult {
  return { source, fetchedVia: "redfox", status: "failed", itemCount: 0, error, startedAt, finishedAt: new Date().toISOString() };
}

async function postRedfox(endpoint: string, apiKey: string, body: Record<string, unknown>): Promise<unknown[]> {
  const res = await fetchWithTimeout(
    `${API_BASE}/${endpoint}`,
    {
      method: "POST",
      headers: { REDFOX_API_KEY: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    },
    30_000
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 150)}`);
  }
  const data = (await res.json()) as ListResponse;
  if (data.code !== 2000) throw new Error(`code ${data.code}: ${data.msg ?? "未知错误"}`);
  return data.data?.list ?? [];
}

// ---- 抖音 ----

type DouyinWork = {
  workId?: string;
  title?: string;
  content?: string;
  workUrl?: string;
  workType?: string;
  publishTime?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  collectCount?: number;
  repostCount?: number;
  commentTopKeywords?: string[];
  isPromotion?: number;
  authorId?: string;
  accountName?: string;
  authorLink?: string;
  followerCount?: number;
  accountType?: string;
};

export async function fetchDouyin(startedAt: string): Promise<{ items: RawItem[]; result: SourceRunResult }> {
  const apiKey = process.env.REDFOX_API_KEY ?? "";
  if (!apiKey) return { items: [], result: failResult("douyin", "缺少 REDFOX_API_KEY", startedAt) };

  const seen = new Set<string>();
  const items: RawItem[] = [];
  let failed = 0;
  const fetchedAt = new Date().toISOString();

  for (const keyword of PET_KEYWORDS) {
    try {
      const list = (await postRedfox("dyData/searchArticle", apiKey, { keyword, offset: 0, sortType: "default" })) as DouyinWork[];
      for (const w of list) {
        const id = w.workId ?? w.workUrl ?? "";
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const pt = parseHashtags(w.title ?? "");
        const pc = parseHashtags(w.content ?? "");
        const tags = [...new Set([...pt.tags, ...pc.tags])];
        const body = pc.body || pt.body;
        items.push({
          id,
          source: "douyin",
          fetchedVia: "redfox",
          url: w.workUrl ?? "",
          title: pt.body || pc.body || tags.slice(0, 3).join(" ") || "抖音作品",
          content: body,
          lang: "zh",
          author: w.accountName,
          publishedAt: cnToIso(w.publishTime),
          fetchedAt,
          metrics: {
            like: w.likeCount ?? 0,
            comment: w.commentCount ?? 0,
            share: w.shareCount ?? 0,
            collect: w.collectCount ?? 0,
            repost: w.repostCount ?? 0,
            follower: w.followerCount ?? 0
          },
          extra: { keyword, hashtags: tags, topKeywords: w.commentTopKeywords ?? [], workType: w.workType, isPromotion: w.isPromotion, accountType: w.accountType }
        });
      }
    } catch {
      failed += 1;
    }
  }

  if (items.length === 0) return { items: [], result: failResult("douyin", `所有关键词抓取失败(${failed}/${PET_KEYWORDS.length})`, startedAt) };
  return {
    items,
    result: {
      source: "douyin",
      fetchedVia: "redfox",
      status: failed > 0 ? "partial" : "ok",
      itemCount: items.length,
      error: failed > 0 ? `${failed} 个关键词失败` : undefined,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  };
}

// ---- 小红书 ----

type XhsWork = {
  workId?: string;
  workTitle?: string;
  workDesc?: string;
  workUrl?: string;
  workPublishTime?: string;
  accountNickname?: string;
  accountUserid?: string;
  workLikedCount?: number;
  workCommentsCount?: number;
  workCollectedCount?: number;
  workReadedCount?: number;
  workSharedCount?: number;
  workType?: string;
  accountType?: string;
};

export async function fetchXiaohongshu(startedAt: string): Promise<{ items: RawItem[]; result: SourceRunResult }> {
  const apiKey = process.env.REDFOX_API_KEY ?? "";
  if (!apiKey) return { items: [], result: failResult("xiaohongshu", "缺少 REDFOX_API_KEY", startedAt) };

  const seen = new Set<string>();
  const items: RawItem[] = [];
  let failed = 0;
  const fetchedAt = new Date().toISOString();

  for (const keyword of PET_KEYWORDS) {
    try {
      const list = (await postRedfox("xhsUser/searchArticle", apiKey, { keyword, offset: 0, sortType: "default" })) as XhsWork[];
      for (const w of list) {
        const id = w.workId ?? w.workUrl ?? "";
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const pt = parseHashtags(w.workTitle ?? "");
        const pd = parseHashtags(w.workDesc ?? "");
        const tags = [...new Set([...pt.tags, ...pd.tags])];
        items.push({
          id,
          source: "xiaohongshu",
          fetchedVia: "redfox",
          url: w.workUrl ?? "",
          title: pt.body || (w.workTitle ?? "").trim() || tags.slice(0, 3).join(" ") || "小红书笔记",
          content: (pd.body || pt.body || "").slice(0, 500),
          lang: "zh",
          author: w.accountNickname,
          publishedAt: cnToIso(w.workPublishTime),
          fetchedAt,
          metrics: {
            like: w.workLikedCount ?? 0,
            comment: w.workCommentsCount ?? 0,
            collect: w.workCollectedCount ?? 0,
            read: w.workReadedCount ?? 0,
            share: w.workSharedCount ?? 0
          },
          extra: { keyword, hashtags: tags, workType: w.workType, accountUserid: w.accountUserid, accountType: w.accountType }
        });
      }
    } catch {
      failed += 1;
    }
  }

  if (items.length === 0) return { items: [], result: failResult("xiaohongshu", `所有关键词抓取失败(${failed}/${PET_KEYWORDS.length})`, startedAt) };
  return {
    items,
    result: {
      source: "xiaohongshu",
      fetchedVia: "redfox",
      status: failed > 0 ? "partial" : "ok",
      itemCount: items.length,
      error: failed > 0 ? `${failed} 个关键词失败` : undefined,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  };
}

// ---- 公众号 ----

type GzhWork = {
  workUuid?: string;
  title?: string;
  summary?: string;
  content?: string;
  workUrl?: string;
  publishTime?: string;
  author?: string;
  readCount?: number;
  likeCount?: number;
  commentCount?: number;
  collectCount?: number;
  shareCount?: number;
  watchCount?: number;
  isOriginal?: number;
  accountType?: string;
  publishLocation?: string;
};

export async function fetchWechat(startedAt: string): Promise<{ items: RawItem[]; result: SourceRunResult }> {
  const apiKey = process.env.REDFOX_API_KEY ?? "";
  if (!apiKey) return { items: [], result: failResult("wechat", "缺少 REDFOX_API_KEY", startedAt) };

  const publishTimeStart = daysAgo(30);
  const publishTimeEnd = daysAgo(0);
  const seen = new Set<string>();
  const items: RawItem[] = [];
  let failed = 0;
  const fetchedAt = new Date().toISOString();

  for (const { account, name } of WECHAT_ACCOUNTS) {
    try {
      const list = (await postRedfox("gzhData/queryWorkList", apiKey, {
        account,
        accountName: name,
        offset: 0,
        sortType: "_0",
        publishTimeStart,
        publishTimeEnd
      })) as GzhWork[];
      for (const w of list) {
        const id = w.workUuid ?? w.workUrl ?? "";
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const content = (w.content || w.summary || "").replace(/\s+/g, " ").trim().slice(0, 600);
        items.push({
          id,
          source: "wechat",
          fetchedVia: "redfox",
          url: w.workUrl ?? "",
          title: (w.title ?? "").trim() || "公众号文章",
          content,
          lang: "zh",
          author: w.author ?? name,
          publishedAt: cnToIso(w.publishTime),
          fetchedAt,
          metrics: {
            read: w.readCount ?? 0,
            like: w.likeCount ?? 0,
            comment: w.commentCount ?? 0,
            collect: w.collectCount ?? 0,
            share: w.shareCount ?? 0,
            watch: w.watchCount ?? 0
          },
          extra: { account, accountName: name, isOriginal: w.isOriginal, accountType: w.accountType, summary: w.summary, publishLocation: w.publishLocation }
        });
      }
    } catch {
      failed += 1;
    }
  }

  if (items.length === 0) return { items: [], result: failResult("wechat", `所有账号抓取失败(${failed}/${WECHAT_ACCOUNTS.length})`, startedAt) };
  return {
    items,
    result: {
      source: "wechat",
      fetchedVia: "redfox",
      status: failed > 0 ? "partial" : "ok",
      itemCount: items.length,
      error: failed > 0 ? `${failed} 个账号失败` : undefined,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  };
}
