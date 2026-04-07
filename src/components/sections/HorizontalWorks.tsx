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

export default function HorizontalWorks({ projects }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !scrollWrapperRef.current) return;

    const items = gsap.utils.toArray(".horizontal-item", scrollWrapperRef.current);
    
    // Measure total width to scroll
    const totalWidth = scrollWrapperRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;
    
    // Only pin if content overflows width
    if (totalWidth <= viewportWidth) return;

    const amountToScroll = totalWidth - viewportWidth;

    gsap.to(items, {
      x: () => -amountToScroll,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1, // Smooth scrubbing
        end: () => `+=${amountToScroll}`, // End when the full distance has scrolled
        invalidateOnRefresh: true,
      }
    });

  }, { scope: containerRef, dependencies: [projects] });

  if (!projects || projects.length === 0) return null;

  return (
    <section ref={containerRef} style={{ overflow: "hidden", backgroundColor: "var(--void)", marginTop: "5rem" }}>
      <div style={{ padding: "0 2.5rem", marginBottom: "3rem" }}>
        <KineticText 
          text="Selected Works"
          tagName="h2"
          className="text-reveal"
          style={{ 
            fontFamily: "var(--font-clash)", 
            fontSize: "clamp(2.5rem, 6vw, 5rem)", 
            fontWeight: 700, 
            color: "var(--white)", 
            letterSpacing: "-0.02em" 
          }}
        />
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "1rem", color: "var(--muted)", maxWidth: 500, marginTop: "1rem", lineHeight: 1.7 }}>
          A curated collection of my cinematic productions and interactive digital experiences.
        </p>
      </div>

      <div style={{ height: "70vh", display: "flex", alignItems: "center" }}>
        <div 
          ref={scrollWrapperRef}
          style={{ 
            display: "flex", 
            paddingLeft: "2.5rem",
            paddingRight: "5rem",
            gap: "2.5rem",
            width: "max-content",
            alignItems: "stretch"
          }}
        >
          {projects.map((proj) => {
            const meta = (proj.metadata as any) || {};
            const isGallery = proj.category !== "motion" && proj.category !== "web";
            // For gallery items, use a standard portrait height and let width be auto
            // For motion/web, use a standard landscape height
            const width = isGallery ? "calc(70vh * 0.75)" : "calc(60vh * 1.6)";
            
            return (
              <div 
                key={proj.id} 
                className="horizontal-item" 
                style={{ 
                  width: proj.category === "motion" || proj.category === "web" ? "clamp(400px, 50vw, 800px)" : "clamp(300px, 35vh, 500px)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <div style={{ width: "100%" }}>
                  <ProjectCard project={proj} />
                </div>
              </div>
            );
          })}
          
          <div 
            className="horizontal-item"
            style={{ width: "300px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
             <MagneticElement>
               <Link 
                 href="/work" 
                 style={{
                   display: "inline-flex",
                   alignItems: "center",
                   justifyContent: "center",
                   width: 140,
                   height: 140,
                   borderRadius: "50%",
                   backgroundColor: "var(--surface)",
                   border: "1px solid var(--border)",
                   color: "var(--white)",
                   fontFamily: "var(--font-jetbrains)",
                   textTransform: "uppercase",
                   letterSpacing: "0.15em",
                   fontSize: "0.75rem",
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
      </div>
    </section>
  );
}
