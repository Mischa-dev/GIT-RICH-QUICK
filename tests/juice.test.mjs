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
