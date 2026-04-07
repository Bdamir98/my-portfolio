"use client";

import MagneticElement from "@/components/ui/MagneticElement";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FooterCTAProps {
  settings?: {
    heading: string;
    subtext: string;
  };
}

export default function FooterCTA({ settings }: FooterCTAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const heading = settings?.heading || "LET'S TALK";
  const subtext = settings?.subtext || "Have an idea?";
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    gsap.fromTo(
      ".footer-content",
      { y: 150, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} style={{ minHeight: "80vh", backgroundColor: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
      
      {/* Background radial */}
      <div style={{ position: "absolute", bottom: "-20%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "50vh", background: "radial-gradient(ellipse, rgba(200, 241, 53, 0.15) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div className="footer-content" style={{ textAlign: "center", padding: "0 2rem", zIndex: 1, willChange: "transform, opacity" }}>
        <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.875rem", color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2rem" }}>
          {subtext}
        </p>
        
        <h2 style={{ fontFamily: "var(--font-clash)", fontSize: "clamp(4rem, 12vw, 9rem)", fontWeight: 700, color: "var(--white)", lineHeight: 0.9, letterSpacing: "-0.04em", marginBottom: "4rem" }}>
          {heading.includes(" ") ? <>{heading.split(" ")[0]}<br/>{heading.split(" ").slice(1).join(" ")}</> : heading}
        </h2>

        <MagneticElement>
          <Link 
            href="/contact" 
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              color: "var(--void)",
              fontFamily: "var(--font-inter)",
              fontSize: "1.125rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s",
              boxShadow: "0 20px 40px rgba(200, 241, 53, 0.2)"
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1.05)";
              el.style.boxShadow = "0 30px 60px rgba(200, 241, 53, 0.3)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1)";
              el.style.boxShadow = "0 20px 40px rgba(200, 241, 53, 0.2)";
            }}
          >
            Start a Project
          </Link>
        </MagneticElement>
      </div>

    </section>
  );
}
