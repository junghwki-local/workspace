import * as Phaser from 'phaser';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sb } from '@/lib/supabase';
import {
  W, H, PADDLE_W, PADDLE_H, BALL_R,
  BALL_SPEED_INIT,
  getSpeedT, calcReflect,
} from './physics';

const BALL_SPEED_INC = 12;
// this.winScore is now per-game (this.winScore), set from lobby
const SUBSTEPS       = 4;
const TRAIL_LENGTH   = 10;
const NET_Y    = H * 0.50;
const P2_Y_MIN = H * 0.15;
const P1_Y_MAX = H * 0.85;
const SYNC_EVERY = 3;

type SkinKey = 'flame' | 'ice' | 'electric' | 'grass';

const SKIN_PALETTE: Record<SkinKey, { trail: number; glow: number; ballColor: (t: number) => number }> = {
  flame:    { trail: 0xff6600, glow: 0xff3300, ballColor: (t) => Phaser.Display.Color.GetColor(255, Math.round(255 - t * 175), Math.round(255 - t * 215)) },
  ice:      { trail: 0x44bbff, glow: 0x00aaff, ballColor: (t) => Phaser.Display.Color.GetColor(Math.round(255 - t * 180), Math.round(255 - t * 80), 255) },
  electric: { trail: 0xffee00, glow: 0xffdd00, ballColor: (t) => Phaser.Display.Color.GetColor(255, 255, Math.round(255 - t * 230)) },
  grass:    { trail: 0x55dd22, glow: 0x44cc00, ballColor: (t) => Phaser.Display.Color.GetColor(Math.round(255 - t * 160), 255, Math.round(255 - t * 200)) },
};
const getPalette = (s: string) => SKIN_PALETTE[s as SkinKey] ?? SKIN_PALETTE.flame;

export interface OnlineSceneData {
  code:         string;
  myId:         string;
  isHost:       boolean;
  mySkin:       string;
  opponentSkin: string;
  winScore:     number;
  onBack:       () => void;
}

export class OnlinePongScene extends Phaser.Scene {
  private code!:         string;
  private isHost!:       boolean;
  private mySkin!:       string;
  private opponentSkin!: string;
  private onBack!:       () => void;
  private winScore!:     number;

  // Ball (host authoritative)
  private bx = W / 2;
  private by = H / 2;
  private vx = 0;
  private vy = 0;
  private spd = BALL_SPEED_INIT;
  private lastHitSkin = 'flame';
  private trail: { x: number; y: number }[] = [];

  // My paddle (bottom if host, top if guest)
  private myPx = W / 2;
  private myPy = 0; // set in init()

  // Opponent paddle
  private opPx = W / 2;
  private opPy = 0; // set in init()

  get myYMin() { return this.isHost ? NET_Y : P2_Y_MIN; }
  get myYMax() { return this.isHost ? P1_Y_MAX : NET_Y; }

  // Velocity tracking for host reflect
  private myPrevY = 0;
  private myVy    = 0;

  private myScore = 0;
  private opScore = 0;
  private rally   = 0;
  private lastScorer = 1;

  private isPaused = true;
  private isOver   = false;

  private frameCount = 0;
  private channel: RealtimeChannel | null = null;

  // Phaser objects
  private myPaddle!:    Phaser.GameObjects.Image;
  private opPaddle!:    Phaser.GameObjects.Image;
  private ball!:        Phaser.GameObjects.Arc;
  private trailGfx!:   Phaser.GameObjects.Graphics;
  private glowGfx!:    Phaser.GameObjects.Graphics;
  private myScoreText!: Phaser.GameObjects.Text;
  private opScoreText!: Phaser.GameObjects.Text;
  private rallyText!:   Phaser.GameObjects.Text;
  private statusText!:  Phaser.GameObjects.Text;

  // Input
  private ptrId = -1;
  private pLx = 0;
  private pLy = 0;

  // Countdown
  private cdTexts = ['3', '2', '1', 'GO!'];
  private cdIdx   = -1;
  private cdTimer = 0;
  private cdText!: Phaser.GameObjects.Text;
  private cdDone: (() => void) | null = null;

  constructor() { super({ key: 'OnlinePongScene' }); }

