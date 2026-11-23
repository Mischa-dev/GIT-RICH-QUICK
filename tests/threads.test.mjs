import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { contracts, phases } from "../src/desk.js";
import {
  BASE_SLOTS,
  MAX_SLOTS,
  SWARM_AT,
  TRAIN_CAP,
  initThreads,
  slotPrice,
  threadCost,
  threadReward,
  trainMultiplier,
} from "../src/threads.js";

// A floor with only the agent strip. Timers run on a fake clock.
function floor(t, random = () => 0.9, testRoll, juice) {
  const browser = new Window({ url: "https://arcade.example/" });
  const { document, localStorage } = browser;
  const timers = new Map();
  let now = 0,
    nextId = 0;
  t.mock.method(browser, "setTimeout", (task, delay) => {
    timers.set(++nextId, { at: now + delay, task });
    return nextId;
  });
  t.mock.method(browser, "clearTimeout", (id) => timers.delete(id));
  t.mock.method(browser, "setInterval", () => 0);
  t.mock.method(browser, "clearInterval", () => {});
  const before = { window: globalThis.window, document: globalThis.document };
  Object.assign(globalThis, { window: browser, document });
  document.body.innerHTML = '<div id="threads"></div>';
  let instance;
  const wallet = createEconomy(localStorage);
  const api = {
    ...wallet,
    ...(juice ? { juice } : {}),
    sound() {},
    toast() {},
    modal() {},
    closeModal() {},
  };
  const boot = () => (instance = initThreads(api, { random, testRoll, now: () => now }));
  boot();
  t.after(async () => {
    instance.destroy();
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
    await browser.happyDOM.close();
  });
  function advance(ms) {
    const until = now + ms;
    while (timers.size) {
      const [id, job] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (job.at > until) break;
      timers.delete(id);
      now = job.at;
      job.task();
    }
    now = until;
  }
  return {
    api,
    advance,
    browser,
    get threads() {
      return instance;
    },
    reload() {
      instance.destroy();
      timers.clear();
      boot();
    },
    $: (s) => document.querySelector(s),
    $$: (s) => [...document.querySelectorAll(s)],
  };
}

// With random() ≈ 0.9 the first unlocked ticket is always picked (only one is unlocked at 0 commits).
const first = contracts[0];
const fullRunCost = phases.reduce((sum, _, i) => sum + threadCost(first, i), 0);

test("agents fill the slots; more slots cost more each time", (t) => {
  const f = floor(t);
  assert.equal(f.threads.spawnMany(BASE_SLOTS + 3), BASE_SLOTS);
  assert.equal(f.$$(".th-card").length, BASE_SLOTS);
  assert.ok(f.$(".th-spawn").disabled, "spawn is disabled while every slot is busy");
  const tokens = f.api.state.tokens;
  assert.equal(f.threads.buySlot(), true);
  assert.equal(f.api.state.tokens, tokens - slotPrice(0));
  assert.ok(slotPrice(1) > slotPrice(0));
  assert.equal(MAX_SLOTS, 100);
  assert.equal(f.$(".th-feed").hasAttribute("hidden"), true);
  assert.equal(f.$(".th-accept").hasAttribute("hidden"), true);
  assert.ok(f.threads.spawn());
  assert.equal(f.threads.threads.length, BASE_SLOTS + 1);
});

test("each phase is paid from the shared wallet and a finished agent waits for review", (t) => {
  const f = floor(t);
  f.threads.spawn();
  f.advance(60000);
  const [agent] = f.threads.threads;
  assert.equal(agent.status, "review");
  assert.equal(agent.spent, fullRunCost);
  assert.equal(f.api.state.tokens, 1200 - fullRunCost);
  assert.equal(agent.reward, threadReward(first));
  assert.match(f.$(".th-accept").textContent, /ACCEPT ALL \(1\)/);
});

test("broke agents starve, then pick up again the moment there's money", (t) => {
  const f = floor(t);
  f.api.spend(1195, "Fixture");
  f.threads.spawn();
  f.advance(5000);
  assert.equal(f.threads.threads[0].status, "starving");
  assert.equal(f.$(".th-feed").hasAttribute("hidden"), false, "a FEED button appears");
  f.api.earn(5000, "Fixture");
  f.advance(60000);
  assert.equal(f.threads.threads[0].status, "review");
});

test("a failing test is paid for again", (t) => {
  let rolls = 0;
  // Fail the first Test roll only.
  const f = floor(t, () => 0.9, () => (++rolls === 1 ? 0.1 : 0.9));
  f.threads.spawn();
  f.advance(60000);
  const [agent] = f.threads.threads;
  assert.equal(agent.status, "review");
  assert.equal(agent.spent, fullRunCost + threadCost(first, phases.indexOf("Test")));
});

test("ACCEPT ALL runs a merge train with a growing multiplier", (t) => {
  const f = floor(t);
  f.api.earn(10000, "Fixture bankroll");
  f.threads.spawnMany(3);
  f.advance(60000);
  assert.equal(f.threads.threads.filter((x) => x.status === "review").length, 3);
  const before = f.api.state.tokens;
  const reward = threadReward(first);
  f.threads.accept();
  f.advance(2000);
  const expected = [0, 1, 2].reduce((s, i) => s + Math.round(reward * trainMultiplier(i)), 0);
  assert.equal(f.api.state.tokens, before + expected);
  assert.equal(f.threads.threads.length, 0);
  assert.equal(f.api.state.stats.commits, 3);
});

