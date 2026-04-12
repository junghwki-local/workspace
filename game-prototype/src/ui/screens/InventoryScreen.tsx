import { useState, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Equipment, EquipmentType } from "@/types";
import { GRID_COLS, GRID_ROWS, JOB_LABEL, JOB_COLOR, GRADE_COLOR, ATTRIBUTE_LABEL, ATTRIBUTE_COLOR, EQUIPMENT_LABEL } from "@/types";
import { canMerge } from "@/systems/mergeSystem";
import { calcAtk, calcDef } from "@/systems/combatSystem";
import EquipmentSlot from "@/ui/components/EquipmentSlot";

const SMITH_ROW = GRID_ROWS - 1;
const WEAPON_SMITH_COL = GRID_COLS - 2; // 무기 대장간 (9번째 열)
const ARMOR_SMITH_COL = GRID_COLS - 1;  // 방어구 대장간 (10번째 열)

const isWeaponSmith = (r: number, c: number) => r === SMITH_ROW && c === WEAPON_SMITH_COL;
const isArmorSmith  = (r: number, c: number) => r === SMITH_ROW && c === ARMOR_SMITH_COL;

type DragSrc =
  | { kind: "grid"; row: number; col: number }
  | { kind: "storage"; idx: number };

type DragState = { src: DragSrc; item: Equipment; x: number; y: number };

type BottomTab = "grid" | "equip";

const SLOT_ICON: Record<EquipmentType, string> = {
  weapon: "⚔️", armor: "🛡️", ring: "💍", necklace: "📿", earring: "✨",
};