  preload() {
    for (const s of ['flame', 'ice', 'electric', 'grass']) {
      if (!this.textures.exists(`paddle-${s}`))
        this.load.svg(`paddle-${s}`, `/assets/paddle-${s}.svg`, { width: 220, height: 28 });
    }
  }

  init(data: OnlineSceneData) {
    this.code         = data.code;
    this.isHost       = data.isHost;
    this.mySkin       = data.mySkin;
    this.opponentSkin = data.opponentSkin;
    this.onBack       = data.onBack;
    this.winScore     = data.winScore ?? 7;
    this.lastHitSkin  = data.mySkin;
    this.bx = W / 2; this.by = H / 2;
    this.vx = 0; this.vy = 0; this.spd = BALL_SPEED_INIT;
    this.myPx = W / 2;
    this.myPy = data.isHost ? P1_Y_MAX - 20 : P2_Y_MIN + 20;
    this.opPx = W / 2;
    this.opPy = data.isHost ? P2_Y_MIN + 20 : P1_Y_MAX - 20;
    this.myScore = 0; this.opScore = 0;
    this.rally = 0; this.lastScorer = 1;
    this.isPaused = true; this.isOver = false;
    this.frameCount = 0; this.trail = [];
    this.ptrId = -1;
  }

  create() {
    this.myPrevY = this.myPy;
    this.createCourt();

    this.add.text(30, P2_Y_MIN + 9, this.isHost ? 'OP' : 'YOU',
      { fontSize: '10px', color: '#ffffff33', fontFamily: 'monospace' });
    this.add.text(30, P1_Y_MAX + 9, this.isHost ? 'YOU' : 'OP',
      { fontSize: '10px', color: '#ffffff33', fontFamily: 'monospace' });

    // Paddles — top=opponent, bot=me (host) or top=me (guest), bot=opponent
    const topSkin = this.isHost ? this.opponentSkin : this.mySkin;
    const botSkin = this.isHost ? this.mySkin : this.opponentSkin;
    this.opPaddle = this.add.image(W / 2, this.opPy, `paddle-${topSkin}`).setDisplaySize(PADDLE_W, PADDLE_H).setOrigin(0.5);
    this.myPaddle = this.add.image(W / 2, this.myPy, `paddle-${botSkin}`).setDisplaySize(PADDLE_W, PADDLE_H).setOrigin(0.5);

    this.glowGfx  = this.add.graphics();
    this.trailGfx = this.add.graphics();
    this.ball = this.add.arc(W / 2, H / 2, BALL_R, 0, 360, false, 0xffffff);

    this.opScoreText = this.add.text(W / 2, H / 2 - 52, '0', {
      fontSize: '48px', color: '#ffffff25', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.myScoreText = this.add.text(W / 2, H / 2 + 52, '0', {
      fontSize: '48px', color: '#ffffff25', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.rallyText = this.add.text(W / 2, H / 2 + 18, '', {
      fontSize: '12px', color: '#ffffff55', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2);

    this.statusText = this.add.text(W / 2, H / 2 + 80, '연결 중...', {
      fontSize: '11px', color: '#ffffff44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(5);

    this.cdText = this.add.text(W / 2, H / 2, '', {
      fontSize: '72px', fontStyle: 'bold', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    const backBtn = this.add.text(22, 22, '✕', {
      fontSize: '22px', color: '#ffffff66', fontFamily: 'monospace',
      padding: { x: 16, y: 16 },
    }).setInteractive().setDepth(10);
    backBtn.on('pointerdown', () => this.leaveRoom());

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup',   this.onPointerUp,   this);

    this.subscribe();

    // Both start countdown at the same time — no DB event dependency for initial start
    this.time.delayedCall(500, () => {
      this.statusText.setVisible(false);
      if (this.isHost) {
        this.startCd(() => { this.isPaused = false; this.launchBall(1); });
      } else {
        this.startCd(() => { this.isPaused = false; });
      }
    });
  }

  private subscribe() {
    this.channel = sb.channel(`game_web_${this.code}`)
      .on('broadcast', { event: 'state' }, ({ payload }: { payload: Record<string, unknown> }) => {
        const sender = payload['sender'] as string | undefined;
        if (this.isHost && sender === 'guest') {
          this.opPx = (payload['px'] as number) ?? this.opPx;
          this.opPy = (payload['py'] as number) ?? this.opPy;
        } else if (!this.isHost && sender === 'host') {
          this.opPx = (payload['px'] as number) ?? this.opPx;
          this.opPy = (payload['py'] as number) ?? this.opPy;
          this.bx   = (payload['bx'] as number) ?? this.bx;
          this.by   = (payload['by'] as number) ?? this.by;
        }
      })
      .on('broadcast', { event: 'score' }, ({ payload }: { payload: Record<string, unknown> }) => {
        if (!this.isHost && !this.isOver) {
          this.handleScoreUpdate(
            (payload['hs'] as number) ?? this.opScore,
            (payload['gs'] as number) ?? this.myScore,
          );
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pong_rooms',
        filter: `code=eq.${this.code}`,
      }, (payload: { new: Record<string, unknown> }) => this.onDbUpdate(payload.new))
      .subscribe();
  }

  private handleScoreUpdate(hostScore: number, guestScore: number) {
    const newMy = guestScore;
    const newOp = hostScore;
    if (newMy === this.myScore && newOp === this.opScore) return;
    this.myScore = newMy;
    this.opScore = newOp;
    this.isPaused = true;
    this.trail = [];
    this.bx = W / 2; this.by = H / 2;
    this.myScoreText.setText(String(this.myScore));
    this.opScoreText.setText(String(this.opScore));
    if (this.myScore >= this.winScore || this.opScore >= this.winScore) {
      this.time.delayedCall(500, () => this.showResult());
    } else {
      this.time.delayedCall(300, () => {
        if (!this.isOver) {
          this.spd = BALL_SPEED_INIT;
          this.startCd(() => { this.isPaused = false; });
        }
      });
    }
  }

  private onDbUpdate(d: Record<string, unknown>) {
    // DB is backup for score sync (broadcast is primary)
    if (!this.isHost) {
      const hs = d['host_score'] as number | undefined;
      const gs = d['guest_score'] as number | undefined;
      if (hs !== undefined && gs !== undefined) this.handleScoreUpdate(hs, gs);
    }
    if (d['status'] === 'finished') this.showResult();
  }

  private pushState() {
    if (!this.channel) return;
    const payload: Record<string, unknown> = this.isHost
      ? { sender: 'host', bx: this.bx, by: this.by, px: this.myPx, py: this.myPy }
      : { sender: 'guest', px: this.myPx, py: this.myPy };
    this.channel.send({ type: 'broadcast', event: 'state', payload });
  }

  update(_time: number, delta: number) {
    this.tickCd(delta / 1000);
    if (this.isPaused || this.isOver) return;

    const dt = Math.min(delta / 1000, 0.05);
    this.myVy = (this.myPy - this.myPrevY) / dt;
    this.myPrevY = this.myPy;

    if (this.isHost) {
      const sub = dt / SUBSTEPS;
      for (let i = 0; i < SUBSTEPS; i++) {
        this.bx += this.vx * sub;
        this.by += this.vy * sub;

        if (this.bx - BALL_R <= 0)      { this.bx = BALL_R;      this.vx =  Math.abs(this.vx); }
        else if (this.bx + BALL_R >= W) { this.bx = W - BALL_R;  this.vx = -Math.abs(this.vx); }

        this.hostCollide(this.myPx, this.myPy, true);
        this.hostCollide(this.opPx, this.opPy, false);

        // Ball exits top   → guest (top) missed → host scores
        // Ball exits bottom → host (bottom) missed → guest scores
        if (this.by - BALL_R <= 0)      { this.myScore++; this.lastScorer =  1; this.onScore(); return; }
        else if (this.by + BALL_R >= H) { this.opScore++; this.lastScorer = -1; this.onScore(); return; }
      }
    }

    this.myPaddle.x = this.myPx;
    this.myPaddle.y = this.myPy;
    this.opPaddle.x = this.opPx;
    this.opPaddle.y = this.opPy;
    this.ball.x = this.bx;
    this.ball.y = this.by;
    this.rallyText.setText(this.rally > 1 ? String(this.rally) : '');

    this.updateTrail();
    this.updateBallVisuals();

    this.frameCount++;
    if (this.frameCount % SYNC_EVERY === 0) this.pushState();
  }

  private hostCollide(px: number, py: number, isBottom: boolean) {
    const xOk = this.bx + BALL_R > px - PADDLE_W / 2 && this.bx - BALL_R < px + PADDLE_W / 2;
    const yOk = this.by + BALL_R > py - PADDLE_H / 2 && this.by - BALL_R < py + PADDLE_H / 2;
    if (!xOk || !yOk) return;
    if (isBottom && this.vy <= 0) return;
    if (!isBottom && this.vy >= 0) return;

    this.by = isBottom ? py - PADDLE_H / 2 - BALL_R : py + PADDLE_H / 2 + BALL_R;
    const r = calcReflect({
      ballX: this.bx, paddleX: px,
      paddleVy: isBottom ? this.myVy : 0,
      currentSpeed: this.spd, isBottom,
      speedInc: BALL_SPEED_INC,
    });
    this.vx = r.ballVx; this.vy = r.ballVy; this.spd = r.newSpeed;
    this.lastHitSkin = isBottom ? this.mySkin : this.opponentSkin;
    this.rally++;
  }

  private launchBall(dir: number) {
    const deg = (25 + Math.floor(Math.random() * 31)) * (Math.random() < 0.5 ? 1 : -1);
    const rad = deg * Math.PI / 180;
    this.vx = Math.sin(rad) * this.spd;
    this.vy = -dir * Math.cos(rad) * this.spd;
  }

  private onScore() {
    this.isPaused = true;
    this.rally = 0;
    this.trail = [];
    this.bx = W / 2; this.by = H / 2;
    this.vx = 0; this.vy = 0;

    // Broadcast score to guest immediately (primary)
    this.channel?.send({ type: 'broadcast', event: 'score', payload: {
      hs: this.myScore,
      gs: this.opScore,
    }});
    // Also write to DB as backup
    sb.from('pong_rooms').update({
      host_score: this.myScore,
      guest_score: this.opScore,
      ...(this.myScore >= this.winScore || this.opScore >= this.winScore ? { status: 'finished' } : {}),
    }).eq('code', this.code);

    this.myScoreText.setText(String(this.myScore));
    this.opScoreText.setText(String(this.opScore));

    if (this.myScore >= this.winScore || this.opScore >= this.winScore) {
      this.time.delayedCall(500, () => this.showResult());
      return;
    }

    this.time.delayedCall(300, () => {
      this.spd = BALL_SPEED_INIT;
      this.startCd(() => { this.isPaused = false; this.launchBall(this.lastScorer); });
    });
  }

  // ── Countdown ─────────────────────────────────────────────
  private startCd(done: () => void) {
    this.cdDone = done;
    this.cdIdx  = 0;
    this.cdTimer = 0.4;
    this.cdText.setText('3').setVisible(true).setAlpha(1).setFontSize(72).setY(H / 2);
  }

  private tickCd(dt: number) {
    if (this.cdIdx < 0 || this.cdIdx >= this.cdTexts.length) return;
    this.cdTimer -= dt;
    this.cdText.setAlpha(Math.max(0, this.cdTimer / 0.4));
    if (this.cdTimer <= 0) {
      this.cdIdx++;
      if (this.cdIdx >= this.cdTexts.length) {
        this.cdIdx = -1;
        this.cdText.setVisible(false);
        this.cdDone?.();
      } else {
        const label = this.cdTexts[this.cdIdx];
        const isGo  = label === 'GO!';
        this.cdTimer = isGo ? 0.28 : 0.4;
        this.cdText.setText(label).setFontSize(isGo ? 48 : 72).setAlpha(1).setY(H / 2);
      }
    }
  }

  // ── Result overlay ─────────────────────────────────────────
  private showResult() {
    this.isOver = true;
    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(0x000000, 0.82);
    overlay.fillRect(0, 0, W, H);

    const iWon = this.myScore > this.opScore;
    this.add.text(W / 2, H / 2 - 90, iWon ? 'YOU WIN!' : 'YOU LOSE', {
      fontSize: '44px', fontStyle: 'bold', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(21);
    this.add.text(W / 2, H / 2 - 26, `${this.myScore}  :  ${this.opScore}`, {
      fontSize: '30px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(21);
    this.add.text(W / 2, H / 2 + 12, 'YOU  :  OP', {
      fontSize: '12px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(21);

    const exitBtn = this.add.text(W / 2, H / 2 + 162, '[ 나가기 ]', {
      fontSize: '16px', color: '#666666', fontFamily: 'monospace',
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setDepth(21).setInteractive();
    exitBtn.on('pointerdown', () => this.leaveRoom());
  }

  private leaveRoom() {
    this.channel?.unsubscribe();
    if (this.isHost) sb.from('pong_rooms').delete().eq('code', this.code);
    this.onBack();
  }

  // ── Input ─────────────────────────────────────────────────
  private onPointerDown(ptr: Phaser.Input.Pointer) {
    if (this.ptrId === -1) {
      this.ptrId = ptr.id;
      this.pLx = ptr.x; this.pLy = ptr.y;
    }
  }

  private onPointerMove(ptr: Phaser.Input.Pointer) {
    if (this.isOver || ptr.id !== this.ptrId) return;
    const dx = ptr.x - this.pLx;
    const dy = ptr.y - this.pLy;
    this.myPx = Math.min(Math.max(this.myPx + dx, PADDLE_W / 2), W - PADDLE_W / 2);
    this.myPy = Math.min(Math.max(this.myPy + dy, this.myYMin), this.myYMax);
    this.pLx = ptr.x; this.pLy = ptr.y;
  }

  private onPointerUp(ptr: Phaser.Input.Pointer) {
    if (ptr.id === this.ptrId) this.ptrId = -1;
  }

  // ── Visuals ────────────────────────────────────────────────
  private updateTrail() {
    this.trail.push({ x: this.bx, y: this.by });
    if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

    const color = getPalette(this.lastHitSkin).trail;
    this.trailGfx.clear();
    const len = this.trail.length;
    for (let i = 0; i < len - 1; i++) {
      const t = i / (len - 1);
      this.trailGfx.fillStyle(color, t * 0.4);
      this.trailGfx.fillCircle(this.trail[i].x, this.trail[i].y, BALL_R * (0.25 + 0.75 * t));
    }
  }

  private updateBallVisuals() {
    const t = getSpeedT(this.spd);
    const p = getPalette(this.lastHitSkin);
    this.ball.setFillStyle(p.ballColor(t));
    this.glowGfx.clear();
    this.glowGfx.fillStyle(p.glow, 0.08 + t * 0.18);
    this.glowGfx.fillCircle(this.bx, this.by, BALL_R * (1.8 + t * 1.2));
  }

  private createCourt() {
    const g = this.add.graphics();
    const bx = 22, by = 22;
    const cw = W - bx * 2, ch = H - by * 2;
    g.fillStyle(0x080d18); g.fillRect(0, 0, W, H);
    g.fillStyle(0x1a4a82); g.fillRect(bx, by, cw, ch);
    g.fillStyle(0x1e5499); g.fillRect(bx, H * 0.30, cw, H * 0.40);
    g.lineStyle(2, 0xffffff, 0.9); g.strokeRect(bx, by, cw, ch);
    g.lineStyle(2, 0xffffff, 0.7);
    [[bx, H * 0.30, bx + cw, H * 0.30], [bx, H * 0.70, bx + cw, H * 0.70],
     [W / 2, H * 0.30, W / 2, H * 0.70]].forEach(([x1, y1, x2, y2]) => {
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
    });
    g.fillStyle(0xcccccc);
    g.fillRect(bx - 5, H / 2 - 5, 5, 10);
    g.fillRect(bx + cw, H / 2 - 5, 5, 10);
    g.lineStyle(4, 0xd0d0d0);
    g.beginPath(); g.moveTo(bx, H / 2); g.lineTo(bx + cw, H / 2); g.strokePath();
    g.lineStyle(1, 0x888888, 0.5);
    for (let x = bx + 6; x < bx + cw; x += 9) {
      g.beginPath(); g.moveTo(x, H / 2 - 2); g.lineTo(x, H / 2 + 3); g.strokePath();
    }
    g.lineStyle(1, 0xffffff, 0.2);
    g.beginPath(); g.moveTo(bx, P2_Y_MIN); g.lineTo(bx + cw, P2_Y_MIN); g.strokePath();
    g.beginPath(); g.moveTo(bx, P1_Y_MAX); g.lineTo(bx + cw, P1_Y_MAX); g.strokePath();
  }

  shutdown() {
    this.channel?.unsubscribe();
    this.channel = null;
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup',   this.onPointerUp,   this);
  }
}
