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
import { createJuice } from "./juice.js";
import { startBackdrop } from "./backdrop.js";
import { initAllIn } from "./allin.js";

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
const juice = createJuice({ wallet, audio });
const backdrop = startBackdrop(() => juice.heat / 100);
document.addEventListener("pointerdown", () => audio.init(), { once: true });
document.addEventListener("keydown", () => audio.init(), { once: true });
let lastAct = null;
function markTab(type) {
  document.querySelectorAll(".hotkey").forEach((el) => {
    const active = !!type && el.dataset.act === type;
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
  markTab(panelType || lastAct);
  if (!dialog.open) {
    dialog.showModal();
    audio.sound("whoosh");
  } else $("#dialog-close").focus({ preventScroll: true });
  juice.raise();
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
function fx(kind, from) {
  const big = kind === "jackpot";
  const at =
    from || (dialog.open ? dialog.querySelector(".dialog-inner") : null);
  juice.burst(at, { kind: "confetti", count: big ? 140 : 50, speed: 1.2 });
  juice.burst(at, { count: big ? 40 : 20, colors: ["#fff3b0", "#ffd166", "#fff"] });
  juice.shake(big ? 0.6 : 0.25);
  if (big) juice.flash("#fff3b0", 0.3);
}
// The progressive pool grows with every slot wager and drifts upward on its own.
const jackpot = {
  get value() {
    return Math.floor(wallet.get("jackpot.pool", 5000));
  },
  feed(n) {
    wallet.set("jackpot.pool", Math.min(5e7, this.value + n));
    paintJackpot(true);
  },
  claim() {
    const won = this.value;
    wallet.set("jackpot.pool", 5000);
    paintJackpot(true);
    return won;
  },
};
function paintJackpot(bump) {
  const node = $("#jackpot-value");
  if (!node) return;
  node.textContent = format(jackpot.value);
  if (bump) juice.pop(node, "fx-pop");
}
setInterval(() => {
  if (document.hidden) return;
  jackpot.feed(1 + Math.floor(Math.random() * 6));
}, 1400);
const api = {
  ...wallet,
  spend(n, label) {
    const ok = wallet.spend(n, label);
    if (ok) juice.spend(n);
    return ok;
  },
  juice,
  jackpot,
  modal,
  closeModal,
  toast,
  fx,
  refresh: update,
  sound: audio.sound,
  fund: (reason, callback) => sponsors.open(reason, callback),
  openT3: (brief) => t3.open(brief),
  allIn: (opts) => allin.open(opts),
};
const allin = initAllIn(api);
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
  const fxRow = el("div", undefined, "audio-row"),
    fxCopy = el("div"),
    fxButtons = el("div", undefined, "intensity-picker");
  fxCopy.append(
    el("b", "Visual intensity"),
    el(
      "p",
      juice.reduced
        ? "Your system asks for reduced motion, so the floor stays still."
        : "How hard the floor hits back. Feral is the intended experience.",
    ),
  );
  ["Chill", "Hyped", "Feral"].forEach((name, i) => {
    const b = el("button", name, "hud-btn");
    b.setAttribute("aria-pressed", String(juice.intensity === i));
    b.onclick = () => {
      juice.setIntensity(i);
      fxButtons
        .querySelectorAll("button")
        .forEach((x, j) => x.setAttribute("aria-pressed", String(j === i)));
      juice.burst(b, { count: [8, 24, 60][i] });
      juice.shake([0, 0.3, 0.7][i]);
    };
    fxButtons.append(b);
  });
  fxRow.append(fxCopy, fxButtons);
  section.append(fxRow);
  modal("Sound booth", section, { eyebrow: "FLOOR AUDIO / FX" });
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
let feedSignature = "";
function paintFeed() {
  const wins = wallet.state.events.filter((e) => e.amount > 0).slice(0, 4);
  const sig = wins.map((e) => e.time + ":" + e.amount).join();
  if (sig === feedSignature) return;
  const fresh = feedSignature !== "";
  feedSignature = sig;
  const list = $("#win-feed");
  if (!list) return;
  list.replaceChildren(
    ...wins.map((e, i) => {
      const li = el("li", undefined, i === 0 && fresh ? "fresh" : "");
      li.append(
        el("b", "+" + format(e.amount)),
        el("span", e.text.replace(/\.$/, "")),
      );
      return li;
    }),
  );
}
function update() {
  paintFeed();
  for (const mod of modules) mod.update?.();
  if (panelType === "ledger") paintLedger();
  // Post the settled balance when the last reel lands, so the ticker cannot spoil it.
  if (!slots.rolling) {
    juice.walletTo(wallet.state.tokens);
    ticker();
  }
}
const actions = {
  arcade: () => closeModal(),
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
    lastAct = action;
    actions[action]();
  }
});
// Number-row hotkeys open machines, like a skill bar.
document.addEventListener("keydown", (e) => {
  if (
    e.defaultPrevented ||
    e.repeat ||
    e.altKey ||
    e.metaKey ||
    e.ctrlKey ||
    document.documentElement.hasAttribute("data-booting") ||
    e.target.closest("input,textarea,select,[contenteditable]")
  )
    return;
  const key = e.key.toLowerCase();
  const slot = [...document.querySelectorAll(".hotkey")].find(
    (b) => b.dataset.key === key && key !== " ",
  );
  if (!slot) return;
  // Inside the agent desk, letters are for mashing; only digits switch machines.
  if (dialog.open && !/^[1-69]$/.test(key)) return;
  e.preventDefault();
  slot.classList.add("pressed");
  setTimeout(() => slot.classList.remove("pressed"), 120);
  audio.sound("click");
  lastAct = slot.dataset.act;
  actions[slot.dataset.act]();
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
  if (hash && Object.hasOwn(actions, hash)) {
    lastAct = hash;
    actions[hash]();
  }
}
// Title screen. A deep link skips straight to the floor.
const titleScreen = $("#title-screen");
function boot(instant) {
  const html = document.documentElement;
  if (!html.hasAttribute("data-booting")) return;
  if (!instant) audio.init();
  if (instant || juice.reduced) {
    html.removeAttribute("data-booting");
    return;
  }
  audio.sound("boom");
  audio.sound("levelup");
  juice.flash("#fff", 0.7);
  titleScreen.classList.add("leaving");
  setTimeout(() => {
    html.removeAttribute("data-booting");
    const game = $(".app");
    game.classList.add("boot");
    setTimeout(() => game.classList.remove("boot"), 1200);
    juice.burst(null, { kind: "confetti", count: 120, speed: 1.3 });
    juice.burst(null, { kind: "coin", count: 30, speed: 1.2 });
    juice.shake(0.5);
  }, 420);
}
if (location.hash.length > 1) boot(true);
titleScreen.addEventListener("click", () => boot());
document.addEventListener(
  "keydown",
  (e) => {
    if (document.documentElement.hasAttribute("data-booting")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      boot();
    }
  },
  { capture: true },
);
window.addEventListener("hashchange", route);
soundIcon();
paintJackpot();
update();
route();

// ---------------------------------------------------------------------------
// Everything moves on the beat. The music reports each sixteenth; when it is
// off (or not started yet), a silent clock at the same tempo takes over.
const root = document.documentElement;
let lastStep = 0,
  silentStep = 0;
function pulse(cls, ms = 120) {
  root.classList.remove(cls);
  void root.offsetWidth;
  root.classList.add(cls);
  setTimeout(() => root.classList.remove(cls), ms);
}
function onStep(step) {
  lastStep = performance.now();
  if (juice.intensity === 0 || juice.reduced) return;
  const tier = juice.tier;
  if (step % 4 === 0) {
    pulse("kick");
    backdrop.kick(0.35 + tier * 0.18);
    // Vegas: once you're warm it starts raining money.
    if (tier >= 2 && juice.intensity === 2)
      for (let i = 0; i < tier - 1; i++)
        juice.burst(
          { x: Math.random() * innerWidth, y: -20 },
          { kind: "coin", count: 1, angle: Math.PI / 2, spread: 0.3, speed: 0.35 },
        );
  }
  if (step === 4 || step === 12) {
    pulse("snare");
    // Strobe on the snare only when it's properly hot (≤ 2 flashes a second).
    if (tier >= 3 && juice.intensity === 2) juice.flash("#ffffff", 0.07 + (tier - 3) * 0.05);
  }
  if (tier >= 4 && step % 2 === 0) pulse("hat", 80);
}
audio.onStep = onStep;
setInterval(() => {
  if (performance.now() - lastStep < 600) return;
  onStep(silentStep++ % 16);
  lastStep = 0;
}, 60000 / 126 / 4);

// Burn meter in the status bar: tokens spent per second, smoothed.
let lastSpent = wallet.state.spent,
  burn = 0;
setInterval(() => {
  const now = wallet.state.spent;
  burn = burn * 0.6 + (now - lastSpent) * 0.4;
  lastSpent = now;
  const el = $("#sb-burn");
  if (el) {
    el.textContent = Math.round(burn) + " tok/s";
    el.classList.toggle("hot", burn > 20);
  }
}, 1000);
