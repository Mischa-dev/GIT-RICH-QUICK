// A low-resolution synthwave floor painted behind the casino. It is drawn at a
// quarter of the screen size and scaled up with pixelated sampling so it matches
// the sprite art. Hype speeds the grid up, shifts the palette and, at the top
// tier, turns the stars into a warp tunnel.

const PIXEL = 4;
const lerp = (a, b, t) => a + (b - a) * t;
function mix(c1, c2, t) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1),
    b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;
}
// Grid/sun colour stops by heat.
const stops = [
  ["#3a1d5c", "#7a3cff", "#ff5fa2"], // cold: violet
  ["#46205e", "#ff5fa2", "#ffb03a"], // warm: pink/orange
  ["#5a1a3a", "#ff7a2f", "#ffe066"], // fire
  ["#4a0c3c", "#ff2fa0", "#7df9ff"], // unhinged
  ["#082a44", "#3ff7ff", "#ffffff"], // transcendent
];

export function startBackdrop(getHeat) {
  const canvas = document.createElement("canvas");
  canvas.className = "backdrop";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d", { alpha: false });
  let w = 0,
    h = 0,
    stars = [],
    raf = 0,
    t = 0,
    last = performance.now(),
    travel = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function resize() {
    w = Math.ceil(innerWidth / PIXEL);
    h = Math.ceil(innerHeight / PIXEL);
    canvas.width = w;
    canvas.height = h;
    stars = Array.from({ length: Math.round((w * h) / 260) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.62,
      z: Math.random(),
      tw: Math.random() * 6.28,
    }));
    if (reduced.matches) draw(0);
  }
  function palette(heat) {
    const f = Math.min(stops.length - 1.001, heat * (stops.length - 1));
    const i = Math.floor(f),
      k = f - i;
    return stops[i].map((c, j) => mix(c, stops[i + 1][j], k));
  }
  function draw(dt) {
    const heat = Math.max(0, Math.min(1, getHeat()));
    const speed = 0.35 + heat * heat * 3.6;
    t += dt;
    travel += dt * speed;
    const [deep, mid, hot] = palette(heat);
    const horizon = Math.round(h * 0.6);

    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#07050d");
    sky.addColorStop(0.55, "#0f0819");
    sky.addColorStop(1, deep);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);

    // Stars, becoming warp streaks as heat peaks.
    const warp = Math.max(0, (heat - 0.7) / 0.3);
    const cx = w / 2,
      cy = horizon * 0.55;
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + s.z) + s.tw));
      ctx.fillStyle = s.z > 0.85 ? hot : "#e8e2ff";
      ctx.globalAlpha = a * (0.4 + s.z * 0.6);
      if (warp > 0) {
        const dx = s.x - cx,
          dy = s.y - cy;
        const len = 1 + warp * 6 * s.z;
        s.x += dx * dt * warp * 1.4 * (0.3 + s.z);
        s.y += dy * dt * warp * 1.4 * (0.3 + s.z);
        if (s.x < 0 || s.x > w || s.y < 0 || s.y > horizon) {
          s.x = cx + (Math.random() - 0.5) * w * 0.3;
          s.y = cy + (Math.random() - 0.5) * horizon * 0.3;
        }
        const d = Math.hypot(dx, dy) || 1;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.max(1, Math.round((dx / d) * len)), Math.max(1, Math.round((dy / d) * len)));
      } else ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    }
    ctx.globalAlpha = 1;

    // Striped sun sinking into the horizon.
    const r = Math.round(Math.min(w, h) * (0.2 + heat * 0.05));
    const sx = Math.round(w / 2),
      sy = horizon - Math.round(r * 0.35);
    const sun = ctx.createLinearGradient(0, sy - r, 0, sy + r);
    sun.addColorStop(0, hot);
    sun.addColorStop(1, mid);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, horizon);
    ctx.clip();
    ctx.fillStyle = sun;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    // Scanline cuts through the lower half, scrolling down.
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0f0819";
    const scroll = (t * 6 * speed) % 6;
    for (let y = sy; y < sy + r; y += 6) {
      const gap = Math.max(1, Math.round(((y - sy) / r) * 4));
      ctx.fillRect(sx - r, Math.round(y + scroll), r * 2, gap);
    }
    ctx.restore();

    // Floor.
    const floor = ctx.createLinearGradient(0, horizon, 0, h);
    floor.addColorStop(0, deep);
    floor.addColorStop(1, "#05040a");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);
    // Horizon glow line.
    ctx.fillStyle = hot;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, horizon, w, 1);
    ctx.globalAlpha = 1;

    // Perspective grid.
    ctx.strokeStyle = mid;
    ctx.lineWidth = 1;
    const depth = h - horizon;
    ctx.beginPath();
    const rows = 14;
    const phase = travel % 1;
    for (let i = 0; i < rows; i++) {
      const z = (i + 1 - phase) / rows; // 0 near horizon .. 1 near viewer
      const y = horizon + Math.round(depth * z * z);
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    const cols = 22;
    for (let i = -cols; i <= cols; i++) {
      const x0 = w / 2 + (i * w) / (cols * 0.9);
      ctx.moveTo(w / 2 + (i * w) / (cols * 9), horizon);
      ctx.lineTo(x0, h);
    }
    ctx.globalAlpha = 0.55 + heat * 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (raf || reduced.matches || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  resize();
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduced.addEventListener?.("change", () => (reduced.matches ? (stop(), draw(0)) : start()));
  draw(0);
  start();
  return { stop };
}
