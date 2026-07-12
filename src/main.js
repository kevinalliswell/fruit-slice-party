import "./styles.css";
import { SoundBoard } from "./audio.js";
import { FruitGameCanvas } from "./game-canvas.js";
import {
  DIFFICULTIES,
  FRUIT_TYPES,
  createRound,
  sliceTarget,
  updateRound,
} from "./game-rules.js";

const modeList = document.querySelector("#mode-list");
const scoreList = document.querySelector("#score-list");
const app = document.querySelector("#app");
const canvas = document.querySelector("#game-canvas");
const hud = document.querySelector("#hud");
const scoreValue = document.querySelector("#score-value");
const targetValue = document.querySelector("#target-value");
const timerValue = document.querySelector("#timer-value");
const menuScreen = document.querySelector("#menu-screen");
const countdownScreen = document.querySelector("#countdown-screen");
const countdownValue = document.querySelector("#countdown-value");
const pauseScreen = document.querySelector("#pause-screen");
const resultScreen = document.querySelector("#result-screen");
const resultIcon = document.querySelector("#result-icon");
const resultKicker = document.querySelector("#result-kicker");
const resultTitle = document.querySelector("#result-title");
const resultScore = document.querySelector("#result-score");
const resultMessage = document.querySelector("#result-message");
const pauseButton = document.querySelector("#pause-button");
const resumeButton = document.querySelector("#resume-button");
const retryButton = document.querySelector("#retry-button");
const pauseHomeButton = document.querySelector("#pause-home-button");
const resultHomeButton = document.querySelector("#result-home-button");
const soundButton = document.querySelector("#sound-button");
const announcer = document.querySelector("#announcer");

const modeDescriptions = {
  easy: "慢速 · 炸弹少",
  medium: "加速 · 炸弹变多",
  hard: "高速 · 炸弹最多",
};

const fruitSymbols = {
  pear: "梨",
  apple: "苹",
  peach: "桃",
  watermelon: "瓜",
  pineapple: "菠",
  strawberry: "莓",
  kiwi: "猕",
  banana: "蕉",
  dragonfruit: "龙",
};

for (const difficulty of Object.values(DIFFICULTIES)) {
  const button = document.createElement("button");
  button.className = `mode-button mode-button--${difficulty.id}`;
  button.type = "button";
  button.dataset.difficulty = difficulty.id;
  button.innerHTML = `
    <span class="mode-button__top">
      <strong>${difficulty.name}</strong>
      <span>${Math.round(difficulty.seconds / 60)} 分钟</span>
    </span>
    <span class="mode-button__goal">${difficulty.targetScore}<small>目标分</small></span>
    <span class="mode-button__meta">${modeDescriptions[difficulty.id]}</span>
  `;
  modeList.append(button);
}

for (const fruit of FRUIT_TYPES) {
  const item = document.createElement("span");
  item.className = `score-item score-item--${fruit.id}`;
  item.innerHTML = `<i aria-hidden="true">${fruitSymbols[fruit.id]}</i>${fruit.name}<strong>${fruit.points}</strong>`;
  scoreList.append(item);
}

const sound = new SoundBoard();
const game = new FruitGameCanvas(canvas, {
  onFruitSlice: handleFruitSlice,
  onBombSlice: handleBombSlice,
});

let round = null;
let selectedDifficultyId = "easy";
let phase = "menu";
let timerHandle = null;
let timerBaseline = 0;
let sessionToken = 0;
let resultTimeout = null;

modeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-difficulty]");
  if (button) startRound(button.dataset.difficulty);
});

pauseButton.addEventListener("click", pauseRound);
resumeButton.addEventListener("click", resumeRound);
retryButton.addEventListener("click", () => startRound(selectedDifficultyId));
pauseHomeButton.addEventListener("click", showMenu);
resultHomeButton.addEventListener("click", showMenu);

soundButton.addEventListener("click", async () => {
  const enabled = soundButton.getAttribute("aria-pressed") !== "true";
  const unlocked = await sound.setEnabled(enabled);
  soundButton.setAttribute("aria-pressed", String(enabled));
  soundButton.lastElementChild.textContent = enabled ? "声音开" : "声音关";
  if (unlocked) sound.tick(true);
});

window.addEventListener("keydown", (event) => {
  if ((event.key === "Escape" || event.key.toLowerCase() === "p") && phase === "playing") {
    pauseRound();
  } else if ((event.key === "Escape" || event.key.toLowerCase() === "p") && phase === "paused") {
    resumeRound();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && phase === "playing") pauseRound();
});

