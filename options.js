/**
 * Work Encourager · Options
 */
import { DEFAULT_CONFIG, parseTimeStr } from "./lib/calc.js";
import {
  applyStatic,
  normalizeLang,
  t,
  isBuiltinQuotes,
  WEEKDAY_CHIP
} from "./lib/i18n.js";

let config = { ...DEFAULT_CONFIG };

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
  langPicker: document.getElementById("langPicker"),
  saveBtn: document.getElementById("saveBtn"),
  statsBtn: document.getElementById("statsBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  saveStatus: document.getElementById("saveStatus")
};

const boxes = Array.from(els.weekdayPicker.querySelectorAll("input[type=checkbox]"));
const langBtns = Array.from(els.langPicker.querySelectorAll(".lang-opt"));
const lang = () => normalizeLang(config.language);

/* ---------------- 语言 ---------------- */

function refreshLang() {
  const l = lang();
  applyStatic(document, l);
  document.title = t(l, "opt.title");

  // 星期胶囊：按语言换成 Mon / 一
  boxes.forEach((b) => {
    const span = b.parentElement.querySelector("span");
    if (span) span.textContent = WEEKDAY_CHIP[l][Number(b.value)];
  });

  langBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === l);
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === l));
  });
}

async function switchLanguage(next) {
  if (next === lang()) return;
  config.language = next;
  await chrome.storage.sync.set({ language: next });
  refreshLang();
}

/* ---------------- 表单读写 ---------------- */

function fillForm(cfg) {
  els.monthlySalary.value = cfg.monthlySalary;
  els.workDaysPerMonth.value = cfg.workDaysPerMonth;
  els.currencySymbol.value = cfg.currencySymbol;
  els.workStart.value = cfg.workStart;
  els.workEnd.value = cfg.workEnd;
  els.breakStart.value = cfg.breakStart;
  els.breakEnd.value = cfg.breakEnd;

  const days = (cfg.workDays && cfg.workDays.length ? cfg.workDays : DEFAULT_CONFIG.workDays).map(Number);
  boxes.forEach((b) => { b.checked = days.includes(Number(b.value)); });

  els.overtimeEnabled.checked = !!cfg.overtimeEnabled;
  els.weekdayOvertimeRate.value = cfg.weekdayOvertimeRate ?? 1.5;
  els.weekendEnabled.checked = !!cfg.weekendEnabled;
  els.weekendRate.value = cfg.weekendRate ?? 2;

  // 空 = 使用内置语录；旧版本存的内置中文数组也识别为空
  els.motivationalQuotes.value = isBuiltinQuotes(cfg.motivationalQuotes)
    ? ""
    : (cfg.motivationalQuotes || []).join("\n");

  syncRateFields();
}

function getFormData() {
  const quotesText = els.motivationalQuotes.value.trim();
  const quotes = quotesText
    ? quotesText.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

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
    language: lang(),
    motivationalQuotes: quotes
  };
}

/* ---------------- 联动 ---------------- */

function syncRateFields() {
  els.otRateField.classList.toggle("disabled", !els.overtimeEnabled.checked);
  els.weRateField.classList.toggle("disabled", !els.weekendEnabled.checked);
}

/* ---------------- 校验（返回文案 key） ---------------- */

function validate(cfg) {
  if (cfg.monthlySalary <= 0) return "err.salary";
  if (cfg.workDaysPerMonth <= 0 || cfg.workDaysPerMonth > 31) return "err.days";
  if (cfg.workDays.length === 0) return "err.workdays";

  const start = parseTimeStr(cfg.workStart);
  const end = parseTimeStr(cfg.workEnd);
  const bs = parseTimeStr(cfg.breakStart);
  const be = parseTimeStr(cfg.breakEnd);

  if (start >= end) return "err.endAfterStart";
  if (bs >= be) return "err.breakOrder";
  if (bs < start || be > end) return "err.breakRange";
  if (end - start - (be - bs) < 1800) return "err.tooShort";

  if (cfg.overtimeEnabled && (cfg.weekdayOvertimeRate < 1 || cfg.weekdayOvertimeRate > 5))
    return "err.otRate";
  if (cfg.weekendEnabled && (cfg.weekendRate < 1 || cfg.weekendRate > 5))
    return "err.weRate";

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
  const cfg = getFormData();
  const errorKey = validate(cfg);
  if (errorKey) {
    showStatus(`⚠️ ${t(lang(), errorKey)}`, "error");
    return;
  }
  await chrome.storage.sync.set(cfg);
  showStatus(t(lang(), "opt.saved"));
}

async function resetAll() {
  if (!confirm(t(lang(), "opt.confirmReset"))) return;
  const keepLang = lang();
  await chrome.storage.sync.clear();
  const stored = await chrome.storage.sync.get(DEFAULT_CONFIG);
  config = { ...DEFAULT_CONFIG, ...stored, language: keepLang };
  fillForm(config);
  showStatus(t(lang(), "opt.resetDone"));
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

langBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) els.saveBtn.click();
});

/* ---------------- 启动 ---------------- */

const stored = await chrome.storage.sync.get(DEFAULT_CONFIG);
config = { ...DEFAULT_CONFIG, ...stored };
refreshLang();
fillForm(config);
