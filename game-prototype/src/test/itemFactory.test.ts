import { describe, it, expect } from "vitest";
import { craftEquipment, dropJewelry, dropEquipment, createStarterEquipment } from "@/systems/itemFactory";
import { JEWELRY_TYPES } from "@/types";

describe("craftEquipment", () => {
  it("무기 생산 시 타입이 weapon", () => {
    const item = craftEquipment("weapon", 1);
    expect(item.type).toBe("weapon");
  });

  it("방어구 생산 시 타입이 armor", () => {
    const item = craftEquipment("armor", 1);
    expect(item.type).toBe("armor");
  });

  it("무기/방어구는 항상 무속성", () => {
    const weapon = craftEquipment("weapon", 3);
    const armor = craftEquipment("armor", 3);
    expect(weapon.attribute).toBe("none");
    expect(armor.attribute).toBe("none");
  });

  it("생산 등급은 1~smithLevel 범위", () => {
    for (let i = 0; i < 20; i++) {
      const item = craftEquipment("weapon", 2);
      expect(item.grade).toBeGreaterThanOrEqual(1);
      expect(item.grade).toBeLessThanOrEqual(2);
    }
  });

  it("smithLevel 5 초과 입력 시 최대 5등급", () => {
    for (let i = 0; i < 10; i++) {
      const item = craftEquipment("weapon", 5);
      expect(item.grade).toBeLessThanOrEqual(5);
    }
  });
});

describe("dropJewelry", () => {
  it("반지/목걸이/귀고리 중 하나를 반환", () => {
    for (let i = 0; i < 10; i++) {
      const item = dropJewelry(1);
      expect(JEWELRY_TYPES).toContain(item.type);
    }
  });

  it("장신구는 반드시 속성이 있어야 함 (none 아님)", () => {
    for (let i = 0; i < 10; i++) {
      const item = dropJewelry(1);
      expect(item.attribute).not.toBe("none");
    }
  });

  it("지정한 등급으로 드롭", () => {
    const item = dropJewelry(3);
    expect(item.grade).toBe(3);
  });
});

describe("dropEquipment", () => {
  it("무기 또는 방어구를 반환", () => {
    for (let i = 0; i < 10; i++) {
      const item = dropEquipment(1);
      expect(["weapon", "armor"]).toContain(item.type);
    }
  });

  it("무기/방어구 드롭은 무속성", () => {
    for (let i = 0; i < 10; i++) {
      const item = dropEquipment(2);
      expect(item.attribute).toBe("none");
    }
  });
});

describe("createStarterEquipment", () => {
  it("6개의 시작 장비 반환", () => {
    const items = createStarterEquipment();
    expect(items).toHaveLength(6);
  });

  it("모든 아이템이 1등급", () => {
    const items = createStarterEquipment();
    items.forEach((item) => expect(item.grade).toBe(1));
  });

  it("모든 아이템의 id가 서로 다름", () => {
    const items = createStarterEquipment();
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
