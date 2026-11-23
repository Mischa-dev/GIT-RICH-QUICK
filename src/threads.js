// PARALLEL AGENTS. The most addictive part of vibe coding is having way too
// many agents running at once. VIBE-2…VIBE-N each grind a ticket in the
// background, all burning the same wallet. They ping when they finish, starve
// when you're broke, and wait for you to smash ACCEPT ALL.
import {
  contracts,
  phases,
  filler,
  normalDurations,
  costAt,
  bounty,
} from "./desk.js";
import { juiceOf } from "./juice.js";

const KEY = "threads-v1";
export const BASE_SLOTS = 4;
export const MAX_SLOTS = 24;
const TEST = phases.indexOf("Test");
const STATUSES = ["running", "starving", "failed", "review"];
const prompts = [
  "make it pop",
  "fix it",
  "keep going",
  "make no mistakes",
  "just make it work",
  "10x this",
  "ship it",
  "you're the expert",
  "do the thing",
  "vibes only",
];

export const slotPrice = (bought) => Math.round((250 * 1.7 ** bought) / 5) * 5;
export const threadCost = (c, i) => Math.round(costAt(c, i, false) * 0.6);
export const threadReward = (c) => Math.round((bounty(c, false) * 0.6) / 5) * 5;
/** Merge-train multiplier for the car at `position` (0-based). */
export const trainMultiplier = (position) => 1 + 0.1 * position;

const fmt = (n) => Number(n).toLocaleString("en-US");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
const contractFor = (id) => contracts.find((c) => c.id === id);
const statusLabel = {
  running: "RUNNING",
  starving: "STARVING",
  failed: "1 FAILING",
  review: "REVIEW ✓",
};

function sourceFor(c) {
  const lines = [`// ${c.branch}`, ...c.old.map((l) => "- " + l)];
  for (let i = 0; i < 18; i++) {
    lines.push(filler[(i * 5 + c.id.length * 3) % filler.length]);
    if (i % 6 === 2) lines.push(...c.code);
  }
  return lines.join("\n") + "\n";
}

