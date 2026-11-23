/**
 * 上班鼓励器 · 钱包 / 商城 / 背包
 * 与 dashboard.js 并存：这里只管新增的三个 tab，不碰原有统计逻辑。
 */

import {
  DEFAULT_CONFIG,
  resolveConfig,
  getCurrencyDecimals,
  formatMoney
} from "./lib/calc.js";
import { normalizeLang } from "./lib/i18n.js";
import {
  loadState,
  saveState,
  syncState,
  purchase,
  priceBaseOf,
  ownedCount,
  collection,
  balanceBase,
  inFlightBase,
  toDisplay,
  recentLedger,
  monthBase
} from "./lib/game.js";
import {
  CARD_DEFS,
  ITEM_DEFS,
  CARD_MAP,
  PACK,
  RARITY,
  RARITY_ORDER,
  formatNo,
  findDef
} from "./lib/cards.js";
import { normalizeState } from "./lib/wallet.js";
import { buildCollectionPoster, downloadBlob } from "./lib/share-card.js";

/* ---------------- 文案 ---------------- */

const T = {
  tabStats: { zh: "统计", en: "Stats" },
  tabWallet: { zh: "钱包", en: "Wallet" },
  tabShop: { zh: "商城", en: "Shop" },
  tabBag: { zh: "背包", en: "Bag" },

  wLabel: { zh: "钱包余额", en: "Wallet balance" },
  wSub: { zh: "已结算 {n} 天 · 只算到账的部分", en: "{n} days settled · settled only" },
  wMonthLabel: { zh: "本月已入账", en: "Settled this month" },
  wFloatLabel: { zh: "今日在途", en: "In flight today" },
  wSpentLabel: { zh: "已花掉", en: "Spent" },
  wLedgerTitle: { zh: "最近入账", en: "Recent settlements" },
  wLedgerTip: { zh: "共 {n} 天", en: "{n} days" },
  wEmpty: { zh: "还没有入账记录，明天 0 点后开始结算。", en: "No settlements yet — it starts after midnight." },

  sBalanceLabel: { zh: "可用余额", en: "Available" },
  sNote: { zh: "只能花已到账的钱，今日在途不计入", en: "Settled balance only — today's earnings don't count yet" },
  gPack: { zh: "卡包", en: "Card packs" },
  gCards: { zh: "单抽卡牌", en: "Single cards" },
  gSupply: { zh: "每日补给", en: "Daily supplies" },
  buy: { zh: "购买", en: "Buy" },
  packOnly: { zh: "仅卡包", en: "Pack only" },
  poor: { zh: "余额不够，再上两天班", en: "Not enough balance yet" },
  boughtItem: { zh: "已放进背包", en: "Added to your bag" },
  packTitle: { zh: "开包结果", en: "Pack opened" },
  packSub: { zh: "已全部放进背包", en: "All added to your bag" },
  packBuy: { zh: "开一包", en: "Open a pack" },
  owned: { zh: "已收藏 {n} 张", en: "{n} collected" },
  packOdds: { zh: "稀有度概率", en: "Rarity odds" },
  packPity: {
    zh: "同一稀有度内，每张卡等概率",
    en: "Cards within a rarity are equally likely"
  },

  saveTitle: { zh: "存档", en: "Save data" },
  saveTip: { zh: "只存在这台机器的浏览器里", en: "Lives in this browser only" },
  saveNote: {
    zh: "余额、背包、图鉴都在这一份 JSON 里。换电脑或重装扩展后导入即可复原，导入会覆盖当前进度。",
    en: "Balance, bag and collection all live in this one JSON file. Import it on another machine to restore them — importing overwrites the current progress."
  },
  saveExport: { zh: "导出存档", en: "Export" },
  saveImport: { zh: "导入存档", en: "Import" },
  saveExported: { zh: "存档已导出", en: "Save file exported" },
  saveImported: { zh: "存档已导入", en: "Save file imported" },
  saveBad: { zh: "这不是本扩展的存档文件", en: "That's not a Work Encourager save file" },
  saveConfirmTitle: { zh: "覆盖当前进度？", en: "Overwrite current progress?" },
  saveConfirmSub: {
    zh: "当前 {bal} · {cards} 张卡 · {items} 件道具　→　导入后 {nbal} · {ncards} 张卡 · {nitems} 件道具",
    en: "Now {bal} · {cards} cards · {items} items　→　after import {nbal} · {ncards} cards · {nitems} items"
  },
  saveConfirmBtn: { zh: "确认覆盖", en: "Overwrite" },
  saveCancel: { zh: "取消", en: "Cancel" },

  bagLabel: { zh: "图鉴", en: "Collection" },
  bagProgress: { zh: "{a} / {b} 张", en: "{a} / {b} cards" },
  chipAll: { zh: "全部", en: "All" },
  chipOwned: { zh: "已拥有", en: "Owned" },
  chipLocked: { zh: "未解锁", en: "Locked" },
  chipItems: { zh: "道具", en: "Items" },
  lockedHint: { zh: "还没抽到", en: "Not collected yet" },
  itemsEmpty: { zh: "还没有补给品", en: "No supplies yet" },
  itemQty: { zh: "×{n}", en: "×{n}" },

  shareBtn: { zh: "生成分享图", en: "Share card" },
  shareMaking: { zh: "正在生成…", en: "Generating…" },
  shareDone: { zh: "分享图已下载", en: "Share image downloaded" },
  shareFail: { zh: "生成失败，请重试", en: "Couldn't build the image" },
  shareTitle: { zh: "我的打工图鉴", en: "My Work Collection" },
  shareSub: { zh: "每一张，都是上过的班", en: "One card for every hour on the clock" },
  shareOwned: { zh: "已收集", en: "owned" },
  shareCards: { zh: "张卡", en: "cards" },
  shareRare: { zh: "史诗+", en: "epic+" },
  shareFoot: { zh: "上班鼓励器 · 打工图鉴", en: "Work Encourager · Collection" },
  shareFootSub: { zh: "生成于 {date}", en: "Generated on {date}" },

  detailTitle: { zh: "卡牌详情", en: "Card detail" },
  dNo: { zh: "编号", en: "Serial" },
  dCount: { zh: "拥有", en: "Owned" },
  dFirst: { zh: "首次获得", en: "First obtained" },
  dValue: { zh: "参考价", en: "Value" },
  dBagOnly: { zh: "只能从卡包开出", en: "Pack only" },
  unitDay: { zh: "天", en: "d" }
};

