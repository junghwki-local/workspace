import { useState, lazy, Suspense, Component, type ReactNode } from "react";
import MenuScreen from "@/screens/MenuScreen";
import OnlineLobbyScreen, { type OnlineSession } from "@/screens/OnlineLobbyScreen";

const PongScreen       = lazy(() => import("@/screens/PongScreen"));
const OnlineGameScreen = lazy(() => import("@/screens/OnlineGameScreen"));

export type GameMode   = "ai" | "pvp" | "online";
export type PaddleSkin = "flame" | "ice" | "electric" | "grass";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: "#fff", padding: 24, fontFamily: "monospace", textAlign: "center" }}>
          <div style={{ fontSize: 18, color: "#ef4444" }}>오류 발생</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{this.state.error}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Loading = (
  <div style={{ width: "100%", height: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "monospace" }}>
    Loading...
  </div>
);

export default function App() {
  const [mode, setMode]           = useState<GameMode | null>(null);
  const [skinP1, setSkinP1]       = useState<PaddleSkin>("flame");
  const [skinP2, setSkinP2]       = useState<PaddleSkin>("ice");
  const [session, setSession]     = useState<OnlineSession | null>(null);

  if (!mode) {
    return (
      <MenuScreen
        onStart={setMode}
        skinP1={skinP1} onSkinP1Change={setSkinP1}
        skinP2={skinP2} onSkinP2Change={setSkinP2}
      />
    );
  }

  if (mode === "online" && !session) {
    return (
      <OnlineLobbyScreen
        skinP1={skinP1}
        onStart={(s) => setSession(s)}
        onBack={() => setMode(null)}
      />
    );
  }

  if (mode === "online" && session) {
    return (
      <ErrorBoundary>
        <Suspense fallback={Loading}>
          <OnlineGameScreen
            session={session}
            onBack={() => { setSession(null); setMode(null); }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={Loading}>
        <PongScreen mode={mode} skinP1={skinP1} skinP2={skinP2} onBack={() => setMode(null)} />
      </Suspense>
    </ErrorBoundary>
  );
}
