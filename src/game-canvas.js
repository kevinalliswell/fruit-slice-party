import { pickFruit } from "./game-rules.js";
import { segmentHitsCircle } from "./geometry.js";
import { drawBomb, drawFruit, drawScene, JUICE_COLORS } from "./fruit-art.js";

const GRAVITY = 920;

export class FruitGameCanvas {
  constructor(canvas, { onFruitSlice, onBombSlice }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.onFruitSlice = onFruitSlice;
    this.onBombSlice = onBombSlice;
    this.width = 0;
    this.height = 0;
    this.scene = "menu";
    this.running = false;
    this.paused = false;
    this.objects = [];
    this.pieces = [];
    this.particles = [];
    this.scoreBursts = [];
    this.trails = new Map();
    this.nextSpawnIn = 0;
    this.lastFrame = performance.now();
    this.shake = 0;
    this.flash = 0;
    this.objectId = 0;

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerEnd = this.onPointerEnd.bind(this);

    window.addEventListener("resize", this.resize, { passive: true });
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerEnd);
    canvas.addEventListener("pointercancel", this.onPointerEnd);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.resize();
    requestAnimationFrame(this.frame);
  }

  prepare(difficulty) {
    this.scene = "game";
    this.difficulty = difficulty;
    this.running = false;
    this.paused = false;
    this.clearAction();
  }

  start() {
    this.running = true;
    this.paused = false;
    this.nextSpawnIn = 120;
    this.lastFrame = performance.now();
  }

  pause() {
    this.paused = true;
    this.trails.clear();
  }

  resume() {
    this.paused = false;
    this.lastFrame = performance.now();
  }

  end() {
    this.running = false;
    this.trails.clear();
    this.objects = [];
  }

  showMenu() {
    this.scene = "menu";
    this.running = false;
    this.paused = false;
    this.clearAction();
  }

  clearAction() {
    this.objects = [];
    this.pieces = [];
    this.particles = [];
    this.scoreBursts = [];
    this.trails.clear();
    this.shake = 0;
    this.flash = 0;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width);
    this.height = Math.max(320, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  frame(now) {
    const delta = Math.min(0.035, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    if (!this.paused) {
      if (this.running) {
        this.nextSpawnIn -= delta * 1000;
        if (this.nextSpawnIn <= 0) this.spawnWave();
      }
      this.updateObjects(delta);
      this.updateEffects(delta, now);
    }

    this.draw(now);
    requestAnimationFrame(this.frame);
  }

  spawnWave() {
    const [minimum, maximum] = this.difficulty.launchDelay;
    this.nextSpawnIn = randomBetween(minimum, maximum);
    const groupSize = 1 + Math.floor(Math.random() * this.difficulty.maxGroup);
    const safeWidth = Math.max(1, this.width - 120);
    const groupCenter = 60 + Math.random() * safeWidth;
    let hasFruit = false;

    for (let index = 0; index < groupSize; index += 1) {
      const bomb = Math.random() < this.difficulty.bombChance && (hasFruit || index < groupSize - 1);
      this.spawnObject(bomb ? "bomb" : "fruit", groupCenter, index, groupSize);
      if (!bomb) hasFruit = true;
    }
  }

  spawnObject(kind, groupCenter, index, groupSize) {
    const baseRadius = clamp(Math.min(this.width, this.height) * 0.055, 27, 42);
    const radius = kind === "bomb" ? baseRadius * 0.9 : baseRadius * randomBetween(0.88, 1.08);
    const spacing = Math.min(baseRadius * 2.1, this.width / Math.max(2, groupSize + 1));
    const centeredIndex = index - (groupSize - 1) / 2;
    const x = clamp(groupCenter + centeredIndex * spacing, radius + 8, this.width - radius - 8);
    const flightHeight = this.height * randomBetween(0.6, 0.78);
    const launchSpeed = Math.sqrt(2 * GRAVITY * flightHeight) * this.difficulty.speed;
    const fruit = kind === "fruit" ? pickFruit() : null;

    this.objects.push({
      id: ++this.objectId,
      kind,
      fruitId: fruit?.id,
      points: fruit?.points,
      x,
      y: this.height + radius * 1.4,
      vx: randomBetween(-105, 105) + centeredIndex * 22,
      vy: -launchSpeed * randomBetween(0.94, 1.04),
      radius,
      rotation: randomBetween(-0.5, 0.5),
      spin: randomBetween(-2.4, 2.4),
    });
  }

  updateObjects(delta) {
    for (const object of this.objects) {
      object.vy += GRAVITY * delta;
      object.x += object.vx * delta;
      object.y += object.vy * delta;
      object.rotation += object.spin * delta;
    }
    this.objects = this.objects.filter(
      (object) => object.y < this.height + object.radius * 2 || object.vy < 0,
    );
  }

  updateEffects(delta, now) {
    for (const piece of this.pieces) {
      piece.vy += GRAVITY * 0.75 * delta;
      piece.x += piece.vx * delta;
      piece.y += piece.vy * delta;
      piece.rotation += piece.spin * delta;
      piece.life -= delta;
    }
    this.pieces = this.pieces.filter((piece) => piece.life > 0);

    for (const particle of this.particles) {
      particle.vy += GRAVITY * particle.gravity * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta;
      particle.radius *= 0.992;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    for (const burst of this.scoreBursts) {
      burst.y -= 42 * delta;
      burst.life -= delta;
    }
    this.scoreBursts = this.scoreBursts.filter((burst) => burst.life > 0);

    for (const [pointerId, trail] of this.trails) {
      trail.points = trail.points.filter((point) => now - point.time < 170);
      if (!trail.down && trail.points.length === 0) this.trails.delete(pointerId);
    }

    this.shake *= 0.86;
    this.flash *= 0.84;
  }

  draw(now) {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate(randomBetween(-this.shake, this.shake), randomBetween(-this.shake, this.shake));
    }
    drawScene(ctx, this.width, this.height, now, this.scene === "game");

    if (this.scene === "menu") this.drawMenuFruit(now);
    for (const object of this.objects) {
      if (object.kind === "bomb") drawBomb(ctx, object);
      else drawFruit(ctx, object);
    }
    for (const piece of this.pieces) drawFruit(ctx, piece, piece.half);
    this.drawParticles();
    this.drawScoreBursts();
    this.drawTrails();
    ctx.restore();

    if (this.flash > 0.02) {
      ctx.fillStyle = `rgba(255, 240, 190, ${Math.min(0.72, this.flash)})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawMenuFruit(now) {
    const r = clamp(Math.min(this.width, this.height) * 0.055, 24, 42);
    const y = this.height * 0.845;
    const fruits = this.width < 520
      ? [["watermelon", 0.12], ["banana", 0.88]]
      : [["apple", 0.08], ["pineapple", 0.17], ["watermelon", 0.82], ["dragonfruit", 0.92]];
    fruits.forEach(([fruitId, position], index) => {
      drawFruit(this.ctx, {
        fruitId,
        x: this.width * position,
        y: y + Math.sin(now * 0.0015 + index) * 4,
        radius: fruitId === "pineapple" ? r * 0.88 : r,
        rotation: Math.sin(now * 0.0007 + index) * 0.08,
      });
    });
  }

  drawParticles() {
    for (const particle of this.particles) {
      this.ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, Math.max(1, particle.radius), 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  drawScoreBursts() {
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = "900 24px -apple-system, BlinkMacSystemFont, sans-serif";
    for (const burst of this.scoreBursts) {
      this.ctx.globalAlpha = clamp(burst.life / 0.55, 0, 1);
      this.ctx.lineWidth = 5;
      this.ctx.strokeStyle = "#17312b";
      this.ctx.strokeText(`+${burst.points}`, burst.x, burst.y);
      this.ctx.fillStyle = "#fffdf3";
      this.ctx.fillText(`+${burst.points}`, burst.x, burst.y);
    }
    this.ctx.globalAlpha = 1;
  }

  drawTrails() {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    for (const trail of this.trails.values()) {
      if (trail.points.length < 2) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(trail.points[0].x, trail.points[0].y);
      for (let index = 1; index < trail.points.length; index += 1) {
        this.ctx.lineTo(trail.points[index].x, trail.points[index].y);
      }
      this.ctx.strokeStyle = "rgba(23, 49, 43, 0.25)";
      this.ctx.lineWidth = 10;
      this.ctx.stroke();
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.94)";
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
    }
  }

  onPointerDown(event) {
    if (!this.running || this.paused) return;
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    const point = this.eventPoint(event);
    this.trails.set(event.pointerId, { down: true, points: [{ ...point, time: performance.now() }] });
    this.checkHits(point, point);
  }

  onPointerMove(event) {
    const trail = this.trails.get(event.pointerId);
    if (!trail?.down || !this.running || this.paused) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.() || [event];
    for (const coalescedEvent of events) {
      const point = this.eventPoint(coalescedEvent);
      const previous = trail.points.at(-1) || point;
      trail.points.push({ ...point, time: performance.now() });
      if (trail.points.length > 16) trail.points.shift();
      this.checkHits(previous, point);
      if (!this.running) break;
    }
  }

  onPointerEnd(event) {
    const trail = this.trails.get(event.pointerId);
    if (trail) trail.down = false;
  }

  eventPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  checkHits(start, end) {
    for (const object of [...this.objects]) {
      if (!segmentHitsCircle(start, end, object)) continue;
      this.objects = this.objects.filter((candidate) => candidate.id !== object.id);
      if (object.kind === "bomb") {
        this.burstBomb(object);
        this.onBombSlice(object);
        break;
      }
      this.burstFruit(object);
      this.onFruitSlice(object);
      if (!this.running) break;
    }
  }

  burstFruit(object) {
    const colors = JUICE_COLORS[object.fruitId];
    for (const side of [-1, 1]) {
      this.pieces.push({
        ...object,
        half: side < 0 ? "left" : "right",
        vx: object.vx + side * randomBetween(70, 115),
        vy: object.vy - randomBetween(10, 55),
        spin: side * randomBetween(2.8, 4.6),
        life: 1.15,
      });
    }
    for (let index = 0; index < 13; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(45, 210);
      const life = randomBetween(0.45, 0.9);
      this.particles.push({
        x: object.x,
        y: object.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        radius: randomBetween(2.5, 6),
        color: colors[index % colors.length],
        gravity: 0.32,
        life,
        maxLife: life,
      });
    }
    this.scoreBursts.push({ x: object.x, y: object.y - object.radius, points: object.points, life: 0.7 });
  }

  burstBomb(object) {
    const colors = ["#ffd34f", "#f06a3f", "#273532", "#fff4c8"];
    for (let index = 0; index < 44; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(90, 390);
      const life = randomBetween(0.55, 1.2);
      this.particles.push({
        x: object.x,
        y: object.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: randomBetween(4, 12),
        color: colors[index % colors.length],
        gravity: index % 3 === 0 ? 0.12 : 0.5,
        life,
        maxLife: life,
      });
    }
    this.shake = 18;
    this.flash = 1;
    if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
  }
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
