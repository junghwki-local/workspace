import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useGameStore } from "@/store/gameStore";
import { DungeonScene } from "@/game/scenes/DungeonScene";
import type { Grade } from "@/types";

export default function DungeonScreen() {
  const { party, setScreen, onDungeonComplete, healParty } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const sceneData = {
      party,
      onComplete: (gold: number, grade: Grade) => {
        onDungeonComplete(gold, grade);
        game.destroy(true);
        gameRef.current = null;
        setScreen("hub");
      },
      onFail: () => {
        healParty();
        game.destroy(true);
        gameRef.current = null;
        setScreen("hub");
      },
    };

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      backgroundColor: "#0a0a0f",
      parent: containerRef.current,
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        parent: containerRef.current,
      },
      input: {
        activePointers: 3,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once("ready", () => {
      game.scene.add("DungeonScene", DungeonScene, true, sceneData);
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0f",
        overflow: "hidden",
        touchAction: "none",
      }}
    />
  );
}
