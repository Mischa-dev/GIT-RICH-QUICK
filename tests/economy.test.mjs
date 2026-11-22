import { test } from "node:test";
import assert from "node:assert/strict";
import { createEconomy, loadWallet, SAVE_KEY } from "../src/economy.js";
const memory = () => {
  const entries = new Map();
  return {
    getItem: (k) => entries.get(k),
    setItem: (k, v) => entries.set(k, v),
  };
};

test("resuming a wallet preserves integer balances, stats, events and a saved game", () => {
  const storage = memory(),
    wallet = createEconomy(storage);
  assert.equal(wallet.spend(1201, "too much"), false);
  assert.equal(wallet.spend(-100, "refund"), false);
  assert.equal(wallet.earn(Infinity, "invalid"), false);
  wallet.spend(1200, "deploy");
  wallet.earn(350, "sponsor");
  wallet.stat("ads");
  wallet.set("job", { phase: 4 });
  const next = createEconomy(storage);
  assert.equal(next.state.tokens, 350);
  assert.equal(next.state.spent, 1200);
  assert.equal(next.state.earned, 350);
  assert.equal(next.state.peak, 1200);
  assert.equal(next.state.stats.ads, 1);
  assert.deepEqual(next.get("job", null), { phase: 4 });
  assert.equal(next.state.events[0].text, "sponsor");
});

test("a damaged activity log still leaves a playable saved wallet", () => {
  const storage = memory();
  storage.setItem(
    SAVE_KEY,
    JSON.stringify({ version: 1, tokens: 242, events: [null, {}] }),
  );
  const state = loadWallet(storage);
  assert.equal(state.tokens, 242);
  assert.equal(typeof state.events[0].text, "string");
});
