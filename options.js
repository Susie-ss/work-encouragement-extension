/**
 * 上班鼓励器 - Options Page Logic
 */

const DEFAULT_CONFIG = {
  monthlySalary: 20000,
  workDaysPerMonth: 21.75,
  workStart: "09:00",
  workEnd: "18:00",
  breakStart: "12:00",
  breakEnd: "13:30",
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

const els = {
  monthlySalary: document.getElementById("monthlySalary"),
  workDaysPerMonth: document.getElementById("workDaysPerMonth"),
  currencySymbol: document.getElementById("currencySymbol"),
  workStart: document.getElementById("workStart"),
  workEnd: document.getElementById("workEnd"),
  breakStart: document.getElementById("breakStart"),
  breakEnd: document.getElementById("breakEnd"),
  motivationalQuotes: document.getElementById("motivationalQuotes"),
  saveBtn: document.getElementById("saveBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  saveStatus: document.getElementById("saveStatus")
};

function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
      const config = { ...DEFAULT_CONFIG, ...items };
      fillForm(config);
      resolve(config);
    });
  });
}

function fillForm(config) {
  els.monthlySalary.value = config.monthlySalary;
  els.workDaysPerMonth.value = config.workDaysPerMonth;
  els.currencySymbol.value = config.currencySymbol;
  els.workStart.value = config.workStart;
  els.workEnd.value = config.workEnd;
  els.breakStart.value = config.breakStart;
  els.breakEnd.value = config.breakEnd;
  els.motivationalQuotes.value = (config.motivationalQuotes || []).join("\n");
}

function getFormData() {
  const quotesText = els.motivationalQuotes.value.trim();
  const quotes = quotesText ? quotesText.split("\n").map(s => s.trim()).filter(Boolean) : DEFAULT_CONFIG.motivationalQuotes;

  return {
    monthlySalary: parseFloat(els.monthlySalary.value) || DEFAULT_CONFIG.monthlySalary,
    workDaysPerMonth: parseFloat(els.workDaysPerMonth.value) || DEFAULT_CONFIG.workDaysPerMonth,
    currencySymbol: els.currencySymbol.value || DEFAULT_CONFIG.currencySymbol,
    workStart: els.workStart.value || DEFAULT_CONFIG.workStart,
    workEnd: els.workEnd.value || DEFAULT_CONFIG.workEnd,
    breakStart: els.breakStart.value || DEFAULT_CONFIG.breakStart,
    breakEnd: els.breakEnd.value || DEFAULT_CONFIG.breakEnd,
    motivationalQuotes: quotes
  };
}

async function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, () => {
      showStatus("✅ 保存成功", "success");
      resolve();
    });
  });
}

function showStatus(message, type = "info") {
  els.saveStatus.textContent = message;
  els.saveStatus.style.color = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#6b7280";
  setTimeout(() => { els.saveStatus.textContent = ""; }, 3000);
}

function validateConfig(config) {
  if (config.monthlySalary <= 0) return "月薪必须大于 0";
  if (config.workDaysPerMonth <= 0 || config.workDaysPerMonth > 31) return "月工作天数应在 1-31 之间";
  if (!config.workStart || !config.workEnd) return "请设置上下班时间";
  if (!config.breakStart || !config.breakEnd) return "请设置午休时间";

  const start = parseTime(config.workStart);
  const end = parseTime(config.workEnd);
  const bStart = parseTime(config.breakStart);
  const bEnd = parseTime(config.breakEnd);

  if (start >= end) return "下班时间必须晚于上班时间";
  if (bStart >= bEnd) return "午休结束时间必须晚于开始时间";
  if (bStart < start || bEnd > end) return "午休时间必须在上下班时间范围内";

  return null;
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

async function resetAll() {
  if (confirm("确定要重置所有设置为默认值吗？此操作不可撤销。")) {
    await new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
    fillForm(DEFAULT_CONFIG);
    showStatus("✅ 已恢复默认设置", "success");
  }
}

// Event listeners
els.saveBtn.addEventListener("click", async () => {
  const config = getFormData();
  const error = validateConfig(config);
  if (error) {
    showStatus(`❌ ${error}`, "error");
    return;
  }
  await saveConfig(config);
});

els.resetAllBtn.addEventListener("click", resetAll);

// Enter key to save
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    els.saveBtn.click();
  }
});

// Init
loadConfig();