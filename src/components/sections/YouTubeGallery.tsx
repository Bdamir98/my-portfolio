"use client";

import { useState, useMemo } from "react";
import type { YouTubeVideo } from "@/lib/supabase/types";
import YouTubePlayer from "@/components/ui/YouTubePlayer";
import KineticText from "@/components/ui/KineticText";

interface Props {
  videos: YouTubeVideo[];
  categories: string[];
}

function getThumbUrl(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

function getThumbFallback(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function YouTubeGallery({ videos, categories }: Props) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>();

  const allCategories = useMemo(() => ["all", ...categories.filter(Boolean)], [categories]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return videos;
    return videos.filter((v) => v.category === activeFilter);
  }, [videos, activeFilter]);

  const openVideo = (video: YouTubeVideo) => {
    setActiveVideoId(video.youtube_id);
    setActiveTitle(video.title);
  };

  const closeVideo = () => {
    setActiveVideoId(null);
    setActiveTitle(undefined);
  };

  return (
    <>
      <YoutubePlayerPortal videoId={activeVideoId} title={activeTitle} onClose={closeVideo} />

      <section
        style={{
          backgroundColor: "var(--void)",
          minHeight: "100vh",
          padding: "8rem 2.5rem 7rem",
        }}
      >
        {/* ── Header ── */}
        <div style={{ maxWidth: "1100px", margin: "0 auto 3.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span
              style={{
                display: "block",
                width: "2rem",
                height: "2px",
                backgroundColor: "var(--accent)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.625rem",
                color: "var(--accent)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              YouTube Channel
            </span>
          </div>

          <KineticText
            text="Video Works"
            tagName="h1"
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
              fontWeight: 700,
              color: "var(--white)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: "1rem",
            }}
          />

          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "1rem",
              color: "var(--muted)",
              maxWidth: 480,
              lineHeight: 1.7,
              marginBottom: "2.5rem",
            }}
          >
            Cinematic productions, motion graphics, and creative highlights — straight from my
            YouTube channel.
          </p>

          {/* ── Filter tabs ── */}
          {allCategories.length > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {allCategories.map((cat) => {
                const active = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    style={{
                      padding: "0.375rem 1rem",
                      borderRadius: "100px",
                      border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                      backgroundColor: active ? "var(--accent-dim)" : "transparent",
                      color: active ? "var(--accent)" : "var(--muted)",
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: "0.625rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {cat === "all" ? "All Videos" : cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6rem 2rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                color: "var(--muted)",
                fontSize: "1rem",
              }}
            >
              No videos found.
            </p>
          </div>
        ) : (
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filtered.map((video) => (
              <VideoCard key={video.id} video={video} onPlay={openVideo} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ── Lazy import portal to prevent SSR issues ──────────────────────────────────
function YoutubePlayerPortal({
  videoId,
  title,
  onClose,
}: {
  videoId: string | null;
  title?: string;
  onClose: () => void;
}) {
  return <YouTubePlayer videoId={videoId} title={title} onClose={onClose} />;
}

// ── Video Card ────────────────────────────────────────────────────────────────
function VideoCard({
  video,
  onPlay,
}: {
  video: YouTubeVideo;
  onPlay: (v: YouTubeVideo) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onPlay(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        backgroundColor: "var(--surface)",
        border: `1px solid ${hovered ? "rgba(200,241,53,0.25)" : "var(--border)"}`,
        cursor: "pointer",
        transition: "border-color 0.3s, transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,241,53,0.1)"
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          overflow: "hidden",
          backgroundColor: "#0a0a0d",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgError ? getThumbFallback(video.youtube_id) : getThumbUrl(video.youtube_id)}
          alt={video.title}
          onError={() => setImgError(true)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
        />

        {/* Dark overlay on hover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.25)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        />

        {/* Play button */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${hovered ? 1 : 0.75})`,
            opacity: hovered ? 1 : 0,
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px rgba(200,241,53,0.5)",
          }}
        >
          <span
            style={{
              color: "var(--void)",
              fontSize: "1.5rem",
              marginLeft: "4px",
              lineHeight: 1,
            }}
          >
            ▶
          </span>
        </div>

        {/* Category chip */}
        {video.category && (
          <div
            style={{
              position: "absolute",
              top: "0.75rem",
              left: "0.75rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "100px",
              backgroundColor: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.5625rem",
              color: "var(--muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {video.category}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "1.25rem" }}>
        <p
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--white)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            marginBottom: "0.5rem",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {video.title}
        </p>
        {video.description && (
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.8125rem",
              color: "var(--muted)",
              lineHeight: 1.6,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {video.description}
          </p>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "0.375rem",
              flexWrap: "wrap",
              marginTop: "0.875rem",
            }}
          >
            {video.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "4px",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.5rem",
                  color: "var(--muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
