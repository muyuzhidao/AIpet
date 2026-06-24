export type ChipTone = "default" | "accent" | "warm" | "blue" | "rose";

export type Chip = {
  label: string;
  tone?: ChipTone;
};

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

export const sourceStats = [
  { label: "抖音", count: "31" },
  { label: "小红书", count: "42" },
  { label: "公众号", count: "17" },
  { label: "Reddit", count: "18" },
  { label: "X", count: "11" },
  { label: "独立站", count: "7" }
];

export const topTopics = [
  {
    rank: "1",
    title: "低粉尘猫砂与“呼吸友好”需求同时升温",
    summary: "小红书、Reddit、X 都在讨论粉尘、刺激感和除味难兼得的问题。",
    meta: "4 信源 · 2 小时前"
  },
  {
    rank: "2",
    title: "老年犬关节护理零食从“功能型”转向“日常化”",
    summary: "英文社区讨论 mobility，中文内容更在意适口性和长期喂养负担。",
    meta: "3 信源 · 4 小时前"
  },
  {
    rank: "3",
    title: "宠物除味产品从香味覆盖走向酶解和安全表达",
    summary: "“源头分解”“宠物舔舐安全”“成分透明”在短视频里明显增多。",
    meta: "5 信源 · 6 小时前"
  }
];