let config = { ...DEFAULT_CONFIG };
let state = null;
let bagFilter = "all";
let toastTimer = null;
/** 已校验、等用户确认覆盖的存档 */
let pendingSave = null;

const lang = () => normalizeLang(config.language);
const L = (key, vars) => {
  const entry = T[key] || { zh: key, en: key };
  let out = entry[lang()] ?? entry.zh ?? key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      out = out.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
    });
  }
  return out;
};
const pick = (obj) => (obj ? obj[lang()] || obj.zh || obj.en || "" : "");

const money = (base) =>
  formatMoney(toDisplay(base, config), config.currencySymbol, getCurrencyDecimals(config));

/** 流水逐条显示两位小数，避免「7 × ¥920 ≠ ¥6,437」的观感矛盾 */
const money2 = (base) => formatMoney(toDisplay(base, config), config.currencySymbol, 2);

const trimNum = (n) => String(Math.round((Number(n) || 0) * 100) / 100);
const daysText = (days) => `${trimNum(days)} ${L("unitDay")}`;
const priceLine = (def) => `${money(priceBaseOf(def.id, config))} · ${daysText(def.days)}`;

/* ---------------- DOM ---------------- */

const $ = (id) => document.getElementById(id);
const els = {
  tabbar: $("tabbar"),
  wLabel: $("wLabel"),
  wBalance: $("wBalance"),
  wSub: $("wSub"),
  wMonthLabel: $("wMonthLabel"),
  wMonth: $("wMonth"),
  wFloatLabel: $("wFloatLabel"),
  wFloat: $("wFloat"),
  wSpentLabel: $("wSpentLabel"),
  wSpent: $("wSpent"),
  wLedgerTitle: $("wLedgerTitle"),
  wLedgerTip: $("wLedgerTip"),
  wLedger: $("wLedger"),
  saveTitle: $("saveTitle"),
  saveTip: $("saveTip"),
  saveNote: $("saveNote"),
  saveExportBtn: $("saveExportBtn"),
  saveImportBtn: $("saveImportBtn"),
  saveFile: $("saveFile"),
  sBalanceLabel: $("sBalanceLabel"),
  sBalance: $("sBalance"),
  sNote: $("sNote"),
  gPack: $("gPack"),
  gCards: $("gCards"),
  gSupply: $("gSupply"),
  packCard: $("packCard"),
  goodsCards: $("goodsCards"),
  goodsSupply: $("goodsSupply"),
  bagLabel: $("bagLabel"),
  bagProgress: $("bagProgress"),
  bagChips: $("bagChips"),
  shareBtn: $("shareBtn"),
  cardWall: $("cardWall"),
  bagItems: $("bagItems"),
  modal: $("xmodal"),
  modalContent: $("xmodalContent"),
  modalClose: $("xmodalClose"),
  toast: $("toast")
};

