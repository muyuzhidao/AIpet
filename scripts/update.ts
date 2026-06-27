// 「开始更新」编排:抓取(抖音/小红书/公众号/Tavily/Grok) → 去重 → 规范化 → AI 分析(DeepSeek) → 写 data/snapshot.json。
//   抓取与 AI 任一环节部分失败都不阻断:至少产出 news;AI 失败则 featured/日报回退种子。
// 运行:npm run update

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RawItem, Snapshot, SourceRunResult, UpdateRun } from "../lib/types";
import { fetchDouyin, fetchWechat, fetchXiaohongshu } from "../lib/sources/redfox";
import { fetchTavily } from "../lib/sources/tavily";
import { fetchGrok } from "../lib/sources/grok";
import { dedupeItems } from "../lib/pipeline/dedupe";
import { filterAndSortByRecency } from "../lib/pipeline/timeline";
import { filterByValue } from "../lib/pipeline/relevance";
import { rawToNews } from "../lib/pipeline/normalize";
import { runAnalysis, type AnalysisResult } from "../lib/pipeline/analyze";
import { hasDeepSeek } from "../lib/ai/deepseek";

const DATA_DIR = path.join(process.cwd(), "data");

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const runId = `run-${startedAt.replace(/[:.]/g, "-")}`;
  console.log(`[update] 开始 ${runId}`);

  const fetched: RawItem[] = [];
  const sources: SourceRunResult[] = [];

  // 5 个来源并行抓取(各 fetch 函数内部已 try/catch,不会 reject,故 Promise.all 安全)。
  const labeled: Array<[string, Promise<{ items: RawItem[]; result: SourceRunResult }>]> = [
    ["抖音(RedFox)", fetchDouyin(startedAt)],
    ["小红书(RedFox)", fetchXiaohongshu(startedAt)],
    ["公众号(RedFox)", fetchWechat(startedAt)],
    ["Tavily", fetchTavily(startedAt)],
    ["Grok(X)", fetchGrok(startedAt)]
  ];
  const settled = await Promise.all(labeled.map(([, promise]) => promise));
  labeled.forEach(([label], i) => {
    const r = settled[i];
    fetched.push(...r.items);
    sources.push(r.result);
    console.log(`[update] ${label}: ${r.result.status} · ${r.items.length} 条 · ${r.result.error ?? "无错误"}`);
  });

  const RECENT_DAYS = 30;
  const deduped = dedupeItems(fetched);
  const recent = filterAndSortByRecency(deduped, RECENT_DAYS, Date.parse(startedAt));
  const items = filterByValue(recent);
  console.log(`[update] 去重 ${fetched.length}→${deduped.length} · 近${RECENT_DAYS}天 ${recent.length} · 价值过滤 → ${items.length} 条`);

  const news = items.map(rawToNews);

  // AI 分析:失败不阻断,仅记录;featured / 日报 / 今日热点 / 来源计数回退种子。
  let analysis: AnalysisResult | null = null;
  if (hasDeepSeek() && items.length > 0) {
    try {
      analysis = await runAnalysis(items, startedAt);
      console.log(`[update] AI 分析: ${analysis.opportunities.length} 个机会 · 日报 ${analysis.daily.reportCards.length} 章`);
    } catch (error) {
      console.error(`[update] AI 分析失败(精选/日报回退种子): ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log("[update] 跳过 AI 分析(无 DEEPSEEK_API_KEY 或无数据)");
  }

  const run: UpdateRun = {
    id: runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    sources,
    rawCount: items.length,
    opportunityCount: analysis?.opportunities.length ?? 0,
    notes: "抖音 + 小红书 + 公众号 + Tavily + Grok(X)→ 去重 → DeepSeek 分析(精选/日报)"
  };

  // 部分快照:news/run 必写;AI 成功时一并写 featured/topics/sources/daily,否则这些回退种子。
  const snapshot: Partial<Snapshot> = {
    generatedAt: run.finishedAt,
    runId,
    news,
    run,
    ...(analysis
      ? { featured: analysis.featured, topics: analysis.topics, sources: analysis.sources, daily: analysis.daily }
      : {})
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, "snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(path.join(DATA_DIR, `raw-${runId}.json`), `${JSON.stringify(fetched, null, 2)}\n`, "utf8");
  console.log(`[update] 写入 data/snapshot.json(${news.length} 条动态, 精选 ${analysis?.featured.length ?? 0})`);

  if (news.length === 0) {
    console.error("[update] 所有源都没拿到数据,页面将继续回退种子。");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[update] 异常:", error);
  process.exitCode = 1;
});
