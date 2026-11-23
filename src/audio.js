// All audio is synthesized. Effects go straight to the master; the music runs
// through a low-pass filter that opens with the hype meter, so the floor sounds
// like a muffled lounge when cold and a full club when you are on a heater.

// [hz, seconds, wave = "triangle", slideTo = 0, amp = 0.15]
const phrases = {
  click: [
    [420, 0.035, "square", 0, 0.07],
    [840, 0.03, "square", 0, 0.05],
  ],
  tick: [[1320, 0.022, "square", 0, 0.045]],
  key: [[660, 0.03, "square", 0, 0.05]],
  keydel: [[220, 0.04, "square", 110, 0.05]],
  coin: [
    [1568, 0.035, "square", 0, 0.06],
    [2093, 0.09, "square", 0, 0.06],
  ],
  thunk: [
    [180, 0.09, "square", 60, 0.16],
    [90, 0.08, "sine", 40, 0.22],
  ],
  cast: [
    [820, 0.07],
    [530, 0.08],
    [330, 0.12],
  ],
  spin: [
    [155, 0.05, "square", 0, 0.08],
    [220, 0.05, "square", 0, 0.08],
    [330, 0.05, "square", 0, 0.08],
    [440, 0.05, "square", 0, 0.08],
    [660, 0.08, "square", 0, 0.08],
  ],
  error: [
    [165, 0.12, "sawtooth", 0, 0.1],
    [123, 0.18, "sawtooth", 0, 0.1],
  ],
  win: [
    [523, 0.06],
    [659, 0.06],
    [784, 0.07],
    [1047, 0.2],
  ],
  bigwin: [
    [523, 0.06, "square", 0, 0.09],
    [659, 0.06, "square", 0, 0.09],
    [784, 0.07, "square", 0, 0.09],
    [1047, 0.08, "square", 0, 0.09],
    [988, 0.06, "square", 0, 0.09],
    [1047, 0.07, "square", 0, 0.09],
    [1319, 0.3, "square", 0, 0.1],
  ],
  jackpot: [
    [523, 0.05, "square", 0, 0.1],
    [659, 0.05, "square", 0, 0.1],
    [784, 0.05, "square", 0, 0.1],
    [1047, 0.05, "square", 0, 0.1],
    [784, 0.05, "square", 0, 0.1],
    [1047, 0.05, "square", 0, 0.1],
    [1319, 0.05, "square", 0, 0.1],
    [1568, 0.05, "square", 0, 0.1],
    [2093, 0.45, "square", 0, 0.11],
  ],
  lose: [
    [277, 0.08],
    [220, 0.14, "triangle", 180],
  ],
  nearmiss: [
    [392, 0.08, "square", 0, 0.08],
    [370, 0.08, "square", 0, 0.08],
    [349, 0.3, "square", 300, 0.08],
  ],
  commit: [
    [392, 0.06, "square", 0, 0.09],
    [494, 0.06, "square", 0, 0.09],
    [587, 0.08, "square", 0, 0.09],
    [784, 0.12, "square", 0, 0.09],
    [988, 0.22, "square", 0, 0.1],
  ],
  step: [
    [784, 0.04, "square", 0, 0.06],
    [1175, 0.08, "square", 0, 0.06],
  ],
  levelup: [
    [523, 0.06, "square", 0, 0.09],
    [784, 0.06, "square", 0, 0.09],
    [1047, 0.06, "square", 0, 0.09],
    [1568, 0.06, "square", 0, 0.09],
    [2093, 0.35, "triangle", 0, 0.12],
  ],
  tierup: [
    [440, 0.05, "sawtooth", 0, 0.06],
    [660, 0.05, "sawtooth", 0, 0.06],
    [880, 0.2, "sawtooth", 1760, 0.07],
  ],
  heartbeat: [
    [70, 0.1, "sine", 40, 0.35],
    [62, 0.14, "sine", 36, 0.3],
  ],
  boom: [[140, 0.7, "sine", 28, 0.45]],
  mash: [[520, 0.03, "square", 1040, 0.05]],
};