export default function InventoryScreen() {
  const {
    inventory, storage, party, gold, smithLevel,
    setScreen, mergeItems, mergeWithStorage, equipItem, unequipItem,
    craftItem, upgradeSmith,
  } = useGameStore();

  const [selectedChar, setSelectedChar] = useState(party[0].id);
  const [bottomTab, setBottomTab] = useState<BottomTab>("grid");
  const [upgradePopup, setUpgradePopup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // 선택된 아이템 (장착용 탭 없는 상태에서 그리드 탭 아이템 선택)
  const [selected, setSelected] = useState<DragSrc | null>(null);

  // 드래그 추적
  const pendingDrag = useRef<{ src: DragSrc; item: Equipment } | null>(null);
  const dragMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 대장간 꾹누름 타이머
  const smithTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const char = party.find((c) => c.id === selectedChar) ?? party[0];
  const isSmithCell = (r: number, c: number) => isWeaponSmith(r, c) || isArmorSmith(r, c);

  const selectedItem =
    selected?.kind === "grid"
      ? inventory[selected.row][selected.col]
      : selected?.kind === "storage"
      ? storage[selected.idx]
      : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  // ── 대장간 ─────────────────────────────────────────────
  function onSmithPointerDown(e: React.PointerEvent, type: "weapon" | "armor") {
    e.stopPropagation();
    smithTimer.current = setTimeout(() => {
      smithTimer.current = null;
      setUpgradePopup(true);
    }, 500);
    // type을 ref에 저장해두기 위해 클로저 활용
    (smithTimer as React.MutableRefObject<ReturnType<typeof setTimeout> | null> & { craftType?: "weapon" | "armor" }).craftType = type;
  }
  function onSmithPointerUp(e: React.PointerEvent, type: "weapon" | "armor") {
    e.stopPropagation();
    if (smithTimer.current) {
      clearTimeout(smithTimer.current);
      smithTimer.current = null;
      // 탭 → 즉시 제작
      handleCraft(type);
    }
  }
  function onSmithPointerCancel() {
    if (smithTimer.current) { clearTimeout(smithTimer.current); smithTimer.current = null; }
  }

  function handleCraft(type: "weapon" | "armor") {
    if (gold < 100) { showToast("💰 골드 부족"); return; }
    craftItem(type);
    showToast(`${type === "weapon" ? "⚔️ 무기" : "🛡️ 방어구"} 생산!`);
  }

  function handleUpgrade() {
    const cost = smithLevel * 300;
    if (gold < cost) { showToast("💰 골드 부족"); return; }
    upgradeSmith();
    showToast(`🔨 Lv.${smithLevel + 1} 업그레이드!`);
    setUpgradePopup(false);
  }

  // ── 드래그앤드롭 ────────────────────────────────────────
  function onItemPointerDown(e: React.PointerEvent, src: DragSrc, item: Equipment) {
    e.stopPropagation();
    pendingDrag.current = { src, item };
    dragMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onItemPointerMove(e: React.PointerEvent) {
    if (!pendingDrag.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!dragMoved.current && Math.sqrt(dx * dx + dy * dy) > 8) {
      dragMoved.current = true;
      setDrag({ ...pendingDrag.current, x: e.clientX, y: e.clientY });
      setSelected(null);
    }
    if (dragMoved.current) {
      setDrag((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  }

  function onItemPointerUp(e: React.PointerEvent) {
    if (!pendingDrag.current) return;

    if (!dragMoved.current) {
      // 탭 → 선택/합성
      const src = pendingDrag.current.src;
      handleTap(src);
    } else {
      // 드롭 → 합성 시도
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const gridTarget = els.find((el) => el.hasAttribute("data-grid-row"));
      const storageTarget = els.find((el) => el.hasAttribute("data-storage-idx"));

      const srcSnap = pendingDrag.current;
      if (gridTarget) {
        const r2 = parseInt(gridTarget.getAttribute("data-grid-row")!);
        const c2 = parseInt(gridTarget.getAttribute("data-grid-col")!);
        if (!isSmithCell(r2, c2)) {
          const destItem = inventory[r2][c2];
          if (destItem && canMerge(srcSnap.item, destItem)) {
            if (srcSnap.src.kind === "grid") {
              mergeItems(srcSnap.src.row, srcSnap.src.col, r2, c2);
            } else {
              mergeWithStorage(srcSnap.src.idx, r2, c2);
            }
            showToast("✨ 합성 성공!");
          }
        }
      } else if (storageTarget) {
        const idx2 = parseInt(storageTarget.getAttribute("data-storage-idx")!);
        const destItem = storage[idx2];
        if (destItem && canMerge(srcSnap.item, destItem)) {
          if (srcSnap.src.kind === "grid") {
            mergeWithStorage(idx2, srcSnap.src.row, srcSnap.src.col);
            showToast("✨ 합성 성공!");
          }
        }
      }
      setDrag(null);
    }

    pendingDrag.current = null;
    dragMoved.current = false;
  }

  function onItemPointerCancel() {
    pendingDrag.current = null;
    dragMoved.current = false;
    setDrag(null);
  }

  function handleTap(src: DragSrc) {
    if (!selected) {
      setSelected(src);
      return;
    }
    // 두 번째 탭 → 합성 시도
    const a =
      selected.kind === "grid"
        ? inventory[selected.row][selected.col]
        : storage[selected.idx];
    const b =
      src.kind === "grid"
        ? inventory[src.row][src.col]
        : storage[src.idx];

    // 같은 아이템 재탭 → 선택 해제
    if (
      selected.kind === "grid" && src.kind === "grid" &&
      selected.row === src.row && selected.col === src.col
    ) {
      setSelected(null);
      return;
    }
    if (selected.kind === "storage" && src.kind === "storage" && selected.idx === src.idx) {
      setSelected(null);
      return;
    }

    if (a && b && canMerge(a, b)) {
      if (selected.kind === "grid" && src.kind === "grid") {
        mergeItems(selected.row, selected.col, src.row, src.col);
        showToast("✨ 합성 성공!");
      } else if (selected.kind === "storage" && src.kind === "grid") {
        mergeWithStorage(selected.idx, src.row, src.col);
        showToast("✨ 합성 성공!");
      } else if (selected.kind === "grid" && src.kind === "storage") {
        mergeWithStorage(src.idx, selected.row, selected.col);
        showToast("✨ 합성 성공!");
      }
      setSelected(null);
    } else {
      setSelected(src);
    }
  }

  function handleEquip() {
    if (!selectedItem || !selected || selected.kind !== "grid") return;
    equipItem(selectedChar, selectedItem, selected.row, selected.col);
    setSelected(null);
  }

  const selItem =
    selected?.kind === "grid"
      ? inventory[selected.row][selected.col]
      : selected?.kind === "storage"
      ? storage[selected.idx]
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0a0a0f", color: "#fff", overflow: "hidden", position: "relative" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #1f2937", flexShrink: 0 }}>
        <button onClick={() => setScreen("hub")} style={btnStyle}>←</button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          {bottomTab === "grid" ? "🎒 인벤토리" : "👤 장비"}
        </span>
        <span style={{ marginLeft: "auto", color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>
          💰 {gold.toLocaleString()}
        </span>
      </div>

      {/* 선택 아이템 바 */}
      {selItem && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#1f2937", flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>{SLOT_ICON[selItem.type]}</span>
          <span style={{ color: GRADE_COLOR[selItem.grade], fontWeight: 700, fontSize: 13 }}>{selItem.name}</span>
          {selItem.attribute !== "none" && (
            <span style={{ color: ATTRIBUTE_COLOR[selItem.attribute], fontSize: 12 }}>{ATTRIBUTE_LABEL[selItem.attribute]}</span>
          )}
          <span style={{ color: "#6b7280", fontSize: 12 }}>+{selItem.statBonus}</span>
          {selected?.kind === "grid" && (
            <button onClick={handleEquip} style={{ ...btnStyle, marginLeft: "auto", background: "#22c55e33", borderColor: "#22c55e", padding: "6px 14px", fontSize: 13 }}>
              장착
            </button>
          )}
          <button onClick={() => setSelected(null)} style={{ ...btnStyle, padding: "6px 10px" }}>✕</button>
        </div>
      )}

      {/* 본문 */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* 그리드 탭 */}
        {bottomTab === "grid" && (
          <div style={{ padding: "8px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, color: "#4b5563", textAlign: "center" }}>
              드래그로 합성 | 탭으로 선택 후 장착 | ⚔️🛡️ 탭=즉시제작(100G) 꾹누름=업그레이드
            </div>

            {/* 인벤토리 그리드 */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: 3, padding: "2px" }}>
              {Array.from({ length: GRID_ROWS }, (_, r) =>
                Array.from({ length: GRID_COLS }, (_, c) => {
                  const weaponSmith = isWeaponSmith(r, c);
                  const armorSmith  = isArmorSmith(r, c);
                  const smith = weaponSmith || armorSmith;
                  const smithType = weaponSmith ? "weapon" : "armor";
                  const item = smith ? null : inventory[r][c];
                  const isSel = selected?.kind === "grid" && selected.row === r && selected.col === c;
                  const selSrc = selected?.kind === "grid" ? inventory[selected.row][selected.col] : null;
                  const isMergeable = !!selSrc && !!item && canMerge(selSrc, item) && !isSel;

                  return (
                    <div
                      key={`${r}-${c}`}
                      data-grid-row={r}
                      data-grid-col={c}
                      style={{
                        aspectRatio: "1",
                        border: smith
                          ? "2px solid #f59e0b"
                          : isMergeable
                          ? "2px solid #22c55e"
                          : isSel
                          ? "2px solid #ffffff"
                          : "1px solid #1f2937",
                        borderRadius: 5,
                        background: smith ? "#f59e0b22" : isSel ? "#ffffff22" : "#111827",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", position: "relative", fontSize: 14, minHeight: 0,
                        userSelect: "none", WebkitUserSelect: "none",
                        touchAction: "none",
                      }}
                      {...(smith
                        ? {
                            onPointerDown: (e: React.PointerEvent) => onSmithPointerDown(e, smithType),
                            onPointerUp: (e: React.PointerEvent) => onSmithPointerUp(e, smithType),
                            onPointerCancel: onSmithPointerCancel,
                          }
                        : item
                        ? {
                            onPointerDown: (e: React.PointerEvent) => onItemPointerDown(e, { kind: "grid", row: r, col: c }, item),
                            onPointerMove: onItemPointerMove,
                            onPointerUp: onItemPointerUp,
                            onPointerCancel: onItemPointerCancel,
                          }
                        : { onClick: () => setSelected(null) }
                      )}
                    >
                      {smith && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                          <span style={{ fontSize: 13 }}>{weaponSmith ? "⚔️" : "🛡️"}</span>
                          <span style={{ fontSize: 6, color: "#f59e0b", fontWeight: 700, lineHeight: 1.2 }}>
                            {weaponSmith ? "무기" : "방어구"}
                          </span>
                          <span style={{ fontSize: 6, color: "#9ca3af", lineHeight: 1.2 }}>Lv.{smithLevel}</span>
                        </div>
                      )}
                      {!smith && item && (
                        <>
                          {SLOT_ICON[item.type]}
                          <div style={{ position: "absolute", top: 1, left: 1, fontSize: 7, color: GRADE_COLOR[item.grade], fontWeight: 700 }}>{item.grade}★</div>
                          {item.attribute !== "none" && (
                            <div style={{ position: "absolute", bottom: 1, right: 1, width: 5, height: 5, borderRadius: "50%", background: ATTRIBUTE_COLOR[item.attribute] }} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 창고 */}
            {storage.length > 0 && (
              <div style={{ background: "#111827", borderRadius: 8, padding: 8, border: "1px solid #1f2937" }}>
                <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 5 }}>창고 ({storage.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {storage.map((item, idx) => {
                    const isSel = selected?.kind === "storage" && selected.idx === idx;
                    return (
                      <div
                        key={item.id}
                        data-storage-idx={idx}
                        style={{
                          width: 44, height: 44,
                          border: `2px solid ${isSel ? "#fff" : GRADE_COLOR[item.grade]}`,
                          borderRadius: 5,
                          background: `${GRADE_COLOR[item.grade]}22`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", fontSize: 16, position: "relative",
                          userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
                        }}
                        onPointerDown={(e) => onItemPointerDown(e, { kind: "storage", idx }, item)}
                        onPointerMove={onItemPointerMove}
                        onPointerUp={onItemPointerUp}
                        onPointerCancel={onItemPointerCancel}
                      >
                        {SLOT_ICON[item.type]}
                        <div style={{ position: "absolute", top: 1, left: 1, fontSize: 7, color: GRADE_COLOR[item.grade], fontWeight: 700 }}>{item.grade}★</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 장비 탭 */}
        {bottomTab === "equip" && (
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {party.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChar(c.id)}
                  style={{
                    flex: 1,
                    background: c.id === selectedChar ? `${JOB_COLOR[c.job]}33` : "transparent",
                    border: `2px solid ${c.id === selectedChar ? JOB_COLOR[c.job] : "#374151"}`,
                    borderRadius: 10, padding: "10px 6px", cursor: "pointer",
                    color: "#fff", textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 20 }}>
                    {c.job === "warrior" ? "⚔️" : c.job === "mage" ? "🔮" : c.job === "healer" ? "💚" : "🏹"}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: JOB_COLOR[c.job], marginTop: 2 }}>{JOB_LABEL[c.job]}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{c.name}</div>
                </button>
              ))}
            </div>

            <div style={{ background: "#111827", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 20, justifyContent: "center", fontSize: 14 }}>
              <span>⚔️ <b style={{ color: "#ef4444" }}>{calcAtk(char)}</b></span>
              <span>🛡️ <b style={{ color: "#3b82f6" }}>{calcDef(char)}</b></span>
              <span>❤️ <b style={{ color: "#22c55e" }}>{char.hp}/{char.maxHp}</b></span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(["weapon", "armor", "ring", "necklace", "earring"] as EquipmentType[]).map((slot) => {
                const item = char.equipment[slot];
                return (
                  <div key={slot} style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", borderRadius: 10, padding: "10px 12px" }}>
                    <EquipmentSlot slot={slot} item={item} size={48} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{EQUIPMENT_LABEL[slot]}</div>
                      {item ? (
                        <div style={{ fontSize: 13, color: GRADE_COLOR[item.grade], fontWeight: 700, marginTop: 2 }}>
                          {item.name}
                          {item.attribute !== "none" && <span style={{ color: ATTRIBUTE_COLOR[item.attribute], marginLeft: 6, fontSize: 11 }}>{ATTRIBUTE_LABEL[item.attribute]}</span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#374151" }}>미착용</div>
                      )}
                    </div>
                    {item && (
                      <button onClick={() => unequipItem(char.id, slot)} style={{ ...btnStyle, padding: "6px 10px", fontSize: 12 }}>해제</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 하단 탭 */}
      <div style={{ display: "flex", borderTop: "1px solid #1f2937", background: "#111827", flexShrink: 0 }}>
        {([
          { key: "grid", icon: "🎒", label: "인벤토리" },
          { key: "equip", icon: "👤", label: "장비" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setBottomTab(t.key)}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: bottomTab === t.key ? "#3b82f6" : "#6b7280",
              padding: "12px 0", cursor: "pointer", fontSize: 22,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              borderTop: bottomTab === t.key ? "2px solid #3b82f6" : "2px solid transparent",
            }}
          >
            {t.icon}
            <span style={{ fontSize: 10 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 드래그 고스트 */}
      {drag && (
        <div style={{
          position: "fixed",
          left: drag.x - 22, top: drag.y - 22,
          width: 44, height: 44,
          background: "#1f2937dd",
          border: `2px solid ${GRADE_COLOR[drag.item.grade]}`,
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, pointerEvents: "none", zIndex: 1000, opacity: 0.9,
          boxShadow: "0 4px 16px #000000aa",
        }}>
          {SLOT_ICON[drag.item.type]}
        </div>
      )}

      {/* 업그레이드 팝업 (꾹누름) */}
      {upgradePopup && (
        <div onClick={() => setUpgradePopup(false)} style={{ position: "absolute", inset: 0, background: "#000000aa", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#111827", border: "2px solid #f59e0b", borderRadius: 20, padding: 28, width: "80%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>🔨 대장간 업그레이드</div>
            <div style={{ fontSize: 15, color: "#9ca3af" }}>Lv.{smithLevel} → Lv.{smithLevel + 1}</div>
            <div style={{ fontSize: 14, color: "#f59e0b", fontWeight: 700 }}>비용: {smithLevel * 300} G</div>
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>높은 레벨일수록 고등급 아이템 제작 확률 상승</div>
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <button onClick={() => setUpgradePopup(false)} style={{ ...btnStyle, flex: 1, padding: "12px 0", fontSize: 14, textAlign: "center" }}>취소</button>
              {smithLevel < 5 && (
                <button
                  onClick={handleUpgrade}
                  disabled={gold < smithLevel * 300}
                  style={{
                    flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 700,
                    background: gold >= smithLevel * 300 ? "#f59e0b" : "#374151",
                    border: "none", borderRadius: 8, color: gold >= smithLevel * 300 ? "#000" : "#6b7280",
                    cursor: gold >= smithLevel * 300 ? "pointer" : "not-allowed",
                  }}
                >
                  업그레이드
                </button>
              )}
              {smithLevel >= 5 && <div style={{ flex: 1, textAlign: "center", color: "#6b7280", fontSize: 14, padding: "12px 0" }}>최대 레벨</div>}
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "#22c55e", color: "#fff", padding: "10px 20px", borderRadius: 24,
          fontWeight: 700, fontSize: 14, zIndex: 200, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px #00000066",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#fff",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 12,
};
