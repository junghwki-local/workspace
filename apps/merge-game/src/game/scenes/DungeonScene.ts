import Phaser from "phaser";
import type { Character, EnemyData, Attribute, Grade } from "@/types";
import { calcAtk, calcDef, calcDamage, calcSkillDamage, calcHealAmount } from "@/systems/combatSystem";

const W = 800;
const H = 600;

interface SceneData {
  party: Character[];
  onComplete: (gold: number, grade: Grade) => void;
  onFail: () => void;
}

type EnemySprite = {
  sprite: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
  data: EnemyData;
  currentHp: number;
  x: number;
  y: number;
};

// 방 설정
const ROOM_CONFIGS = [
  {
    name: "던전 입구",
    bgColor: 0x0d1117,
    tileColor: 0x111827,
    tileBorder: 0x1f2937,
    accentColor: 0x374151,
    enemyName: "슬라임",
    enemyColor: 0x4ade80,
    enemyCount: 4,
    enemyHp: 40,
    enemyAtk: 6,
    enemyDef: 1,
    goldDrop: 25,
    isBoss: false,
  },
  {
    name: "어둠의 회랑",
    bgColor: 0x0a0d1a,
    tileColor: 0x0f172a,
    tileBorder: 0x1e3a5f,
    accentColor: 0x1e40af,
    enemyName: "고블린",
    enemyColor: 0xfbbf24,
    enemyCount: 5,
    enemyHp: 70,
    enemyAtk: 10,
    enemyDef: 3,
    goldDrop: 40,
    isBoss: false,
  },
  {
    name: "보스 방",
    bgColor: 0x0d0005,
    tileColor: 0x1a0010,
    tileBorder: 0x7f1d1d,
    accentColor: 0xef4444,
    enemyName: "던전 보스",
    enemyColor: 0xef4444,
    enemyCount: 1,
    enemyHp: 300,
    enemyAtk: 25,
    enemyDef: 10,
    goldDrop: 200,
    isBoss: true,
  },
] as const;

