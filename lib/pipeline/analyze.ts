// AI 分析(DeepSeek):从规范化的 RawItem 中识别机会、4 维打分、写推荐理由,并生成 AI 日报与今日热点。
// 机会保留证据(引用回具体 RawItem 的 url),不脱离原始来源。今日热点/来源计数/日报数字由代码从真实数据派生。

import type {
  Chip,
  ChipTone,
  DailyLead,
  DailySection,
  EvidenceRef,
  FeaturedStory,
  Opportunity,
  RawItem,
  ReportCard,
  ScoreBreakdown,
  SourceStat,
  TopTopic
} from "../types";
import { chatJson } from "../ai/deepseek";

const SOURCE_LABEL: Record<string, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  wechat: "公众号",
  x: "X",
  reddit: "Reddit",
  news: "独立站",
  independent_site: "独立站"
};

// 侧栏固定的 6 个来源顺序。
const SIDEBAR_SOURCES = ["抖音", "小红书", "公众号", "Reddit", "X", "独立站"];

function toHhmm(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(25, Math.round(n)));
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return {};
      }
    }
    return {};
  }
}

function categoryChips(labels: string[] = []): Chip[] {
  return labels
    .filter(Boolean)
    .slice(0, 3)
    .map((label, i) => ({ label: String(label), tone: (i === 0 ? "accent" : "blue") as ChipTone }));
}

function tagChips(labels: unknown): Chip[] {
  if (!Array.isArray(labels)) return [];
  return labels
    .filter(Boolean)
    .slice(0, 4)
    .map((label, i) => (i === 0 ? { label: String(label), tone: "warm" as ChipTone } : { label: String(label) }));
}

// ---- 机会识别 ----

type RawOpportunity = {
  title?: string;
  summary?: string;
  segment?: string;
  categories?: string[];
  tags?: string[];
  scores?: { demand?: number; growth?: number; gap?: number; actionability?: number };
  reason?: string;
  evidence?: number[];
};

const OPP_SYSTEM =
  "你是资深宠物行业机会分析师,服务线上宠物品牌老板。任务是从多平台动态里发现值得验证的新产品/新品类机会,而不是罗列热点。只输出 JSON。";

function digestItems(items: RawItem[]): string {
  return items
    .map((it, i) => {
      const src = SOURCE_LABEL[it.source] ?? it.source;
      const metric = it.metrics ? ` 赞${it.metrics.like ?? 0}评${it.metrics.comment ?? 0}` : "";
      const dup = typeof it.extra?.dupCount === "number" && it.extra.dupCount > 1 ? ` 同类${it.extra.dupCount}条` : "";
      const body = (it.content || it.title).replace(/\s+/g, " ").slice(0, 100);
      const title = it.title.replace(/\s+/g, " ").slice(0, 40);
      return `[${i}](${src}${metric}${dup}) ${title} || ${body}`;
    })
    .join("\n");
}

function oppPrompt(count: number): string {
  return [
    `下面是今天抓取的 ${count} 条宠物行业动态,来自抖音短视频、海外独立站/研报、X 讨论。`,
    "每条格式:[序号](来源 赞数评数) 标题 || 内容摘要。",
    "",
    "请识别 8-12 个最值得验证的机会(跨来源重复出现、痛点明确、同类条数多的优先)。相似或同主题的机会必须合并为一个,不要输出重复或高度雷同的机会。每个机会按 4 维各 0-25 分打分:",
    "- demand 需求强度:真实痛点、反复提及、求推荐、吐槽",
    "- growth 增长信号:近期频率、跨平台扩散、热度上升",
    "- gap 竞品空白:出现“买不到/不好用/选择少/不放心”等缺口",
    "- actionability 可行动性:能否形成具体产品方向或验证动作",
    "",
    "只返回 JSON 对象:",
    '{"opportunities":[{"title":"机会标题","summary":"2-3句中文说明","segment":"主粮|零食|护理|用品|药品|出海 之一","categories":["猫"|"犬"|"猫犬"等],"tags":["短标签"],"scores":{"demand":0,"growth":0,"gap":0,"actionability":0},"reason":"为什么值得验证,1-2句中文","evidence":[引用的条目序号]}]}',
    "evidence 必须是上面真实出现过的序号。不要输出 JSON 以外的任何文字。",
    "",
    "动态列表:"
  ].join("\n");
}

