import type { Equipment, EquipmentType, Grade, Attribute } from "@/types";
import { JEWELRY_TYPES } from "@/types";
import { calcStatBonus } from "@/systems/mergeSystem";

let _counter = 0;
export function generateId(): string {
  return `item_${Date.now()}_${++_counter}`;
}

const ATTRIBUTES: Attribute[] = ["fire", "water", "wind", "earth", "light", "dark"];

function randomAttribute(): Attribute {
  return ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
}

function randomGradeWeighted(maxGrade: Grade): Grade {
  // 낮은 등급이 더 많이 나옴
  const weights = [50, 30, 15, 4, 1].slice(0, maxGrade);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return (i + 1) as Grade;
  }
  return 1;
}

function buildName(type: EquipmentType, grade: Grade, attribute: Attribute): string {
  const gradePrefix: Record<Grade, string> = {
    1: "", 2: "강화된 ", 3: "희귀한 ", 4: "영웅의 ", 5: "전설의 ",
  };
  const typeNames: Record<EquipmentType, string> = {
    weapon: "검", armor: "갑옷", ring: "반지", necklace: "목걸이", earring: "귀고리",
  };
  const attrNames: Record<Attribute, string> = {
    fire: "화염", water: "수류", wind: "질풍", earth: "대지", light: "신성", dark: "암흑", none: "",
  };
  const attr = attribute !== "none" ? `${attrNames[attribute]}의 ` : "";
  return `${gradePrefix[grade]}${attr}${typeNames[type]}`;
}

// ─── 대장간: 무기/방어구 생산 ────────────────────────────
export function craftEquipment(type: "weapon" | "armor", smithLevel: number): Equipment {
  const maxGrade = Math.min(smithLevel, 5) as Grade;
  const grade = randomGradeWeighted(maxGrade);
  return {
    id: generateId(),
    type,
    grade,
    attribute: "none",
    name: buildName(type, grade, "none"),
    statBonus: calcStatBonus(type, grade),
  };
}

// ─── 던전: 장신구 드롭 ──────────────────────────────────
export function dropJewelry(dropGrade: Grade): Equipment {
  const types: Array<"ring" | "necklace" | "earring"> = ["ring", "necklace", "earring"];
  const type = types[Math.floor(Math.random() * types.length)];
  const attribute = randomAttribute();
  return {
    id: generateId(),
    type,
    grade: dropGrade,
    attribute,
    name: buildName(type, dropGrade, attribute),
    statBonus: calcStatBonus(type, dropGrade),
  };
}

// ─── 던전: 무기/방어구 드롭 ─────────────────────────────
export function dropEquipment(dropGrade: Grade): Equipment {
  const type = Math.random() < 0.5 ? "weapon" : "armor";
  const isJewelry = JEWELRY_TYPES.includes(type);
  const attribute: Attribute = isJewelry ? randomAttribute() : "none";
  return {
    id: generateId(),
    type,
    grade: dropGrade,
    attribute,
    name: buildName(type, dropGrade, attribute),
    statBonus: calcStatBonus(type, dropGrade),
  };
}

// ─── 초기 장비 세트 (테스트용) ───────────────────────────
export function createStarterEquipment(): Equipment[] {
  const items: Equipment[] = [];
  const weaponTypes: EquipmentType[] = ["weapon", "armor", "weapon", "armor", "ring", "necklace"];
  for (const type of weaponTypes) {
    const isJewelry = JEWELRY_TYPES.includes(type);
    const attribute: Attribute = isJewelry ? randomAttribute() : "none";
    items.push({
      id: generateId(),
      type,
      grade: 1,
      attribute,
      name: buildName(type, 1, attribute),
      statBonus: calcStatBonus(type, 1),
    });
  }
  return items;
}
