// 规范化:把抓取的 RawItem 映射成页面「全部宠业动态」用的 NewsItem 视图。
// 按来源(抖音 / X / Reddit / 独立站)给出不同的展示标签与摘要;机会分类/评分由第 5 步 AI 负责。

import type { NewsItem, RawItem } from "../types";

function formatStamp(iso?: string): string {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "独立站";
  }
}

function truncate(text: string, max: number): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

// 来源 → 页面展示三元组(source 需与侧栏/筛选 tab 的标签一致才能被筛到)。
function viewSource(item: RawItem): { source: string; sourceType: string; sourceMeta: string } {
  switch (item.source) {
    case "douyin":
      return { source: "抖音", sourceType: "短视频", sourceMeta: item.author ? `@${item.author}` : "抖音" };
    case "xiaohongshu":
      return { source: "小红书", sourceType: "一手内容", sourceMeta: item.author ? `@${item.author}` : "小红书" };
    case "wechat":
      return { source: "公众号", sourceType: "品牌观察", sourceMeta: item.author ?? "公众号" };
    case "x":
      return { source: "X", sourceType: "X 讨论", sourceMeta: asString(item.extra?.author, "X") };
    case "reddit":
      return { source: "Reddit", sourceType: "社区讨论", sourceMeta: asString(item.extra?.subreddit, "Reddit") };
    case "news":
      return { source: "独立站", sourceType: "新闻门户", sourceMeta: domainOf(item.url) };
    default:
      return { source: "独立站", sourceType: "独立站", sourceMeta: domainOf(item.url) };
  }
}

// 抖音正文常为空、标题是话题词,摘要改用「正文/话题 + 互动数」,避免和标题重复。
function buildSummary(item: RawItem): string {
  if (item.source === "douyin") {
    const tags = Array.isArray(item.extra?.hashtags) ? (item.extra.hashtags as string[]) : [];
    const like = item.metrics?.like ?? 0;
    const comment = item.metrics?.comment ?? 0;
    const body = item.content && item.content.trim() && item.content.trim() !== item.title ? item.content.trim() : "";
    const topic = tags.length > 0 ? `话题:${tags.slice(0, 5).join("、")}` : "";
    const parts = [body, topic, `赞${like} 评${comment}`].filter(Boolean);
    return truncate(parts.join(" · "), 120);
  }
  return truncate(item.content || item.title, 120);
}

// 展示标签:抖音热度高标"高互动",海外内容标"海外",其余标"资讯"。
function viewTags(item: RawItem): NewsItem["tags"] {
  if (item.source === "douyin") {
    const likes = item.metrics?.like ?? 0;
    return likes >= 1000 ? [{ label: "短视频" }, { label: "高互动", tone: "warm" }] : [{ label: "短视频" }];
  }
  if (item.lang === "en") return [{ label: "海外", tone: "blue" }];
  return [{ label: "资讯" }];
}

export function rawToNews(item: RawItem): NewsItem {
  const view = viewSource(item);
  return {
    time: formatStamp(item.publishedAt ?? item.fetchedAt),
    title: truncate(item.title, 60),
    summary: buildSummary(item),
    source: view.source,
    sourceType: view.sourceType,
    sourceMeta: view.sourceMeta,
    tags: viewTags(item),
    url: item.url || undefined
  };
}
