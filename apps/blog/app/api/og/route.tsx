import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Blog";
  const description = searchParams.get("description") ?? "";
  const category = searchParams.get("category") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          background: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        {/* 배경 그리드 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* 그라디언트 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #09090b 40%, transparent 100%)",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "16px" }}>
          {category && (
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#a1a1aa",
              }}
            >
              {category}
            </span>
          )}

          <h1
            style={{
              fontSize: title.length > 50 ? "48px" : "64px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                fontSize: "20px",
                color: "#71717a",
                margin: 0,
                lineHeight: 1.5,
                maxWidth: "800px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <span style={{ color: "#ffffff", fontSize: "16px", fontWeight: 700 }}>✦ BLOG</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
