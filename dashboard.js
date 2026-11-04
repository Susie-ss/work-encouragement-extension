/**
 * Work Encourager · Dashboard
 * 本周柱状图 / 本月累计曲线 / 汇总 / CSV 导出
 */
import {
  DEFAULT_CONFIG,
  resolveConfig,
  getDayStat,
  getWeekStats,
  getMonthStats,
  getDailyWage,
  getCurrencyDecimals,
  sumStat,
  addDays,
  startOfDay,
  dayKey,
  formatMoney
} from "./lib/calc.js";
import {
  applyStatic,
  normalizeLang,
  t,
  formatMonthTitle,
  WEEKDAYS,
  WEEKDAYS_SHORT
} from "./lib/i18n.js";

let config = { ...DEFAULT_CONFIG };

const els = {
  rangeHint: document.getElementById("rangeHint"),
  statToday: document.getElementById("statToday"),
  statTodaySub: document.getElementById("statTodaySub"),
  statWeek: document.getElementById("statWeek"),
  statWeekSub: document.getElementById("statWeekSub"),
  statMonth: document.getElementById("statMonth"),
  statMonthSub: document.getElementById("statMonthSub"),
  weekTip: document.getElementById("weekTip"),
  monthTip: document.getElementById("monthTip"),
  weekChart: document.getElementById("weekChart"),
  monthChart: document.getElementById("monthChart"),
  exportBtn: document.getElementById("exportBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  langBtn: document.getElementById("langBtn")
};

const lang = () => normalizeLang(config.language);

/** 金额展示：符号与小数位都取自当前单位 */
function money(value, decimals = getCurrencyDecimals(config)) {
  return formatMoney(value, config.currencySymbol, decimals);
}

/* ---------------- 图表工具 ---------------- */

const PAD = { l: 54, r: 14, t: 24, b: 36 };
const W = 700;
const H = 240;
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;
const BASE_Y = PAD.t + PLOT_H;

function niceMax(v) {
  if (!(v > 0)) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function gridLines(max, symbol) {
  let out = "";
  for (let i = 0; i <= 4; i++) {
    const y = PAD.t + (PLOT_H / 4) * i;
    const value = max - (max / 4) * i;
    out += `<line class="chart-grid" x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" />`;
    out += `<text class="chart-axis" x="${PAD.l - 8}" y="${y + 3}" text-anchor="end">${shortMoney(value, symbol)}</text>`;
  }
  return out;
}

function shortMoney(v, symbol) {
  if (v >= 10000) return `${symbol}${(v / 10000).toFixed(1)}w`;
  if (v >= 1000) return `${symbol}${(v / 1000).toFixed(1)}k`;
  return `${symbol}${Math.round(v)}`;
}

/* ---------------- 本周柱状图 ---------------- */

function renderWeekChart(stats) {
  const l = lang();
  const values = stats.map((s) => s.earned);
  const max = niceMax(Math.max(...values, getDailyWage(config)) * 1.12);
  const band = PLOT_W / 7;
  const barW = Math.min(44, band * 0.46);

  let svg = gridLines(max, config.currencySymbol);

  stats.forEach((s, i) => {
    const cx = PAD.l + band * (i + 0.5);
    const h = max > 0 ? (s.earned / max) * PLOT_H : 0;
    const y = BASE_Y - h;
    const isToday = s.isToday;
    const fill = isToday
      ? "var(--primary)"
      : s.isFuture
        ? "#eef0f6"
        : s.isWorkday
          ? "#a5b4fc"
          : "#ddd6fe";

    if (h > 0) {
      svg += `<rect x="${cx - barW / 2}" y="${y}" width="${barW}" height="${Math.max(2, h)}" rx="5" fill="${fill}" />`;
      svg += `<text class="chart-value" x="${cx}" y="${y - 7}" text-anchor="middle">${Math.round(s.earned)}</text>`;
    } else {
      svg += `<rect x="${cx - barW / 2}" y="${BASE_Y - 2}" width="${barW}" height="2" rx="1" fill="#e5e7eb" />`;
    }

    const d = s.date;
    const label = WEEKDAYS_SHORT[l][d.getDay()];
    const dateTxt = `${d.getMonth() + 1}/${d.getDate()}`;
    svg += `<text class="chart-label" x="${cx}" y="${BASE_Y + 15}" text-anchor="middle"${isToday ? ' style="fill:#4f46e5;font-weight:600"' : ""}>${label}</text>`;
    svg += `<text class="chart-axis" x="${cx}" y="${BASE_Y + 29}" text-anchor="middle">${dateTxt}</text>`;
  });

  els.weekChart.innerHTML = svg;

  const done = stats.filter((s) => !s.isFuture).length;
  els.weekTip.textContent = t(l, "tip.week", {
    n: done,
    peak: money(Math.max(...values))
  });
}

/* ---------------- 本月累计曲线 ---------------- */

function renderMonthChart(stats) {
  const l = lang();
  const n = stats.length;
  const cumulative = [];
  let acc = 0;
  stats.forEach((s) => {
    acc += s.earned;
    cumulative.push(acc);
  });

  const daily = getDailyWage(config);
  const max = niceMax(Math.max(cumulative[n - 1] || 0, daily * 3) * 1.12);

  let svg = `<defs>
    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.02" />
    </linearGradient>
  </defs>`;

  svg += gridLines(max, config.currencySymbol);

  const xOf = (i) => (n === 1 ? PAD.l : PAD.l + (PLOT_W * i) / (n - 1));
  const yOf = (v) => BASE_Y - (v / max) * PLOT_H;

  const linePts = cumulative.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
  const linePath = `M${linePts.join(" L")}`;
  const areaPath = `${linePath} L${xOf(n - 1).toFixed(1)},${BASE_Y} L${xOf(0).toFixed(1)},${BASE_Y} Z`;

  if (n > 1) {
    svg += `<path d="${areaPath}" fill="url(#areaFill)" />`;
    svg += `<path d="${linePath}" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />`;
  }

  // 最后一个点（今天）
  const lx = xOf(n - 1);
  const ly = yOf(cumulative[n - 1] || 0);
  svg += `<circle cx="${lx}" cy="${ly}" r="4" fill="#fff" stroke="#4f46e5" stroke-width="2.4" />`;
  if (n > 0) {
    svg += `<text class="chart-value" x="${Math.min(lx, W - PAD.r - 4)}" y="${Math.max(ly - 10, PAD.t + 10)}" text-anchor="middle">${shortMoney(cumulative[n - 1], config.currencySymbol)}</text>`;
  }

  // X 轴刻度
  const ticks = new Set([0, n - 1]);
  for (let i = 0; i < n; i += 5) ticks.add(i);
  ticks.forEach((i) => {
    if (i < 0 || i >= n) return;
    const label = l === "zh" ? `${i + 1}日` : `${i + 1}`;
    svg += `<text class="chart-axis" x="${xOf(i)}" y="${BASE_Y + 16}" text-anchor="middle">${label}</text>`;
  });

  els.monthChart.innerHTML = svg;
  els.monthTip.textContent = t(l, "tip.month", {
    n,
    target: money(daily)
  });
}

/* ---------------- 汇总 ---------------- */

function renderSummary() {
  const l = lang();
  const now = new Date();
  const today = getDayStat(now, config, now);
  const week = getWeekStats(config, now);
  const month = getMonthStats(config, now);

  const weekSum = sumStat(week);
  const monthSum = sumStat(month);
  const daily = getDailyWage(config);

  els.rangeHint.textContent = t(l, "range.hint", {
    period: formatMonthTitle(now, l),
    salary: money(config.monthlySalary, 0),
    days: (config.workDays || []).length
  });

  els.statToday.textContent = money(today.earned);
  els.statTodaySub.textContent = t(l, "sub.today", {
    h: (today.worked / 3600).toFixed(2),
    p: Math.round(today.progress)
  });

  const elapsedDays = week.filter((s) => !s.isFuture).length || 1;
  els.statWeek.textContent = money(weekSum.earned);
  els.statWeekSub.textContent = t(l, "sub.week", {
    h: (weekSum.worked / 3600).toFixed(1),
    avg: money(weekSum.earned / elapsedDays)
  });

  els.statMonth.textContent = money(monthSum.earned);
  els.statMonthSub.textContent = t(l, "sub.month", {
    h: (monthSum.worked / 3600).toFixed(1),
    d: daily > 0 ? (monthSum.earned / daily).toFixed(1) : "0"
  });

  renderWeekChart(week);
  renderMonthChart(month);
}

/* ---------------- CSV 导出 ---------------- */

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv() {
  const l = lang();
  const now = new Date();
  const today = startOfDay(now);
  const rows = [
    [
      t(l, "csv.date"),
      t(l, "csv.weekday"),
      t(l, "csv.isWorkday"),
      t(l, "csv.worked"),
      t(l, "csv.overtime"),
      t(l, "csv.earned"),
      t(l, "csv.hourly"),
      t(l, "csv.note")
    ]
  ];

  let totalWorked = 0;
  let totalOt = 0;
  let totalEarned = 0;

  for (let i = 59; i >= 0; i--) {
    const d = addDays(today, -i);
    const s = getDayStat(d, config, now);
    if (s.isFuture) continue;

    totalWorked += s.normal;
    totalOt += s.overtime;
    totalEarned += s.earned;

    rows.push([
      dayKey(d),
      WEEKDAYS[l][d.getDay()],
      s.isWorkday ? t(l, "csv.yes") : t(l, "csv.no"),
      (s.normal / 3600).toFixed(2),
      (s.overtime / 3600).toFixed(2),
      s.earned.toFixed(2),
      s.hourly.toFixed(2),
      s.isWorkday
        ? t(l, "csv.noteWorkday")
        : config.weekendEnabled
          ? t(l, "csv.noteWeekend")
          : t(l, "csv.noteRest")
    ]);
  }

  rows.push([]);
  rows.push([
    t(l, "csv.total"),
    "",
    "",
    (totalWorked / 3600).toFixed(2),
    (totalOt / 3600).toFixed(2),
    totalEarned.toFixed(2),
    "",
    t(l, "csv.last60")
  ]);

  const csv = "\ufeff" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = t(l, "csv.filename", { date: dayKey(now) });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ---------------- 语言 ---------------- */

function refreshLangChrome() {
  const l = lang();
  applyStatic(document, l);
  document.title = t(l, "dash.title");
  els.langBtn.textContent = l === "zh" ? "EN" : "中";
  els.langBtn.title = t(l, "btn.lang");
}

async function toggleLanguage() {
  config.language = lang() === "zh" ? "en" : "zh";
  await chrome.storage.sync.set({ language: config.language });
  refreshLangChrome();
  renderSummary();
}

/* ---------------- 启动 ---------------- */

async function init() {
  config = resolveConfig(await chrome.storage.sync.get(null));
  refreshLangChrome();
  renderSummary();

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "sync") return;
    const prevLang = lang();
    config = resolveConfig(await chrome.storage.sync.get(null));
    if (lang() !== prevLang) refreshLangChrome();
    renderSummary();
  });

  setInterval(renderSummary, 30000);
}

els.exportBtn.addEventListener("click", exportCsv);
els.settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.langBtn.addEventListener("click", toggleLanguage);

init();
