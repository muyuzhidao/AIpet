# 记忆

## 关于我
- 角色：宠物机会情报台的产品和业务负责人
- 日常工作：围绕宠物行业机会发现、数据源接入、AI 分析、前端原型和项目规划做决策

## 项目与上下文
- 项目名：AIpet / 宠物机会情报台
- 当前形态：Next.js 本地信息站(页面「精选」「全部宠业动态」「AI 日报」)，已打通真实数据闭环——`npm run update` 抓取 → 规范化 → DeepSeek 分析 → 写 `data/snapshot.json`，页面读快照(缺失字段回退 `lib/seed.ts` 种子)
- 目标用户：线上宠物品牌老板、宠物行业初创公司创始人、新品方向和内容调研团队
- 核心价值：从多源宠物行业信息中发现可验证的新产品、新品类、内容和卖点机会
- 下一阶段重点：机会池(收藏/打标/状态)、数据源管理页、页面「开始更新」按钮、历史日报存档;Reddit 待真 secret 启用

## 技术架构与数据源
- 代码骨架：`lib/types`(统一结构) · `lib/store`(快照+种子回退,按字段浅合并) · `lib/sources/*`(各源抓取) · `lib/pipeline/{normalize,dedupe,timeline,relevance,analyze}`(规范化/去重/时效/价值过滤/AI 分析) · `lib/ai/deepseek` · `lib/http`(带超时 fetch) · `scripts/update.ts`(5 源并行编排);详见 `memory/2026-06-26.md`、`memory/2026-06-27.md`
- 凭证都在 `.env`(已 gitignore),此处只记用途：抖音/小红书/公众号=RedFox(`REDFOX_API_KEY`, redfox.hk) · 新闻独立站=Tavily(`TAVILY_API_KEYS`, 多 key) · X=Grok 代理(`GROK_*`, model `grok-4.20-multi-agent-high`, 包月) · AI 分析=DeepSeek(`DEEPSEEK_*`, model `deepseek-v4-flash`)
- 已接入并产出真实数据：抖音、小红书、公众号(RedFox)、Tavily、X(Grok)、DeepSeek;Reddit 已写好但未启用(secret 无效,需真 secret 走 OAuth)
- `data/snapshot.json`、`raw-*.json`、`*.tsbuildinfo` 是运行产物,已 gitignore

## 工作习惯与偏好
- 默认使用简体中文
- 回复要直接、具体、少术语
- 做开发任务前先明确完成标准，完成后说明验证结果
- 不需要登录功能时不提前设计登录和权限
- 功能优先做可验证闭环，不一次性铺开所有平台

## 重要决策
- 2026-06-24：初始化项目记忆系统
- 2026-06-24：产品优先级暂定为先接入真实数据源和 AI 筛选闭环，而不是继续扩展静态页面
- 2026-06-26：完成真实数据闭环(第 1–5 步)——接入抖音(RedFox)、Tavily、X(Grok)、DeepSeek 分析;Reddit 因 secret 无效搁置;详见 `memory/2026-06-26.md`
- 2026-06-26：国内平台走付费第三方 RedFox(API Key 调用,非 cookie);X 用 Grok 代理、包月不限量、进每日更新
- 2026-06-27：补齐国内三渠道(小红书/公众号);卡片可点击跳源头;时间线规则(发布时间筛 30 天+倒序+「月-日 时:分」);抖音/小红书价值过滤(高赞门槛);5 源并行+fetch 超时(~4-5min→89s);详见 `memory/2026-06-27.md`
