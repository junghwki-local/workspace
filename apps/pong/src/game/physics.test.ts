import { describe, it, expect } from "vitest";
import {
  W, BALL_R, BALL_SPEED_INIT, BALL_SPEED_MAX,
  getSpeedT,
  checkAABB,
  predictBallX,
  calcReflect,
} from "./physics";

// ── getSpeedT ─────────────────────────────────────────────
describe("getSpeedT", () => {
  it("최저속(BALL_SPEED_INIT)이면 0 반환", () => {
    expect(getSpeedT(BALL_SPEED_INIT)).toBe(0);
  });

  it("최고속(BALL_SPEED_MAX)이면 1 반환", () => {
    expect(getSpeedT(BALL_SPEED_MAX)).toBe(1);
  });

  it("중간 속도는 0~1 사이", () => {
    const t = getSpeedT((BALL_SPEED_INIT + BALL_SPEED_MAX) / 2);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
  });

  it("범위 초과값은 클램프됨", () => {
    expect(getSpeedT(0)).toBe(0);
    expect(getSpeedT(9999)).toBe(1);
  });
});

// ── checkAABB ─────────────────────────────────────────────
describe("checkAABB", () => {
  const paddle = { x: 225, y: 100, w: 110, h: 14 };

  it("완전 겹침 시 xOverlap, yOverlap 모두 true", () => {
    const ball = { x: 225, y: 100, r: BALL_R };
    const { xOverlap, yOverlap } = checkAABB(ball, paddle);
    expect(xOverlap).toBe(true);
    expect(yOverlap).toBe(true);
  });

  it("X축만 겹치고 Y축 완전 벗어난 경우", () => {
    const ball = { x: 225, y: 200, r: BALL_R };
    const { xOverlap, yOverlap } = checkAABB(ball, paddle);
    expect(xOverlap).toBe(true);
    expect(yOverlap).toBe(false);
  });

  it("Y축만 겹치고 X축 완전 벗어난 경우", () => {
    const ball = { x: 0, y: 100, r: BALL_R };
    const { xOverlap, yOverlap } = checkAABB(ball, paddle);
    expect(xOverlap).toBe(false);
    expect(yOverlap).toBe(true);
  });

  it("경계 접촉(공이 패들 왼쪽 바로 옆) — 겹침 없음", () => {
    // paddle left = 225 - 55 = 170, ball right = x + r
    const ball = { x: 170 - BALL_R, y: 100, r: BALL_R }; // ball.x + r = 170, 경계 미포함
    const { xOverlap } = checkAABB(ball, paddle);
    expect(xOverlap).toBe(false);
  });

  it("공이 패들 표면에 딱 닿는 경우 — 겹침 있음", () => {
    // paddle top = 100 - 7 = 93, ball bottom = y + r
    const ball = { x: 225, y: 93 - BALL_R + 1, r: BALL_R };
    const { yOverlap } = checkAABB(ball, paddle);
    expect(yOverlap).toBe(true);
  });
});

// ── predictBallX ─────────────────────────────────────────
describe("predictBallX", () => {
  it("ballVy >= 0이면 fallbackX 반환 (AI 방향으로 오지 않음)", () => {
    const result = predictBallX({
      ballX: 200, ballY: 400, ballVx: 100, ballVy: 0,
      targetY: 120, fallbackX: 999,
    });
    expect(result).toBe(999);
  });

  it("벽 반사 없이 직진 시 예측값이 도착 X와 일치", () => {
    // ball at (200, 400), vx=0, vy=-400 → target=0 → 1초 후 → x=200
    const result = predictBallX({
      ballX: 200, ballY: 400, ballVx: 0, ballVy: -400,
      targetY: 0, fallbackX: 0,
    });
    expect(result).toBeCloseTo(200, 1);
  });

  it("오른쪽 벽 한 번 반사 후 예측", () => {
    // ball at (400, 400), vx=400, vy=-400, target=0
    // time to target = 400/400 = 1s
    // x without walls = 400 + 400*1 = 800 → 벽(W-BALL_R=440)에서 반사
    // fold 계산으로 예측값이 BALL_R~W-BALL_R 범위 안에 있어야 함
    const result = predictBallX({
      ballX: 400, ballY: 400, ballVx: 400, ballVy: -400,
      targetY: 0, fallbackX: 0,
    });
    expect(result).toBeGreaterThanOrEqual(BALL_R);
    expect(result).toBeLessThanOrEqual(W - BALL_R);
  });

  it("결과는 항상 유효 범위(BALL_R ~ W-BALL_R) 안에 있음", () => {
    const cases = [
      { ballX: 50,  ballY: 400, ballVx: -300, ballVy: -500, targetY: 80 },
      { ballX: 225, ballY: 600, ballVx: 600,  ballVy: -200, targetY: 120 },
      { ballX: 10,  ballY: 300, ballVx: -100, ballVy: -800, targetY: 100 },
    ];
    for (const c of cases) {
      const result = predictBallX({ ...c, fallbackX: 0 });
      expect(result).toBeGreaterThanOrEqual(BALL_R);
      expect(result).toBeLessThanOrEqual(W - BALL_R);
    }
  });
});

// ── calcReflect ───────────────────────────────────────────
describe("calcReflect", () => {
  const base = {
    ballX: 225, paddleX: 225,
    paddleVy: 0, currentSpeed: BALL_SPEED_INIT,
    isBottom: true, speedInc: 12,
  };

  it("중앙 히트 시 X방향 없이 수직 반사", () => {
    const { ballVx, ballVy } = calcReflect(base);
    expect(ballVx).toBeCloseTo(0, 3);
    expect(ballVy).toBeLessThan(0); // isBottom → 위 방향
  });

  it("반사 후 속도가 MIN(200) ~ MAX(780) 범위", () => {
    const { newSpeed } = calcReflect(base);
    expect(newSpeed).toBeGreaterThanOrEqual(200);
    expect(newSpeed).toBeLessThanOrEqual(BALL_SPEED_MAX);
  });

  it("빠르게 전진하는 패들은 속도 보너스를 줌", () => {
    // isBottom=true, dirY=-1, paddleVy가 음수(위로 이동)면 forwardVy = paddleVy * -1 > 0
    const fast  = calcReflect({ ...base, paddleVy: -400 });
    const slow  = calcReflect({ ...base, paddleVy: 0 });
    expect(fast.newSpeed).toBeGreaterThan(slow.newSpeed);
  });

  it("최고속 이상으로 올라가지 않음 (클램프)", () => {
    const { newSpeed } = calcReflect({
      ...base, currentSpeed: BALL_SPEED_MAX, paddleVy: -9999,
    });
    expect(newSpeed).toBe(BALL_SPEED_MAX);
  });

  it("최소 수직 속도(28%) 보장 — 극단 각도에서도 vy가 충분함", () => {
    // 히트 위치 -1(가장 왼쪽) → angleDeg = -60 → sin 크고 cos 작음
    const { ballVy, newSpeed } = calcReflect({ ...base, ballX: 225 - 55, paddleX: 225 });
    const minVy = newSpeed * 0.28;
    expect(Math.abs(ballVy)).toBeGreaterThanOrEqual(minVy - 0.001);
  });

  it("isBottom=false(상단 패들)이면 ballVy > 0 (아래 방향)", () => {
    const { ballVy } = calcReflect({ ...base, isBottom: false });
    expect(ballVy).toBeGreaterThan(0);
  });
});
