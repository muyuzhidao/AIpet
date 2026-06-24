import Link from "next/link";
import type { ReactNode } from "react";

import {
  archiveItems,
  featuredStories,
  newsItems,
  reportCards,
  sourceStats,
  topTopics,
  type Chip,
  type FeaturedStory,
  type NewsItem
} from "./data";

export type ModuleKey = "featured" | "all-news" | "daily";

type FilterState = {
  featuredCategory?: string;
  newsSource?: string;
};

type TopPanelMeta = {
  title: string;
  description: string;
  count: string;
  search: string;
};

const featuredTabs = ["全部", "主粮", "零食", "护理", "用品", "药品", "出海"] as const;
const newsTabs = ["全部", "抖音", "小红书", "公众号", "Reddit", "X", "独立站"] as const;
const dailyTabs = ["今日", "机会", "风险", "品牌动作", "海外信号"] as const;

const navItems: Array<{ key: ModuleKey; label: string; meta: string }> = [
  { key: "featured", label: "精选", meta: "9" },
  { key: "all-news", label: "全部宠业动态", meta: "126" },
  { key: "daily", label: "AI 日报", meta: "24" }
];

const storyScores = ["66", "74", "65", "79", "72", "68", "77", "71"];

function menuItemClass(module: ModuleKey, active: ModuleKey) {
  return ["menu-item", active === module ? "active" : ""].filter(Boolean).join(" ");
}

function sourceItemClass(active: ModuleKey, label: string, selected?: string) {
  return ["menu-item", active === "all-news" && selected === label ? "active" : ""].filter(Boolean).join(" ");
}

function ChipPill({ chip }: { chip: Chip }) {
  return <span className={["chip", chip.tone ?? ""].filter(Boolean).join(" ")}>{chip.label}</span>;
}

function SourceInitial({ source }: { source: string }) {
  const normalized = source.replace("精选", "").trim();
  const initial = normalized ? normalized.slice(0, 1).toUpperCase() : "P";

  return <span className="source-avatar">{initial}</span>;
}

function getTopPanelMeta(
  active: ModuleKey,
  featuredCount: number,
  newsCount: number,
  featuredCategory?: string,
  newsSource?: string
): TopPanelMeta {
  if (active === "featured") {
    return {
      title: "精选",
      description: featuredCategory && featuredCategory !== "全部" ? `AI 自动筛选的 ${featuredCategory} 高价值机会` : "AI 自动筛选的高价值宠业机会",
      count: `${featuredCount} 条精选 · 126 条动态`,
      search: "搜索标题/摘要..."
    };
  }

  if (active === "all-news") {
    return {
      title: "全部宠业动态",
      description: newsSource && newsSource !== "全部" ? `${newsSource} 来源的宠业动态信息流` : "抖音、小红书、微信公众号、X、Reddit 与独立站信息流",
      count: newsSource && newsSource !== "全部" ? `${newsCount} 条动态 · ${newsSource}` : `${newsCount} 条动态 · 6 个来源`,
      search: "搜索来源/关键词..."
    };
  }

  return {
    title: "AI 日报",
    description: "每天压缩成宠物品牌老板能直接判断的机会简报",
    count: "VOL.2026.06.24",
    search: "搜索日报主题..."
  };
}

function buildFeaturedHref(tab: string) {
  return tab === "全部" ? "/featured" : `/featured?category=${encodeURIComponent(tab)}`;
}

function buildNewsHref(source: string) {
  return source === "全部" ? "/all-news" : `/all-news?source=${encodeURIComponent(source)}`;
}

function matchesFeaturedCategory(story: FeaturedStory, category?: string) {
  return !category || category === "全部" || story.segment === category;
}

function matchesNewsSource(item: NewsItem, source?: string) {
  return !source || source === "全部" || item.source === source;
}

function Sidebar({ active, newsSource }: { active: ModuleKey; newsSource?: string }) {
  return (
    <aside className="sidebar">
      <Link className="logo-card" href="/featured" aria-label="PET HOT 首页">
        <span>PET</span>
        <i />
        <strong>HOT</strong>
      </Link>

      <nav className="side-nav" aria-label="主导航">
        <div className="side-label">内容</div>
        {navItems.map((item) => (
          <Link className={menuItemClass(item.key, active)} href={`/${item.key}`} key={item.key}>
            <span className="menu-dot" />
            <span>{item.label}</span>
            <small>{item.meta}</small>
          </Link>
        ))}
      </nav>

      <div className="side-nav side-sources">
        <div className="side-label">来源</div>
        {sourceStats.map((item) => (
          <Link className={sourceItemClass(active, item.label, newsSource)} href={buildNewsHref(item.label)} key={item.label}>
            <span className="menu-dot muted" />
            <span>{item.label}</span>
            <small>{item.count}</small>
          </Link>
        ))}
      </div>

      <div className="side-bottom">
        <div className="mode-switch" aria-label="外观切换">
          <span>浅</span>
          <strong>桌面</strong>
          <span>深</span>
        </div>
        <a href="#">登录</a>
      </div>
    </aside>
  );
}

