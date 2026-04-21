import type { GameMode, PaddleSkin } from "@/App";

interface Props {
  onStart: (mode: GameMode) => void;
  skinP1: PaddleSkin;
  onSkinP1Change: (s: PaddleSkin) => void;
  skinP2: PaddleSkin;
  onSkinP2Change: (s: PaddleSkin) => void;
}

const SKINS: { key: PaddleSkin; label: string }[] = [
  { key: "flame",    label: "🔥 FLAME"    },
  { key: "ice",      label: "❄️ ICE"      },
  { key: "electric", label: "⚡ ELECTRIC" },
  { key: "grass",    label: "🌿 GRASS"    },
];

export default function MenuScreen({ onStart, skinP1, onSkinP1Change, skinP2, onSkinP2Change }: Props) {
  return (
    <div style={{
      width: "100%", height: "100dvh",
      background: "#000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28, color: "#fff", fontFamily: "monospace",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: 8 }}>PONG</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 6, letterSpacing: 2 }}>VERTICAL EDITION</div>
      </div>

      {/* 패들 스킨 선택 */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <PlayerSkinPicker label="P1" selected={skinP1} onSelect={onSkinP1Change} />
        <PlayerSkinPicker label="P2 / AI" selected={skinP2} onSelect={onSkinP2Change} />
      </div>

      {/* 모드 선택 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "80%", maxWidth: 280 }}>
        <ModeButton label="1P vs AI"  sub="혼자서 AI와 대결"    onClick={() => onStart("ai")} />
        <ModeButton label="1P vs 2P"  sub="같은 화면에서 대결"  onClick={() => onStart("pvp")} />
        <ModeButton label="온라인"    sub="방 만들기 / 입장 (앱 연동 가능)" onClick={() => onStart("online")} />
      </div>

      <div style={{ fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.8 }}>
        위쪽 화면 터치 → P2 (또는 AI)<br />
        아래쪽 화면 터치 → P1
      </div>
    </div>
  );
}

function PlayerSkinPicker({
  label, selected, onSelect,
}: {
  label: string;
  selected: PaddleSkin;
  onSelect: (s: PaddleSkin) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SKINS.map(({ key, label: skinLabel }) => {
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                background: active ? "#ffffff11" : "transparent",
                border: active ? "2px solid #fff" : "2px solid #2a2a2a",
                borderRadius: 8,
                padding: "8px 10px",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              }}
            >
              <img
                src={`/assets/paddle-${key}.svg`}
                width={88} height={11}
                style={{ display: "block" }}
                draggable={false}
              />
              <span style={{ fontSize: 9, fontFamily: "monospace", color: active ? "#fff" : "#444", letterSpacing: 1 }}>
                {skinLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeButton({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "2px solid #fff",
        borderRadius: 12,
        padding: "18px 24px",
        color: "#fff",
        cursor: "pointer",
        textAlign: "center",
        fontFamily: "monospace",
      }}
      onPointerDown={(e) => (e.currentTarget.style.background = "#ffffff22")}
      onPointerUp={(e)   => (e.currentTarget.style.background = "transparent")}
      onPointerLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{sub}</div>
    </button>
  );
}