/* ---------------- 卡面 ---------------- */

/** 卡面图形是裸 shape，必须包进 <svg> 才能渲染；带 img 的卡直接用位图 */
const artSVG = (def) =>
  def.img
    ? `<img class="art-img" src="${def.img}" alt="" draggable="false">`
    : `<svg viewBox="0 0 64 58" aria-hidden="true">${def.art}</svg>`;

function cardHTML(def, inst, count = 0) {
  const locked = !inst;
  const rarity = RARITY[def.rarity];
  return `<article class="xcard${locked ? " is-locked" : ""}" data-rarity="${def.rarity}" data-def="${def.id}">
    <div class="xcard-band"></div>
    <div class="xcard-body">
      <div class="xcard-top">
        <span class="xcard-no">${locked ? "No.????" : formatNo(inst.no)}</span>
        <span class="xcard-rarity">${def.rarity}</span>
      </div>
      <div class="xcard-art">${artSVG(def)}${count > 1 ? `<span class="xcard-count">×${count}</span>` : ""}</div>
      <div class="xcard-name">${locked ? "???" : pick(def.name)}</div>
      <div class="xcard-desc">${locked ? L("lockedHint") : pick(def.desc)}</div>
      <div class="xcard-foot">
        <span>${pick(rarity.label)}</span>
        <span>${locked ? "—" : daysText(def.days || 0)}</span>
      </div>
    </div>
  </article>`;
}

/** 同卡种取最新一张（编号最大的）作为展示实例 */
function latestInstance(defId) {
  let pickOne = null;
  state.inv.cards.forEach((c) => {
    if (c.def === defId && (!pickOne || c.no > pickOne.no)) pickOne = c;
  });
  return pickOne;
}

/* ---------------- 渲染：钱包 ---------------- */

function renderWallet() {
  const bal = balanceBase(state.wallet);
  const days = Object.keys(state.wallet.ledger).length;
  els.wLabel.textContent = L("wLabel");
  els.wBalance.textContent = money(bal);
  els.wSub.textContent = L("wSub", { n: days });

  els.wMonthLabel.textContent = L("wMonthLabel");
  els.wMonth.textContent = money(monthBase(state.wallet));
  els.wFloatLabel.textContent = L("wFloatLabel");
  els.wFloat.textContent = money(inFlightBase(config));
  els.wSpentLabel.textContent = L("wSpentLabel");
  els.wSpent.textContent = money(state.wallet.spentBase || 0);

  els.wLedgerTitle.textContent = L("wLedgerTitle");
  els.wLedgerTip.textContent = L("wLedgerTip", { n: days });

  els.saveTitle.textContent = L("saveTitle");
  els.saveTip.textContent = L("saveTip");
  els.saveNote.textContent = L("saveNote");
  els.saveExportBtn.textContent = L("saveExport");
  els.saveImportBtn.textContent = L("saveImport");

  const rows = recentLedger(state.wallet, 7);
  if (!rows.length) {
    els.wLedger.innerHTML = `<li class="ledger-empty">${L("wEmpty")}</li>`;
    return;
  }
  els.wLedger.innerHTML = rows
    .map(
      (r) => `<li>
        <span class="ledger-date">${r.key}</span>
        <span class="ledger-amount">+${money2(r.base)}</span>
      </li>`
    )
    .join("");
}

/* ---------------- 渲染：商城 ---------------- */

function balanceEnough(base) {
  return balanceBase(state.wallet) + 1e-6 >= base;
}

