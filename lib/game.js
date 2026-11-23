/**
 * 上班鼓励器 · 虚拟经济
 * 存档读写、结算触发、定价、抽卡、扣款。
 *
 * 存档只用一个 key（chrome.storage.local 没有事务）：
 * 扣钱和发卡必须在同一次 set() 里完成，否则会出现「钱花了、卡没到」。
 */

import { getDailyWage, getCurrencyRate } from "./calc.js";
import {
  STATE_KEY,
  normalizeState,
  settle,
  balanceBase,
  inFlightBase,
  toDisplay,
  recentLedger,
  monthBase
} from "./wallet.js";
import {
  PACK,
  ITEM_MAP,
  CARD_DEFS,
  CARD_MAP,
  RARITY,
  RARITY_ORDER,
  cardsOfRarity,
  findDef
} from "./cards.js";

/* ---------------- 存档 ---------------- */

export async function loadState() {
  const raw = await chrome.storage.local.get(STATE_KEY);
  return normalizeState(raw && raw[STATE_KEY]);
}

export async function saveState(state) {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

/** 读档 + 结算一次，需要时落盘 */
export async function syncState(config, now = new Date()) {
  const state = await loadState();
  const before = state.wallet.lastSettled;
  const result = settle(state, config, now);
  if (state.wallet.lastSettled !== before) await saveState(state);
  return { state, result };
}

export { balanceBase, inFlightBase, toDisplay, recentLedger, monthBase };

/* ---------------- 定价 ---------------- */

/** 商品价格（当前币种） */
export function priceOf(id, config) {
  const def = findDef(id);
  if (!def || !(def.days > 0)) return 0;
  return def.days * getDailyWage(config);
}

/** 商品价格（人民币基准，用于扣款比对） */
export function priceBaseOf(id, config) {
  return priceOf(id, config) * getCurrencyRate(config);
}

/* ---------------- 抽卡 ---------------- */

export function rollRarity(rnd = Math.random) {
  const total = RARITY_ORDER.reduce((s, k) => s + RARITY[k].rate, 0);
  let r = rnd() * total;
  for (const key of RARITY_ORDER) {
    r -= RARITY[key].rate;
    if (r < 0) return key;
  }
  return "N";
}

export function addCard(state, defId, now = new Date()) {
  const no = (state.seq[defId] = (state.seq[defId] || 0) + 1);
  const inst = { def: defId, no, at: now.toISOString() };
  state.inv.cards.push(inst);
  return inst;
}

/** 开一包：count 张，最后一抽保底史诗（一出史诗/传说就不再补） */
export function rollPack(state, now = new Date(), count = PACK.count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    let rarity = rollRarity();
    const hasRare = out.some((c) => RARITY[CARD_MAP[c.def].rarity].rate <= RARITY.SR.rate);
    if (i === count - 1 && !hasRare) rarity = "SR";
    const pool = cardsOfRarity(rarity);
    const def = pool[Math.floor(Math.random() * pool.length)];
    out.push(addCard(state, def.id, now));
  }
  return out;
}

/* ---------------- 交易 ---------------- */

function pushTx(state, entry) {
  state.tx.unshift(entry);
  state.tx = state.tx.slice(0, 200);
}

/**
 * 购买。成功返回 { ok, priceBase, cards }，余额不足返回 { ok:false, reason:"poor" }。
 * 注意：调用方拿到 ok=true 后必须立刻 saveState —— 这里只改内存。
 */
export function purchase(state, config, id, now = new Date()) {
  const def = findDef(id);
  if (!def) return { ok: false, reason: "unknown" };

  const priceBase = priceBaseOf(id, config);
  if (priceBase <= 0 && id !== PACK.id) return { ok: false, reason: "unknown" };
  if (balanceBase(state.wallet) + 1e-6 < priceBase) {
    return { ok: false, reason: "poor", need: priceBase };
  }

  state.wallet.spentBase = (Number(state.wallet.spentBase) || 0) + priceBase;

  let cards = [];
  if (id === PACK.id) {
    cards = rollPack(state, now);
    state.pity += 1;
  } else if (ITEM_MAP[id]) {
    state.inv.items[id] = (state.inv.items[id] || 0) + 1;
  } else {
    cards = [addCard(state, id, now)];
  }

  pushTx(state, {
    at: now.toISOString(),
    type: "buy",
    base: priceBase,
    id,
    cards: cards.map((c) => c.def)
  });

  return { ok: true, priceBase, cards };
}

/** 拥有某张卡的数量（按卡种） */
export function ownedCount(state, defId) {
  return state.inv.cards.filter((c) => c.def === defId).length;
}

/** 图鉴进度 */
export function collection(state) {
  const owned = new Set(state.inv.cards.map((c) => c.def));
  return { owned: owned.size, total: CARD_DEFS.length };
}

/** 一张卡的「身价」：卡包掉落 / 仅展示 */
export function cardSellable(def) {
  return !!(def && def.days > 0);
}