async function startRound(difficultyId) {
  const token = ++sessionToken;
  clearTimers();
  await sound.unlock();
  if (token !== sessionToken) return;
  selectedDifficultyId = difficultyId;
  round = createRound(difficultyId);
  phase = "countdown";
  app.dataset.screen = "game";
  menuScreen.hidden = true;
  resultScreen.hidden = true;
  pauseScreen.hidden = true;
  hud.hidden = false;
  hud.inert = false;
  pauseButton.disabled = true;
  countdownScreen.hidden = false;
  game.prepare(DIFFICULTIES[difficultyId]);
  updateHud();

  for (const value of ["3", "2", "1", "切！"]) {
    if (token !== sessionToken) return;
    countdownValue.textContent = value;
    restartAnimation(countdownValue);
    sound.tick(value === "切！");
    await wait(value === "切！" ? 450 : 650);
  }

  if (token !== sessionToken) return;
  countdownScreen.hidden = true;
  phase = "playing";
  pauseButton.disabled = false;
  timerBaseline = performance.now();
  game.start();
  timerHandle = window.setInterval(tickTimer, 100);
  announce(`${DIFFICULTIES[difficultyId].name}模式开始`);
}

function tickTimer() {
  if (phase !== "playing") return;
  const now = performance.now();
  const elapsed = (now - timerBaseline) / 1000;
  timerBaseline = now;
  round = updateRound(round, elapsed);
  updateHud();
  if (round.status === "lost") completeRound(250);
}

function handleFruitSlice(object) {
  if (phase !== "playing") return;
  round = sliceTarget(round, { kind: "fruit", fruitId: object.fruitId });
  sound.slice(object.points);
  updateHud(true);
  if (navigator.vibrate) navigator.vibrate(12);
  if (round.status === "won") completeRound(600);
}

function handleBombSlice() {
  if (phase !== "playing") return;
  round = sliceTarget(round, { kind: "bomb" });
  sound.bomb();
  updateHud(true);
  completeRound(700);
}

function completeRound(delay) {
  if (phase !== "playing") return;
  phase = "ending";
  window.clearInterval(timerHandle);
  timerHandle = null;
  game.end();
  pauseButton.disabled = true;
  updateHud();

  if (round.status === "won") sound.win();
  else if (round.endReason !== "bomb") sound.lose();

  resultTimeout = window.setTimeout(showResult, delay);
}

function showResult() {
  phase = "result";
  hud.hidden = true;
  resultScreen.hidden = false;
  resultScreen.dataset.result = round.status;
  resultScore.textContent = String(round.score);

  if (round.status === "won") {
    resultIcon.textContent = "★";
    resultKicker.textContent = "目标达成";
    resultTitle.textContent = "太棒了！";
    resultMessage.textContent = `完成了${DIFFICULTIES[round.difficultyId].name}挑战`;
  } else if (round.endReason === "bomb") {
    resultIcon.textContent = "！";
    resultKicker.textContent = "碰到炸弹";
    resultTitle.textContent = "砰！再来一次";
    resultMessage.textContent = "这次躲开黑色炸弹";
  } else {
    resultIcon.textContent = "⌛";
    resultKicker.textContent = "倒计时结束";
    resultTitle.textContent = "时间到";
    resultMessage.textContent = `还差 ${Math.max(0, DIFFICULTIES[round.difficultyId].targetScore - round.score)} 分`;
  }

  announce(`${resultTitle.textContent}，本局${round.score}分`);
  retryButton.focus();
}

function pauseRound() {
  if (phase !== "playing") return;
  phase = "paused";
  window.clearInterval(timerHandle);
  timerHandle = null;
  game.pause();
  hud.inert = true;
  pauseScreen.hidden = false;
  announce("游戏已暂停");
  resumeButton.focus();
}

function resumeRound() {
  if (phase !== "paused") return;
  phase = "playing";
  pauseScreen.hidden = true;
  hud.inert = false;
  timerBaseline = performance.now();
  game.resume();
  timerHandle = window.setInterval(tickTimer, 100);
  announce("继续游戏");
  pauseButton.focus();
}

function showMenu() {
  sessionToken += 1;
  clearTimers();
  phase = "menu";
  round = null;
  app.dataset.screen = "menu";
  hud.hidden = true;
  hud.inert = false;
  pauseButton.disabled = false;
  countdownScreen.hidden = true;
  pauseScreen.hidden = true;
  resultScreen.hidden = true;
  menuScreen.hidden = false;
  game.showMenu();
  announcer.textContent = "";
  document.querySelector(`[data-difficulty="${selectedDifficultyId}"]`)?.focus();
}

function updateHud(bump = false) {
  if (!round) return;
  scoreValue.textContent = String(round.score);
  targetValue.textContent = String(DIFFICULTIES[round.difficultyId].targetScore);
  timerValue.textContent = formatTime(round.remainingSeconds);
  if (bump) {
    const container = scoreValue.closest(".hud__stat");
    restartAnimation(container, "is-bump");
  }
}

function formatTime(seconds) {
  const rounded = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function restartAnimation(element, className = null) {
  if (className) element.classList.remove(className);
  else element.style.animation = "none";
  void element.offsetWidth;
  if (className) element.classList.add(className);
  else element.style.animation = "";
}

function clearTimers() {
  window.clearInterval(timerHandle);
  window.clearTimeout(resultTimeout);
  timerHandle = null;
  resultTimeout = null;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function announce(message) {
  announcer.textContent = "";
  window.setTimeout(() => { announcer.textContent = message; }, 10);
}
