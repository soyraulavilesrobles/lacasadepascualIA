const WORDS = ["pico", "pene", "diuca", "pichula"];
const ROUND_SECONDS = 60;

const screenIntro = document.getElementById("screen-intro");
const screenGame = document.getElementById("screen-game");
const screenEnd = document.getElementById("screen-end");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const skipBtn = document.getElementById("skip-btn");
const timerEl = document.getElementById("timer");
const wordCard = document.getElementById("word-card");

let timerId = null;
let remaining = ROUND_SECONDS;
let deck = [];

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
  remaining = ROUND_SECONDS;
  deck = shuffle(WORDS);
  screenIntro.classList.add("screen--hidden");
  screenEnd.classList.add("screen--hidden");
  screenGame.classList.remove("screen--hidden");
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
  screenGame.classList.add("screen--hidden");
  screenEnd.classList.remove("screen--hidden");
}

startBtn.addEventListener("click", startRound);
restartBtn.addEventListener("click", startRound);
skipBtn.addEventListener("click", nextWord);

wordCard.classList.add("flip");