function renderShop() {
  const bal = balanceBase(state.wallet);
  els.sBalanceLabel.textContent = L("sBalanceLabel");
  els.sBalance.textContent = money(bal);
  els.sNote.textContent = L("sNote");

  els.gPack.textContent = L("gPack");
  els.gCards.textContent = L("gCards");
  els.gSupply.textContent = L("gSupply");

  const packPrice = priceBaseOf(PACK.id, config);
  const odds = RARITY_ORDER.map(
    (key) =>
      `<span class="odds"><i style="background:${RARITY[key].color}"></i>${key} ${RARITY[key].rate}%</span>`
  ).join("");
  els.packCard.innerHTML = `
    <div class="pack-art">${artSVG(CARD_MAP.donkey)}</div>
    <div class="pack-info">
      <div class="pack-name">${pick(PACK.name)}</div>
      <div class="pack-desc">${pick(PACK.desc)}</div>
      <div class="pack-price">${L("owned", { n: state.inv.cards.length })} · ${priceLine(PACK)}</div>
      <div class="pack-odds"><span class="odds-label">${L("packOdds")}</span>${odds}</div>
      <div class="pack-pity">${L("packPity")}</div>
    </div>
    <button class="buy-btn" data-buy="${PACK.id}" ${balanceEnough(packPrice) ? "" : "disabled"}>${L("packBuy")}</button>
  `;

  els.goodsCards.innerHTML = CARD_DEFS.map((def) => {
    const sellable = def.days > 0;
    const priceBase = sellable ? priceBaseOf(def.id, config) : 0;
    const count = ownedCount(state, def.id);
    const disabled = !sellable || !balanceEnough(priceBase);
    const action = sellable
      ? `<button class="buy-btn" data-buy="${def.id}" ${disabled ? "disabled" : ""}>${L("buy")}</button>`
      : `<button class="buy-btn" disabled>${L("packOnly")}</button>`;
    return `<div class="goods-card${sellable ? "" : " is-locked"}" data-rarity="${def.rarity}">
      <div class="goods-art">${artSVG(def)}</div>
      <div class="goods-main">
        <div class="goods-name"><span class="goods-rar">${def.rarity}</span>${pick(def.name)}${count ? ` ×${count}` : ""}</div>
        <div class="goods-desc">${pick(def.desc)}</div>
        <div class="goods-price">${sellable ? priceLine(def) : L("dBagOnly")}</div>
      </div>
      ${action}
    </div>`;
  }).join("");

  els.goodsSupply.innerHTML = ITEM_DEFS.map((def) => {
    const qty = state.inv.items[def.id] || 0;
    const priceBase = priceBaseOf(def.id, config);
    return `<div class="goods-card">
      <div class="goods-art">${artSVG(def)}</div>
      <div class="goods-main">
        <div class="goods-name">${pick(def.name)}${qty ? ` ×${qty}` : ""}</div>
        <div class="goods-desc">${pick(def.desc)}</div>
        <div class="goods-price">${priceLine(def)}</div>
      </div>
      <button class="buy-btn" data-buy="${def.id}" ${balanceEnough(priceBase) ? "" : "disabled"}>${L("buy")}</button>
    </div>`;
  }).join("");
}

/* ---------------- 渲染：背包 ---------------- */

function renderBag() {
  const prog = collection(state);
  els.bagLabel.textContent = L("bagLabel");
  els.bagProgress.textContent = L("bagProgress", { a: prog.owned, b: prog.total });
  if (els.shareBtn) els.shareBtn.textContent = L("shareBtn");

  const chips = [
    ["all", L("chipAll")],
    ["owned", L("chipOwned")],
    ["locked", L("chipLocked")],
    ["items", L("chipItems")]
  ];
  els.bagChips.innerHTML = chips
    .map(
      ([key, label]) =>
        `<button class="chip${bagFilter === key ? " is-active" : ""}" data-chip="${key}">${label}</button>`
    )
    .join("");

  const isItems = bagFilter === "items";
  els.cardWall.hidden = isItems;
  els.bagItems.hidden = !isItems;

  if (isItems) {
    const owned = ITEM_DEFS.filter((d) => (state.inv.items[d.id] || 0) > 0);
    els.bagItems.innerHTML = owned.length
      ? owned
          .map(
            (def) => `<div class="bag-item">
              <div class="goods-art">${artSVG(def)}</div>
              <div class="bag-item-name">${pick(def.name)}</div>
              <div class="bag-item-qty">${L("itemQty", { n: state.inv.items[def.id] })}</div>
            </div>`
          )
          .join("")
      : `<div class="ledger-empty">${L("itemsEmpty")}</div>`;
    return;
  }

  els.cardWall.innerHTML = CARD_DEFS.map((def) => {
    const inst = latestInstance(def.id);
    if (bagFilter === "owned" && !inst) return "";
    if (bagFilter === "locked" && inst) return "";
    return cardHTML(def, inst, inst ? ownedCount(state, def.id) : 0);
  }).join("");
}

