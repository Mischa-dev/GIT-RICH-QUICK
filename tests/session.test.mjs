import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { createEconomy, SAVE_KEY } from "../src/economy.js";
import { openArcadeSession } from "../src/session.js";

function storage() {
  const items = new Map();
  return {
    getItem: (k) => items.get(k) ?? null,
    setItem: (k, v) => items.set(k, v),
  };
}
function queuedLocks() {
  let tail = Promise.resolve();
  return {
    request(name, opts, grant) {
      assert.equal(opts.mode, "exclusive");
      const run = tail.then(() => {
        if (!opts.signal.aborted) return grant({ name });
      });
      tail = run.catch(() => {});
      return run;
    },
  };
}
function tab(locks, shared) {
  return Object.assign(new EventTarget(), {
    navigator: { locks },
    localStorage: shared,
    sessionStorage: storage(),
    setTimeout,
    clearTimeout,
    document: { documentElement: {} },
    location: { reload() {} },
  });
}
function hide(win, persisted = false) {
  win.dispatchEvent(Object.assign(new Event("pagehide"), { persisted }));
}

test("a second tab waits before opening the wallet, then reads the completed job and latest payout", async () => {
  const shared = storage(),
    locks = queuedLocks();
  const first = tab(locks, shared),
    second = tab(locks, shared);
  const owner = createEconomy(await openArcadeSession(first));
  owner.set("job", "running");
  let waiting = false,
    started = false;
  const queued = openArcadeSession(second, () => {
    waiting = true;
    return () => {
      waiting = false;
    };
  });
  queued.then(() => {
    started = true;
  });
  await wait(150);
  assert.equal(waiting, true);
  assert.equal(started, false);
  owner.earn(100, "Shipped");
  owner.set("job", "complete");
  hide(first);
  const next = createEconomy(await queued);
  assert.equal(waiting, false);
  assert.equal(next.state.tokens, 1300);
  assert.equal(next.get("job"), "complete");
  hide(second);
});

test("an abandoned queued tab does not boot or block the next owner", async () => {
  const shared = storage(),
    locks = queuedLocks();
  const a = tab(locks, shared),
    b = tab(locks, shared),
    c = tab(locks, shared);
  await openArcadeSession(a);
  let ran = false;
  openArcadeSession(b).then(() => {
    ran = true;
  });
  hide(b);
  const later = openArcadeSession(c);
  hide(a);
  assert.equal(await later, shared);
  assert.equal(ran, false);
  hide(c);
});

test("a cached page releases the claim and reloads its wallet on restoration exactly once", async () => {
  const shared = storage(),
    locks = queuedLocks();
  const a = tab(locks, shared),
    b = tab(locks, shared);
  let reloads = 0;
  a.location.reload = () => {
    reloads++;
  };
  await openArcadeSession(a);
  const queued = openArcadeSession(b);
  hide(a, true);
  assert.equal(a.document.documentElement.inert, true);
  assert.equal(await queued, shared);
  a.dispatchEvent(new Event("storage"));
  assert.equal(reloads, 0);
  a.dispatchEvent(new Event("pageshow"));
  a.dispatchEvent(new Event("pageshow"));
  assert.equal(reloads, 1);
  hide(b);
});

test("unavailable or denied Web Locks fall back to a tab save without changing the shared save", async () => {
  const shared = storage();
  const owner = createEconomy(shared);
  owner.earn(20, "First catch");
  const baseline = shared.getItem(SAVE_KEY);
  for (const locks of [
    undefined,
    {
      request() {
        return Promise.reject(new Error("Access denied"));
      },
    },
  ]) {
    const win = tab(locks, shared);
    const wallet = createEconomy(await openArcadeSession(win));
    assert.equal(wallet.state.tokens, 1220);
    wallet.spend(120, "Side bet");
    assert.equal(shared.getItem(SAVE_KEY), baseline);
    assert.equal(
      createEconomy(await openArcadeSession(win)).state.tokens,
      1100,
    );
  }
});
