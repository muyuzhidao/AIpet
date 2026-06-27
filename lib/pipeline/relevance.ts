// 价值过滤:抖音/小红书是消费者平台,海量普通用户的低互动帖价值低。
// 只保留「有热度」(高赞)或「被多人重复发布」(dupCount 高)的内容;
// 公众号、独立站、X 本身是行业资讯 / 行业讨论源,不做热度过滤、全部保留。

import type { RawItem } from "../types";

// 各消费者平台的高赞门槛(点赞 ≥ 此值视为有热度)。其余来源不在表中 = 不过滤。
const HOT_LIKE_THRESHOLD: Record<string, number> = {
  douyin: 1000,
  xiaohongshu: 500
};

// 被重复发布到此次数及以上,也视为热点(多人在发同一件事)。
const DUP_HOT = 3;

export function filterByValue(items: RawItem[]): RawItem[] {
  return items.filter((item) => {
    const threshold = HOT_LIKE_THRESHOLD[item.source];
    if (threshold === undefined) return true; // 行业 / 讨论源:全留
    const like = item.metrics?.like ?? 0;
    const dup = typeof item.extra?.dupCount === "number" ? item.extra.dupCount : 1;
    return like >= threshold || dup >= DUP_HOT;
  });
}
