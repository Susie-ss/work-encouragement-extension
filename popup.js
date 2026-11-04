/**
 * 上班鼓励器 - Popup Logic
 * 实时计算今日已赚工资、工作时长、当前状态
 */

// ============ 配置默认值 ============
const DEFAULT_CONFIG = {
  monthlySalary: 20000,      // 月薪
  workDaysPerMonth: 21.75,   // 月工作天数（法定）
  workStart: "09:00",        // 上班时间
  workEnd: "18:00",          // 下班时间
  breakStart: "12:00",       // 午休开始
  breakEnd: "13:30",         // 午休结束
  currencySymbol: "¥",
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

// ============ 状态变量 ============
let config = { ...DEFAULT_CONFIG };
let todayEarned = 0;
let todayWorkSeconds = 0;
let timerInterval = null;
let isWorkingNow = false;

// ============ DOM 元素 ============
const els = {
  currentDate: document.getElementById("currentDate"),
  weekday: document.getElementById("weekday"),
  workStatus: document.getElementById("workStatus"),
  statusMessage: document.getElementById("statusMessage"),
  earnedSalary: document.getElementById("earnedSalary"),
  salaryRateHint: document.getElementById("salaryRateHint"),
  workTimer: document.getElementById("workTimer"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  quoteText: document.getElementById("quoteText"),
  settingsBtn: document.getElementById("settingsBtn"),
  resetBtn: document.getElementById("resetBtn")
};

// ============ 工具函数 ============
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatMoney(amount) {
  return `${config.currencySymbol}${amount.toFixed(2)}`;
}

function parseTimeStr(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}

function getWorkSecondsToday(now = new Date()) {
  const startSec = parseTimeStr(config.workStart);
  const endSec = parseTimeStr(config.workEnd);
  const breakStartSec = parseTimeStr(config.breakStart);
  const breakEndSec = parseTimeStr(config.breakEnd);

  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // 未到上班时间
  if (nowSec < startSec) return 0;

  // 已过下班时间
  if (nowSec >= endSec) {
    let total = endSec - startSec;
    // 扣除午休
    if (endSec > breakStartSec) {
      total -= Math.min(endSec, breakEndSec) - breakStartSec;
    }
    return Math.max(0, total);
  }

  // 在工作时间内
  let worked = nowSec - startSec;
  // 扣除午休（如果已经过午休开始）
  if (nowSec > breakStartSec) {
    worked -= Math.min(nowSec, breakEndSec) - breakStartSec;
  }
  return Math.max(0, worked);
}

function getTotalWorkSecondsToday() {
  const startSec = parseTimeStr(config.workStart);
  const endSec = parseTimeStr(config.workEnd);
  const breakStartSec = parseTimeStr(config.breakStart);
  const breakEndSec = parseTimeStr(config.breakEnd);
  let total = endSec - startSec;
  total -= (breakEndSec - breakStartSec);
  return Math.max(0, total);
}

function getHourlyRate() {
  // 月薪 / 月工作天数 / 日工作小时数
  const dailyHours = getTotalWorkSecondsToday() / 3600;
  return config.monthlySalary / config.workDaysPerMonth / dailyHours;
}

function getWorkStatus(now = new Date()) {
  const startSec = parseTimeStr(config.workStart);
  const endSec = parseTimeStr(config.workEnd);
  const breakStartSec = parseTimeStr(config.breakStart);
  const breakEndSec = parseTimeStr(config.breakEnd);
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (nowSec < startSec) return "offwork";
  if (nowSec >= endSec) return "offwork";
  if (nowSec >= breakStartSec && nowSec < breakEndSec) return "break";
  return "working";
}

function getRandomQuote() {
  const quotes = config.motivationalQuotes || DEFAULT_CONFIG.motivationalQuotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// ============ 存储相关 ============
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
      config = { ...DEFAULT_CONFIG, ...items };
      resolve(config);
    });
  });
}