export const featuredStories: FeaturedStory[] = [
  {
    time: "09:18",
    title: "低粉尘猫砂与“呼吸友好”清洁需求升温",
    summary:
      "用户不再只看“除味强不强”，而是在同时比较粉尘、刺激感、猫咪呼吸反应和家里空气残留。国内内容偏生活困扰，海外讨论偏 mild asthma 和 dust control。",
    sources: ["精选", "小红书 · Reddit"],
    sourceCount: "4 信源",
    segment: "用品",
    categories: [
      { label: "猫", tone: "accent" },
      { label: "清洁", tone: "blue" }
    ],
    tags: [
      { label: "需求强", tone: "warm" },
      { label: "跨平台扩散" },
      { label: "供给缺口" },
      { label: "英文讨论增加", tone: "blue" }
    ],
    aiReason:
      "这个机会同时满足高频痛点、跨平台重复出现和具体供给缺口三个条件，已经不是单点内容热词，更像可落地的产品方向。"
  },
  {
    time: "08:41",
    title: "老年犬关节护理零食开始从“药感”走向“零食化”表达",
    summary:
      "海外用户持续提 mobility chews、daily supplement，国内内容则强调“别像药”“别太硬”“长期吃也没有心理负担”。",
    sources: ["精选", "Reddit · 公众号"],
    sourceCount: "3 信源",
    segment: "零食",
    categories: [
      { label: "犬", tone: "accent" },
      { label: "营养", tone: "blue" }
    ],
    tags: [
      { label: "老年犬", tone: "warm" },
      { label: "日常化" },
      { label: "适口性诉求" },
      { label: "内容可教育", tone: "blue" }
    ],
    aiReason:
      "这是一个很适合从内容验证切进产品验证的方向，因为痛点明确、人群聚焦，且可以快速拆出配方、口感和包装三类测试变量。"
  },
  {
    time: "07:56",
    title: "宠物除味产品从香味掩盖转向“源头分解 + 安全透明”",
    summary:
      "短视频评论区和海外独立站卖点都在避开“香得很重”的表述，转而强调酶解、无刺激、舔舐安全和适合小空间使用。",
    sources: ["精选", "抖音 · Tavily · 独立站"],
    sourceCount: "5 信源",
    segment: "护理",
    categories: [
      { label: "猫犬", tone: "accent" },
      { label: "护理", tone: "blue" }
    ],
    tags: [
      { label: "话术迁移", tone: "warm" },
      { label: "安全信任" },
      { label: "适合内容测试" },
      { label: "品牌教育空间", tone: "blue" }
    ],
    aiReason:
      "这里的价值不只在产品，还在卖点重写。已经能看到用户对旧话术失去耐心，这类切换通常会带来新品牌的窗口期。"
  },
  {
    time: "06:47",
    title: "猫咪湿粮用户开始关注“开罐后保存”和小规格包装",
    summary:
      "小红书里关于吃不完、冷藏串味、复热不方便的笔记增加，Reddit 也有用户讨论 single-serve wet food 的浪费问题。",
    sources: ["精选", "小红书 · Reddit"],
    sourceCount: "4 信源",
    segment: "主粮",
    categories: [
      { label: "猫", tone: "accent" },
      { label: "食品", tone: "blue" }
    ],
    tags: [
      { label: "包装机会", tone: "warm" },
      { label: "小规格" },
      { label: "复购场景" },
      { label: "独立站可测", tone: "blue" }
    ],
    aiReason:
      "痛点集中在喂养流程而不是配方本身，适合用小规格、密封结构和组合装快速测试用户是否愿意为便利性付费。"
  },
  {
    time: "05:38",
    title: "宠物智能饮水机评价从“会不会喷水”转向“清洗成本”",
    summary:
      "短视频评论区对滤芯价格、拆洗复杂度和噪音稳定性的追问增多，说明用户决策开始从新鲜感转向长期使用成本。",
    sources: ["精选", "抖音 · 公众号"],
    sourceCount: "3 信源",
    segment: "用品",
    categories: [
      { label: "猫犬", tone: "accent" },
      { label: "用品", tone: "blue" }
    ],
    tags: [
      { label: "长期成本", tone: "warm" },
      { label: "使用体验" },
      { label: "售后风险" }
    ],
    aiReason:
      "这个信号适合品牌重新设计详情页和售后话术，把清洗、滤芯和噪音从FAQ后置问题改成主卖点。"
  },
  {
    time: "04:22",
    title: "海外独立站把“犬种适配”前移到狗粮筛选流程",
    summary:
      "Tavily 抓取到多个 DTC 宠物食品站把 breed、age、activity level 放到首页问答里，用户先分型再看产品。",
    sources: ["精选", "Tavily · 独立站"],
    sourceCount: "5 信源",
    segment: "出海",
    categories: [
      { label: "犬", tone: "accent" },
      { label: "出海", tone: "blue" }
    ],
    tags: [
      { label: "转化路径", tone: "warm" },
      { label: "站内问答" },
      { label: "个性化推荐" }
    ],
    aiReason:
      "独立站的机会不只是卖什么，而是怎么问用户。犬种适配可以提高信任感，也能沉淀更清晰的人群标签。"
  },
  {
    time: "03:26",
    title: "宠物皮肤外用药开始强调“低刺激 + 易坚持用药”",
    summary:
      "公众号和短视频内容里，用户更常提到喷雾气味、涂抹后舔舐风险和连续用药是否麻烦，说明药品购买正在从单纯疗效比较，转向可执行性比较。",
    sources: ["精选", "公众号 · 抖音"],
    sourceCount: "3 信源",
    segment: "药品",
    categories: [
      { label: "猫犬", tone: "accent" },
      { label: "药品", tone: "blue" }
    ],
    tags: [
      { label: "依从性", tone: "warm" },
      { label: "低刺激" },
      { label: "复购空间" }
    ],
    aiReason:
      "药品方向不是不能做，而是要换判断标准。谁能把刺激感、舔舐风险和连续使用门槛讲清楚，谁更容易拿到复购。"
  }
];

