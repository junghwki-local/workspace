import type { Character, Equipment, Attribute, EnemyData } from "@/types";

// ─── 캐릭터 공격력 계산 ──────────────────────────────────
export function calcAtk(char: Character): number {
  const weapon = char.equipment.weapon;
  const weaponBonus = weapon ? weapon.statBonus : 0;
  const ring = char.equipment.ring;
  const ringBonus = ring ? Math.floor(ring.statBonus * 0.3) : 0;
  return char.baseAtk + weaponBonus + ringBonus;
}

// ─── 캐릭터 방어력 계산 ──────────────────────────────────
export function calcDef(char: Character): number {
  const armor = char.equipment.armor;
  const armorBonus = armor ? armor.statBonus : 0;
  const necklace = char.equipment.necklace;
  const necklaceBonus = necklace ? Math.floor(necklace.statBonus * 0.3) : 0;
  return char.baseDef + armorBonus + necklaceBonus;
}

// ─── 귀고리 버프 (HP 회복량) ────────────────────────────
export function calcHealBonus(char: Character): number {
  const earring = char.equipment.earring;
  return earring ? earring.statBonus * 2 : 0;
}

// ─── 무기 속성 취득 ──────────────────────────────────────
export function getWeaponAttribute(char: Character): Attribute {
  return char.equipment.ring?.attribute ?? "none";
}

// ─── 방어구 속성 취득 ────────────────────────────────────
export function getArmorAttribute(char: Character): Attribute {
  return char.equipment.necklace?.attribute ?? "none";
}

// ─── 속성 약점 배율 계산 ────────────────────────────────
export function getAttributeMultiplier(
  attackAttribute: Attribute,
  enemyWeakAttribute: Attribute
): number {
  if (attackAttribute === "none") return 1.0;
  if (attackAttribute === enemyWeakAttribute) return 1.5;
  return 1.0;
}

// ─── 데미지 계산 ─────────────────────────────────────────
export function calcDamage(
  attacker: Character,
  enemyDef: number,
  enemyWeakAttribute: Attribute
): number {
  const atk = calcAtk(attacker);
  const weaponAttr = getWeaponAttribute(attacker);
  const multiplier = getAttributeMultiplier(weaponAttr, enemyWeakAttribute);
  const raw = Math.max(1, atk - enemyDef);
  return Math.floor(raw * multiplier);
}

// ─── 스킬 데미지 (기본 공격의 2.5배) ────────────────────
export function calcSkillDamage(
  attacker: Character,
  enemyDef: number,
  enemyWeakAttribute: Attribute
): number {
  return Math.floor(calcDamage(attacker, enemyDef, enemyWeakAttribute) * 2.5);
}

// ─── 힐러 회복량 ─────────────────────────────────────────
export function calcHealAmount(healer: Character): number {
  return Math.floor(healer.baseAtk * 0.8 + calcHealBonus(healer));
}

// ─── 방어구 속성 피해 감소 ───────────────────────────────
export function calcDefenseReduction(
  defender: Character,
  attackAttribute: Attribute
): number {
  const armorAttr = getArmorAttribute(defender);
  if (armorAttr !== "none" && armorAttr === attackAttribute) {
    return 0.7; // 30% 피해 감소
  }
  return 1.0;
}

// ─── 적의 캐릭터 공격 데미지 ─────────────────────────────
export function calcEnemyDamage(
  enemy: EnemyData,
  defender: Character,
  enemyAttribute: Attribute = "none"
): number {
  const def = calcDef(defender);
  const reduction = calcDefenseReduction(defender, enemyAttribute);
  return Math.max(1, Math.floor((enemy.atk - def) * reduction));
}

// ─── 장비에서 총 스탯 합산 ──────────────────────────────
export function getTotalEquipmentStats(equipment: Character["equipment"]): {
  atk: number;
  def: number;
} {
  let atk = 0;
  let def = 0;

  const { weapon, armor, ring, necklace, earring } = equipment;

  if (weapon) atk += weapon.statBonus;
  if (armor) def += armor.statBonus;
  if (ring) atk += Math.floor(ring.statBonus * 0.3);
  if (necklace) def += Math.floor(necklace.statBonus * 0.3);
  if (earring) {
    atk += Math.floor(earring.statBonus * 0.1);
    def += Math.floor(earring.statBonus * 0.1);
  }

  return { atk, def };
}

// ─── 장비 미착용 슬롯 확인 ──────────────────────────────
export function getEmptySlots(equipment: Character["equipment"]): Array<keyof Character["equipment"]> {
  return (Object.keys(equipment) as Array<keyof Character["equipment"]>).filter(
    (slot) => equipment[slot] === null
  );
}

// ─── 합산 공격력 미리보기 ────────────────────────────────
export function previewAtk(char: Character, newEquip: Equipment): number {
  const modified: Character = {
    ...char,
    equipment: { ...char.equipment, [newEquip.type]: newEquip },
  };
  return calcAtk(modified);
}
