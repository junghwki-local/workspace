// ─── 속성 ───────────────────────────────────────────────
export type Attribute = "fire" | "water" | "wind" | "earth" | "light" | "dark" | "none";

export const ATTRIBUTE_LABEL: Record<Attribute, string> = {
  fire: "불", water: "물", wind: "바람",
  earth: "땅", light: "빛", dark: "어둠", none: "무속성",
};

export const ATTRIBUTE_COLOR: Record<Attribute, string> = {
  fire: "#ef4444", water: "#3b82f6", wind: "#22c55e",
  earth: "#d97706", light: "#eab308", dark: "#8b5cf6", none: "#6b7280",
};

// ─── 등급 ───────────────────────────────────────────────
export type Grade = 1 | 2 | 3 | 4 | 5;

export const GRADE_LABEL: Record<Grade, string> = {
  1: "일반", 2: "고급", 3: "희귀", 4: "영웅", 5: "전설",
};

export const GRADE_COLOR: Record<Grade, string> = {
  1: "#9ca3af", 2: "#22c55e", 3: "#3b82f6", 4: "#a855f7", 5: "#f59e0b",
};

// ─── 장비 타입 ───────────────────────────────────────────
export type EquipmentType = "weapon" | "armor" | "ring" | "necklace" | "earring";

export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  weapon: "무기", armor: "방어구", ring: "반지", necklace: "목걸이", earring: "귀고리",
};

export const JEWELRY_TYPES: EquipmentType[] = ["ring", "necklace", "earring"];

// ─── 직업 ────────────────────────────────────────────────
export type JobClass = "warrior" | "mage" | "healer" | "archer";

export const JOB_LABEL: Record<JobClass, string> = {
  warrior: "전사", mage: "마법사", healer: "힐러", archer: "궁수",
};

export const JOB_COLOR: Record<JobClass, string> = {
  warrior: "#ef4444", mage: "#8b5cf6", healer: "#22c55e", archer: "#f59e0b",
};

// ─── 장비 ────────────────────────────────────────────────
export interface Equipment {
  id: string;
  type: EquipmentType;
  grade: Grade;
  /** jewelry만 속성 보유. weapon/armor는 항상 "none" */
  attribute: Attribute;
  name: string;
  /** 기본 공격력 / 방어력 증가 수치 */
  statBonus: number;
}

// ─── 장비 슬롯 ───────────────────────────────────────────
export interface CharacterEquipment {
  weapon: Equipment | null;
  armor: Equipment | null;
  ring: Equipment | null;
  necklace: Equipment | null;
  earring: Equipment | null;
}

// ─── 캐릭터 ──────────────────────────────────────────────
export interface Character {
  id: string;
  name: string;
  job: JobClass;
  isPlayer: boolean;
  maxHp: number;
  hp: number;
  baseAtk: number;
  baseDef: number;
  equipment: CharacterEquipment;
}

// ─── 던전 적 ─────────────────────────────────────────────
export type EnemyType = "normal" | "boss";

export interface EnemyData {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  atk: number;
  def: number;
  weakAttribute: Attribute;
  goldDrop: number;
  dropGrade: Grade;
}

// ─── 인벤토리 그리드 ─────────────────────────────────────
export type InventoryGrid = (Equipment | null)[][];

export const GRID_COLS = 10;
export const GRID_ROWS = 10;