function renderAll() {
  renderWallet();
  renderShop();
  renderBag();
  els.tabbar.querySelectorAll(".tab").forEach((btn) => {
    const key = `tab${btn.dataset.tab.charAt(0).toUpperCase()}${btn.dataset.tab.slice(1)}`;
    btn.textContent = L(key);
  });
}

/* ---------------- 弹层 / 提示 ---------------- */

function openModal(html) {
  els.modalContent.innerHTML = html;
  els.modal.hidden = false;
}
function closeModal() {
  els.modal.hidden = true;
  pendingSave = null;
}

function toast(msg, isError = false) {
  els.toast.textContent = msg;
  els.toast.classList.toggle("is-error", !!isError);
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 1800);
}

function showReveal(cards) {
  const html = `
    <div class="xmodal-title">${L("packTitle")}</div>
    <div class="xmodal-sub">${L("packSub")}</div>
    <div class="reveal-row">
      ${cards.map((c) => cardHTML(CARD_MAP[c.def], c)).join("")}
    </div>`;
  openModal(html);
}

function showCardDetail(defId) {
  const def = findDef(defId);
  if (!def || !CARD_MAP[defId]) return;
  const inst = latestInstance(defId);
  if (!inst) return;
  const count = ownedCount(state, defId);
  const date = new Date(inst.at);
  const html = `
    <div class="xmodal-title">${pick(def.name)}</div>
    <div class="xmodal-sub">${pick(def.desc)}</div>
    <div class="reveal-row" style="grid-template-columns: 180px 1fr; align-items:start">
      ${cardHTML(def, inst, count)}
      <ul class="ledger-list" style="margin:0">
        <li><span class="ledger-date">${L("dNo")}</span><span class="ledger-amount">${formatNo(inst.no)}</span></li>
        <li><span class="ledger-date">${L("dCount")}</span><span class="ledger-amount">${L("itemQty", { n: count })}</span></li>
        <li><span class="ledger-date">${L("dFirst")}</span><span class="ledger-amount">${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}</span></li>
        <li><span class="ledger-date">${L("dValue")}</span><span class="ledger-amount">${def.days > 0 ? priceLine(def) : L("dBagOnly")}</span></li>
      </ul>
    </div>`;
  openModal(html);
}

/* ---------------- 存档 ---------------- */

const itemCount = (s) =>
  Object.values(s.inv.items || {}).reduce((n, v) => n + (Number(v) || 0), 0);

