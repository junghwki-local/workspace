"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
