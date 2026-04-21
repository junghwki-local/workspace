import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { PongScene } from "@/game/PongScene";
import type { GameMode, PaddleSkin } from "@/App";

export default function PongScreen({
  mode,
  skinP1,
  skinP2,
  onBack,
}: {
  mode: GameMode;
  skinP1: PaddleSkin;
  skinP2: PaddleSkin;
  onBack: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      backgroundColor: "#000000",
      parent: containerRef.current,
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 450,
        height: 800,
        parent: containerRef.current,
      },
      input: { activePointers: 4 },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once("ready", () => {
      game.scene.add("PongScene", PongScene, true, { mode, skinP1, skinP2, onBack });
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed", inset: 0,
        background: "#000",
        touchAction: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    />
  );
}