/** 生成图鉴长图并下载 */
async function shareCollection() {
  if (!els.shareBtn) return;
  const btn = els.shareBtn;
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = L("shareMaking");
  try {
    const ownedSet = new Set(state.inv.cards.map((c) => c.def));
    const ownedNo = {};
    state.inv.cards.forEach((c) => {
      ownedNo[c.def] = (ownedNo[c.def] || 0) + 1;
    });
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const prefix = lang() === "zh" ? "上班鼓励器_图鉴_" : "work-encourager-collection_";
    const blob = await buildCollectionPoster({
      defs: CARD_DEFS,
      owned: ownedSet,
      ownedNo,
      nameOf: (def) => pick(def.name),
      text: {
        title: L("shareTitle"),
        sub: L("shareSub"),
        statOwned: L("shareOwned"),
        statCards: L("shareCards"),
        statRare: L("shareRare"),
        foot: L("shareFoot"),
        footSub: L("shareFootSub", { date: dateStr }),
        locked: L("lockedHint")
      }
    });
    downloadBlob(blob, `${prefix}${dateStr}.png`);
    toast(L("shareDone"));
  } catch (err) {
    toast(L("shareFail"), true);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function saveFileName() {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `work-encourager-wallet-${stamp}.json`;
}

function exportSave() {
  const payload = {
    app: "work-encourager",
    kind: "wallet-state",
    version: 1,
    exportedAt: new Date().toISOString(),
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = saveFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast(L("saveExported"));
}

/** 解析 + 校验；不认识的文件只报错，不弹确认框 */
function readSave(raw) {
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }
  const incoming = data && typeof data === "object" ? data.state || data.game || data : null;
  if (!incoming || !incoming.wallet || !incoming.inv || !Array.isArray(incoming.inv.cards)) {
    toast(L("saveBad"), true);
    return;
  }
  pendingSave = normalizeState(incoming);
  const vars = {
    bal: money(balanceBase(state.wallet)),
    cards: state.inv.cards.length,
    items: itemCount(state),
    nbal: money(balanceBase(pendingSave.wallet)),
    ncards: pendingSave.inv.cards.length,
    nitems: itemCount(pendingSave)
  };
  openModal(`
    <div class="xmodal-title">${L("saveConfirmTitle")}</div>
    <div class="xmodal-sub">${L("saveConfirmSub", vars)}</div>
    <div class="save-confirm">
      <button class="btn btn-ghost" data-close="1">${L("saveCancel")}</button>
      <button class="btn btn-primary" data-apply-save="1">${L("saveConfirmBtn")}</button>
    </div>`);
}

async function applyPendingSave() {
  if (!pendingSave) return;
  state = pendingSave;
  pendingSave = null;
  await saveState(state);
  renderAll();
  closeModal();
  toast(L("saveImported"));
}

/* ---------------- 交互 ---------------- */

async function doBuy(id, btn) {
  if (btn) btn.disabled = true;
  const res = purchase(state, config, id);
  if (!res.ok) {
    if (btn) btn.disabled = false;
    toast(L("poor"), true);
    return;
  }
  await saveState(state);
  renderAll();
  if (res.cards && res.cards.length) showReveal(res.cards);
  else toast(L("boughtItem"));
}

function switchTab(name) {
  els.tabbar.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
  document.querySelectorAll(".tabpanel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  if (history.replaceState) history.replaceState(null, "", `#${name}`);
}

/* ---------------- 启动 ---------------- */

async function init() {
  config = resolveConfig(await chrome.storage.sync.get(null));
  const synced = await syncState(config);
  state = synced.state;
  if (!state.wallet.spentBase) state.wallet.spentBase = 0;
  renderAll();

  const initial = (location.hash || "").replace("#", "");
  if (["stats", "wallet", "shop", "bag"].includes(initial)) switchTab(initial);

  els.tabbar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  document.addEventListener("click", async (e) => {
    const buyBtn = e.target.closest("[data-buy]");
    if (buyBtn) {
      e.preventDefault();
      await doBuy(buyBtn.dataset.buy, buyBtn);
      return;
    }
    const chip = e.target.closest("[data-chip]");
    if (chip) {
      bagFilter = chip.dataset.chip;
      renderBag();
      return;
    }
    const card = e.target.closest(".xcard");
    if (card && !card.closest(".xmodal") && !card.classList.contains("is-locked")) {
      showCardDetail(card.dataset.def);
      return;
    }
    if (e.target.closest("[data-apply-save]")) {
      applyPendingSave();
      return;
    }
    if (e.target.dataset.close || e.target === els.modalClose) closeModal();
  });

  if (els.shareBtn) els.shareBtn.addEventListener("click", shareCollection);
  els.saveExportBtn.addEventListener("click", exportSave);
  els.saveImportBtn.addEventListener("click", () => els.saveFile.click());
  els.saveFile.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => readSave(String(reader.result || ""));
    reader.readAsText(file);
    e.target.value = "";
  });

  els.modalClose.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === "sync") {
      config = resolveConfig(await chrome.storage.sync.get(null));
      renderAll();
    }
    if (area === "local" && changes.game) {
      state = await loadState();
      renderAll();
    }
  });

  setInterval(async () => {
    const synced2 = await syncState(config);
    if (synced2.result.days > 0) {
      state = synced2.state;
      renderAll();
    } else {
      renderWallet();
      els.wFloat.textContent = money(inFlightBase(config));
    }
  }, 60000);
}

init();
