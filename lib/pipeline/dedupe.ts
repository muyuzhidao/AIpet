// 去重:同一来源下标题高度相同的内容(抖音常见同名作品/重复推送)合并,保留互动最高的一条,
// 并把同类条数记到 extra.dupCount —— 这是"多少人在发同一件事"的热度信号,供 AI 分析参考。

import type { RawItem } from "../types";

function normalizeTitle(title: string): string {
  return title.replace(/[\s#,，。.、!！?？·:：;；()（）\[\]【】]/g, "").toLowerCase();
}

export function dedupeItems(items: RawItem[]): RawItem[] {
  const map = new Map<string, RawItem>();

  for (const item of items) {
    const norm = normalizeTitle(item.title);
    // 标题归一化后为空时退回用 id,避免把不同空标题项误并到一起。
    const key = norm ? `${item.source}|${norm}` : `${item.source}|${item.id}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...item, extra: { ...item.extra, dupCount: 1 } });
      continue;
    }

    const count = (typeof existing.extra?.dupCount === "number" ? existing.extra.dupCount : 1) + 1;
    const winner = (item.metrics?.like ?? 0) > (existing.metrics?.like ?? 0) ? item : existing;
    map.set(key, { ...winner, extra: { ...winner.extra, dupCount: count } });
  }

  return [...map.values()];
}