export const newsItems: NewsItem[] = [
  {
    time: "09:42",
    source: "小红书",
    sourceType: "一手内容",
    sourceMeta: "高互动",
    title: "“会扬灰但除味强”和“低粉尘但不够稳”成为猫砂选购里最常见的二选一",
    summary:
      "评论里用户开始主动比较颗粒大小、粉尘量、结团速度和猫咪适应反应，说明内容已经从单纯测评转向了更细的决策标准。",
    tags: [{ label: "清洁" }]
  },
  {
    time: "08:58",
    source: "Reddit",
    sourceType: "社区讨论",
    sourceMeta: "/r/dogs",
    title: "Senior dog chews 讨论里，用户更偏好“每天愿意吃”的关节补充形式",
    summary:
      "不少讨论已经不再纠结“有没有功能”，而是在问“愿不愿长期吃”“会不会吐”“有没有更像零食的形式”。",
    tags: [
      { label: "营养" },
      { label: "海外", tone: "blue" }
    ]
  },
  {
    time: "08:26",
    source: "抖音",
    sourceType: "短视频",
    sourceMeta: "涨粉快",
    title: "“一擦就没味”类宠物除味视频里，评论区开始追问成分和猫舔舐风险",
    summary: "内容热度还在，但用户疑问已经从使用效果转向安全边界，这通常意味着旧广告表达快跑不动了。",
    tags: [{ label: "护理" }]
  },
  {
    time: "07:47",
    source: "公众号",
    sourceType: "品牌观察",
    sourceMeta: "品牌动作",
    title: "多个宠物品牌开始把“低敏”“精细护理”前移到首页和主图第一屏",
    summary: "这类表述出现频率增加，说明行业已经在从基础供给竞争，转向更细的使用场景和风险感知竞争。",
    tags: [{ label: "品牌" }]
  },
  {
    time: "06:36",
    source: "X",
    sourceType: "海外趋势",
    sourceMeta: "讨论升温",
    title: "pet-safe cleaner 相关帖子里，用户开始区分“无味”和“无刺激”",
    summary: "海外用户更频繁追问是否适合猫、幼犬和小空间使用，说明安全边界正在成为清洁用品的新筛选条件。",
    tags: [
      { label: "护理" },
      { label: "海外", tone: "blue" }
    ]
  },
  {
    time: "05:52",
    source: "独立站",
    sourceType: "品牌页面",
    sourceMeta: "Tavily",
    title: "多个海外猫砂站开始把 dust-free、asthma-friendly 放进首屏卖点",
    summary: "这类词从详情页参数移动到首页首屏，通常代表品牌已经把健康焦虑当成转化抓手。",
    tags: [
      { label: "猫砂" },
      { label: "出海", tone: "blue" }
    ]
  },
  {
    time: "04:44",
    source: "抖音",
    sourceType: "短视频",
    sourceMeta: "评论集中",
    title: "宠物烘干箱视频里，“小户型能不能放”成为高频追问",
    summary: "用户对噪音、体积、耗电和收纳的关注超过单纯烘干速度，说明家居场景限制正在影响购买。",
    tags: [{ label: "用品" }]
  },
  {
    time: "03:58",
    source: "Reddit",
    sourceType: "社区讨论",
    sourceMeta: "/r/cats",
    title: "自动喂食器讨论里，用户更担心断网、卡粮和备用电源",
    summary: "海外社区对智能硬件的信任问题更直接，品牌如果做出清晰的异常处理说明，能减少购买前犹豫。",
    tags: [
      { label: "智能硬件" },
      { label: "风险", tone: "rose" }
    ]
  }
];

export const reportCards: ReportCard[] = [
  {
    number: "01 · 今日结论",
    title: "低粉尘猫砂是今天最接近产品验证的机会",
    summary: "原因不是单一平台爆了，而是生活场景、健康焦虑和现有产品缺口都开始在一个问题里汇合。",
    tags: [
      { label: "推荐先验证", tone: "accent" },
      { label: "内容切口清晰" }
    ]
  },
  {
    number: "02 · 内容热度",
    title: "“适口性像零食”正在替代“功能很强”成为老年犬内容主话术",
    summary: "这意味着产品表达要从成分堆叠，转向长期喂养心理负担的降低。",
    tags: [
      { label: "适口性", tone: "warm" },
      { label: "日常化" }
    ]
  },
  {
    number: "03 · 品牌动作",
    title: "除味护理的卖点重心开始改写，安全透明被前置",
    summary: "品牌表达一旦开始迁移，通常代表旧卖点开始疲劳，新品牌可以借这个窗口重写分类心智。",
    tags: [
      { label: "品牌心智", tone: "blue" },
      { label: "卖点改写" }
    ]
  },
  {
    number: "04 · 海外信号",
    title: "Reddit 上的 mild asthma、mobility 和 lick-safe 讨论在给国内提早打样",
    summary: "这类词汇变化说明用户开始用更明确的风险和使用场景描述需求，适合作为国内选题和产品语言的前哨。",
    tags: [
      { label: "海外前哨", tone: "blue" },
      { label: "语义变化" }
    ]
  }
];

export const archiveItems = [
  { date: "06/23", title: "功能性冻干开始从“高蛋白”转向“肠胃友好”表达", count: "18 事件" },
  { date: "06/22", title: "宠物口腔护理喷雾的真实使用体验开始分化", count: "14 事件" },
  { date: "06/21", title: "小体积烘干箱在内容平台进入新一轮讨论", count: "22 事件" }
];
