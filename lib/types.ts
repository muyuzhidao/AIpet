// 统一数据结构。
// - 视图模型(FeaturedStory / NewsItem / ...):app/components.tsx 直接渲染的形状。
// - 规范结构(RawItem / Opportunity):lib/pipeline 抓取与分析的产出,保留原始来源和中间结果。
// - 运行日志(UpdateRun):每次「开始更新」的成功/失败记录,支撑部分失败可用。

export type ChipTone = "default" | "accent" | "warm" | "blue" | "rose";

export type Chip = {
  label: string;
  tone?: ChipTone;
};

// ---- 视图模型(页面直接渲染) ----

export type FeaturedStory = {
  time: string;
  title: string;
  summary: string;
  sources: string[];
  sourceCount: string;
  segment: string;
  tags: Chip[];
  categories: Chip[];
  aiReason: string;
};

export type NewsItem = {
  time: string;
  title: string;
  summary: string;
  source: string;
  sourceType: string;
  sourceMeta: string;
  tags: Chip[];
};

export type ReportCard = {
  number: string;
  title: string;
  summary: string;
  tags: Chip[];
};

export type TopTopic = {
  rank: string;
  title: string;
  summary: string;
  meta: string;
};

export type SourceStat = {
  label: string;
  count: string;
};

export type ArchiveItem = {
  date: string;
  title: string;
  count: string;
};

export type DailySection = {
  reportCards: ReportCard[];
  archive: ArchiveItem[];
};

// ---- 抓取 / 分析的规范结构(管线产出,地基) ----

// 内容来源。tavily / grok 是抓取方式(见 FetchVia),不算来源本身。
export type SourceKind =
  | "reddit"
  | "x"
  | "wechat"
  | "douyin"
  | "xiaohongshu"
  | "news"
  | "independent_site";

// 抓取方式:同一来源可能经不同通道获取(如 X 内容经第三方 Grok 检索)。
export type FetchVia = "reddit_api" | "x_grok" | "tavily" | "manual";

// 一条原始内容,清洗去重前的最小单元。保留原文链接与原始字段。
export type RawItem = {
  id: string;
  source: SourceKind;
  fetchedVia: FetchVia;
  url: string;
  title: string;
  content: string;
  lang: "zh" | "en" | string;
  author?: string;
  publishedAt?: string; // ISO 8601
  fetchedAt: string; // ISO 8601
  metrics?: Record<string, number>; // 点赞 / 评论 / 转发等热度字段
  extra?: Record<string, unknown>; // 来源特有的原始字段,按需保留
};

// 机会评分:4 维各 25 分,合计 100。见需求总结第 8 节。
export type ScoreBreakdown = {
  demand: number; // 需求强度
  growth: number; // 增长信号
  gap: number; // 竞品空白
  actionability: number; // 可行动性
  total: number;
};

// 机会池状态。见需求总结第 9 节。
export type OpportunityStatus =
  | "new" // 新收藏
  | "to_validate" // 待验证
  | "watching" // 观察中
  | "rejected" // 已否定
  | "converted"; // 已转项目

// 一条机会引用的证据,指回具体的 RawItem 与原文。
export type EvidenceRef = {
  rawItemId: string;
  source: SourceKind;
  url: string;
  excerpt: string;
};

// 聚合分析后的机会,精选区渲染的来源。映射成 FeaturedStory 视图供页面使用。
export type Opportunity = {
  id: string;
  createdAt: string; // ISO 8601
  title: string;
  summary: string;
  segment: string;
  categories: Chip[];
  tags: Chip[];
  aiReason: string;
  scores: ScoreBreakdown;
  evidence: EvidenceRef[];
  sourceCount: number;
  status: OpportunityStatus;
};

// ---- 更新运行日志(失败可观察) ----

export type SourceRunStatus = "ok" | "partial" | "failed" | "skipped";

export type SourceRunResult = {
  source: SourceKind;
  fetchedVia: FetchVia;
  status: SourceRunStatus;
  itemCount: number;
  error?: string;
  startedAt: string; // ISO 8601
  finishedAt: string; // ISO 8601
};

export type UpdateRun = {
  id: string;
  startedAt: string; // ISO 8601
  finishedAt: string; // ISO 8601
  sources: SourceRunResult[];
  rawCount: number;
  opportunityCount: number;
  notes?: string;
};

// ---- 页面数据快照(一次更新的完整产出) ----

// 页面读取的单一入口。lib/store 优先读 data/snapshot.json,缺失时回退 lib/seed。
export type Snapshot = {
  generatedAt: string; // ISO 8601
  runId?: string;
  featured: FeaturedStory[];
  news: NewsItem[];
  topics: TopTopic[];
  sources: SourceStat[];
  daily: DailySection;
  run?: UpdateRun;
};