function TopPanel({
  active,
  featuredCategory,
  newsSource,
  featuredCount,
  newsCount
}: {
  active: ModuleKey;
  featuredCategory?: string;
  newsSource?: string;
  featuredCount: number;
  newsCount: number;
}) {
  const meta = getTopPanelMeta(active, featuredCount, newsCount, featuredCategory, newsSource);
  const currentFeaturedTab = featuredCategory && featuredTabs.includes(featuredCategory as (typeof featuredTabs)[number]) ? featuredCategory : "全部";
  const currentNewsTab = newsSource && newsTabs.includes(newsSource as (typeof newsTabs)[number]) ? newsSource : "全部";

  return (
    <header className="top-panel">
      <div className="top-title">
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <span>{meta.count}</span>
      </div>

      <div className="top-divider" />

      <div className="top-controls">
        {active === "featured" ? (
          <div className="tab-strip" aria-label="精选分类">
            {featuredTabs.map((tab) => (
              <Link className={["tab-pill", currentFeaturedTab === tab ? "active" : ""].filter(Boolean).join(" ")} href={buildFeaturedHref(tab)} key={tab}>
                {tab}
              </Link>
            ))}
          </div>
        ) : null}

        {active === "all-news" ? (
          <div className="tab-strip" aria-label="来源筛选">
            {newsTabs.map((tab) => (
              <Link className={["tab-pill", currentNewsTab === tab ? "active" : ""].filter(Boolean).join(" ")} href={buildNewsHref(tab)} key={tab}>
                {tab}
              </Link>
            ))}
          </div>
        ) : null}

        {active === "daily" ? (
          <div className="tab-strip" aria-label="日报分类">
            {dailyTabs.map((tab, index) => (
              <button className={["tab-pill", index === 0 ? "active" : ""].filter(Boolean).join(" ")} type="button" key={tab}>
                {tab}
              </button>
            ))}
          </div>
        ) : null}

        <form className="search-form">
          <input aria-label="搜索" placeholder={meta.search} />
          <button type="button">搜索</button>
        </form>
      </div>
    </header>
  );
}

