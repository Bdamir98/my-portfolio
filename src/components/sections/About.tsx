"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AboutProps {
  settings?: {
    title: string;
    story_tagline: string;
    philosophy: string[];
    image_url: string;
    location_label: string;
    expertise: { category: string; items: string[]; pct: number }[];
    timeline: { year: string; role: string; company: string; desc: string }[];
    metrics: { label: string; value: string }[];
  };
}

export default function About({ settings }: AboutProps) {
  const title = settings?.title || "About Me";
  const storyTagline = settings?.story_tagline || "The Story";
  const locationLabel = settings?.location_label || "📍 Bangladesh";
  const philosophy = settings?.philosophy || [
    "I'm Amir Hossain — a visual storyteller and creative developer."
  ];
  const imageUrl = settings?.image_url || "/photo.png";
  const expertise = settings?.expertise || [];
  const timeline = settings?.timeline || [];
  const metrics = settings?.metrics || [];
  const cvUrl = (settings as any)?.cv_url || "#";

  const containerRef = useRef<HTMLElement>(null);
  const skillBarRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Skill bar fills on scroll
    skillBarRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const pct = expertise[i].pct;
      ScrollTrigger.create({
        trigger: bar,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            bar,
            { width: "0%" },
            { width: `${pct}%`, duration: 1.4, ease: "expo.out" }
          );
        },
      });
    });

    // Timeline entrance
    const items = timelineRef.current?.querySelectorAll("[data-timeline]");
    if (items) {
      items.forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.fromTo(item, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "expo.out" });
          },
        });
      });
    }

    // Metrics entrance
    const metrics = metricsRef.current?.querySelectorAll(".metric-box");
    if (metrics && metricsRef.current) {
      ScrollTrigger.create({
        trigger: metricsRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            metrics,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "expo.out" }
          );
        },
      });
    }
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "6rem 2.5rem",
      }}
    >
      {/* Header */}
      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ display: "inline-block", width: 32, height: 1, backgroundColor: "var(--accent)" }} />
        {storyTagline}
      </p>
      <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "clamp(2.5rem, 7vw, 6rem)", fontWeight: 700, color: "var(--white)", lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: "4rem" }}>
        {title.includes(" ") ? <>{title.split(" ")[0]}<br /><span style={{ color: "var(--accent)" }}>{title.split(" ").slice(1).join(" ")}</span></> : title}
      </h1>

      {/* Split layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6rem",
          alignItems: "start",
          marginBottom: "6rem",
        }}
      >
        {/* Photo Container */}
        <div
          style={{
            position: "relative",
            aspectRatio: "3/4",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <Image
            src={imageUrl}
            alt="Amir Hossain"
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Accent label */}
          <div style={{ position: "absolute", bottom: "1.5rem", left: "1.5rem", padding: "0.5rem 1rem", backgroundColor: "rgba(5,5,7,0.7)", borderRadius: "100px", border: "1px solid var(--border)", backdropFilter: "blur(12px)", zIndex: 10, pointerEvents: "none" }}>
            <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--accent)", letterSpacing: "0.15em" }}>
              {locationLabel}
            </span>
          </div>
        </div>

        {/* Philosophy */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          {philosophy.map((para, i) => (
            <p key={i} style={{ fontFamily: "var(--font-inter)", fontSize: i === 0 ? "1.125rem" : "1rem", color: "var(--muted)", lineHeight: 1.85, marginBottom: i === philosophy.length - 1 ? "3rem" : "2rem" }}>
              {para}
            </p>
          ))}

          {/* Download CV */}
          <div>
            <a
              href="#"
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.875rem 2rem",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                fontFamily: "var(--font-inter)",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--white)",
                textDecoration: "none",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--white)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3 7l4 4 4-4M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Download CV
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div
        ref={metricsRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          marginBottom: "8rem",
          padding: "3rem",
          backgroundColor: "var(--surface)",
          borderRadius: "16px",
          border: "1px solid var(--border)"
        }}
      >
        {metrics.map((metric, idx) => (
          <div key={idx} className="metric-box" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-clash)", fontSize: "3.5rem", fontWeight: 700, color: "var(--white)", lineHeight: 1 }}>
              {metric.value}
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {metric.label}
            </span>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div style={{ marginBottom: "8rem" }}>
        <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "3rem" }}>Expertise</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))", gap: "3rem" }}>
          {expertise.map((skill, i) => (
            <div key={skill.category}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <p style={{ fontFamily: "var(--font-clash)", fontSize: "1.125rem", fontWeight: 600, color: "var(--white)" }}>{skill.category}</p>
                <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--accent)" }}>{skill.pct}%</span>
              </div>
              {/* Bar track */}
              <div style={{ height: 2, backgroundColor: "var(--border)", borderRadius: 1, marginBottom: "1rem", overflow: "hidden" }}>
                <span
                  ref={(el) => { skillBarRefs.current[i] = el; }}
                  style={{
                    display: "block",
                    height: "100%",
                    width: 0,
                    backgroundColor: "var(--accent)",
                    borderRadius: 1,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {skill.items.map((item) => (
                  <span key={item} style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--muted)", letterSpacing: "0.1em", padding: "0.25rem 0.625rem", border: "1px solid var(--border)", borderRadius: "100px" }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div ref={timelineRef}>
        <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "3rem" }}>Experience</p>
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 1, backgroundColor: "var(--border)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            {timeline.map((item, idx) => (
              <div key={idx} data-timeline style={{ display: "flex", gap: "2rem" }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.6875rem", color: "var(--muted)", letterSpacing: "0.08em" }}>{item.year}</p>
                </div>
                <div style={{ paddingLeft: "2rem", flex: 1 }}>
                  <h3 style={{ fontFamily: "var(--font-clash)", fontSize: "1.25rem", fontWeight: 600, color: "var(--white)", marginBottom: "0.25rem" }}>{item.role}</h3>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--accent)", marginBottom: "0.5rem" }}>{item.company}</p>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
