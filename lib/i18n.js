/**
 * 上班鼓励器 · 国际化（i18n）
 * 默认英文；用户可在弹窗 / 统计页 / 设置页随时切换，选择存在 chrome.storage.sync。
 *
 * 静态文案用 data-i18n / data-i18n-ph / data-i18n-title / data-i18n-aria 标记，
 * 由 applyStatic() 统一填充；带变量的动态文案用 t(lang, key, vars)。
 */

export const LANGS = ["en", "zh"];
export const DEFAULT_LANG = "en";
export const LANG_LABEL = { en: "EN", zh: "中" };
export const LANG_NAME = { en: "English", zh: "中文" };

export function normalizeLang(value) {
  return value === "zh" ? "zh" : "en";
}

export const WEEKDAYS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
};

export const WEEKDAYS_SHORT = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
};

/** 设置页「哪些天算工作日」的胶囊标签 */
export const WEEKDAY_CHIP = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  zh: ["日", "一", "二", "三", "四", "五", "六"]
};

/* ---------------- 内置语录 ---------------- */

export const BUILTIN_QUOTES = {
  en: [
    "Every second on the clock is money in the bank 💪",
    "Your boss rents your time — you're building your own.",
    "One more stretch, you're closer than yesterday.",
    "Brick by brick, this wall builds your freedom ❤️",
    "Today's sweat is tomorrow's leverage.",
    "Work is the means. Getting paid is the point 💰",
    "Every keystroke drops another coin in the jar.",
    "Chin up — one less day until retirement 📅",
    "Clock in, cash in. That's the whole deal.",
    "This coffee? The company is buying ☕"
  ],
  zh: [
    "每一秒都在为自由存钱 💪",
    "老板在为你打工，你在为自己打工",
    "再坚持一下，离财务自由又近了一步",
    "搬砖虽苦，但砖砖都是爱的形状 ❤️",
    "今天的汗水，是明天的底气",
    "上班不是目的，赚钱才是正事 💰",
    "每敲一次键盘，存款就多一分钱",
    "别灰心，退休倒计时又少了一天 📅",
    "打工人打工魂，打工都是人上人",
    "这杯咖啡，公司请了 ☕"
  ]
};

/** 是否等于任意语言的内置语录（旧版本存的是中文内置数组，需要识别出来） */
export function isBuiltinQuotes(list) {
  if (!Array.isArray(list) || list.length === 0) return true;
  const norm = (arr) => arr.map((s) => String(s).trim()).join("\u0001");
  const target = norm(list);
  return LANGS.some((lang) => norm(BUILTIN_QUOTES[lang]) === target);
}

/** 取当前语言下真正要展示的语录 */
export function resolveQuotes(config) {
  const lang = normalizeLang(config && config.language);
  const list = config && config.motivationalQuotes;
  return isBuiltinQuotes(list) ? BUILTIN_QUOTES[lang] : list;
}

/* ---------------- 文案表 ---------------- */

