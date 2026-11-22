import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { Window } from "happy-dom";
import { createEconomy } from "../src/economy.js";
import { initDesk } from "../src/desk.js";
import { initSponsors } from "../src/sponsors.js";

function arcade(t) {
  const browser = new Window({ url: "https://arcade.example/" });
  const { document, localStorage } = browser;
  const timers = new Map();
  let now = 0;
  let nextId = 0;
  let desk, sponsors, api, closeHandler;

  // No sleeps. The worker, sponsor tape and test all advance on the same clock.
  t.mock.method(browser, "setTimeout", (task, delay) => {
    timers.set(++nextId, { at: now + delay, task });
    return nextId;
  });
  t.mock.method(browser, "clearTimeout", (id) => timers.delete(id));
  t.mock.method(performance, "now", () => now);
  const before = { window: globalThis.window, document: globalThis.document };
  Object.assign(globalThis, { window: browser, document });
  t.after(async () => {
    desk.destroy();
    sponsors.destroy();
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
  function close() {
    closeHandler?.();
    closeHandler = undefined;
    document.querySelector("main")?.replaceChildren();
  }
  function reload() {
    desk?.destroy();
    sponsors?.destroy();
    close();
    timers.clear();
    document.body.innerHTML = '<div id="agent-card"></div><main></main>';
    const wallet = createEconomy(localStorage);
    api = {
      ...wallet,
      modal(_title, node, { onClose } = {}) {
        close();
        document.querySelector("main").append(node);
        closeHandler = onClose;
      },
      closeModal: close,
      fund: (reason, resume) => sponsors.open(reason, resume),
      sound() {},
      fx() {},
      toast() {},
      openT3() {},
    };
    sponsors = initSponsors(api);
    desk = initDesk(api);
    desk.open();
  }
  reload();
  function click(selector) {
    const button = document.querySelector(selector);
    assert.ok(button, "Expected control " + selector);
    button.click();
    return button;
  }
  return {
    document,
    advance,
    reload,
    click,
    action: (name) => click(`[data-desk-action="${name}"]`),
    get wallet() {
      return api.state;
    },
    get run() {
      return api.get("workstation-v1", {}).run;
    },
    get archive() {
      return api.get("workstation-v1", {}).history;
    },
  };
}

test("overclock writes a patch, stalls five tokens short, and one sponsor ad finishes it", (t) => {
  const game = arcade(t);
  game.click('[data-speed="1"]');
  game.action("start");
  game.advance(12000);
  assert.equal(game.run.phase, 4);
  assert.equal(game.run.status, "blocked");
  assert.equal(game.wallet.tokens, 257);
  assert.match(
    game.document.querySelector(".sp-reason").textContent,
    /5 short/,
  );

  game.click(".sp-sponsor-button");
  const claim = game.document.querySelector(".sp-claim");
  assert.equal(claim.disabled, true);
  game.advance(6100);
  assert.equal(claim.disabled, false);
  claim.click();
  // A stale button may still dispatch an event after the modal switches owners.
  claim.click();
  assert.equal(game.wallet.stats.ads, 1);
  assert.equal(game.wallet.tokens, 607);
  assert.equal(game.run.status, "running");
  game.advance(12000);
  assert.equal(game.run.status, "shipped");
  assert.equal(game.run.spent, 1545);
  assert.equal(game.run.reward, 2350);
  assert.equal(game.wallet.tokens, 2355);
  assert.equal(game.wallet.stats.commits, 1);
  assert.equal(game.archive.length, 1);
  const debits = game.wallet.events.filter((e) => e.amount < 0);
  assert.equal(debits.length, 7);
  assert.equal(
    game.wallet.events.filter((e) => e.text.startsWith("Contract shipped"))
      .length,
    1,
  );

  game.reload();
  game.advance(60000);
  assert.equal(game.wallet.tokens, 2355);
  assert.equal(game.wallet.stats.commits, 1);
  assert.equal(game.run.status, "shipped");
  assert.equal(game.archive.length, 1);
});

test("pause and reload preserve the paid checkpoint without rebilling a completed step", (t) => {
  const game = arcade(t);
  game.action("start");
  game.advance(2000);
  assert.equal(game.run.phase, 2);
  assert.equal(game.wallet.tokens, 1055);
  game.action("pause");
  game.advance(60000);
  assert.equal(game.run.phase, 2);
  assert.equal(game.wallet.tokens, 1055);
  const hash = game.run.hash;
  game.action("resume");
  game.advance(250);
  assert.equal(game.run.phase, 3);
  assert.equal(game.wallet.tokens, 985);
  game.reload();
  game.advance(60000);
  assert.equal(game.run.phase, 3);
  assert.equal(game.run.status, "paused");
  assert.equal(game.wallet.tokens, 985);
  game.action("resume");
  game.advance(12000);
  assert.equal(game.run.hash, hash);
  assert.equal(game.run.status, "shipped");
  assert.equal(game.run.spent, 590);
  assert.equal(game.wallet.tokens, 1435);
  assert.equal(game.archive[0].hash, hash);
  game.action("next");
  assert.equal(
    game.document.querySelectorAll("select option:not([disabled])").length,
    3,
  );
});

test("all eight unlockable contracts export patches that apply to their fixture", async (t) => {
  const game = arcade(t);
  const folder = await mkdtemp(join(tmpdir(), "grq-ticket-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  let downloaded;
  t.mock.method(URL, "createObjectURL", (blob) => {
    downloaded = blob;
    return "blob:https://arcade.example/patch";
  });
  t.mock.method(window.HTMLAnchorElement.prototype, "click", function () {
    assert.equal(this.download, "git-rich-" + game.run.hash + ".patch");
  });
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    game.action("start");
    game.advance(20000);
    assert.equal(game.run.status, "shipped");
    seen.add(game.run.contract);
    game.action("patch");
    const patch = await downloaded.text();
    const file = /^--- a\/(.+)$/m.exec(patch)[1];
    const hunk = patch
      .split(/@@ -\d+,\d+ \+\d+,\d+ @@\n/)[1]
      .trimEnd()
      .split("\n");
    const original =
      hunk
        .filter((l) => l.startsWith("-"))
        .map((l) => l.slice(1))
        .join("\n") + "\n";
    const result =
      hunk
        .filter((l) => l.startsWith("+"))
        .map((l) => l.slice(1))
        .join("\n") + "\n";
    const fixture = join(folder, file);
    await mkdir(dirname(fixture), { recursive: true });
    await writeFile(fixture, original);
    execFileSync("git", ["apply", "--whitespace=error", "-"], {
      cwd: folder,
      input: patch,
    });
    assert.equal(await readFile(fixture, "utf8"), result);
    game.action("next");
  }
  assert.equal(seen.size, 8);
});
