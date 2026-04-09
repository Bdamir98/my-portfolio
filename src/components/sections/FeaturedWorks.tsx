"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ProjectCard from "@/components/ui/ProjectCard";
import type { Project } from "@/lib/supabase/types";
import MagneticElement from "@/components/ui/MagneticElement";
import Link from "next/link";
import KineticText from "@/components/ui/KineticText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Props {
  projects: Project[];
}

export default function FeaturedWorks({ projects }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const capped = (projects ?? []).slice(0, 8);
  const row1 = capped.slice(0, 4);
  const row2 = capped.slice(4);
  const hasProjects = capped.length > 0;

  useGSAP(
    () => {
      if (!sectionRef.current || !hasProjects) return;

      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".fw-card", gridRef.current);
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 95%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: sectionRef, dependencies: [projects.length] }
  );

  if (!hasProjects) return null;

  // Column widths: hero card is wider, others are equal narrower columns
  const row1Cols =
    row1.length === 1
      ? "1fr"
      : row1.length === 2
      ? "1.6fr 1fr"
      : row1.length === 3
      ? "1.6fr 1fr 1fr"
      : "1.6fr 1fr 1fr 1fr";

  return (
    <section
      ref={sectionRef}
      style={{
        backgroundColor: "var(--void)",
        padding: "5rem 2.5rem 6rem",
        overflow: "hidden",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div ref={headerRef} style={{ marginBottom: "3rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
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
            Designer · Editor · Developer
          </span>
        </div>

        <KineticText
          text="Selected Works"
          tagName="h2"
          className="text-reveal"
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        />

        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "1rem",
            color: "var(--muted)",
            maxWidth: 480,
            marginTop: "1rem",
            lineHeight: 1.7,
          }}
        >
          A curated collection of my cinematic productions and interactive
          digital experiences.
        </p>
      </div>

      {/* ── Grid — max-width keeps cards from going full-screen wide ── */}
      <div
        ref={gridRef}
        style={{ maxWidth: "900px" }}
      >
        {/* ROW 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: row1Cols,
            gap: "1rem",
            marginBottom: row2.length > 0 ? "1rem" : 0,
            alignItems: "start",   // cards align to top; height = natural aspect ratio
          }}
        >
          {row1.map((proj) => (
            <div key={proj.id} className="fw-card">
              <ProjectCard project={proj} />
            </div>
          ))}
        </div>

        {/* ROW 2 + CTA */}
        {row2.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(row2.length, 3)}, 1fr) auto`,
              gap: "1rem",
              alignItems: "start",
            }}
          >
            {row2.map((proj, i) => (
              <div
                key={proj.id}
                className="fw-card"
                style={{
                  maxHeight: "210px",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}
              >
                <ProjectCard project={proj} />
              </div>
            ))}

            {/* CTA button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 1rem",
              }}
            >
              <MagneticElement>
                <Link
                  href="/work"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--white)",
                    fontFamily: "var(--font-jetbrains)",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontSize: "0.65rem",
                    textDecoration: "none",
                    transition: "border-color 0.3s, color 0.3s, background-color 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent)";
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--void)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--surface)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--white)";
                  }}
                >
                  View All →
                </Link>
              </MagneticElement>
            </div>
          </div>
        )}

        {/* CTA when only row1 (≤4 projects total) */}
        {row2.length === 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1.5rem",
            }}
          >
            <MagneticElement>
              <Link
                href="/work"
                className="fw-card"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--white)",
                  fontFamily: "var(--font-jetbrains)",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  fontSize: "0.65rem",
                  textDecoration: "none",
                  transition: "border-color 0.3s, color 0.3s, background-color 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--accent)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--void)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--white)";
                }}
              >
                View All →
              </Link>
            </MagneticElement>
          </div>
        )}
      </div>
    </section>
  );
}
