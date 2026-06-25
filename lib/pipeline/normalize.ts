// 规范化:把抓取的 RawItem 映射成页面「全部宠业动态」用的 NewsItem 视图。
// 按来源(独立站 / X / Reddit)给出不同的展示标签;标题翻译与机会分类留给第 5 步的 AI。

import type { NewsItem, RawItem } from "../types";

function toHhmm(iso?: string): string {
  if (!iso) return "--:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
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

export function rawToNews(item: RawItem): NewsItem {
  const view = viewSource(item);
  return {
    time: toHhmm(item.publishedAt ?? item.fetchedAt),
    title: truncate(item.title, 60),
    summary: truncate(item.content || item.title, 120),
    source: view.source,
    sourceType: view.sourceType,
    sourceMeta: view.sourceMeta,
    tags: item.lang === "en" ? [{ label: "海外", tone: "blue" }] : [{ label: "资讯" }]
  };
}
