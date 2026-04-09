"use client";

import { useState } from "react";
import Link from "next/link";
import type { YouTubeVideo } from "@/lib/supabase/types";
import YouTubePlayer from "@/components/ui/YouTubePlayer";
import KineticText from "@/components/ui/KineticText";
import MagneticElement from "@/components/ui/MagneticElement";

interface Props {
  videos: YouTubeVideo[];
}

export default function YouTubePreview({ videos }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>();

  if (!videos || videos.length === 0) return null;

  const capped = videos.slice(0, 3);

  return (
    <>
      <YouTubePlayer
        videoId={activeId}
        title={activeTitle}
        onClose={() => { setActiveId(null); setActiveTitle(undefined); }}
      />

      <section
        style={{
          backgroundColor: "var(--void)",
          padding: "5rem 2.5rem 6rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ display: "block", width: "2rem", height: "2px", backgroundColor: "#FF0000" }} />
            <span
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.625rem",
                color: "#FF0000",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              YouTube Channel
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <KineticText
              text="From My Channel"
              tagName="h2"
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 700,
                color: "var(--white)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            />

            <MagneticElement>
              <Link
                href="/videos"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border)",
                  backgroundColor: "transparent",
                  color: "var(--muted)",
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.625rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "all 0.3s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FF0000";
                  e.currentTarget.style.color = "#FF0000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                All Videos →
              </Link>
            </MagneticElement>
          </div>
        </div>

        {/* Video cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: capped.length === 1 ? "min(100%, 600px)" : "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
            maxWidth: "900px",
          }}
        >
          {capped.map((video) => (
            <PreviewCard
              key={video.id}
              video={video}
              onPlay={() => { setActiveId(video.youtube_id); setActiveTitle(video.title); }}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function PreviewCard({ video, onPlay }: { video: YouTubeVideo; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "14px",
        overflow: "hidden",
        backgroundColor: "var(--surface)",
        border: `1px solid ${hovered ? "rgba(255,0,0,0.25)" : "var(--border)"}`,
        cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: hovered ? "0 16px 48px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.2)",
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", paddingBottom: "56.25%", overflow: "hidden", backgroundColor: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
          alt={video.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Red play button */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${hovered ? 1 : 0.8})`,
            opacity: hovered ? 1 : 0,
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#FF0000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 30px rgba(255,0,0,0.5)",
          }}
        >
          <span style={{ color: "#fff", fontSize: "1.125rem", marginLeft: "3px" }}>▶</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "1rem 1.125rem" }}>
        <p
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--white)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {video.title}
        </p>
        {video.category && (
          <p
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.5rem",
              color: "var(--muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: "0.4rem",
            }}
          >
            {video.category}
          </p>
        )}
      </div>
    </div>
  );
}
