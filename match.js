(function () {
  "use strict";

  const canvas = document.getElementById("pitch-canvas");
  const ctx = canvas.getContext("2d");
  const playerScoreEl = document.getElementById("player-score");
  const aiScoreEl = document.getElementById("ai-score");
  const matchTimeEl = document.getElementById("match-time");
  const eventBanner = document.getElementById("event-banner");
  const endOverlay = document.getElementById("end-overlay");
  const endTitle = document.getElementById("end-title");
  const endText = document.getElementById("end-text");
  const playAgainBtn = document.getElementById("play-again-btn");
  const shootBtn = document.getElementById("shoot-btn");
  const passBtn = document.getElementById("pass-btn");

  const W = canvas.width;
  const H = canvas.height;

  const PITCH = { left: 20, right: W - 20, top: 20, bottom: H - 20 };
  const GOAL_HALF = 60;
  const GOAL_TOP = H / 2 - GOAL_HALF;
  const GOAL_BOTTOM = H / 2 + GOAL_HALF;

  const MATCH_SECONDS = 90;
  const OUTFIELD_SPEED = 150;
  const AI_SPEED_FACTOR = 0.9;
  const ACCEL = 900;
  const BALL_FRICTION = 220; // px/s^2 Abbremsung
  const SHOT_SPEED = 380;
  const PASS_SPEED = 260;
  const PICKUP_RADIUS = 16;
  const KEEPER_PICKUP_RADIUS = 30;
  const POSSESSION_IMMUNITY_MS = 280;
  const TACKLE_CHANCE_PER_SEC = 1.4; // Wahrscheinlichkeit/Sekunde bei Kontakt

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function len(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function dist(a, b) {
    return len(a.x - b.x, a.y - b.y);
  }

  function makePlayer(team, role, x, y) {
    return {
      team,
      role, // "keeper" | "field"
      x,
      y,
      vx: 0,
      vy: 0,
      facingX: team === "player" ? 1 : -1,
      facingY: 0,
      homeX: x,
      homeY: y,
      radius: 11,
      possessionUntil: 0, // Tackle-Immunitaet nach Ballgewinn
    };
  }

  function buildTeams() {
    const player = [
      makePlayer("player", "keeper", 40, H / 2),
      makePlayer("player", "field", 160, H / 2 - 90),
      makePlayer("player", "field", 160, H / 2 + 90),
      makePlayer("player", "field", 300, H / 2),
      makePlayer("player", "field", 400, H / 2),
    ];
    const ai = [
      makePlayer("ai", "keeper", W - 40, H / 2),
      makePlayer("ai", "field", W - 160, H / 2 - 90),
      makePlayer("ai", "field", W - 160, H / 2 + 90),
      makePlayer("ai", "field", W - 300, H / 2),
      makePlayer("ai", "field", W - 400, H / 2),
    ];
    return player.concat(ai);
  }

  let players = buildTeams();
  let ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 7, owner: null };
  let playerScore = 0;
  let aiScore = 0;
  let timeLeft = MATCH_SECONDS;
  let matchRunning = true;
  let paused = false;

  const keys = Object.create(null);
  let shootPressed = false;
  let passPressed = false;

  window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
    if (event.key === " ") {
      event.preventDefault();
      shootPressed = true;
    } else if (event.key.toLowerCase() === "x") {
      passPressed = true;
    }
  });
  window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
  });

  shootBtn.addEventListener("click", () => {
    shootPressed = true;
  });
  passBtn.addEventListener("click", () => {
    passPressed = true;
  });

  // Virtueller Joystick per Touch/Maus direkt auf dem Spielfeld.
  let joystick = null; // { originX, originY, dx, dy }
  function pointerToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    const x = ((point.clientX - rect.left) / rect.width) * W;
    const y = ((point.clientY - rect.top) / rect.height) * H;
    return { x, y };
  }
  canvas.addEventListener("pointerdown", (event) => {
    const p = pointerToCanvas(event);
    joystick = { originX: p.x, originY: p.y, dx: 0, dy: 0 };
  });
  window.addEventListener("pointermove", (event) => {
    if (!joystick) return;
    const p = pointerToCanvas(event);
    joystick.dx = clamp(p.x - joystick.originX, -40, 40);
    joystick.dy = clamp(p.y - joystick.originY, -40, 40);
  });
  window.addEventListener("pointerup", () => {
    joystick = null;
  });

  function getInputVector() {
    let ix = 0;
    let iy = 0;
    if (keys["arrowleft"] || keys["a"]) ix -= 1;
    if (keys["arrowright"] || keys["d"]) ix += 1;
    if (keys["arrowup"] || keys["w"]) iy -= 1;
    if (keys["arrowdown"] || keys["s"]) iy += 1;
    if (joystick && (joystick.dx || joystick.dy)) {
      ix = joystick.dx / 40;
      iy = joystick.dy / 40;
    }
    const magnitude = len(ix, iy);
    if (magnitude > 1) {
      ix /= magnitude;
      iy /= magnitude;
    }
    return { x: ix, y: iy, magnitude: Math.min(1, magnitude) };
  }

  function fieldPlayers(team) {
    return players.filter((p) => p.team === team && p.role === "field");
  }

  function nearestTo(list, point) {
    let best = null;
    let bestDist = Infinity;
    for (const p of list) {
      const d = dist(p, point);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  }

  function seekTowards(p, targetX, targetY, maxSpeed, dt) {
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const d = len(dx, dy);
    let desiredVx = 0;
    let desiredVy = 0;
    if (d > 4) {
      desiredVx = (dx / d) * maxSpeed;
      desiredVy = (dy / d) * maxSpeed;
    }
    p.vx += clamp(desiredVx - p.vx, -ACCEL * dt, ACCEL * dt);
    p.vy += clamp(desiredVy - p.vy, -ACCEL * dt, ACCEL * dt);
    if (len(p.vx, p.vy) > 6) {
      const f = len(p.vx, p.vy);
      p.facingX = p.vx / f;
      p.facingY = p.vy / f;
    }
  }

  function applyInputMovement(p, input, dt) {
    const maxSpeed = OUTFIELD_SPEED;
    const desiredVx = input.x * maxSpeed;
    const desiredVy = input.y * maxSpeed;
    p.vx += clamp(desiredVx - p.vx, -ACCEL * dt, ACCEL * dt);
    p.vy += clamp(desiredVy - p.vy, -ACCEL * dt, ACCEL * dt);
    if (input.magnitude > 0.15) {
      p.facingX = input.x / (input.magnitude || 1);
      p.facingY = input.y / (input.magnitude || 1);
    }
  }

  function teammateSupportTarget(p, teamHasBall, attackDir) {
    // Attackdir: +1 = Team greift nach rechts an, -1 nach links.
    const shift = teamHasBall ? attackDir * 70 : -attackDir * 20;
    const targetX = clamp(p.homeX + shift + (ball.x - W / 2) * 0.12, PITCH.left + 15, PITCH.right - 15);
    const targetY = clamp(p.homeY + (ball.y - p.homeY) * 0.3, PITCH.top + 15, PITCH.bottom - 15);
    return { x: targetX, y: targetY };
  }

  function keeperTarget(p, ownGoalX) {
    const targetX = ownGoalX;
    const targetY = clamp(ball.y, GOAL_TOP - 5, GOAL_BOTTOM + 5);
    return { x: targetX, y: targetY };
  }

  function releaseBall(shooter, targetX, targetY, speed) {
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const d = len(dx, dy) || 1;
    ball.owner = null;
    ball.vx = (dx / d) * speed;
    ball.vy = (dy / d) * speed;
  }

  function facingKick(shooter, speed) {
    const dx = shooter.facingX || (shooter.team === "player" ? 1 : -1);
    const dy = shooter.facingY || 0;
    ball.owner = null;
    ball.vx = dx * speed;
    ball.vy = dy * speed;
  }

  function showEvent(text, conceded) {
    eventBanner.textContent = text;
    eventBanner.className = "event-banner" + (conceded ? " conceded" : "");
    eventBanner.hidden = false;
    setTimeout(() => {
      eventBanner.hidden = true;
    }, 1100);
  }

  function resetPositions(kickoffTeam) {
    for (const p of players) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = 0;
      p.vy = 0;
    }
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = 0;
    ball.vy = 0;
    const kicker = nearestTo(fieldPlayers(kickoffTeam), { x: W / 2, y: H / 2 });
    ball.owner = kicker;
    kicker.possessionUntil = performance.now() + POSSESSION_IMMUNITY_MS;
  }

  function goalScored(scoringTeam) {
    paused = true;
    if (scoringTeam === "player") {
      playerScore += 1;
      showEvent("TOR für dich!", false);
    } else {
      aiScore += 1;
      showEvent("Gegentor…", true);
    }
    playerScoreEl.textContent = String(playerScore);
    aiScoreEl.textContent = String(aiScore);
    const restartTeam = scoringTeam === "player" ? "ai" : "player";
    setTimeout(() => {
      resetPositions(restartTeam);
      paused = false;
    }, 1000);
  }

  function updatePlayers(dt) {
    // Solange das eigene Team den Ball hat, bleibt die Steuerung fest beim
    // Ballführenden (sonst würde sie bei heranrückenden Mitspielern flackern).
    const controlled =
      ball.owner && ball.owner.team === "player" ? ball.owner : nearestTo(fieldPlayers("player"), ball);
    const input = getInputVector();
    applyInputMovement(controlled, input, dt);

    const playerHasBall = ball.owner && ball.owner.team === "player";
    for (const p of fieldPlayers("player")) {
      if (p === controlled) continue;
      const target = teammateSupportTarget(p, playerHasBall, 1);
      seekTowards(p, target.x, target.y, OUTFIELD_SPEED * 0.85, dt);
    }
    const playerKeeper = players.find((p) => p.team === "player" && p.role === "keeper");
    const pk = keeperTarget(playerKeeper, playerKeeper.homeX);
    seekTowards(playerKeeper, pk.x, pk.y, OUTFIELD_SPEED * 0.8, dt);

    const aiField = fieldPlayers("ai");
    const aiHasBall = ball.owner && ball.owner.team === "ai";
    // Wie beim Spielerteam: der Ballführer bleibt "aktiv", auch wenn ein
    // Mitspieler zufällig naeher am Ball steht.
    const aiCarrier = aiHasBall ? ball.owner : nearestTo(aiField, ball);
    for (const p of aiField) {
      if (p === aiCarrier) {
        if (aiHasBall) {
          seekTowards(p, PITCH.left + 60, GOAL_TOP + GOAL_HALF, OUTFIELD_SPEED * AI_SPEED_FACTOR, dt);
          if (p.x < 230 && Math.random() < 0.02) {
            const aimY = H / 2 + (Math.random() - 0.5) * 70;
            releaseBall(p, PITCH.left, aimY, SHOT_SPEED);
          }
        } else {
          seekTowards(p, ball.x, ball.y, OUTFIELD_SPEED * AI_SPEED_FACTOR, dt);
        }
      } else {
        const target = teammateSupportTarget(p, aiHasBall, -1);
        seekTowards(p, target.x, target.y, OUTFIELD_SPEED * AI_SPEED_FACTOR * 0.85, dt);
      }
    }
    const aiKeeper = players.find((p) => p.team === "ai" && p.role === "keeper");
    const ak = keeperTarget(aiKeeper, aiKeeper.homeX);
    seekTowards(aiKeeper, ak.x, ak.y, OUTFIELD_SPEED * 0.8, dt);

    for (const p of players) {
      p.x = clamp(p.x + p.vx * dt, PITCH.left + p.radius, PITCH.right - p.radius);
      p.y = clamp(p.y + p.vy * dt, PITCH.top + p.radius, PITCH.bottom - p.radius);
    }

    return controlled;
  }

  function updateBall(dt, controlled) {
    if (ball.owner) {
      const o = ball.owner;
      ball.x = o.x + o.facingX * 16;
      ball.y = o.y + o.facingY * 16;
      ball.vx = 0;
      ball.vy = 0;
    } else {
      const speed = len(ball.vx, ball.vy);
      if (speed > 0) {
        const decel = Math.min(speed, BALL_FRICTION * dt);
        const f = (speed - decel) / speed;
        ball.vx *= f;
        ball.vy *= f;
      }
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      const inGoalMouthY = ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM;
      if (!inGoalMouthY) {
        if (ball.y < PITCH.top + ball.r) {
          ball.y = PITCH.top + ball.r;
          ball.vy *= -0.6;
        } else if (ball.y > PITCH.bottom - ball.r) {
          ball.y = PITCH.bottom - ball.r;
          ball.vy *= -0.6;
        }
      }

      if (ball.x < PITCH.left - 30 || ball.x > PITCH.right + 30) {
        // Tor wurde bereits behandelt; hier nur Sicherheitsnetz gegen Ausreißer.
        ball.x = clamp(ball.x, PITCH.left - 30, PITCH.right + 30);
        ball.vx = 0;
        ball.vy = 0;
      } else if (!inGoalMouthY) {
        if (ball.x < PITCH.left + ball.r) {
          ball.x = PITCH.left + ball.r;
          ball.vx *= -0.6;
        } else if (ball.x > PITCH.right - ball.r) {
          ball.x = PITCH.right - ball.r;
          ball.vx *= -0.6;
        }
      }
    }

    if (paused) return;

    if (ball.x < PITCH.left - 12 && ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
      goalScored("ai");
      return;
    }
    if (ball.x > PITCH.right + 12 && ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
      goalScored("player");
      return;
    }

    const now = performance.now();
    if (!ball.owner) {
      let claimant = null;
      let claimantDist = Infinity;
      for (const p of players) {
        const radius = p.role === "keeper" ? KEEPER_PICKUP_RADIUS : PICKUP_RADIUS;
        const d = dist(p, ball);
        if (d < radius && d < claimantDist) {
          claimant = p;
          claimantDist = d;
        }
      }
      if (claimant) {
        ball.owner = claimant;
        ball.vx = 0;
        ball.vy = 0;
        claimant.possessionUntil = now + POSSESSION_IMMUNITY_MS;
      }
    } else if (now > ball.owner.possessionUntil) {
      for (const p of players) {
        if (p === ball.owner || p.team === ball.owner.team) continue;
        if (dist(p, ball.owner) < 18 && Math.random() < TACKLE_CHANCE_PER_SEC * dt) {
          ball.owner = p;
          p.possessionUntil = now + POSSESSION_IMMUNITY_MS;
          break;
        }
      }
    }

    if (shootPressed) {
      shootPressed = false;
      if (ball.owner === controlled) {
        facingKick(controlled, SHOT_SPEED);
      }
    }
    if (passPressed) {
      passPressed = false;
      if (ball.owner === controlled) {
        const mates = fieldPlayers("player").filter((p) => p !== controlled);
        const target = nearestTo(mates, controlled);
        if (target) {
          releaseBall(controlled, target.x, target.y, PASS_SPEED);
        } else {
          facingKick(controlled, PASS_SPEED);
        }
      }
    }
  }

  function drawPitch() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#3a9a4c");
    grad.addColorStop(1, "#1e7a3d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) ctx.fillRect((W / 8) * i, 0, W / 8, H);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(PITCH.left, PITCH.top, PITCH.right - PITCH.left, PITCH.bottom - PITCH.top);
    ctx.beginPath();
    ctx.moveTo(W / 2, PITCH.top);
    ctx.lineTo(W / 2, PITCH.bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeRect(PITCH.left, GOAL_TOP - 30, 80, GOAL_HALF * 2 + 60);
    ctx.strokeRect(PITCH.right - 80, GOAL_TOP - 30, 80, GOAL_HALF * 2 + 60);

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(PITCH.left, GOAL_TOP);
    ctx.lineTo(PITCH.left - 14, GOAL_TOP);
    ctx.lineTo(PITCH.left - 14, GOAL_BOTTOM);
    ctx.lineTo(PITCH.left, GOAL_BOTTOM);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PITCH.right, GOAL_TOP);
    ctx.lineTo(PITCH.right + 14, GOAL_TOP);
    ctx.lineTo(PITCH.right + 14, GOAL_BOTTOM);
    ctx.lineTo(PITCH.right, GOAL_BOTTOM);
    ctx.stroke();
  }

  function drawPlayer(p, isControlled) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.team === "player" ? (p.role === "keeper" ? "#274b7a" : "#3b6fb0") : p.role === "keeper" ? "#7a2727" : "#c23b3b";
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.facingX * (p.radius + 6), p.facingY * (p.radius + 6));
    ctx.stroke();

    if (isControlled) {
      ctx.strokeStyle = "#fff700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    ctx.restore();
  }

  function draw(controlled) {
    ctx.clearRect(0, 0, W, H);
    drawPitch();
    for (const p of players) drawPlayer(p, p === controlled);
    drawBall();

    if (joystick) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joystick.originX, joystick.originY, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(joystick.originX + joystick.dx, joystick.originY + joystick.dy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${m}:${String(rest).padStart(2, "0")}`;
  }

  function endMatch() {
    matchRunning = false;
    let title = "Unentschieden";
    if (playerScore > aiScore) title = "Sieg! 🏆";
    else if (playerScore < aiScore) title = "Niederlage";
    endTitle.textContent = title;
    endText.textContent = `Endstand ${playerScore} : ${aiScore}.`;
    endOverlay.hidden = false;
  }

  function resetMatch() {
    players = buildTeams();
    ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 7, owner: null };
    playerScore = 0;
    aiScore = 0;
    timeLeft = MATCH_SECONDS;
    matchRunning = true;
    paused = false;
    playerScoreEl.textContent = "0";
    aiScoreEl.textContent = "0";
    matchTimeEl.textContent = formatTime(timeLeft);
    endOverlay.hidden = true;
    resetPositions("player");
  }

  playAgainBtn.addEventListener("click", resetMatch);

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (matchRunning && !paused) {
      timeLeft -= dt;
      matchTimeEl.textContent = formatTime(timeLeft);
      const controlled = updatePlayers(dt);
      updateBall(dt, controlled);
      draw(controlled);
      if (timeLeft <= 0) {
        endMatch();
      }
    } else if (matchRunning && paused) {
      draw(ball.owner);
    }
    requestAnimationFrame(loop);
  }

  resetPositions("player");
  matchTimeEl.textContent = formatTime(timeLeft);
  requestAnimationFrame(loop);
})();
