import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background:
            "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.25), rgba(2,6,23,0) 55%), radial-gradient(circle at 80% 30%, rgba(56,189,248,0.18), rgba(2,6,23,0) 60%), linear-gradient(180deg, #020617 0%, #0b1220 100%)",
          color: "#e2e8f0",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(20,184,166,0.16)",
              border: "1px solid rgba(20,184,166,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#5eead4",
            }}
          >
            Z
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
            Zenny
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 66,
            fontWeight: 850,
            letterSpacing: -1.2,
            lineHeight: 1.05,
          }}
        >
          Bookkeeping on Autopilot.
        </div>

        <div style={{ marginTop: 22, fontSize: 28, color: "#cbd5e1" }}>
          AI receipt capture, smart categorization, and tax-ready exports.
        </div>

        <div
          style={{
            marginTop: 34,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 20,
            color: "#94a3b8",
          }}
        >
          <span>AI receipts</span>
          <span>•</span>
          <span>Review Queue</span>
          <span>•</span>
          <span>Smart Rules</span>
          <span>•</span>
          <span>Plaid</span>
          <span>•</span>
          <span>Exports</span>
        </div>
      </div>
    ),
    size
  );
}