function HotBoard() {
  return (
    <section className="hot-board" aria-label="今日热点">
      <div className="hot-head">
        <h2>
          <span className="hot-mark" />
          今日热点
        </h2>
        <span>多信源热度 · 随时间消退</span>
      </div>

      <div className="hot-list">
        {topTopics.map((topic) => (
          <article className="hot-row" key={topic.rank}>
            <strong>{topic.rank}</strong>
            <h3>{topic.title}</h3>
            <span>{topic.meta}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Timeline({ date, children }: { date: string; children: ReactNode }) {
  return (
    <section className="timeline">
      <div className="date-row">
        <button type="button">
          {date}
          <span>⌄</span>
        </button>
      </div>
      {children}
    </section>
  );
}

function StoryBadges({
  featured = true,
  score
}: {
  featured?: boolean;
  score: string;
}) {
  return (
    <div className="story-badges">
      {featured ? <span className="badge-hot">精选</span> : null}
      <span className="badge-score">{score}</span>
    </div>
  );
}

function FeaturedCard({ story, index }: { story: FeaturedStory; index: number }) {
  const sourceText = story.sources.filter((source) => source !== "精选").join(" · ") || story.sources[0];

  return (
    <article className="feed-card">
      <div className="feed-card-head">
        <div className="source-line">
          <SourceInitial source={sourceText} />
          <span>{sourceText}</span>
        </div>
        <StoryBadges score={storyScores[index % storyScores.length]} />
      </div>

      <h2>{story.title}</h2>
      <p>{story.summary}</p>

      <div className="tag-row">
        <ChipPill chip={{ label: story.segment, tone: "warm" }} />
        {story.categories.map((chip) => (
          <ChipPill chip={chip} key={chip.label} />
        ))}
        {story.tags.map((chip) => (
          <ChipPill chip={chip} key={chip.label} />
        ))}
      </div>

      <div className="reason-strip">
        <strong>推荐理由：</strong>
        <span>{story.aiReason}</span>
      </div>
    </article>
  );
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  return (
    <article className="feed-card">
      <div className="feed-card-head">
        <div className="source-line">
          <SourceInitial source={item.source} />
          <span>
            {item.source} · {item.sourceType}
          </span>
        </div>
        <StoryBadges featured={false} score={storyScores[(index + 2) % storyScores.length]} />
      </div>

      <h2>{item.title}</h2>
      <p>{item.summary}</p>

      <div className="tag-row">
        <ChipPill chip={{ label: item.sourceMeta, tone: "blue" }} />
        {item.tags.map((chip) => (
          <ChipPill chip={chip} key={chip.label} />
        ))}
      </div>

      <div className="reason-strip quiet">
        <strong>AI 摘要：</strong>
        <span>这条动态适合用于验证细分人群、卖点表达和内容选题的持续热度。</span>
      </div>
    </article>
  );
}

function EmptyFeed({ text }: { text: string }) {
  return (
    <article className="feed-card empty-feed">
      <h2>当前筛选下暂无结果</h2>
      <p>{text}</p>
    </article>
  );
}

function TimelineItem({ time, children }: { time: string; children: ReactNode }) {
  return (
    <div className="timeline-item">
      <time>{time}</time>
      <span className="timeline-rail">
        <span className="timeline-dot" />
      </span>
      <div className="timeline-content">{children}</div>
    </div>
  );
}

function FeaturedSection({ category }: { category?: string }) {
  const stories = featuredStories.filter((story) => matchesFeaturedCategory(story, category));

  return (
    <Timeline date={category && category !== "全部" ? `6月24日 · ${category}` : "6月24日"}>
      {stories.length > 0 ? (
        stories.map((story, index) => (
          <TimelineItem time={story.time} key={story.title}>
            <FeaturedCard story={story} index={index} />
          </TimelineItem>
        ))
      ) : (
        <TimelineItem time="--:--">
          <EmptyFeed text="这个分类下暂时还没有整理出精选信号，可以先切回“全部”或去全部宠业动态继续看来源流。" />
        </TimelineItem>
      )}
    </Timeline>
  );
}

function AllNewsSection({ source }: { source?: string }) {
  const items = newsItems.filter((item) => matchesNewsSource(item, source));

  return (
    <>
      <div className="filter-line">
        <ChipPill chip={{ label: source && source !== "全部" ? `${source} ${items.length} 条` : "今日 126 条", tone: "warm" }} />
        {["猫", "犬", "食品", "用品", "医疗", "品牌动作", "海外趋势"].map((label) => (
          <ChipPill chip={{ label }} key={label} />
        ))}
      </div>

      <Timeline date={source && source !== "全部" ? `6月24日 · ${source}` : "6月24日"}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <TimelineItem time={item.time} key={item.title}>
              <NewsCard item={item} index={index} />
            </TimelineItem>
          ))
        ) : (
          <TimelineItem time="--:--">
            <EmptyFeed text="这个来源下暂时没有样例数据，切回“全部”或换一个来源即可继续浏览。" />
          </TimelineItem>
        )}
      </Timeline>
    </>
  );
}

function DailyLead() {
  return (
    <section className="daily-lead">
      <article className="daily-summary">
        <div className="source-line">
          <SourceInitial source="PET HOT DAILY" />
          <span>PET HOT DAILY · 今日结论</span>
        </div>
        <h2>猫砂、老年犬营养和除味护理正在从内容热词进入可验证机会。</h2>
        <p>
          今天最值得注意的不是单条爆文，而是三条信号同时变清晰：同一痛点在不同平台重复出现、用户表达更具体、品牌卖点开始迁移。
        </p>
        <div className="daily-stats">
          {[
            ["126", "今日动态"],
            ["9", "精选机会"],
            ["3", "重点赛道"],
            ["6", "接入来源"]
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </article>

      <aside className="archive-card">
        <strong>历史日报</strong>
        {archiveItems.map((item) => (
          <a href="#" key={item.date}>
            <time>{item.date}</time>
            <span>{item.title}</span>
            <em>{item.count}</em>
          </a>
        ))}
      </aside>
    </section>
  );
}

function DailyReportSection() {
  return (
    <>
      <DailyLead />
      <Timeline date="AI日报 · 6月24日">
        {reportCards.map((card, index) => (
          <TimelineItem time={`0${index + 1}:00`} key={card.number}>
            <article className="feed-card report-feed-card">
              <div className="feed-card-head">
                <div className="source-line">
                  <SourceInitial source={card.number} />
                  <span>{card.number}</span>
                </div>
                <StoryBadges score={storyScores[(index + 1) % storyScores.length]} />
              </div>
              <h2>{card.title}</h2>
              <p>{card.summary}</p>
              <div className="tag-row">
                {card.tags.map((chip) => (
                  <ChipPill chip={chip} key={chip.label} />
                ))}
              </div>
              <div className="reason-strip">
                <strong>老板该看：</strong>
                <span>把它当成下一轮选题、产品页表达或小批量验证的输入。</span>
              </div>
            </article>
          </TimelineItem>
        ))}
      </Timeline>
    </>
  );
}

export function AppFrame({
  active,
  children,
  filters
}: {
  active: ModuleKey;
  children: ReactNode;
  filters?: FilterState;
}) {
  const featuredCount = featuredStories.filter((story) => matchesFeaturedCategory(story, filters?.featuredCategory)).length;
  const newsCount = newsItems.filter((item) => matchesNewsSource(item, filters?.newsSource)).length;

  return (
    <div className="app-shell">
      <Sidebar active={active} newsSource={filters?.newsSource} />
      <main className="page">
        <div className="shell">
          <TopPanel
            active={active}
            featuredCategory={filters?.featuredCategory}
            newsSource={filters?.newsSource}
            featuredCount={featuredCount}
            newsCount={newsCount}
          />
          {children}
        </div>
      </main>
    </div>
  );
}

export function FeaturedModule({ category }: { category?: string }) {
  return (
    <>
      <HotBoard />
      <FeaturedSection category={category} />
    </>
  );
}

export function AllNewsModule({ source }: { source?: string }) {
  return <AllNewsSection source={source} />;
}

export function DailyModule() {
  return <DailyReportSection />;
}
