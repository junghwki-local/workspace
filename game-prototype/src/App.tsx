import { useGameStore } from "@/store/gameStore";
import HubScreen from "@/ui/screens/HubScreen";
import InventoryScreen from "@/ui/screens/InventoryScreen";
import BlacksmithScreen from "@/ui/screens/BlacksmithScreen";
import DungeonScreen from "@/ui/screens/DungeonScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0a0f" }}>
      {screen === "hub" && <HubScreen />}
      {screen === "inventory" && <InventoryScreen />}
      {screen === "blacksmith" && <BlacksmithScreen />}
      {screen === "dungeon" && <DungeonScreen />}
    </div>
  );
}
