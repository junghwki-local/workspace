import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { GRADE_COLOR } from "@/types";

const CRAFT_COST = 100;

export default function BlacksmithScreen() {
  const { gold, smithLevel, craftItem, upgradeSmith, setScreen } = useGameStore();
  const upgradeCost = smithLevel * 300;
  const [lastCraft, setLastCraft] = useState<string | null>(null);

  function handleCraft(type: "weapon" | "armor") {
    const success = craftItem(type);
    if (success) {
      setLastCraft(`${type === "weapon" ? "무기" : "방어구"} 생산 완료!`);
    } else {
      setLastCraft("인벤토리가 가득 차서 창고에 저장되었습니다.");
    }
  }

  // 등급별 드롭 확률 계산
  const dropRates: Record<number, number[]> = {
    1: [50, 30, 15, 4, 1],
    2: [30, 35, 25, 8, 2],
    3: [15, 25, 35, 20, 5],
    4: [5, 15, 30, 35, 15],
    5: [1, 5, 20, 35, 39],
  };
  const rates = dropRates[smithLevel] ?? dropRates[1];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0f", color: "#fff", padding: 24, gap: 20 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setScreen("hub")} style={btnStyle}>← 허브</button>
        <span style={{ fontWeight: 700, fontSize: 20 }}>🔨 대장간</span>
        <span style={{ marginLeft: "auto", fontSize: 16, color: "#f59e0b", fontWeight: 700 }}>💰 {gold.toLocaleString()} G</span>
      </div>

      {/* 대장간 레벨 */}
      <div style={{ background: "#111827", borderRadius: 12, padding: 20, border: "1px solid #f59e0b44" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>대장간 Lv.{smithLevel}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>레벨이 높을수록 고등급 장비가 더 많이 생산됩니다</div>
          </div>
          {smithLevel < 5 ? (
            <button
              onClick={upgradeSmith}
              disabled={gold < upgradeCost}
              style={{ ...btnStyle, background: gold >= upgradeCost ? "#f59e0b33" : "#1f2937", borderColor: gold >= upgradeCost ? "#f59e0b" : "#374151", padding: "10px 16px" }}
            >
              업그레이드<br />
              <span style={{ fontSize: 11 }}>💰 {upgradeCost.toLocaleString()} G</span>
            </button>
          ) : (
            <div style={{ color: "#f59e0b", fontWeight: 700 }}>MAX 레벨</div>
          )}
        </div>

        {/* 등급별 확률 */}
        <div style={{ display: "flex", gap: 8 }}>
          {rates.map((rate, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", background: `${GRADE_COLOR[(i + 1) as 1 | 2 | 3 | 4 | 5]}22`, borderRadius: 6, padding: "6px 4px", border: `1px solid ${GRADE_COLOR[(i + 1) as 1 | 2 | 3 | 4 | 5]}44` }}>
              <div style={{ fontSize: 10, color: GRADE_COLOR[(i + 1) as 1 | 2 | 3 | 4 | 5], fontWeight: 700 }}>{i + 1}★</div>
              <div style={{ fontSize: 11 }}>{rate}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 생산 버튼 */}
      <div style={{ display: "flex", gap: 16 }}>
        <CraftButton
          label="⚔️ 무기 생산"
          cost={CRAFT_COST}
          gold={gold}
          onClick={() => handleCraft("weapon")}
          desc="등급 랜덤 / 무속성"
        />
        <CraftButton
          label="🛡️ 방어구 생산"
          cost={CRAFT_COST}
          gold={gold}
          onClick={() => handleCraft("armor")}
          desc="등급 랜덤 / 무속성"
        />
      </div>

      {/* 결과 메시지 */}
      {lastCraft && (
        <div style={{ background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: 8, padding: "12px 16px", color: "#22c55e", fontSize: 14 }}>
          ✅ {lastCraft}
        </div>
      )}

      {/* 안내 */}
      <div style={{ background: "#111827", borderRadius: 10, padding: 14, border: "1px solid #1f2937", fontSize: 12, color: "#9ca3af", lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, color: "#d1d5db", marginBottom: 6 }}>💡 안내</div>
        <div>• 무기/방어구는 무속성으로 생산됩니다</div>
        <div>• 속성은 반지(무기)/목걸이(방어구) 장신구로 부여합니다</div>
        <div>• 장신구는 던전 클리어 보상으로만 획득할 수 있습니다</div>
        <div>• 같은 등급 장비 2개를 합성하면 한 단계 위 등급이 됩니다</div>
      </div>
    </div>
  );
}

function CraftButton({ label, cost, gold, onClick, desc }: { label: string; cost: number; gold: number; onClick: () => void; desc: string }) {
  const canAfford = gold >= cost;
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      style={{
        flex: 1,
        background: canAfford ? "#f59e0b22" : "#1f2937",
        border: `1px solid ${canAfford ? "#f59e0b" : "#374151"}`,
        borderRadius: 12,
        padding: "20px",
        cursor: canAfford ? "pointer" : "not-allowed",
        color: canAfford ? "#fff" : "#6b7280",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 24 }}>{label.split(" ")[0]}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{label.split(" ").slice(1).join(" ")}</div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{desc}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginTop: 8 }}>💰 {cost} G</div>
    </button>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#fff",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 12,
};
