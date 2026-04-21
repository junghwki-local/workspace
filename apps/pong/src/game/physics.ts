/**
 * PongScene에서 Phaser에 의존하지 않는 순수 물리/수학 로직.
 * 테스트 가능하도록 별도 모듈로 분리.
 */

// ── 상수 (PongScene과 동기화) ──────────────────────────────
export const W           = 450;
export const H           = 800;
export const PADDLE_W    = 110;
export const PADDLE_H    = 14;
export const BALL_R      = 10;
export const BALL_SPEED_INIT = 360;
export const BALL_SPEED_MAX  = 780;

// ── 공 속도 t (0=최저속 / 1=최고속) ─────────────────────────
export function getSpeedT(ballSpeed: number): number {
  const t = (ballSpeed - BALL_SPEED_INIT) / (BALL_SPEED_MAX - BALL_SPEED_INIT);
  return Math.max(0, Math.min(1, t));
}

// ── AABB 충돌 감지 ─────────────────────────────────────────
export interface Rect {
  x: number; // center
  y: number; // center
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/**
 * 원과 AABB 사각형의 겹침 여부를 반환한다.
 * xOverlap, yOverlap 둘 다 true일 때 충돌.
 */
export function checkAABB(ball: Circle, rect: Rect): { xOverlap: boolean; yOverlap: boolean } {
  const left  = rect.x - rect.w / 2;
  const right = rect.x + rect.w / 2;
  const top   = rect.y - rect.h / 2;
  const bot   = rect.y + rect.h / 2;

  return {
    xOverlap: ball.x + ball.r > left  && ball.x - ball.r < right,
    yOverlap: ball.y + ball.r > top   && ball.y - ball.r < bot,
  };
}

// ── AI 착지 예측 (벽 반사 포함 해석적 계산) ─────────────────
/**
 * 공이 targetY에 도달할 때의 X 좌표를 예측한다.
 * 공이 AI 방향으로 오지 않을 때(ballVy >= 0)는 fallbackX를 반환.
 */
export function predictBallX(params: {
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  targetY: number;
  fallbackX: number;
}): number {
  const { ballX, ballY, ballVx, ballVy, targetY, fallbackX } = params;

  if (ballVy >= 0) return fallbackX;

  const timeToTarget = (ballY - targetY) / Math.abs(ballVy);
  let finalX = ballX + ballVx * timeToTarget;

  const lo    = BALL_R;
  const hi    = W - BALL_R;
  const range = hi - lo;

  finalX -= lo;
  finalX = ((finalX % (2 * range)) + 2 * range) % (2 * range);
  if (finalX > range) finalX = 2 * range - finalX;
  finalX += lo;

  return finalX;
}

// ── 반사 후 속도 계산 ─────────────────────────────────────
export interface ReflectResult {
  ballVx: number;
  ballVy: number;
  newSpeed: number;
}

export function calcReflect(params: {
  ballX: number;
  paddleX: number;
  paddleVy: number;
  currentSpeed: number;
  isBottom: boolean;
  speedInc: number;
}): ReflectResult {
  const { ballX, paddleX, paddleVy, currentSpeed, isBottom, speedInc } = params;

  const hitPos     = Math.max(-1, Math.min(1, (ballX - paddleX) / (PADDLE_W / 2)));
  const angleDeg   = hitPos * 60;
  const rad        = angleDeg * (Math.PI / 180);
  const dirY       = isBottom ? -1 : 1;

  const forwardVy  = paddleVy * dirY;
  const speedBonus = Math.max(-50, Math.min(120, forwardVy * 0.25));
  const newSpeed   = Math.max(200, Math.min(BALL_SPEED_MAX, currentSpeed + speedInc + speedBonus));

  let ballVx = Math.sin(rad) * newSpeed;
  let ballVy = dirY * Math.cos(rad) * newSpeed;

  const minVy = newSpeed * 0.28;
  if (Math.abs(ballVy) < minVy) ballVy = dirY * minVy;

  return { ballVx, ballVy, newSpeed };
}
