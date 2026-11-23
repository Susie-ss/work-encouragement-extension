/**
 * Work Encourager · Popup
 * 实时计算今日已赚、已工作时长、下班倒计时、当前状态
 */
import {
  DEFAULT_CONFIG,
  resolveConfig,
  getDayStat,
  getStatus,
  getWindows,
  getHourlyRate,
  getDailyWage,
  getCurrencyDecimals,
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
import { syncState, balanceBase, toDisplay } from "./lib/game.js";
import {
  rankFor,
  loggedSeconds,
  weekdayEgg
} from "./lib/extras.js";

let config = { ...DEFAULT_CONFIG };
let tickTimer = null;
let currentQuote = "";
/** 钱包 state 缓存：段位统计要用账本里的累计工时 */
let cachedState = null;

const els = {
  millScene: document.getElementById("millScene"),
  currentDate: document.getElementById("currentDate"),
  weekday: document.getElementById("weekday"),
  workStatus: document.getElementById("workStatus"),
  earnedSalary: document.getElementById("earnedSalary"),
  salaryRateHint: document.getElementById("salaryRateHint"),
  workTimer: document.getElementById("workTimer"),
  countdownLabel: document.getElementById("countdownLabel"),
  countdown: document.getElementById("countdown"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  quoteText: document.getElementById("quoteText"),
  statsBtn: document.getElementById("statsBtn"),
  walletBtn: document.getElementById("walletBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  langBtn: document.getElementById("langBtn"),
  walletPill: document.getElementById("walletPill"),
  walletPillLabel: document.getElementById("walletPillLabel"),
  walletPillValue: document.getElementById("walletPillValue"),
  rankBadge: document.getElementById("rankBadge"),
  rankHours: document.getElementById("rankHours")
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

function renderMill(phase, egg = "") {
  const scene = els.millScene;
  if (!scene) return;
  // 只在值变化时写，避免每秒重设导致动画复位
  if (scene.dataset.phase !== phase) scene.dataset.phase = phase;
  if (scene.dataset.egg !== egg) scene.dataset.egg = egg;
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

  // 周彩蛋：周一上班打哈欠、周五下班疯跑
  const egg = weekdayEgg(now, status);
  const phase = egg.phaseOverride || millPhase(status, stat);
  renderMill(phase, egg.egg);

  els.currentDate.textContent = formatDateTitle(now, l);
  els.weekday.textContent = WEEKDAYS[l][now.getDay()];

  els.workStatus.textContent = meta.label;
  els.workStatus.className = `status-badge ${meta.cls}`;

  // 金额统一走「当前单位 + 该单位的小数位」，换单位后符号与位数一起跟着变
  const dec = getCurrencyDecimals(config);
  const money = (v, d = dec) => formatMoney(v, config.currencySymbol, d);

  els.earnedSalary.textContent = money(stat.earned);

  const hourly = getHourlyRate(config);
  const daily = getDailyWage(config);
  els.salaryRateHint.textContent = t(l, "hint.rate", {
    hourly: money(hourly),
    daily: money(daily)
  });

  els.workTimer.textContent = formatClock(stat.worked);
  els.workTimer.classList.toggle("running", status === "working" || status === "overtime");

  const cd = countdownInfo(stat, status, now);
  els.countdownLabel.textContent = cd.label;
  els.countdown.textContent = cd.seconds === null ? "—" : formatClock(cd.seconds);

  els.progressFill.style.width = `${stat.progress.toFixed(1)}%`;
  els.progressText.textContent = `${Math.round(stat.progress)}%`;

  // 打工段位：累计工时来自账本（历史结算）+ 今日在途
  renderRank(stat.worked, l);
}

function renderRank(todayWorked, l) {
  const ledger = cachedState && cachedState.wallet ? cachedState.wallet.ledger : null;
  const rank = rankFor(loggedSeconds(ledger, todayWorked), l);
  els.rankBadge.textContent = rank.name;
  els.rankHours.textContent = t(l, "rank.hours", { h: Math.round(rank.hours) });
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

/* ---------- 钱包胶囊 ---------- */
async function refreshWallet() {
  if (!els.walletPill) return;
  try {
    const { state } = await syncState(config);
    cachedState = state;
    const bal = balanceBase(state.wallet);
    els.walletPillValue.textContent = formatMoney(
      toDisplay(bal, config),
      config.currencySymbol,
      getCurrencyDecimals(config)
    );
    els.walletPill.hidden = false;
    els.walletPill.title = lang() === "zh" ? "打开钱包与商城" : "Open wallet & shop";
    renderRank(getDayStat(new Date(), config, new Date()).worked, lang());
  } catch (err) {
    els.walletPill.hidden = true;
  }
}

/* ---------- 启动 ---------- */
async function init() {
  config = resolveConfig(await chrome.storage.sync.get(null));

  refreshLangChrome();
  render();
  refreshWallet();
  tickTimer = setInterval(render, 1000);

  // 设置改变时立即反映：整份重读再规整，避免只更新到一半（例如换了单位没换符号）
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "sync") return;
    const prevLang = lang();
    config = resolveConfig(await chrome.storage.sync.get(null));
    if (lang() !== prevLang) refreshLangChrome();
    else if ("motivationalQuotes" in changes) pickQuote();
    render();
    refreshWallet();
  });
}

/** 打开统计面板，带 hash 时直落到对应 tab */
function openDashboard(hash) {
  const url = chrome.runtime.getURL("dashboard.html") + (hash ? `#${hash}` : "");
  if (chrome.tabs && chrome.tabs.create) chrome.tabs.create({ url });
  else window.open(url, "_blank");
}

els.statsBtn.addEventListener("click", () => openDashboard("stats"));
els.walletBtn.addEventListener("click", () => openDashboard("wallet"));
els.settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.langBtn.addEventListener("click", toggleLanguage);
if (els.walletPill) {
  els.walletPill.addEventListener("click", () => openDashboard("wallet"));
}

window.addEventListener("unload", () => clearInterval(tickTimer));

init();
