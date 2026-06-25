// 「开始更新」编排脚本(手动每天跑一次):
//   抓取(Tavily 新闻/独立站 + Grok 的 X 内容) → 规范化 → 写入 data/snapshot.json → 留档原始 RawItem。
//   某个源失败不影响其余(部分可用)。Reddit 在后续加入,AI 分析在第 5 步加入。
// 运行:npm run update

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RawItem, Snapshot, SourceRunResult, UpdateRun } from "../lib/types";
import { fetchTavily } from "../lib/sources/tavily";
import { fetchGrok } from "../lib/sources/grok";
import { rawToNews } from "../lib/pipeline/normalize";

const DATA_DIR = path.join(process.cwd(), "data");

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const runId = `run-${startedAt.replace(/[:.]/g, "-")}`;
  console.log(`[update] 开始 ${runId}`);

  const items: RawItem[] = [];
  const sources: SourceRunResult[] = [];

  const tavily = await fetchTavily(startedAt);
  items.push(...tavily.items);
  sources.push(tavily.result);
  console.log(`[update] Tavily: ${tavily.result.status} · ${tavily.items.length} 条 · ${tavily.result.error ?? "无错误"}`);

  const grok = await fetchGrok(startedAt);
  items.push(...grok.items);
  sources.push(grok.result);
  console.log(`[update] Grok(X): ${grok.result.status} · ${grok.items.length} 条 · ${grok.result.error ?? "无错误"}`);

  const news = items.map(rawToNews);

  const run: UpdateRun = {
    id: runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    sources,
    rawCount: items.length,
    opportunityCount: 0,
    notes: "第 3 步:Tavily(新闻/独立站)+ Grok(X);未接 Reddit 与 AI 分析"
  };

  // 部分快照:只写本步产出的字段(news / run);featured、topics、daily 等由 store 回退到种子。
  const snapshot: Partial<Snapshot> = {
    generatedAt: run.finishedAt,
    runId,
    news,
    run
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, "snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(path.join(DATA_DIR, `raw-${runId}.json`), `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(`[update] 写入 data/snapshot.json(${news.length} 条动态)与原始留档 data/raw-${runId}.json`);

  if (news.length === 0) {
    console.error("[update] 所有源都没拿到数据,页面将继续回退种子。");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[update] 异常:", error);
  process.exitCode = 1;
});
