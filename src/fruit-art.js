export const JUICE_COLORS = Object.freeze({
  pear: ["#c8dd3c", "#f3ef9a"],
  apple: ["#e8443b", "#fff0c7"],
  peach: ["#f47f68", "#ffd0a3"],
  watermelon: ["#ef4f63", "#8ac34a"],
  pineapple: ["#f4b82f", "#f8df62"],
  strawberry: ["#e63e4c", "#ff98a0"],
  kiwi: ["#79b94d", "#d6e78d"],
  banana: ["#f6ce32", "#fff09a"],
  dragonfruit: ["#f24d86", "#fff7e7"],
});

export function drawScene(ctx, width, height, time, active) {
  const horizon = height * 0.68;
  ctx.fillStyle = active ? "#cbeaf0" : "#dff3e6";
  ctx.fillRect(0, 0, width, height);

  drawSun(ctx, width * 0.84, Math.max(68, height * 0.14), Math.min(58, width * 0.09));
  drawCloud(ctx, width * 0.14 + Math.sin(time * 0.00008) * 14, height * 0.17, width);
  drawCloud(ctx, width * 0.58 + Math.cos(time * 0.00006) * 10, height * 0.27, width * 0.7);

  ctx.fillStyle = "#70b976";
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.quadraticCurveTo(width * 0.2, horizon - height * 0.14, width * 0.43, horizon - height * 0.02);
  ctx.quadraticCurveTo(width * 0.7, horizon - height * 0.18, width, horizon - height * 0.04);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  drawOrchard(ctx, width, horizon, height);

  ctx.fillStyle = "#e7b36a";
  ctx.fillRect(0, height * 0.86, width, height * 0.14);
  ctx.fillStyle = "rgba(113, 69, 34, 0.13)";
  for (let x = 0; x < width; x += 96) {
    ctx.fillRect(x, height * 0.86, 2, height * 0.14);
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(0, height * 0.86, width, 5);
}

function drawSun(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#eaa51d";
  ctx.lineWidth = 4;
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 1.28, Math.sin(angle) * radius * 1.28);
    ctx.lineTo(Math.cos(angle) * radius * 1.5, Math.sin(angle) * radius * 1.5);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffd34f";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, width) {
  const size = Math.max(18, Math.min(34, width * 0.035));
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.arc(x, y, size, Math.PI, Math.PI * 2);
  ctx.arc(x + size * 0.9, y - size * 0.45, size * 0.85, Math.PI, Math.PI * 2);
  ctx.arc(x + size * 1.75, y, size * 0.72, Math.PI, Math.PI * 2);
  ctx.lineTo(x + size * 2.5, y + size * 0.55);
  ctx.lineTo(x - size, y + size * 0.55);
  ctx.closePath();
  ctx.fill();
}

