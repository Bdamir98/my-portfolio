"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface MarqueeProps {
  items?: string[];
}

export default function ExpertiseMarquee({ items }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);

  const marqueeItems = items && items.length > 0 ? items : ["Photography", "Videography", "Web Dev", "Motion", "Design", "Art Direction"];
  const line1 = [...marqueeItems, ...marqueeItems];
  const line2 = [...marqueeItems.reverse(), ...marqueeItems];

  useGSAP(() => {
    if (!text1Ref.current || !text2Ref.current) return;
    
    gsap.to(text1Ref.current, { xPercent: -50, repeat: -1, duration: 25, ease: "none" });
    gsap.to(text2Ref.current, { xPercent: 50, repeat: -1, duration: 25, ease: "none" });

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const velocity = Math.abs(self.getVelocity());
        const speed = 1 + velocity / 200;
        gsap.to([text1Ref.current, text2Ref.current], { timeScale: speed, duration: 0.2, overwrite: "auto" });
      }
    });

  }, { scope: containerRef });

  const outlineStyle = {
    fontFamily: "var(--font-clash)",
    fontSize: "clamp(4rem, 12vw, 12rem)",
    fontWeight: 700,
    lineHeight: 1,
    whiteSpace: "nowrap" as const,
    color: "transparent",
    WebkitTextStroke: "2px rgba(255,255,255,0.15)",
    textTransform: "uppercase" as const,
  };

  const solidStyle = { ...outlineStyle, color: "var(--white)", WebkitTextStroke: "0" };
  const accentStyle = { ...outlineStyle, color: "var(--accent)", WebkitTextStroke: "0" };

  return (
    <section ref={containerRef} style={{ padding: "8rem 0", overflow: "hidden", backgroundColor: "var(--void)", position: "relative" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, opacity: 0.05, filter: "blur(40px)", background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", width: "50vw", height: "50vw", borderRadius: "50%" }} />

      <div ref={text1Ref} style={{ display: "flex", gap: "3rem", width: "fit-content", position: "relative", zIndex: 1 }}>
        {line1.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "3rem", alignItems: "center" }}>
            <span style={i % 2 === 0 ? solidStyle : outlineStyle}>{item}</span>
            <span style={accentStyle}>✦</span>
          </div>
        ))}
      </div>

      <div ref={text2Ref} style={{ display: "flex", gap: "3rem", width: "fit-content", marginTop: "2rem", position: "relative", zIndex: 1, transform: "translateX(-50%)" }}>
        {line2.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "3rem", alignItems: "center" }}>
            <span style={i % 2 !== 0 ? solidStyle : outlineStyle}>{item}</span>
            <span style={accentStyle}>✦</span>
          </div>
        ))}
      </div>
    </section>
  );
}
