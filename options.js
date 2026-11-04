/**
 * 上班鼓励器 · 设置页
 */
import { DEFAULT_CONFIG, parseTimeStr } from "./lib/calc.js";

const els = {
  monthlySalary: document.getElementById("monthlySalary"),
  workDaysPerMonth: document.getElementById("workDaysPerMonth"),
  currencySymbol: document.getElementById("currencySymbol"),
  workStart: document.getElementById("workStart"),
  workEnd: document.getElementById("workEnd"),
  breakStart: document.getElementById("breakStart"),
  breakEnd: document.getElementById("breakEnd"),
  weekdayPicker: document.getElementById("weekdayPicker"),
  overtimeEnabled: document.getElementById("overtimeEnabled"),
  weekdayOvertimeRate: document.getElementById("weekdayOvertimeRate"),
  weekendEnabled: document.getElementById("weekendEnabled"),
  weekendRate: document.getElementById("weekendRate"),
  otRateField: document.getElementById("otRateField"),
  weRateField: document.getElementById("weRateField"),
  motivationalQuotes: document.getElementById("motivationalQuotes"),
  saveBtn: document.getElementById("saveBtn"),
  statsBtn: document.getElementById("statsBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  saveStatus: document.getElementById("saveStatus")
};

const boxes = Array.from(els.weekdayPicker.querySelectorAll("input[type=checkbox]"));

/* ---------------- 表单读写 ---------------- */

function fillForm(config) {
  els.monthlySalary.value = config.monthlySalary;
  els.workDaysPerMonth.value = config.workDaysPerMonth;
  els.currencySymbol.value = config.currencySymbol;
  els.workStart.value = config.workStart;
  els.workEnd.value = config.workEnd;
  els.breakStart.value = config.breakStart;
  els.breakEnd.value = config.breakEnd;

  const days = (config.workDays && config.workDays.length ? config.workDays : DEFAULT_CONFIG.workDays).map(Number);
  boxes.forEach((b) => { b.checked = days.includes(Number(b.value)); });

  els.overtimeEnabled.checked = !!config.overtimeEnabled;
  els.weekdayOvertimeRate.value = config.weekdayOvertimeRate ?? 1.5;
  els.weekendEnabled.checked = !!config.weekendEnabled;
  els.weekendRate.value = config.weekendRate ?? 2;

  const quotes = (config.motivationalQuotes || []).join("\n");
  els.motivationalQuotes.value = quotes === DEFAULT_CONFIG.motivationalQuotes.join("\n") ? "" : quotes;

  syncRateFields();
}

function getFormData() {
  const quotesText = els.motivationalQuotes.value.trim();
  const quotes = quotesText
    ? quotesText.split("\n").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_CONFIG.motivationalQuotes;

  return {
    monthlySalary: parseFloat(els.monthlySalary.value) || 0,
    workDaysPerMonth: parseFloat(els.workDaysPerMonth.value) || 0,
    currencySymbol: els.currencySymbol.value.trim() || DEFAULT_CONFIG.currencySymbol,
    workStart: els.workStart.value || DEFAULT_CONFIG.workStart,
    workEnd: els.workEnd.value || DEFAULT_CONFIG.workEnd,
    breakStart: els.breakStart.value || DEFAULT_CONFIG.breakStart,
    breakEnd: els.breakEnd.value || DEFAULT_CONFIG.breakEnd,
    workDays: boxes.filter((b) => b.checked).map((b) => Number(b.value)),
    overtimeEnabled: els.overtimeEnabled.checked,
    weekdayOvertimeRate: parseFloat(els.weekdayOvertimeRate.value) || DEFAULT_CONFIG.weekdayOvertimeRate,
    weekendEnabled: els.weekendEnabled.checked,
    weekendRate: parseFloat(els.weekendRate.value) || DEFAULT_CONFIG.weekendRate,
    motivationalQuotes: quotes
  };
}

/* ---------------- 联动 ---------------- */

function syncRateFields() {
  els.otRateField.classList.toggle("disabled", !els.overtimeEnabled.checked);
  els.weRateField.classList.toggle("disabled", !els.weekendEnabled.checked);
}

/* ---------------- 校验 ---------------- */

function validate(config) {
  if (config.monthlySalary <= 0) return "月薪必须大于 0";
  if (config.workDaysPerMonth <= 0 || config.workDaysPerMonth > 31) return "月工作天数应在 1–31 之间";
  if (config.workDays.length === 0) return "请至少选择一个工作日";

  const start = parseTimeStr(config.workStart);
  const end = parseTimeStr(config.workEnd);
  const bs = parseTimeStr(config.breakStart);
  const be = parseTimeStr(config.breakEnd);

  if (start >= end) return "下班时间必须晚于上班时间";
  if (bs >= be) return "午休结束必须晚于午休开始";
  if (bs < start || be > end) return "午休必须落在上下班时间之内";
  if (end - start - (be - bs) < 1800) return "扣除午休后工作时长不足 30 分钟";

  if (config.overtimeEnabled && (config.weekdayOvertimeRate < 1 || config.weekdayOvertimeRate > 5))
    return "加班倍率应在 1–5 之间";
  if (config.weekendEnabled && (config.weekendRate < 1 || config.weekendRate > 5))
    return "周末倍率应在 1–5 之间";

  return null;
}

/* ---------------- 反馈 ---------------- */

let statusTimer = null;
function showStatus(message, type = "success") {
  els.saveStatus.textContent = message;
  els.saveStatus.style.color =
    type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#10b981";
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { els.saveStatus.textContent = ""; }, 3000);
}

/* ---------------- 动作 ---------------- */

async function save() {
  const config = getFormData();
  const error = validate(config);
  if (error) {
    showStatus(`⚠️ ${error}`, "error");
    return;
  }
  await chrome.storage.sync.set(config);
  showStatus("✅ 已保存");
}

async function resetAll() {
  if (!confirm("确定恢复默认设置吗？当前配置会被覆盖。")) return;
  await chrome.storage.sync.clear();
  const config = await chrome.storage.sync.get(DEFAULT_CONFIG);
  fillForm({ ...DEFAULT_CONFIG, ...config });
  showStatus("✅ 已恢复默认");
}

/* ---------------- 事件 ---------------- */

els.saveBtn.addEventListener("click", save);
els.resetAllBtn.addEventListener("click", resetAll);
els.statsBtn.addEventListener("click", () => {
  const url = chrome.runtime.getURL("dashboard.html");
  if (chrome.tabs && chrome.tabs.create) chrome.tabs.create({ url });
  else window.open(url, "_blank");
});

els.overtimeEnabled.addEventListener("change", syncRateFields);
els.weekendEnabled.addEventListener("change", syncRateFields);

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) els.saveBtn.click();
});

/* ---------------- 启动 ---------------- */

const stored = await chrome.storage.sync.get(DEFAULT_CONFIG);
fillForm({ ...DEFAULT_CONFIG, ...stored });
