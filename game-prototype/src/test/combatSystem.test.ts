import { describe, it, expect } from "vitest";
import {
  calcAtk, calcDef, calcDamage, calcSkillDamage,
  getAttributeMultiplier, getWeaponAttribute, getArmorAttribute,
  getTotalEquipmentStats, getEmptySlots,
} from "@/systems/combatSystem";
import type { Character, Equipment } from "@/types";

function makeEquip(overrides: Partial<Equipment> = {}): Equipment {
  return {
    id: "e1", type: "weapon", grade: 1, attribute: "none", name: "검", statBonus: 10,
    ...overrides,
  };
}

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: "c1", name: "테스터", job: "warrior", isPlayer: true,
    maxHp: 100, hp: 100, baseAtk: 20, baseDef: 10,
    equipment: { weapon: null, armor: null, ring: null, necklace: null, earring: null },
    ...overrides,
  };
}

describe("calcAtk", () => {
  it("장비 없으면 기본 공격력", () => {
    const char = makeChar();
    expect(calcAtk(char)).toBe(20);
  });

  it("무기 착용 시 무기 보너스 추가", () => {
    const char = makeChar({ equipment: { weapon: makeEquip({ statBonus: 15 }), armor: null, ring: null, necklace: null, earring: null } });
    expect(calcAtk(char)).toBe(35);
  });

  it("반지 착용 시 30% 추가 보너스", () => {
    const char = makeChar({
      equipment: {
        weapon: null, armor: null,
        ring: makeEquip({ type: "ring", attribute: "fire", statBonus: 10 }),
        necklace: null, earring: null,
      },
    });
    expect(calcAtk(char)).toBe(23); // 20 + floor(10 * 0.3) = 23
  });
});

describe("calcDef", () => {
  it("장비 없으면 기본 방어력", () => {
    expect(calcDef(makeChar())).toBe(10);
  });

  it("방어구 착용 시 보너스 추가", () => {
    const char = makeChar({ equipment: { weapon: null, armor: makeEquip({ type: "armor", statBonus: 20 }), ring: null, necklace: null, earring: null } });
    expect(calcDef(char)).toBe(30);
  });
});

describe("getAttributeMultiplier", () => {
  it("공격 속성이 약점과 일치하면 1.5배", () => {
    expect(getAttributeMultiplier("fire", "fire")).toBe(1.5);
  });

  it("무속성 공격은 배율 1.0", () => {
    expect(getAttributeMultiplier("none", "fire")).toBe(1.0);
  });

  it("약점이 아니면 배율 1.0", () => {
    expect(getAttributeMultiplier("water", "fire")).toBe(1.0);
  });
});

describe("getWeaponAttribute", () => {
  it("반지 없으면 무속성", () => {
    expect(getWeaponAttribute(makeChar())).toBe("none");
  });

  it("반지 착용 시 반지 속성 반환", () => {
    const char = makeChar({
      equipment: { weapon: null, armor: null, ring: makeEquip({ type: "ring", attribute: "fire" }), necklace: null, earring: null },
    });
    expect(getWeaponAttribute(char)).toBe("fire");
  });
});

describe("getArmorAttribute", () => {
  it("목걸이 없으면 무속성", () => {
    expect(getArmorAttribute(makeChar())).toBe("none");
  });

  it("목걸이 착용 시 목걸이 속성 반환", () => {
    const char = makeChar({
      equipment: { weapon: null, armor: null, ring: null, necklace: makeEquip({ type: "necklace", attribute: "water" }), earring: null },
    });
    expect(getArmorAttribute(char)).toBe("water");
  });
});

describe("calcDamage", () => {
  it("약점 속성으로 공격 시 1.5배 데미지", () => {
    const char = makeChar({
      equipment: {
        weapon: makeEquip({ statBonus: 20 }),
        armor: null,
        ring: makeEquip({ type: "ring", attribute: "fire" }),
        necklace: null, earring: null,
      },
    });
    const normal = calcDamage(makeChar({ equipment: { weapon: makeEquip({ statBonus: 20 }), armor: null, ring: null, necklace: null, earring: null } }), 0, "fire");
    const bonus = calcDamage(char, 0, "fire");
    expect(bonus).toBeGreaterThan(normal);
  });

  it("데미지는 최소 1이어야 함", () => {
    const char = makeChar({ baseAtk: 1 });
    expect(calcDamage(char, 999, "none")).toBe(1);
  });
});

describe("calcSkillDamage", () => {
  it("스킬 데미지는 일반 공격의 2.5배", () => {
    const char = makeChar({ baseAtk: 20 });
    const normal = calcDamage(char, 0, "none");
    const skill = calcSkillDamage(char, 0, "none");
    expect(skill).toBe(Math.floor(normal * 2.5));
  });
});

describe("getTotalEquipmentStats", () => {
  it("모든 장비 착용 시 합산 스탯", () => {
    const eq: Character["equipment"] = {
      weapon: makeEquip({ type: "weapon", statBonus: 10 }),
      armor: makeEquip({ type: "armor", statBonus: 8 }),
      ring: makeEquip({ type: "ring", attribute: "fire", statBonus: 6 }),
      necklace: makeEquip({ type: "necklace", attribute: "water", statBonus: 6 }),
      earring: makeEquip({ type: "earring", attribute: "light", statBonus: 4 }),
    };
    const stats = getTotalEquipmentStats(eq);
    expect(stats.atk).toBeGreaterThan(0);
    expect(stats.def).toBeGreaterThan(0);
  });
});

describe("getEmptySlots", () => {
  it("모든 슬롯이 비어있으면 5개 반환", () => {
    expect(getEmptySlots(makeChar().equipment)).toHaveLength(5);
  });

  it("무기만 착용하면 빈 슬롯 4개", () => {
    const eq: Character["equipment"] = {
      weapon: makeEquip(), armor: null, ring: null, necklace: null, earring: null,
    };
    expect(getEmptySlots(eq)).toHaveLength(4);
  });
});
