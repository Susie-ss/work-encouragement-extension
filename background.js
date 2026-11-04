/**
 * 上班鼓励器 - Background Service Worker
 * 处理闹钟、定时保存、跨会话持久化
 */

// 创建每分钟触发的闹钟，用于后台保存数据
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("saveData", {
    periodInMinutes: 1
  });
});

// 监听闹钟
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "saveData") {
    saveCurrentData();
  }
});

// 从存储获取配置并计算当前收入
async function saveCurrentData() {
  const config = await getConfig();
  const now = new Date();
  const todayKey = getTodayKey();

  const workedSeconds = getWorkSecondsToday(now, config);
  const hourlyRate = getHourlyRate(config);
  const earned = (workedSeconds / 3600) * hourlyRate;

  const data = {
    earned,
    workSeconds: workedSeconds,
    lastUpdate: Date.now()
  };

  chrome.storage.local.set({ [todayKey]: data });
}

// 获取配置
function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      monthlySalary: 20000,
      workDaysPerMonth: 21.75,
      workStart: "09:00",
      workEnd: "18:00",
      breakStart: "12:00",
      breakEnd: "13:30",
      currencySymbol: "¥"
    }, resolve);
  });
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}

function parseTimeStr(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60;
}

function getWorkSecondsToday(now, config) {
  const startSec = parseTimeStr(config.workStart);
  const endSec = parseTimeStr(config.workEnd);
  const breakStartSec = parseTimeStr(config.breakStart);
  const breakEndSec = parseTimeStr(config.breakEnd);
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (nowSec < startSec) return 0;
  if (nowSec >= endSec) {
    let total = endSec - startSec;
    if (endSec > breakStartSec) {
      total -= Math.min(endSec, breakEndSec) - breakStartSec;
    }
    return Math.max(0, total);
  }

  let worked = nowSec - startSec;
  if (nowSec > breakStartSec) {
    worked -= Math.min(nowSec, breakEndSec) - breakStartSec;
  }
  return Math.max(0, worked);
}

function getTotalWorkSecondsToday(config) {
  const startSec = parseTimeStr(config.workStart);
  const endSec = parseTimeStr(config.workEnd);
  const breakStartSec = parseTimeStr(config.breakStart);
  const breakEndSec = parseTimeStr(config.breakEnd);
  let total = endSec - startSec;
  total -= (breakEndSec - breakStartSec);
  return Math.max(0, total);
}

function getHourlyRate(config) {
  const dailyHours = getTotalWorkSecondsToday(config) / 3600;
  return config.monthlySalary / config.workDaysPerMonth / dailyHours;
}

// 扩展启动时也保存一次
chrome.runtime.onStartup.addListener(saveCurrentData);