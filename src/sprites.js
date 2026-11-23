// Tiny pixel sprites drawn at runtime. VIBE-1, the agent, has a face for every
// mood the desk can be in. Each mood has two frames that the CSS flips between.

const HEAD = [
  "......aaaa......",
  "......aaaa......",
  ".......kk.......",
  "..kkkkkkkkkkkk..",
  ".kmmmmmmmmmmmmk.",
  "kdmkkkkkkkkkkmdk",
  "kdmkSSSSSSSSkmdk",
  "kdmkS1111111kmdk",
  "kdmkS2222222kmdk",
  "kdmkS3333333kmdk",
  "kdmkS4444444kmdk",
  "kdmkkkkkkkkkkmdk",
  ".kmmmmmmmmmmmmk.",
  "..kddddddddddk..",
  "...kkkkkkkkkk...",
];
// Visor rows 1-4, seven pixels each. e = eye, o = mouth, s = screen.
const faces = {
  idle: [
    ["seesees", "seesees", "sssssss", "ssoooss"],
    ["sssssss", "seesees", "sssssss", "ssoooss"],
  ],
  working: [
    ["eeseess", "eeseess", "sssssss", "sooooss"],
    ["sseesee", "sseesee", "sssssss", "ssoooos"],
  ],
  broke: [
    ["esesese", "sessses", "esesese", "ssoooss"],
    ["esesese", "sessses", "esesese", "sosssos"],
  ],
  shipped: [
    ["sessses", "esesese", "sosssos", "ssoooss"],
    ["esesese", "sssssss", "sosssos", "ssoooss"],
  ],
};
const palettes = {
  idle: { e: "#7df9ff", o: "#7df9ff" },
  working: { e: "#a6ff8f", o: "#a6ff8f" },
  broke: { e: "#ff4d6d", o: "#ff4d6d" },
  shipped: { e: "#ffe066", o: "#ffe066" },
};
const base = {
  k: "#0a0612",
  m: "#a9b8ff",
  d: "#5a63c9",
  a: "#ffe066",
  S: "#0b1424",
  s: "#0b1424",
};
const cache = new Map();

function draw(mood, frame) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 15;
  const ctx = canvas.getContext?.("2d");
  if (!ctx) return "";
  const face = faces[mood][frame];
  const colors = { ...base, ...palettes[mood] };
  HEAD.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      let ch = row[x];
      if (/[1-4]/.test(ch)) ch = face[Number(ch) - 1][x - 5] || "s";
      if (ch === "." || !colors[ch]) continue;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return canvas.toDataURL();
}

/** Two data-URL frames for VIBE-1 in a mood: idle | working | broke | shipped. */
export function robotFrames(mood = "idle") {
  if (!faces[mood]) mood = "idle";
  if (!cache.has(mood)) {
    try {
      cache.set(mood, [draw(mood, 0), draw(mood, 1)]);
    } catch {
      cache.set(mood, ["", ""]);
    }
  }
  return cache.get(mood);
}

export function robotMarkup(mood, cls = "") {
  const [a, b] = robotFrames(mood);
  if (!a) return `<span class="vibe-bot vibe-${mood} ${cls}" aria-hidden="true"></span>`;
  return `<span class="vibe-bot vibe-${mood} ${cls}" aria-hidden="true"><img src="${a}" alt=""><img src="${b}" alt=""></span>`;
}
