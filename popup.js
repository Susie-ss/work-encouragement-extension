/**
 * Work Encourager · Popup
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
import {
  applyStatic,
  normalizeLang,
  t,
  resolveQuotes,
  formatDateTitle,
  WEEKDAYS
} from "./lib/i18n.js";

let config = { ...DEFAULT_CONFIG };
let tickTimer = null;
let currentQuote = "";

const els = {
  millScene: document.getElementById("millScene"),
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
  settingsBtn: document.getElementById("settingsBtn"),
  langBtn: document.getElementById("langBtn")
};

const lang = () => normalizeLang(config.language);

/* ---------- 驴的姿态 ----------
 * tired 早上犯困 / 下班后瘫着
 * walk  正常拉磨
 * run   下班前 30 分钟，疯跑
 * eat   午休，坐下吃萝卜
 */
const FINALE_SECONDS = 30 * 60;

function millPhase(status, stat) {
  if (status === "break") return "eat";
  if (status === "working" || status === "overtime") {
    return stat.countdown > 0 && stat.countdown <= FINALE_SECONDS ? "run" : "walk";
  }
  if (status === "rest") return "eat";
  return "tired"; // before / off
}

function renderMill(phase) {
  // 只在值变化时写，避免每秒重设导致动画复位
  if (els.millScene && els.millScene.dataset.phase !== phase) {
    els.millScene.dataset.phase = phase;
  }
}

/* ---------- 状态文案 ---------- */
function statusMeta(status) {
  const l = lang();
  const otRate = config.weekdayOvertimeRate || 1.5;
  const weRate = config.weekendRate || 2;
  switch (status) {
    case "working":
      return { label: t(l, "status.working"), cls: "working", msg: t(l, "msg.working") };
    case "break":
      return { label: t(l, "status.break"), cls: "break", msg: t(l, "msg.break") };
    case "overtime":
      return {
        label: t(l, "status.overtime"),
        cls: "overtime",
        msg: t(l, "msg.overtime", { rate: otRate })
      };
    case "off":
      return { label: t(l, "status.off"), cls: "off", msg: t(l, "msg.off") };
    case "rest":
      return config.weekendEnabled
        ? {
            label: t(l, "status.rest"),
            cls: "rest",
            msg: t(l, "msg.restPaid", { rate: weRate })
          }
        : { label: t(l, "status.restOff"), cls: "rest", msg: t(l, "msg.rest") };
    default:
      return { label: t(l, "status.before"), cls: "off", msg: t(l, "msg.before") };
  }
}

/* ---------- 倒计时信息 ---------- */
function countdownInfo(stat, status, now) {
  const l = lang();
  const { wStart } = getWindows(config);
  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (status === "before") {
    return { label: t(l, "cd.toStart"), seconds: Math.max(0, wStart - sec) };
  }
  if (status === "overtime") {
    return stat.isWorkday
      ? { label: t(l, "cd.overtime"), seconds: stat.overtime }
      : { label: t(l, "cd.weekendWorked"), seconds: stat.worked };
  }
  if (status === "off" || status === "rest") {
    return { label: t(l, "cd.toOff"), seconds: null };
  }
  return { label: t(l, "cd.toOff"), seconds: stat.countdown };
}

/* ---------- 渲染 ---------- */
function render() {
  const l = lang();
  const now = new Date();
  const stat = getDayStat(now, config, now);
  const status = getStatus(config, now);
  const meta = statusMeta(status);

  renderMill(millPhase(status, stat));

  els.currentDate.textContent = formatDateTitle(now, l);
  els.weekday.textContent = WEEKDAYS[l][now.getDay()];

  els.workStatus.textContent = meta.label;
  els.workStatus.className = `status-badge ${meta.cls}`;
  els.statusMessage.textContent = meta.msg;

  els.earnedSalary.textContent = formatMoney(stat.earned, config.currencySymbol);

  const hourly = getHourlyRate(config);
  const daily = getDailyWage(config);
  els.salaryRateHint.textContent = t(l, "hint.rate", {
    hourly: formatMoney(hourly, config.currencySymbol),
    daily: formatMoney(daily, config.currencySymbol)
  });

  els.workTimer.textContent = formatClock(stat.worked);
  els.workTimer.classList.toggle("running", status === "working" || status === "overtime");

  const cd = countdownInfo(stat, status, now);
  els.countdownLabel.textContent = cd.label;
  els.countdown.textContent = cd.seconds === null ? "—" : formatClock(cd.seconds);

  els.progressFill.style.width = `${stat.progress.toFixed(1)}%`;
  els.progressText.textContent = `${Math.round(stat.progress)}%`;
}

/* ---------- 语言 ---------- */
function refreshLangChrome() {
  const l = lang();
  applyStatic(document, l);
  els.langBtn.textContent = l === "zh" ? "EN" : "中";
  els.langBtn.title = t(l, "btn.lang");
  document.title = t(l, "app.name");
  pickQuote();
}

function pickQuote() {
  const quotes = resolveQuotes(config);
  currentQuote = quotes[Math.floor(Math.random() * quotes.length)];
  els.quoteText.textContent = currentQuote;
}

async function toggleLanguage() {
  config.language = lang() === "zh" ? "en" : "zh";
  await chrome.storage.sync.set({ language: config.language });
  refreshLangChrome();
  render();
}

/* ---------- 启动 ---------- */
async function init() {
  config = { ...DEFAULT_CONFIG, ...(await chrome.storage.sync.get(DEFAULT_CONFIG)) };

  refreshLangChrome();
  render();
  tickTimer = setInterval(render, 1000);

  // 设置改变时立即反映
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    let langChanged = false;
    Object.keys(changes).forEach((k) => {
      if (k in DEFAULT_CONFIG) {
        config[k] = changes[k].newValue;
        if (k === "language") langChanged = true;
      }
    });
    if (langChanged) refreshLangChrome();
    else if ("motivationalQuotes" in changes) pickQuote();
    render();
  });
}

els.statsBtn.addEventListener("click", () => {
  const url = chrome.runtime.getURL("dashboard.html");
  if (chrome.tabs && chrome.tabs.create) chrome.tabs.create({ url });
  else window.open(url, "_blank");
});

els.settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.langBtn.addEventListener("click", toggleLanguage);

window.addEventListener("unload", () => clearInterval(tickTimer));

init();
