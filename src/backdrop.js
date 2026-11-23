// The club behind the casino: a neon floor grid, haze and sweeping lasers.
// More hype means more beams, faster sweeps and hotter colours. Every kick
// drum flares the whole rig. Drawn at half resolution for speed.

const SCALE = 0.5;
const hues = [318, 28, 54, 84, 186, 262]; // pink, orange, yellow, lime, cyan, violet

export function startBackdrop(getHeat) {
  const canvas = document.createElement("canvas");
  canvas.className = "backdrop";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d", { alpha: false });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let w = 0,
    h = 0,
    raf = 0,
    t = 0,
    last = performance.now(),
    travel = 0,
    flare = 0,
    hueShift = 0;

  function resize() {
    w = Math.ceil(innerWidth * SCALE);
    h = Math.ceil(innerHeight * SCALE);
    canvas.width = w;
    canvas.height = h;
    if (reduced.matches) draw(0);
  }
  function draw(dt) {
    const heat = Math.max(0, Math.min(1, getHeat()));
    t += dt;
    flare = Math.max(0, flare - dt * 3.2);
    hueShift += dt * (8 + heat * 70);
    travel += dt * (0.4 + heat * heat * 3);
    const horizon = Math.round(h * 0.58);

    ctx.globalCompositeOperation = "source-over";
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#06030c");
    sky.addColorStop(0.58, `hsl(${(285 + hueShift * 0.2) % 360} 70% ${8 + heat * 8 + flare * 6}%)`);
    sky.addColorStop(1, "#05030a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    // Haze blobs drifting.
    for (let i = 0; i < 3; i++) {
      const x = w * (0.5 + 0.42 * Math.sin(t * 0.13 + i * 2.1));
      const y = h * (0.35 + 0.18 * Math.cos(t * 0.17 + i));
      const r = Math.max(w, h) * (0.35 + heat * 0.15);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const hue = (hues[(i * 2) % hues.length] + hueShift) % 360;
      g.addColorStop(0, `hsla(${hue} 100% 55% / ${0.08 + heat * 0.1 + flare * 0.06})`);
      g.addColorStop(1, "hsla(0 0% 0% / 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // Lasers fan out from three emitters on the floor line.
    const beams = 3 + Math.round(heat * 9);
    const spread = 0.9 + heat * 0.5;
    const speed = 0.35 + heat * 1.8;
    for (let i = 0; i < beams; i++) {
      const emitter = [w * 0.12, w * 0.5, w * 0.88][i % 3];
      const phase = i * 1.7;
      const angle = -Math.PI / 2 + Math.sin(t * speed + phase) * spread;
      const len = Math.hypot(w, h);
      const hue = (hues[i % hues.length] + hueShift) % 360;
      const a = (0.1 + heat * 0.22) * (0.7 + 0.3 * Math.sin(t * 3 + i)) + flare * 0.35;
      ctx.strokeStyle = `hsla(${hue} 100% 60% / ${a})`;
      ctx.lineWidth = 1 + heat * 1.5 + flare * 2;
      ctx.beginPath();
      ctx.moveTo(emitter, horizon);
      ctx.lineTo(emitter + Math.cos(angle) * len, horizon + Math.sin(angle) * len);
      ctx.stroke();
      ctx.strokeStyle = `hsla(${hue} 100% 70% / ${a * 0.35})`;
      ctx.lineWidth = 6 + heat * 8;
      ctx.stroke();
    }

    // Floor grid rushing toward you.
    ctx.globalCompositeOperation = "source-over";
    const floorHue = (318 + hueShift) % 360;
    ctx.strokeStyle = `hsla(${floorHue} 100% 60% / ${0.22 + heat * 0.3 + flare * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const depth = h - horizon;
    const rows = 16;
    const p = travel % 1;
    for (let i = 0; i < rows; i++) {
      const z = (i + 1 - p) / rows;
      const y = horizon + depth * z * z;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    for (let i = -24; i <= 24; i++) {
      ctx.moveTo(w / 2 + (i * w) / 240, horizon);
      ctx.lineTo(w / 2 + (i * w) / 18, h);
    }
    ctx.stroke();
    ctx.fillStyle = `hsla(${floorHue} 100% 65% / ${0.5 + flare * 0.5})`;
    ctx.fillRect(0, horizon, w, 1);
  }
  function loop(now) {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
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
  return {
    stop,
    /** Kick drum: flare the rig. */
    kick(power = 1) {
      flare = Math.min(1.4, flare + power);
    },
  };
}
