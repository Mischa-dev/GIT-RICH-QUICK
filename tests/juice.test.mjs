import assert from "node:assert/strict";
import { test } from "node:test";
import {
  comboWord,
  hypeTiers,
  juiceOf,
  levelFor,
  levelReward,
  rankFor,
  tierFor,
  winTier,
  xpToNext,
} from "../src/juice.js";

test("hype tiers climb at their thresholds and multiply wins", () => {
  assert.equal(tierFor(0), 0);
  assert.equal(tierFor(19.9), 0);
  assert.equal(tierFor(20), 1);
  assert.equal(tierFor(45), 2);
  assert.equal(tierFor(70), 3);
  assert.equal(tierFor(100), 4);
  assert.deepEqual(
    hypeTiers.map((t) => t.mult),
    [1, 1.1, 1.25, 1.5, 2],
  );
});

test("levels consume XP in order and never skip a reward", () => {
  assert.deepEqual(levelFor(0), { level: 1, into: 0, need: xpToNext(1) });
  const two = xpToNext(1);
  assert.equal(levelFor(two - 1).level, 1);
  assert.equal(levelFor(two).level, 2);
  assert.equal(levelFor(two + xpToNext(2)).level, 3);
  assert.ok(xpToNext(10) > xpToNext(9));
  assert.ok(levelReward(5) > levelReward(4));
  assert.equal(rankFor(1), "ROOKIE");
  assert.equal(rankFor(18), "10× ENGINEER");
});

test("win tiers scale with the payout-to-bet ratio", () => {
  assert.equal(winTier(0, 50), "miss");
  assert.equal(winTier(50, 50), "push");
  assert.equal(winTier(100, 50), "nice");
  assert.equal(winTier(200, 50), "big");
  assert.equal(winTier(500, 50), "mega");
  assert.equal(winTier(2000, 50), "jackpot");
});

test("combo words escalate", () => {
  assert.equal(comboWord(3), "");
  assert.equal(comboWord(8), "NICE");
  assert.equal(comboWord(70), "UNHINGED");
  assert.equal(comboWord(250), "GODLIKE");
});

test("machines run silently when the engine is absent", () => {
  const quiet = juiceOf({});
  assert.equal(quiet.enabled, false);
  assert.equal(quiet.heat, 0);
  assert.equal(quiet.payout({ amount: 100 }), 0);
  assert.doesNotThrow(() => {
    quiet.burst();
    quiet.shake(1);
    quiet.banner({ title: "X" });
  });
  const real = { enabled: true };
  assert.equal(juiceOf({ juice: real }), real);
});

import { colorOf, settle, spinPocket, wheelOrder } from "../src/allin.js";

test("the all-in wheel is a fair European single-zero wheel", () => {
  assert.equal(wheelOrder.length, 37);
  assert.deepEqual([...wheelOrder].sort((a, b) => a - b), [...Array(37).keys()]);
  const counts = { red: 0, black: 0, green: 0 };
  for (const n of wheelOrder) counts[colorOf(n)]++;
  assert.deepEqual(counts, { red: 18, black: 18, green: 1 });
  assert.equal(settle("red", 32, 400), 800);
  assert.equal(settle("red", 15, 400), 0);
  assert.equal(settle("black", 0, 400), 0, "zero beats both colours");
  for (let i = 0; i < 200; i++) {
    const pocket = spinPocket();
    assert.ok(Number.isInteger(pocket) && pocket >= 0 && pocket < 37);
  }
});

import { FEVER, bigNum } from "../src/juice.js";

test("fever is a real bonus round and huge balances stay readable", () => {
  assert.ok(FEVER.mult > hypeTiers.at(-1).mult, "fever pays more than the top hype tier");
  assert.ok(FEVER.speed > 1 && FEVER.maxMs > FEVER.ms && FEVER.comedown > 0);
  assert.equal(juiceOf({}).speed, 1, "machines run at normal speed without the engine");
  assert.equal(juiceOf({}).fever, false);
  assert.equal(bigNum(1234567), "1,234,567");
  assert.equal(bigNum(12_340_000), "12.34M");
  assert.equal(bigNum(7_800_000_000), "7.8B");
});