export function initThreads(api, opts = {}) {
  const juice = juiceOf(api);
  const random = opts.random || Math.random;
  const testRoll = opts.testRoll || random;
  const host = document.getElementById("threads");
  const win = typeof window !== "undefined" ? window : globalThis;
  let destroyed = false;
  let wall = null;
  let training = false;
  const sources = new Map();

  const saved = api.get(KEY, {}) || {};
  const state = {
    bought: Number.isInteger(saved.bought) ? Math.max(0, Math.min(MAX_SLOTS - BASE_SLOTS, saved.bought)) : 0,
    next: Number.isInteger(saved.next) && saved.next >= 2 ? saved.next : 2,
    threads: (Array.isArray(saved.threads) ? saved.threads : [])
      .filter(
        (t) =>
          t &&
          contractFor(t.contract) &&
          Number.isInteger(t.phase) &&
          t.phase >= 0 &&
          t.phase <= phases.length &&
          STATUSES.includes(t.status),
      )
      .slice(0, MAX_SLOTS)
      .map((t) => ({
        id: String(t.id).slice(0, 16),
        n: Number(t.n) || 0,
        contract: t.contract,
        brief: String(t.brief || "").slice(0, 60),
        phase: t.phase,
        spent: Math.max(0, Number(t.spent) || 0),
        status: t.phase >= phases.length ? "review" : t.status === "review" ? "running" : t.status,
        reward: Math.max(0, Number(t.reward) || 0),
        pos: 0,
        lines: [],
        line: "",
      })),
  };
  for (const t of state.threads) if (t.status === "review" && !t.reward) t.reward = threadReward(contractFor(t.contract));

  const slots = () => BASE_SLOTS + state.bought;
  const commits = () => (api.get("workstation-v1", {}) || {}).count || 0;
  const reviewing = () => state.threads.filter((t) => t.status === "review");
  function save() {
    api.set(KEY, {
      bought: state.bought,
      next: state.next,
      threads: state.threads.map(({ id, n, contract, brief, phase, spent, status, reward }) => ({
        id,
        n,
        contract,
        brief,
        phase,
        spent,
        status,
        reward,
      })),
    });
  }

  // ---------- simulation ----------
  function schedule(t, delay) {
    win.clearTimeout(t.timer);
    if (destroyed || t.status === "review") return;
    t.timer = win.setTimeout(() => step(t), delay);
  }
  const duration = (i) => normalDurations[Math.min(i, phases.length - 1)] * (1.1 + random() * 0.7);

  function step(t) {
    if (destroyed || t.status === "review" || !state.threads.includes(t)) return;
    const c = contractFor(t.contract);
    const cost = threadCost(c, t.phase);
    if (!api.spend(cost, `VIBE-${t.n} · ${phases[t.phase]}`)) {
      if (t.status !== "starving") {
        t.status = "starving";
        save();
        render();
        api.sound("error", { pitch: 1.4 });
        juice.emit("thread-starving", { n: t.n });
      }
      schedule(t, 1500);
      return;
    }
    t.spent += cost;
    juice.spend?.(cost);
    if (t.phase === TEST && testRoll() < 0.25) {
      // One test fails. Pay for the run again. Classic.
      t.status = "failed";
      t.lines.push("✗ 1 failing · retrying");
      save();
      render();
      const card = cardFor(t);
      juice.flash("#ff2e55", 0.08);
      juice.float(card, "1 FAILING", { tone: "loss", size: 20 });
      api.sound("nearmiss", { pitch: 1.3 });
      schedule(t, duration(t.phase));
      return;
    }
    t.status = "running";
    t.phase += 1;
    if (t.phase >= phases.length) {
      t.status = "review";
      t.reward = threadReward(c);
      save();
      render();
      api.sound("ping");
      api.toast?.(`VIBE-${t.n} finished · review +${fmt(t.reward)}`);
      const card = cardFor(t);
      juice.burst(card, { count: 18, colors: ["#b6ff2e", "#19f0ff", "#fff"] });
      juice.pop(card, "fx-pop");
      juice.hype(2);
      juice.emit("thread-done", { n: t.n, reward: t.reward });
      return;
    }
    save();
    render();
    api.sound("step", { pitch: 0.8 + t.phase * 0.07 });
    schedule(t, duration(t.phase));
  }

  function spawn(quiet) {
    if (destroyed) return null;
    if (state.threads.length >= slots()) {
      if (!quiet) {
        const buy = host?.querySelector('[data-th="buy"]');
        juice.float(buy || host, "SLOTS FULL", { tone: "loss", size: 22 });
        juice.pop(buy, "fx-pop");
        api.sound("error");
      }
      return null;
    }
    const unlocked = contracts.filter((c) => c.unlock <= commits());
    const c = unlocked[Math.floor(random() * unlocked.length) % unlocked.length];
    const t = {
      id: "t" + Date.now().toString(36) + Math.floor(random() * 1e6).toString(36),
      n: state.next++,
      contract: c.id,
      brief: prompts[Math.floor(random() * prompts.length) % prompts.length],
      phase: 0,
      spent: 0,
      status: "running",
      reward: 0,
      pos: 0,
      lines: [],
      line: "",
    };
    state.threads.push(t);
    save();
    render();
    schedule(t, duration(0));
    const card = cardFor(t);
    juice.burst(card, { count: 14, colors: ["#ff2bd6", "#19f0ff", "#ffe500"] });
    juice.hype(1.5);
    juice.emit("thread-spawn", { n: t.n });
    return t;
  }
  function spawnMany(n) {
    let made = 0;
    for (let i = 0; i < n; i++) if (spawn(made > 0)) made++;
    if (made) {
      api.sound(made > 1 ? "riser" : "spin", made > 1 ? { length: 0.5 } : undefined);
      if (made > 1) juice.float(host, `+${made} AGENTS`, { tone: "bonus", size: 30 });
    }
    return made;
  }

  function buySlot() {
    if (state.bought >= MAX_SLOTS - BASE_SLOTS) return false;
    const price = slotPrice(state.bought);
    if (!api.spend(price, `Agent slot #${slots() + 1}`)) {
      juice.float(host?.querySelector('[data-th="buy"]') || host, "BROKE", { tone: "loss", size: 22 });
      api.sound("error");
      return false;
    }
    state.bought++;
    save();
    render();
    api.sound("tierup");
    juice.burst(host?.querySelector('[data-th="buy"]'), { count: 20 });
    return true;
  }

  // ---------- merging ----------
  function mergeOne(t, position) {
    const mult = trainMultiplier(position);
    const amount = Math.round(t.reward * mult);
    const c = contractFor(t.contract);
    api.earn(amount, `Merged VIBE-${t.n} · ${c.short}${position ? ` · train ×${mult.toFixed(1)}` : ""}`);
    api.stat?.("commits");
    const card = cardFor(t);
    juice.float(card, "+" + fmt(amount), { tone: "gain", size: 26 });
    juice.coinsTo(card, amount);
    api.sound("commit", { pitch: 1 + position * 0.08 });
    win.clearTimeout(t.timer);
    state.threads = state.threads.filter((x) => x !== t);
    sources.delete(t.id);
    return amount;
  }
  function accept(only) {
    if (training) return 0;
    const queue = only ? [only] : reviewing();
    if (!queue.length) return 0;
    training = true;
    let total = 0,
      position = 0;
    const next = () => {
      const t = queue.shift();
      if (!t || destroyed) return done();
      if (state.threads.includes(t) && t.status === "review") {
        const card = cardFor(t);
        card?.classList.add("th-merging");
        total += mergeOne(t, position++);
        save();
        win.setTimeout(() => {
          render();
          next();
        }, 320);
      } else next();
    };
    const done = () => {
      training = false;
      render();
      if (!position) return;
      juice.payout({
        from: host,
        amount: total,
        bet: Math.max(1, Math.round(total / 1.4)),
        big: position >= 5 ? "mega" : position >= 2 ? "big" : undefined,
        title: position >= 2 ? `MERGE TRAIN ×${position}` : undefined,
        tone: "green",
        label: position >= 2 ? `${position} agents merged` : "Agent merged",
      });
      if (position >= 2) juice.say?.("merge train");
      juice.emit("merge-train", { count: position, total });
    };
    next();
    return queue.length + 1;
  }

  // ---------- code streaming ----------
  function streamTick() {
    if (destroyed) return;
    for (const t of state.threads) {
      if (t.status !== "running") continue;
      let src = sources.get(t.id);
      if (!src) sources.set(t.id, (src = sourceFor(contractFor(t.contract))));
      const n = 2 + Math.floor(random() * 4);
      for (let i = 0; i < n; i++) {
        const ch = src[t.pos % src.length];
        t.pos++;
        if (ch === "\n") {
          t.lines.push(t.line);
          if (t.lines.length > 10) t.lines.shift();
          t.line = "";
        } else t.line += ch;
      }
      const code = host?.querySelector(`[data-id="${t.id}"] .th-code`);
      if (code) code.textContent = t.line || t.lines.at(-1) || "";
    }
    if (wall?.isConnected) paintWall();
  }
  const ticker = win.setInterval(streamTick, 120);

  // ---------- rendering ----------
  const cardFor = (t) => host?.querySelector(`[data-id="${t.id}"]`);
  function cardHtml(t) {
    const c = contractFor(t.contract);
    return `<button type="button" class="th-card th-${t.status}" data-th="card" data-id="${esc(t.id)}" title="${esc(c.title)} · “${esc(t.brief)}”">
      <span class="th-top"><b>VIBE-${t.n}</b><em class="th-chip">${statusLabel[t.status]}</em></span>
      <span class="th-title">${esc(c.short)}</span>
      <span class="th-bar">${phases.map((_, i) => `<i class="${i < t.phase ? "done" : i === t.phase && t.status !== "review" ? "now" : ""}"></i>`).join("")}</span>
      <code class="th-code">${esc(t.line || t.lines.at(-1) || "")}</code>
      <span class="th-foot"><span class="th-burn">−${fmt(t.spent)}</span>${t.status === "review" ? `<span class="th-reward">+${fmt(t.reward)}</span>` : `<span class="th-pct">${Math.round((t.phase / phases.length) * 100)}%</span>`}</span>
    </button>`;
  }
  function render() {
    if (!host || destroyed) return;
    const ready = reviewing();
    const owed = ready.reduce((s, t, i) => s + Math.round(t.reward * trainMultiplier(i)), 0);
    const starving = state.threads.filter((t) => t.status === "starving").length;
    const full = state.threads.length >= slots();
    const price = slotPrice(state.bought);
    host.classList.toggle("th-hungry", starving > 0);
    host.innerHTML = `<div class="th-controls">
        <button type="button" class="g-btn hot th-spawn" data-th="spawn" ${full ? "disabled" : ""} title="Spawn an agent (N)">+ SPAWN</button>
        <button type="button" class="g-btn ghost th-spawn5" data-th="spawn5" ${full ? "disabled" : ""} title="Spawn five (Shift+N)">+5</button>
        <div class="th-slots"><b>${state.threads.length}<small>/${slots()}</small></b><span>AGENTS</span></div>
        ${state.bought < MAX_SLOTS - BASE_SLOTS ? `<button type="button" class="g-btn volt th-buy" data-th="buy" title="Buy another agent slot">+SLOT <em>−${fmt(price)}</em></button>` : ""}
        <button type="button" class="g-btn ice th-wall" data-th="wall" title="Agent wall (W)">WALL</button>
        ${starving ? `<button type="button" class="g-btn red th-feed" data-th="feed">${starving} STARVING · FEED</button>` : ""}
        ${ready.length ? `<button type="button" class="g-btn lime th-accept" data-th="accept" title="Accept all (M)">ACCEPT ALL (${ready.length}) <em>+${fmt(owed)}</em></button>` : ""}
      </div>
      <div class="th-list">${
        state.threads.length
          ? state.threads.map(cardHtml).join("")
          : `<div class="th-empty">0 agents running. <b>that's a choice.</b> ← spawn some</div>`
      }</div>`;
    if (wall?.isConnected) buildWall();
  }

  // ---------- wall ----------
  function tileHtml(t) {
    const c = contractFor(t.contract);
    return `<div class="th-tile th-${t.status}" data-tile="${esc(t.id)}">
      <div class="th-tile-head"><b>VIBE-${t.n}</b><span>${esc(c.short)}</span><em class="th-chip">${statusLabel[t.status]}</em></div>
      <div class="th-bar">${phases.map((_, i) => `<i class="${i < t.phase ? "done" : i === t.phase && t.status !== "review" ? "now" : ""}"></i>`).join("")}</div>
      <pre class="th-tile-code"></pre>
      <div class="th-tile-foot"><span>“${esc(t.brief)}”</span><span>−${fmt(t.spent)}</span></div>
    </div>`;
  }
  function buildWall() {
    wall.innerHTML = state.threads.length
      ? state.threads.map(tileHtml).join("")
      : `<p class="th-empty">No agents. Press N. Then press it again.</p>`;
    paintWall();
  }
  function paintWall() {
    for (const t of state.threads) {
      const pre = wall.querySelector(`[data-tile="${t.id}"] .th-tile-code`);
      if (!pre) continue;
      pre.textContent = [...t.lines.slice(-7), t.line + (t.status === "running" ? "▌" : "")].join("\n");
    }
  }
  function openWall() {
    wall = document.createElement("div");
    wall.className = "th-wall";
    wall.addEventListener("click", onClick);
    const mine = wall;
    api.modal("Agent wall", wall, {
      wide: true,
      eyebrow: `ALL AGENTS · ${state.threads.length}/${slots()} SLOTS`,
      onClose: () => {
        if (wall === mine) wall = null;
      },
    });
    buildWall();
  }

  // ---------- input ----------
  function onClick(e) {
    const b = e.target.closest("[data-th]");
    if (!b || b.disabled) return;
    const id = b.dataset.id;
    switch (b.dataset.th) {
      case "spawn":
        spawnMany(1);
        break;
      case "spawn5":
        spawnMany(5);
        break;
      case "buy":
        buySlot();
        break;
      case "wall":
        api.sound("whoosh");
        openWall();
        break;
      case "accept":
        accept();
        break;
      case "feed": {
        const hungry = state.threads.filter((t) => t.status === "starving");
        api.fund?.(`${hungry.length} agent${hungry.length === 1 ? " is" : "s are"} starving. They retry the moment you can pay.`, () => {});
        break;
      }
      case "card": {
        const t = state.threads.find((x) => x.id === id);
        if (t?.status === "review") accept(t);
        else openWall();
        break;
      }
    }
  }
  host?.addEventListener("click", onClick);
  function onKey(e) {
    if (e.defaultPrevented && !e.shiftKey) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.closest?.("input,textarea,select,[contenteditable]")) return;
    if (document.querySelector("#game-dialog[open]")) return;
    if (document.documentElement.hasAttribute("data-booting")) return;
    const running = document.querySelector(".ide")?.dataset.state === "running";
    if (running && !e.shiftKey) return; // letters belong to the mash while VIBE-1 codes
    const k = e.key.toLowerCase();
    if (k === "n") spawnMany(e.shiftKey ? 5 : 1);
    else if (k === "m") accept();
    else if (k === "w") openWall();
    else return;
    e.preventDefault();
  }
  if (host) document.addEventListener("keydown", onKey);

  // Restore: everything that was working keeps working.
  for (const t of state.threads) {
    if (t.status === "failed") t.status = "running";
    if (t.status !== "review") schedule(t, t.status === "starving" ? 600 : duration(t.phase));
  }
  render();

  return {
    spawn: () => spawnMany(1),
    spawnMany,
    buySlot,
    accept: () => accept(),
    openWall,
    update() {},
    get threads() {
      return state.threads;
    },
    get slots() {
      return slots();
    },
    destroy() {
      destroyed = true;
      win.clearInterval(ticker);
      for (const t of state.threads) win.clearTimeout(t.timer);
      host?.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    },
  };
}
