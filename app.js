const WORDS = ["pico", "pene", "diuca", "pichula"];
const ROUND_SECONDS = 60;
const RUNNER_SECONDS = 60;

const screenIntro = document.getElementById("screen-intro");
const screenGame = document.getElementById("screen-game");
const screenEnd = document.getElementById("screen-end");
const screenRunner = document.getElementById("screen-runner");
const screenRunnerEnd = document.getElementById("screen-runner-end");

const startGuessBtn = document.getElementById("start-guess-btn");
const startRunnerBtn = document.getElementById("start-runner-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const skipBtn = document.getElementById("skip-btn");
const runnerRestartBtn = document.getElementById("runner-restart-btn");
const runnerBackBtn = document.getElementById("runner-back-btn");
const runnerExitBtn = document.getElementById("runner-exit-btn");

const timerEl = document.getElementById("timer");
const wordCard = document.getElementById("word-card");

const runnerCanvas = document.getElementById("runner-canvas");
const runnerTimerEl = document.getElementById("runner-timer");
const runnerCtx = runnerCanvas.getContext("2d");

const screens = [
  screenIntro,
  screenGame,
  screenEnd,
  screenRunner,
  screenRunnerEnd,
];

let timerId = null;
let remaining = ROUND_SECONDS;
let deck = [];

let runnerAnimationId = null;
let runnerRemaining = RUNNER_SECONDS;
let runnerLastTime = 0;
let spawnTimer = 0;
let obstacles = [];
let player = null;
let groundY = 0;
let hitFlash = 0;
let runnerStartId = null;

function showScreen(target) {
  screens.forEach((screen) => screen.classList.add("screen--hidden"));
  target.classList.remove("screen--hidden");
}

function shuffle(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function nextWord() {
  if (deck.length === 0) {
    deck = shuffle(WORDS);
  }
  wordCard.textContent = deck.pop();
  wordCard.classList.remove("flip");
  void wordCard.offsetWidth;
  wordCard.classList.add("flip");
}

function updateTimer() {
  timerEl.textContent = remaining;
  if (remaining <= 0) {
    endRound();
  }
}

function startRound() {
  stopRunner();
  remaining = ROUND_SECONDS;
  deck = shuffle(WORDS);
  showScreen(screenGame);
  nextWord();
  updateTimer();
  clearInterval(timerId);
  timerId = setInterval(() => {
    remaining -= 1;
    updateTimer();
  }, 1000);
}

function endRound() {
  clearInterval(timerId);
  showScreen(screenEnd);
}

function stopGuessRound() {
  clearInterval(timerId);
  showScreen(screenIntro);
}

function resetRunner() {
  obstacles = [];
  runnerRemaining = RUNNER_SECONDS;
  runnerLastTime = 0;
  spawnTimer = 0;
  hitFlash = 0;
  resizeRunnerCanvas();
  player = {
    x: 60,
    y: groundY,
    radius: 18,
    velocityY: 0,
    onGround: true,
  };
}

function resizeRunnerCanvas() {
  const rect = runnerCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  runnerCanvas.width = rect.width * dpr;
  runnerCanvas.height = rect.height * dpr;
  runnerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundY = rect.height - 36;
}

function spawnObstacle() {
  const types = [
    { label: "Humita", color: "#ff9f1c", width: 50, height: 38 },
    { label: "Ola", color: "#3fa9f5", width: 60, height: 32 },
    { label: "Museo", color: "#8338ec", width: 56, height: 44 },
    { label: "Sombrilla", color: "#ff6b35", width: 52, height: 40 },
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  obstacles.push({
    ...type,
    x: runnerCanvas.getBoundingClientRect().width + 40,
    y: groundY - type.height,
  });
}

function updateRunner(dt) {
  const speed = 180;
  const gravity = 900;

  runnerRemaining -= dt;
  runnerTimerEl.textContent = Math.max(0, Math.ceil(runnerRemaining));
  if (runnerRemaining <= 0) {
    finishRunner();
    return;
  }

  spawnTimer += dt;
  if (spawnTimer > 1.2) {
    spawnObstacle();
    spawnTimer = 0;
  }

  player.velocityY += gravity * dt;
  player.y += player.velocityY * dt;

  if (player.y >= groundY) {
    player.y = groundY;
    player.velocityY = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  obstacles.forEach((obstacle) => {
    obstacle.x -= speed * dt;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);

  obstacles.forEach((obstacle) => {
    const nearestX = Math.max(
      obstacle.x,
      Math.min(player.x, obstacle.x + obstacle.width)
    );
    const nearestY = Math.max(
      obstacle.y,
      Math.min(player.y, obstacle.y + obstacle.height)
    );
    const dx = player.x - nearestX;
    const dy = player.y - nearestY;
    if (dx * dx + dy * dy < player.radius * player.radius) {
      hitFlash = 8;
    }
  });

  if (hitFlash > 0) {
    hitFlash -= 1;
  }
}

function drawRunner() {
  const rect = runnerCanvas.getBoundingClientRect();
  runnerCtx.clearRect(0, 0, rect.width, rect.height);

  runnerCtx.fillStyle = "#ffe8d6";
  runnerCtx.fillRect(0, groundY + 12, rect.width, 24);

  runnerCtx.strokeStyle = "#ff6b35";
  runnerCtx.lineWidth = 3;
  runnerCtx.beginPath();
  runnerCtx.moveTo(0, groundY + 8);
  runnerCtx.lineTo(rect.width, groundY + 8);
  runnerCtx.stroke();

  runnerCtx.fillStyle = hitFlash > 0 ? "#ffd166" : "#ff6b35";
  runnerCtx.beginPath();
  runnerCtx.arc(player.x, player.y - player.radius / 2, player.radius, 0, Math.PI * 2);
  runnerCtx.fill();

  obstacles.forEach((obstacle) => {
    runnerCtx.fillStyle = obstacle.color;
    runnerCtx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    runnerCtx.fillStyle = "#1b1b1b";
    runnerCtx.font = "10px Trebuchet MS, sans-serif";
    runnerCtx.fillText(
      obstacle.label,
      obstacle.x + 6,
      obstacle.y + obstacle.height / 2 + 4
    );
  });

  runnerCtx.fillStyle = "#1b1b1b";
  runnerCtx.font = "12px Trebuchet MS, sans-serif";
  runnerCtx.fillText("Pasaporte", rect.width - 90, 22);
  runnerCtx.strokeStyle = "#ff6b35";
  runnerCtx.strokeRect(rect.width - 88, 28, 70, 18);
}

function runnerLoop(timestamp) {
  if (!runnerLastTime) {
    runnerLastTime = timestamp;
  }
  const dt = (timestamp - runnerLastTime) / 1000;
  runnerLastTime = timestamp;
  updateRunner(dt);
  drawRunner();
  runnerAnimationId = requestAnimationFrame(runnerLoop);
}

function startRunner() {
  clearInterval(timerId);
  showScreen(screenRunner);
  cancelAnimationFrame(runnerAnimationId);
  if (runnerStartId) {
    cancelAnimationFrame(runnerStartId);
  }
  runnerStartId = requestAnimationFrame(() => {
    resetRunner();
    runnerTimerEl.textContent = RUNNER_SECONDS;
    runnerAnimationId = requestAnimationFrame(runnerLoop);
  });
}

function finishRunner() {
  stopRunner();
  showScreen(screenRunnerEnd);
}

function stopRunner() {
  cancelAnimationFrame(runnerAnimationId);
  runnerAnimationId = null;
  if (runnerStartId) {
    cancelAnimationFrame(runnerStartId);
    runnerStartId = null;
  }
}

function handleJump() {
  if (!player || !player.onGround) {
    return;
  }
  player.velocityY = -420;
  player.onGround = false;
}

function handleRunnerInteraction(event) {
  if (event.target.closest("button")) {
    return;
  }
  handleJump();
}

startGuessBtn.addEventListener("click", startRound);
startRunnerBtn.addEventListener("click", startRunner);
restartBtn.addEventListener("click", startRound);
backBtn.addEventListener("click", stopGuessRound);
skipBtn.addEventListener("click", nextWord);
runnerRestartBtn.addEventListener("click", startRunner);
runnerBackBtn.addEventListener("click", () => {
  stopRunner();
  showScreen(screenIntro);
});
runnerExitBtn.addEventListener("click", () => {
  stopRunner();
  showScreen(screenIntro);
});
runnerCanvas.addEventListener("pointerdown", handleRunnerInteraction);
runnerCanvas.addEventListener("click", handleRunnerInteraction);
runnerCanvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  handleRunnerInteraction(event);
});
screenRunner.addEventListener("pointerdown", handleRunnerInteraction);
window.addEventListener("resize", () => {
  if (!runnerAnimationId) {
    return;
  }
  resizeRunnerCanvas();
});

wordCard.classList.add("flip");