export function soundSystem(store) {
  let ctx,
    output,
    musicBus,
    filter,
    noiseBuf,
    timer,
    next,
    beat = 0,
    heat = 0;
  let effects = store.get("sound.enabled", true),
    music = store.get("music.enabled", true);
  // Browsers refuse audio before the first gesture; don't even try.
  const blocked = () =>
    !ctx && navigator.userActivation && !navigator.userActivation.hasBeenActive;
  function init() {
    if (blocked()) return;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      output = ctx.createGain();
      output.gain.value = 0.34;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 6;
      output.connect(comp);
      comp.connect(ctx.destination);
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 2;
      musicBus = ctx.createGain();
      musicBus.gain.value = 1;
      musicBus.connect(filter);
      filter.connect(output);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      applyHeat();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (music && !timer && !document.hidden) start();
  }
  function applyHeat() {
    if (!filter) return;
    const hz = 900 * Math.pow(20, heat); // 900 Hz → 18 kHz
    filter.frequency.setTargetAtTime(hz, ctx.currentTime, 0.25);
  }
  function note(hz, t, length, amplitude, wave = "triangle", slide = 0, dest = output) {
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
    amp.connect(dest);
    osc.start(t);
    osc.stop(t + length + 0.012);
  }
  function noise(t, length, amplitude, hz = 6000, dest = output, type = "highpass") {
    if (!ctx) return;
    const src = ctx.createBufferSource(),
      f = ctx.createBiquadFilter(),
      amp = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = type;
    f.frequency.value = hz;
    amp.gain.setValueAtTime(amplitude, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(f);
    f.connect(amp);
    amp.connect(dest);
    src.start(t, Math.random() * 0.3);
    src.stop(t + length + 0.02);
  }
  function sound(key, opts = {}) {
    if (!effects) return;
    init();
    if (!ctx) return;
    const pitch = opts.pitch || 1;
    let at = ctx.currentTime;
    if (key === "riser") {
      const len = opts.length || 1.2;
      note(180, at, len, 0.07, "sawtooth", 1400);
      noise(at, len, 0.05, 1200, output, "bandpass");
      return;
    }
    if (key === "whoosh") {
      noise(at, 0.3, 0.12, 900, output, "bandpass");
      return;
    }
    if (key === "boom") noise(at, 0.4, 0.18, 400, output, "lowpass");
    if (key === "thunk") noise(at, 0.06, 0.12, 2500);
    for (const [hz, len, wave = "triangle", slide = 0, amp = 0.15] of phrases[key] || phrases.click) {
      note(hz * pitch, at, len, amp, wave, slide ? slide * pitch : 0);
      at += len * 0.84;
    }
  }
  const bass = [110, 110, 87.307, 97.999],
    lead = [0, 7, 12, 15, 7, 10, 14, 7, 0, 3, 10, 12, 7, 15, 12, 10];
  function pump() {
    const cutoff = ctx.currentTime + 0.16;
    if (next < ctx.currentTime - 0.4) next = ctx.currentTime + 0.02;
    const bus = musicBus;
    while (next < cutoff) {
      const step = beat % 16,
        root = bass[Math.floor(beat / 16) % 4];
      if (step % 4 === 0 || step === 11)
        note(root * (step === 11 ? 2 : 1), next, 0.18, 0.105, "triangle", 0, bus);
      if (step % 4 === 0) note(115, next, 0.105, 0.2, "sine", 39, bus);
      if (step % 4 === 2) noise(next, 0.03, 0.04, 7000, bus);
      if (step % 2 === 1 || step === 8)
        note(2 * root * 2 ** (lead[step] / 12), next, 0.09, 0.035, "square", 0, bus);
      if (step === 4 || step === 12) {
        note(255, next, 0.07, 0.05, "triangle", 117, bus);
        noise(next, 0.12, 0.07, 1800, bus);
      }
      // Hype layers.
      if (heat > 0.3 && step % 2 === 0) noise(next, 0.02, 0.025, 9000, bus);
      if (heat > 0.55)
        note(4 * root * 2 ** (lead[(step * 3) % 16] / 12), next, 0.05, 0.02, "square", 0, bus);
      if (heat > 0.8 && (step === 14 || step === 15)) note(115, next, 0.08, 0.14, "sine", 40, bus);
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
    setHeat(value) {
      const v = Math.max(0, Math.min(1, value));
      if (Math.abs(v - heat) < 0.01) return;
      heat = v;
      applyHeat();
    },
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
