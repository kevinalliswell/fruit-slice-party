export const FRUIT_TYPES = Object.freeze([
  { id: "pear", name: "梨", points: 1, weight: 14 },
  { id: "apple", name: "苹果", points: 2, weight: 14 },
  { id: "peach", name: "桃子", points: 3, weight: 13 },
  { id: "watermelon", name: "西瓜", points: 5, weight: 12 },
  { id: "pineapple", name: "菠萝", points: 8, weight: 10 },
  { id: "strawberry", name: "草莓", points: 10, weight: 9 },
  { id: "kiwi", name: "猕猴桃", points: 10, weight: 9 },
  { id: "banana", name: "香蕉", points: 20, weight: 6 },
  { id: "dragonfruit", name: "火龙果", points: 50, weight: 1 },
]);

export const DIFFICULTIES = Object.freeze({
  easy: {
    id: "easy",
    name: "轻松",
    seconds: 120,
    targetScore: 200,
    launchDelay: [900, 1200],
    speed: 0.9,
    bombChance: 0.035,
    maxGroup: 2,
  },
  medium: {
    id: "medium",
    name: "热闹",
    seconds: 300,
    targetScore: 800,
    launchDelay: [650, 900],
    speed: 1.08,
    bombChance: 0.075,
    maxGroup: 3,
  },
  hard: {
    id: "hard",
    name: "高手",
    seconds: 600,
    targetScore: 2000,
    launchDelay: [440, 700],
    speed: 1.28,
    bombChance: 0.12,
    maxGroup: 4,
  },
});

const fruitById = new Map(FRUIT_TYPES.map((fruit) => [fruit.id, fruit]));

export function createRound(difficultyId) {
  const difficulty = DIFFICULTIES[difficultyId];
  if (!difficulty) {
    throw new Error(`Unknown difficulty: ${difficultyId}`);
  }

  return {
    difficultyId,
    score: 0,
    remainingSeconds: difficulty.seconds,
    status: "playing",
    endReason: null,
  };
}

export function sliceTarget(round, target) {
  if (round.status !== "playing") return round;

  if (target.kind === "bomb") {
    return { ...round, score: 0, status: "lost", endReason: "bomb" };
  }

  const fruit = fruitById.get(target.fruitId);
  if (!fruit) return round;

  const score = round.score + fruit.points;
  const targetScore = DIFFICULTIES[round.difficultyId].targetScore;
  if (score >= targetScore) {
    return { ...round, score, status: "won", endReason: "target" };
  }

  return { ...round, score };
}

export function updateRound(round, elapsedSeconds) {
  if (round.status !== "playing") return round;

  const remainingSeconds = Math.max(0, round.remainingSeconds - elapsedSeconds);
  if (remainingSeconds === 0) {
    return { ...round, remainingSeconds, status: "lost", endReason: "timeout" };
  }

  return { ...round, remainingSeconds };
}

export function pickFruit(random = Math.random) {
  const totalWeight = FRUIT_TYPES.reduce((sum, fruit) => sum + fruit.weight, 0);
  let value = random() * totalWeight;
  for (const fruit of FRUIT_TYPES) {
    value -= fruit.weight;
    if (value < 0) return fruit;
  }
  return FRUIT_TYPES.at(-1);
}
