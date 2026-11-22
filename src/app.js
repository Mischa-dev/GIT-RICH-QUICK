import { createEconomy, format } from "./economy.js";
import { openArcadeSession } from "./session.js";
import { soundSystem } from "./audio.js";
import { openReceipt } from "./receipt.js";
import { initSlots } from "./slots.js";
import { initDesk } from "./desk.js";
import { initFishing } from "./fishing.js";
import { initSponsors } from "./sponsors.js";
import { initFloor } from "./floor.js";
import { initT3 } from "./t3.js";

const $ = (s) => document.querySelector(s);
const icons = {
  pad: '<path d="M7 7h10c2 0 3 1 4 6l.5 3c.4 3-2.1 4.2-4 2l-2.2-2.5H8.7L6.5 18c-1.9 2.2-4.4 1-4-2l.5-3c1-5 2-6 4-6Z"/><path d="M6 11.5h5m-2.5-2.5v5"/><circle cx="16" cy="11" r=".5"/><circle cx="18" cy="13" r=".5"/>',
  terminal:
    '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m6 8 4 4-4 4m7 0h5"/>',
  ledger:
    '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 8h7m-7 4h7m-7 4h4"/>',
  volume:
    '<path d="M11 4 6 8H3v8h3l5 4zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 4 6 8H3v8h3l5 4zm5 5 5 6m0-6-5 6"/>',
  plug: '<path d="m8 5 3 3m3-9 3 3" transform="translate(0 3)"/><path d="m5.5 11 7.5-7.5 5 5-7.5 7.5H7l-3 4m4-11 6 6"/>',
  pulse: '<path d="M2 12h5l2.2-6 4 12 2.3-6H22"/>',
  receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6"/>',
  chevron: '<path d="m8 5 7 7-7 7"/>',
};
function paintIcons(root = document) {
  root.querySelectorAll("i[data-icon]").forEach((el) => {
    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (icons[el.dataset.icon] || "") +
      "</svg>";
  });
}
paintIcons();
const dialog = $("#game-dialog"),
  body = $("#dialog-body");
let previousClose = null,
  panelType = null,
  modules = [],
  pendingUpdate = false,
  ledgerContents;
const storage = await openArcadeSession();
const wallet = createEconomy(storage, () => {
  if (pendingUpdate) return;
  pendingUpdate = true;
  queueMicrotask(() => {
    pendingUpdate = false;
    update();
  });
});
const audio = soundSystem(wallet);
document.addEventListener("pointerdown", () => audio.init(), { once: true });
document.addEventListener("keydown", () => audio.init(), { once: true });
function markTab(type) {
  document.querySelectorAll(".nav-item").forEach((el) => {
    const active = el.dataset.act === (type || "arcade");
    el.classList.toggle("selected", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}
function release() {
  const cleanup = previousClose;
  previousClose = null;
  panelType = null;
  if (cleanup) cleanup();
}
function closeModal() {
  if (!dialog.open) return;
  release();
  dialog.close();
  markTab(null);
}
function modal(title, content, opts = {}) {
  release();
  $("#dialog-title").textContent = title;
  $("#dialog-kicker").textContent = opts.eyebrow || "";
  if (typeof content === "string") body.innerHTML = content;
  else body.replaceChildren(content);
  dialog.classList.toggle("wide", !!opts.wide);
  previousClose = opts.onClose;
  dialog.scrollTop = 0;
  panelType =
    title === "Agent workstation"
      ? "desk"
      : title === "House ledger"
        ? "ledger"
        : null;
  markTab(panelType);
  if (!dialog.open) dialog.showModal();
  else $("#dialog-close").focus({ preventScroll: true });
}
$("#dialog-close").onclick = closeModal;
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeModal();
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const b = dialog.getBoundingClientRect();
    if (
      e.clientX < b.left ||
      e.clientX > b.right ||
      e.clientY < b.top ||
      e.clientY > b.bottom
    )
      closeModal();
  }
});
function toast(message) {
  const n = document.createElement("div");
  n.className = "toast";
  n.textContent = message;
  const holder = $("#toasts");
  if (holder.children.length >= 3) holder.firstElementChild.remove();
  holder.append(n);
  setTimeout(() => n.remove(), 3500);
}
function fx(kind) {
  const root = $("#confetti");
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const colors = ["#ffe8a1", "#ff806b", "#a9e5c8", "#c099ef"];
  for (let i = 0; i < (kind === "jackpot" ? 90 : 27); i++) {
    const n = document.createElement("i");
    n.style.left = Math.random() * 100 + "%";
    n.style.background = colors[i % 4];
    n.style.setProperty("--drift", (Math.random() - 0.5) * 240 + "px");
    n.style.animationDelay = Math.random() * 0.35 + "s";
    root.append(n);
    setTimeout(() => n.remove(), 2100);
  }
}
const api = {
  ...wallet,
  modal,
  closeModal,
  toast,
  fx,
  refresh: update,
  sound: audio.sound,
  fund: (reason, callback) => sponsors.open(reason, callback),
  openT3: (brief) => t3.open(brief),
};
const sponsors = initSponsors(api),
  t3 = initT3(api),
  slots = initSlots(api),
  desk = initDesk(api),
  fishing = initFishing(api),
  floor = initFloor(api);
