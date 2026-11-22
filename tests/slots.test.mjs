import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { initSlots, priceSpin, rollSymbol, slotSymbols } from "../src/slots.js";

function tickets(t, values) {
  let cursor = 0;
  return t.mock.method(crypto, "getRandomValues", (words) => {
    words[0] = values[cursor++ % values.length];
    return words;
  });
}

function cabinet(t, reduced = false) {
  const page = new Window();
  Object.assign(globalThis, { window: page, document: page.document });
  page.matchMedia = () => ({ matches: reduced });
  document.body.innerHTML = '<section id="slot-machine"></section>';
  const events = [];
  const api = {
    ...createEconomy(page.localStorage),
    sound: (kind) => events.push(kind),
    fx: (kind) => events.push(kind),
    modal(title, content) {
      this.modalContent = content;
    },
    fund(reason, resume) {
      this.resume = resume;
    },
  };
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let instance = initSlots(api);
  t.after(async () => {
    instance.destroy();
    delete globalThis.window;
    delete globalThis.document;
    await page.happyDOM.abort();
  });
  return {
    api,
    select: (selector) => document.querySelector(selector),
    all: (selector) => [...document.querySelectorAll(selector)],
    spin: () => instance.spin(),
    finish: () => t.mock.timers.tick(900),
    reload() {
      instance.destroy();
      const freshWallet = createEconomy(page.localStorage);
      Object.assign(api, freshWallet);
      instance = initSlots(api);
    },
  };
}

test("reel ticket intervals exactly match the six advertised weights", (t) => {
  const sequence = tickets(t, [
    4294967295,
    ...Array.from({ length: 100 }, (_, i) => i),
  ]);
  const counts = new Map();
  for (let i = 0; i < 100; i++) {
    const symbol = rollSymbol();
    counts.set(symbol, (counts.get(symbol) || 0) + 1);
  }
  for (const { id, weight } of slotSymbols)
    assert.equal(counts.get(id), weight);
  assert.equal(
    sequence.mock.callCount(),
    101,
    "the unbalanced random remainder is rejected",
  );
});

test("triples, nonadjacent pairs, cherry pairs and misses honor the paytable", () => {
  for (const symbol of slotSymbols) {
    assert.deepEqual(priceSpin(Array(3).fill(symbol.id), 50), {
      payout: symbol.triple * 50,
      match: "triple",
      symbol: symbol.id,
    });
  }
  assert.equal(priceSpin(["diamond", "terminal", "diamond"], 50).payout, 50);
  assert.equal(priceSpin(["cherries", "cherries", "seven"], 50).payout, 100);
  assert.equal(priceSpin(["cherries", "seven", "diamond"], 50).payout, 0);
});

test("an in-flight wager is settled once and its result survives reloading", (t) => {
  const game = cabinet(t);
  tickets(t, [27]); // Three gold sevens.
  game.select('[data-step="-1"]').click();
  assert.equal(game.select(".slot-bet-value").textContent, "25");
  game.select(".slot-payouts").click();
  assert.equal(
    game.api.modalContent.querySelectorAll(".slot-price-grid > div").length,
    6,
  );
  game.spin();
  assert.equal(game.select(".slot-spin").disabled, true);
  game.spin();
  assert.equal(game.api.state.tokens, 1200 - 25 + 1000);
  assert.deepEqual(game.api.state.stats, { spins: 1, wins: 1, jackpots: 1 });
  game.reload();
  game.finish();
  assert.equal(game.api.state.tokens, 2175);
  assert.equal(game.select(".slot-spin").disabled, false);
  assert.match(game.select(".slot-status").textContent, /777!/);
  assert.ok(
    game
      .all(".slot-reel")
      .every((reel) => reel.getAttribute("aria-label").includes("Lucky seven")),
  );
});

test("the funding callback resumes the interrupted spin only once", (t) => {
  const game = cabinet(t, true);
  tickets(t, [0]);
  game.api.spend(1200, "Fixture");
  game.spin();
  assert.equal(game.api.state.stats.spins, undefined);
  assert.equal(typeof game.api.resume, "function");
  game.api.earn(50, "Sponsor fee");
  game.api.resume();
  game.api.resume();
  game.finish();
  assert.equal(game.api.state.tokens, 300);
  assert.equal(game.api.state.stats.spins, 1);
});

test("two consecutive misses unlock one held reel for the next spin", (t) => {
  const game = cabinet(t, true);
  const stream = tickets(t, [0, 30, 40]);
  game.spin();
  game.finish();
  assert.equal(game.all(".slot-can-hold").length, 0);
  game.spin();
  game.finish();
  assert.equal(game.all(".slot-can-hold").length, 3);
  game.all(".slot-reel")[0].click();
  assert.equal(game.all(".slot-is-held").length, 1);
  game.reload();
  assert.equal(game.all(".slot-is-held").length, 1);
  stream.mock.mockImplementation((words) => {
    words[0] = 30;
    return words;
  });
  game.spin();
  game.finish();
  assert.match(
    game.select(".slot-reel").getAttribute("aria-label"),
    /Cherry-pick/,
  );
  assert.match(game.select(".slot-status").textContent, /Bet returned/);
  assert.equal(game.all(".slot-can-hold").length, 0);
  assert.equal(game.api.state.tokens, 1100);
});
