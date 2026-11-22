const phrases = {
  click: [
    [420, 0.04],
    [640, 0.04],
  ],
  tick: [[780, 0.027]],
  cast: [
    [820, 0.07],
    [530, 0.08],
    [330, 0.12],
  ],
  spin: [
    [155, 0.07],
    [220, 0.07],
    [330, 0.07],
    [440, 0.08],
  ],
  error: [
    [165, 0.12],
    [123, 0.18],
  ],
  win: [
    [523, 0.07],
    [659, 0.07],
    [784, 0.08],
    [1047, 0.23],
  ],
  bigwin: [
    [523, 0.06],
    [659, 0.06],
    [784, 0.08],
    [1047, 0.09],
    [988, 0.07],
    [1047, 0.08],
    [1319, 0.3],
  ],
  lose: [
    [277, 0.08],
    [220, 0.12],
  ],
  commit: [
    [392, 0.07],
    [494, 0.07],
    [587, 0.1],
    [784, 0.16],
    [988, 0.23],
  ],
};
export function soundSystem(store) {
  let ctx,
    output,
    timer,
    next,
    beat = 0;
  let effects = store.get("sound.enabled", true),
    music = store.get("music.enabled", true);
  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      output = ctx.createGain();
      output.gain.value = 0.34;
      output.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (music && !timer && !document.hidden) start();
  }
  function note(hz, t, length, amplitude, wave = "triangle", slide = 0) {
    if (!ctx) return;
    const osc = ctx.createOscillator(),
      amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(hz, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + length);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(amplitude, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(amp);
    amp.connect(output);
    osc.start(t);
    osc.stop(t + length + 0.012);
  }
  function sound(key) {
    if (!effects) return;
    init();
    if (!ctx) return;
    let at = ctx.currentTime;
    for (const [hz, len] of phrases[key] || phrases.click) {
      note(hz, at, len, 0.15, key === "tick" ? "sine" : "triangle");
      at += len * 0.84;
    }
  }
  const bass = [110, 110, 87.307, 97.999],
    lead = [0, 7, 12, 15, 7, 10, 14, 7, 0, 3, 10, 12, 7, 15, 12, 10];
  function pump() {
    const cutoff = ctx.currentTime + 0.16;
    if (next < ctx.currentTime - 0.4) next = ctx.currentTime + 0.02;
    while (next < cutoff) {
      const step = beat % 16,
        root = bass[Math.floor(beat / 16) % 4];
      if (step % 4 === 0 || step === 11)
        note(root * (step === 11 ? 2 : 1), next, 0.18, 0.105, "triangle");
      if (step % 4 === 0) note(115, next, 0.105, 0.17, "sine", 39);
      if (step % 4 === 2) note(1830, next, 0.026, 0.025, "square", 580);
      if (step % 2 === 1 || step === 8)
        note(2 * root * 2 ** (lead[step] / 12), next, 0.09, 0.035, "square");
      if (step === 4 || step === 12)
        note(255, next, 0.07, 0.045, "triangle", 117);
      next += 60 / 126 / 4;
      beat++;
    }
  }
  function start() {
    if (!ctx || timer) return;
    next = ctx.currentTime + 0.02;
    pump();
    timer = setInterval(pump, 60);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (music && ctx) start();
  });
  return {
    init,
    sound,
    get effects() {
      return effects;
    },
    get music() {
      return music;
    },
    toggleEffects() {
      effects = !effects;
      store.set("sound.enabled", effects);
      if (effects) sound("win");
    },
    toggleMusic() {
      music = !music;
      store.set("music.enabled", music);
      if (music) {
        init();
        start();
      } else stop();
    },
  };
}
