import { ImageResponse } from "next/og";
import { createStaticClient } from "@/lib/supabase/server";

export const runtime = "edge";

export const alt = "Project Preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const supabase = createStaticClient();
  const { data: project } = await (supabase as any)
    .from("projects")
    .select("title, category, cover_url")
    .eq("slug", params.slug)
    .single();

  if (!project) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "black",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          Project Not Found
        </div>
      ),
      { ...size }
    );
  }

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
        {/* Background Image with Overlay */}
        {project.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
                src={project.cover_url} 
                alt={project.title}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.4,
                }}
            />
        )}
        
        {/* Vignette Overlay */}
        <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)",
        }} />

        {/* Content */}
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
        }}>
            <div style={{
                textTransform: "uppercase",
                fontSize: 20,
                color: "#ACFF43",
                letterSpacing: "0.2em",
                marginBottom: 10,
                fontWeight: 600,
            }}>
                {project.category}
            </div>
            <div style={{
                fontSize: 84,
                fontWeight: 900,
                color: "white",
                textAlign: "center",
                padding: "0 80px",
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
            }}>
                {project.title}
            </div>
            <div style={{
                marginTop: 40,
                fontSize: 24,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.05em",
            }}>
                amirhossain.dev
            </div>
        </div>

        {/* Logo Mark */}
        <div style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
        }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ACFF43" }} />
            <div style={{ color: "white", fontSize: 24, fontWeight: 700 }}>AH</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
