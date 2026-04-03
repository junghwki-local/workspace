"use client";
import { useEffect, useRef, useState } from "react";
import { prepare, layout } from "@chenglou/pretext";

interface Props {
  text: string;
  maxLines?: number;
  className?: string;
}

export default function PostExcerpt({ text, maxLines = 2, className }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [display, setDisplay] = useState(text.slice(0, 120));

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    const width = el.clientWidth;
    if (width === 0) return;

    const style = getComputedStyle(el);
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily;
    const lineHeightRaw = style.lineHeight;
    const lineHeight =
      lineHeightRaw === "normal"
        ? parseFloat(fontSize) * 1.5
        : parseFloat(lineHeightRaw);
    const font = `${fontSize} ${fontFamily}`;

    // 전체 텍스트가 maxLines 이하면 그대로 표시
    const fullPrepared = prepare(text, font);
    const { lineCount: fullLines } = layout(fullPrepared, width, lineHeight);
    if (fullLines <= maxLines) {
      setDisplay(text);
      return;
    }

    // binary search: maxLines에 딱 맞는 최대 글자 수 탐색
    const chars = [...text]; // surrogate pair 안전
    let lo = 0;
    let hi = chars.length;

    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const slice = chars.slice(0, mid).join("");
      const prepared = prepare(slice, font);
      const { lineCount } = layout(prepared, width, lineHeight);
      if (lineCount <= maxLines) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    const truncated = chars.slice(0, lo).join("").trimEnd();
    setDisplay(truncated + "…");
  }, [text, maxLines]);

  return (
    <p ref={ref} className={className}>
      {display}
    </p>
  );
}
