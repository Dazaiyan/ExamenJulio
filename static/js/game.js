const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const scoreNode = document.getElementById("score");
const targetNode = document.getElementById("target");
const overlay = document.getElementById("messageOverlay");
const titleNode = document.getElementById("messageTitle");
const textNode = document.getElementById("messageText");
const { winScore, portalUrl } = window.GAME_CONFIG;

const state = {
  running: false,
  gameOver: false,
  won: false,
  score: 0,
  frame: 0,
  lastSpawn: 0,
  started: false,
  canRestart: false,
  inputLocked: false,
};

const router = {
  x: 96,
  y: canvas.height * 0.45,
  radius: 22,
  velocity: 0,
  gravity: 0.42,
  lift: -7.4,
  angle: 0,
};

const antennaes = [];
const stars = Array.from({ length: 36 }, (_, index) => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: 1 + Math.random() * 2.3,
  speed: 0.2 + Math.random() * 0.6,
  delay: index * 9,
}));

const config = {
  gap: 170,
  width: 68,
  speed: 2.8,
  spawnRate: 118,
  groundHeight: 80,
};

targetNode.textContent = winScore;

function setOverlay(visible, title, message) {
  overlay.classList.toggle("hidden", !visible);
  if (title) {
    titleNode.textContent = title;
  }
  if (message) {
    textNode.textContent = message;
  }
}

function resetGame(messageTitle = "Pulsa espacio o toca para comenzar", messageText = "Mantén al router en el aire y cruza las antenas.") {
  state.running = false;
  state.gameOver = false;
  state.won = false;
  state.score = 0;
  state.frame = 0;
  state.lastSpawn = 0;
  state.started = false;
  state.canRestart = false;
  state.inputLocked = false;
  router.y = canvas.height * 0.45;
  router.velocity = 0;
  router.angle = 0;
  antennaes.length = 0;
  scoreNode.textContent = "0";
  setOverlay(true, messageTitle, messageText);
}

function startGame() {
  if (state.running || state.gameOver || state.won) {
    return;
  }
  state.running = true;
  state.started = true;
  setOverlay(false);
}

function flap() {
  if (state.won || state.inputLocked) {
    return;
  }
  if (!state.started) {
    startGame();
  }
  if (state.gameOver) {
    if (state.canRestart) {
      resetGame("Vuelve a intentarlo", "Tu router se reinició. Pulsa espacio o toca para empezar otra vez.");
    }
    return;
  }
  if (!state.running) {
    startGame();
  }
  router.velocity = router.lift;
}

function spawnAntenna() {
  const minTop = 80;
  const maxTop = canvas.height - config.groundHeight - config.gap - 80;
  const topHeight = Math.max(minTop, Math.min(maxTop, 90 + Math.random() * 210));
  const bottomY = topHeight + config.gap;

  antennaes.push({
    x: canvas.width + 24,
    topHeight,
    bottomY,
    passed: false,
  });
}

function updateStars() {
  for (const star of stars) {
    star.x -= star.speed;
    if (star.x < -4) {
      star.x = canvas.width + 4;
      star.y = Math.random() * (canvas.height - config.groundHeight);
    }
  }
}

function updateRouter() {
  router.velocity += router.gravity;
  router.y += router.velocity;
  router.angle = Math.max(-0.45, Math.min(1.2, router.velocity * 0.06));
}

function updateAntennaes() {
  if (state.frame - state.lastSpawn > config.spawnRate) {
    spawnAntenna();
    state.lastSpawn = state.frame;
  }

  for (let index = antennaes.length - 1; index >= 0; index -= 1) {
    const antenna = antennaes[index];
    antenna.x -= config.speed;

    if (!antenna.passed && antenna.x + config.width < router.x - router.radius) {
      antenna.passed = true;
      state.score += 1;
      scoreNode.textContent = String(state.score);
      if (state.score >= winScore) {
        winGame();
        return;
      }
    }

    if (antenna.x < -config.width - 60) {
      antennaes.splice(index, 1);
    }
  }
}

function checkCollision() {
  const routerTop = router.y - router.radius;
  const routerBottom = router.y + router.radius;
  const routerLeft = router.x - router.radius * 0.8;
  const routerRight = router.x + router.radius * 0.8;
  const floorY = canvas.height - config.groundHeight;

  if (routerTop <= 0 || routerBottom >= floorY) {
    loseGame();
    return;
  }

  for (const antenna of antennaes) {
    const withinX = routerRight > antenna.x && routerLeft < antenna.x + config.width;
    if (!withinX) {
      continue;
    }
    const hitsTop = routerTop < antenna.topHeight;
    const hitsBottom = routerBottom > antenna.bottomY;
    if (hitsTop || hitsBottom) {
      loseGame();
      return;
    }
  }
}