async function loadTodayData() {
  const key = getTodayKey();
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (items) => {
      const data = items[key] || { earned: 0, workSeconds: 0, lastUpdate: Date.now() };
      todayEarned = data.earned || 0;
      todayWorkSeconds = data.workSeconds || 0;
      resolve(data);
    });
  });
}

async function saveTodayData() {
  const key = getTodayKey();
  const data = {
    earned: todayEarned,
    workSeconds: todayWorkSeconds,
    lastUpdate: Date.now()
  };
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: data }, resolve);
  });
}

async function resetTodayData() {
  const key = getTodayKey();
  todayEarned = 0;
  todayWorkSeconds = 0;
  await new Promise((resolve) => {
    chrome.storage.local.remove([key], resolve);
  });
  updateUI();
}

// ============ UI 更新 ============
function updateDateTime() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  els.currentDate.textContent = `${month}月${day}日`;
  els.weekday.textContent = weekdays[now.getDay()];
}

function updateStatus() {
  const now = new Date();
  const status = getWorkStatus(now);

  isWorkingNow = (status === "working");

  const statusMap = {
    working: { text: "🟢 正在上班", class: "working", msg: "好好搬砖，每一秒都在增值！" },
    break: { text: "🟡 午休中", class: "break", msg: "好好休息，下午继续冲！☕" },
    offwork: {
      text: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() < parseTimeStr(config.workStart)
        ? "🔴 尚未上班"
        : "🔴 已下班",
      class: "offwork",
      msg: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() < parseTimeStr(config.workStart)
        ? "还没上班，先喝杯咖啡缓缓 ☕"
        : "下班啦！关掉电脑，享受生活 🎉"
    }
  };

  const s = statusMap[status];
  els.workStatus.textContent = s.text;
  els.workStatus.className = `status-badge ${s.class}`;
  els.statusMessage.textContent = s.msg;
}

function updateSalary() {
  const hourlyRate = getHourlyRate();
  const dailyHours = getTotalWorkSecondsToday() / 3600;
  const workedHours = todayWorkSeconds / 3600;
  todayEarned = workedHours * hourlyRate;

  els.earnedSalary.textContent = formatMoney(todayEarned);
  els.salaryRateHint.textContent = `时薪约 ${formatMoney(hourlyRate)} · 日薪约 ${formatMoney(hourlyRate * dailyHours)}`;
}

function updateTimer() {
  const now = new Date();
  todayWorkSeconds = getWorkSecondsToday(now);

  els.workTimer.textContent = formatTime(todayWorkSeconds);
  els.workTimer.classList.toggle("running", isWorkingNow);

  const totalSeconds = getTotalWorkSecondsToday();
  const progress = totalSeconds > 0 ? (todayWorkSeconds / totalSeconds) * 100 : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  els.progressFill.style.width = `${clampedProgress}%`;
  els.progressText.textContent = `${Math.round(clampedProgress)}% / 100%`;
}

function updateQuote() {
  els.quoteText.textContent = getRandomQuote();
}

function updateUI() {
  updateDateTime();
  updateStatus();
  updateSalary();
  updateTimer();
  updateQuote();
}

// ============ 定时器循环 ============
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    updateStatus();
    updateTimer();
    updateSalary();
    saveTodayData();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ============ 事件绑定 ============
els.settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

els.resetBtn.addEventListener("click", async () => {
  if (confirm("确定要重置今日数据吗？这将清空已赚工资和工作时长。")) {
    await resetTodayData();
  }
});

// ============ 初始化 ============
async function init() {
  await loadConfig();
  await loadTodayData();
  updateUI();
  startTimer();

  // 监听配置变更
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      Object.keys(changes).forEach(key => {
        if (DEFAULT_CONFIG.hasOwnProperty(key)) {
          config[key] = changes[key].newValue;
        }
      });
      updateUI();
    }
  });
}

// 页面卸载时保存
window.addEventListener("beforeunload", saveTodayData);

// 启动
init();