export const MSG = {
  en: {
    "app.name": "Work Encourager",

    /* 弹窗 */
    "date.today": "Today is",
    "salary.label": "Earned today",
    "worked.label": "Worked",
    "cd.toOff": "Until off",
    "cd.toStart": "Until start",
    "cd.overtime": "Overtime",
    "cd.weekendWorked": "Clocked",
    "btn.stats": "Stats",
    "btn.settings": "Settings",
    "btn.lang": "Switch to 中文",

    "status.working": "🟢 At work",
    "status.break": "🟡 On break",
    "status.overtime": "🟠 Overtime",
    "status.off": "⚪ Off work",
    "status.rest": "⚪ Day off",
    "status.restOff": "⚪ Not a workday",
    "status.before": "🔴 Not started",

    "msg.working": "Head down — every second is adding up.",
    "msg.break": "On break, the meter is paused 😴",
    "msg.overtime": "Overtime pays {rate}× — every second is worth more 🔥",
    "msg.off": "That's it for today. Go live a little 🎉",
    "msg.restPaid": "Work today and it's {rate}× pay",
    "msg.rest": "Enjoy the day off — back at it tomorrow 🛋",
    "msg.before": "Not clocked in yet — coffee first ☕",

    "hint.rate": "Hourly {hourly} · Daily {daily}",

    /* 统计页 */
    "dash.title": "Earnings · Work Encourager",
    "dash.heading": "📊 Earnings",
    "dash.export": "Export CSV",
    "dash.settings": "⚙ Settings",
    "stat.today": "Earned today",
    "stat.week": "This week",
    "stat.month": "This month",
    "sub.today": "{h} h worked · {p}% of the day",
    "sub.week": "{h} h · {avg}/day avg",
    "sub.month": "{h} h · ≈ {d} days of pay",
    "chart.week": "Daily earnings · this week",
    "chart.weekAria": "Bar chart of daily earnings this week",
    "chart.month": "Cumulative · this month",
    "chart.monthAria": "Cumulative earnings for this month",
    "tip.week": "{n} days in · peak {peak}",
    "tip.month": "{n} days in · daily target {target}",
    "range.hint": "{period} · salary {salary}/mo · {days} workdays/week",
    "dash.footnote": "Amounts are derived live from the salary and hours in Settings. Rest days earn nothing by default — turn on weekend pay in Settings → Workdays & overtime. The CSV covers the last 60 days and opens straight in Excel or Numbers.",

    /* CSV */
    "csv.date": "Date",
    "csv.weekday": "Weekday",
    "csv.isWorkday": "Workday",
    "csv.worked": "Worked (h)",
    "csv.overtime": "Overtime (h)",
    "csv.earned": "Earned",
    "csv.hourly": "Hourly rate",
    "csv.note": "Note",
    "csv.yes": "Yes",
    "csv.no": "No",
    "csv.noteWorkday": "Standard workday",
    "csv.noteWeekend": "Weekend pay",
    "csv.noteRest": "Day off, unpaid",
    "csv.total": "Total",
    "csv.last60": "Last 60 days",
    "csv.filename": "work-encourager_earnings_{date}.csv",

    /* 设置页 */
    "opt.title": "Work Encourager · Settings",
    "opt.heading": "⚙ Settings",
    "opt.subtitle": "Set your pay and hours so the numbers stay honest",
    "opt.lang": "Language",
    "opt.langHint": "Takes effect immediately, everywhere",

    "opt.salary": "💰 Pay",
    "opt.salary.label": "Monthly salary (gross or net — your call)",
    "opt.salary.ph": "e.g. 20000",
    "opt.salary.hint": "Used to derive your hourly and daily rate",
    "opt.days.label": "Workdays per month",
    "opt.days.hint": "21.75 is the statutory average",
    "opt.currency.label": "Currency symbol",
    "opt.currency.hint": "Shown in front of every amount",

    "opt.hours": "⏰ Hours",
    "opt.workStart": "Start",
    "opt.workEnd": "End",
    "opt.breakStart": "Break starts",
    "opt.breakEnd": "Break ends",
    "opt.hours.hint": "Breaks are subtracted from working time, and the meter pauses with them.",

    "opt.weekdaySection": "📅 Workdays & overtime",
    "opt.workdays.label": "Which days count as workdays",
    "opt.workdays.hint": "Checked days earn at the standard rate; the rest are days off",
    "opt.ot.label": "Keep counting overtime after hours",
    "opt.ot.hint": "Past the end time, earnings keep accruing at the multiplier (capped at 6 h). Status shows Overtime.",
    "opt.otRate.label": "Weeknight overtime multiplier",
    "opt.otRate.hint": "Commonly 1.5 for weeknights, 2 for days off",
    "opt.weekend.label": "Paid work on days off",
    "opt.weekend.hint": "Days off inside the work window also earn, at the weekend multiplier. Status shows Overtime.",
    "opt.weekendRate.label": "Weekend multiplier",
    "opt.weekendRate.hint": "Applied to the standard window; past days are not recalculated",

    "opt.quotes": "💬 Quotes",
    "opt.quotes.label": "Custom quotes (one per line, shown at random)",
    "opt.quotes.ph": "Every second on the clock is money in the bank\nOne more stretch, you're closer than yesterday",
    "opt.quotes.hint": "Leave empty to use the 10 built-in quotes",

    "opt.danger": "🗑 Danger zone",
    "opt.reset": "Restore defaults",
    "opt.reset.hint": "Clears your settings and goes back to factory values",
    "opt.save": "Save",
    "opt.viewStats": "📊 View stats",
    "opt.saved": "✅ Saved",
    "opt.resetDone": "✅ Defaults restored",
    "opt.confirmReset": "Restore all default settings? Your current setup will be overwritten.",

    "err.salary": "Monthly salary must be greater than 0",
    "err.days": "Workdays per month must be between 1 and 31",
    "err.workdays": "Pick at least one workday",
    "err.endAfterStart": "End time must be later than start time",
    "err.breakOrder": "Break end must be later than break start",
    "err.breakRange": "Break must fall inside working hours",
    "err.tooShort": "Less than 30 minutes of work once the break is deducted",
    "err.otRate": "Overtime multiplier should be between 1 and 5",
    "err.weRate": "Weekend multiplier should be between 1 and 5",

    "badge.title": "{app} · {amount} earned today"
  },

  zh: {
    "app.name": "上班鼓励器",

    "date.today": "今天是",
    "salary.label": "今日已赚",
    "worked.label": "已工作",
    "cd.toOff": "距下班",
    "cd.toStart": "距上班",
    "cd.overtime": "加班时长",
    "cd.weekendWorked": "周末已干",
    "btn.stats": "统计",
    "btn.settings": "设置",
    "btn.lang": "Switch to English",

    "status.working": "🟢 正在上班",
    "status.break": "🟡 午休中",
    "status.overtime": "🟠 加班中",
    "status.off": "⚪ 已下班",
    "status.rest": "⚪ 休息日",
    "status.restOff": "⚪ 今天不上班",
    "status.before": "🔴 尚未上班",

    "msg.working": "好好搬砖，每一秒都在增值",
    "msg.break": "午休时间，金额暂停增长 😴",
    "msg.overtime": "加班 {rate}× 计薪，每一秒都更值钱 🔥",
    "msg.off": "今天到此为止，享受生活 🎉",
    "msg.restPaid": "如果来加班，按 {rate}× 计薪",
    "msg.rest": "好好休息，明天再战 🛋",
    "msg.before": "还没上班，先喝杯咖啡缓一缓 ☕",

    "hint.rate": "时薪 {hourly} · 日薪 {daily}",

    "dash.title": "收入统计 · 上班鼓励器",
    "dash.heading": "📊 收入统计",
    "dash.export": "导出 CSV",
    "dash.settings": "⚙ 设置",
    "stat.today": "今日已赚",
    "stat.week": "本周累计",
    "stat.month": "本月累计",
    "sub.today": "已工作 {h} 小时 · 进度 {p}%",
    "sub.week": "{h} 小时 · 日均 {avg}",
    "sub.month": "{h} 小时 · 折合 {d} 天",
    "chart.week": "本周每日收入",
    "chart.weekAria": "本周每日收入柱状图",
    "chart.month": "本月累计曲线",
    "chart.monthAria": "本月累计收入折线图",
    "tip.week": "已过 {n} 天 · 峰值 {peak}",
    "tip.month": "已过 {n} 天 · 目标日薪 {target}",
    "range.hint": "{period} · 月薪 {salary} · 工作日 {days} 天/周",
    "dash.footnote": "金额按设置中的薪资与工时实时折算；休息日默认不计薪，可在「设置 → 工作日与加班」中开启周末计薪。导出的 CSV 覆盖最近 60 天，可直接用 Excel / Numbers 打开。",

    "csv.date": "日期",
    "csv.weekday": "星期",
    "csv.isWorkday": "是否工作日",
    "csv.worked": "工作(小时)",
    "csv.overtime": "加班(小时)",
    "csv.earned": "收入",
    "csv.hourly": "时薪",
    "csv.note": "备注",
    "csv.yes": "是",
    "csv.no": "否",
    "csv.noteWorkday": "标准工作日",
    "csv.noteWeekend": "周末计薪",
    "csv.noteRest": "休息日不计薪",
    "csv.total": "合计",
    "csv.last60": "最近 60 天",
    "csv.filename": "上班鼓励器_收入明细_{date}.csv",

    "opt.title": "上班鼓励器 · 设置",
    "opt.heading": "⚙ 上班鼓励器设置",
    "opt.subtitle": "配置薪资、工时与加班倍率，让鼓励器算得更准",
    "opt.lang": "语言",
    "opt.langHint": "切换后立即生效，所有页面同步",

    "opt.salary": "💰 薪资设置",
    "opt.salary.label": "月薪（税前或税后，按你的口径）",
    "opt.salary.ph": "例如 20000",
    "opt.salary.hint": "用于推算时薪与日薪",
    "opt.days.label": "月工作天数",
    "opt.days.hint": "法定月工作天数通常为 21.75 天",
    "opt.currency.label": "货币符号",
    "opt.currency.hint": "显示在金额前的符号",

    "opt.hours": "⏰ 工作时间设置",
    "opt.workStart": "上班时间",
    "opt.workEnd": "下班时间",
    "opt.breakStart": "午休开始",
    "opt.breakEnd": "午休结束",
    "opt.hours.hint": "午休时间会自动从工作时长中扣除，倒计时与金额同步暂停。",

    "opt.weekdaySection": "📅 工作日与加班",
    "opt.workdays.label": "哪些天算工作日",
    "opt.workdays.hint": "勾选的日子按标准工时计薪，未勾选的日子视为休息日",
    "opt.ot.label": "下班后继续计加班",
    "opt.ot.hint": "开启后，超过下班时间按倍率累加（最多计 6 小时），状态显示「加班中」",
    "opt.otRate.label": "工作日晚加班倍率",
    "opt.otRate.hint": "常见为 1.5（平时加班）或 2（休息日）",
    "opt.weekend.label": "休息日加班计薪",
    "opt.weekend.hint": "开启后，休息日进入工时窗口也按倍率计薪，状态显示「加班中」",
    "opt.weekendRate.label": "周末加班倍率",
    "opt.weekendRate.hint": "按标准工时窗口折算，历史休息日不追溯",

    "opt.quotes": "💬 激励语录",
    "opt.quotes.label": "自定义语录（每行一条，随机展示）",
    "opt.quotes.ph": "每一秒都在为自由存钱\n再坚持一下，离财务自由又近了一步",
    "opt.quotes.hint": "留空将使用内置的 10 条语录",

    "opt.danger": "🗑 危险操作",
    "opt.reset": "恢复默认设置",
    "opt.reset.hint": "清除所有自定义配置，恢复出厂值",
    "opt.save": "保存设置",
    "opt.viewStats": "📊 查看统计",
    "opt.saved": "✅ 已保存",
    "opt.resetDone": "✅ 已恢复默认",
    "opt.confirmReset": "确定恢复默认设置吗？当前配置会被覆盖。",

    "err.salary": "月薪必须大于 0",
    "err.days": "月工作天数应在 1–31 之间",
    "err.workdays": "请至少选择一个工作日",
    "err.endAfterStart": "下班时间必须晚于上班时间",
    "err.breakOrder": "午休结束必须晚于午休开始",
    "err.breakRange": "午休必须落在上下班时间之内",
    "err.tooShort": "扣除午休后工作时长不足 30 分钟",
    "err.otRate": "加班倍率应在 1–5 之间",
    "err.weRate": "周末倍率应在 1–5 之间",

    "badge.title": "{app} · 今日已赚 {amount}"
  }
};

/* ---------------- 取值 / 应用 ---------------- */

export function t(lang, key, vars) {
  const table = MSG[normalizeLang(lang)] || MSG[DEFAULT_LANG];
  let text = table[key] != null ? table[key] : MSG[DEFAULT_LANG][key];
  if (text == null) return key;
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (raw, name) =>
      vars[name] != null ? String(vars[name]) : raw
    );
  }
  return text;
}

/** 把页面上带 data-i18n* 标记的静态文案刷成目标语言 */
export function applyStatic(root, lang) {
  const scope = root || document;
  const l = normalizeLang(lang);

  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(l, el.dataset.i18n);
  });
  scope.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(l, el.dataset.i18nPh));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(l, el.dataset.i18nTitle));
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(l, el.dataset.i18nAria));
  });

  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
}

/** 日期标题：en → "Nov 4"，zh → "11月4日" */
export function formatDateTitle(date, lang) {
  const l = normalizeLang(lang);
  if (l === "zh") return `${date.getMonth() + 1}月${date.getDate()}日`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

/** 月份区间标题：en → "November 2026"，zh → "2026年11月" */
export function formatMonthTitle(date, lang) {
  const l = normalizeLang(lang);
  if (l === "zh") return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}
