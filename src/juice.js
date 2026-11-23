// The juice engine. Every token that moves on the floor should be felt:
// particles, coin flights, screen shake, slam banners, a hype meter that heats
// the whole room, XP levels and a typing "power mode" for the agent desk.
//
// Game modules never require it. They call `juiceOf(api)`, which returns a
// silent stand-in when the engine is absent (tests, reduced environments).

const NOOP = () => {};
const quiet = new Proxy(
  {},
  {
    get: (_, key) =>
      key === "heat" || key === "tier" || key === "combo"
        ? 0
        : key === "enabled"
          ? false
          : key === "payout"
            ? () => 0
            : NOOP,
  },
);
export const juiceOf = (api) => api?.juice || quiet;

/** Broadcast a floor event (wins, rolls, merges…) for the chat, pings and vitals. */
export function emit(type, detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent("grq:event", { detail: { type, ...detail } }));
  } catch {
    /* No window (tests): nobody is listening anyway. */
  }
}

// --- Pure rules (tested) -----------------------------------------------------

export const hypeTiers = [
  { at: 0, name: "COLD", mult: 1, color: "#8b86a3" },
  { at: 20, name: "WARM", mult: 1.1, color: "#ffd174" },
  { at: 45, name: "ON FIRE", mult: 1.25, color: "#ff8a3d" },
  { at: 70, name: "UNHINGED", mult: 1.5, color: "#ff3d9a" },
  { at: 92, name: "TRANSCENDENT", mult: 2, color: "#7df9ff" },
];
export function tierFor(heat) {
  let tier = 0;
  for (let i = 0; i < hypeTiers.length; i++) if (heat >= hypeTiers[i].at) tier = i;
  return tier;
}
// XP needed to climb from `level` to `level + 1`.
export const xpToNext = (level) => Math.round(90 * level ** 1.42);
export function levelFor(xp) {
  let level = 1,
    left = Math.max(0, xp);
  while (left >= xpToNext(level) && level < 999) {
    left -= xpToNext(level);
    level++;
  }
  return { level, into: left, need: xpToNext(level) };
}
const ranks = [
  [1, "ROOKIE"],
  [3, "CARD COUNTER"],
  [5, "HIGH ROLLER"],
  [8, "WHALE"],
  [12, "CASINO GOBLIN"],
  [18, "10× ENGINEER"],
  [25, "HOUSE LEGEND"],
  [40, "THE HOUSE"],
];
export const rankFor = (level) => ranks.filter(([at]) => level >= at).at(-1)[1];
export const levelReward = (level) => 40 * level + 10 * level * level;
export function winTier(payout, bet) {
  if (!payout || payout <= bet) return payout ? "push" : "miss";
  const r = payout / Math.max(1, bet);
  if (r >= 30) return "jackpot";
  if (r >= 10) return "mega";
  if (r >= 4) return "big";
  return "nice";
}
export const comboWord = (n) =>
  n >= 200
    ? "GODLIKE"
    : n >= 120
      ? "TRANSCENDENT"
      : n >= 70
        ? "UNHINGED"
        : n >= 40
          ? "FERAL"
          : n >= 20
            ? "SICK"
            : n >= 8
              ? "NICE"
              : "";

// --- Engine --------------------------------------------------------------------