modules = [slots, desk, fishing, floor, t3, sponsors];
const stamps = [
  ["First commit", "commits", 1],
  ["Staff engineer", "commits", 5],
  ["Slot regular", "spins", 10],
  ["Lucky sevens", "jackpots", 1],
  ["Fish on payroll", "fish", 1],
  ["Ad-funded startup", "ads", 3],
  ["Cabinet tourist", "floorPlays", 3],
];
function el(tag, txt, cls) {
  const n = document.createElement(tag);
  if (txt !== undefined) n.textContent = txt;
  if (cls) n.className = cls;
  return n;
}
function ledger() {
  ledgerContents = el("section");
  modal("House ledger", ledgerContents, {
    eyebrow: "CASHIER / LOCAL SAVE",
    wide: true,
  });
  paintLedger();
}
function paintLedger() {
  const s = wallet.state,
    root = ledgerContents;
  root.replaceChildren();
  const metrics = el("div", undefined, "ledger-metrics");
  for (const [name, n] of [
    ["Balance", s.tokens],
    ["Peak balance", s.peak],
    ["Tokens burned", s.spent],
  ]) {
    const cell = el("div");
    cell.append(el("span", name), el("b", format(n)));
    metrics.append(cell);
  }
  const actions = el("div", undefined, "utility-actions");
  for (const [name, action] of [
    ["Print run receipt", "receipt"],
    ["Watch sponsor TV", "ads"],
    ["Get tokens", "fund"],
  ]) {
    const b = el("button", name, "hud-btn");
    b.dataset.act = action;
    actions.append(b);
  }
  const badges = el("div", undefined, "stamps");
  for (const [name, key, target] of stamps) {
    const got = (s.stats[key] || 0) >= target;
    const b = el(
      "span",
      got
        ? "★ " + name
        : name + " · " + Math.min(s.stats[key] || 0, target) + "/" + target,
      "stamp" + (got ? " earned" : ""),
    );
    badges.append(b);
  }
  const rows = el("ul", undefined, "ledger-rows");
  for (const event of s.events.slice(0, 25)) {
    const row = el("li"),
      date = new Date(event.time);
    row.append(
      el(
        "time",
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ),
      el("span", event.text),
    );
    if (event.amount)
      row.append(
        el(
          "b",
          (event.amount > 0 ? "+" : "−") + format(Math.abs(event.amount)),
          event.amount > 0 ? "gain" : "loss",
        ),
      );
    rows.append(row);
  }
  root.append(
    metrics,
    actions,
    el("h3", "Floor stamps", "subhead"),
    badges,
    el("h3", "Recent activity", "subhead"),
    rows,
  );
}
function showAudio() {
  const section = el("section");
  for (const [key, title, sub, toggle] of [
    [
      "effects",
      "Cabinet sounds",
      "Reel stops, payouts and commit chimes.",
      audio.toggleEffects,
    ],
    [
      "music",
      "Floor music",
      "An original 126 BPM arcade loop.",
      audio.toggleMusic,
    ],
  ]) {
    const row = el("div", undefined, "audio-row"),
      copy = el("div"),
      b = el("button", audio[key] ? "On" : "Off", "hud-btn");
    b.setAttribute("aria-pressed", String(audio[key]));
    b.setAttribute("aria-label", title);
    b.onclick = () => {
      toggle();
      b.textContent = audio[key] ? "On" : "Off";
      b.setAttribute("aria-pressed", String(audio[key]));
      soundIcon();
    };
    copy.append(el("b", title), el("p", sub));
    row.append(copy, b);
    section.append(row);
  }
  modal("Sound booth", section, { eyebrow: "FLOOR AUDIO" });
}
function soundIcon() {
  const icon = $(".sound-button i");
  icon.dataset.icon = audio.effects || audio.music ? "volume" : "mute";
  paintIcons(icon.parentElement);
}
let tape = 0,
  tapeTimer;
const headlines = [
  "A startup has raised $8M to remove the word “simply” from setup guides.",
  "Pond futures rise as the bass learns TypeScript.",
  "BREAKING: junior engineer wins back enough context to explain the bug.",
  "The house would like its rubber duck back.",
  "Your build is green. Legal has requested a different shade.",
  "One developer bought the dip. It was a condiment.",
];
function ticker() {
  const e = wallet.state.events[0];
  $("#ticker-line").textContent =
    e.text +
    (e.amount
      ? "   " + (e.amount > 0 ? "+" : "−") + format(Math.abs(e.amount)) + " TOK"
      : "");
  clearInterval(tapeTimer);
  tapeTimer = setInterval(() => {
    $("#ticker-line").textContent = headlines[tape++ % headlines.length];
  }, 14000);
}
function update() {
  for (const mod of modules) mod.update?.();
  if (panelType === "ledger") paintLedger();
  // Post the settled balance when the last reel lands, so the ticker cannot spoil it.
  if (!slots.rolling) {
    $("#wallet-total").textContent = format(wallet.state.tokens);
    ticker();
  }
}
const actions = {
  arcade: () => {
    closeModal();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  desk: () => desk.open(),
  ledger,
  receipt: () => openReceipt(api),
  fund: () => sponsors.open(),
  ads: () => sponsors.openAds(),
  audio: showAudio,
  t3: () => t3.open(),
  pond: () => fishing.open(),
  slots: () => slots.open(),
  merge: () => floor.open("merge"),
  roulette: () => floor.open("roulette"),
  deploy: () => floor.open("deploy"),
};
document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-act]")?.dataset.act;
  if (Object.hasOwn(actions, action)) {
    e.preventDefault();
    audio.sound("click");
    actions[action]();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.defaultPrevented ||
    e.repeat ||
    e.altKey ||
    e.metaKey ||
    e.ctrlKey ||
    dialog.open ||
    e.target.closest("input,textarea,button,select,a,[contenteditable]")
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    slots.spin();
  }
});
function route() {
  const hash = location.hash.slice(1).toLowerCase();
  if (hash && Object.hasOwn(actions, hash)) actions[hash]();
}
window.addEventListener("hashchange", route);
soundIcon();
update();
route();
