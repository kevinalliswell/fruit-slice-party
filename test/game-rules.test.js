import test from "node:test";
import assert from "node:assert/strict";

import {
  DIFFICULTIES,
  FRUIT_TYPES,
  createRound,
  sliceTarget,
  updateRound,
} from "../src/game-rules.js";

test("fruit points match the agreed score table", () => {
  assert.deepEqual(
    Object.fromEntries(FRUIT_TYPES.map(({ id, points }) => [id, points])),
    {
      pear: 1,
      apple: 2,
      peach: 3,
      watermelon: 5,
      pineapple: 8,
      strawberry: 10,
      kiwi: 10,
      banana: 20,
      dragonfruit: 50,
    },
  );
});

test("difficulty settings use the agreed time and score targets", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(DIFFICULTIES).map(([id, value]) => [
        id,
        { seconds: value.seconds, targetScore: value.targetScore },
      ]),
    ),
    {
      easy: { seconds: 120, targetScore: 200 },
      medium: { seconds: 300, targetScore: 800 },
      hard: { seconds: 600, targetScore: 2000 },
    },
  );
});

test("slicing fruit adds its points and reaching the target wins early", () => {
  const nearlyWon = { ...createRound("easy"), score: 190 };
  const result = sliceTarget(nearlyWon, { kind: "fruit", fruitId: "banana" });

  assert.equal(result.score, 210);
  assert.equal(result.status, "won");
  assert.equal(result.endReason, "target");
});

test("slicing a bomb immediately loses and clears the score", () => {
  const activeRound = { ...createRound("medium"), score: 317 };
  const result = sliceTarget(activeRound, { kind: "bomb" });

  assert.equal(result.score, 0);
  assert.equal(result.status, "lost");
  assert.equal(result.endReason, "bomb");
});

test("missing fruit does not change score or round status", () => {
  const activeRound = { ...createRound("hard"), score: 99 };
  const result = updateRound(activeRound, 1);

  assert.equal(result.score, 99);
  assert.equal(result.status, "playing");
});

test("running out of time before the target loses without clearing score", () => {
  const activeRound = {
    ...createRound("easy"),
    score: 123,
    remainingSeconds: 0.4,
  };
  const result = updateRound(activeRound, 0.5);

  assert.equal(result.score, 123);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.status, "lost");
  assert.equal(result.endReason, "timeout");
});

test("finished rounds ignore later slices and timer updates", () => {
  const finished = {
    ...createRound("easy"),
    score: 0,
    status: "lost",
    endReason: "bomb",
  };

  assert.strictEqual(sliceTarget(finished, { kind: "fruit", fruitId: "kiwi" }), finished);
  assert.strictEqual(updateRound(finished, 1), finished);
});
