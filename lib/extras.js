/**
 * 上班鼓励器 · 弹窗小组件
 * 段位 / 每日黄历 / 时薪换算 / 周彩蛋 —— 纯函数，无存储依赖，便于测试。
 */

/* ---------------- 打工段位 ---------------- */

/** 门槛按「累计工时（小时）」升序；最后一级封顶 */
export const RANKS = [
  { hours: 0,    zh: "纯小白", en: "Rookie" },
  { hours: 10,   zh: "熟练工", en: "Apprentice" },
  { hours: 40,   zh: "正式工", en: "Regular" },
  { hours: 100,  zh: "老油条", en: "Veteran" },
  { hours: 250,  zh: "小组长", en: "Team lead" },
  { hours: 500,  zh: "部门主管", en: "Supervisor" },
  { hours: 1000, zh: "总监", en: "Director" },
  { hours: 2000, zh: "合伙人", en: "Partner" }
];

/** 累计秒 → 当前段位（含下一级信息） */
export function rankFor(totalSeconds, lang = "en") {
  const hours = Math.max(0, Number(totalSeconds) || 0) / 3600;
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (hours >= RANKS[i].hours) idx = i;
  }
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  return {
    hours,
    idx,
    name: cur[lang] || cur.en,
    next: next ? { hours: next.hours, name: next[lang] || next.en } : null
  };
}

/** 从钱包账本汇总累计工时（历史结算 + 今日在途） */
export function loggedSeconds(ledger, todayWorked = 0) {
  let sum = 0;
  Object.keys(ledger || {}).forEach((k) => {
    const row = ledger[k] || {};
    sum += (Number(row.w) || 0) + (Number(row.o) || 0);
  });
  return sum + Math.max(0, Number(todayWorked) || 0);
}

/* ---------------- 每日黄历 ---------------- */

/** 30 条宜/忌，中英各一份；按日期哈希固定取一条，同一天不会变 */
const ALMANAC = [
  { zh: ["摸鱼", "主动汇报"], en: ["slacking off", "volunteering for extra work"] },
  { zh: ["喝咖啡", "开长会"], en: ["coffee", "long meetings"] },
  { zh: ["假装忙碌", "回工作群消息"], en: ["looking busy", "replying to work chats"] },
  { zh: ["提前下班", "答应新需求"], en: ["leaving early", "saying yes to new scope"] },
  { zh: ["带薪发呆", "自我PUA"], en: ["paid daydreaming", "self-blame"] },
  { zh: ["缩进代码", "追问进度"], en: ["indenting code", "chasing progress"] },
  { zh: ["复制粘贴", "复杂决策"], en: ["copy-paste", "big decisions"] },
  { zh: ["午睡", "站会"], en: ["a nap", "stand-ups"] },
  { zh: ["整理桌面", "临时加塞"], en: ["tidying your desk", "last-minute requests"] },
  { zh: ["悄悄进步", "公开内卷"], en: ["quiet progress", "performative hustle"] },
  { zh: ["关掉通知", "群聊接龙"], en: ["muting notifications", "group chat chains"] },
  { zh: ["按时吃饭", "空腹加班"], en: ["eating on time", "overtime on an empty stomach"] },
  { zh: ["写 TODO", "清 TODO"], en: ["writing TODOs", "finishing TODOs"] },
  { zh: ["带薪如厕", "跨部门沟通"], en: ["paid bathroom breaks", "cross-team calls"] },
  { zh: ["保存文件", "相信自动保存"], en: ["saving your work", "trusting autosave"] },
  { zh: ["拒绝画饼", "接受画饼"], en: ["declining empty promises", "accepting empty promises"] },
  { zh: ["摸清边界", "主动背锅"], en: ["setting boundaries", "taking the blame"] },
  { zh: ["小步快跑", "一次到位"], en: ["small steps", "big-bang releases"] },
  { zh: ["看窗外", "盯屏幕一整天"], en: ["looking out the window", "staring at the screen all day"] },
  { zh: ["批量处理", "逐个打断"], en: ["batching tasks", "context switching"] },
  { zh: ["记录成果", "默默无闻"], en: ["writing down wins", "working in silence"] },
  { zh: ["提需求", "改需求"], en: ["raising requirements", "changing requirements"] },
  { zh: ["早到一会儿", "早走一会儿"], en: ["arriving early", "leaving early"] },
  { zh: ["给绿萝浇水", "给老板添堵"], en: ["watering the plant", "annoying your boss"] },
  { zh: ["断网五分钟", "全天候在线"], en: ["going offline for five minutes", "being online 24/7"] },
  { zh: ["核对数字", "凭感觉报价"], en: ["double-checking numbers", "gut-feel estimates"] },
  { zh: ["夸同事", "背后吐槽"], en: ["complimenting a teammate", "complaining behind backs"] },
  { zh: ["关灯下班", "灯火通明"], en: ["leaving the lights off", "leaving the lights on"] },
  { zh: ["备份存档", "裸奔上线"], en: ["backing up", "shipping untested"] },
  { zh: ["心安理得", "无谓自责"], en: ["a clear conscience", "needless guilt"] }
];

/** 稳定哈希：同一个日期字符串（本地日）永远得到同一条 */
export function almanacFor(date, lang = "en") {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const key = `${y}${m}${d}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const pair = ALMANAC[(h >>> 0) % ALMANAC.length];
  const useZh = lang === "zh";
  return {
    good: useZh ? pair.zh[0] : pair.en[0],
    bad: useZh ? pair.zh[1] : pair.en[1]
  };
}

/* ---------------- 时薪换算 ---------------- */

/** 金额 ÷ 时薪 = 工时；返回可读时长 */
export function convertToWorkTime(amount, hourlyRate, lang = "en") {
  const amountNum = Number(amount);
  const rate = Number(hourlyRate);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const totalMin = Math.round((amountNum / rate) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (lang === "zh") {
    if (h && m) return `${h} 小时 ${m} 分`;
    if (h) return `${h} 小时`;
    return `${m} 分钟`;
  }
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/* ---------------- 周彩蛋 ---------------- */

/**
 * 周一上班 ↔ 打哈欠；周五下班 ↔ 疯跑。
 * 返回 { egg, phaseOverride }，由 popup.js 应用到 millScene。
 */
export function weekdayEgg(date, status) {
  const day = date.getDay();
  if (day === 1 && status === "working") {
    return { egg: "yawn", phaseOverride: null };
  }
  if (day === 5 && (status === "off" || status === "overtime")) {
    return { egg: "friday", phaseOverride: "run" };
  }
  return { egg: "", phaseOverride: null };
}
