import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { contracts, phases } from "../src/desk.js";
import {
  BASE_SLOTS,
  initThreads,
  slotPrice,
  threadCost,
  threadReward,
  trainMultiplier,
} from "../src/threads.js";

// A floor with only the agent strip. Timers run on a fake clock.
function floor(t, random = () => 0.9, testRoll) {
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
    sound() {},
    toast() {},
    modal() {},
    closeModal() {},
  };
  const boot = () => (instance = initThreads(api, { random, testRoll }));
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
  assert.ok(f.$(".th-feed"), "a FEED button appears");
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
