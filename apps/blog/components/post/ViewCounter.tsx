"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  postId: number;
  initialCount?: number;
}

export default function ViewCounter({ postId, initialCount = 0 }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    fetch(`/api/views/${postId}`, { method: "POST" })
      .then((r) => r.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === "number") setCount(data.count);
      })
      .catch(() => null);
  }, [postId]);

  return (
    <span className="flex items-center gap-1 text-xs text-zinc-600">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count.toLocaleString()}
    </span>
  );
}