function toOpportunity(raw: RawOpportunity, items: RawItem[], index: number, createdAt: string): Opportunity {
  const s = raw.scores ?? {};
  const demand = clampScore(s.demand);
  const growth = clampScore(s.growth);
  const gap = clampScore(s.gap);
  const actionability = clampScore(s.actionability);
  const scores: ScoreBreakdown = { demand, growth, gap, actionability, total: demand + growth + gap + actionability };

  const evidence: EvidenceRef[] = (Array.isArray(raw.evidence) ? raw.evidence : [])
    .map((n) => items[n])
    .filter((it): it is RawItem => Boolean(it))
    .slice(0, 6)
    .map((it) => ({
      rawItemId: it.id,
      source: it.source,
      url: it.url,
      excerpt: (it.content || it.title).replace(/\s+/g, " ").slice(0, 120)
    }));

  return {
    id: `opp-${index}`,
    createdAt,
    title: raw.title ?? "未命名机会",
    summary: raw.summary ?? "",
    segment: raw.segment ?? "用品",
    categories: categoryChips(raw.categories),
    tags: tagChips(raw.tags),
    aiReason: raw.reason ?? "",
    scores,
    evidence,
    sourceCount: evidence.length,
    status: "new"
  };
}

// 喂给 AI 的样本:数据量大时按来源各取互动 top N,避免撑爆上下文,同时保证各来源都进入分析。
function selectForAnalysis(items: RawItem[], perSourceCap: number): RawItem[] {
  const bySource = new Map<string, RawItem[]>();
  for (const it of items) {
    const arr = bySource.get(it.source) ?? [];
    arr.push(it);
    bySource.set(it.source, arr);
  }
  const engagement = (it: RawItem) => (it.metrics?.like ?? 0) + (it.metrics?.comment ?? 0);
  const out: RawItem[] = [];
  for (const arr of bySource.values()) {
    arr.sort((a, b) => engagement(b) - engagement(a));
    out.push(...arr.slice(0, perSourceCap));
  }
  return out;
}

async function analyzeOpportunities(items: RawItem[], createdAt: string): Promise<Opportunity[]> {
  // evidence 序号必须对应喂给 AI 的同一数组,故 digest 与 toOpportunity 都用 pool。
  const pool = selectForAnalysis(items, 50);
  const content = await chatJson([
    { role: "system", content: OPP_SYSTEM },
    { role: "user", content: `${oppPrompt(pool.length)}\n${digestItems(pool)}` }
  ]);
  const parsed = parseJsonObject(content);
  const list = Array.isArray(parsed.opportunities) ? (parsed.opportunities as RawOpportunity[]) : [];
  return list.map((o, i) => toOpportunity(o, pool, i, createdAt));
}

// ---- AI 日报 ----

const DAILY_SYSTEM = "你是宠物行业分析师,为品牌老板写每日机会简报。只输出 JSON。";

function dailyPrompt(opps: Opportunity[]): string {
  const brief = opps
    .map((o, i) => `${i + 1}. [${o.segment}] ${o.title}(评分${o.scores.total}) — ${o.summary}`)
    .join("\n");
  return [
    "基于今天识别出的宠物行业机会(下面列表),写一版面向品牌老板的「AI 日报」。",
    "需要 4 个章节,依次聚焦:今日最值得验证的结论、内容热度变化、品牌动作/竞品信号、海外信号。",
    "再给一个总览 lead:一句话主结论 + 2-3 句展开。",
    "只返回 JSON 对象:",
    '{"lead":{"title":"一句话主结论","summary":"2-3句展开"},"reportCards":[{"number":"01 · 今日结论","title":"标题","summary":"2-3句","tags":["标签"]},{"number":"02 · 内容热度","title":"","summary":"","tags":[]},{"number":"03 · 品牌动作","title":"","summary":"","tags":[]},{"number":"04 · 海外信号","title":"","summary":"","tags":[]}]}',
    "不要输出 JSON 以外的任何文字。",
    "",
    "机会列表:",
    brief
  ].join("\n");
}

