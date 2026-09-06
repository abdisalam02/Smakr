import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Smakr — Oslo Live Food Discovery & Foodie Radar";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Soft Radial Ambient Glow */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 85, 0, 0.18) 0%, rgba(9, 9, 11, 0) 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Minimalist 'S' Vector Icon (No Box) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
          <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
            <path
              d="M24 9.5C24 6 20.5 4 16 4C10.5 4 7 7 7 11C7 16.5 25 14.5 25 21C25 25.5 21 28 16 28C10 28 6.5 25 6 20.5"
              stroke="#ff5500"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Brand Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "64px", fontWeight: "900", color: "#ff5500", letterSpacing: "-0.04em" }}>
            S
          </span>
          <span style={{ fontSize: "64px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.04em" }}>
            makr
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#a1a1aa",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginTop: "12px",
          }}
        >
          Oslo Live Food Discovery & Radar
        </div>

        {/* Categories Preview */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: "500",
            color: "#71717a",
            marginTop: "24px",
            display: "flex",
            gap: "16px",
          }}
        >
          <span>☕ Vietnamese Coconut Coffee</span>
          <span>•</span>
          <span>🥐 Sourdough Cardamom Buns</span>
          <span>•</span>
          <span>🍜 Artisan Ramen</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
