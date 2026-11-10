// 「快速成长指南」- 认知资产赛道分类与仓位体系定义
window.GROWTH_CATEGORIES = [
  {
    id: "all",
    name: "全部持仓",
    icon: "📊",
    desc: "所有已建仓精读与观察池书籍"
  },
  {
    id: "value-investing",
    name: "价值投资核心",
    icon: "🏰",
    color: "#d97706",
    targetWeight: 50,
    desc: "护城河、商业模式、安全边际与长期主义"
  },
  {
    id: "valuation-accounting",
    name: "财报与估值",
    icon: "📐",
    color: "#2563eb",
    targetWeight: 20,
    desc: "穿透财务数字、自由现金流折现与估值乘数"
  },
  {
    id: "cycle-psychology",
    name: "周期与行为金融",
    icon: "🧭",
    color: "#7c3aed",
    targetWeight: 15,
    desc: "市场钟摆、逆向思维、认知偏见与风险控制"
  },
  {
    id: "mental-models",
    name: "多元思维与成长",
    icon: "🌱",
    color: "#059669",
    targetWeight: 15,
    desc: "跨学科底层逻辑、决策系统与个人复利成长"
  }
];

window.POSITION_LEVELS = {
  core: {
    label: "核心重仓 · 深度内化",
    badgeClass: "badge-core",
    desc: "构建底层体系的基石著作，需反复重读并转化为决策清单"
  },
  active: {
    label: "建仓速读 · 正在攻克",
    badgeClass: "badge-active",
    desc: "当前正在通过三阶极速阅读法拆解吸收的书籍"
  },
  watch: {
    label: "观察池 · 待建仓",
    badgeClass: "badge-watch",
    desc: "已列入成长计划、等待放入epub深度拆解的候选好书"
  }
};
