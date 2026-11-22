import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { initFishing } from "../src/fishing.js";

function setup(t) {
  const win = new Window({ url: "http://localhost" });
  const doc = win.document;
  const originalGlobals = {
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  let now = 1000;
  let frame;
  let cleanUpModal;
  let fishing;
  let wallet;
  globalThis.document = doc;
  globalThis.requestAnimationFrame = (callback) => {
    frame = callback;
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {
    frame = undefined;
  };
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(performance, "now", () => now);
  t.mock.method(Math, "random", () => 0.5);

  function close() {
    cleanUpModal?.();
    cleanUpModal = undefined;
    doc.querySelector("main")?.replaceChildren();
  }
  function reload() {
    close();
    fishing?.destroy();
    doc.body.innerHTML = '<section id="fishing-card"></section><main></main>';
    wallet = createEconomy(win.localStorage);
    fishing = initFishing({
      ...wallet,
      sound() {},
      fx() {},
      modal(title, content, options) {
        close();
        doc.querySelector("main").replaceChildren(content);
        cleanUpModal = options.onClose;
      },
    });
  }
  function find(selector) {
    const element = doc.querySelector(selector);
    assert.ok(element, "Expected to find " + selector);
    return element;
  }
  function pullOnGreen() {
    const safe = find(".pond-safe");
    const needle = find(".pond-needle");
    const left = parseFloat(safe.style.left);
    const right = left + parseFloat(safe.style.width);
    // Follow the rendered meter instead of reproducing its speed in the test.
    for (let tick = 0; tick < 200; tick++) {
      now += 16;
      frame(now);
      const at = parseFloat(needle.style.left);
      if (at > left && at < right) {
        find('[data-pond="action"]').click();
        return;
      }
    }
    assert.fail("The needle never reached the green zone");
  }
  reload();
  t.after(async () => {
    close();
    fishing.destroy();
    Object.assign(globalThis, originalGlobals);
    await win.happyDOM.abort();
  });
  return {
    open: () => find(".pond-card").click(),
    press: () => find('[data-pond="action"]').click(),
    find,
    close,
    reload,
    pullOnGreen,
    get wallet() {
      return wallet;
    },
  };
}

test("free cast pays one catch after two timed pulls and restores the collection on reload", (t) => {
  const game = setup(t);
  game.wallet.spend(game.wallet.state.tokens, "Empty the fixture wallet");
  game.open();
  game.press();
  assert.equal(game.find('[data-pond="book"]').disabled, true);
  t.mock.timers.tick(3200);
  game.find(".phase-bite");
  game.press();
  game.pullOnGreen();
  assert.equal(game.wallet.state.tokens, 0);
  game.pullOnGreen();
  game.find(".phase-caught");
  const book = game.wallet.get("fishing.pond.v1");
  assert.equal(book.caught, 1);
  assert.equal(book.casts, 1);
  assert.equal(book.perfect, 1);
  assert.ok(book.earned > 0);
  assert.equal(game.wallet.state.tokens, book.earned);
  assert.equal(game.wallet.state.stats.fish, 1);
  game.reload();
  assert.match(game.find(".pond-card").textContent, /1\/10 species/);
  game.open();
  game.find('[data-pond="book"]').click();
  assert.equal(game.find(".pond-species").querySelectorAll("li").length, 10);
  assert.equal(
    game.find(".pond-species").querySelectorAll(".pond-unseen").length,
    9,
  );
  assert.match(game.find(".pond-species").textContent, /Caught 1 · Best/);
  assert.equal(game.wallet.state.tokens, book.earned);
});

test("early and late hooks miss without reward and leaving the pond cancels the pending bite", (t) => {
  const game = setup(t);
  game.open();
  game.press();
  game.press();
  assert.match(game.find(".pond-hint").textContent, /Early hook/);
  game.press();
  t.mock.timers.tick(3200);
  game.find(".phase-bite");
  t.mock.timers.tick(3100);
  assert.match(game.find(".pond-hint").textContent, /Late hook/);
  game.press();
  game.close();
  t.mock.timers.tick(10000);
  game.open();
  game.find(".phase-idle");
  assert.equal(game.wallet.state.tokens, 1200);
  assert.equal(game.wallet.state.stats.fish, undefined);
  assert.equal(game.wallet.get("fishing.pond.v1").casts, 3);
});
