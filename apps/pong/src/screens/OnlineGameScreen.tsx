import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { OnlinePongScene } from '@/game/OnlinePongScene';
import type { OnlineSession } from './OnlineLobbyScreen';

interface Props {
  session: OnlineSession;
  onBack:  () => void;
}

export default function OnlineGameScreen({ session, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      backgroundColor: '#000000',
      parent: containerRef.current,
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 450, height: 800,
        parent: containerRef.current,
      },
      input: { activePointers: 2 },
    });
    gameRef.current = game;

    game.events.once('ready', () => {
      game.scene.add('OnlinePongScene', OnlinePongScene, true, {
        ...session,
        onBack: () => {
          game.destroy(true);
          gameRef.current = null;
          onBack();
        },
      });
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
        position: 'fixed', inset: 0,
        background: '#000',
        touchAction: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    />
  );
}
