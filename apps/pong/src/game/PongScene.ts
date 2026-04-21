import * as Phaser from "phaser";
import type { GameMode } from "@/App";
import {
  W, H,
  PADDLE_W, PADDLE_H, BALL_R,
  BALL_SPEED_INIT,
  getSpeedT, checkAABB, predictBallX, calcReflect,
} from "./physics";

// ── PongScene 전용 상수 ────────────────────────────────────
const BALL_SPEED_INC    = 12;
const WIN_SCORE         = 7;
const AI_SPEED_X        = 220;
const AI_REACTION_ZONE  = 320;
const SUBSTEPS          = 4;
const TRAIL_LENGTH      = 10;

// 패들 이동 구역
const NET_Y    = H * 0.50;  // 네트 중심선 (P2 하한 = P1 상한)
const P2_Y_MIN = H * 0.15;
const P1_Y_MAX = H * 0.85;

// ── 스킨 팔레트 ────────────────────────────────────────────
type SkinKey = "flame" | "ice" | "electric" | "grass";

interface SkinPalette {
  trail: number;
  glow:  number;
  ballColor: (t: number) => number;
}

const SKIN_PALETTE: Record<SkinKey, SkinPalette> = {
  flame: {
    trail: 0xff6600,
    glow:  0xff3300,
    ballColor: (t) => Phaser.Display.Color.GetColor(
      255,
      Math.round(255 - t * 175),
      Math.round(255 - t * 215),
    ),
  },
  ice: {
    trail: 0x44bbff,
    glow:  0x00aaff,
    ballColor: (t) => Phaser.Display.Color.GetColor(
      Math.round(255 - t * 180),
      Math.round(255 - t *  80),
      255,
    ),
  },
  electric: {
    trail: 0xffee00,
    glow:  0xffdd00,
    ballColor: (t) => Phaser.Display.Color.GetColor(
      255,
      255,
      Math.round(255 - t * 230),
    ),
  },
  grass: {
    trail: 0x55dd22,
    glow:  0x44cc00,
    ballColor: (t) => Phaser.Display.Color.GetColor(
      Math.round(255 - t * 160),
      255,
      Math.round(255 - t * 200),
    ),
  },
};

function getPalette(skin: string): SkinPalette {
  return SKIN_PALETTE[skin as SkinKey] ?? SKIN_PALETTE.flame;
}

// ── SceneData ──────────────────────────────────────────────
interface SceneData {
  mode:    GameMode;
  skinP1:  string;
  skinP2:  string;
  onBack:  () => void;
}

// ── PongScene ──────────────────────────────────────────────
export class PongScene extends Phaser.Scene {
  private mode!:   GameMode;
  private skinP1!: string;
  private skinP2!: string;
  private onBack!: () => void;

  private paddleTop!: Phaser.GameObjects.Image;
  private paddleBot!: Phaser.GameObjects.Image;

  private ball!:      Phaser.GameObjects.Arc;
  private ballVx    = 0;
  private ballVy    = 0;
  private ballSpeed = BALL_SPEED_INIT;

  private trailGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!:  Phaser.GameObjects.Graphics;
  private trail: { x: number; y: number }[] = [];
  private lastHitSkin = "flame";

  private paddleTopPrevY = 0;
  private paddleBotPrevY = 0;
  private paddleTopVy    = 0;
  private paddleBotVy    = 0;

  private scoreTop  = 0;
  private scoreBot  = 0;
  private scoreTopText!: Phaser.GameObjects.Text;
  private scoreBotText!: Phaser.GameObjects.Text;

  private rallyText!: Phaser.GameObjects.Text;
  private rallyCount = 0;
  private lastScorer = 1;

  // 드래그 입력 상태
  private topPtrId = -1;
  private botPtrId = -1;
  private topLastX = 0;
  private topLastY = 0;
  private botLastX = 0;
  private botLastY = 0;

  private isOver   = false;
  private isPaused = false;

  constructor() {
    super({ key: "PongScene" });
  }