export class DungeonScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private companions: Phaser.GameObjects.Rectangle[] = [];
  private enemies: EnemySprite[] = [];
  private joystick!: { base: Phaser.GameObjects.Arc; thumb: Phaser.GameObjects.Arc };
  private joystickActive = false;
  private joystickPointerid = -1;
  private joystickOrigin = { x: 0, y: 0 };
  private moveDir = { x: 0, y: 0 };
  private skillBtn!: Phaser.GameObjects.Arc;
  private skillCooldown = 0;
  private SKILL_CD = 3000;
  private autoAttackTimer = 0;
  private AUTO_ATTACK_RATE = 800;
  private partyData: Character[] = [];
  private playerData!: Character;
  private playerHp = 0;
  private playerMaxHp = 0;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private goldText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private skillCdText!: Phaser.GameObjects.Text;
  private currentGold = 0;
  private room = 0;
  private totalRooms = 3;
  private onComplete!: (gold: number, grade: Grade) => void;
  private onFail!: () => void;
  private isCompleted = false;
  private roomCleared = false;
  private healerTimer = 0;

  // 방 배경 오브젝트 (방 전환 시 재생성)
  private bgRect!: Phaser.GameObjects.Rectangle;
  private tiles: Phaser.GameObjects.Rectangle[] = [];
  private roomNameText!: Phaser.GameObjects.Text;

  // 출구 문
  private exitDoor: Phaser.GameObjects.Container | null = null;
  private exitActive = false;
  private enemiesSpawned = false;

  // UI 레이어 (항상 최상단)
  private uiContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "DungeonScene" });
  }

  init(data: SceneData) {
    this.partyData = data.party;
    this.playerData = data.party.find((c) => c.isPlayer) ?? data.party[0];
    this.playerHp = this.playerData.hp;
    this.playerMaxHp = this.playerData.maxHp;
    this.onComplete = data.onComplete;
    this.onFail = data.onFail;
    this.currentGold = 0;
    this.room = 0;
    this.isCompleted = false;
    this.roomCleared = false;
  }

  create() {
    // 배경 (나중에 방 전환 시 색상 바꿈)
    this.bgRect = this.add.rectangle(W / 2, H / 2, W, H, 0x0d1117);
    this.tiles = [];
    this.buildTiles(ROOM_CONFIGS[0].tileColor, ROOM_CONFIGS[0].tileBorder);

    // 플레이어
    this.player = this.add.rectangle(W / 2, H / 2, 28, 28, 0x3b82f6).setStrokeStyle(2, 0x93c5fd);

    // 동료들
    const companionColors = [0x22c55e, 0xf59e0b];
    this.companions = this.partyData
      .filter((c) => !c.isPlayer)
      .map((_, i) =>
        this.add
          .rectangle(this.player.x - 40 - i * 30, this.player.y + 20 + i * 15, 22, 22, companionColors[i])
          .setStrokeStyle(1, 0xffffff)
      );

    // UI 컨테이너 (항상 최상단)
    this.uiContainer = this.add.container(0, 0).setDepth(50);

    // HP 바
    const hpBgW = 240;
    const hpBg = this.add.rectangle(W / 2, H - 100, hpBgW, 16, 0x374151).setOrigin(0.5);
    this.hpBarFill = this.add.rectangle(W / 2 - hpBgW / 2, H - 100, hpBgW, 16, 0xef4444).setOrigin(0, 0.5);
    const hpLabel = this.add.text(W / 2, H - 120, "HP", { fontSize: "12px", color: "#9ca3af" }).setOrigin(0.5);
    this.uiContainer.add([hpBg, this.hpBarFill, hpLabel]);

    // 조이스틱
    const jx = 100, jy = H - 100;
    const jBase = this.add.arc(jx, jy, 60, 0, 360, false, 0x1f2937).setAlpha(0.6).setStrokeStyle(2, 0x374151);
    const jThumb = this.add.arc(jx, jy, 28, 0, 360, false, 0x3b82f6).setAlpha(0.85);
    this.joystick = { base: jBase, thumb: jThumb };
    this.uiContainer.add([jBase, jThumb]);

    // 스킬 버튼
    this.skillBtn = this.add.arc(W - 90, H - 100, 50, 0, 360, false, 0x8b5cf6)
      .setAlpha(0.85).setStrokeStyle(2, 0xa78bfa).setInteractive();
    const skillIcon = this.add.text(W - 90, H - 100, "⚡", { fontSize: "28px" }).setOrigin(0.5);
    this.skillCdText = this.add.text(W - 90, H - 58, "READY", { fontSize: "11px", color: "#a78bfa" }).setOrigin(0.5);
    this.uiContainer.add([this.skillBtn, skillIcon, this.skillCdText]);

    // 골드 / 방 텍스트
    this.goldText = this.add.text(12, 12, "💰 0 G", { fontSize: "16px", color: "#f59e0b", fontStyle: "bold" });
    this.roomText = this.add.text(W / 2, 16, "", { fontSize: "16px", color: "#ffffff" }).setOrigin(0.5);
    this.roomNameText = this.add.text(W / 2, 40, "", { fontSize: "11px", color: "#6b7280" }).setOrigin(0.5);
    this.uiContainer.add([this.goldText, this.roomText, this.roomNameText]);

    // 입력
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
    this.skillBtn.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.useSkill();
    });
    this.input.keyboard?.addKey("ESC")?.on("down", () => this.scene.stop());

    // 첫 방 시작
    this.time.delayedCall(400, () => this.enterRoom(0));
  }

  private buildTiles(tileColor: number, borderColor: number) {
    this.tiles.forEach((t) => t.destroy());
    this.tiles = [];
    for (let x = 0; x < W; x += 60) {
      for (let y = 0; y < H - 120; y += 60) {
        const t = this.add.rectangle(x + 30, y + 30, 58, 58, tileColor).setStrokeStyle(1, borderColor);
        this.tiles.push(t);
      }
    }
    // 플레이어/동료보다 뒤로
    this.tiles.forEach((t) => t.setDepth(-1));
    this.bgRect.setDepth(-2);
  }

  private enterRoom(roomIndex: number) {
    this.room = roomIndex + 1;
    this.roomCleared = false;
    const cfg = ROOM_CONFIGS[roomIndex];

    // 배경 색상 전환
    this.tweens.add({
      targets: this.bgRect,
      fillColor: cfg.bgColor,
      duration: 400,
    });
    this.buildTiles(cfg.tileColor, cfg.tileBorder);

    // 텍스트 업데이트
    this.roomText.setText(`ROOM ${this.room}/${this.totalRooms}${cfg.isBoss ? " 👑" : ""}`);
    this.roomNameText.setText(cfg.name);

    // 방 이름 플래시
    const flash = this.add.text(W / 2, H / 2, cfg.name, {
      fontSize: "28px", color: "#ffffff", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: flash, alpha: 1, duration: 300, yoyo: true, hold: 800, onComplete: () => flash.destroy() });

    // 플레이어 왼쪽에서 입장
    this.player.setPosition(60, (H - 120) / 2);
    this.companions.forEach((c, i) => {
      c.setPosition(this.player.x - 40 - i * 30, this.player.y + 20 + i * 15);
    });

    // 적 스폰
    this.enemiesSpawned = false;
    this.time.delayedCall(800, () => this.spawnRoom(roomIndex));
  }

  private spawnRoom(roomIndex: number) {
    this.enemiesSpawned = true;
    const cfg = ROOM_CONFIGS[roomIndex];
    if (cfg.isBoss) {
      // 보스 + 미니언 2마리
      this.spawnEnemy(W / 2, 140, cfg.enemyHp, {
        id: "boss",
        name: cfg.enemyName,
        type: "boss",
        hp: cfg.enemyHp, atk: cfg.enemyAtk, def: cfg.enemyDef,
        weakAttribute: this.randomAttr(),
        goldDrop: cfg.goldDrop,
        dropGrade: 2,
      }, cfg.enemyColor);
      // 미니언
      for (let i = 0; i < 2; i++) {
        const mx = W / 2 + (i === 0 ? -120 : 120);
        this.spawnEnemy(mx, 180, 60, {
          id: `minion_${i}`,
          name: "부하",
          type: "normal",
          hp: 60, atk: 10, def: 3,
          weakAttribute: this.randomAttr(),
          goldDrop: 30,
          dropGrade: 1,
        }, 0xff6b6b);
      }
    } else {
      for (let i = 0; i < cfg.enemyCount; i++) {
        const x = Phaser.Math.Between(80, W - 80);
        const y = Phaser.Math.Between(40, H - 160);
        this.spawnEnemy(x, y, cfg.enemyHp, {
          id: `enemy_${i}`,
          name: cfg.enemyName,
          type: "normal",
          hp: cfg.enemyHp, atk: cfg.enemyAtk, def: cfg.enemyDef,
          weakAttribute: this.randomAttr(),
          goldDrop: cfg.goldDrop,
          dropGrade: 1,
        }, cfg.enemyColor);
      }
    }
  }

  update(_time: number, delta: number) {
    if (this.isCompleted) return;

    // 방 전환 중이 아닐 때만 이동/전투
    this.movePlayer(delta);
    this.updateCompanions();

    if (!this.roomCleared) {
      // 스킬 쿨다운
      if (this.skillCooldown > 0) {
        this.skillCooldown -= delta;
        this.skillCdText.setText(this.skillCooldown > 0 ? `${(this.skillCooldown / 1000).toFixed(1)}s` : "READY");
        this.skillBtn.setFillStyle(this.skillCooldown > 0 ? 0x4c1d95 : 0x8b5cf6);
      }

      // 자동 공격
      this.autoAttackTimer -= delta;
      if (this.autoAttackTimer <= 0 && this.enemies.length > 0) {
        this.autoAttack();
        this.autoAttackTimer = this.AUTO_ATTACK_RATE;
      }

      // 힐러 회복
      this.healerTimer -= delta;
      if (this.healerTimer <= 0) {
        this.doHealerHeal();
        this.healerTimer = 3000;
      }

      this.updateEnemies(delta);

      // 방 클리어 체크 (적이 스폰된 이후에만)
      if (this.enemiesSpawned && this.enemies.length === 0) {
        this.onRoomCleared();
      }
    }

    // 출구 충돌 (roomCleared 이후에도 이동 가능해야 함)
    this.checkExitCollision();

    // HP 바
    const pct = Math.max(0, this.playerHp / this.playerMaxHp);
    this.hpBarFill.setScale(pct, 1);
    this.hpBarFill.setFillStyle(pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xf59e0b : 0xef4444);
  }

  private onRoomCleared() {
    this.roomCleared = true;

    if (this.room >= this.totalRooms) {
      this.time.delayedCall(500, () => this.completeRun());
      return;
    }

    // 출구 문 생성 (오른쪽 벽)
    this.time.delayedCall(300, () => this.showExitDoor());
  }

  private showExitDoor() {
    const doorX = W - 2;
    const doorY = (H - 120) / 2;
    const doorW = 14;
    const doorH = 80;

    const doorBg = this.add.rectangle(0, 0, doorW, doorH, 0x22c55e, 0.9).setStrokeStyle(2, 0x86efac);
    const arrow = this.add.text(0, 0, "▶", { fontSize: "16px", color: "#ffffff" }).setOrigin(0.5);
    const label = this.add.text(0, doorH / 2 + 14, "NEXT", { fontSize: "10px", color: "#22c55e" }).setOrigin(0.5);

    this.exitDoor = this.add.container(doorX, doorY, [doorBg, arrow, label]).setDepth(8);
    this.exitActive = true;

    // 문 깜빡임
    this.tweens.add({
      targets: this.exitDoor,
      alpha: { from: 1, to: 0.5 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // 안내 텍스트
    const hint = this.add.text(W / 2, H / 2 - 50, "→ 오른쪽 출구로 이동하세요", {
      fontSize: "14px", color: "#22c55e",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 300 });
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 400, onComplete: () => hint.destroy() });
    });
  }

  private checkExitCollision() {
    if (!this.exitActive || !this.exitDoor) return;
    // 플레이어가 오른쪽 가장자리(W-30)에 도달하면 입장
    if (this.player.x >= W - 30) {
      this.exitActive = false;
      this.exitDoor.destroy();
      this.exitDoor = null;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.enterRoom(this.room); // this.room(1-based) = 다음 방의 0-based 인덱스
        this.cameras.main.fadeIn(400, 0, 0, 0);
      });
    }
  }

  private movePlayer(delta: number) {
    const speed = 180 * (delta / 1000);
    let dx = this.moveDir.x * speed;
    let dy = this.moveDir.y * speed;

    const keys = this.input.keyboard;
    if (keys) {
      if (keys.addKey("W").isDown || keys.addKey("UP").isDown) dy -= speed;
      if (keys.addKey("S").isDown || keys.addKey("DOWN").isDown) dy += speed;
      if (keys.addKey("A").isDown || keys.addKey("LEFT").isDown) dx -= speed;
      if (keys.addKey("D").isDown || keys.addKey("RIGHT").isDown) dx += speed;
    }

    const maxX = this.exitActive ? W : W - 20;
    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 20, maxX);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 20, H - 130);
  }

  private updateCompanions() {
    this.companions.forEach((c, i) => {
      const tx = this.player.x - 45 - i * 28;
      const ty = this.player.y + 20 + i * 12;
      c.x += (tx - c.x) * 0.12;
      c.y += (ty - c.y) * 0.12;
    });
  }

  private spawnEnemy(x: number, y: number, hp: number, data: EnemyData, color: number) {
    const isBoss = data.type === "boss";
    const size = isBoss ? 52 : 28;

    const hpBarBg = this.add.rectangle(x, y - size / 2 - 8, size + 20, 6, 0x374151);
    const hpBar = this.add.rectangle(x - (size + 20) / 2, y - size / 2 - 8, size + 20, 6, 0xef4444).setOrigin(0, 0.5);
    const sprite = this.add.rectangle(x, y, size, size, color).setStrokeStyle(2, 0xffffff);
    const label = this.add.text(x, y + size / 2 + 6, data.name, {
      fontSize: isBoss ? "12px" : "9px", color: "#ffffff",
    }).setOrigin(0.5);

    this.enemies.push({ sprite, label, hpBar, hpBarBg, data, currentHp: hp, x, y });
  }

  private autoAttack() {
    if (this.enemies.length === 0) return;
    const nearest = this.getNearestEnemy();
    if (!nearest) return;

    const dmg = calcDamage(this.playerData, nearest.data.def, nearest.data.weakAttribute);
    this.dealDamage(nearest, dmg);
    this.showDamageText(nearest.x, nearest.y, dmg, false);

    const archer = this.partyData.find((c) => !c.isPlayer && c.job === "archer");
    if (archer) {
      const archerDmg = Math.floor(calcAtk(archer) * 0.7);
      this.dealDamage(nearest, archerDmg);
    }
  }

  private useSkill() {
    if (this.skillCooldown > 0) return;
    const nearest = this.getNearestEnemy();
    if (!nearest) return;

    const dmg = calcSkillDamage(this.playerData, nearest.data.def, nearest.data.weakAttribute);
    this.dealDamage(nearest, dmg);
    this.showDamageText(nearest.x, nearest.y, dmg, true);
    this.skillCooldown = this.SKILL_CD;

    const flash = this.add.arc(nearest.x, nearest.y, 40, 0, 360, false, 0xffffff).setAlpha(0.5);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 300, onComplete: () => flash.destroy() });
  }

  private dealDamage(enemy: EnemySprite, dmg: number) {
    enemy.currentHp = Math.max(0, enemy.currentHp - dmg);
    const pct = enemy.currentHp / enemy.data.hp;
    enemy.hpBar.setScale(pct, 1);
    if (enemy.currentHp <= 0) {
      this.currentGold += enemy.data.goldDrop;
      this.goldText.setText(`💰 ${this.currentGold} G`);
      this.removeEnemy(enemy);
    }
  }

  private removeEnemy(enemy: EnemySprite) {
    enemy.sprite.destroy();
    enemy.label.destroy();
    enemy.hpBar.destroy();
    enemy.hpBarBg.destroy();
    this.enemies = this.enemies.filter((e) => e !== enemy);
  }

  private doHealerHeal() {
    const healer = this.partyData.find((c) => !c.isPlayer && c.job === "healer");
    if (!healer) return;
    const heal = calcHealAmount(healer);
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
    this.showHealText(this.player.x, this.player.y, heal);
  }

  private updateEnemies(delta: number) {
    for (const enemy of [...this.enemies]) {
      const speed = (enemy.data.type === "boss" ? 50 : 80) * (delta / 1000);
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 30) {
        enemy.x += (dx / dist) * speed;
        enemy.y += (dy / dist) * speed;
        enemy.sprite.setPosition(enemy.x, enemy.y);
        enemy.label.setPosition(enemy.x, enemy.y + enemy.sprite.height / 2 + 6);
        const sprH = enemy.sprite.height;
        enemy.hpBarBg.setPosition(enemy.x, enemy.y - sprH / 2 - 8);
        enemy.hpBar.setPosition(enemy.x - (sprH + 20) / 2, enemy.y - sprH / 2 - 8);
      } else {
        if (Math.random() < 0.03) {
          const dmg = Math.max(1, enemy.data.atk - calcDef(this.playerData));
          this.playerHp -= dmg;
          this.cameras.main.shake(100, 0.008);
          if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.failRun();
            return;
          }
        }
      }
    }
  }

  private getNearestEnemy(): EnemySprite | null {
    if (this.enemies.length === 0) return null;
    return this.enemies.reduce((nearest, e) => {
      const d1 = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      const d2 = Phaser.Math.Distance.Between(this.player.x, this.player.y, nearest.x, nearest.y);
      return d1 < d2 ? e : nearest;
    });
  }

  private showDamageText(x: number, y: number, dmg: number, isSkill: boolean) {
    const t = this.add
      .text(x, y - 20, isSkill ? `💥${dmg}!` : `${dmg}`, {
        fontSize: isSkill ? "16px" : "12px",
        color: isSkill ? "#f59e0b" : "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.tweens.add({ targets: t, y: y - 55, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  private showHealText(x: number, y: number, amount: number) {
    const t = this.add.text(x + 20, y - 10, `+${amount}`, { fontSize: "11px", color: "#22c55e" }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  private completeRun() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    const grade: Grade = 3 as Grade;

    this.add.rectangle(W / 2, H / 2, 320, 180, 0x111827).setStrokeStyle(2, 0x22c55e).setDepth(20);
    this.add.text(W / 2, H / 2 - 50, "🎉 던전 클리어!", { fontSize: "24px", color: "#22c55e", fontStyle: "bold" }).setOrigin(0.5).setDepth(21);
    this.add.text(W / 2, H / 2 - 10, `획득 골드: ${this.currentGold} G`, { fontSize: "18px", color: "#f59e0b" }).setOrigin(0.5).setDepth(21);
    this.add.text(W / 2, H / 2 + 30, "탭하여 돌아가기", { fontSize: "13px", color: "#9ca3af" }).setOrigin(0.5).setDepth(21);

    this.input.once("pointerdown", () => this.onComplete(this.currentGold, grade));
  }

  private failRun() {
    if (this.isCompleted) return;
    this.isCompleted = true;

    this.add.rectangle(W / 2, H / 2, 280, 140, 0x111827).setStrokeStyle(2, 0xef4444).setDepth(20);
    this.add.text(W / 2, H / 2 - 30, "💀 파티 전멸", { fontSize: "22px", color: "#ef4444", fontStyle: "bold" }).setOrigin(0.5).setDepth(21);
    this.add.text(W / 2, H / 2 + 10, "탭하여 돌아가기", { fontSize: "13px", color: "#9ca3af" }).setOrigin(0.5).setDepth(21);

    this.input.once("pointerdown", () => this.onFail());
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    if (p.x < W / 2 && !this.joystickActive) {
      this.joystickActive = true;
      this.joystickPointerid = p.id;
      this.joystickOrigin = { x: p.x, y: p.y };
      this.joystick.base.setPosition(p.x, p.y);
      this.joystick.thumb.setPosition(p.x, p.y);
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer) {
    if (!this.joystickActive || p.id !== this.joystickPointerid) return;
    const dx = p.x - this.joystickOrigin.x;
    const dy = p.y - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 40;
    const clamped = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    this.joystick.thumb.setPosition(
      this.joystickOrigin.x + Math.cos(angle) * clamped,
      this.joystickOrigin.y + Math.sin(angle) * clamped
    );
    this.moveDir = dist < 5 ? { x: 0, y: 0 } : { x: Math.cos(angle), y: Math.sin(angle) };
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    if (p.id === this.joystickPointerid) {
      this.joystickActive = false;
      this.joystickPointerid = -1;
      this.moveDir = { x: 0, y: 0 };
      this.joystick.thumb.setPosition(this.joystick.base.x, this.joystick.base.y);
    }
  }

  private randomAttr(): Attribute {
    const attrs: Attribute[] = ["fire", "water", "wind", "earth", "light", "dark"];
    return attrs[Math.floor(Math.random() * attrs.length)];
  }
}
