/**
 * 上班鼓励器 · 图鉴分享长图
 * 用 canvas 把 24 张卡画成一张竖版海报，供小红书等平台分享。
 * 卡面是无外部依赖的内联 SVG，转 data URI 后即可 drawImage。
 *
 * 只依赖传入参数，不碰存储与 DOM（下载除外）。
 */

import { RARITY } from "./cards.js";

const W = 720;
const PAD = 28;
const COLS = 6;

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** 内联 SVG 裸 shape → 可绘制的 Image */
function svgToImage(markup) {
  return new Promise((resolve, reject) => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 58" ` +
      `width="128" height="116">${markup || ""}</svg>`;
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("svg decode failed"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function loadArt(def) {
  if (def.img) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = def.img;
    });
  }
  return svgToImage(def.art).catch(() => null);
}

/**
 * 生成海报 Blob。
 * @param {object} opts
 * @param {Array}  opts.defs        CARD_DEFS
 * @param {Set|Array} opts.owned    已解锁的 def id 集合
 * @param {object} opts.ownedNo     { [defId]: 数量 }
 * @param {Function} opts.nameOf    (def) => 展示名
 * @param {object} opts.text        { title, sub, statCards, statOwned, statRare, foot, locked, countSuffix }
 */
export async function buildCollectionPoster(opts) {
  const {
    defs = [],
    owned = [],
    ownedNo = {},
    nameOf = (d) => d.id,
    text = {}
  } = opts;
  const ownedSet = owned instanceof Set ? owned : new Set(owned);

  const rows = Math.ceil(defs.length / COLS);
  const cellW = (W - PAD * 2) / COLS;
  const cardW = cellW - 8;
  const cardH = cardW * 1.18;
  const headerH = 168;
  const statH = 84;
  const gridTop = headerH + statH;
  const gridH = rows * (cardH + 12);
  const footH = 92;
  const H = Math.ceil(gridTop + gridH + 22 + footH);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#FDFDFC";
  ctx.fillRect(0, 0, W, H);

  // 顶部暖色渐变
  const grad = ctx.createLinearGradient(0, 0, 0, headerH);
  grad.addColorStop(0, "#fffdf8");
  grad.addColorStop(1, "#f6ead6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = "#e8dcc4";
  ctx.fillRect(0, headerH - 1, W, 1);

  // 标题
  ctx.textAlign = "center";
  ctx.fillStyle = "#333333";
  ctx.font = "700 34px -apple-system, 'PingFang SC', sans-serif";
  ctx.fillText(text.title || "Collection", W / 2, 66);
  ctx.fillStyle = "#8a7f6d";
  ctx.font = "400 16px -apple-system, 'PingFang SC', sans-serif";
  ctx.fillText(text.sub || "", W / 2, 98);

  // 三个数字
  const rareCount = defs.filter(
    (d) => ownedSet.has(d.id) && (d.rarity === "SR" || d.rarity === "SSR")
  ).length;
  const stats = [
    [String(ownedSet.size), text.statOwned || "owned"],
    [String(rareCount), text.statRare || "epic+"],
    [String(defs.length), text.statCards || "total"]
  ];
  const sw = W / stats.length;
  stats.forEach(([num, label], i) => {
    const cx = sw * i + sw / 2;
    ctx.fillStyle = "#333333";
    ctx.font = "700 26px -apple-system, sans-serif";
    ctx.fillText(num, cx, headerH - 42);
    ctx.fillStyle = "#a89c89";
    ctx.font = "400 12px -apple-system, 'PingFang SC', sans-serif";
    ctx.fillText(label, cx, headerH - 22);
  });

  // 全部卡面并行解码
  const arts = await Promise.all(defs.map(loadArt));

  defs.forEach((def, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + 4 + col * cellW;
    const y = gridTop + row * (cardH + 12);
    const has = ownedSet.has(def.id);
    const rar = RARITY[def.rarity] || RARITY.N;
    const band = has ? rar.band : "#F5F5F3";
    const line = has ? rar.color : "#E4E4E1";

    // 卡底
    ctx.fillStyle = band;
    roundRect(ctx, x, y, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 顶部稀有度条
    ctx.save();
    roundRect(ctx, x, y, cardW, cardH, 8);
    ctx.clip();
    ctx.fillStyle = has ? rar.color : "#DCDCD8";
    ctx.fillRect(x, y, cardW, 4);
    ctx.restore();

    // 卡面
    const art = arts[i];
    if (has && art) {
      const aw = cardW * 0.66;
      const ah = aw * (art.naturalHeight / art.naturalWidth || 58 / 64);
      ctx.drawImage(art, x + (cardW - aw) / 2, y + 12, aw, ah);
    } else if (has) {
      ctx.fillStyle = "#C9C9C4";
      ctx.font = "700 30px -apple-system, sans-serif";
      ctx.fillText("?", x + cardW / 2, y + cardH * 0.55);
    } else {
      ctx.fillStyle = "#CFCFCB";
      ctx.font = "700 28px -apple-system, sans-serif";
      ctx.fillText("?", x + cardW / 2, y + cardH * 0.55);
    }

    // 名称
    ctx.fillStyle = has ? "#333333" : "#BEBEB9";
    ctx.font = "500 10px -apple-system, 'PingFang SC', sans-serif";
    const nm = has ? nameOf(def) : text.locked || "???";
    const maxW = cardW - 8;
    let label = nm;
    while (ctx.measureText(label).width > maxW && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== nm) label = label.slice(0, -1) + "…";
    ctx.fillText(label, x + cardW / 2, y + cardH - 15);

    // 拥有数量
    const cnt = ownedNo[def.id] || 0;
    if (cnt > 1) {
      ctx.fillStyle = "#8a7f6d";
      ctx.font = "700 9px -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`×${cnt}`, x + cardW - 6, y + 15);
      ctx.textAlign = "center";
    }
  });

  // 页脚
  const footY = H - footH + 26;
  ctx.fillStyle = "#e8dcc4";
  ctx.fillRect(PAD, footY - 16, W - PAD * 2, 1);
  ctx.fillStyle = "#8a7f6d";
  ctx.font = "500 13px -apple-system, 'PingFang SC', sans-serif";
  ctx.fillText(text.foot || "Work Encourager", W / 2, footY + 12);
  ctx.fillStyle = "#B9B0A0";
  ctx.font = "400 11px -apple-system, sans-serif";
  ctx.fillText(text.footSub || "", W / 2, footY + 34);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

/** 触发下载 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
