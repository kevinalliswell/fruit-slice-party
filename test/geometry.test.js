import test from "node:test";
import assert from "node:assert/strict";

import { segmentHitsCircle } from "../src/geometry.js";

test("a fast swipe through a fruit counts as a hit", () => {
  assert.equal(
    segmentHitsCircle({ x: 10, y: 50 }, { x: 190, y: 50 }, { x: 100, y: 50, radius: 28 }),
    true,
  );
});

test("a swipe tangent to the fruit edge counts as a hit", () => {
  assert.equal(
    segmentHitsCircle({ x: 10, y: 72 }, { x: 190, y: 72 }, { x: 100, y: 50, radius: 22 }),
    true,
  );
});

test("a nearby swipe outside the fruit does not count as a hit", () => {
  assert.equal(
    segmentHitsCircle({ x: 10, y: 74 }, { x: 190, y: 74 }, { x: 100, y: 50, radius: 22 }),
    false,
  );
});

test("a tap inside the fruit counts as a hit", () => {
  assert.equal(
    segmentHitsCircle({ x: 100, y: 50 }, { x: 100, y: 50 }, { x: 100, y: 50, radius: 22 }),
    true,
  );
});
