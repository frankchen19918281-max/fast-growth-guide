// 预设“认知持仓观察池”书单（演示多书可扩展架构，随时可放入epub升级为完整精读仓位）
window.PRESET_WATCHLIST_BOOKS = [
  {
    id: "pat-dorsey-five-rules",
    title: "股市真规则",
    subtitle: "成功股票投资的五大法则（《巴菲特的护城河》姊妹篇）",
    originalTitle: "The Five Rules for Successful Stock Investing",
    author: "帕特·多尔西 (Pat Dorsey)",
    category: "valuation-accounting",
    positionType: "watch",
    wordCount: "32万字（待导入epub全量拆解）",
    speedReadMinutes: 60,
    addedDate: "2026-11-10",
    coverColor: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 70%, #1d4ed8 100%)",
    coverIcon: "📊",
    tags: ["五大投资法则", "10分钟选股测试", "DCF现金流折现", "13大行业逐一拆解"],
    coreQuestion: "帕特·多尔西在《巴菲特的护城河》第12章点名推荐的姊妹篇：如何用DCF自由现金流折现算出精确内在价值，并按13个行业词典逐一剖析商业模式？",
    coreFormula: [
      {
        step: "法则 1 · 做好功课",
        title: "先穿透三张财务报表，算清自由现金流（FCF）与ROIC",
        detail: "不看懂会计语言就不买股票，重点排查应收账款突增、一次性费用操纵与现金流背离。",
        chapters: "第 1 ~ 7 章"
      },
      {
        step: "法则 2 ~ 4 · 护城河 + 安全边际 + 长期持有",
        title: "用DCF折现模型估算内在价值，预留20%~50%安全边际",
        detail: "预测未来10年自由现金流与永续价值，根据护城河宽窄设定折现率与安全边际折扣。",
        chapters: "第 8 ~ 10 章"
      },
      {
        step: "法则 5 · 行业实战词典",
        title: "13大主流行业（医疗/银行/软件/消费/能源等）选股指标全解",
        detail: "后半部是极佳的行业工具字典，看哪类股票就专门翻对应行业那一章。",
        chapters: "第 12 ~ 24 章"
      }
    ],
    speedReadGuide: {
      structuralSecret: "本书分为上下两半：前半部（1~11章）是财务排雷与DCF估值体系，后半部（12~24章）是13个行业的独立词典。速读时绝不要从头读到尾，而应“精读前半部 + 按需查阅后半部行业词典”。",
      passes: [
        {
          order: "第一阶",
          name: "15分钟 · 掌握五大法则与10分钟极速筛股法",
          duration: "15 min",
          strategy: "直接读第1章（五大法则）与第11章（10分钟测试：如何在10分钟内否决一只平庸股票）。",
          actions: [
            "掌握“10分钟测试”9步筛查表：是否持续盈利 -> 是否有充沛经营现金流 -> ROE是否稳定>10% -> 盈利是否忽高忽低 -> 资产负债表是否健康。",
            "理解自由现金流（FCF = 经营现金流 - 资本开支）占销售收入比例 > 5% 的黄金基准线。"
          ]
        }
      ],
      checkpoints: [
        {
          id: "five-cp-1",
          title: "掌握“10分钟测试”初筛漏斗",
          question: "我已能用自由现金流/营收 > 5%、ROE > 15%、低有息负债在10分钟内快速淘汰劣质公司。"
        }
      ]
    },
    industryMoatTable: [],
    chapters: [
      {
        num: "核心提要",
        title: "《巴菲特的护城河》配套估值与13行业指南（待放入书库解锁全章）",
        priority: "P0",
        estMinutes: 15,
        thesis: "如果说《巴菲特的护城河》解决了“什么是好公司”，《股市真规则》则提供了13个重点行业的专项拆解词典。",
        howToRead: "你可以随时把《股市真规则.epub》放进 书库/理财/ 目录，一键升级为全书逐章精读。",
        keyPoints: [
          "【五大成功法则】① 做好你的功课；② 寻找具有强大竞争优势（护城河）的公司；③ 拥有安全边际；④ 长期持有；⑤ 知道何时卖出。",
          "【财务黄金指标】自由现金流（FCF）/ 销售收入 > 5%，意味着公司每卖100元货，能留下5元以上真正可自由支配的真金白银。"
        ],
        cases: [],
        maxims: [
          "选股的5项原则：做好你的功课、寻找具有强大竞争优势的公司、拥有安全边际、长期持有、知道何时卖出。"
        ]
      }
    ]
  },
  {
    id: "charlie-munger-almanack",
    title: "穷查理宝典",
    subtitle: "查理·芒格智慧箴言录（多元思维模型与逆向思考）",
    originalTitle: "Poor Charlie's Almanack",
    author: "彼得·考夫曼 编 / 查理·芒格 著",
    category: "mental-models",
    positionType: "watch",
    wordCount: "40万字（待导入epub全量拆解）",
    speedReadMinutes: 60,
    addedDate: "2026-11-10",
    coverColor: "linear-gradient(135deg, #065f46 0%, #0f172a 70%, #059669 100%)",
    coverIcon: "🌱",
    tags: ["多元思维模型", "逆向思维", "能力圈", "人类误判心理学"],
    coreQuestion: "如何跳出“铁锤人倾向”，建立跨学科的100个多元思维模型格栅，并用《人类误判心理学》的25种认知偏见清单防止自己犯蠢？",
    coreFormula: [
      {
        step: "模型 1 · 格栅理论",
        title: "掌握重要学科的重要理论（数学/物理/生物进化/心理学/经济学）",
        detail: "在手里拿着铁锤的人看来，世界就像一颗钉子。唯有跨学科交叉验证才能看清商业本质。",
        chapters: "第二~四讲"
      },
      {
        step: "模型 2 · 逆向思考",
        title: "反过来想，总是反过来想（Invert, always invert）",
        detail: "想知道如何获得投资成功，先研究是什么让人在股市倾家荡产，然后一辈子避开它。",
        chapters: "第一讲 & 语录"
      },
      {
        step: "模型 3 · 检查清单",
        title: "《人类误判心理学》25个标准误判倾向",
        detail: "激励机制威力、避免不一致性、社会认同、沉没成本与Lollapalooza多因素共振效应。",
        chapters: "第十一讲（全书最核心一章）"
      }
    ],
    speedReadGuide: {
      structuralSecret: "全书40万字，但80%的精华浓缩在最后一篇《第十一讲：人类误判心理学》以及第二、三讲（普世智慧的多元思维模型）中！",
      passes: [
        {
          order: "第一阶",
          name: "20分钟 · 直奔第十一讲《人类误判心理学》",
          duration: "20 min",
          strategy: "先把芒格晚年亲自改写的25个人类心理误判倾向当成防愚检查单通读一遍。",
          actions: [
            "重点掌握：激励导致的偏见、爱屋及乌/恨屋及乌、避免怀疑与不一致性、社会认同（羊群效应）、Lollapalooza效应。"
          ]
        }
      ],
      checkpoints: [
        {
          id: "cm-cp-1",
          title: "坚持逆向思维与飞行员检查清单",
          question: "在重大决策前，我习惯先列出“什么情况下这笔投资会彻底失败”，并用检查清单逐项排除心理偏见。"
        }
      ]
    },
    industryMoatTable: [],
    chapters: [
      {
        num: "核心提要",
        title: "多元思维模型与人类误判心理学（待放入书库解锁全章）",
        priority: "P0",
        estMinutes: 20,
        thesis: "巴菲特从格雷厄姆“捡烟蒂”转向“以合理价格买入伟大护城河企业”的幕后推手正是查理·芒格。",
        howToRead: "放入《穷查理宝典.epub》后，可一键解锁十一篇演讲精读与25项误判心理自检表。",
        keyPoints: [
          "【伟大企业的复利力量】以合理的价格买进一家杰出的企业，远胜于以便宜的价格买进一家平庸的企业。",
          "【能力圈原则】知道自己能力圈的边界，比能力圈本身有多大重要十倍。"
        ],
        cases: [],
        maxims: [
          "反过来想，总是反过来想。如果我知道自己会在哪里死去，我就永远不去那个地方。",
          "以合理的价格买进一家杰出的企业，远胜于以便宜的价格买进一家平庸的企业。"
        ]
      }
    ]
  }
];