function drawOrchard(ctx, width, horizon, height) {
  const treeCount = Math.max(4, Math.ceil(width / 210));
  for (let i = 0; i < treeCount; i += 1) {
    const x = ((i + 0.35) / treeCount) * width;
    const scale = Math.min(1.2, Math.max(0.7, width / 900));
    ctx.fillStyle = "#7b5634";
    ctx.fillRect(x - 7 * scale, horizon - 40 * scale, 14 * scale, 95 * scale);
    ctx.fillStyle = i % 2 ? "#2f8457" : "#3d9361";
    ctx.beginPath();
    ctx.arc(x, horizon - 56 * scale, 52 * scale, 0, Math.PI * 2);
    ctx.arc(x - 34 * scale, horizon - 30 * scale, 38 * scale, 0, Math.PI * 2);
    ctx.arc(x + 35 * scale, horizon - 28 * scale, 40 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e75a43";
    ctx.beginPath();
    ctx.arc(x - 28 * scale, horizon - 51 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25 * scale, horizon - 67 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(26, 93, 58, 0.12)";
  ctx.fillRect(0, horizon + height * 0.11, width, height * 0.1);
}

export function drawFruit(ctx, object, half = null) {
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.rotate(object.rotation || 0);
  const scaleX = object.scaleX || 1;
  ctx.scale(scaleX, 1);

  if (half) {
    const radius = object.radius;
    ctx.beginPath();
    if (half === "left") ctx.rect(-radius * 1.7, -radius * 1.8, radius * 1.7, radius * 3.6);
    else ctx.rect(0, -radius * 1.8, radius * 1.7, radius * 3.6);
    ctx.clip();
  }

  const draw = fruitDrawers[object.fruitId] || drawApple;
  draw(ctx, object.radius);
  ctx.restore();
}

function fruitOutline(ctx) {
  ctx.strokeStyle = "rgba(23, 49, 43, 0.72)";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function shine(ctx, x, y, radius) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.22, radius * 0.42, -0.65, 0, Math.PI * 2);
  ctx.fill();
}

function drawStemAndLeaf(ctx, radius, leafColor = "#33784b") {
  ctx.strokeStyle = "#684625";
  ctx.lineWidth = Math.max(2, radius * 0.09);
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.7);
  ctx.quadraticCurveTo(radius * 0.05, -radius * 1.08, radius * 0.22, -radius * 1.18);
  ctx.stroke();
  ctx.fillStyle = leafColor;
  ctx.beginPath();
  ctx.ellipse(radius * 0.32, -radius * 0.95, radius * 0.32, radius * 0.14, -0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawPear(ctx, r) {
  ctx.fillStyle = "#c9dc43";
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(-r * 0.48, -r * 0.68, -r * 0.35, -r * 0.25, -r * 0.8, r * 0.2);
  ctx.bezierCurveTo(-r * 1.05, r * 0.85, -r * 0.55, r, 0, r);
  ctx.bezierCurveTo(r * 0.55, r, r * 1.05, r * 0.85, r * 0.8, r * 0.2);
  ctx.bezierCurveTo(r * 0.35, -r * 0.25, r * 0.48, -r * 0.68, 0, -r);
  ctx.closePath();
  ctx.fill();
  fruitOutline(ctx);
  shine(ctx, -r * 0.25, -r * 0.05, r);
  drawStemAndLeaf(ctx, r);
}

function drawApple(ctx, r) {
  ctx.fillStyle = "#e84b3e";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.66);
  ctx.bezierCurveTo(-r * 0.62, -r * 1.04, -r * 1.03, -r * 0.45, -r, r * 0.22);
  ctx.bezierCurveTo(-r * 0.93, r * 0.88, -r * 0.34, r, 0, r * 0.82);
  ctx.bezierCurveTo(r * 0.34, r, r * 0.93, r * 0.88, r, r * 0.22);
  ctx.bezierCurveTo(r * 1.03, -r * 0.45, r * 0.62, -r * 1.04, 0, -r * 0.66);
  ctx.closePath();
  ctx.fill();
  fruitOutline(ctx);
  shine(ctx, -r * 0.34, -r * 0.1, r);
  drawStemAndLeaf(ctx, r);
}

function drawPeach(ctx, r) {
  ctx.fillStyle = "#f4866f";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.9);
  ctx.bezierCurveTo(-r * 0.78, -r * 1.02, -r * 1.05, -r * 0.22, -r * 0.75, r * 0.55);
  ctx.bezierCurveTo(-r * 0.45, r, -r * 0.12, r * 1.05, 0, r * 0.75);
  ctx.bezierCurveTo(r * 0.12, r * 1.05, r * 0.45, r, r * 0.75, r * 0.55);
  ctx.bezierCurveTo(r * 1.05, -r * 0.22, r * 0.78, -r * 1.02, 0, -r * 0.9);
  ctx.closePath();
  ctx.fill();
  fruitOutline(ctx);
  ctx.strokeStyle = "rgba(172, 72, 65, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.75);
  ctx.quadraticCurveTo(-r * 0.15, 0, 0, r * 0.72);
  ctx.stroke();
  shine(ctx, -r * 0.34, -r * 0.18, r);
  drawStemAndLeaf(ctx, r);
}

function drawWatermelon(ctx, r) {
  ctx.fillStyle = "#39975a";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  fruitOutline(ctx);
  ctx.strokeStyle = "#8dce5d";
  ctx.lineWidth = Math.max(2, r * 0.1);
  for (const offset of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(offset * r, 0, r * 0.2, r * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  shine(ctx, -r * 0.32, -r * 0.25, r);
}

function drawPineapple(ctx, r) {
  ctx.fillStyle = "#efb62d";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.12, r * 0.74, r, 0, 0, Math.PI * 2);
  ctx.fill();
  fruitOutline(ctx);
  ctx.strokeStyle = "rgba(125, 84, 26, 0.5)";
  ctx.lineWidth = 1.5;
  for (let y = -r * 0.55; y <= r * 0.7; y += r * 0.36) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, y - r * 0.25);
    ctx.lineTo(r * 0.55, y + r * 0.25);
    ctx.moveTo(r * 0.55, y - r * 0.25);
    ctx.lineTo(-r * 0.55, y + r * 0.25);
    ctx.stroke();
  }
  ctx.fillStyle = "#2c8b57";
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.14, -r * 0.65);
    ctx.lineTo(i * r * 0.25, -r * 1.4);
    ctx.lineTo((i + 0.5) * r * 0.13, -r * 0.82);
    ctx.closePath();
    ctx.fill();
  }
}