function loseGame() {
  if (state.gameOver || state.won) {
    return;
  }
  state.running = false;
  state.gameOver = true;
  state.canRestart = false;
  setOverlay(true, "El router perdió la señal", "Se reiniciará solo en un momento.");
  window.setTimeout(() => {
    state.canRestart = true;
    setOverlay(true, "Reiniciando partida", "Pulsa espacio o toca para volver a intentarlo.");
  }, 1200);
  window.setTimeout(() => {
    if (state.gameOver && !state.won) {
      resetGame();
    }
  }, 2200);
}

function winGame() {
  if (state.won) {
    return;
  }
  state.running = false;
  state.won = true;
  state.inputLocked = true;
  setOverlay(true, "Señal completada", "Redirigiendo al portal cautivo...");
  window.setTimeout(() => {
    window.location.href = portalUrl;
  }, 1200);
}

function drawBackground() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#13213f");
  gradient.addColorStop(0.6, "#1d3259");
  gradient.addColorStop(1, "#0b1324");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  updateStars();
  context.fillStyle = "rgba(255, 255, 255, 0.75)";
  for (const star of stars) {
    context.beginPath();
    context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    context.fill();
  }

  const hillGradient = context.createLinearGradient(0, 360, 0, canvas.height - config.groundHeight);
  hillGradient.addColorStop(0, "rgba(10, 23, 47, 0.1)");
  hillGradient.addColorStop(1, "rgba(10, 23, 47, 0.5)");
  context.fillStyle = hillGradient;
  context.fillRect(0, canvas.height - config.groundHeight, canvas.width, config.groundHeight);

  context.fillStyle = "#10213f";
  context.fillRect(0, canvas.height - config.groundHeight, canvas.width, 12);
}

function drawAntennaes() {
  for (const antenna of antennaes) {
    const bodyGradient = context.createLinearGradient(antenna.x, 0, antenna.x + config.width, 0);
    bodyGradient.addColorStop(0, "#87d9ff");
    bodyGradient.addColorStop(1, "#3ea5ff");

    context.fillStyle = bodyGradient;
    context.fillRect(antenna.x, 0, config.width, antenna.topHeight);
    context.fillRect(antenna.x, antenna.bottomY, config.width, canvas.height - config.groundHeight - antenna.bottomY);

    context.fillStyle = "#dff6ff";
    context.fillRect(antenna.x - 8, antenna.topHeight - 16, config.width + 16, 16);
    context.fillRect(antenna.x - 8, antenna.bottomY, config.width + 16, 16);

    context.strokeStyle = "rgba(255, 255, 255, 0.55)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(antenna.x + config.width * 0.5, antenna.topHeight - 20);
    context.lineTo(antenna.x + config.width * 0.5, 24);
    context.stroke();

    context.beginPath();
    context.moveTo(antenna.x + config.width * 0.5, antenna.bottomY + 20);
    context.lineTo(antenna.x + config.width * 0.5, canvas.height - config.groundHeight - 16);
    context.stroke();
  }
}

function drawRouter() {
  context.save();
  context.translate(router.x, router.y);
  context.rotate(router.angle);

  context.fillStyle = "#dce7f2";
  roundRect(-24, -18, 48, 36, 10);
  context.fill();

  context.fillStyle = "#1c2d4f";
  roundRect(-18, -12, 36, 24, 7);
  context.fill();

  context.fillStyle = "#6de5ff";
  context.beginPath();
  context.arc(0, 0, 4, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#1e395d";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-11, -18);
  context.lineTo(-15, -30);
  context.moveTo(0, -18);
  context.lineTo(0, -31);
  context.moveTo(11, -18);
  context.lineTo(15, -30);
  context.stroke();

  context.strokeStyle = "#6de5ff";
  context.lineWidth = 2;
  for (let radius = 12; radius <= 26; radius += 7) {
    context.beginPath();
    context.arc(0, 0, radius, Math.PI * 0.1, Math.PI - Math.PI * 0.1);
    context.stroke();
  }

  context.restore();
}

function roundRect(x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function loop() {
  if (state.running) {
    state.frame += 1;
    updateRouter();
    updateAntennaes();
    checkCollision();
  }

  drawBackground();
  drawAntennaes();
  drawRouter();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
});

window.addEventListener("pointerdown", () => {
  flap();
});

resetGame();
loop();