  preload() {
    this.load.svg("paddle-flame",    "/assets/paddle-flame.svg",    { width: 220, height: 28 });
    this.load.svg("paddle-ice",      "/assets/paddle-ice.svg",      { width: 220, height: 28 });
    this.load.svg("paddle-electric", "/assets/paddle-electric.svg", { width: 220, height: 28 });
    this.load.svg("paddle-grass",    "/assets/paddle-grass.svg",    { width: 220, height: 28 });
  }

  init(data: SceneData) {
    this.mode       = data.mode;
    this.skinP1     = data.skinP1 ?? "flame";
    this.skinP2     = data.skinP2 ?? "ice";
    this.onBack     = data.onBack;
    this.scoreTop   = 0;
    this.scoreBot   = 0;
    this.isOver     = false;
    this.isPaused   = false;
    this.lastScorer = 1;
    this.rallyCount = 0;
    this.trail      = [];
    this.lastHitSkin = this.skinP1;
    this.topPtrId   = -1;
    this.botPtrId   = -1;
    this.topLastX   = 0;
    this.topLastY   = 0;
    this.botLastX   = 0;
    this.botLastY   = 0;
  }

  create() {
    this.createCourt();

    // 필드 레이블
    this.add.text(30, P2_Y_MIN + 9, this.mode === "ai" ? "AI" : "P2", {
      fontSize: "10px", color: "#ffffff55", fontFamily: "monospace",
    });
    this.add.text(30, P1_Y_MAX + 9, "P1", {
      fontSize: "10px", color: "#ffffff55", fontFamily: "monospace",
    });

    // 패들
    this.paddleTop = this.add.image(W / 2, P2_Y_MIN + 20, `paddle-${this.skinP2}`)
      .setDisplaySize(PADDLE_W, PADDLE_H).setOrigin(0.5);
    this.paddleBot = this.add.image(W / 2, P1_Y_MAX - 20, `paddle-${this.skinP1}`)
      .setDisplaySize(PADDLE_W, PADDLE_H).setOrigin(0.5);
    this.paddleTopPrevY = this.paddleTop.y;
    this.paddleBotPrevY = this.paddleBot.y;

    // 잔상 & 글로우 (공보다 먼저 렌더링)
    this.glowGraphics  = this.add.graphics();
    this.trailGraphics = this.add.graphics();

    // 공
    this.ball = this.add.arc(W / 2, H / 2, BALL_R, 0, 360, false, 0xffffff);

    // 점수
    this.scoreTopText = this.add.text(W / 2, H / 2 - 52, "0", {
      fontSize: "48px", color: "#ffffff25", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5);
    this.scoreBotText = this.add.text(W / 2, H / 2 + 52, "0", {
      fontSize: "48px", color: "#ffffff25", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5);

    // 랠리 카운터
    this.rallyText = this.add.text(W / 2, H / 2 + 18, "", {
      fontSize: "12px", color: "#ffffff55", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(2);

    // 뒤로가기
    const backBtn = this.add.text(22, 22, "✕", {
      fontSize: "22px", color: "#ffffff66", fontFamily: "monospace",
      padding: { x: 16, y: 16 },
    }).setInteractive({ useHandCursor: false }).setDepth(10);
    backBtn.on("pointerover",  () => backBtn.setColor("#ffffffcc"));
    backBtn.on("pointerout",   () => backBtn.setColor("#ffffff66"));
    backBtn.on("pointerdown",  () => this.onBack());

    // 입력
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup",   this.onPointerUp,   this);

    this.showCountdown(() => {
      this.isPaused = false;
      this.launchBall(1);
    });
  }

  update(_time: number, delta: number) {
    if (this.isOver || this.isPaused) return;

    // delta 캡: 탭 전환 spike 방지
    const dt = Math.min(delta / 1000, 0.05);

    // 패들 Vy 계산
    this.paddleTopVy  = (this.paddleTop.y - this.paddleTopPrevY) / dt;
    this.paddleBotVy  = (this.paddleBot.y - this.paddleBotPrevY) / dt;
    this.paddleTopPrevY = this.paddleTop.y;
    this.paddleBotPrevY = this.paddleBot.y;

    if (this.mode === "ai") this.moveAI(dt);

    // 물리 서브스텝
    const subDt = dt / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) {
      this.ball.x += this.ballVx * subDt;
      this.ball.y += this.ballVy * subDt;

      // 좌우 벽 반사
      if (this.ball.x - BALL_R <= 0) {
        this.ball.x = BALL_R;
        this.ballVx = Math.abs(this.ballVx);
      } else if (this.ball.x + BALL_R >= W) {
        this.ball.x = W - BALL_R;
        this.ballVx = -Math.abs(this.ballVx);
      }

      this.checkPaddleCollision();

      // 득점
      if (this.ball.y - BALL_R <= 0) {
        this.scoreBot++;
        this.scoreBotText.setText(String(this.scoreBot));
        this.flashScore(this.scoreBotText);
        this.lastScorer = 1;
        this.onScore();
        return;
      } else if (this.ball.y + BALL_R >= H) {
        this.scoreTop++;
        this.scoreTopText.setText(String(this.scoreTop));
        this.flashScore(this.scoreTopText);
        this.lastScorer = -1;
        this.onScore();
        return;
      }
    }

    this.updateTrail();
    this.updateBallVisuals();
  }

  // ── 하드코트 배경 (US Open 스타일) ───────────────────────
  private createCourt() {
    const g  = this.add.graphics();
    const bx = 22;
    const by = 22;
    const cw = W - bx * 2;
    const ch = H - by * 2;
    const svcTop = H * 0.30;
    const svcBot = H * 0.70;

    // 외부 배경
    g.fillStyle(0x080d18);
    g.fillRect(0, 0, W, H);

    // 코트 베이스
    g.fillStyle(0x1a4a82);
    g.fillRect(bx, by, cw, ch);

    // 서비스 박스 (중앙 구역)
    g.fillStyle(0x1e5499);
    g.fillRect(bx, svcTop, cw, svcBot - svcTop);

    // 코트 경계선
    g.lineStyle(2, 0xffffff, 0.9);
    g.strokeRect(bx, by, cw, ch);

    // 서비스 라인 (가로)
    g.lineStyle(2, 0xffffff, 0.7);
    g.beginPath(); g.moveTo(bx, svcTop); g.lineTo(bx + cw, svcTop); g.strokePath();
    g.beginPath(); g.moveTo(bx, svcBot); g.lineTo(bx + cw, svcBot); g.strokePath();

    // 센터 서비스 라인 (세로)
    g.beginPath(); g.moveTo(W / 2, svcTop); g.lineTo(W / 2, svcBot); g.strokePath();

    // 네트 포스트
    g.fillStyle(0xcccccc);
    g.fillRect(bx - 5, H / 2 - 5, 5, 10);
    g.fillRect(bx + cw, H / 2 - 5, 5, 10);

    // 네트
    g.lineStyle(4, 0xd0d0d0);
    g.beginPath(); g.moveTo(bx, H / 2); g.lineTo(bx + cw, H / 2); g.strokePath();

    // 네트 메시
    g.lineStyle(1, 0x888888, 0.5);
    for (let x = bx + 6; x < bx + cw; x += 9) {
      g.beginPath(); g.moveTo(x, H / 2 - 2); g.lineTo(x, H / 2 + 3); g.strokePath();
    }

    // 패들 이동 한계선
    g.lineStyle(1, 0xffffff, 0.2);
    g.beginPath(); g.moveTo(bx, P2_Y_MIN); g.lineTo(bx + cw, P2_Y_MIN); g.strokePath();
    g.beginPath(); g.moveTo(bx, P1_Y_MAX); g.lineTo(bx + cw, P1_Y_MAX); g.strokePath();
  }

  // ── 공 시각 업데이트 ─────────────────────────────────────
  private updateTrail() {
    this.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

    const trailColor = getPalette(this.lastHitSkin).trail;
    this.trailGraphics.clear();
    const len = this.trail.length;
    for (let i = 0; i < len - 1; i++) {
      const t      = i / (len - 1);
      const radius = BALL_R * (0.25 + 0.75 * t);
      this.trailGraphics.fillStyle(trailColor, t * 0.4);
      this.trailGraphics.fillCircle(this.trail[i].x, this.trail[i].y, radius);
    }
  }

  private updateBallVisuals() {
    const t       = getSpeedT(this.ballSpeed);
    const palette = getPalette(this.lastHitSkin);

    // 공 색상
    this.ball.setFillStyle(palette.ballColor(t));

    // 글로우
    const glowAlpha = 0.08 + t * 0.18;
    const glowR     = BALL_R * (1.8 + t * 1.2);
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(palette.glow, glowAlpha);
    this.glowGraphics.fillCircle(this.ball.x, this.ball.y, glowR);
    this.glowGraphics.fillStyle(palette.glow, glowAlpha * 0.6);
    this.glowGraphics.fillCircle(this.ball.x, this.ball.y, glowR * 0.6);
  }

  // ── 카운트다운 ───────────────────────────────────────────
  private showCountdown(onDone: () => void) {
    this.isPaused = true;
    const items = [
      { label: "3",   color: "#ffffff", dur: 400 },
      { label: "2",   color: "#ffffff", dur: 400 },
      { label: "1",   color: "#ffffff", dur: 400 },
      { label: "GO!", color: "#88ffaa", dur: 280 },
    ];
    let idx = 0;

    const showNext = () => {
      if (idx >= items.length) { onDone(); return; }
      const { label, color, dur } = items[idx];
      const txt = this.add.text(W / 2, H / 2 + 20, label, {
        fontSize: label === "GO!" ? "48px" : "72px",
        color, fontFamily: "monospace", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(30);

      this.tweens.add({
        targets: txt,
        alpha: { from: 1, to: 0 },
        y: txt.y - 28,
        duration: dur,
        delay: 50,
        ease: "Power1",
        onComplete: () => { txt.destroy(); idx++; showNext(); },
      });
    };
    showNext();
  }

  // ── AI ───────────────────────────────────────────────────
  private moveAI(dt: number) {
    const ballDistY = Math.abs(this.ball.y - this.paddleTop.y);
    const homeY     = P2_Y_MIN + 20;

    if (ballDistY > AI_REACTION_ZONE) {
      this.paddleTop.y += (homeY - this.paddleTop.y) * 3 * dt;
      return;
    }

    // X: 예측 착지점으로 이동
    const errorX  = Math.sin(this.ball.y * 0.03) * W * 0.025;
    const targetX = predictBallX({
      ballX: this.ball.x, ballY: this.ball.y,
      ballVx: this.ballVx, ballVy: this.ballVy,
      targetY: this.paddleTop.y,
      fallbackX: this.paddleTop.x,
    }) + (this.ballVy >= 0 ? 0 : errorX);
    const moveX   = Phaser.Math.Clamp(targetX - this.paddleTop.x, -AI_SPEED_X * dt, AI_SPEED_X * dt);
    this.paddleTop.x = Phaser.Math.Clamp(this.paddleTop.x + moveX, PADDLE_W / 2, W - PADDLE_W / 2);

    // Y: 공이 다가오면 전진, 멀어지면 홈
    if (this.ballVy < 0) {
      this.paddleTop.y = Phaser.Math.Clamp(
        this.paddleTop.y + 40 * dt,
        P2_Y_MIN + 10, NET_Y - 10,
      );
    } else {
      this.paddleTop.y += (homeY - this.paddleTop.y) * 2 * dt;
    }
  }

  // ── 충돌 처리 ────────────────────────────────────────────
  private checkPaddleCollision() {
    this.resolveCollision(this.paddleTop, false);
    this.resolveCollision(this.paddleBot, true);
  }

  private resolveCollision(paddle: Phaser.GameObjects.Image, isBottom: boolean) {
    const ball   = { x: this.ball.x, y: this.ball.y, r: BALL_R };
    const rect   = { x: paddle.x, y: paddle.y, w: PADDLE_W, h: PADDLE_H };
    const { xOverlap, yOverlap } = checkAABB(ball, rect);
    if (!xOverlap || !yOverlap) return;

    // 속도 방향으로만 유효성 판단 (고속 통과 방지)
    if (isBottom  && this.ballVy <= 0) return;
    if (!isBottom && this.ballVy >= 0) return;

    const padTop = paddle.y - PADDLE_H / 2;
    const padBot = paddle.y + PADDLE_H / 2;
    this.ball.y = isBottom ? padTop - BALL_R : padBot + BALL_R;
    this.reflectBall(paddle, isBottom);
  }

  private reflectBall(paddle: Phaser.GameObjects.Image, isBottom: boolean) {
    const paddleVy = paddle === this.paddleBot ? this.paddleBotVy : this.paddleTopVy;

    const { ballVx, ballVy, newSpeed } = calcReflect({
      ballX: this.ball.x,
      paddleX: paddle.x,
      paddleVy,
      currentSpeed: this.ballSpeed,
      isBottom,
      speedInc: BALL_SPEED_INC,
    });

    // speedBonus는 로그/이펙트 판정용으로 역산
    const speedBonus = newSpeed - this.ballSpeed - BALL_SPEED_INC;

    this.ballSpeed = newSpeed;
    this.ballVx    = ballVx;
    this.ballVy    = ballVy;

    // 패들 플래시
    this.tweens.add({ targets: paddle, alpha: 0.3, duration: 60, yoyo: true });

    // 랠리 카운터
    this.rallyCount++;
    if (this.rallyCount > 1) {
      this.rallyText.setText(String(this.rallyCount));
      this.tweens.add({ targets: this.rallyText, scaleX: 1.5, scaleY: 1.5, duration: 80, yoyo: true });
    }

    // 큰 가속 시 번개 이펙트
    if (speedBonus > 40) {
      const boom = this.add.text(this.ball.x, this.ball.y, "⚡", { fontSize: "18px" })
        .setOrigin(0.5).setDepth(5);
      this.tweens.add({
        targets: boom, y: boom.y - 30, alpha: 0, duration: 400,
        onComplete: () => boom.destroy(),
      });
    }

    // 마지막 히트 스킨 전이
    this.lastHitSkin = paddle === this.paddleBot ? this.skinP1 : this.skinP2;

    // Vy 스파이크 방지용 prevY 리셋
    this.paddleTopPrevY = this.paddleTop.y;
    this.paddleBotPrevY = this.paddleBot.y;
  }

  // ── 득점 ─────────────────────────────────────────────────
  private onScore() {
    this.isPaused = true;
    this.rallyCount = 0;
    this.rallyText.setText("");
    this.trail = [];
    this.trailGraphics.clear();
    this.glowGraphics.clear();
    this.lastHitSkin = this.skinP1;

    this.ball.setPosition(W / 2, H / 2).setFillStyle(0xffffff);
    this.ballVx = 0;
    this.ballVy = 0;

    this.cameras.main.shake(200, 0.012);

    // 매치 포인트 플래시
    if (this.scoreBot === WIN_SCORE - 1) this.showMatchPointFlash(true);
    if (this.scoreTop === WIN_SCORE - 1) this.showMatchPointFlash(false);

    if (this.scoreTop >= WIN_SCORE || this.scoreBot >= WIN_SCORE) {
      this.time.delayedCall(500, () => this.showResult());
      return;
    }

    this.time.delayedCall(300, () => {
      this.showCountdown(() => {
        this.paddleTopPrevY = this.paddleTop.y;
        this.paddleBotPrevY = this.paddleBot.y;
        this.isPaused  = false;
        this.ballSpeed = BALL_SPEED_INIT;
        this.launchBall(this.lastScorer);
      });
    });
  }

  private showMatchPointFlash(isBot: boolean) {
    const centerY = isBot ? H * 0.675 : H * 0.325;

    const flash = this.add.rectangle(W / 2, centerY, W, H * 0.35, 0xff3300, 0).setDepth(0);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.12 },
      duration: 200, yoyo: true, repeat: 1,
      onComplete: () => flash.destroy(),
    });

    const label = this.add.text(W / 2, centerY, "MATCH POINT", {
      fontSize: "11px", color: "#ff4400", fontFamily: "monospace", letterSpacing: 3,
    }).setOrigin(0.5).setDepth(5).setAlpha(0);
    this.tweens.add({
      targets: label,
      alpha: { from: 0.8, to: 0 },
      y: centerY - 20, duration: 900, delay: 100,
      onComplete: () => label.destroy(),
    });
  }

  private launchBall(dirY: number) {
    const angleDeg = Phaser.Math.Between(25, 55) * (Math.random() < 0.5 ? 1 : -1);
    const rad      = Phaser.Math.DegToRad(angleDeg);
    this.ballVx    =  Math.sin(rad) * this.ballSpeed;
    this.ballVy    = -dirY * Math.cos(rad) * this.ballSpeed;
  }

  private flashScore(text: Phaser.GameObjects.Text) {
    this.tweens.add({
      targets: text,
      alpha:  { from: 0.9, to: 0.1 },
      scaleX: { from: 1.6, to: 1 },
      scaleY: { from: 1.6, to: 1 },
      duration: 700, ease: "Power2",
    });
  }

  // ── 결과 화면 ─────────────────────────────────────────────
  private showResult() {
    this.isOver = true;
    const p1Win      = this.scoreBot > this.scoreTop;
    const winnerLabel = this.mode === "ai"
      ? (p1Win ? "YOU WIN!" : "AI WIN!")
      : (p1Win ? "P1 WIN!"  : "P2 WIN!");

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(20);
    this.tweens.add({ targets: overlay, alpha: 0.82, duration: 450 });

    const winText = this.add.text(W / 2, H / 2 - 90, winnerLabel, {
      fontSize: "44px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(21).setAlpha(0).setScale(0.4);
    this.tweens.add({ targets: winText, alpha: 1, scaleX: 1, scaleY: 1, duration: 450, ease: "Back.Out" });

    this.time.delayedCall(350, () => {
      this.add.text(W / 2, H / 2 - 26, `${this.scoreBot}  :  ${this.scoreTop}`, {
        fontSize: "30px", color: "#888888", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(21);
      this.add.text(W / 2, H / 2 + 12, this.mode === "ai" ? "P1  :  AI" : "P1  :  P2", {
        fontSize: "12px", color: "#555", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(21);

      const retryBtn = this.add.text(W / 2, H / 2 + 100, "[ 다시하기 ]", {
        fontSize: "20px", color: "#ffffff", fontFamily: "monospace",
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(21).setInteractive().setAlpha(0);
      const menuBtn = this.add.text(W / 2, H / 2 + 162, "[ 메뉴로 ]", {
        fontSize: "16px", color: "#666", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(21).setInteractive().setAlpha(0);

      this.tweens.add({ targets: [retryBtn, menuBtn], alpha: 1, duration: 300 });
      retryBtn.on("pointerdown", () =>
        this.scene.restart({ mode: this.mode, skinP1: this.skinP1, skinP2: this.skinP2, onBack: this.onBack }),
      );
      menuBtn.on("pointerdown", () => this.onBack());
    });
  }

  // ── 터치 입력 (드래그 델타) ──────────────────────────────
  private onPointerDown(p: Phaser.Input.Pointer) {
    if (this.isOver) return;
    if (p.y < H / 2) {
      if (this.mode === "pvp" && this.topPtrId === -1) {
        this.topPtrId = p.id;
        this.topLastX = p.x;
        this.topLastY = p.y;
      }
    } else {
      if (this.botPtrId === -1) {
        this.botPtrId = p.id;
        this.botLastX = p.x;
        this.botLastY = p.y;
      }
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (this.isOver) return;
    if (p.id === this.topPtrId && this.mode === "pvp") {
      this.paddleTop.x = Phaser.Math.Clamp(
        this.paddleTop.x + (p.x - this.topLastX), PADDLE_W / 2, W - PADDLE_W / 2,
      );
      this.paddleTop.y = Phaser.Math.Clamp(
        this.paddleTop.y + (p.y - this.topLastY), P2_Y_MIN, NET_Y,
      );
      this.topLastX = p.x;
      this.topLastY = p.y;
    }
    if (p.id === this.botPtrId) {
      this.paddleBot.x = Phaser.Math.Clamp(
        this.paddleBot.x + (p.x - this.botLastX), PADDLE_W / 2, W - PADDLE_W / 2,
      );
      this.paddleBot.y = Phaser.Math.Clamp(
        this.paddleBot.y + (p.y - this.botLastY), NET_Y, P1_Y_MAX,
      );
      this.botLastX = p.x;
      this.botLastY = p.y;
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    if (p.id === this.topPtrId) this.topPtrId = -1;
    if (p.id === this.botPtrId) this.botPtrId = -1;
  }
}
