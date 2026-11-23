/**
 * 上班鼓励器 · 收藏卡牌与商品定义
 *
 * 卡面不用图片：全部由内联 SVG 程序化生成，零静态素材、天然支持双语。
 * 价格一律用「日薪倍数」表示，运行时 × getDailyWage() —— 月薪 3k 和 3w 都能玩。
 */

export const RARITY = {
  N: { label: { zh: "普通", en: "Common" }, rate: 60, color: "#B4B2A9", band: "#F1EFE8", text: "#444441", frag: 1 },
  R: { label: { zh: "稀有", en: "Rare" }, rate: 28, color: "#85B7EB", band: "#E6F1FB", text: "#0C447C", frag: 3 },
  SR: { label: { zh: "史诗", en: "Epic" }, rate: 10, color: "#7F77DD", band: "#EEEDFE", text: "#26215C", frag: 8 },
  SSR: { label: { zh: "传说", en: "Legend" }, rate: 2, color: "#EF9F27", band: "#FAEEDA", text: "#633806", frag: 20 }
};

export const RARITY_ORDER = ["N", "R", "SR", "SSR"];

/* ---------------- 卡牌 ---------------- */

export const CARD_DEFS = [
  {
    id: "coffee", rarity: "N", days: 0.02,
    name: { zh: "续命美式", en: "Survival Americano" },
    desc: { zh: "第三杯开始才有效", en: "Only the third cup counts" },
    art: `<rect x="16" y="20" width="28" height="24" rx="4" fill="#efe7dd" stroke="#8b7f70" stroke-width="1"/>
      <path d="M44 25h4a4 4 0 0 1 0 9h-4" fill="none" stroke="#8b7f70" stroke-width="1"/>
      <path d="M22 14v-4M30 14v-5M38 14v-4" stroke="#c3b6a5" stroke-width="1.3" stroke-linecap="round"/>
      <rect x="20" y="26" width="20" height="5" rx="2.5" fill="#c9a27b" opacity="0.7"/>`
  },
  {
    id: "plant", rarity: "N", days: 0.03,
    name: { zh: "工位绿萝", en: "Desk Pothos" },
    desc: { zh: "它比你活得久", en: "It will outlast your tenure" },
    art: `<path d="M32 40V24" stroke="#7a8b5a" stroke-width="2"/>
      <ellipse cx="22" cy="26" rx="9" ry="6" fill="#9dbb7a" transform="rotate(-20 22 26)"/>
      <ellipse cx="42" cy="24" rx="9" ry="6" fill="#7fa35f" transform="rotate(18 42 24)"/>
      <ellipse cx="32" cy="18" rx="8" ry="6" fill="#b3cc90"/>
      <path d="M22 40h20l-3 10H25z" fill="#c98b62"/>`
  },
  {
    id: "elevator", rarity: "N", days: 0.02,
    name: { zh: "电梯先按党", en: "Elevator Pre-presser" },
    desc: { zh: "永远比你先按到", en: "Always presses before you" },
    art: `<rect x="18" y="10" width="28" height="38" rx="3" fill="#eef1f6" stroke="#8a94a6" stroke-width="1"/>
      <line x1="32" y1="12" x2="32" y2="46" stroke="#c3cad6" stroke-width="1"/>
      <path d="M26 26v-6h3l-4-5-4 5h3v6z" fill="#6b7688"/>
      <circle cx="41" cy="34" r="2" fill="#8a94a6"/>`
  },
  {
    id: "water", rarity: "N", days: 0.03,
    name: { zh: "饮水机社交", en: "Water-cooler Chat" },
    desc: { zh: "一天唯一一次出门", en: "Your only trip outside" },
    art: `<rect x="22" y="8" width="20" height="16" rx="3" fill="#cfe3f2" stroke="#6f8fa8" stroke-width="1"/>
      <rect x="18" y="24" width="28" height="22" rx="3" fill="#eef2f6" stroke="#8a94a6" stroke-width="1"/>
      <rect x="24" y="30" width="6" height="4" rx="1" fill="#6f8fa8"/>
      <circle cx="38" cy="40" r="3" fill="#bcd6e8"/>`
  },
  {
    id: "badge", rarity: "N", days: 0.02,
    name: { zh: "工牌毛边", en: "Frayed Badge" },
    desc: { zh: "挂绳比你更像老员工", en: "The lanyard has seniority" },
    art: `<rect x="20" y="12" width="24" height="34" rx="3" fill="#f2f4f7" stroke="#8a94a6" stroke-width="1"/>
      <rect x="26" y="6" width="12" height="6" rx="2" fill="#9aa5b6"/>
      <circle cx="32" cy="25" r="5.5" fill="#c9d6e0" stroke="#8a94a6" stroke-width="1"/>
      <line x1="25" y1="35" x2="39" y2="35" stroke="#b3bccb" stroke-width="1.6"/>
      <line x1="27" y1="40" x2="37" y2="40" stroke="#d0d6e0" stroke-width="1.6"/>`
  },
  {
    id: "mouse", rarity: "N", days: 0.02,
    name: { zh: "无名鼠标", en: "Unnamed Mouse" },
    desc: { zh: "左键已经不回弹了", en: "The left click gave up" },
    art: `<path d="M32 12c-7 0-12 6-12 14v10c0 7 5 12 12 12s12-5 12-12V26c0-8-5-14-12-14z" fill="#e9edf2" stroke="#7d8494" stroke-width="1"/>
      <line x1="32" y1="14" x2="32" y2="26" stroke="#7d8494" stroke-width="1"/>
      <rect x="30" y="20" width="4" height="7" rx="2" fill="#b6bccb"/>`
  },
  {
    id: "cupnoodle", rarity: "N", days: 0.03,
    name: { zh: "加班泡面", en: "Overtime Noodles" },
    desc: { zh: "第三顿还是它", en: "Third meal, same bowl" },
    art: `<path d="M20 22h24l-3 26H23z" fill="#f3ece1" stroke="#a08e76" stroke-width="1"/>
      <rect x="18" y="17" width="28" height="6" rx="2" fill="#e2d6c4" stroke="#a08e76" stroke-width="1"/>
      <path d="M23 30h18M24 36h16M25 42h14" stroke="#d5c5ae" stroke-width="1.4"/>
      <path d="M28 12c0-3 2-4 2-7M36 12c0-3 2-4 2-7" stroke="#c3b6a5" stroke-width="1.3" stroke-linecap="round"/>`
  },
  {
    id: "slippers", rarity: "N", days: 0.03,
    name: { zh: "工位拖鞋", en: "Desk Slippers" },
    desc: { zh: "在办公室穿出居家感", en: "Home comfort, office hours" },
    art: `<rect x="14" y="34" width="18" height="12" rx="6" fill="#f2dfe4" stroke="#a87f8c" stroke-width="1"/>
      <path d="M18 34v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#a87f8c" stroke-width="1"/>
      <rect x="33" y="24" width="17" height="11" rx="5.5" fill="#e8cfd8" stroke="#a87f8c" stroke-width="1"/>
      <path d="M37 24v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#a87f8c" stroke-width="1"/>`
  },
  {
    id: "clock", rarity: "N", days: 0.02,
    name: { zh: "慢三分钟的钟", en: "Slow Clock" },
    desc: { zh: "永远比你早下班", en: "It clocks out before you" },
    art: `<circle cx="32" cy="30" r="17" fill="#f4f6f9" stroke="#8a94a6" stroke-width="1.4"/>
      <circle cx="32" cy="30" r="2" fill="#6b7688"/>
      <line x1="32" y1="30" x2="32" y2="19" stroke="#6b7688" stroke-width="2" stroke-linecap="round"/>
      <line x1="32" y1="30" x2="41" y2="34" stroke="#8a94a6" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="29" y="6" width="6" height="4" rx="1" fill="#b3bccb"/>`
  },
  {
    id: "sticky", rarity: "R", days: 0.15,
    name: { zh: "便利贴咒语", en: "Sticky-note Spell" },
    desc: { zh: "写着「今天一定下班」", en: "Says: leaving on time today" },
    art: `<rect x="16" y="12" width="32" height="32" rx="2" fill="#fbe9a8" stroke="#c9a227" stroke-width="1"/>
      <path d="M48 32l-8 8v-8z" fill="#f3d97c"/>
      <line x1="22" y1="22" x2="42" y2="22" stroke="#a8871a" stroke-width="1.4"/>
      <line x1="22" y1="28" x2="38" y2="28" stroke="#a8871a" stroke-width="1.4"/>`
  },
  {
    id: "lunch", rarity: "R", days: 0.2,
    name: { zh: "12 点整的饭搭子", en: "Noon Lunch Buddy" },
    desc: { zh: "11:55 就开始问吃什么", en: "Asks what to eat at 11:55" },
    art: `<rect x="14" y="20" width="36" height="22" rx="4" fill="#e8eef2" stroke="#7d8c99" stroke-width="1"/>
      <rect x="18" y="24" width="12" height="14" rx="2" fill="#f2c88a"/>
      <rect x="34" y="24" width="12" height="14" rx="2" fill="#a9c98a"/>
      <line x1="14" y1="20" x2="50" y2="20" stroke="#7d8c99" stroke-width="1.6"/>`
  },
  {
    id: "paycheck", rarity: "R", days: 0.3,
    name: { zh: "发薪日", en: "Payday" },
    desc: { zh: "到账三小时后只剩一半", en: "Half gone three hours later" },
    art: `<rect x="14" y="16" width="36" height="24" rx="3" fill="#e6f1fb" stroke="#4d7ea8" stroke-width="1"/>
      <circle cx="32" cy="28" r="7" fill="#b9d5ea" stroke="#4d7ea8" stroke-width="1"/>
      <text x="32" y="32" text-anchor="middle" font-size="9" fill="#2f5d80">¥</text>`
  },
  {
    id: "umbrella", rarity: "R", days: 0.12,
    name: { zh: "共享雨伞", en: "Shared Umbrella" },
    desc: { zh: "还回来时永远少一根骨", en: "Always one rib short" },
    art: `<path d="M12 28a20 20 0 0 1 40 0z" fill="#cfe0ee" stroke="#5f7d94" stroke-width="1"/>
      <path d="M12 28c3-4 7-4 10 0 3-4 7-4 10 0 3-4 7-4 10 0" fill="none" stroke="#5f7d94" stroke-width="1"/>
      <line x1="32" y1="28" x2="32" y2="46" stroke="#7d8c99" stroke-width="1.6"/>
      <path d="M32 46a4 4 0 0 1-8 0" fill="none" stroke="#7d8c99" stroke-width="1.6" stroke-linecap="round"/>`
  },
  {
    id: "snackdrawer", rarity: "R", days: 0.16,
    name: { zh: "零食抽屉", en: "Snack Drawer" },
    desc: { zh: "第三层永远有惊喜", en: "The third drawer never fails" },
    art: `<rect x="14" y="18" width="36" height="26" rx="3" fill="#efe4d6" stroke="#9a8368" stroke-width="1"/>
      <line x1="14" y1="31" x2="50" y2="31" stroke="#9a8368" stroke-width="1"/>
      <rect x="28" y="22" width="12" height="3" rx="1.5" fill="#c2ac93"/>
      <rect x="28" y="35" width="12" height="3" rx="1.5" fill="#c2ac93"/>
      <circle cx="45" cy="13" r="3.2" fill="#e8b04b" stroke="#a87a22" stroke-width="1"/>`
  },
  {
    id: "cake", rarity: "R", days: 0.18,
    name: { zh: "团队蛋糕", en: "Team Cake" },
    desc: { zh: "全组唯一准时的福利", en: "The only thing on time" },
    art: `<rect x="15" y="31" width="34" height="17" rx="3" fill="#f7e6da" stroke="#a37b62" stroke-width="1"/>
      <path d="M15 38h34M15 44h34" stroke="#e6cdbf" stroke-width="1.2"/>
      <rect x="30.5" y="20" width="3" height="11" fill="#e8c07a"/>
      <ellipse cx="32" cy="18" rx="2.6" ry="3.6" fill="#f2b13c"/>
      <circle cx="22" cy="26" r="2.1" fill="#d96a6a"/>
      <circle cx="42" cy="26" r="2.1" fill="#d96a6a"/>`
  },
  {
    id: "headphone", rarity: "R", days: 0.22,
    name: { zh: "降噪耳机", en: "ANC Headphones" },
    desc: { zh: "不是听歌，是不想听见", en: "Not music — silence from them" },
    art: `<path d="M16 32v-4a16 16 0 0 1 32 0v4" fill="none" stroke="#7d8494" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="11" y="30" width="9" height="16" rx="4" fill="#dfe4ec" stroke="#7d8494" stroke-width="1"/>
      <rect x="44" y="30" width="9" height="16" rx="4" fill="#dfe4ec" stroke="#7d8494" stroke-width="1"/>`
  },
  {
    id: "printer", rarity: "SR", days: 0.5,
    name: { zh: "卡纸之神", en: "Paper Jam Deity" },
    desc: { zh: "每个双面都卡在 3 点", en: "Jams at 3pm, every duplex" },
    art: `<rect x="15" y="12" width="34" height="10" rx="2" fill="#eee9f7" stroke="#6a5fa8" stroke-width="1"/>
      <rect x="11" y="22" width="42" height="16" rx="3" fill="#cec7e8" stroke="#6a5fa8" stroke-width="1"/>
      <rect x="22" y="33" width="20" height="12" rx="1" fill="#fff" stroke="#6a5fa8" stroke-width="1"/>
      <circle cx="47" cy="27" r="2" fill="#6a5fa8"/>`
  },
  {
    id: "meeting", rarity: "SR", days: 0.6,
    name: { zh: "会而不议", en: "Meeting Without End" },
    desc: { zh: "一小时，零个决定", en: "One hour, zero decisions" },
    art: `<ellipse cx="32" cy="36" rx="18" ry="6" fill="#dfe6ec" stroke="#7d8c99" stroke-width="1"/>
      <circle cx="20" cy="22" r="5" fill="#c9d6e0" stroke="#7d8c99" stroke-width="1"/>
      <circle cx="32" cy="19" r="5" fill="#c9d6e0" stroke="#7d8c99" stroke-width="1"/>
      <circle cx="44" cy="22" r="5" fill="#c9d6e0" stroke="#7d8c99" stroke-width="1"/>`
  },
  {
    id: "overtime", rarity: "SR", days: 0.8,
    name: { zh: "加班妖怪", en: "Overtime Ghost" },
    desc: { zh: "只在 20:00 后出现", en: "Only appears after 20:00" },
    art: `<path d="M20 44V28a12 12 0 0 1 24 0v16l-4-3-4 3-4-3-4 3-4-3z" fill="#dcd6f2" stroke="#6a5fa8" stroke-width="1"/>
      <circle cx="27" cy="27" r="2" fill="#4a4370"/>
      <circle cx="37" cy="27" r="2" fill="#4a4370"/>
      <path d="M28 34q4 3 8 0" stroke="#4a4370" fill="none" stroke-width="1.2"/>`
  },
  {
    id: "deadline", rarity: "SR", days: 0.45,
    name: { zh: "死线倒计时", en: "Deadline Clock" },
    desc: { zh: "数字在闪，人在发呆", en: "The numbers blink, you blank" },
    art: `<rect x="13" y="13" width="38" height="30" rx="3" fill="#f7e8e8" stroke="#a85c5c" stroke-width="1"/>
      <text x="32" y="34" text-anchor="middle" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#a85c5c">23:59</text>
      <rect x="26" y="46" width="12" height="3" rx="1.5" fill="#c9a2a2"/>`
  },
  {
    id: "whiteboard", rarity: "SR", days: 0.7,
    name: { zh: "白板战略", en: "Whiteboard Strategy" },
    desc: { zh: "画了三小时，擦了三十秒", en: "Three hours drawn, thirty seconds erased" },
    art: `<rect x="10" y="11" width="44" height="31" rx="2" fill="#fff" stroke="#9aa5b6" stroke-width="1.4"/>
      <path d="M16 36l6-8 6 5 6-11 8 14" fill="none" stroke="#4d7ea8" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="21" cy="19" r="2.6" fill="#e8b04b"/>
      <path d="M24 47h16" stroke="#9aa5b6" stroke-width="2" stroke-linecap="round"/>`
  },
  {
    id: "donkey", rarity: "SSR", days: null,
    name: { zh: "拉磨的驴", en: "The Mill Donkey" },
    desc: { zh: "它已经跑到 17:45 那一圈", en: "It's already on the 17:45 lap" },
    art: `<ellipse cx="15.4" cy="13.6" rx="3.9" ry="11.8" fill="#8b8076" stroke="#4f453c" stroke-width="1" transform="rotate(-20 15.4 13.6)"/>
      <ellipse cx="48.6" cy="13.6" rx="3.9" ry="11.8" fill="#8b8076" stroke="#4f453c" stroke-width="1" transform="rotate(20 48.6 13.6)"/>
      <ellipse cx="16.4" cy="14.6" rx="1.5" ry="7" fill="#b9ada2" transform="rotate(-20 16.4 14.6)"/>
      <ellipse cx="47.6" cy="14.6" rx="1.5" ry="7" fill="#b9ada2" transform="rotate(20 47.6 14.6)"/>
      <path d="M26 19.5l-1.4-5.2M30 18.2l-0.4-6M34 18.2l0.6-6M38 19.5l1.6-5" stroke="#3d342d" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="32.5" rx="10.5" ry="15.2" fill="#9c9086" stroke="#4f453c" stroke-width="1"/>
      <ellipse cx="32" cy="41.4" rx="7.2" ry="6" fill="#cbbfb4"/>
      <ellipse cx="28.8" cy="38.6" rx="1.1" ry="1.5" fill="#a5968a"/>
      <ellipse cx="35.2" cy="38.6" rx="1.1" ry="1.5" fill="#a5968a"/>
      <path d="M27 42.4a5 3.8 0 0 0 10 0z" fill="#6b3f2e"/>
      <rect x="29.2" y="42.3" width="2.2" height="2.4" rx="0.5" fill="#fffaf0"/>
      <rect x="32.6" y="42.3" width="2.2" height="2.4" rx="0.5" fill="#fffaf0"/>
      <ellipse cx="26.2" cy="27.6" rx="2.7" ry="2.5" fill="#fffdf8" stroke="#4f453c" stroke-width="0.5"/>
      <circle cx="26.5" cy="27.9" r="1.4" fill="#5c3f2b"/>
      <circle cx="26.9" cy="27.4" r="0.45" fill="#fff"/>
      <ellipse cx="37.8" cy="27.6" rx="2.7" ry="2.5" fill="#fffdf8" stroke="#4f453c" stroke-width="0.5"/>
      <circle cx="38.1" cy="27.9" r="1.4" fill="#5c3f2b"/>
      <circle cx="38.5" cy="27.4" r="0.45" fill="#fff"/>`
  },
  {
    id: "kpi", rarity: "SSR", days: null,
    name: { zh: "KPI 涨停板", en: "KPI Bull Run" },
    desc: { zh: "领导说再涨 30%", en: "Boss says +30% more" },
    art: `<rect x="16" y="32" width="7" height="12" rx="1" fill="#FAC775"/>
      <rect x="27" y="26" width="7" height="18" rx="1" fill="#EF9F27"/>
      <rect x="38" y="18" width="7" height="26" rx="1" fill="#BA7517"/>
      <path d="M16 22l10-5 8 6 12-10" fill="none" stroke="#854F0B" stroke-width="1.8" stroke-linecap="round"/>`
  },
  {
    id: "bell", rarity: "SSR", days: null,
    name: { zh: "六点的钟", en: "The Six O'Clock Bell" },
    desc: { zh: "响的那一秒，全楼复活", en: "One ring, the whole floor revives" },
    art: `<path d="M32 12c-8 0-13 6-13 14v9l-4 5h34l-4-5v-9c0-8-5-14-13-14z" fill="#FAC775" stroke="#854F0B" stroke-width="1.2"/>
      <path d="M27 40a5 5 0 0 0 10 0" fill="#EF9F27" stroke="#854F0B" stroke-width="1.2"/>
      <rect x="29" y="7" width="6" height="5" rx="2" fill="#BA7517"/>
      <path d="M14 21l-4-3M50 21l4-3" stroke="#BA7517" stroke-width="1.7" stroke-linecap="round"/>`
  }
];

