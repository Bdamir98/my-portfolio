"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "@/lib/supabase/types";
import Lightbox from "@/components/ui/Lightbox";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CATEGORY_LABELS: Record<string, string> = {
  graphics: "Graphic Design",
  motion: "Motion Graphics",
  web: "Web Development",
};

const formatCategory = (cat: string) => {
  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
  return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

/** Extracts a YouTube video embed URL from any common YouTube link format */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;

    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1];
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      }
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
      : null;
  } catch {
    return null;
  }
}

interface Props {
  project: Project;
  related: Project[];
}

export default function ProjectDetail({ project, related }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<Record<number, boolean>>({});
  const [loadedRelated, setLoadedRelated] = useState<Record<string, boolean>>({});

  const mediaUrls = useMemo(() =>
    Array.isArray(project.media_urls) ? project.media_urls as string[] : [],
    [project.media_urls]
  );

  // Horizontal scroll for photo series
  useEffect(() => {
    if (mediaUrls.length < 2) return;
    const h = horizontalRef.current;
    const track = trackRef.current;
    if (!h || !track) return;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: h,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });
    });

    return () => ctx.revert();
  }, [mediaUrls]);

  // Entrance animation
  useEffect(() => {
    const els = [heroRef.current, metaRef.current].filter(Boolean);
    gsap.fromTo(
      els,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.1 }
    );
  }, []);

  const year = project.shoot_date
    ? new Date(project.shoot_date).getFullYear()
    : new Date(project.created_at || "").getFullYear();

  // Project Detail Parallax & Reveal Animations
  useEffect(() => {
    const heroImage = heroRef.current?.querySelector("img");
    if (heroImage) {
      gsap.to(heroImage, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    // Reveal stagger for specs
    const specItems = metaRef.current?.querySelectorAll(".spec-item");
    if (specItems) {
      gsap.fromTo(specItems,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: metaRef.current, start: "top 90%" } }
      );
    }
  }, []);

  // Magnetic Button Effect for Back Link
  const handleMagnetic = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(btn, {
      x: x * 0.4,
      y: y * 0.4,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const resetMagnetic = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.3)"
    });
  };

  return (
    <article>
      {/* Boxed hero */}
      <div
        ref={heroRef}
        style={{
          maxWidth: "1400px",
          margin: "120px auto 0",
          padding: "0 2.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "2rem" }}>
          <Link
            href="/work"
            onMouseMove={handleMagnetic}
            onMouseLeave={resetMagnetic}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.625rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--white)",
              textDecoration: "none",
              backgroundColor: "var(--surface-2)",
              padding: "0.75rem 1.5rem",
              borderRadius: "100px",
              border: "1px solid var(--border)",
              transition: "border-color 0.3s",
              position: "relative",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: "1rem" }}>←</span> Back to Work
          </Link>
        </div>
        <div className={isCoverLoaded ? "" : "flutter-shimmer"} style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}>
          {project.cover_url ? (
            project.cover_url.includes(".mp4") || project.cover_url.includes(".webm") ? (
              <video
                src={project.cover_url}
                autoPlay
                muted
                loop
                playsInline
                onLoadedData={() => setIsCoverLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.1)" }}
              />
            ) : (
              <Image
                src={project.cover_url}
                alt={project.title}
                fill
                priority
                onLoad={() => setIsCoverLoaded(true)}
                style={{ objectFit: "cover", objectPosition: "center", transform: "scale(1.1)" }} // scale for parallax buffer
                sizes="(max-width: 1400px) 100vw, 1400px"
              />
            )
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "clamp(4rem, 15vw, 12rem)",
                  fontWeight: 700,
                  color: "var(--border)",
                  letterSpacing: "-0.04em",
                }}
              >
                {project.title.charAt(0)}
              </span>
            </div>
          )}
          {/* Category badge */}
          <div
            style={{
              position: "absolute",
              top: "1.5rem",
              left: "1.5rem",
            }}
          >
            <span
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "100px",
                border: "1px solid rgba(200,241,53,0.35)",
                backgroundColor: "rgba(200,241,53,0.12)",
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.6875rem",
                color: "var(--accent)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                backdropFilter: "blur(4px)",
              }}
            >
              {formatCategory(project.category)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "4rem 2.5rem",
        }}
      >
        {/* Project Header & Metadata (Specs) */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "4rem",
          marginBottom: "6rem"
        }}>
          <h1
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: 700,
              color: "var(--white)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            {project.title}
          </h1>

          <div
            ref={metaRef}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            {[
              { label: "Client", value: project.client },
              { label: "Year", value: year },
              { label: "Location", value: project.location },
              { label: "Role", value: formatCategory(project.category) },
            ].filter(s => s.value).map((spec, i) => (
              <div key={i} className="spec-item" style={{ minWidth: "140px" }}>
                <p style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.5625rem",
                  color: "var(--muted)",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                  fontWeight: 600
                }}>
                  {spec.label}
                </p>
                <p style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "1.125rem",
                  color: "var(--white)",
                  margin: 0,
                  fontWeight: 500
                }}>
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative / Description */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "4rem",
          marginBottom: "8rem"
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-inter)",
              fontSize: "1.5rem",
              color: "var(--white)",
              lineHeight: 1.4,
              fontWeight: 400,
              margin: 0,
              whiteSpace: "pre-wrap"
            }}>
              {project.description}
            </p>
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "4rem" }}>
            {project.long_description && (
              <div
                dangerouslySetInnerHTML={{ __html: project.long_description }}
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "1.0625rem",
                  color: "var(--muted)",
                  lineHeight: 1.8,
                }}
              />
            )}
          </div>
        </div>

        {/* Google Drive Video Player — shown for any project with a drive_url in metadata */}
        {(project.metadata as any)?.drive_url && (
          <div style={{ marginBottom: "6rem" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem" }}>Project Video</p>
            <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "var(--surface)", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border)" }}>
              <iframe
                src={((project.metadata as any).drive_url as string).replace(/\/view.*$/, "/preview")}
                width="100%"
                height="100%"
                allow="autoplay; fullscreen"
                style={{ border: "none" }}
              ></iframe>
            </div>
          </div>
        )}

        {/* YouTube Video Player — shown for any project with a youtube_url in metadata */}
        {(project.metadata as any)?.youtube_url && getYouTubeEmbedUrl((project.metadata as any).youtube_url) && (
          <div style={{ marginBottom: "6rem" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem" }}>YouTube Video</p>
            <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "var(--surface)", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border)" }}>
              <iframe
                src={getYouTubeEmbedUrl((project.metadata as any).youtube_url)!}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: "none" }}
              ></iframe>
            </div>
          </div>
        )}

        {/* Tech stack — web projects */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div style={{ marginBottom: "6rem" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem" }}>Tech Stack</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  style={{
                    padding: "0.5rem 1.25rem",
                    border: "1px solid var(--border)",
                    borderRadius: "100px",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "0.75rem",
                    color: "var(--white)",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTAs for web projects */}
        {(project.external_url || project.github_url) && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "6rem", flexWrap: "wrap" }}>
            {project.external_url && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1rem 2.5rem",
                  backgroundColor: "var(--accent)",
                  color: "var(--void)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  borderRadius: "100px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "transform 0.3s var(--ease-expo-out)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Live Demo
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 14l10-10m0 0H6m8 0v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1rem 2.5rem",
                  border: "1px solid var(--border)",
                  color: "var(--white)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  borderRadius: "100px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                GitHub
              </a>
            )}
          </div>
        )}
      </div>

      {/* Horizontal scroll gallery — for photography / media / process */}
      {mediaUrls.length > 0 && (
        <div ref={horizontalRef} style={{ overflow: "hidden", marginBottom: "8rem" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2.5rem 2rem" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase" }}>Project Gallery</p>
          </div>
          <div
            ref={trackRef}
            style={{
              display: "flex",
              gap: "1.5rem",
              padding: "0 2.5rem",
              width: "max-content",
            }}
          >
            {mediaUrls.map((url, i) => (
              <div
                key={i}
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className={loadedGalleryImages[i] ? "" : "flutter-shimmer"}
                style={{
                  position: "relative",
                  width: "45vw",
                  maxWidth: "700px",
                  height: "40dvh",
                  borderRadius: "12px",
                  overflow: "hidden",
                  flexShrink: 0,
                  backgroundColor: "var(--surface)",
                  cursor: "zoom-in",
                }}
              >
                {url.includes(".mp4") || url.includes(".webm") ? (
                  <video
                    src={url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={() => setLoadedGalleryImages(prev => ({ ...prev, [i]: true }))}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Image
                    src={url}
                    alt={`${project.title} ${i + 1}`}
                    fill
                    sizes="70vw"
                    onLoad={() => setLoadedGalleryImages(prev => ({ ...prev, [i]: true }))}
                    style={{ objectFit: "contain" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related projects */}
      {related.length > 0 && (
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 2.5rem 6rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "2rem" }}>
            Related Work
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: "1.5rem",
            }}
          >
            {related.slice(0, 3).map((p) => {
              const relYear = p.shoot_date ? new Date(p.shoot_date).getFullYear() : "";
              return (
                <Link
                  key={p.id}
                  href={`/work/${p.slug}`}
                  style={{
                    display: "block",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  }}
                >
                  <div className={loadedRelated[p.id] ? "" : "flutter-shimmer"} style={{ aspectRatio: "4/3", position: "relative", backgroundColor: "var(--surface-2)" }}>
                    {p.cover_url && (
                      <Image src={p.cover_url} alt={p.title} fill style={{ objectFit: "cover" }} sizes="33vw" onLoad={() => setLoadedRelated(prev => ({ ...prev, [p.id]: true }))} />
                    )}
                  </div>
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <p style={{ fontFamily: "var(--font-clash)", fontSize: "1rem", fontWeight: 600, color: "var(--white)" }}>{p.title}</p>
                    <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--muted)", marginTop: "0.25rem" }}>{relYear}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox for Gallery */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={mediaUrls}
        title={project.title}
        initialIndex={lightboxIndex}
      />
    </article>
  );
}
