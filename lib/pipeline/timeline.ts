// 时间线规则:区分发布时间(publishedAt)与抓取时间(fetchedAt),过滤过旧内容并按发布时间倒序。
// 抖音/小红书/公众号有真实发布时间;X(Grok)、部分独立站无发布时间,视为近期检索结果保留。

import type { RawItem } from "../types";

const DAY_MS = 86_400_000;

// 用于排序的时间戳:优先发布时间,缺失则用抓取时间。
export function publishedTs(item: RawItem): number {
  if (item.publishedAt) {
    const t = Date.parse(item.publishedAt);
    if (!Number.isNaN(t)) return t;
  }
  const fetched = Date.parse(item.fetchedAt);
  return Number.isNaN(fetched) ? 0 : fetched;
}

// ① 过滤掉发布时间超过 recentDays 天、或异常落在未来的内容(无发布时间的保留);
// ② 按发布时间倒序(最新在前)。
export function filterAndSortByRecency(items: RawItem[], recentDays: number, nowMs: number): RawItem[] {
  const maxAge = recentDays * DAY_MS;
  const recent = items.filter((item) => {
    if (!item.publishedAt) return true; // 无发布时间(X / 部分独立站):保留为近期
    const t = Date.parse(item.publishedAt);
    if (Number.isNaN(t)) return true;
    if (t > nowMs + DAY_MS) return false; // 异常的未来时间剔除
    return nowMs - t <= maxAge;
  });
  return recent.sort((a, b) => publishedTs(b) - publishedTs(a));
}
