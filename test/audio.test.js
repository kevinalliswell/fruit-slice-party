import test from "node:test";
import assert from "node:assert/strict";

import { SoundBoard } from "../src/audio.js";

test("audio unlock waits for a suspended mobile context and primes it", async () => {
  class DelayedAudioContext {
    constructor() {
      this.state = "suspended";
      this.sampleRate = 44100;
      this.destination = {};
      this.sourceStarted = false;
    }

    resume() {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.state = "running";
          resolve();
        }, 5);
      });
    }

    createBuffer() {
      return {};
    }

    createBufferSource() {
      return {
        connect: () => {},
        start: () => { this.sourceStarted = true; },
      };
    }
  }

  const sound = new SoundBoard({ AudioContextClass: DelayedAudioContext });
  const unlocking = sound.unlock();

  assert.equal(sound.ready(), false);
  assert.equal(await unlocking, true);
  assert.equal(sound.ready(), true);
  assert.equal(sound.context.sourceStarted, true);
});

test("audio unlock degrades safely when Web Audio is unavailable", async () => {
  const sound = new SoundBoard({ AudioContextClass: null });

  assert.equal(await sound.unlock(), false);
  assert.equal(sound.ready(), false);
});