function drawStrawberry(ctx, r) {
  ctx.fillStyle = "#e63f4c";
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(-r * 0.25, r * 0.76, -r * 0.95, r * 0.2, -r * 0.82, -r * 0.4);
  ctx.bezierCurveTo(-r * 0.7, -r * 0.96, r * 0.7, -r * 0.96, r * 0.82, -r * 0.4);
  ctx.bezierCurveTo(r * 0.95, r * 0.2, r * 0.25, r * 0.76, 0, r);
  ctx.closePath();
  ctx.fill();
  fruitOutline(ctx);
  ctx.fillStyle = "#ffe16b";
  for (const [x, y] of [[-0.35, -0.3], [0.25, -0.4], [0, 0], [-0.25, 0.35], [0.3, 0.25]]) {
    ctx.beginPath();
    ctx.ellipse(x * r, y * r, r * 0.05, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#35874d";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.73, r * 0.42, r * 0.12, (Math.PI * 2 * i) / 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKiwi(ctx, r) {
  ctx.fillStyle = "#8b6641";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
  ctx.fill();
  fruitOutline(ctx);
  ctx.fillStyle = "#7fbe4d";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.68, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4edb0";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.18, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#252d24";
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * r * 0.43, Math.sin(angle) * r * 0.53, r * 0.035, r * 0.075, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBanana(ctx, r) {
  ctx.fillStyle = "#f6ce32";
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.55);
  ctx.bezierCurveTo(-r * 0.35, r * 0.72, r * 0.75, r * 0.65, r, -r * 0.32);
  ctx.bezierCurveTo(r * 0.42, r * 0.15, -r * 0.25, r * 0.02, -r * 0.68, -r * 0.78);
  ctx.closePath();
  ctx.fill();
  fruitOutline(ctx);
  ctx.fillStyle = "#6f5424";
  ctx.beginPath();
  ctx.arc(-r * 0.8, -r * 0.67, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.94, -r * 0.34, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(126, 91, 23, 0.38)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.1, r * 0.45, r * 0.72, -r * 0.23);
  ctx.stroke();
}

function drawDragonfruit(ctx, r) {
  ctx.fillStyle = "#f04d86";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.78, r, 0, 0, Math.PI * 2);
  ctx.fill();
  fruitOutline(ctx);
  ctx.fillStyle = "#5fac55";
  for (const [x, y, angle] of [[-0.55, -0.5, -0.8], [0.55, -0.45, 0.8], [-0.65, 0.18, -1.1], [0.62, 0.18, 1.1], [-0.35, 0.7, -2.3], [0.35, 0.68, 2.3]]) {
    ctx.beginPath();
    ctx.moveTo(x * r, y * r);
    ctx.quadraticCurveTo((x + Math.cos(angle) * 0.35) * r, (y + Math.sin(angle) * 0.35) * r, (x + Math.cos(angle) * 0.58) * r, (y + Math.sin(angle) * 0.58) * r);
    ctx.quadraticCurveTo((x + 0.1) * r, (y + 0.05) * r, x * r, y * r);
    ctx.fill();
  }
  shine(ctx, -r * 0.25, -r * 0.28, r);
}

export function drawBomb(ctx, object) {
  const r = object.radius;
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.rotate(object.rotation || 0);
  ctx.fillStyle = "#202d2b";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0d1816";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.38, r * 0.2, r * 0.34, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#70512e";
  ctx.lineWidth = Math.max(4, r * 0.13);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(r * 0.38, -r * 0.75);
  ctx.quadraticCurveTo(r * 0.68, -r * 1.15, r * 0.94, -r * 1.02);
  ctx.stroke();
  ctx.fillStyle = "#ffcc3c";
  ctx.beginPath();
  ctx.arc(r, -r, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ee6a35";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(angle) * r * 0.24, -r + Math.sin(angle) * r * 0.24);
    ctx.lineTo(r + Math.cos(angle) * r * 0.38, -r + Math.sin(angle) * r * 0.38);
    ctx.stroke();
  }
  ctx.restore();
}

const fruitDrawers = {
  pear: drawPear,
  apple: drawApple,
  peach: drawPeach,
  watermelon: drawWatermelon,
  pineapple: drawPineapple,
  strawberry: drawStrawberry,
  kiwi: drawKiwi,
  banana: drawBanana,
  dragonfruit: drawDragonfruit,
};
