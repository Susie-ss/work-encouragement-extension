/**
 * Work Encourager · Background Service Worker
 * 负责：图标徽章金额刷新（每分钟）、安装/启动初始化
 */
import {
  resolveConfig,
  getDayStat,
  getCurrencyDecimals,
  formatBadge,
  formatMoney
} from "./lib/calc.js";
import { t, normalizeLang } from "./lib/i18n.js";
import { loadState, saveState } from "./lib/game.js";
import { settle } from "./lib/wallet.js";

const BADGE_COLOR = "#4f46e5";
const ALARM_NAME = "badgeTick";

async function readConfig() {
  return resolveConfig(await chrome.storage.sync.get(null));
}

/** 跨天结算：每分钟的 alarm 顺手检查一次，浏览器没开也不会漏（下次唤醒补算） */
async function settleWallet(config) {
  try {
    const state = await loadState();
    const before = state.wallet.lastSettled;
    settle(state, config, new Date());
    if (state.wallet.lastSettled !== before) await saveState(state);
  } catch (err) {
    console.warn("[work-encourager] settle failed", err);
  }
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
              amount: formatMoney(stat.earned, config.currencySymbol, getCurrencyDecimals(config))
            })
    });

    await settleWallet(config);
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
