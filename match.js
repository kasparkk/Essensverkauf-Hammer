(function () {
  "use strict";

  const hud = {
    playerScore: document.getElementById("player-score"),
    aiScore: document.getElementById("ai-score"),
    matchTime: document.getElementById("match-time"),
    eventBanner: document.getElementById("event-banner"),
    endOverlay: document.getElementById("end-overlay"),
    endTitle: document.getElementById("end-title"),
    endText: document.getElementById("end-text"),
    playAgainBtn: document.getElementById("play-again-btn"),
    shootBtn: document.getElementById("shoot-btn"),
    passBtn: document.getElementById("pass-btn"),
  };

  const W = 760;
  const H = 460;
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

  class MatchScene extends Phaser.Scene {
    constructor() {
      super("match");
    }

    create() {
      this.playerScore = 0;
      this.aiScore = 0;
      this.timeLeft = MATCH_SECONDS;
      this.matchRunning = true;
      this.paused = false;
      this.shootPressed = false;
      this.passPressed = false;
      this.keysDown = Object.create(null);
      this.joystick = null;

      this.physics.world.setBounds(PITCH.left, PITCH.top, PITCH.right - PITCH.left, PITCH.bottom - PITCH.top);

      this.drawStaticPitch();
      this.players = this.buildTeams();
      this.ball = this.createBall();
      this.dynamicGfx = this.add.graphics();

      this.setupInput();

      hud.playAgainBtn.addEventListener("click", () => this.resetMatch());
      hud.shootBtn.addEventListener("click", () => {
        this.shootPressed = true;
      });
      hud.passBtn.addEventListener("click", () => {
        this.passPressed = true;
      });

      hud.matchTime.textContent = this.formatTime(this.timeLeft);
      this.resetPositions("player");
    }

    drawStaticPitch() {
      const g = this.add.graphics();
      g.fillStyle(0x1e7a3d, 1);
      g.fillRect(0, 0, W, H);
      g.fillStyle(0xffffff, 0.05);
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) g.fillRect((W / 8) * i, 0, W / 8, H);
      }

      g.lineStyle(2, 0xffffff, 0.85);
      g.strokeRect(PITCH.left, PITCH.top, PITCH.right - PITCH.left, PITCH.bottom - PITCH.top);
      g.beginPath();
      g.moveTo(W / 2, PITCH.top);
      g.lineTo(W / 2, PITCH.bottom);
      g.strokePath();
      g.strokeCircle(W / 2, H / 2, 45);

      g.strokeRect(PITCH.left, GOAL_TOP - 30, 80, GOAL_HALF * 2 + 60);
      g.strokeRect(PITCH.right - 80, GOAL_TOP - 30, 80, GOAL_HALF * 2 + 60);

      g.lineStyle(6, 0xffffff, 1);
      g.beginPath();
      g.moveTo(PITCH.left, GOAL_TOP);
      g.lineTo(PITCH.left - 14, GOAL_TOP);
      g.lineTo(PITCH.left - 14, GOAL_BOTTOM);
      g.lineTo(PITCH.left, GOAL_BOTTOM);
      g.strokePath();
      g.beginPath();
      g.moveTo(PITCH.right, GOAL_TOP);
      g.lineTo(PITCH.right + 14, GOAL_TOP);
      g.lineTo(PITCH.right + 14, GOAL_BOTTOM);
      g.lineTo(PITCH.right, GOAL_BOTTOM);
      g.strokePath();
    }

    makePlayer(team, role, x, y) {
      const color =
        team === "player" ? (role === "keeper" ? 0x274b7a : 0x3b6fb0) : role === "keeper" ? 0x7a2727 : 0xc23b3b;
      const radius = 11;
      const circle = this.add.circle(x, y, radius, color);
      this.physics.add.existing(circle);
      circle.body.setCircle(radius);
      circle.body.setCollideWorldBounds(true);

      circle.team = team;
      circle.role = role;
      circle.facingX = team === "player" ? 1 : -1;
      circle.facingY = 0;
      circle.homeX = x;
      circle.homeY = y;
      circle.radius = radius;
      circle.possessionUntil = 0;
      return circle;
    }

    buildTeams() {
      const player = [
        this.makePlayer("player", "keeper", 40, H / 2),
        this.makePlayer("player", "field", 160, H / 2 - 90),
        this.makePlayer("player", "field", 160, H / 2 + 90),
        this.makePlayer("player", "field", 300, H / 2),
        this.makePlayer("player", "field", 400, H / 2),
      ];
      const ai = [
        this.makePlayer("ai", "keeper", W - 40, H / 2),
        this.makePlayer("ai", "field", W - 160, H / 2 - 90),
        this.makePlayer("ai", "field", W - 160, H / 2 + 90),
        this.makePlayer("ai", "field", W - 300, H / 2),
        this.makePlayer("ai", "field", W - 400, H / 2),
      ];
      return player.concat(ai);
    }

    createBall() {
      const ball = this.add.circle(W / 2, H / 2, 7, 0xffffff);
      ball.setStrokeStyle(1, 0x222222, 1);
      ball.vx = 0;
      ball.vy = 0;
      ball.r = 7;
      ball.owner = null;
      return ball;
    }

    setupInput() {
      this.onKeyDown = (event) => {
        this.keysDown[event.key.toLowerCase()] = true;
        if (event.key === " ") {
          event.preventDefault();
          if (!event.repeat) this.shootPressed = true;
        } else if (event.key.toLowerCase() === "x" && !event.repeat) {
          this.passPressed = true;
        }
      };
      this.onKeyUp = (event) => {
        this.keysDown[event.key.toLowerCase()] = false;
      };
      window.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("keyup", this.onKeyUp);
      this.events.once("shutdown", () => {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
      });

      this.input.on("pointerdown", (pointer) => {
        this.joystick = { originX: pointer.x, originY: pointer.y, dx: 0, dy: 0 };
      });
      this.input.on("pointermove", (pointer) => {
        if (!this.joystick) return;
        this.joystick.dx = clamp(pointer.x - this.joystick.originX, -40, 40);
        this.joystick.dy = clamp(pointer.y - this.joystick.originY, -40, 40);
      });
      this.input.on("pointerup", () => {
        this.joystick = null;
      });
    }

    getInputVector() {
      let ix = 0;
      let iy = 0;
      const keys = this.keysDown;
      if (keys["arrowleft"] || keys["a"]) ix -= 1;
      if (keys["arrowright"] || keys["d"]) ix += 1;
      if (keys["arrowup"] || keys["w"]) iy -= 1;
      if (keys["arrowdown"] || keys["s"]) iy += 1;
      if (this.joystick && (this.joystick.dx || this.joystick.dy)) {
        ix = this.joystick.dx / 40;
        iy = this.joystick.dy / 40;
      }
      const magnitude = len(ix, iy);
      if (magnitude > 1) {
        ix /= magnitude;
        iy /= magnitude;
      }
      return { x: ix, y: iy, magnitude: Math.min(1, magnitude) };
    }

    fieldPlayers(team) {
      return this.players.filter((p) => p.team === team && p.role === "field");
    }

    nearestTo(list, point) {
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

    seekTowards(p, targetX, targetY, maxSpeed, dt) {
      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const d = len(dx, dy);
      let desiredVx = 0;
      let desiredVy = 0;
      if (d > 4) {
        desiredVx = (dx / d) * maxSpeed;
        desiredVy = (dy / d) * maxSpeed;
      }
      const vx = p.body.velocity.x + clamp(desiredVx - p.body.velocity.x, -ACCEL * dt, ACCEL * dt);
      const vy = p.body.velocity.y + clamp(desiredVy - p.body.velocity.y, -ACCEL * dt, ACCEL * dt);
      p.body.setVelocity(vx, vy);
      if (len(vx, vy) > 6) {
        const f = len(vx, vy);
        p.facingX = vx / f;
        p.facingY = vy / f;
      }
    }

    applyInputMovement(p, input, dt) {
      const desiredVx = input.x * OUTFIELD_SPEED;
      const desiredVy = input.y * OUTFIELD_SPEED;
      const vx = p.body.velocity.x + clamp(desiredVx - p.body.velocity.x, -ACCEL * dt, ACCEL * dt);
      const vy = p.body.velocity.y + clamp(desiredVy - p.body.velocity.y, -ACCEL * dt, ACCEL * dt);
      p.body.setVelocity(vx, vy);
      if (input.magnitude > 0.15) {
        p.facingX = input.x / (input.magnitude || 1);
        p.facingY = input.y / (input.magnitude || 1);
      }
    }

    teammateSupportTarget(p, teamHasBall, attackDir) {
      const shift = teamHasBall ? attackDir * 70 : -attackDir * 20;
      const targetX = clamp(p.homeX + shift + (this.ball.x - W / 2) * 0.12, PITCH.left + 15, PITCH.right - 15);
      const targetY = clamp(p.homeY + (this.ball.y - p.homeY) * 0.3, PITCH.top + 15, PITCH.bottom - 15);
      return { x: targetX, y: targetY };
    }

    keeperTarget(p, ownGoalX) {
      const targetX = ownGoalX;
      const targetY = clamp(this.ball.y, GOAL_TOP - 5, GOAL_BOTTOM + 5);
      return { x: targetX, y: targetY };
    }

    releaseBall(targetX, targetY, speed) {
      const ball = this.ball;
      const dx = targetX - ball.x;
      const dy = targetY - ball.y;
      const d = len(dx, dy) || 1;
      ball.owner = null;
      ball.vx = (dx / d) * speed;
      ball.vy = (dy / d) * speed;
    }

    facingKick(shooter, speed) {
      const ball = this.ball;
      const dx = shooter.facingX || (shooter.team === "player" ? 1 : -1);
      const dy = shooter.facingY || 0;
      ball.owner = null;
      ball.vx = dx * speed;
      ball.vy = dy * speed;
    }

    showEvent(text, conceded) {
      hud.eventBanner.textContent = text;
      hud.eventBanner.className = "event-banner" + (conceded ? " conceded" : "");
      hud.eventBanner.hidden = false;
      setTimeout(() => {
        hud.eventBanner.hidden = true;
      }, 1100);
    }

    resetPositions(kickoffTeam) {
      for (const p of this.players) {
        p.setPosition(p.homeX, p.homeY);
        p.body.setVelocity(0, 0);
      }
      this.ball.setPosition(W / 2, H / 2);
      this.ball.vx = 0;
      this.ball.vy = 0;
      const kicker = this.nearestTo(this.fieldPlayers(kickoffTeam), { x: W / 2, y: H / 2 });
      this.ball.owner = kicker;
      kicker.possessionUntil = performance.now() + POSSESSION_IMMUNITY_MS;
    }

    goalScored(scoringTeam) {
      this.paused = true;
      if (scoringTeam === "player") {
        this.playerScore += 1;
        this.showEvent("TOR für dich!", false);
      } else {
        this.aiScore += 1;
        this.showEvent("Gegentor…", true);
      }
      hud.playerScore.textContent = String(this.playerScore);
      hud.aiScore.textContent = String(this.aiScore);
      const restartTeam = scoringTeam === "player" ? "ai" : "player";
      setTimeout(() => {
        this.resetPositions(restartTeam);
        this.paused = false;
      }, 1000);
    }

    updatePlayers(dt) {
      // Solange das eigene Team den Ball hat, bleibt die Steuerung fest beim
      // Ballführenden (sonst würde sie bei heranrückenden Mitspielern flackern).
      const ball = this.ball;
      const controlled =
        ball.owner && ball.owner.team === "player" ? ball.owner : this.nearestTo(this.fieldPlayers("player"), ball);
      const input = this.getInputVector();
      this.applyInputMovement(controlled, input, dt);

      const playerHasBall = ball.owner && ball.owner.team === "player";
      for (const p of this.fieldPlayers("player")) {
        if (p === controlled) continue;
        const target = this.teammateSupportTarget(p, playerHasBall, 1);
        this.seekTowards(p, target.x, target.y, OUTFIELD_SPEED * 0.85, dt);
      }
      const playerKeeper = this.players.find((p) => p.team === "player" && p.role === "keeper");
      const pk = this.keeperTarget(playerKeeper, playerKeeper.homeX);
      this.seekTowards(playerKeeper, pk.x, pk.y, OUTFIELD_SPEED * 0.8, dt);

      const aiField = this.fieldPlayers("ai");
      const aiHasBall = ball.owner && ball.owner.team === "ai";
      // Wie beim Spielerteam: der Ballführer bleibt "aktiv", auch wenn ein
      // Mitspieler zufällig naeher am Ball steht.
      const aiCarrier = aiHasBall ? ball.owner : this.nearestTo(aiField, ball);
      for (const p of aiField) {
        if (p === aiCarrier) {
          if (aiHasBall) {
            this.seekTowards(p, PITCH.left + 60, GOAL_TOP + GOAL_HALF, OUTFIELD_SPEED * AI_SPEED_FACTOR, dt);
            if (p.x < 230 && Math.random() < 0.02) {
              const aimY = H / 2 + (Math.random() - 0.5) * 70;
              this.releaseBall(PITCH.left, aimY, SHOT_SPEED);
            }
          } else {
            this.seekTowards(p, ball.x, ball.y, OUTFIELD_SPEED * AI_SPEED_FACTOR, dt);
          }
        } else {
          const target = this.teammateSupportTarget(p, aiHasBall, -1);
          this.seekTowards(p, target.x, target.y, OUTFIELD_SPEED * AI_SPEED_FACTOR * 0.85, dt);
        }
      }
      const aiKeeper = this.players.find((p) => p.team === "ai" && p.role === "keeper");
      const ak = this.keeperTarget(aiKeeper, aiKeeper.homeX);
      this.seekTowards(aiKeeper, ak.x, ak.y, OUTFIELD_SPEED * 0.8, dt);

      return controlled;
    }

    updateBall(dt, controlled) {
      const ball = this.ball;
      if (ball.owner) {
        ball.setPosition(ball.owner.x + ball.owner.facingX * 16, ball.owner.y + ball.owner.facingY * 16);
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
        let nx = ball.x + ball.vx * dt;
        let ny = ball.y + ball.vy * dt;

        const inGoalMouthY = ny > GOAL_TOP && ny < GOAL_BOTTOM;
        if (!inGoalMouthY) {
          if (ny < PITCH.top + ball.r) {
            ny = PITCH.top + ball.r;
            ball.vy *= -0.6;
          } else if (ny > PITCH.bottom - ball.r) {
            ny = PITCH.bottom - ball.r;
            ball.vy *= -0.6;
          }
        }

        if (nx < PITCH.left - 30 || nx > PITCH.right + 30) {
          nx = clamp(nx, PITCH.left - 30, PITCH.right + 30);
          ball.vx = 0;
          ball.vy = 0;
        } else if (!inGoalMouthY) {
          if (nx < PITCH.left + ball.r) {
            nx = PITCH.left + ball.r;
            ball.vx *= -0.6;
          } else if (nx > PITCH.right - ball.r) {
            nx = PITCH.right - ball.r;
            ball.vx *= -0.6;
          }
        }
        ball.setPosition(nx, ny);
      }

      if (this.paused) return;

      if (ball.x < PITCH.left - 12 && ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
        this.goalScored("ai");
        return;
      }
      if (ball.x > PITCH.right + 12 && ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
        this.goalScored("player");
        return;
      }

      const now = performance.now();
      if (!ball.owner) {
        let claimant = null;
        let claimantDist = Infinity;
        for (const p of this.players) {
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
        for (const p of this.players) {
          if (p === ball.owner || p.team === ball.owner.team) continue;
          if (dist(p, ball.owner) < 18 && Math.random() < TACKLE_CHANCE_PER_SEC * dt) {
            ball.owner = p;
            p.possessionUntil = now + POSSESSION_IMMUNITY_MS;
            break;
          }
        }
      }

      if (this.shootPressed) {
        this.shootPressed = false;
        if (ball.owner === controlled) {
          this.facingKick(controlled, SHOT_SPEED);
        }
      }
      if (this.passPressed) {
        this.passPressed = false;
        if (ball.owner === controlled) {
          const mates = this.fieldPlayers("player").filter((p) => p !== controlled);
          const target = this.nearestTo(mates, controlled);
          if (target) {
            this.releaseBall(target.x, target.y, PASS_SPEED);
          } else {
            this.facingKick(controlled, PASS_SPEED);
          }
        }
      }
    }

    renderDynamic(controlled) {
      const g = this.dynamicGfx;
      g.clear();
      for (const p of this.players) {
        g.lineStyle(2, 0xffffff, 0.9);
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x + p.facingX * (p.radius + 6), p.y + p.facingY * (p.radius + 6));
        g.strokePath();
        if (p === controlled) {
          g.lineStyle(2, 0xfff700, 1);
          g.strokeCircle(p.x, p.y, p.radius + 4);
        }
      }
      if (this.joystick) {
        g.lineStyle(2, 0xffffff, 0.6);
        g.strokeCircle(this.joystick.originX, this.joystick.originY, 40);
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(this.joystick.originX + this.joystick.dx, this.joystick.originY + this.joystick.dy, 14);
      }
    }

    formatTime(seconds) {
      const s = Math.max(0, Math.ceil(seconds));
      const m = Math.floor(s / 60);
      const rest = s % 60;
      return `${m}:${String(rest).padStart(2, "0")}`;
    }

    endMatch() {
      this.matchRunning = false;
      let title = "Unentschieden";
      if (this.playerScore > this.aiScore) title = "Sieg! 🏆";
      else if (this.playerScore < this.aiScore) title = "Niederlage";
      hud.endTitle.textContent = title;
      hud.endText.textContent = `Endstand ${this.playerScore} : ${this.aiScore}.`;
      hud.endOverlay.hidden = false;
    }

    resetMatch() {
      this.playerScore = 0;
      this.aiScore = 0;
      this.timeLeft = MATCH_SECONDS;
      this.matchRunning = true;
      this.paused = false;
      hud.playerScore.textContent = "0";
      hud.aiScore.textContent = "0";
      hud.matchTime.textContent = this.formatTime(this.timeLeft);
      hud.endOverlay.hidden = true;
      this.resetPositions("player");
    }

    update(time, delta) {
      const dt = Math.min(0.05, delta / 1000);
      if (this.matchRunning && !this.paused) {
        this.timeLeft -= dt;
        hud.matchTime.textContent = this.formatTime(this.timeLeft);
        const controlled = this.updatePlayers(dt);
        this.updateBall(dt, controlled);
        this.renderDynamic(controlled);
        if (this.timeLeft <= 0) {
          this.endMatch();
        }
      } else if (this.matchRunning && this.paused) {
        this.renderDynamic(this.ball.owner);
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "pitch-container",
    width: W,
    height: H,
    backgroundColor: "#2e8b3d",
    physics: { default: "arcade", arcade: { debug: false } },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: MatchScene,
  };

  new Phaser.Game(config);
})();
