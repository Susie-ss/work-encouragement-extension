/**
 * Work Encourager · Background Service Worker
 * 负责：图标徽章金额刷新（每分钟）、安装/启动初始化
 */
import { DEFAULT_CONFIG, getDayStat, formatBadge, formatMoney } from "./lib/calc.js";
import { t, normalizeLang } from "./lib/i18n.js";

const BADGE_COLOR = "#4f46e5";
const ALARM_NAME = "badgeTick";

async function readConfig() {
  const stored = await chrome.storage.sync.get(DEFAULT_CONFIG);
  return { ...DEFAULT_CONFIG, ...stored };
}

async function updateBadge() {
  try {
    const config = await readConfig();
    const lang = normalizeLang(config.language);
    const now = new Date();
    const stat = getDayStat(now, config, now);

    const text = stat.earned >= 1 ? formatBadge(stat.earned) : "";
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    await chrome.action.setBadgeText({ text });
    await chrome.action.setTitle({
      title:
        text === ""
          ? t(lang, "app.name")
          : t(lang, "badge.title", {
              app: t(lang, "app.name"),
              amount: formatMoney(stat.earned, config.currencySymbol)
            })
    });
  } catch (err) {
    console.warn("[work-encourager] badge update failed", err);
  }
}

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) updateBadge();
});

// 设置改动后立即刷新徽章
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") updateBadge();
});

// Service worker 被唤醒时也刷一次
ensureAlarm();
updateBadge();
