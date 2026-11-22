export const SAVE_KEY = "git-rich-quick/arcade-v1";
export const format = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const MAX = Number.MAX_SAFE_INTEGER;
const natural = (n) => Number.isSafeInteger(n) && n >= 0;
const dictionary = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

function initial(now) {
  return {
    version: 1,
    tokens: 1200,
    peak: 1200,
    started: now,
    earned: 0,
    spent: 0,
    stats: {},
    data: {},
    events: [
      {
        time: now,
        text: "Welcome bonus from the house.",
        amount: 1200,
        kind: "wallet",
      },
    ],
  };
}
export function loadWallet(storage, now = Date.now()) {
  let raw;
  try {
    raw = JSON.parse(storage?.getItem(SAVE_KEY) || "null");
  } catch {
    /* A private session can still play. */
  }
  if (!raw || raw.version !== 1 || !natural(raw.tokens)) return initial(now);
  const data = initial(now);
  for (const field of ["tokens", "peak", "started", "earned", "spent"])
    if (natural(raw[field])) data[field] = raw[field];
  data.peak = Math.max(data.tokens, data.peak);
  data.stats = Object.fromEntries(
    Object.entries(dictionary(raw.stats)).filter(([, v]) => natural(v)),
  );
  data.data = dictionary(raw.data);
  if (Array.isArray(raw.events)) {
    const events = raw.events
      .filter(
        (e) =>
          e &&
          typeof e.text === "string" &&
          natural(e.time) &&
          Number.isSafeInteger(e.amount),
      )
      .slice(0, 100);
    if (events.length) data.events = events;
  }
  return data;
}
export function createEconomy(storage, onChange = () => {}, now = Date.now) {
  const state = loadWallet(storage, now());
  function save(refresh) {
    try {
      storage?.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* Volatile play continues when storage is full or unavailable. */
    }
    if (refresh) onChange();
  }
  function entry(text, amount = 0, kind = "floor") {
    state.events.unshift({
      time: now(),
      text: String(text).slice(0, 240),
      amount,
      kind,
    });
    state.events.length = Math.min(100, state.events.length);
  }
  function move(amount, label, credit) {
    if (!natural(amount) || !amount) return false;
    if (credit ? state.tokens > MAX - amount : state.tokens < amount)
      return false;
    const signed = credit ? amount : -amount;
    state.tokens += signed;
    const field = credit ? "earned" : "spent";
    state[field] = Math.min(MAX, state[field] + amount);
    state.peak = Math.max(state.peak, state.tokens);
    entry(label, signed, "wallet");
    save(true);
    return true;
  }
  save(false);
  return {
    state,
    format,
    spend: (n, l) => move(n, l, false),
    earn: (n, l) => move(n, l, true),
    log(text, kind) {
      entry(text, 0, kind);
      save(true);
    },
    get(key, fallback) {
      return Object.hasOwn(state.data, key) ? state.data[key] : fallback;
    },
    set(key, value) {
      state.data[key] = value;
      save(false);
    },
    stat(key, increment = 1) {
      if (!natural(increment)) return;
      state.stats[key] = Math.min(MAX, (state.stats[key] || 0) + increment);
      save(true);
    },
  };
}
