export class SoundBoard {
  constructor(options = {}) {
    this.enabled = true;
    this.context = null;
    this.primed = false;
    this.AudioContextClass = Object.prototype.hasOwnProperty.call(options, "AudioContextClass")
      ? options.AudioContextClass
      : globalThis.AudioContext || globalThis.webkitAudioContext || null;
  }

  async setEnabled(enabled) {
    this.enabled = enabled;
    return enabled ? this.unlock() : false;
  }

  async unlock() {
    if (!this.enabled || !this.AudioContextClass) return false;
    if (!this.context) {
      this.context = new this.AudioContextClass();
    }

    if (!this.primed) {
      try {
        const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(0);
        this.primed = true;
      } catch {
        return false;
      }
    }

    if (this.context.state !== "running") {
      try {
        await this.context.resume();
      } catch {
        return false;
      }
    }
    return this.context.state === "running";
  }

  tick(final = false) {
    this.tone(final ? 680 : 440, 0.08, "sine", 0.055);
  }

  slice(points) {
    const pitch = Math.min(720, 330 + points * 8);
    this.tone(pitch, 0.075, "triangle", 0.045, pitch * 1.35);
  }

  bomb() {
    if (!this.ready()) return;
    const duration = 0.45;
    const frameCount = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(90, this.context.currentTime + duration);
    gain.gain.setValueAtTime(0.14, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
  }

  win() {
    [523, 659, 784].forEach((frequency, index) => {
      globalThis.setTimeout(() => this.tone(frequency, 0.22, "triangle", 0.05), index * 100);
    });
  }

  lose() {
    this.tone(240, 0.34, "sawtooth", 0.035, 120);
  }

  tone(frequency, duration, type, volume, endFrequency = frequency) {
    if (!this.ready()) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  ready() {
    return this.enabled && this.context?.state === "running";
  }
}
