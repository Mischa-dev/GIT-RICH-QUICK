import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { initSponsors } from "../src/sponsors.js";

function station(t) {
  const page = new Window({ url: "http://localhost" });
  const doc = page.document;
  doc.body.innerHTML = '<section id="sponsor-card"></section><main></main>';
  globalThis.window = page;
  globalThis.document = doc;
  let now = 0;
  t.mock.method(performance, "now", () => now);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(page, "setTimeout", globalThis.setTimeout);
  t.mock.method(page, "clearTimeout", globalThis.clearTimeout);

  let onClose, sponsors, wallet;
  function close() {
    onClose?.();
    onClose = undefined;
    doc.querySelector("main").replaceChildren();
  }
  function reload() {
    close();
    sponsors?.destroy();
    wallet = createEconomy(page.localStorage);
    sponsors = initSponsors({
      ...wallet,
      sound() {},
      toast() {},
      modal(title, content, options) {
        close();
        doc.querySelector("main").append(content);
        onClose = options.onClose;
      },
      closeModal: close,
    });
  }
  reload();
  t.after(async () => {
    close();
    sponsors.destroy();
    delete globalThis.window;
    delete globalThis.document;
    await page.happyDOM.abort();
  });
  return {
    get wallet() {
      return wallet.state;
    },
    get sponsors() {
      return sponsors;
    },
    find(selector) {
      const node = doc.querySelector(selector);
      assert.ok(node, "Missing " + selector);
      return node;
    },
    advance(ms) {
      now += ms;
      t.mock.timers.tick(ms);
    },
    reload,
    close,
  };
}

test("Sponsor TV rotates through 22 distinct spots across reloads and avoids a repeat at the boundary", (t) => {
  const game = station(t);
  const brands = [];
  for (let i = 0; i < 23; i++) {
    if (i === 11) game.reload();
    game.find(".sp-floor-card").click();
    brands.push(game.find(".sp-brand").textContent);
    assert.ok(game.find(".sp-script h3").textContent);
    assert.ok(game.find(".sp-script p").textContent);
    game.close();
  }
  assert.equal(brands[0], "Blame & Blame");
  assert.equal(new Set(brands.slice(0, 22)).size, 22);
  assert.ok(brands.slice(0, 22).includes(brands[22]));
  assert.notEqual(brands[21], brands[22]);
  assert.equal(game.wallet.earned, 0);
});

test("all three commercial cuts air before a single claim credits and resumes the interrupted job", (t) => {
  const game = station(t);
  const balancesAtResume = [];
  game.sponsors.open("Finish this feature.", () =>
    balancesAtResume.push(game.wallet.tokens),
  );
  game.find(".sp-sponsor-button").click();
  const claim = game.find(".sp-claim");
  const cuts = [game.find(".sp-script h3").textContent];
  claim.click();
  assert.equal(game.wallet.tokens, 1200);
  assert.ok(claim.disabled);
  for (let i = 0; i < 2; i++) {
    game.advance(1800);
    cuts.push(game.find(".sp-script h3").textContent);
    assert.ok(claim.disabled);
  }
  assert.equal(new Set(cuts).size, 3);
  game.advance(1800);
  assert.ok(!claim.disabled);
  assert.equal(game.find(".sp-transcript").querySelectorAll("p").length, 3);
  assert.deepEqual(balancesAtResume, []);
  claim.click();
  claim.click();
  assert.equal(game.wallet.tokens, 1550);
  assert.equal(game.wallet.stats.ads, 1);
  assert.deepEqual(balancesAtResume, [1550]);
  game.reload();
  assert.equal(game.wallet.tokens, 1550);
  assert.equal(game.wallet.stats.ads, 1);
});

test("dismissing either an airing or a finished unclaimed spot never funds or resumes the job", (t) => {
  const game = station(t);
  const resume = t.mock.fn();
  for (const elapsed of [1200, 5500]) {
    game.sponsors.open("The build ran out of tokens.", resume);
    game.find(".sp-sponsor-button").click();
    game.advance(elapsed);
    const abandonedClaim = game.find(".sp-claim");
    game.close();
    game.advance(10000);
    abandonedClaim.click();
  }
  assert.equal(game.wallet.tokens, 1200);
  assert.equal(game.wallet.stats.ads ?? 0, 0);
  assert.equal(resume.mock.callCount(), 0);
});

test("each fake refill tier credits its exact offer once and resumes after payment", (t) => {
  const game = station(t);
  const expected = [500, 1250, 2500];
  for (let i = 0; i < expected.length; i++) {
    const oldBalance = game.wallet.tokens;
    const observed = [];
    game.sponsors.open("Need more tokens.", () =>
      observed.push(game.wallet.tokens),
    );
    const offers = game.find(".sp-packages").querySelectorAll("button");
    assert.equal(offers.length, expected.length);
    const button = offers[i];
    button.click();
    button.click();
    assert.equal(game.wallet.tokens, oldBalance + expected[i]);
    assert.deepEqual(observed, [oldBalance + expected[i]]);
  }
  assert.equal(game.wallet.stats.ads ?? 0, 0);
});
