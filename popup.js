/**
 * 上班鼓励器 · Popup
 * 实时计算今日已赚、已工作时长、下班倒计时、当前状态
 */
import {
  DEFAULT_CONFIG,
  getDayStat,
  getStatus,
  getWindows,
  getHourlyRate,
  getDailyWage,
  formatClock,
  formatMoney
} from "./lib/calc.js";

let config = { ...DEFAULT_CONFIG };
let tickTimer = null;

const els = {
  currentDate: document.getElementById("currentDate"),
  weekday: document.getElementById("weekday"),
  workStatus: document.getElementById("workStatus"),
  statusMessage: document.getElementById("statusMessage"),
  earnedSalary: document.getElementById("earnedSalary"),
  salaryRateHint: document.getElementById("salaryRateHint"),
  workTimer: document.getElementById("workTimer"),
  countdownLabel: document.getElementById("countdownLabel"),
  countdown: document.getElementById("countdown"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  quoteText: document.getElementById("quoteText"),
  statsBtn: document.getElementById("statsBtn"),
  settingsBtn: document.getElementById("settingsBtn")
};

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/* ---------- 状态文案 ---------- */
function statusMeta(status, config) {
  const otRate = config.weekdayOvertimeRate || 1.5;
  const weRate = config.weekendRate || 2;
  switch (status) {
    case "working":
      return { label: "🟢 正在上班", cls: "working", msg: "好好搬砖，每一秒都在增值" };
    case "break":
      return { label: "🟡 午休中", cls: "break", msg: "午休时间，金额暂停增长 😴" };
    case "overtime":
      return {
        label: "🟠 加班中",
        cls: "overtime",
        msg: `加班 ${otRate}× 计薪，每一秒都更值钱 🔥`
      };
    case "off":
      return { label: "⚪ 已下班", cls: "off", msg: "今天到此为止，享受生活 🎉" };
    case "rest":
      return {
        label: `⚪ ${config.weekendEnabled ? "休息日" : "今天不上班"}`,
        cls: "rest",
        msg: config.weekendEnabled ? `如果来加班，按 ${weRate}× 计薪` : "好好休息，明天再战 🛋"
      };
    default:
      return { label: "🔴 尚未上班", cls: "off", msg: "还没上班，先喝杯咖啡缓一缓 ☕" };
  }
}

/* ---------- 倒计时信息 ---------- */
function countdownInfo(stat, status, config, now) {
  const { wStart } = getWindows(config);
  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (status === "before") {
    return { label: "距上班", seconds: Math.max(0, wStart - sec) };
  }
  if (status === "overtime") {
    return stat.isWorkday
      ? { label: "加班时长", seconds: stat.overtime }
      : { label: "周末已干", seconds: stat.worked };
  }
  if (status === "off" || status === "rest") {
    return { label: "距下班", seconds: null };
  }
  return { label: "距下班", seconds: stat.countdown };
}

/* ---------- 渲染 ---------- */
function render() {
  const now = new Date();
  const stat = getDayStat(now, config, now);
  const status = getStatus(config, now);
  const meta = statusMeta(status, config);

  els.currentDate.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
  els.weekday.textContent = WEEKDAY_NAMES[now.getDay()];

  els.workStatus.textContent = meta.label;
  els.workStatus.className = `status-badge ${meta.cls}`;
  els.statusMessage.textContent = meta.msg;

  els.earnedSalary.textContent = formatMoney(stat.earned, config.currencySymbol);

  const hourly = getHourlyRate(config);
  const daily = getDailyWage(config);
  const extras = [];
  if (config.overtimeEnabled) extras.push(`加班 ${config.weekdayOvertimeRate || 1.5}×`);
  if (config.weekendEnabled) extras.push(`周末 ${config.weekendRate || 2}×`);
  els.salaryRateHint.textContent =
    `时薪 ${formatMoney(hourly, config.currencySymbol)} · 日薪 ${formatMoney(daily, config.currencySymbol)}` +
    (extras.length ? ` · ${extras.join(" · ")}` : "");

  els.workTimer.textContent = formatClock(stat.worked);
  els.workTimer.classList.toggle("running", status === "working" || status === "overtime");

  const cd = countdownInfo(stat, status, config, now);
  els.countdownLabel.textContent = cd.label;
  els.countdown.textContent = cd.seconds === null ? "—" : formatClock(cd.seconds);

  els.progressFill.style.width = `${stat.progress.toFixed(1)}%`;
  els.progressText.textContent = `${Math.round(stat.progress)}%`;
}

/* ---------- 启动 ---------- */
async function init() {
  config = { ...DEFAULT_CONFIG, ...(await chrome.storage.sync.get(DEFAULT_CONFIG)) };

  const quotes = Array.isArray(config.motivationalQuotes) && config.motivationalQuotes.length
    ? config.motivationalQuotes
    : DEFAULT_CONFIG.motivationalQuotes;
  els.quoteText.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  render();
  tickTimer = setInterval(render, 1000);

  // 设置改变时立即反映
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    Object.keys(changes).forEach((k) => {
      if (k in DEFAULT_CONFIG) config[k] = changes[k].newValue;
    });
    render();
  });
}

els.statsBtn.addEventListener("click", () => {
  const url = chrome.runtime.getURL("dashboard.html");
  if (chrome.tabs && chrome.tabs.create) chrome.tabs.create({ url });
  else window.open(url, "_blank");
});

els.settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

window.addEventListener("unload", () => clearInterval(tickTimer));

init();
