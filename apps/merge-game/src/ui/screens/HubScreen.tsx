import { useGameStore } from "@/store/gameStore";
import { JOB_LABEL, JOB_COLOR } from "@/types";

export default function HubScreen() {
  const { gold, smithLevel, party, setScreen } = useGameStore();

  return (
    <div style={{ width: "100%", height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "32px 20px 40px", background: "#0a0a0f" }}>
      {/* 타이틀 */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4, color: "#f59e0b" }}>MERGE RPG</div>
        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>프로토타입 v0.1</div>
      </div>

      {/* 골드 */}
      <div style={{ background: "#1a1a2e", border: "1px solid #f59e0b55", borderRadius: 16, padding: "14px 36px", fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>
        💰 {gold.toLocaleString()} G
      </div>

      {/* 파티 */}
      <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center" }}>
        {party.map((char) => (
          <div
            key={char.id}
            style={{
              flex: 1, maxWidth: 100,
              background: "#111827",
              border: `1px solid ${JOB_COLOR[char.job]}44`,
              borderRadius: 14,
              padding: "14px 8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28 }}>
              {char.job === "warrior" ? "⚔️" : char.job === "mage" ? "🔮" : char.job === "healer" ? "💚" : "🏹"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: JOB_COLOR[char.job], marginTop: 4 }}>{JOB_LABEL[char.job]}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{char.name}</div>
            <div style={{ fontSize: 10, color: "#22c55e", marginTop: 6 }}>
              ❤️ {char.hp}/{char.maxHp}
            </div>
          </div>
        ))}
      </div>

      {/* 메뉴 버튼 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
        <MenuButton
          label="⚔️ 던전 탐험"
          sub="골드와 장비를 획득하세요"
          color="#ef4444"
          onClick={() => setScreen("dungeon")}
        />
        <MenuButton
          label="🎒 인벤토리"
          sub={`합성 · 장착 · 대장간 Lv.${smithLevel}`}
          color="#3b82f6"
          onClick={() => setScreen("inventory")}
        />
      </div>
    </div>
  );
}

function MenuButton({ label, sub, color, onClick }: {
  label: string; sub: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}1a`,
        border: `1.5px solid ${color}55`,
        borderRadius: 14,
        padding: "18px 20px",
        cursor: "pointer",
        textAlign: "left",
        color: "#fff",
        width: "100%",
      }}
      onTouchStart={(e) => (e.currentTarget.style.background = `${color}33`)}
      onTouchEnd={(e) => (e.currentTarget.style.background = `${color}1a`)}
    >
      <div style={{ fontWeight: 700, fontSize: 17 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{sub}</div>
    </button>
  );
}