test("agents survive a reload and keep working", (t) => {
  const f = floor(t);
  f.threads.spawnMany(2);
  f.advance(3000);
  const phaseBefore = f.threads.threads.map((x) => x.phase);
  assert.ok(phaseBefore.every((p) => p > 0 && p < phases.length));
  f.reload();
  assert.deepEqual(
    f.threads.threads.map((x) => x.phase),
    phaseBefore,
  );
  f.advance(60000);
  assert.ok(f.threads.threads.every((x) => x.status === "review"));
});

// A stand-in effects engine: enabled, silent, and as fast as you say.
const engine = (speed = 1) =>
  new Proxy(
    {},
    {
      get: (_, key) => (key === "speed" ? speed : key === "enabled" ? true : key === "fever" ? speed > 1 : () => 0),
    },
  );
const reward = threadReward(first);

test("buying in bulk reaches 100 slots and the strip turns into a swarm grid", (t) => {
  const f = floor(t);
  f.api.earn(5_000_000, "Fixture bankroll");
  assert.equal(f.threads.buySlots(10), 10);
  assert.equal(f.threads.slots, BASE_SLOTS + 10);
  while (f.threads.buySlots(10));
  assert.equal(f.threads.slots, MAX_SLOTS);
  assert.equal(f.threads.buySlots(10), 0, "the hundredth slot is the last");
  assert.equal(f.threads.spawnMax(), MAX_SLOTS);
  assert.equal(f.threads.threads.length, MAX_SLOTS);
  assert.equal(f.$$(".th-card").length, 0);
  assert.equal(f.$$(".th-cell").length, MAX_SLOTS, "one cell per agent");
  assert.ok(f.$(".th-max").disabled);
  assert.equal(f.$(".th-total").hasAttribute("hidden"), false);
  f.advance(60000);
  assert.equal(f.$$(".th-cell.th-review").length, MAX_SLOTS);
  // Merging everything empties the grid again.
  f.threads.accept();
  f.advance(60000);
  assert.equal(f.threads.threads.length, 0);
  assert.equal(f.$$(".th-cell").length, 0);
  assert.ok(SWARM_AT < MAX_SLOTS);
});

test("AGENTS HIRE AGENTS fills every slot and never one more", (t) => {
  const f = floor(t);
  f.api.earn(1_000_000, "Fixture bankroll");
  f.threads.buySlots(10);
  f.threads.setHire(true);
  f.threads.spawn();
  let peak = 0;
  for (let i = 0; i < 80; i++) {
    f.advance(2500);
    peak = Math.max(peak, f.threads.threads.length);
    assert.ok(f.threads.threads.length <= f.threads.slots);
  }
  assert.equal(peak, f.threads.slots, "one agent became a full house");
  assert.ok(f.threads.threads.every((x) => x.status === "review"));
  f.reload();
  assert.equal(f.threads.hire, true, "the toggle is remembered");
});

test("AUTO-MERGE rides one train and its multiplier caps at x3", (t) => {
  const f = floor(t);
  f.api.earn(1_000_000, "Fixture bankroll");
  f.threads.buySlots(26);
  f.threads.setAuto(true);
  const before = f.api.state.tokens;
  assert.equal(f.threads.spawnMany(30), 30);
  // Every agent takes the same time here, so all 30 finish together and merge 400ms later.
  f.advance(20000);
  assert.equal(f.threads.threads.length, 0, "nobody waits for review");
  const paid = Array.from({ length: 30 }, (_, i) => Math.round(reward * trainMultiplier(i))).reduce((a, b) => a + b, 0);
  assert.equal(f.api.state.tokens, before - 30 * fullRunCost + paid);
  assert.equal(trainMultiplier(20), TRAIN_CAP);
  assert.equal(trainMultiplier(99), TRAIN_CAP);
  assert.ok(
    f.api.state.events.some((e) => e.amount === reward * TRAIN_CAP),
    "late cars are paid exactly x3",
  );
  assert.equal(f.api.state.stats.commits, 30);
  assert.equal(f.threads.train, 0, "the train ends two seconds after the last car");
});

test("fever makes agents three times faster, including the ones mid-phase", (t) => {
  const timeToReview = (f) => {
    f.api.earn(10000, "Fixture bankroll");
    f.threads.spawn();
    let ms = 0;
    while (f.threads.threads[0].status !== "review" && ms < 120000) {
      f.advance(50);
      ms += 50;
    }
    return ms;
  };
  const normal = timeToReview(floor(t, () => 0.9, undefined, engine(1)));
  const fever = timeToReview(floor(t, () => 0.9, undefined, engine(3)));
  assert.ok(fever < normal / 2.5, `${fever}ms should be about a third of ${normal}ms`);

  const f = floor(t, () => 0.9, undefined, engine(1));
  f.threads.spawn();
  f.advance(100);
  f.browser.dispatchEvent(new f.browser.CustomEvent("grq:event", { detail: { type: "fever-start" } }));
  f.advance(350);
  assert.equal(f.threads.threads[0].phase, 1, "the phase in flight finished early");
});

test("a big swarm saves at most once a second, and always before shutting down", (t) => {
  const f = floor(t);
  f.api.earn(1_000_000, "Fixture bankroll");
  f.threads.buySlots(10);
  f.threads.spawnMany(SWARM_AT + 4);
  const stored = () => f.api.get("threads-v1").threads.length;
  assert.equal(stored(), SWARM_AT, "past the threshold, writes are deferred");
  f.advance(1001);
  assert.equal(stored(), SWARM_AT + 4);
  f.threads.spawnMany(2);
  assert.equal(stored(), SWARM_AT + 4);
  f.reload();
  assert.equal(f.threads.threads.length, SWARM_AT + 6, "destroy() flushed the pending save");
});
