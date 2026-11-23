/**
 * 上班鼓励器 · 钱包账本
 *
 * 插件原本是「无状态」的：今日已赚每次由月薪 + 当前时间现算，从不落盘。
 * 钱包需要一个只增不减的账本，所以这里负责：
 *   1) 把已过去的每一天固化成一条快照（结算 settle）
 *   2) 提供「可消费余额」（只算已结算，不含今天的在途）
 *
 * 记账基准：所有金额内部都折成人民币（base），展示时再换回当前币种。
 * 这样切单位、改汇率都不会让历史流水变味。
 */

import {
  getDayStat,
  getCurrencyRate,
  addDays,
  dayKey,
  monthStart
} from "./calc.js";

export const STATE_KEY = "game";
export const STATE_VERSION = 1;

export function emptyState() {
  return {
    v: STATE_VERSION,
    wallet: {
      openingBase: 0,   // 起始余额（人民币），预留给「手动补录」
      spentBase: 0,     // 累计消费（人民币）
      lastSettled: null,// 已结算到哪一天（含），格式 YYYY-MM-DD
      ledger: {}        // { "2026-11-10": { base, a, rate, w, o } }
    },
    inv: { items: {}, cards: [] },
    seq: {},            // 每个卡种已发出的最大编号，只增不减
    pity: 0,            // 十连保底计数
    tx: []              // 最近 200 条交易
  };
}

/** 补齐缺失字段，兼容旧存档 / 半损坏存档 */
export function normalizeState(raw) {
  const base = emptyState();
  const s = raw && typeof raw === "object" ? raw : {};
  const w = s.wallet && typeof s.wallet === "object" ? s.wallet : {};
  const inv = s.inv && typeof s.inv === "object" ? s.inv : {};
  return {
    ...base,
    ...s,
    v: STATE_VERSION,
    wallet: {
      ...base.wallet,
      ...w,
      ledger: w.ledger && typeof w.ledger === "object" ? w.ledger : {}
    },
    inv: {
      items: inv.items && typeof inv.items === "object" ? inv.items : {},
      cards: Array.isArray(inv.cards) ? inv.cards : []
    },
    seq: s.seq && typeof s.seq === "object" ? s.seq : {},
    tx: Array.isArray(s.tx) ? s.tx : []
  };
}

/* ---------------- 日期 ---------------- */

export function parseDayKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** 当天 23:59:59 —— 结算过去某天时必须用它当 now，否则加班永远算 0 */
export function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 0);
  return x;
}

/* ---------------- 余额 ---------------- */

export function ledgerBase(wallet) {
  const led = (wallet && wallet.ledger) || {};
  return Object.keys(led).reduce((sum, k) => sum + (Number(led[k].base) || 0), 0);
}

/** 可消费余额（人民币）：起始 + 已结算 − 已消费 */
export function balanceBase(wallet) {
  const w = wallet || {};
  return (Number(w.openingBase) || 0) + ledgerBase(w) - (Number(w.spentBase) || 0);
}

/** 人民币 → 当前货币的展示值 */
export function toDisplay(base, config) {
  const rate = getCurrencyRate(config) || 1;
  return (Number(base) || 0) / rate;
}

/** 今天还没结算的部分（人民币），只展示、不能花 */
export function inFlightBase(config, now = new Date()) {
  const stat = getDayStat(now, config, now);
  return Math.max(0, stat.earned) * getCurrencyRate(config);
}

/* ---------------- 结算 ---------------- */

/**
 * 把「上次结算日 + 1」到「昨天」的每一天固化进账本。
 * 首次运行（没有 lastSettled）从本月初开始补记，保证刚装上就有余额可花。
 * 时间只许前进：存档里的 lastSettled 比今天还新时直接返回，不回滚、不补算。
 */
export function settle(state, config, now = new Date()) {
  const w = state.wallet;
  const today = dayKey(now);
  const rate = getCurrencyRate(config);

  let from;
  let backfilled = false;
  if (!w.lastSettled) {
    from = monthStart(now);
    backfilled = true;
  } else {
    if (w.lastSettled >= today) return { days: 0, addedBase: 0, backfilled: false };
    from = addDays(parseDayKey(w.lastSettled), 1);
  }

  let days = 0;
  let addedBase = 0;
  let cursor = new Date(from);
  let guard = 0;

  while (dayKey(cursor) < today && guard++ < 400) {
    const key = dayKey(cursor);
    if (!w.ledger[key]) {
      // 这里必须传真实的 now，不能传当天 23:59:59：
      // getDayStat 内部用 now 判断 isToday，一旦「过去某天」被当成今天，
      // 休息日会按周末倍率计薪、工作日会补满 6 小时加班 —— 直接虚增。
      // 历史日期不是今天，sec 会取下班时刻，正好等于满勤日薪，也不会算加班。
      const stat = getDayStat(cursor, config, now);
      if (stat.earned > 0.005) {
        const base = stat.earned * rate;
        w.ledger[key] = {
          base,
          a: stat.earned,
          rate,
          w: stat.worked,
          o: stat.overtime
        };
        addedBase += base;
        days += 1;
      }
    }
    cursor = addDays(cursor, 1);
  }

  w.lastSettled = dayKey(addDays(now, -1));
  return { days, addedBase, backfilled };
}

/** 最近 n 天的流水（从新到旧） */
export function recentLedger(wallet, n = 7) {
  const led = (wallet && wallet.ledger) || {};
  return Object.keys(led)
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, n)
    .map((k) => ({ key: k, ...led[k] }));
}

/** 本月已入账（人民币） */
export function monthBase(wallet, now = new Date()) {
  const led = (wallet && wallet.ledger) || {};
  const prefix = dayKey(now).slice(0, 7);
  return Object.keys(led)
    .filter((k) => k.slice(0, 7) === prefix)
    .reduce((s, k) => s + (Number(led[k].base) || 0), 0);
}
