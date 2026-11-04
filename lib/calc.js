/**
 * 上班鼓励器 · 共享计算模块
 * 所有页面（popup / dashboard / options）与 service worker 共用同一套算法。
 */

/** 加班最多计 6 小时，防止第二天早上的时间被算成前一天加班 */
export const OT_CAP_SECONDS = 6 * 3600;

export const DEFAULT_CONFIG = {
  monthlySalary: 20000,
  workDaysPerMonth: 21.75,
  workStart: "09:00",
  workEnd: "18:00",
  breakStart: "12:00",
  breakEnd: "13:30",
  currencySymbol: "¥",
  workDays: [1, 2, 3, 4, 5],       // 0=周日 … 6=周六
  overtimeEnabled: false,           // 下班后是否继续计加班
  weekdayOvertimeRate: 1.5,         // 工作日晚加班倍率
  weekendEnabled: true,             // 休息日是否计薪（按周末倍率）
  weekendRate: 2.0,                 // 周末倍率
  motivationalQuotes: [
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

export const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

/* ---------------- 基础工具 ---------------- */

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function parseTimeStr(timeStr) {
  const [h, m] = String(timeStr || "00:00").split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/** 秒 → HH:MM:SS */
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** 金额格式化，带千分位 */
export function formatMoney(value, symbol = "¥", decimals = 2) {
  const n = Number.isFinite(value) ? value : 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = n < 0 ? "-" : "";
  return decPart ? `${sign}${symbol}${withComma}.${decPart}` : `${sign}${symbol}${withComma}`;
}

/** 徽章文字：最多 4 个字符 */
export function formatBadge(value) {
  const v = Math.max(0, value || 0);
  if (v >= 10000) return `${Math.round(v / 1000)}k`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

/* ---------------- 日期工具 ---------------- */

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sameDay(a, b) {
  return dayKey(a) === dayKey(b);
}

/** 所在周的周一 */
export function weekStart(d) {
  const x = startOfDay(d);
  const diff = (x.getDay() + 6) % 7;
  return addDays(x, -diff);
}

export function monthStart(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function secondsOfDay(d) {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

/* ---------------- 工时窗口 ---------------- */

export function getWindows(config) {
  const wStart = parseTimeStr(config.workStart);
  const wEndRaw = parseTimeStr(config.workEnd);
  const wEnd = wEndRaw > wStart ? wEndRaw : wStart + 8 * 3600; // 容错：下班早于上班
  const bs = clamp(parseTimeStr(config.breakStart), wStart, wEnd);
  const be = clamp(parseTimeStr(config.breakEnd), wStart, wEnd);
  const breakSec = Math.max(0, be - bs);
  const normalTotal = Math.max(0, wEnd - wStart - breakSec);
  return { wStart, wEnd, bs, be, breakSec, normalTotal };
}

export function isWorkdayDate(date, config) {
  const days = Array.isArray(config.workDays) && config.workDays.length
    ? config.workDays
    : DEFAULT_CONFIG.workDays;
  return days.includes(date.getDay());
}

/** 时薪（按标准工时窗口折算） */
export function getHourlyRate(config) {
  const { normalTotal } = getWindows(config);
  if (normalTotal <= 0) return 0;
  const monthlyDays = config.workDaysPerMonth > 0 ? config.workDaysPerMonth : 21.75;
  return config.monthlySalary / monthlyDays / (normalTotal / 3600);
}

/** 标准日工作时长（秒） */
export function getNormalTotalSeconds(config) {
  return getWindows(config).normalTotal;
}

/** 日薪 = 时薪 × 标准工时 */
export function getDailyWage(config) {
  return (getHourlyRate(config) * getNormalTotalSeconds(config)) / 3600;
}

/* ---------------- 状态判定 ---------------- */

/**
 * @returns {'before'|'working'|'break'|'overtime'|'off'|'rest'}
 */
export function getStatus(config, now = new Date()) {
  const { wStart, wEnd, bs, be } = getWindows(config);
  const sec = secondsOfDay(now);
  const workday = isWorkdayDate(now, config);

  if (!workday) {
    if (!config.weekendEnabled) return "rest";
    if (sec < wStart || sec >= wEnd) return "rest";
    if (sec >= bs && sec < be) return "break";
    return "overtime";
  }

  if (sec < wStart) return "before";
  if (sec >= wEnd) {
    if (!config.overtimeEnabled) return "off";
    return sec - wEnd > OT_CAP_SECONDS ? "off" : "overtime";
  }
  if (sec >= bs && sec < be) return "break";
  return "working";
}

/* ---------------- 单日统计 ---------------- */

/**
 * 计算某一天的工时与收入。
 * @param {Date} date 该日任意时刻（内部会归零到 00:00）
 * @param {object} config
 * @param {Date} now 当前时间
 */
export function getDayStat(date, config, now = new Date()) {
  const day = startOfDay(date);
  const today = startOfDay(now);
  const { wStart, wEnd, bs, be, normalTotal } = getWindows(config);
  const hourly = getHourlyRate(config);
  const isToday = day.getTime() === today.getTime();
  const isFuture = day.getTime() > today.getTime();
  const workday = isWorkdayDate(day, config);

  const empty = {
    key: dayKey(day),
    date: day,
    isWorkday: workday,
    isToday,
    isFuture,
    hourly,
    normal: 0,
    overtime: 0,
    worked: 0,
    earned: 0,
    normalTotal,
    progress: 0,
    countdown: 0
  };

  if (isFuture) return empty;

  // 该日已推进到的「秒数位置」
  const sec = isToday ? secondsOfDay(now) : wEnd;

  if (!workday) {
    // 休息日：只有今天在计，历史休息日不计（无法得知是否真的加了班）
    if (!config.weekendEnabled || !isToday) return empty;
    let worked = clamp(sec - wStart, 0, wEnd - wStart);
    if (worked > 0 && sec > bs) worked -= Math.min(sec, be) - bs;
    worked = clamp(worked, 0, normalTotal);
    const earned = (worked / 3600) * hourly * (config.weekendRate || 1);
    return {
      ...empty,
      normal: 0,
      overtime: 0,
      worked,
      earned,
      progress: normalTotal > 0 ? clamp((worked / normalTotal) * 100, 0, 100) : 0,
      countdown: Math.max(0, wEnd - sec)
    };
  }

  // 正常工作日
  let normal = clamp(sec - wStart, 0, wEnd - wStart);
  if (normal > 0 && sec > bs) normal -= Math.min(sec, be) - bs;
  normal = clamp(normal, 0, normalTotal);

  let overtime = 0;
  if (config.overtimeEnabled && isToday && sec > wEnd) {
    overtime = Math.min(sec - wEnd, OT_CAP_SECONDS);
  }

  const earned =
    (normal / 3600) * hourly +
    (overtime / 3600) * hourly * (config.weekdayOvertimeRate || 1);

  return {
    ...empty,
    normal,
    overtime,
    worked: normal + overtime,
    earned,
    progress: normalTotal > 0 ? clamp((normal / normalTotal) * 100, 0, 100) : 0,
    countdown: isToday ? Math.max(0, wEnd - sec) : 0
  };
}

/* ---------------- 区间汇总 ---------------- */

export function sumStat(list) {
  return list.reduce(
    (acc, s) => {
      acc.normal += s.normal;
      acc.overtime += s.overtime;
      acc.worked += s.worked;
      acc.earned += s.earned;
      return acc;
    },
    { normal: 0, overtime: 0, worked: 0, earned: 0 }
  );
}

/** 本周 7 天（周一起） */
export function getWeekStats(config, now = new Date()) {
  const start = weekStart(now);
  return Array.from({ length: 7 }, (_, i) => getDayStat(addDays(start, i), config, now));
}

/** 本月 1 号到今天 */
export function getMonthStats(config, now = new Date()) {
  const start = monthStart(now);
  const count = now.getDate();
  return Array.from({ length: count }, (_, i) => getDayStat(addDays(start, i), config, now));
}
