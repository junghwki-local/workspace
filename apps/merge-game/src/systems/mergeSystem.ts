import type { Equipment, Grade, EquipmentType, Attribute } from "@/types";
import { JEWELRY_TYPES } from "@/types";
import { generateId } from "@/systems/itemFactory";

// ─── 합성 가능 여부 판단 ──────────────────────────────────
export function canMerge(a: Equipment, b: Equipment): boolean {
  if (a.id === b.id) return false;
  if (a.type !== b.type) return false;
  if (a.grade !== b.grade) return false;
  if (a.grade >= 5) return false; // 최고 등급은 합성 불가

  // 장신구는 속성도 같아야 합성 가능
  if (JEWELRY_TYPES.includes(a.type)) {
    if (a.attribute !== b.attribute) return false;
  }

  return true;
}

// ─── 합성 결과 생성 ───────────────────────────────────────
export function merge(a: Equipment, b: Equipment): Equipment {
  if (!canMerge(a, b)) {
    throw new Error("합성할 수 없는 장비입니다.");
  }

  const nextGrade = (a.grade + 1) as Grade;
  const isJewelry = JEWELRY_TYPES.includes(a.type);

  return {
    id: generateId(),
    type: a.type as EquipmentType,
    grade: nextGrade,
    attribute: isJewelry ? a.attribute : "none",
    name: buildName(a.type as EquipmentType, nextGrade, isJewelry ? a.attribute : "none"),
    statBonus: calcStatBonus(a.type as EquipmentType, nextGrade),
  };
}

// ─── 이름 생성 ────────────────────────────────────────────
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

// ─── 스탯 계산 ────────────────────────────────────────────
export function calcStatBonus(type: EquipmentType, grade: Grade): number {
  const base: Record<EquipmentType, number> = {
    weapon: 10, armor: 8, ring: 5, necklace: 5, earring: 4,
  };
  return base[type] * grade;
}
