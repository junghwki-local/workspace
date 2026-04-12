import { describe, it, expect } from "vitest";
import { canMerge, merge, calcStatBonus } from "@/systems/mergeSystem";
import type { Equipment } from "@/types";

function makeItem(overrides: Partial<Equipment> = {}): Equipment {
  return {
    id: "test_1",
    type: "weapon",
    grade: 1,
    attribute: "none",
    name: "검",
    statBonus: 10,
    ...overrides,
  };
}

describe("canMerge", () => {
  it("같은 타입·등급 무기는 합성 가능", () => {
    const a = makeItem({ id: "a" });
    const b = makeItem({ id: "b" });
    expect(canMerge(a, b)).toBe(true);
  });

  it("같은 아이템(같은 id)은 합성 불가", () => {
    const a = makeItem({ id: "same" });
    const b = makeItem({ id: "same" });
    expect(canMerge(a, b)).toBe(false);
  });

  it("타입이 다르면 합성 불가", () => {
    const a = makeItem({ id: "a", type: "weapon" });
    const b = makeItem({ id: "b", type: "armor" });
    expect(canMerge(a, b)).toBe(false);
  });

  it("등급이 다르면 합성 불가", () => {
    const a = makeItem({ id: "a", grade: 1 });
    const b = makeItem({ id: "b", grade: 2 });
    expect(canMerge(a, b)).toBe(false);
  });

  it("5등급 장비는 합성 불가 (최고 등급)", () => {
    const a = makeItem({ id: "a", grade: 5 });
    const b = makeItem({ id: "b", grade: 5 });
    expect(canMerge(a, b)).toBe(false);
  });

  it("장신구: 같은 속성이면 합성 가능", () => {
    const a = makeItem({ id: "a", type: "ring", attribute: "fire" });
    const b = makeItem({ id: "b", type: "ring", attribute: "fire" });
    expect(canMerge(a, b)).toBe(true);
  });

  it("장신구: 다른 속성이면 합성 불가", () => {
    const a = makeItem({ id: "a", type: "ring", attribute: "fire" });
    const b = makeItem({ id: "b", type: "ring", attribute: "water" });
    expect(canMerge(a, b)).toBe(false);
  });

  it("무기는 속성에 상관없이 합성 가능 (항상 none)", () => {
    const a = makeItem({ id: "a", type: "weapon", attribute: "none" });
    const b = makeItem({ id: "b", type: "weapon", attribute: "none" });
    expect(canMerge(a, b)).toBe(true);
  });
});

describe("merge", () => {
  it("합성 결과는 한 등급 위여야 함", () => {
    const a = makeItem({ id: "a", grade: 1 });
    const b = makeItem({ id: "b", grade: 1 });
    const result = merge(a, b);
    expect(result.grade).toBe(2);
  });

  it("무기 합성 결과는 무속성이어야 함", () => {
    const a = makeItem({ id: "a", type: "weapon", attribute: "none" });
    const b = makeItem({ id: "b", type: "weapon", attribute: "none" });
    const result = merge(a, b);
    expect(result.attribute).toBe("none");
  });

  it("장신구 합성 결과는 속성 유지", () => {
    const a = makeItem({ id: "a", type: "ring", attribute: "fire" });
    const b = makeItem({ id: "b", type: "ring", attribute: "fire" });
    const result = merge(a, b);
    expect(result.attribute).toBe("fire");
  });

  it("합성 결과의 id는 새로운 값이어야 함", () => {
    const a = makeItem({ id: "a" });
    const b = makeItem({ id: "b" });
    const result = merge(a, b);
    expect(result.id).not.toBe("a");
    expect(result.id).not.toBe("b");
  });

  it("합성 불가한 아이템 합성 시 예외 발생", () => {
    const a = makeItem({ id: "a", type: "weapon" });
    const b = makeItem({ id: "b", type: "armor" });
    expect(() => merge(a, b)).toThrow();
  });

  it("합성 결과 statBonus는 이전보다 높아야 함", () => {
    const a = makeItem({ id: "a", grade: 1, type: "weapon", statBonus: 10 });
    const b = makeItem({ id: "b", grade: 1, type: "weapon", statBonus: 10 });
    const result = merge(a, b);
    expect(result.statBonus).toBeGreaterThan(10);
  });
});

describe("calcStatBonus", () => {
  it("무기: 등급 × 10", () => {
    expect(calcStatBonus("weapon", 1)).toBe(10);
    expect(calcStatBonus("weapon", 3)).toBe(30);
    expect(calcStatBonus("weapon", 5)).toBe(50);
  });

  it("방어구: 등급 × 8", () => {
    expect(calcStatBonus("armor", 2)).toBe(16);
  });

  it("장신구: 무기보다 낮은 기본값", () => {
    expect(calcStatBonus("ring", 1)).toBeLessThan(calcStatBonus("weapon", 1));
  });
});
