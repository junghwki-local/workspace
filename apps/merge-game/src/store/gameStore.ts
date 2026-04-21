import { create } from "zustand";
import type {
  Equipment, Character, InventoryGrid, Grade, JobClass,
} from "@/types";
import { GRID_COLS, GRID_ROWS } from "@/types";
import { canMerge, merge } from "@/systems/mergeSystem";
import { craftEquipment, createStarterEquipment, dropEquipment, dropJewelry, generateId } from "@/systems/itemFactory";

// ─── 초기 캐릭터 생성 ────────────────────────────────────
function createCharacter(name: string, job: JobClass, isPlayer: boolean): Character {
  const stats: Record<JobClass, { hp: number; atk: number; def: number }> = {
    warrior: { hp: 200, atk: 20, def: 15 },
    mage:    { hp: 120, atk: 35, def: 8 },
    healer:  { hp: 150, atk: 15, def: 10 },
    archer:  { hp: 140, atk: 28, def: 10 },
  };
  const s = stats[job];
  return {
    id: generateId(),
    name,
    job,
    isPlayer,
    maxHp: s.hp,
    hp: s.hp,
    baseAtk: s.atk,
    baseDef: s.def,
    equipment: { weapon: null, armor: null, ring: null, necklace: null, earring: null },
  };
}

// ─── 초기 그리드 생성 ────────────────────────────────────
function createEmptyGrid(): InventoryGrid {
  return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
}

function placeItemsInGrid(items: Equipment[], grid: InventoryGrid): InventoryGrid {
  const newGrid = grid.map((row) => [...row]);
  let col = 0, row = 0;
  for (const item of items) {
    while (row < GRID_ROWS && newGrid[row][col] !== null) {
      col++;
      if (col >= GRID_COLS) { col = 0; row++; }
    }
    if (row < GRID_ROWS) {
      newGrid[row][col] = item;
      col++;
      if (col >= GRID_COLS) { col = 0; row++; }
    }
  }
  return newGrid;
}

// ─── State 타입 ───────────────────────────────────────────
export type Screen = "hub" | "inventory" | "blacksmith" | "dungeon";

interface GameState {
  screen: Screen;
  gold: number;
  smithLevel: number;
  party: Character[];
  inventory: InventoryGrid;
  storage: Equipment[];

  // Actions
  setScreen: (screen: Screen) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  upgradeSmith: () => void;
  craftItem: (type: "weapon" | "armor") => boolean;
  addItemToInventory: (item: Equipment) => boolean;
  addItemToStorage: (item: Equipment) => void;
  mergeItems: (row1: number, col1: number, row2: number, col2: number) => boolean;
  mergeWithStorage: (storageIdx: number, row: number, col: number) => boolean;
  equipItem: (characterId: string, item: Equipment, fromRow: number, fromCol: number) => void;
  unequipItem: (characterId: string, slot: keyof Character["equipment"]) => void;
  healParty: () => void;
  onDungeonComplete: (goldReward: number, dropGrade: Grade) => void;
}

// ─── Store ────────────────────────────────────────────────
export const useGameStore = create<GameState>((set, get) => {
  const starterItems = createStarterEquipment();
  const initialGrid = placeItemsInGrid(starterItems, createEmptyGrid());

  return {
    screen: "hub",
    gold: 500,
    smithLevel: 1,
    party: [
      createCharacter("주인공", "warrior", true),
      createCharacter("아리", "healer", false),
      createCharacter("카이", "archer", false),
    ],
    inventory: initialGrid,
    storage: [],

    setScreen: (screen) => set({ screen }),

    addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

    spendGold: (amount) => {
      if (get().gold < amount) return false;
      set((s) => ({ gold: s.gold - amount }));
      return true;
    },

    upgradeSmith: () => {
      const cost = get().smithLevel * 300;
      if (!get().spendGold(cost)) return;
      set((s) => ({ smithLevel: Math.min(s.smithLevel + 1, 5) }));
    },

    craftItem: (type) => {
      const cost = 100;
      if (!get().spendGold(cost)) return false;
      const item = craftEquipment(type, get().smithLevel);
      return get().addItemToInventory(item);
    },

    addItemToInventory: (item) => {
      const grid = get().inventory;
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (!grid[r][c]) {
            const newGrid = grid.map((row) => [...row]);
            newGrid[r][c] = item;
            set({ inventory: newGrid });
            return true;
          }
        }
      }
      // 인벤토리 가득 차면 창고에
      get().addItemToStorage(item);
      return false;
    },

    addItemToStorage: (item) => {
      set((s) => ({ storage: [...s.storage, item] }));
    },

    mergeItems: (row1, col1, row2, col2) => {
      const grid = get().inventory;
      const a = grid[row1][col1];
      const b = grid[row2][col2];
      if (!a || !b || !canMerge(a, b)) return false;

      const result = merge(a, b);
      const newGrid = grid.map((row) => [...row]);
      newGrid[row1][col1] = null;
      newGrid[row2][col2] = result;
      set({ inventory: newGrid });
      return true;
    },

    mergeWithStorage: (storageIdx, row, col) => {
      const grid = get().inventory;
      const storage = get().storage;
      const a = grid[row][col];
      const b = storage[storageIdx];
      if (!a || !b || !canMerge(a, b)) return false;

      const result = merge(a, b);
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = result;
      const newStorage = storage.filter((_, i) => i !== storageIdx);
      set({ inventory: newGrid, storage: newStorage });
      return true;
    },

    equipItem: (characterId, item, fromRow, fromCol) => {
      set((s) => {
        const party = s.party.map((char) => {
          if (char.id !== characterId) return char;
          const oldEquip = char.equipment[item.type as keyof Character["equipment"]];
          const newEquip = { ...char.equipment, [item.type]: item };
          // 기존 장비는 인벤토리로 반환
          const grid = s.inventory.map((r) => [...r]);
          grid[fromRow][fromCol] = oldEquip;
          return { ...char, equipment: newEquip };
        });

        const grid = s.inventory.map((r) => [...r]);
        const char = s.party.find((c) => c.id === characterId);
        if (char) {
          const old = char.equipment[item.type as keyof Character["equipment"]];
          grid[fromRow][fromCol] = old;
        }
        return { party, inventory: grid };
      });
    },

    unequipItem: (characterId, slot) => {
      const char = get().party.find((c) => c.id === characterId);
      if (!char) return;
      const item = char.equipment[slot];
      if (!item) return;

      set((s) => ({
        party: s.party.map((c) =>
          c.id === characterId
            ? { ...c, equipment: { ...c.equipment, [slot]: null } }
            : c
        ),
      }));
      get().addItemToInventory(item);
    },

    healParty: () => {
      set((s) => ({
        party: s.party.map((c) => ({ ...c, hp: c.maxHp })),
      }));
    },

    onDungeonComplete: (goldReward, dropGrade) => {
      get().addGold(goldReward);
      // 장비 드롭
      const dropCount = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < dropCount; i++) {
        const item = Math.random() < 0.4 ? dropJewelry(dropGrade) : dropEquipment(dropGrade);
        get().addItemToInventory(item);
      }
      // 파티 HP 회복
      get().healParty();
    },
  };
});