const asset = (file) => new URL("../assets/" + file, import.meta.url).href;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[(Math.random() * list.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PALETTE = ["#ffe066", "#ff5fa2", "#7df9ff", "#a6ff8f", "#ff8a3d", "#c38bff"];
const GOLD = ["#fff3b0", "#ffd166", "#ffb703", "#fff"];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

export function createJuice({ wallet, audio }) {
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let intensity = clamp(Number(wallet.get("fx.intensity", 2)) || 0, 0, 2);
  const scale = () => (reduced() ? 0 : [0.3, 0.7, 1][intensity]);

  // Top-layer host so effects render above an open <dialog>.
  const layer = el("div", "fx-layer");
  layer.setAttribute("popover", "manual");
  layer.setAttribute("aria-hidden", "true");
  const canvas = el("canvas", "fx-canvas");
  const floaters = el("div", "fx-floaters");
  const flashEl = el("div", "fx-flash");
  const bannerHost = el("div", "fx-banner-host");
  const comboEl = el("div", "fx-combo");
  layer.append(flashEl, canvas, floaters, comboEl, bannerHost);
  document.body.append(layer);
  const toasts = document.getElementById("toasts");
  // Toasts stay in their own live region for screen readers, but ride the top layer.
  const toastLayer = el("div", "fx-toast-layer");
  toastLayer.setAttribute("popover", "manual");
  if (toasts) {
    toastLayer.append(toasts);
    document.body.append(toastLayer);
  }
  function raise() {
    for (const node of [layer, toastLayer]) {
      if (!node.isConnected || !node.showPopover) continue;
      try {
        if (node.matches(":popover-open")) node.hidePopover();
        node.showPopover();
      } catch {
        /* Popover unsupported: effects still render under the dialog. */
      }
    }
  }
  raise();

  const ctx = canvas.getContext("2d");
  const coinImg = new Image();
  coinImg.src = asset("token.png");
  let W = 0,
    H = 0,
    dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();
  addEventListener("resize", resize);

  // ---------- particles ----------
  const parts = [];
  let frame = 0,
    last = 0;
  function wake() {
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function spawn(p) {
    if (parts.length > 900) parts.shift();
    parts.push(p);
    wake();
  }
  function centerOf(target) {
    if (!target) return { x: W / 2, y: H / 2 };
    if ("x" in target && "y" in target && !(target instanceof Element)) return target;
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /** kinds: spark | confetti | coin | ring | ember | star */
  function burst(target, opts = {}) {
    const s = scale();
    if (!s) return;
    const { x, y } = centerOf(target);
    const kind = opts.kind || "spark";
    const count = Math.round((opts.count ?? 24) * s);
    const colors = opts.colors || PALETTE;
    const speed = opts.speed ?? 1;
    if (kind === "ring") {
      spawn({ kind, x, y, r: 4, vr: 520 * speed, life: 0.45, age: 0, color: colors[0], w: opts.width || 4 });
      return;
    }
    for (let i = 0; i < count; i++) {
      const a = opts.angle !== undefined ? opts.angle + rand(-opts.spread, opts.spread) : rand(0, Math.PI * 2);
      const v = rand(120, 520) * speed;
      spawn({
        kind,
        x: x + rand(-(opts.jitter || 0), opts.jitter || 0),
        y: y + rand(-(opts.jitter || 0), opts.jitter || 0),
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - (kind === "confetti" ? 260 : kind === "coin" ? 380 : 80) * speed,
        g: kind === "confetti" ? 520 : kind === "ember" ? -60 : kind === "star" ? 0 : kind === "smoke" ? -40 : 1100,
        drag: kind === "confetti" ? 2.6 : kind === "star" ? 3.4 : kind === "smoke" ? 1.8 : 0.9,
        life: rand(0.5, 1.1) * (kind === "confetti" ? 2.2 : kind === "coin" ? 1.6 : kind === "smoke" ? 3.4 : 1),
        age: 0,
        size: (opts.size || (kind === "confetti" ? 7 : kind === "coin" ? 18 : 4)) * rand(0.7, 1.3),
        rot: rand(0, 6.28),
        vrot: rand(-14, 14),
        color: pick(colors),
      });
    }
  }

  // Coins fly from a source into the wallet chip. Each landing ticks the odometer.
  function coinsTo(source, amount = 10, opts = {}) {
    const target = document.querySelector(opts.target || "[data-wallet-target]");
    const s = scale();
    if (!target || !s) return;
    const from = centerOf(source);
    const n = clamp(Math.round(Math.log2(amount + 1) * 3.2 * s), 3, 60);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2),
        v = rand(180, 560);
      spawn({
        kind: "homing",
        x: from.x,
        y: from.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 250,
        age: 0,
        delay: 0.28 + i * 0.022,
        life: 4,
        size: rand(16, 24),
        rot: rand(0, 6.28),
        target,
        last: i === n - 1,
      });
    }
  }

  function tick(now) {
    try {
      step(now);
    } catch (error) {
      parts.length = 0;
      frame = 0;
      console.warn("FX frame dropped", error);
    }
  }
  function step(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) {
        parts.splice(i, 1);
        continue;
      }
      const t = p.age / p.life;
      if (p.kind === "ring") {
        p.r = Math.max(0, p.r + p.vr * dt);
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.w * (1 - t) + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      if (p.kind === "homing") {
        const r = p.target.getBoundingClientRect();
        const tx = r.left + Math.min(28, r.width / 2),
          ty = r.top + r.height / 2;
        if (p.age < p.delay) {
          p.vx *= 1 - 3 * dt;
          p.vy += 900 * dt;
          p.vy *= 1 - 2 * dt;
        } else {
          const dx = tx - p.x,
            dy = ty - p.y,
            d = Math.hypot(dx, dy) || 1;
          const pull = 5200 * Math.min(1, (p.age - p.delay) * 2.2);
          p.vx += (dx / d) * pull * dt;
          p.vy += (dy / d) * pull * dt;
          p.vx *= 1 - 4.2 * dt;
          p.vy *= 1 - 4.2 * dt;
          if (d < 22) {
            parts.splice(i, 1);
            land(p.target, p.last);
            continue;
          }
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += dt * 9;
        drawCoin(p.x, p.y, p.size, p.rot, 1);
        continue;
      }
      p.vx *= 1 - p.drag * dt;
      p.vy = p.vy * (1 - p.drag * dt) + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      const alpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      ctx.globalAlpha = alpha;
      if (p.kind === "coin") drawCoin(p.x, p.y, p.size, p.rot, alpha);
      else if (p.kind === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.rot * 1.7));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.kind === "smoke") {
        const r = p.size * (1 + t * 2.4);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(220,214,235,${0.22 * (1 - t)})`);
        g.addColorStop(1, "rgba(220,214,235,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "star") {
        ctx.fillStyle = p.color;
        const z = p.size * (1 - t * 0.6);
        ctx.fillRect(Math.round(p.x - z / 2), Math.round(p.y - z * 1.5), Math.ceil(z / 2) || 1, z * 3);
        ctx.fillRect(Math.round(p.x - z * 1.5), Math.round(p.y - z / 4), z * 3, Math.ceil(z / 2) || 1);
      } else {
        // Pixel sparks with a short streak, drawn square to match the sprite art.
        ctx.fillStyle = p.color;
        const z = Math.max(2, Math.round(p.size * (1 - t * 0.5)));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), z, z);
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillRect(Math.round(p.x - p.vx * 0.02), Math.round(p.y - p.vy * 0.02), z - 1, z - 1);
      }
    }
    ctx.globalAlpha = 1;
    stepShake(dt);
    frame = parts.length || trauma > 0 ? requestAnimationFrame(tick) : 0;
    if (!frame) ctx.clearRect(0, 0, W, H);
  }
  function drawCoin(x, y, size, rot, alpha) {
    if (!coinImg.complete) return;
    const squash = Math.abs(Math.cos(rot)) * 0.85 + 0.15;
    ctx.globalAlpha = alpha;
    ctx.drawImage(coinImg, Math.round(x - (size * squash) / 2), Math.round(y - size / 2), Math.round(size * squash), Math.round(size));
  }
  let landed = 0;
  function land(target, final) {
    landed++;
    if (landed % 2 === 0) audio.sound("coin", { pitch: 1 + Math.min(0.9, (landed % 24) * 0.04) });
    pop(target, "fx-bump");
    if (final) {
      landed = 0;
      pop(target, "fx-wallet-win");
    }
  }

  // ---------- shake (trauma model) ----------
  let trauma = 0,
    seed = 0;
  function shake(amount = 0.3) {
    if (!scale()) return;
    trauma = clamp(trauma + amount * scale(), 0, 1);
    wake();
  }
  function stepShake(dt) {
    const targets = [document.querySelector(".shell"), document.querySelector("#game-dialog[open] .dialog-inner")];
    if (trauma <= 0) {
      for (const t of targets) if (t && t.style.translate) t.style.translate = t.style.rotate = "";
      return;
    }
    trauma = Math.max(0, trauma - dt * 1.5);
    seed += dt * 38;
    const k = trauma * trauma;
    const x = 16 * k * Math.sin(seed * 1.7 + 0.3) * Math.cos(seed * 0.9),
      y = 12 * k * Math.sin(seed * 2.3 + 1.1),
      r = 0.9 * k * Math.sin(seed * 1.3);
    for (const t of targets) {
      if (!t) continue;
      t.style.translate = trauma ? `${x.toFixed(2)}px ${y.toFixed(2)}px` : "";
      t.style.rotate = trauma ? `${r.toFixed(3)}deg` : "";
    }
  }

  function flash(color = "#fff", strength = 0.35) {
    const s = reduced() ? 0.4 : scale();
    if (!s || !flashEl.animate) return;
    flashEl.style.background = color;
    flashEl.animate([{ opacity: strength * Math.min(1, s + 0.2) }, { opacity: 0 }], { duration: 420, easing: "ease-out" });
  }

  /** RGB-split screen glitch for big moments. */
  function glitch(ms = 360) {
    if (!scale()) return;
    const app = document.documentElement;
    app.classList.remove("fx-glitch");
    void app.offsetWidth;
    app.classList.add("fx-glitch");
    clearTimeout(glitch.t);
    glitch.t = setTimeout(() => app.classList.remove("fx-glitch"), ms);
  }
  function pop(node, cls = "fx-pop") {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    node.addEventListener("animationend", () => node.classList.remove(cls), { once: true });
  }

  function float(target, text, opts = {}) {
    const { x, y } = centerOf(target);
    const n = el("div", "fx-float " + (opts.tone || "gain"), text);
    n.style.left = x + (opts.dx || 0) + "px";
    n.style.top = y + (opts.dy || 0) + "px";
    if (opts.size) n.style.fontSize = opts.size + "px";
    n.style.setProperty("--drift", rand(-30, 30).toFixed(0) + "px");
    floaters.append(n);
    setTimeout(() => n.remove(), opts.tone === "loss" ? 1100 : 1500);
  }

  // ---------- announcer ----------
  let announcer = wallet.get("fx.announcer", true) !== false;
  let voice = null;
  function pickVoice() {
    const list = window.speechSynthesis?.getVoices?.() || [];
    voice =
      list.find((v) => /en[-_](US|GB)/i.test(v.lang) && /male|daniel|fred|alex|guy|david/i.test(v.name)) ||
      list.find((v) => /^en/i.test(v.lang)) ||
      null;
  }
  try {
    pickVoice();
    window.speechSynthesis?.addEventListener?.("voiceschanged", pickVoice);
  } catch {
    /* No speech: the announcer stays quiet. */
  }
  /** The hype man. Short, loud, interrupts himself. */
  function say(text, opts = {}) {
    const synth = window.speechSynthesis;
    if (!announcer || !audio.effects || !synth || !text) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try {
      if (opts.interrupt !== false) synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text).toLowerCase());
      if (voice) u.voice = voice;
      u.rate = opts.rate || 1.12;
      u.pitch = opts.pitch ?? 0.7;
      u.volume = 1;
      synth.speak(u);
    } catch {
      /* ignore */
    }
  }

  // ---------- banners ----------
  const queue = [];
  let showing = false;
  function banner(spec) {
    queue.push(spec);
    if (queue.length > 3) queue.splice(1, 1);
    if (!showing) nextBanner();
  }
  function nextBanner() {
    const spec = queue.shift();
    if (!spec) {
      showing = false;
      return;
    }
    showing = true;
    raise();
    const tone = spec.tone || "gold";
    const node = el("div", "fx-banner fx-tone-" + tone);
    const rays = el("div", "fx-rays");
    const kicker = el("small", "fx-banner-kicker", spec.kicker || "");
    const title = el("strong", "fx-banner-title");
    // Letters stagger in.
    [...spec.title].forEach((ch, i) => {
      const s = el("span", "", ch === " " ? " " : ch);
      s.style.setProperty("--i", i);
      title.append(s);
    });
    title.style.setProperty("--len", Math.max(4, spec.title.length));
    const amount = el("b", "fx-banner-amount", spec.amount ? "+0" : "");
    node.append(rays, kicker, title, amount);
    if (spec.sub) node.append(el("em", "fx-banner-sub", spec.sub));
    bannerHost.append(node);
    const dur = spec.duration || 2100;
    if (spec.amount) countUp(amount, spec.amount, Math.min(1400, dur * 0.6), spec.suffix || " TOK");
    if (spec.sound) audio.sound(spec.sound);
    if (spec.say !== false) say(spec.say || spec.title);
    setTimeout(() => {
      node.classList.add("out");
      setTimeout(() => {
        node.remove();
        nextBanner();
      }, 320);
    }, dur);
  }
  function countUp(node, total, ms, suffix = "") {
    const start = performance.now();
    let lastTick = 0;
    const fmt = (n) => "+" + Math.round(n).toLocaleString("en-US") + suffix;
    if (reduced()) {
      node.textContent = fmt(total);
      return;
    }
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      node.textContent = fmt(total * eased);
      if (now - lastTick > 55 && t < 1) {
        lastTick = now;
        audio.sound("tick", { pitch: 1 + eased });
      }
      if (t < 1) requestAnimationFrame(step);
      else pop(node, "fx-pop");
    };
    requestAnimationFrame(step);
  }

  // ---------- hype / heat ----------
  let heat = Number(wallet.get("fx.heat", 0)) || 0,
    lastHype = 0,
    shownTier = tierFor(heat);
  const root = document.documentElement;
  const hudFill = () => document.querySelector(".hud-hype-fill");
  const hudName = () => document.querySelector(".hud-hype-name");
  const hudMult = () => document.querySelector(".hud-hype-mult");
  function paintHeat() {
    const tier = tierFor(heat);
    root.style.setProperty("--heat", (heat / 100).toFixed(3));
    root.dataset.tier = tier;
    const fill = hudFill();
    if (fill) fill.style.width = heat.toFixed(1) + "%";
    const name = hudName();
    if (name) name.textContent = hypeTiers[tier].name;
    const mult = hudMult();
    if (mult) mult.textContent = "×" + hypeTiers[tier].mult;
    audio.setHeat?.(heat / 100);
    if (tier !== shownTier) {
      const up = tier > shownTier;
      shownTier = tier;
      emit("tier", { tier, name: hypeTiers[tier].name, up });
      if (up && tier >= 2) {
        banner({
          kicker: "HYPE METER",
          title: hypeTiers[tier].name,
          sub: "Wins pay ×" + hypeTiers[tier].mult + " while it lasts",
          tone: tier >= 4 ? "cyan" : tier >= 3 ? "pink" : "fire",
          duration: 1300,
          sound: "tierup",
        });
        burst(document.querySelector(".hud-hype"), { count: 30, colors: [hypeTiers[tier].color, "#fff"] });
      }
      pop(document.querySelector(".hud-hype"), "fx-pop");
    }
  }
  function hype(amount = 1) {
    heat = clamp(heat + amount, 0, 100);
    lastHype = performance.now();
    paintHeat();
  }
  setInterval(() => {
    if (performance.now() - lastHype > 2200 && heat > 0) {
      heat = Math.max(0, heat - (heat > 70 ? 1.6 : 1.1));
      paintHeat();
    }
    const rounded = Math.round(heat);
    if (rounded !== savedHeat) wallet.set("fx.heat", (savedHeat = rounded));
  }, 250);
  let savedHeat = Math.round(heat);

  // ---------- XP / levels ----------
  let xpTotal = Number(wallet.get("fx.xp", 0)) || 0;
  let level = levelFor(xpTotal).level;
  function paintXp() {
    const p = levelFor(xpTotal);
    const ring = document.querySelector(".hud-level");
    if (!ring) return;
    ring.style.setProperty("--p", (p.into / p.need).toFixed(3));
    ring.querySelector("b").textContent = p.level;
    document.querySelector(".hud-xp")?.style.setProperty("--p", (p.into / p.need).toFixed(3));
    const rank = document.getElementById("hud-rank");
    if (rank) rank.textContent = rankFor(p.level);
    ring.title = `Level ${p.level} · ${Math.round(p.into)}/${p.need} XP`;
  }
  function xp(amount) {
    if (!(amount > 0)) return;
    xpTotal += amount;
    wallet.set("fx.xp", Math.round(xpTotal));
    const p = levelFor(xpTotal);
    paintXp();
    while (p.level > level) {
      level++;
      const reward = levelReward(level);
      wallet.earn(reward, `Level ${level} reached`);
      emit("levelup", { level, reward });
      banner({ kicker: "LEVEL UP", title: "LEVEL " + level, amount: reward, sub: "The house respects your commitment", tone: "cyan", sound: "levelup", duration: 2200 });
      const ring = document.querySelector(".hud-level");
      burst(ring, { kind: "star", count: 26, colors: ["#7df9ff", "#fff", "#c38bff"] });
      coinsTo(ring, reward);
      shake(0.35);
    }
  }

  // ---------- combo ----------
  let combo = 0,
    comboTimer = 0;
  function bumpCombo(target, opts = {}) {
    combo++;
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      if (combo >= 8) {
        comboEl.classList.add("drop");
        setTimeout(() => comboEl.classList.remove("show", "drop"), 300);
      } else comboEl.classList.remove("show");
      combo = 0;
    }, opts.window || 1400);
    if (combo < 3) return combo;
    const { x, y } = centerOf(target);
    comboEl.style.left = clamp(x, 80, W - 80) + "px";
    comboEl.style.top = clamp(y - 46, 70, H - 40) + "px";
    const word = comboWord(combo);
    comboEl.innerHTML = `<b>×${combo}</b>${word ? `<span>${word}</span>` : ""}`;
    comboEl.dataset.level = combo >= 70 ? 3 : combo >= 20 ? 2 : combo >= 8 ? 1 : 0;
    comboEl.classList.add("show");
    pop(comboEl, "fx-pop");
    if ([8, 20, 40, 70, 120, 200].includes(combo)) {
      audio.sound("tierup");
      burst({ x, y: y - 40 }, { kind: "star", count: 18 });
      flash(combo >= 70 ? "#ff3d9a" : "#7df9ff", 0.12);
    }
    return combo;
  }

  // ---------- power mode (typing) ----------
  const powered = new WeakSet();
  function caretXY(area) {
    const r = area.getBoundingClientRect();
    const cs = getComputedStyle(area);
    const mirror = el("div");
    for (const prop of ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingLeft", "paddingRight", "borderTopWidth", "borderLeftWidth", "boxSizing", "whiteSpace", "wordWrap", "tabSize"])
      mirror.style[prop] = cs[prop];
    Object.assign(mirror.style, { position: "fixed", visibility: "hidden", left: r.left + "px", top: r.top + "px", width: r.width + "px", whiteSpace: "pre-wrap", wordWrap: "break-word", overflow: "hidden" });
    mirror.textContent = area.value.slice(0, area.selectionEnd);
    const mark = el("span", "", "|");
    mirror.append(mark);
    document.body.append(mirror);
    const m = mark.getBoundingClientRect();
    mirror.remove();
    return { x: m.left, y: m.top + m.height / 2 - area.scrollTop };
  }
  function powerMode(area) {
    if (!area || powered.has(area)) return;
    powered.add(area);
    area.classList.add("fx-powered");
    area.addEventListener("input", (e) => {
      const del = e.inputType?.startsWith("delete");
      const at = caretXY(area);
      const n = bumpCombo(at, { window: 1600 });
      const tier = tierFor(heat);
      burst(at, {
        count: 6 + Math.min(14, n / 6),
        speed: 0.55 + Math.min(0.8, n / 120),
        colors: del ? ["#ff4d6d", "#ff8fa3", "#fff"] : n > 40 ? ["#7df9ff", "#ff5fa2", "#ffe066", "#fff"] : [hypeTiers[tier].color, "#fff", "#ffe066"],
        size: 3,
      });
      if (n % 10 === 0) burst(at, { kind: "ring", colors: [n > 40 ? "#ff5fa2" : "#7df9ff"] });
      shake(Math.min(0.14, 0.04 + n / 1500));
      audio.sound(del ? "keydel" : "key", { pitch: 1 + Math.min(1.5, (n % 48) / 24) });
      hype(0.55);
      xp(0.4);
      pop(area, "fx-type");
    });
  }

  // ---------- money moments ----------
  /** A win was revealed. Returns the hype bonus actually credited. */
  function payout({ from, amount, bet = amount, label = "Win", big, title, tone, say: line } = {}) {
    if (!(amount > 0)) return 0;
    const tierName = big || winTier(amount, bet);
    const ht = tierFor(heat);
    const mult = hypeTiers[ht].mult;
    const bonus = tierName === "push" ? 0 : Math.round(amount * (mult - 1));
    if (bonus > 0) wallet.earn(bonus, `Hype bonus ×${mult} · ${label}`);
    const total = amount + bonus;
    const at = centerOf(from);
    float(at, "+" + total.toLocaleString("en-US"), { tone: tierName === "push" ? "push" : "gain", size: tierName === "nice" || tierName === "push" ? 30 : 44 });
    if (bonus) float(at, `HYPE ×${mult}`, { tone: "bonus", dy: 40 });
    coinsTo(from, total);
    emit("win", { amount: total, tier: tierName, source: label, bonus });
    const heatGain = { push: 2, nice: 7, big: 16, mega: 28, jackpot: 45 }[tierName] || 3;
    hype(heatGain);
    xp(Math.sqrt(total) * 2);
    if (tierName === "push") {
      burst(at, { count: 10, colors: ["#fff", "#ffe066"] });
      return bonus;
    }
    burst(at, { count: 34, colors: GOLD });
    burst(at, { kind: "ring", colors: ["#ffe066"] });
    if (tierName === "nice") {
      shake(0.18);
      audio.sound("win");
      return bonus;
    }
    burst(at, { kind: "coin", count: tierName === "big" ? 22 : 50, speed: 1.2 });
    burst(at, { kind: "confetti", count: tierName === "big" ? 50 : 140, speed: 1.3 });
    shake(tierName === "big" ? 0.45 : 0.8);
    glitch(tierName === "big" ? 220 : 520);
    flash(tierName === "jackpot" ? "#fff3b0" : "#ffd166", tierName === "big" ? 0.18 : 0.4);
    const titles = { big: "BIG WIN", mega: "MEGA WIN", jackpot: "JACKPOT" };
    banner({
      kicker: label.toUpperCase(),
      title: title || titles[tierName],
      amount: total,
      sub: bonus ? `includes ×${mult} hype bonus` : "",
      tone: tone || (tierName === "jackpot" ? "rainbow" : tierName === "mega" ? "pink" : "gold"),
      say: line,
      sound: tierName === "big" ? "bigwin" : "jackpot",
      duration: tierName === "big" ? 1700 : 2600,
    });
    if (tierName !== "big") {
      setTimeout(() => {
        burst({ x: W * 0.2, y: H * 0.35 }, { kind: "confetti", count: 70 });
        burst({ x: W * 0.8, y: H * 0.35 }, { kind: "confetti", count: 70 });
        audio.sound("boom");
      }, 380);
    }
    return bonus;
  }
  function loss(from, amount, source = "") {
    if (amount) float(from, "−" + amount.toLocaleString("en-US"), { tone: "loss", size: 22 });
    emit("loss", { amount, source });
    hype(1.5);
  }
  function spend(amount) {
    xp(amount / 6);
  }

  // ---------- wallet odometer ----------
  let shown = null,
    goal = 0,
    odoFrame = 0;
  function walletTo(value) {
    goal = value;
    const nodes = document.querySelectorAll("[data-wallet]");
    if (shown === null || reduced()) {
      shown = value;
      nodes.forEach((n) => (n.textContent = value.toLocaleString("en-US")));
      return;
    }
    if (odoFrame) return;
    const from = shown,
      t0 = performance.now();
    const dur = clamp(Math.abs(goal - from) * 0.8, 260, 1300);
    const dir = goal > from ? "up" : "down";
    nodes.forEach((n) => n.closest(".wallet-chip, .wallet")?.setAttribute("data-dir", dir));
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      shown = Math.round(from + (goal - from) * (1 - (1 - t) ** 3));
      nodes.forEach((n) => (n.textContent = shown.toLocaleString("en-US")));
      if (t < 1 && shown !== goal) odoFrame = requestAnimationFrame(step);
      else {
        odoFrame = 0;
        shown = goal;
        nodes.forEach((n) => (n.textContent = goal.toLocaleString("en-US")));
        setTimeout(() => nodes.forEach((n) => n.closest(".wallet-chip, .wallet")?.removeAttribute("data-dir")), 500);
      }
    };
    odoFrame = requestAnimationFrame(step);
  }

  function setIntensity(level) {
    intensity = clamp(level, 0, 2);
    wallet.set("fx.intensity", intensity);
    root.dataset.intensity = intensity;
  }
  root.dataset.intensity = intensity;

  // Paint once the HUD exists.
  queueMicrotask(() => {
    paintHeat();
    paintXp();
  });

  return {
    enabled: true,
    glitch,
    emit,
    say,
    get announcer() {
      return announcer;
    },
    setAnnouncer(on) {
      announcer = !!on;
      wallet.set("fx.announcer", announcer);
      if (announcer) say("let's go");
      else window.speechSynthesis?.cancel?.();
    },
    burst,
    coinsTo,
    shake,
    flash,
    pop,
    float,
    banner,
    hype,
    xp,
    combo: bumpCombo,
    powerMode,
    payout,
    loss,
    spend,
    walletTo,
    raise,
    paintXp,
    get heat() {
      return heat;
    },
    get tier() {
      return tierFor(heat);
    },
    get intensity() {
      return intensity;
    },
    setIntensity,
    get reduced() {
      return reduced();
    },
  };
}
