import { ImageResponse } from "next/og";
import { AUTHOR_SHORT_NAME } from "@/lib/site-config";

export const runtime = "edge";
export const alt = `${AUTHOR_SHORT_NAME} — Consultor de IA & Desarrollo`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A0A0A",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,162,39,0.16), transparent 65%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 72,
            height: 72,
            borderRadius: 4,
            border: "1.5px solid #C9A227",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", color: "#C9A227", fontSize: 34 }}>策</div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#C9A227",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Estrategia · Tecnología · Inteligencia Artificial
        </div>

        <div
          style={{
            display: "flex",
            color: "#F5F5F5",
            fontSize: 64,
            fontWeight: 600,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.15,
          }}
        >
          {AUTHOR_SHORT_NAME}
        </div>

        <div
          style={{
            display: "flex",
            color: "#D9D9D9",
            fontSize: 28,
            marginTop: 20,
          }}
        >
          Consultor de IA & Desarrollo
        </div>
      </div>
    ),
    { ...size }
  );
}
