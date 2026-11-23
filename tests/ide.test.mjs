import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { initDesk } from "../src/desk.js";

// The floor's IDE mode: the desk mounts into #ide when the effects engine is on.
function floor(t) {
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
  t.mock.method(performance, "now", () => now);
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  t.mock.method(Math, "random", () => 0.99);
  const before = { window: globalThis.window, document: globalThis.document };
  Object.assign(globalThis, { window: browser, document });
  document.body.innerHTML = '<div id="ide"></div>';
  const juice = new Proxy(
    {},
    {
      get: (_, key) =>
        key === "enabled" || key === "reduced"
          ? true
          : ["tier", "heat", "combo", "intensity"].includes(key)
            ? 0
            : () => 0,
    },
  );
  const calls = { allIn: [], fund: 0 };
  const api = {
    ...createEconomy(localStorage),
    juice,
    sound() {},
    fx() {},
    toast() {},
    openT3() {},
    closeModal() {},
    modal() {
      throw new Error("IDE mode never opens the desk in a modal");
    },
    fund(_reason, resume) {
      calls.fund++;
      api.earn(350, "Sponsor fee");
      resume();
    },
    allIn(opts) {
      calls.allIn.push(opts);
      opts.onDone();
    },
  };
  const desk = initDesk(api);
  t.after(async () => {
    desk.destroy();
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
  const $ = (s) => document.querySelector(s);
  return { api, calls, advance, $, document, state: () => $(".ide")?.dataset.state };
}

test("the IDE owns the floor, runs dry, and the ad → all-in loop finishes the feature", (t) => {
  const f = floor(t);
  assert.ok(f.$("#ide .ide"), "IDE mounted in place");
  assert.ok(f.$(".slop"), "slop skills are on the dock");
  assert.equal(f.$('[data-speed="1"]').getAttribute("aria-pressed"), "true", "overclock by default");
  f.$('[data-desk-field="note"]').value = "make it pop";
  f.$('[data-desk-field="note"]').dispatchEvent(new f.document.defaultView.Event("input", { bubbles: true }));
  f.$('[data-desk-action="start"]').click();
  f.advance(20000);
  assert.equal(f.state(), "blocked", "1,200 tokens can't cover an overclocked run");
  assert.ok(f.$(".ide-continue"), "CONTINUE? takes over the editor");
  const spentBefore = f.api.state.spent;
  f.$('[data-desk-action="fund"]').click();
  assert.equal(f.calls.fund, 1);
  assert.equal(f.calls.allIn.length, 1, "the ad payout goes straight to the all-in offer");
  assert.match(f.calls.allIn[0].reason, /needs/);
  // Still short after a single ad: the agent waits on the continue screen.
  if (f.api.state.tokens < f.calls.allIn[0].need) assert.equal(f.state(), "blocked");
  f.api.earn(5000, "Fixture: red came in");
  f.calls.allIn[0].onDone();
  f.advance(20000);
  assert.equal(f.state(), "shipped");
  assert.ok(f.api.state.spent > spentBefore);
});

test("AUTO-PROMPT re-sends its text every time the agent ships", (t) => {
  const f = floor(t);
  f.api.earn(50000, "Fixture bankroll");
  f.$('[data-desk-action="auto-count"][data-n="1"]').click();
  f.$('[data-desk-action="slop"][data-key="auto"]').click();
  f.$('[data-desk-field="auto-text"]').value = "make it better";
  f.$('[data-desk-field="auto-text"]').dispatchEvent(new f.document.defaultView.Event("input", { bubbles: true }));
  f.$('[data-desk-action="start"]').click();
  f.advance(20000);
  assert.equal(f.state(), "shipped");
  t.mock.timers.tick(3000);
  assert.equal(f.state(), "running", "the loop sent the next prompt by itself");
  assert.match(f.$(".desk-note").textContent, /make it better/);
  f.advance(20000);
  assert.equal(f.state(), "shipped");
  t.mock.timers.tick(3000);
  assert.equal(f.state(), "shipped", "×1 means once");
});

test("side bets settle on your own build and ship streaks stack", (t) => {
  const f = floor(t);
  f.api.earn(20000, "Fixture bankroll");
  f.$('[data-desk-action="start"]').click();
  // Advance into Plan: the side bet appears.
  for (let i = 0; i < 40 && !f.$(".ide-offer"); i++) f.advance(250);
  assert.ok(f.$(".ide-offer"), "an ALL GREEN side bet is offered mid-run");
  const before = f.api.state.tokens;
  const stake = Number(f.$('[data-desk-action="bet"]').textContent.replace(/\D/g, ""));
  f.$('[data-desk-action="bet"]').click();
  assert.equal(f.api.state.tokens, before - stake);
  f.advance(20000);
  assert.equal(f.state(), "shipped");
  assert.ok(
    f.api.state.events.some((e) => /Side bet hit/.test(e.text) && e.amount === stake * 2),
    "tests passed first try, so the bet paid 2×",
  );
  assert.match(f.$(".ide-streak").textContent, /×1/);
  f.$('[data-desk-action="next"]').click();
  f.$('[data-desk-action="start"]').click();
  f.advance(20000);
  assert.match(f.$(".ide-streak").textContent, /×2/);
  assert.ok(f.api.state.events.some((e) => /Ship streak ×2/.test(e.text)));
});
