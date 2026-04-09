import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Amir Hossain — Creative Portfolio";
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
          background: "#050507",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Radial glow background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(172,255,67,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Center content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          {/* Accent label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: "#ACFF43",
              }}
            />
            <div
              style={{
                textTransform: "uppercase",
                fontSize: 16,
                color: "#ACFF43",
                letterSpacing: "0.3em",
                fontWeight: 600,
              }}
            >
              Creative Portfolio
            </div>
            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: "#ACFF43",
              }}
            />
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 100,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            Amir Hossain
          </div>

          {/* Tagline */}
          <div
            style={{
              marginTop: 24,
              fontSize: 26,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.05em",
              textAlign: "center",
            }}
          >
            Photography · Videography · Web Development
          </div>
        </div>

        {/* Bottom logo mark */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#ACFF43",
            }}
          />
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 700 }}>
            amirhossain.dev
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