type DailyResult = { leadTitle: string; leadSummary: string; reportCards: ReportCard[] };

async function generateDailyReport(opps: Opportunity[]): Promise<DailyResult> {
  const content = await chatJson([
    { role: "system", content: DAILY_SYSTEM },
    { role: "user", content: dailyPrompt(opps) }
  ]);
  const parsed = parseJsonObject(content);
  const rawCards = Array.isArray(parsed.reportCards) ? parsed.reportCards : [];
  const reportCards: ReportCard[] = rawCards.map((c) => {
    const card = c as { number?: unknown; title?: unknown; summary?: unknown; tags?: unknown };
    return {
      number: String(card.number ?? ""),
      title: String(card.title ?? ""),
      summary: String(card.summary ?? ""),
      tags: tagChips(card.tags)
    };
  });
  const lead = (parsed.lead ?? {}) as { title?: unknown; summary?: unknown };
  return {
    leadTitle: String(lead.title ?? "今日宠物行业机会简报"),
    leadSummary: String(lead.summary ?? ""),
    reportCards
  };
}

// ---- 派生(代码,不调用 AI) ----

function opportunityToFeatured(opp: Opportunity, createdAt: string): FeaturedStory {
  const srcLabels = [...new Set(opp.evidence.map((e) => SOURCE_LABEL[e.source] ?? e.source))];
  return {
    time: toHhmm(createdAt),
    title: opp.title,
    summary: opp.summary,
    sources: srcLabels.length > 0 ? srcLabels : ["综合"],
    sourceCount: `${opp.sourceCount} 信源`,
    segment: opp.segment,
    categories: opp.categories,
    tags: opp.tags,
    aiReason: opp.aiReason,
    score: opp.scores.total,
    url: opp.evidence[0]?.url
  };
}

function deriveTopics(opps: Opportunity[]): TopTopic[] {
  return [...opps]
    .sort((a, b) => b.scores.total - a.scores.total)
    .slice(0, 3)
    .map((o, i) => ({
      rank: String(i + 1),
      title: o.title,
      summary: o.summary.slice(0, 50),
      meta: `${o.sourceCount} 信源 · 评分 ${o.scores.total}`
    }));
}

function countSources(items: RawItem[]): SourceStat[] {
  const counts: Record<string, number> = {};
  for (const it of items) {
    const label = SOURCE_LABEL[it.source] ?? it.source;
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return SIDEBAR_SOURCES.map((label) => ({ label, count: String(counts[label] ?? 0) }));
}

export type AnalysisResult = {
  featured: FeaturedStory[];
  topics: TopTopic[];
  sources: SourceStat[];
  daily: DailySection;
  opportunities: Opportunity[];
};

// 跑完整分析:机会识别 + 日报,其余派生。AI 调用失败会向上抛,由编排决定是否回退。
export async function runAnalysis(items: RawItem[], createdAt: string): Promise<AnalysisResult> {
  const opportunities = await analyzeOpportunities(items, createdAt);
  const daily = await generateDailyReport(opportunities);

  const segments = new Set(opportunities.map((o) => o.segment));
  const sources = countSources(items);
  const activeSources = sources.filter((s) => Number(s.count) > 0).length;

  const lead: DailyLead = {
    title: daily.leadTitle,
    summary: daily.leadSummary,
    stats: [
      { value: String(items.length), label: "今日动态" },
      { value: String(opportunities.length), label: "精选机会" },
      { value: String(segments.size), label: "重点赛道" },
      { value: String(activeSources), label: "接入来源" }
    ]
  };

  return {
    featured: opportunities.map((o) => opportunityToFeatured(o, createdAt)),
    topics: deriveTopics(opportunities),
    sources,
    daily: { lead, reportCards: daily.reportCards, archive: [] },
    opportunities
  };
}
