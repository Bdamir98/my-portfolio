"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import type { Project } from "@/lib/supabase/types";
import { useCursorStore } from "@/store/cursorStore";
import Lightbox from "./Lightbox";
import { createClient } from "@/lib/supabase/client";

interface Props {
  project: Project;
  aspectRatioOverride?: number;
}

export default function ProjectCard({ project, aspectRatioOverride }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({
    graphics: "Graphic Design",
    motion: "Motion Graphics",
    web: "Web Dev"
  });

  const { setMode } = useCursorStore();
  const supabase = createClient();

  // Extract metadata safely
  const meta = (project.metadata as any) || {};
  let aspectRatio = aspectRatioOverride || Number(meta.aspect_ratio);

  if (isNaN(aspectRatio) || !aspectRatio) {
    if (meta.width && meta.height) {
      aspectRatio = Number(meta.width) / Number(meta.height);
    }
  }

  // Fallback defaults for specific categories if metadata is missing
  if (!aspectRatio || isNaN(aspectRatio)) {
    if (project.category === "motion" || project.category === "web") {
      aspectRatio = 1.77; // 16:9
    } else if (project.category === "poster-design") {
      aspectRatio = 0.75; // 3:4
    } else if (project.category === "thumbnail") {
      aspectRatio = 1.77; // 16:9
    } else {
      aspectRatio = 1; // Square fallback
    }
  }

  const hasVideoLink = !!meta.drive_url || !!meta.youtube_url;
  const hasVideoFile = Array.isArray(project.media_urls) && project.media_urls.some(u => typeof u === 'string' && (u.includes('.mp4') || u.includes('.webm')));
  const isGalleryItem = !hasVideoLink && !hasVideoFile && project.category !== "motion" && project.category !== "web";

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await (supabase as any).from("site_settings").select("value").eq("key", "project_categories").maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const mapping: Record<string, string> = {};
        data.value.forEach((c: any) => { mapping[c.slug] = c.name; });
        setCategoryNames(prev => ({ ...prev, ...mapping }));
      }
    };
    fetchCats();
  }, [supabase]);

  const onMouseEnter = () => {
    setIsHovered(true);
    gsap.to(cardRef.current, { scale: 1.02, duration: 0.4, ease: "expo.out" });
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.35 });
    gsap.to(btnRef.current, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });

    if (!isGalleryItem) {
      gsap.to(contentRef.current, { y: 0, opacity: 1, duration: 0.4, ease: "expo.out" });
    }
    setMode("view", isGalleryItem ? "OPEN" : "VIEW");
  };

  const onMouseLeave = () => {
    setIsHovered(false);
    gsap.to(cardRef.current, { scale: 1, duration: 0.4, ease: "expo.out" });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
    gsap.to(btnRef.current, { y: 20, opacity: 0, duration: 0.3 });

    if (!isGalleryItem) {
      gsap.to(contentRef.current, { y: 20, opacity: 0, duration: 0.3 });
    }
    setMode("default");
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isGalleryItem) {
      e.preventDefault();
      setIsLightboxOpen(true);
    }
  };

  const content = (
    <div
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      className={isLoaded ? "" : "flutter-shimmer"}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${aspectRatio}`,
        backgroundColor: "var(--surface-2)",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: isGalleryItem ? "zoom-in" : "pointer",
        transition: "transform 0.4s var(--ease-expo-out)",
      }}
    >
      <Image
        src={project.cover_url || "/placeholder.png"}
        alt={project.title}
        fill
        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
        style={{
          objectFit: "cover",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.8s var(--ease-expo-out)",
        }}
        onLoad={() => setIsLoaded(true)}
        priority
      />

      {/* Overlay for all items */}
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: isGalleryItem ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.4)",
          opacity: 0,
          transition: "opacity 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Floating View Button */}
        <div
          ref={btnRef}
          style={{
            padding: "0.35rem 0.75rem",
            backgroundColor: "var(--white)",
            color: "var(--void)",
            borderRadius: "100px",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.5rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0,
            transform: "translateY(15px)",
            pointerEvents: "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}
        >
          {isGalleryItem ? "OPEN" : "VIEW"}
        </div>
      </div>

      {/* Info Content - Only for non-gallery items - Scale down for grid density */}
      {!isGalleryItem && (
        <div
          ref={contentRef}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            padding: "0.75rem",
            transform: "translateY(15px)",
            opacity: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "100px",
              backgroundColor: "var(--accent)",
              color: "var(--void)",
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.5rem",
              fontWeight: 600,
              textTransform: "uppercase",
              width: "fit-content",
              letterSpacing: "0.05em",
            }}
          >
            {categoryNames[project.category] || project.category}
          </div>
          <h3
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--white)",
              lineHeight: 1.2,
            }}
          >
            {project.title}
          </h3>
        </div>
      )}
    </div>
  );

  return (
    <>
      {!isGalleryItem ? (
        <Link href={`/work/${project.slug}`} style={{ display: "block", textDecoration: "none" }}>
          {content}
        </Link>
      ) : (
        <div style={{ display: "block" }}>
          {content}
        </div>
      )}

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={Array.isArray(project.media_urls) ? (project.media_urls as string[]) : []}
        imageUrl={project.cover_url || ""}
        title={project.title}
        description={project.description}
      />
    </>
  );
}
