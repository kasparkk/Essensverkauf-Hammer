(function () {
  "use strict";

  const HIGHSCORE_KEY = "fussball.highscore.v1";
  const SHOTS_PER_GAME = 5;

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const shootBtn = document.getElementById("shoot-btn");
  const shotNumberEl = document.getElementById("shot-number");
  const goalCountEl = document.getElementById("goal-count");
  const highscoreEl = document.getElementById("highscore");
  const messageBanner = document.getElementById("message-banner");
  const endOverlay = document.getElementById("end-overlay");
  const endTitle = document.getElementById("end-title");
  const endText = document.getElementById("end-text");
  const playAgainBtn = document.getElementById("play-again-btn");

  const W = canvas.width;
  const H = canvas.height;

  // Geometrie des Tores (Perspektive: Tor liegt "hinten", Ball "vorne").
  const GOAL = { left: 70, right: 330, top: 40, bottom: 190 };
  const KEEPER_MIN_X = GOAL.left + 28;
  const KEEPER_MAX_X = GOAL.right - 28;
  const BALL_START = { x: W / 2, y: 560, r: 14 };

  let shotsTaken = 0;
  let goalsScored = 0;
  let aim = { x: W / 2, y: 130 };
  let dragging = false;
  let animating = false;
  let gameOver = false;

  let ball = { x: BALL_START.x, y: BALL_START.y, r: BALL_START.r };
  let keeper = { x: W / 2, dive: 0 }; // dive: -1..1 lean while diving

  function loadHighscore() {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function saveHighscoreIfBetter(goals) {
    const current = loadHighscore();
    if (goals > current) {
      localStorage.setItem(HIGHSCORE_KEY, String(goals));
      return goals;
    }
    return current;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateHud() {
    shotNumberEl.textContent = `${Math.min(shotsTaken + 1, SHOTS_PER_GAME)} / ${SHOTS_PER_GAME}`;
    goalCountEl.textContent = String(goalsScored);
    highscoreEl.textContent = `${loadHighscore()} / ${SHOTS_PER_GAME}`;
  }

  function pointerToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    const x = ((point.clientX - rect.left) / rect.width) * W;
    const y = ((point.clientY - rect.top) / rect.height) * H;
    return { x, y };
  }

  function setAimFromPoint(point) {
    aim.x = clamp(point.x, GOAL.left + 12, GOAL.right - 12);
    aim.y = clamp(point.y, GOAL.top + 10, GOAL.bottom - 15);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (animating || gameOver) return;
    dragging = true;
    setAimFromPoint(pointerToCanvas(event));
    draw();
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging || animating || gameOver) return;
    setAimFromPoint(pointerToCanvas(event));
    draw();
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  window.addEventListener("keydown", (event) => {
    if (animating || gameOver) return;
    const step = 14;
    if (event.key === "ArrowLeft") {
      setAimFromPoint({ x: aim.x - step, y: aim.y });
      draw();
    } else if (event.key === "ArrowRight") {
      setAimFromPoint({ x: aim.x + step, y: aim.y });
      draw();
    } else if (event.key === "ArrowUp") {
      setAimFromPoint({ x: aim.x, y: aim.y - step });
      draw();
    } else if (event.key === "ArrowDown") {
      setAimFromPoint({ x: aim.x, y: aim.y + step });
      draw();
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      takeShot();
    }
  });

  shootBtn.addEventListener("click", () => takeShot());
  playAgainBtn.addEventListener("click", () => resetGame());

  function showMessage(text, kind) {
    messageBanner.textContent = text;
    messageBanner.className = "message-banner " + kind;
    messageBanner.hidden = false;
  }

  function hideMessage() {
    messageBanner.hidden = true;
  }

  function difficultyForShot(index) {
    // index 0..SHOTS_PER_GAME-1, Torwart wird von Schuss zu Schuss etwas staerker.
    return index / Math.max(1, SHOTS_PER_GAME - 1); // 0..1
  }

  function computeSaveOutcome(index) {
    const skill = 0.32 + 0.28 * difficultyForShot(index); // 0.32..0.60 Basis-Chance
    const goalCenterX = (GOAL.left + GOAL.right) / 2;
    const halfWidth = (GOAL.right - GOAL.left) / 2;
    const distFromCenter = clamp(Math.abs(aim.x - goalCenterX) / halfWidth, 0, 1);
    const heightNorm = clamp((aim.y - GOAL.top) / (GOAL.bottom - GOAL.top), 0, 1); // 0 oben (schwer), 1 unten (leicht)

    let saveChance = skill * (1 - distFromCenter * 0.75) * (0.35 + 0.65 * heightNorm);
    saveChance = clamp(saveChance, 0.05, 0.85);

    const saved = Math.random() < saveChance;
    return { saved, distFromCenter };
  }

  function takeShot() {
    if (animating || gameOver) return;
    animating = true;
    hideMessage();
    shootBtn.disabled = true;

    const outcome = computeSaveOutcome(shotsTaken);
    const targetKeeperX = outcome.saved
      ? aim.x
      : clamp(
          aim.x + (aim.x < W / 2 ? 1 : -1) * (60 + Math.random() * 60),
          KEEPER_MIN_X,
          KEEPER_MAX_X
        );

    const startTime = performance.now();
    const duration = 620;
    const ballFrom = { x: BALL_START.x, y: BALL_START.y, r: BALL_START.r };
    const ballTo = { x: aim.x, y: aim.y, r: 5 };
    const keeperFrom = keeper.x;

    function frame(now) {
      const t = clamp((now - startTime) / duration, 0, 1);
      const eased = t * t * (3 - 2 * t); // smoothstep

      ball.x = ballFrom.x + (ballTo.x - ballFrom.x) * eased;
      ball.y = ballFrom.y + (ballTo.y - ballFrom.y) * eased;
      ball.r = ballFrom.r + (ballTo.r - ballFrom.r) * eased;

      keeper.x = keeperFrom + (clamp(targetKeeperX, KEEPER_MIN_X, KEEPER_MAX_X) - keeperFrom) * Math.min(1, eased * 1.3);
      keeper.dive = clamp((keeper.x - W / 2) / (halfKeeperRange()), -1, 1);

      draw();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        finishShot(outcome.saved);
      }
    }
    requestAnimationFrame(frame);
  }

  function halfKeeperRange() {
    return (KEEPER_MAX_X - KEEPER_MIN_X) / 2;
  }

  function finishShot(saved) {
    shotsTaken += 1;
    if (saved) {
      showMessage("GEHALTEN!", "saved");
    } else {
      goalsScored += 1;
      showMessage("TOOOR!", "goal");
    }
    updateHud();

    setTimeout(() => {
      hideMessage();
      ball = { x: BALL_START.x, y: BALL_START.y, r: BALL_START.r };
      keeper = { x: W / 2, dive: 0 };
      animating = false;

      if (shotsTaken >= SHOTS_PER_GAME) {
        endGame();
      } else {
        shootBtn.disabled = false;
        draw();
      }
    }, 900);
  }

  function endGame() {
    gameOver = true;
    const best = saveHighscoreIfBetter(goalsScored);
    updateHud();

    let title = "Ergebnis";
    if (goalsScored === SHOTS_PER_GAME) title = "Perfekt! 🏆";
    else if (goalsScored >= Math.ceil(SHOTS_PER_GAME * 0.6)) title = "Stark gespielt!";
    else if (goalsScored === 0) title = "Nächstes Mal klappt's!";

    endTitle.textContent = title;
    endText.textContent = `Du hast ${goalsScored} von ${SHOTS_PER_GAME} Elfmetern verwandelt. Rekord: ${best} / ${SHOTS_PER_GAME}.`;
    endOverlay.hidden = false;
    draw();
  }

  function resetGame() {
    shotsTaken = 0;
    goalsScored = 0;
    gameOver = false;
    animating = false;
    dragging = false;
    ball = { x: BALL_START.x, y: BALL_START.y, r: BALL_START.r };
    keeper = { x: W / 2, dive: 0 };
    aim = { x: W / 2, y: 130 };
    endOverlay.hidden = true;
    hideMessage();
    shootBtn.disabled = false;
    updateHud();
    draw();
  }

  function drawPitch() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#3a9a4c");
    grad.addColorStop(1, "#1e7a3d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Streifen fuer Rasenoptik
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) ctx.fillRect(0, (H / 8) * i, W, H / 8);
    }

    // Torraum / Strafraumlinien (perspektivisch vereinfacht)
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, GOAL.bottom + 10);
    ctx.lineTo(W - 20, GOAL.bottom + 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(GOAL.left - 40, H - 30);
    ctx.lineTo(GOAL.left - 10, GOAL.bottom + 10);
    ctx.moveTo(GOAL.right + 40, H - 30);
    ctx.lineTo(GOAL.right + 10, GOAL.bottom + 10);
    ctx.stroke();

    // Elfmeterpunkt
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(BALL_START.x, BALL_START.y - 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGoal() {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.lineCap = "square";

    // Pfosten
    ctx.beginPath();
    ctx.moveTo(GOAL.left, GOAL.bottom + 6);
    ctx.lineTo(GOAL.left, GOAL.top);
    ctx.lineTo(GOAL.right, GOAL.top);
    ctx.lineTo(GOAL.right, GOAL.bottom + 6);
    ctx.stroke();

    // Netz
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    const cols = 12;
    const rows = 8;
    for (let i = 1; i < cols; i++) {
      const x = GOAL.left + ((GOAL.right - GOAL.left) / cols) * i;
      ctx.beginPath();
      ctx.moveTo(x, GOAL.top);
      ctx.lineTo(x, GOAL.bottom);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = GOAL.top + ((GOAL.bottom - GOAL.top) / rows) * j;
      ctx.beginPath();
      ctx.moveTo(GOAL.left, y);
      ctx.lineTo(GOAL.right, y);
      ctx.stroke();
    }
  }

  function drawKeeper() {
    const x = keeper.x;
    const y = GOAL.bottom - 28;
    const lean = keeper.dive * 22;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((keeper.dive * Math.PI) / 10);

    // Torwart-Trikot
    ctx.fillStyle = "#f2c400";
    ctx.fillRect(-14, -18, 28, 34);

    // Arme (ausgestreckt Richtung Sprung)
    ctx.strokeStyle = "#f2c400";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.lineTo(-12 + lean, -26);
    ctx.moveTo(12, -10);
    ctx.lineTo(12 + lean, -26);
    ctx.stroke();

    // Kopf
    ctx.fillStyle = "#e0a86a";
    ctx.beginPath();
    ctx.arc(0, -24, 8, 0, Math.PI * 2);
    ctx.fill();

    // Beine
    ctx.strokeStyle = "#1b2a52";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-6, 30);
    ctx.moveTo(6, 16);
    ctx.lineTo(6, 30);
    ctx.stroke();

    ctx.restore();
  }

  function drawAimReticle() {
    if (animating || gameOver) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, 10, 0, Math.PI * 2);
    ctx.moveTo(aim.x - 16, aim.y);
    ctx.lineTo(aim.x - 6, aim.y);
    ctx.moveTo(aim.x + 6, aim.y);
    ctx.lineTo(aim.x + 16, aim.y);
    ctx.moveTo(aim.x, aim.y - 16);
    ctx.lineTo(aim.x, aim.y - 6);
    ctx.moveTo(aim.x, aim.y + 6);
    ctx.lineTo(aim.x, aim.y + 16);
    ctx.stroke();
    ctx.restore();
  }

  function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fuenfeck-Muster als Andeutung eines Fussballs
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(0, 0, ball.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawPitch();
    drawGoal();
    drawKeeper();
    drawAimReticle();
    drawBall();
  }

  updateHud();
  draw();
})();