/* ---------------- 道具（纯装饰，进背包不进图鉴） ---------------- */

export const ITEM_DEFS = [
  {
    id: "chair", days: 0.02,
    name: { zh: "摸鱼椅", en: "Slack-off Chair" },
    desc: { zh: "躺着也算上班", en: "Lying down counts as work" },
    art: `<path d="M24 12h16v18H24z" fill="#d9c6b0" stroke="#8b7a63" stroke-width="1"/>
      <rect x="20" y="30" width="24" height="6" rx="3" fill="#c2ad93" stroke="#8b7a63" stroke-width="1"/>
      <path d="M26 36v12M38 36v12" stroke="#8b7a63" stroke-width="2" stroke-linecap="round"/>`
  },
  {
    id: "waist", days: 0.05,
    name: { zh: "护腰靠垫", en: "Lumbar Cushion" },
    desc: { zh: "腰椎的最后一道防线", en: "Last defense of your spine" },
    art: `<rect x="18" y="16" width="28" height="24" rx="7" fill="#cfe0d2" stroke="#6f8f74" stroke-width="1"/>
      <path d="M32 22v12M26 28h12" stroke="#6f8f74" stroke-width="1.4"/>`
  },
  {
    id: "keyboard", days: 0.08,
    name: { zh: "猫爪键盘", en: "Cat-paw Keyboard" },
    desc: { zh: "敲起来像在揉猫", en: "Types like petting a cat" },
    art: `<rect x="12" y="22" width="40" height="20" rx="4" fill="#e8eaef" stroke="#7d8494" stroke-width="1"/>
      <g fill="#b6bccb"><rect x="17" y="27" width="5" height="4" rx="1"/><rect x="25" y="27" width="5" height="4" rx="1"/>
      <rect x="33" y="27" width="5" height="4" rx="1"/><rect x="41" y="27" width="5" height="4" rx="1"/>
      <rect x="21" y="34" width="22" height="4" rx="1"/></g>`
  },
  {
    id: "mug", days: 0.03,
    name: { zh: "保温杯", en: "Thermos Mug" },
    desc: { zh: "中年人的第一件装备", en: "First gear of middle age" },
    art: `<rect x="20" y="14" width="20" height="30" rx="4" fill="#e2eef5" stroke="#6f8fa8" stroke-width="1"/>
      <path d="M40 22h4a5 5 0 0 1 0 10h-4" fill="none" stroke="#6f8fa8" stroke-width="1"/>
      <rect x="20" y="21" width="20" height="4" fill="#b7d3e6"/>`
  }
];

/* ---------------- 卡包 ---------------- */

export const PACK = {
  id: "pack",
  days: 0.3,
  count: 3,
  name: { zh: "今日卡包", en: "Daily Pack" },
  desc: { zh: "三张随机卡，保底一张史诗", en: "Three random cards, one Epic guaranteed" }
};

export const CARD_MAP = Object.fromEntries(CARD_DEFS.map((d) => [d.id, d]));
export const ITEM_MAP = Object.fromEntries(ITEM_DEFS.map((d) => [d.id, d]));

export function findDef(id) {
  if (id === PACK.id) return PACK;
  return CARD_MAP[id] || ITEM_MAP[id] || null;
}

export function isCard(id) {
  return Object.prototype.hasOwnProperty.call(CARD_MAP, id);
}

/** 某稀有度下所有可掉落的卡 */
export function cardsOfRarity(rarity) {
  return CARD_DEFS.filter((d) => d.rarity === rarity);
}

/** 编号格式：No.0007 */
export function formatNo(no) {
  const n = Math.max(0, Math.floor(Number(no) || 0));
  const s = String(n);
  return `No.${s.length >= 4 ? s : s.padStart(4, "0")}`;
}
