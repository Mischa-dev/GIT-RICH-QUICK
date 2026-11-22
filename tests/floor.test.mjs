import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { initFloor } from "../src/floor.js";
import { createEconomy } from "../src/economy.js";

function setup(t) {
  const win = new Window({ url: "http://localhost" });
  const doc = win.document;
  const previousDocument = globalThis.document;
  const previousMedia = globalThis.matchMedia;
  globalThis.document = doc;
  globalThis.matchMedia = () => ({ matches: true });
  win.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect() {},
    clearRect() {},
  });

  let now = 100000;
  let random = 0.5;
  let floor;
  let api;
  let close;
  let funded;
  t.mock.method(Math, "random", () => random);
  t.mock.method(Date, "now", () => now);

  function reload() {
    floor?.destroy();
    close = undefined;
    doc.body.innerHTML = '<div id="floor-cards"></div><main></main>';
    api = {
      ...createEconomy(win.localStorage, () => floor?.update()),
      sound() {},
      toast() {},
      fx() {},
      modal(title, content, options) {
        close?.();
        close = options.onClose;
        doc.querySelector("main").replaceChildren(content);
      },
      fund(reason, resume) {
        close?.();
        funded = resume;
      },
    };
    floor = initFloor(api);
  }
  function find(selector) {
    const element = doc.querySelector(selector);
    assert.ok(element, "Expected " + selector);
    return element;
  }
  reload();
  t.after(async () => {
    floor.destroy();
    globalThis.document = previousDocument;
    globalThis.matchMedia = previousMedia;
    await win.happyDOM.abort();
  });

  return {
    get api() {
      return api;
    },
    get funded() {
      return funded;
    },
    get credits() {
      return api.state.tokens;
    },
    open: (id) => find('[data-game="' + id + '"]').click(),
    click: (selector) => find(selector).click(),
    find,
    reload,
    close: () => close?.(),
    draw: (value) => {
      random = value;
    },
    advance: (ms) => {
      now += ms;
    },
  };
}

test("Merge Conflict quotes the payout, pays a winning call and refunds a tie", (t) => {
  const game = setup(t);
  game.open("merge");
  assert.equal(game.find(".fl-revision b").textContent, "05");
  const higher = ".fl-direction:last-child";
  assert.match(game.find(higher).textContent, /Returns 100 T/);
  game.draw(0.65); // Revision 06 against 05
  game.click(higher);
  assert.equal(game.credits, 1250);
  assert.match(game.find(".fl-receipt").textContent, /05 → 06/);
  game.click(".fl-primary");
  game.click(higher);
  assert.equal(game.credits, 1250);
  assert.match(game.find(".fl-receipt").textContent, /Wager returned/);
  assert.equal(game.api.state.stats.floorPlays, 2);
});

test("Blame Roulette settles its eight-sector result once, including when the modal closes mid-spin", (t) => {
  const game = setup(t);
  game.open("roulette");
  game.click(".fl-suspect:nth-of-type(3)");
  assert.match(game.find(".fl-primary").textContent, /400 T/);
  game.draw(0.3); // Sector 2: DNS
  game.click(".fl-primary");
  assert.equal(game.credits, 1550);
  assert.equal(game.find(".fl-primary").disabled, true);
  game.close();
  game.reload();
  game.open("roulette");
  assert.equal(game.credits, 1550);
  assert.match(game.find(".fl-receipt").textContent, /DNS/);
  game.draw(0.01); // Sector 0: Frontend
  game.click(".fl-primary");
  assert.equal(game.credits, 1500);
  assert.equal(game.api.state.stats.floorPlays, 2);
});

test("Deploy or Die resumes in flight after reload and settles manual cashout, crash and orbit once", (t) => {
  const game = setup(t);
  game.open("deploy");
  game.draw(0.5); // Crashes at 2x
  game.click(".fl-primary");
  assert.equal(game.credits, 1150);
  game.close();
  assert.match(game.find('[data-game="deploy"]').textContent, /in flight/);
  game.advance(2500);
  game.reload();
  game.open("deploy");
  assert.match(game.find(".fl-primary").textContent, /Cash out 80 T/);
  game.click(".fl-primary");
  assert.equal(game.credits, 1230);
  assert.equal(game.api.get("floor.flight"), null);
  assert.match(game.find(".fl-receipt").textContent, /Rollback secured/);

  game.draw(0.98);
  game.click(".fl-primary");
  game.advance(400);
  game.reload();
  game.open("deploy");
  assert.match(game.find(".fl-receipt").textContent, /Production is down/);
  assert.equal(game.credits, 1180);

  game.draw(0.02); // Would reach 50x, auto-pays at the 8x ceiling
  game.click(".fl-primary");
  game.advance(15000);
  game.reload();
  game.open("deploy");
  assert.match(game.find(".fl-receipt").textContent, /Orbit reached/);
  assert.equal(game.credits, 1530);
  game.reload();
  assert.equal(game.credits, 1530);
  assert.equal(game.api.state.stats.floorPlays, 3);
});

test("an unfunded wager can return to its cabinet after a refill without charging early", (t) => {
  const game = setup(t);
  game.api.spend(game.credits, "Fixture debit");
  game.open("roulette");
  game.click(".fl-primary");
  assert.equal(typeof game.funded, "function");
  assert.equal(game.api.state.stats.floorPlays, undefined);
  game.api.earn(50, "Sponsor");
  game.funded();
  assert.equal(game.credits, 50);
  assert.equal(game.find(".fl-primary").disabled, false);
  game.draw(0.4);
  game.click(".fl-primary");
  assert.equal(game.api.state.stats.floorPlays, 1);
});
