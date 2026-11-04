/**
 * Work Encourager · Options
 */
import {
  DEFAULT_CONFIG,
  CURRENCIES,
  CURRENCY_CODES,
  parseTimeStr,
  normalizeCurrency,
  getCurrencyRate,
  getCurrencySymbol,
  convertAmount,
  detectCurrency,
  formatMoney
} from "./lib/calc.js";
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
  currency: document.getElementById("currency"),
  currencyRate: document.getElementById("currencyRate"),
  rateField: document.getElementById("rateField"),
  rateLabel: document.getElementById("rateLabel"),
  rateHint: document.getElementById("rateHint"),
  salaryUnit: document.getElementById("salaryUnit"),
  salaryHint: document.getElementById("salaryHint"),
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

/* ---------------- 货币 ---------------- */

let lastCurrency = DEFAULT_CONFIG.currency;

/** 输入框里手填的汇率；空 = 用内置参考汇率 */
function typedRate() {
  const raw = String(els.currencyRate.value || "").trim();
  if (raw === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

/** 当前生效汇率：1 单位 = ? 人民币 */
function rateOfInput(code) {
  const c = normalizeCurrency(code);
  if (c === "CNY") return 1;
  const typed = typedRate();
  return typed !== null && typed > 0 ? typed : CURRENCIES[c].rate;
}

function renderCurrencyOptions() {
  const l = lang();
  els.currency.innerHTML = CURRENCY_CODES.map(
    (code) =>
      `<option value="${code}">${t(l, "currency." + code)} · ${code} ${CURRENCIES[code].symbol.trim()}</option>`
  ).join("");
  els.currency.value = normalizeCurrency(lastCurrency);
}

/** 单位标签、汇率提示、折合人民币提示 */
function syncCurrencyFields() {
  const l = lang();
  const code = normalizeCurrency(els.currency.value);
  const rate = rateOfInput(code);

  els.salaryUnit.textContent = code;
  els.rateField.classList.toggle("is-hidden", code === "CNY");
  els.currencyRate.placeholder = String(CURRENCIES[code].rate);
  els.rateLabel.textContent = t(l, "opt.rate.label", { code });
  els.rateHint.textContent = t(l, "opt.rate.hint", {
    code,
    rate: formatMoney(rate, "", rate < 1 ? 4 : 2)
  });

  const salary = parseFloat(els.monthlySalary.value) || 0;
  let hint = t(l, "opt.salary.hint");
  if (code !== "CNY" && salary > 0) {
    const yuan = convertAmount(salary, code, "CNY", rate, 1);
    hint += " · " + t(l, "opt.salaryIn", { amount: formatMoney(yuan, "¥", 0) });
  }
  els.salaryHint.textContent = hint;
}

/** 切单位：先按新旧汇率把月薪换算过去，再把汇率框重置为该货币的参考值 */
function onCurrencyChange() {
  const to = normalizeCurrency(els.currency.value);
  const from = normalizeCurrency(lastCurrency);
  const amount = parseFloat(els.monthlySalary.value) || 0;

  if (to !== from && amount > 0) {
    els.monthlySalary.value = convertAmount(amount, from, to, rateOfInput(from), CURRENCIES[to].rate);
  }
  els.currencyRate.value = to === "CNY" ? "" : CURRENCIES[to].rate;
  lastCurrency = to;
  syncCurrencyFields();
}

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

  renderCurrencyOptions();
  syncCurrencyFields();
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

  // 旧配置只存了符号：先按符号猜一次单位，避免单位显示错位
  const code = normalizeCurrency(cfg.currency || detectCurrency(cfg.currencySymbol));
  lastCurrency = code;
  els.currency.value = code;
  els.currencyRate.value = code === "CNY" ? "" : getCurrencyRate({ ...cfg, currency: code });

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
  syncCurrencyFields();
}

function getFormData() {
  const quotesText = els.motivationalQuotes.value.trim();
  const quotes = quotesText
    ? quotesText.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const code = normalizeCurrency(els.currency.value);
  const rate = code === "CNY" ? 1 : rateOfInput(code);

  return {
    monthlySalary: parseFloat(els.monthlySalary.value) || 0,
    workDaysPerMonth: parseFloat(els.workDaysPerMonth.value) || 0,
    currency: code,
    currencyRate: code === "CNY" ? 0 : rate,
    currencySymbol: getCurrencySymbol({ currency: code }),
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

  const code = normalizeCurrency(els.currency.value);
  const typed = typedRate();
  if (code !== "CNY" && typed !== null && typed <= 0) return "err.rate";
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
els.currency.addEventListener("change", onCurrencyChange);
els.currencyRate.addEventListener("input", syncCurrencyFields);
els.monthlySalary.addEventListener("input", syncCurrencyFields);

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
