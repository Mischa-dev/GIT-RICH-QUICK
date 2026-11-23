// THE SWARM. The most addictive part of vibe coding is having way too many
// agents running at once. VIBE-2…VIBE-N each grind a ticket in the background,
// all burning the same wallet. They ping when they finish, starve when you're
// broke, hire more agents if you let them, and merge themselves in an endless
// train. Up to 100 of them.
//
// Built to stay cheap at 100 agents: the strip is patched in place (never
// re-rendered), saves are debounced, and sounds and stickers are rate-limited.
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
export const MAX_SLOTS = 100;
/** More agents than this and the strip becomes a swarm grid. */
export const SWARM_AT = 8;
export const TRAIN_CAP = 3;
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

const round5 = (n) => Math.round(n / 5) * 5;
export const slotPrice = (bought) => round5(150 * 1.05 ** bought);
export const threadCost = (c, i) => Math.round(costAt(c, i, false) * 0.6);
export const threadReward = (c) => round5(bounty(c, false) * 0.6);
/** Merge-train multiplier for the car at `position` (0-based), capped at ×3. */
export const trainMultiplier = (position) => Math.min(TRAIN_CAP, 1 + 0.1 * position);

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
  const doc = document;
  const host = doc.getElementById("threads");
  const win = typeof window !== "undefined" ? window : globalThis;
  const now = opts.now || (() => (win.performance?.now ? win.performance.now() : Date.now()));
  // FEVER makes every agent three times faster.
  const speed = () => Math.max(1, Number(juice.speed) || 1);
  let destroyed = false;
  let wall = null;
  let training = false;
  const sources = new Map();

  const saved = api.get(KEY, {}) || {};
  const state = {
    bought: Number.isInteger(saved.bought) ? Math.max(0, Math.min(MAX_SLOTS - BASE_SLOTS, saved.bought)) : 0,
    next: Number.isInteger(saved.next) && saved.next >= 2 ? saved.next : 2,
    hire: !!saved.hire,
    auto: !!saved.auto,
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

  // ---------- persistence (debounced once the swarm is big) ----------
  let saveTimer = 0;
  function persist() {
    win.clearTimeout(saveTimer);
    saveTimer = 0;
    api.set(KEY, {
      bought: state.bought,
      next: state.next,
      hire: state.hire,
      auto: state.auto,
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
  function save() {
    if (state.threads.length <= SWARM_AT) return persist();
    if (!saveTimer) saveTimer = win.setTimeout(persist, 1000);
  }
  const flush = () => {
    if (saveTimer) persist();
  };

  // ---------- rate limits: 100 agents must not blow out the speakers ----------
  function limiter(perSecond) {
    const hits = [];
    return () => {
      const t = now();
      while (hits.length && t - hits[0] > 1000) hits.shift();
      if (hits.length >= perSecond) return false;
      hits.push(t);
      return true;
    };
  }
  const canSound = limiter(8),
    canStick = limiter(8),
    canDone = limiter(2),
    canCoin = limiter(6);
  const snd = (key, o) => {
    if (canSound()) api.sound(key, o);
  };
  const stick = (text, o) => {
    if (canStick()) juice.sticker?.(text, o);
  };
  const crowded = () => state.threads.length > SWARM_AT;

  // ---------- simulation ----------
  function schedule(t, delay) {
    win.clearTimeout(t.timer);
    if (destroyed || t.status === "review") return;
    t.due = now() + delay;
    t.timer = win.setTimeout(() => step(t), delay);
  }
  const duration = (i) =>
    (normalDurations[Math.min(i, phases.length - 1)] * (1.1 + random() * 0.7)) / speed();

  let spentWindow = 0,
    rate = 0;
  function step(t) {
    if (destroyed || t.status === "review" || !state.threads.includes(t)) return;
    const c = contractFor(t.contract);
    const cost = threadCost(c, t.phase);
    if (!api.spend(cost, `VIBE-${t.n} · ${phases[t.phase]}`)) {
      if (t.status !== "starving") {
        t.status = "starving";
        save();
        touch(t);
        snd("error", { pitch: 1.4 });
        stick(`VIBE-${t.n} STARVING`, { tone: "red", at: elFor(t), size: 18 });
        juice.emit("thread-starving", { n: t.n });
      }
      schedule(t, 1500 / speed());
      return;
    }
    t.spent += cost;
    spentWindow += cost;
    if (t.phase === TEST && testRoll() < 0.25) {
      // One test fails. Pay for the run again. Classic.
      t.status = "failed";
      t.lines.push("✗ 1 failing · retrying");
      save();
      touch(t);
      if (!crowded()) {
        juice.flash("#ff2e55", 0.08);
        juice.float(elFor(t), "1 FAILING", { tone: "loss", size: 20 });
      }
      snd("nearmiss", { pitch: 1.3 });
      schedule(t, duration(t.phase));
      return;
    }
    t.status = "running";
    t.phase += 1;
    if (t.phase >= phases.length) return finish(t, c);
    save();
    touch(t);
    snd("step", { pitch: 0.8 + t.phase * 0.07 });
    schedule(t, duration(t.phase));
  }

  function finish(t, c) {
    t.status = "review";
    t.reward = threadReward(c);
    win.clearTimeout(t.timer);
    save();
    touch(t);
    snd("ping");
    const el = elFor(t);
    // AUTO-MERGE follows up with a payout sticker, so skip this one; a big swarm only gets a couple a second.
    if (!state.auto && (!crowded() || canDone()))
      stick(`VIBE-${t.n} DONE`, { tone: "lime", at: el, size: crowded() ? 14 : 20 });
    if (!crowded()) {
      juice.burst(el, { count: 18, colors: ["#b6ff2e", "#19f0ff", "#fff"] });
      juice.pop(el, "fx-pop");
    }
    juice.hype(crowded() ? 0.6 : 2);
    juice.emit("thread-done", { n: t.n, reward: t.reward });
    if (state.hire) {
      // Agents hire agents. Exponential, until the slots run out.
      let hired = 0;
      for (let i = 0; i < 2; i++) if (create()) hired++;
      if (hired) {
        stick(`VIBE-${t.n} HIRED ${hired} AGENT${hired === 1 ? "" : "S"}`, { tone: "pink", at: el, size: 22 });
        snd("spin", { pitch: 1.3 });
        queueFit();
        juice.emit("thread-hire", { n: t.n, hired });
      }
    }
    if (state.auto) t.timer = win.setTimeout(() => autoMerge(t), 400);
  }

  /** Put one more agent to work. No effects; returns the thread or null when full. */
  function create() {
    if (destroyed || state.threads.length >= slots()) return null;
    const unlocked = contracts.filter((c) => c.unlock <= commits());
    const c = unlocked[Math.floor(random() * unlocked.length) % unlocked.length];
    const t = {
      id: "t" + Date.now().toString(36) + Math.floor(random() * 1e6).toString(36) + state.next.toString(36),
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
    sync();
    schedule(t, duration(0));
    juice.emit("thread-spawn", { n: t.n });
    return t;
  }
  function spawnMany(n) {
    const made = [];
    for (let i = 0; i < n; i++) {
      const t = create();
      if (!t) break;
      made.push(t);
    }
    if (!made.length) {
      if (!destroyed) {
        const buy = host?.querySelector('[data-th="buy"]');
        juice.float(buy || host, "SLOTS FULL", { tone: "loss", size: 22 });
        juice.pop(buy, "fx-pop");
        api.sound("error");
      }
      return 0;
    }
    if (made.length <= 5)
      for (const t of made) juice.burst(elFor(t), { count: 14, colors: ["#ff2bd6", "#19f0ff", "#ffe500"] });
    api.sound(made.length > 1 ? "riser" : "spin", made.length > 1 ? { length: 0.5 } : undefined);
    if (made.length > 1) {
      stick(`+${made.length} AGENTS`, { tone: "cyan", at: host, size: made.length > 20 ? 54 : 34 });
      if (made.length >= 20) {
        juice.shake(0.4);
        juice.say?.(`${made.length} agents`);
      }
    }
    juice.hype(Math.min(14, 1.5 * made.length));
    queueFit();
    return made.length;
  }
  const spawnMax = () => spawnMany(Math.max(1, slots() - state.threads.length));

  function buyOne() {
    if (state.bought >= MAX_SLOTS - BASE_SLOTS) return false;
    if (!api.spend(slotPrice(state.bought), `Agent slot #${slots() + 1}`)) return false;
    state.bought++;
    return true;
  }
  function buySlots(n = 1) {
    let got = 0;
    while (got < n && buyOne()) got++;
    const button = host?.querySelector(n > 1 ? '[data-th="buy10"]' : '[data-th="buy"]');
    if (!got) {
      if (state.bought < MAX_SLOTS - BASE_SLOTS) {
        juice.float(button || host, "BROKE", { tone: "loss", size: 22 });
        api.sound("error");
      }
      return 0;
    }
    persist();
    updateControls();
    api.sound("tierup");
    juice.burst(button, { count: 20 });
    if (got > 1) stick(`+${got} SLOTS`, { tone: "gold", at: button, size: 26 });
    if (slots() === MAX_SLOTS) {
      juice.banner?.({ kicker: "AGENT SLOTS", title: "100 AGENTS", sub: "this is fine", tone: "rainbow", duration: 1600 });
    }
    return got;
  }

  // ---------- merging ----------
  function mergeOne(t, position) {
    const mult = trainMultiplier(position);
    const amount = Math.round(t.reward * mult);
    const c = contractFor(t.contract);
    api.earn(amount, `Merged VIBE-${t.n} · ${c.short}${position ? ` · train ×${mult.toFixed(1)}` : ""}`);
    api.stat?.("commits");
    const el = elFor(t);
    stick("+" + fmt(amount), { tone: "gold", at: el, size: 18 + Math.min(16, position) });
    if (canCoin()) juice.coinsTo(el, amount);
    snd("commit", { pitch: 1 + Math.min(position, 20) * 0.05 });
    win.clearTimeout(t.timer);
    state.threads = state.threads.filter((x) => x !== t);
    sources.delete(t.id);
    drop(t);
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
        total += mergeOne(t, position++);
        save();
        // The train picks up speed.
        win.setTimeout(next, Math.max(70, 320 - position * 12));
      } else next();
    };
    const done = () => {
      training = false;
      updateControls();
      if (!position) return;
      trainPayout(position, total);
    };
    next();
    return queue.length + 1;
  }
  function trainPayout(cars, total) {
    juice.payout({
      from: host,
      amount: total,
      bet: Math.max(1, Math.round(total / 1.4)),
      big: cars >= 5 ? "mega" : cars >= 2 ? "big" : undefined,
      title: cars >= 2 ? `MERGE TRAIN ×${cars}` : undefined,
      tone: "green",
      label: cars >= 2 ? `${cars} agents merged` : "Agent merged",
    });
    if (cars >= 2) juice.say?.("merge train");
    juice.emit("merge-train", { count: cars, total });
  }

  // AUTO-MERGE: finished agents merge themselves. Merges less than 2s apart ride the same train.
  const train = { cars: 0, total: 0, timer: 0 };
  function autoMerge(t) {
    if (destroyed || !state.threads.includes(t) || t.status !== "review") return;
    if (training) {
      t.timer = win.setTimeout(() => autoMerge(t), 300);
      return;
    }
    train.total += mergeOne(t, train.cars);
    train.cars++;
    if ([10, 25, 50, 100, 250, 500, 1000].includes(train.cars)) {
      stick(`TRAIN ×${train.cars}`, { tone: "lime", at: host, size: 56 });
      juice.say?.(`train ${train.cars}`);
      juice.shake(0.3);
    }
    save();
    win.clearTimeout(train.timer);
    train.timer = win.setTimeout(endTrain, 2000);
    updateControls();
  }
  function endTrain() {
    const { cars, total } = train;
    train.cars = 0;
    train.total = 0;
    train.timer = 0;
    updateControls();
    if (cars >= 2 && !destroyed) trainPayout(cars, total);
  }

  function setHire(on) {
    state.hire = !!on;
    persist();
    updateControls();
  }
  function setAuto(on) {
    state.auto = !!on;
    persist();
    updateControls();
    if (state.auto)
      reviewing().forEach((t, i) => {
        win.clearTimeout(t.timer);
        t.timer = win.setTimeout(() => autoMerge(t), 150 + i * 90);
      });
  }

  // ---------- strip: built once, patched in place ----------
  const els = new Map(); // thread id → strip element (card or cell)
  const tiles = new Map(); // thread id → { el, pre } on the wall
  let listMode = "";
  let ui = null;
  const shown = new Map();
  function put(key, value, apply) {
    if (shown.get(key) === value) return;
    shown.set(key, value);
    apply(value);
  }
  const elFor = (t) => els.get(t.id) || null;
  const mode = () => (state.threads.length > SWARM_AT ? "swarm" : "cards");
  const barHtml = (t) =>
    phases
      .map((_, i) => `<i class="${i < t.phase ? "done" : i === t.phase && t.status !== "review" ? "now" : ""}"></i>`)
      .join("");

  function build() {
    if (!host) return;
    host.innerHTML = `<div class="th-controls">
        <button type="button" class="g-btn hot th-spawn" data-th="spawn" title="Spawn an agent (N)">+ SPAWN</button>
        <div class="th-col">
          <button type="button" class="g-btn ghost th-spawn5" data-th="spawn5" title="Spawn five (Shift+N)">+5</button>
          <button type="button" class="g-btn ghost th-max" data-th="max" title="Fill every free slot (X)">MAX</button>
          <button type="button" class="g-btn ice th-wall-btn" data-th="wall" title="Agent wall (W)">WALL</button>
        </div>
        <div class="th-col">
          <div class="th-slots"><b></b><span>AGENTS</span></div>
          <button type="button" class="g-btn volt th-buy" data-th="buy" title="Buy another agent slot">+SLOT <em></em></button>
          <button type="button" class="g-btn volt th-buy10" data-th="buy10" title="Buy up to ten slots">+10 <em></em></button>
        </div>
        <div class="th-col">
          <button type="button" class="th-toggle th-hire" data-th="hire" aria-pressed="false" title="Every agent that finishes hires two more"><i></i>AGENTS HIRE AGENTS</button>
          <button type="button" class="th-toggle th-auto" data-th="auto" aria-pressed="false" title="Finished agents merge themselves into one long train"><i></i>AUTO-MERGE</button>
          <span class="th-train" hidden></span>
        </div>
        <div class="th-col th-col-act">
          <button type="button" class="g-btn lime th-accept" data-th="accept" title="Accept all (M)" hidden></button>
          <button type="button" class="g-btn red th-feed" data-th="feed" hidden></button>
        </div>
      </div>
      <div class="th-list"></div>
      <div class="th-total" hidden><b></b><span>AGENTS</span><i></i></div>`;
    const q = (s) => host.querySelector(s);
    ui = {
      spawn: q(".th-spawn"),
      spawn5: q(".th-spawn5"),
      max: q(".th-max"),
      slots: q(".th-slots b"),
      buy: q(".th-buy"),
      buyPrice: q(".th-buy em"),
      buy10: q(".th-buy10"),
      buy10Price: q(".th-buy10 em"),
      hire: q(".th-hire"),
      auto: q(".th-auto"),
      train: q(".th-train"),
      accept: q(".th-accept"),
      feed: q(".th-feed"),
      act: q(".th-col-act"),
      list: q(".th-list"),
      total: q(".th-total"),
      totalN: q(".th-total b"),
      totalRate: q(".th-total i"),
    };
  }

  function updateControls() {
    if (!ui || destroyed) return;
    const n = state.threads.length;
    let ready = 0,
      starving = 0,
      owed = 0;
    for (const t of state.threads) {
      if (t.status === "review") owed += Math.round(t.reward * trainMultiplier(ready++));
      else if (t.status === "starving") starving++;
    }
    const full = n >= slots();
    const maxed = state.bought >= MAX_SLOTS - BASE_SLOTS;
    put("full", full, (v) => {
      ui.spawn.disabled = ui.spawn5.disabled = ui.max.disabled = v;
    });
    put("slots", `${n}/${slots()}`, () => {
      ui.slots.innerHTML = `${n}<small>/${slots()}</small>`;
      ui.totalN.innerHTML = `${n}<small>/${slots()}</small>`;
    });
    put("bought", state.bought, () => {
      ui.buy.toggleAttribute("hidden", maxed);
      ui.buy10.toggleAttribute("hidden", maxed);
      if (maxed) return;
      let ten = 0;
      const count = Math.min(10, MAX_SLOTS - BASE_SLOTS - state.bought);
      for (let i = 0; i < count; i++) ten += slotPrice(state.bought + i);
      ui.buyPrice.textContent = "−" + fmt(slotPrice(state.bought));
      ui.buy10Price.textContent = "−" + fmt(ten);
    });
    put("hire", state.hire, (v) => ui.hire.setAttribute("aria-pressed", String(v)));
    put("auto", state.auto, (v) => ui.auto.setAttribute("aria-pressed", String(v)));
    put("train", train.cars, (cars) => {
      ui.train.toggleAttribute("hidden", !cars);
      if (cars) ui.train.innerHTML = `TRAIN ×${cars}<em>pays ×${trainMultiplier(cars).toFixed(1)}</em>`;
    });
    // With AUTO-MERGE on, reviews are gone in 400ms: no button to chase.
    if (state.auto) ready = 0;
    put("accept", ready ? `${ready}/${owed}` : "", (v) => {
      ui.accept.toggleAttribute("hidden", !v);
      if (v) ui.accept.innerHTML = `ACCEPT ALL (${ready}) <em>+${fmt(owed)}</em>`;
    });
    put("feed", starving, (v) => {
      ui.feed.toggleAttribute("hidden", !v);
      if (v) ui.feed.textContent = `${v} STARVING · FEED`;
      host.classList.toggle("th-hungry", v > 0);
    });
    put("act", !!(ready || starving), (v) => ui.act.toggleAttribute("hidden", !v));
  }

  function cardInner(t) {
    const c = contractFor(t.contract);
    return `<span class="th-top"><b>VIBE-${t.n}</b><em class="th-chip">${statusLabel[t.status]}</em></span>
      <span class="th-title">${esc(c.short)}</span>
      <span class="th-bar">${barHtml(t)}</span>
      <code class="th-code">${esc(t.line || t.lines.at(-1) || "")}</code>
      <span class="th-foot"><span class="th-burn">−${fmt(t.spent)}</span>${t.status === "review" ? `<span class="th-reward">+${fmt(t.reward)}</span>` : `<span class="th-pct">${Math.round((t.phase / phases.length) * 100)}%</span>`}</span>`;
  }
  function paintEl(el, t) {
    const c = contractFor(t.contract);
    if (listMode === "cards") {
      el.className = `th-card th-${t.status}`;
      el.title = `${c.title} · “${t.brief}”`;
      el.innerHTML = cardInner(t);
    } else {
      el.className = `th-cell th-${t.status}`;
      el.style.setProperty("--p", (t.phase / phases.length).toFixed(2));
      el.title = `VIBE-${t.n} · ${c.short} · ${statusLabel[t.status]}${t.status === "review" ? ` +${fmt(t.reward)}` : ""}`;
    }
  }
  function makeEl(t) {
    const el = doc.createElement("button");
    el.type = "button";
    el.dataset.th = "card";
    el.dataset.id = t.id;
    paintEl(el, t);
    return el;
  }
  /** Reconcile the strip with the thread list (adds, mode switches). */
  function sync() {
    if (!ui || destroyed) return;
    const next = mode();
    if (next !== listMode) {
      listMode = next;
      els.clear();
      ui.list.replaceChildren();
      ui.list.classList.toggle("th-grid", next === "swarm");
      host.classList.toggle("th-swarm", next === "swarm");
      ui.total.toggleAttribute("hidden", next !== "swarm");
      queueFit();
    }
    if (!state.threads.length) {
      if (!ui.list.querySelector(".th-empty"))
        ui.list.innerHTML = `<div class="th-empty">0 agents running. <b>that's a choice.</b> ← spawn some</div>`;
    } else ui.list.querySelector(".th-empty")?.remove();
    for (const t of state.threads) {
      if (els.has(t.id)) continue;
      const el = makeEl(t);
      els.set(t.id, el);
      ui.list.append(el);
      if (wall?.isConnected) addTile(t);
    }
    updateControls();
  }
  /** A thread changed status or progress: patch its element, its tile and the controls. */
  function touch(t) {
    const el = els.get(t.id);
    if (el) paintEl(el, t);
    const tile = tiles.get(t.id);
    if (tile) paintTileHead(tile, t);
    updateControls();
  }
  /** A thread was merged: its element flies out. */
  function drop(t) {
    const el = els.get(t.id);
    els.delete(t.id);
    if (el) {
      el.classList.add(listMode === "cards" ? "th-merging" : "th-cell-out");
      el.disabled = true;
      win.setTimeout(() => el.remove(), listMode === "cards" ? 320 : 220);
    }
    const tile = tiles.get(t.id);
    tiles.delete(t.id);
    tile?.el.remove();
    if (wall?.isConnected) wall.classList.toggle("th-dense", state.threads.length > 12);
    sync();
    queueFit();
  }

  // Swarm cells shrink until every agent fits in the strip.
  let fitQueued = false;
  function fitCells() {
    fitQueued = false;
    if (!ui || destroyed || listMode !== "swarm") return;
    const w = ui.list.clientWidth,
      h = ui.list.clientHeight || 88;
    let size = 14;
    if (w > 0)
      for (size = 18; size > 6; size--) {
        const pitch = size + 2;
        if (Math.floor((w + 2) / pitch) * Math.floor((h + 2) / pitch) >= state.threads.length) break;
      }
    put("cell", size, (v) => ui.list.style.setProperty("--cell", v + "px"));
  }
  function queueFit() {
    if (fitQueued || !win.requestAnimationFrame) return;
    fitQueued = true;
    win.requestAnimationFrame(fitCells);
  }
  let observer = null;
  if (host && win.ResizeObserver) {
    observer = new win.ResizeObserver(queueFit);
  }

  // ---------- code streaming ----------
  let tickN = 0,
    rot = 0;
  function streamTick() {
    if (destroyed) return;
    tickN++;
    const cards = listMode === "cards";
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
      t.fresh = true;
      if (cards) {
        const code = els.get(t.id)?.querySelector(".th-code");
        if (code) code.textContent = t.line || t.lines.at(-1) || "";
      }
    }
    // The wall repaints a rotating handful of tiles per tick.
    if (wall?.isConnected && state.threads.length) {
      const total = state.threads.length;
      let painted = 0;
      for (let i = 0; i < total && painted < 16; i++) {
        const t = state.threads[(rot + i) % total];
        if (!t.fresh) continue;
        t.fresh = false;
        const tile = tiles.get(t.id);
        if (tile) {
          paintTileCode(tile, t);
          painted++;
        }
      }
      rot = (rot + 16) % total;
    }
    if (tickN % 8 === 0) {
      rate = rate * 0.5 + (spentWindow / 0.96) * 0.5;
      spentWindow = 0;
      if (ui) put("rate", Math.round(rate), (v) => (ui.totalRate.textContent = `${fmt(v)} tok/s`));
    }
  }
  const ticker = win.setInterval(streamTick, 120);

  // ---------- wall ----------
  const dense = () => state.threads.length > 12;
  function addTile(t) {
    const c = contractFor(t.contract);
    const el = doc.createElement("div");
    el.dataset.tile = t.id;
    el.dataset.th = "card";
    el.dataset.id = t.id;
    el.innerHTML = `<div class="th-tile-head"><b>VIBE-${t.n}</b><span>${esc(c.short)}</span><em class="th-chip"></em></div>
      <div class="th-bar"></div>
      <pre class="th-tile-code"></pre>
      <div class="th-tile-foot"><span>“${esc(t.brief)}”</span><span class="th-tile-spent"></span></div>`;
    const tile = {
      el,
      chip: el.querySelector(".th-chip"),
      bar: el.querySelector(".th-bar"),
      pre: el.querySelector("pre"),
      spent: el.querySelector(".th-tile-spent"),
    };
    tiles.set(t.id, tile);
    paintTileHead(tile, t);
    paintTileCode(tile, t);
    wall.append(el);
    wall.classList.toggle("th-dense", dense());
  }
  function paintTileHead(tile, t) {
    tile.el.className = `th-tile th-${t.status}`;
    tile.chip.textContent = t.status === "review" ? `+${fmt(t.reward)}` : statusLabel[t.status];
    tile.bar.innerHTML = barHtml(t);
    tile.spent.textContent = "−" + fmt(t.spent);
  }
  function paintTileCode(tile, t) {
    tile.pre.textContent = [...t.lines.slice(dense() ? -3 : -7), t.line + (t.status === "running" ? "▌" : "")].join("\n");
  }
  function buildWall() {
    tiles.clear();
    wall.replaceChildren();
    if (!state.threads.length) {
      wall.innerHTML = `<p class="th-empty">No agents. Press N. Then press it again.</p>`;
      return;
    }
    for (const t of state.threads) addTile(t);
  }
  function openWall() {
    wall = doc.createElement("div");
    wall.className = "th-wall";
    wall.addEventListener("click", onClick);
    const mine = wall;
    api.modal("Agent wall", wall, {
      wide: true,
      eyebrow: `ALL AGENTS · ${state.threads.length}/${slots()} SLOTS`,
      onClose: () => {
        if (wall === mine) {
          wall = null;
          tiles.clear();
        }
      },
    });
    buildWall();
  }

  // ---------- input ----------
  function onClick(e) {
    const b = e.target.closest("[data-th]");
    if (!b || b.disabled) return;
    switch (b.dataset.th) {
      case "spawn":
        spawnMany(1);
        break;
      case "spawn5":
        spawnMany(5);
        break;
      case "max":
        spawnMax();
        break;
      case "buy":
        buySlots(1);
        break;
      case "buy10":
        buySlots(10);
        break;
      case "wall":
        api.sound("whoosh");
        openWall();
        break;
      case "hire":
        setHire(!state.hire);
        api.sound(state.hire ? "tierup" : "click");
        if (state.hire) {
          juice.burst(b, { count: 20, colors: ["#ff2bd6", "#ffe500", "#fff"] });
          stick("AGENTS HIRE AGENTS", { tone: "pink", at: b, size: 30 });
          juice.say?.("agents hire agents");
        }
        break;
      case "auto":
        setAuto(!state.auto);
        api.sound(state.auto ? "tierup" : "click");
        if (state.auto) {
          juice.burst(b, { count: 20, colors: ["#b6ff2e", "#19f0ff", "#fff"] });
          stick("AUTO-MERGE", { tone: "lime", at: b, size: 30 });
        }
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
        const t = state.threads.find((x) => x.id === b.dataset.id);
        if (t?.status === "review") accept(t);
        else if (!b.closest(".th-wall")) openWall();
        break;
      }
    }
  }
  host?.addEventListener("click", onClick);
  function onKey(e) {
    if (e.defaultPrevented && !e.shiftKey) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.closest?.("input,textarea,select,[contenteditable]")) return;
    if (doc.querySelector("#game-dialog[open]")) return;
    if (doc.documentElement.hasAttribute("data-booting")) return;
    const running = doc.querySelector(".ide")?.dataset.state === "running";
    if (running && !e.shiftKey) return; // letters belong to the mash while VIBE-1 codes
    const k = e.key.toLowerCase();
    if (k === "n") spawnMany(e.shiftKey ? 5 : 1);
    else if (k === "x") spawnMax();
    else if (k === "m") accept();
    else if (k === "w") openWall();
    else return;
    e.preventDefault();
  }
  if (host) doc.addEventListener("keydown", onKey);

  // FEVER: everything already in flight gets there three times sooner.
  function onFloor(e) {
    if (destroyed || e.detail?.type !== "fever-start") return;
    const at = now();
    for (const t of state.threads)
      if (t.status !== "review" && t.due > at) schedule(t, (t.due - at) / 3);
  }
  win.addEventListener?.("grq:event", onFloor);
  win.addEventListener?.("pagehide", flush);

  // Restore: everything that was working keeps working.
  build();
  sync();
  if (observer && ui) observer.observe(ui.list);
  state.threads.forEach((t, i) => {
    if (t.status === "failed") t.status = "running";
    if (t.status !== "review") schedule(t, t.status === "starving" ? 600 : duration(t.phase));
    else if (state.auto) t.timer = win.setTimeout(() => autoMerge(t), 400 + i * 90);
    touch(t);
  });

  return {
    spawn: () => spawnMany(1),
    spawnMany,
    spawnMax,
    buySlot: () => buySlots(1) === 1,
    buySlots,
    accept: () => accept(),
    openWall,
    setHire,
    setAuto,
    update() {},
    get threads() {
      return state.threads;
    },
    get slots() {
      return slots();
    },
    get hire() {
      return state.hire;
    },
    get auto() {
      return state.auto;
    },
    get train() {
      return train.cars;
    },
    destroy() {
      flush();
      destroyed = true;
      win.clearInterval(ticker);
      win.clearTimeout(train.timer);
      observer?.disconnect();
      for (const t of state.threads) win.clearTimeout(t.timer);
      host?.removeEventListener("click", onClick);
      doc.removeEventListener("keydown", onKey);
      win.removeEventListener?.("grq:event", onFloor);
      win.removeEventListener?.("pagehide", flush);
    },
  };
}
