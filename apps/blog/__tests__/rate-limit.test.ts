import { describe, it, expect, beforeEach, vi } from "vitest";

// 매 테스트마다 모듈 초기화 (store Map 리셋)
beforeEach(() => {
  vi.resetModules();
});

describe("rateLimit", () => {
  it("첫 요청은 항상 성공한다", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const result = rateLimit("test-key-1", { limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("limit 초과 시 실패한다", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-2";
    for (let i = 0; i < 3; i++) {
      rateLimit(key, { limit: 3, windowMs: 60_000 });
    }
    const result = rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("윈도우 만료 후 카운트가 초기화된다", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = "test-key-3";

    vi.setSystemTime(Date.now());
    rateLimit(key, { limit: 1, windowMs: 1000 });
    const blocked = rateLimit(key, { limit: 1, windowMs: 1000 });
    expect(blocked.success).toBe(false);

    // 윈도우 만료
    vi.setSystemTime(Date.now() + 1001);
    const reset = rateLimit(key, { limit: 1, windowMs: 1000 });
    expect(reset.success).toBe(true);

    vi.useRealTimers();
  });
});

describe("getIP", () => {
  it("x-forwarded-for 헤더에서 IP를 추출한다", async () => {
    const { getIP } = await import("@/lib/rate-limit");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getIP(req)).toBe("1.2.3.4");
  });

  it("헤더 없으면 unknown을 반환한다", async () => {
    const { getIP } = await import("@/lib/rate-limit");
    const req = new Request("http://localhost");
    expect(getIP(req)).toBe("unknown");
  });
});
