"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import Image from "next/image";
import MagneticElement from "@/components/ui/MagneticElement";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

interface HeroProps {
  settings?: {
    title: string;
    tagline: string;
    subtext: string;
    rotating_words: string[];
    stats: { value: number; label: string }[];
    reveal_image: string;
  };
}

export default function Hero({ settings }: HeroProps) {
  const rotatingWords = settings?.rotating_words || ["Creative.", "Visual.", "Digital.", "Cinematic.", "Artistic."];
  const stats = settings?.stats || [
    { value: 120, label: "Projects" },
    { value: 5, label: "Years" },
    { value: 48, label: "Clients" },
  ];
  const title = settings?.title || "Amir Hossain";
  const tagline = settings?.tagline || "Photographer · Videographer · Developer";
  const subtext = settings?.subtext || "Crafting cinematic visuals and digital experiences that leave a lasting impression. Based in Bangladesh, working worldwide.";
  const revealImage = settings?.reveal_image || "/abstract-reveal.png";

  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const statsRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const scrollArrowRef = useRef<HTMLDivElement>(null);
  const hoverImageRef = useRef<HTMLDivElement>(null);
  const [currentWord, setCurrentWord] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 }); // Out of sight initially
  const [isHoveringWord, setIsHoveringWord] = useState(false);
  const [isRevealLoaded, setIsRevealLoaded] = useState(false);

  // WebGL-like noise canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Animated radial gradient orbs
      const orbs = [
        { x: 0.2, y: 0.3, r: 0.4, color: "rgba(200,241,53,0.04)" },
        { x: 0.8, y: 0.7, r: 0.35, color: "rgba(200,241,53,0.025)" },
        { x: 0.5 + Math.sin(t * 0.5) * 0.1, y: 0.5 + Math.cos(t * 0.4) * 0.1, r: 0.28, color: "rgba(200,241,53,0.015)" },
      ];

      orbs.forEach(({ x, y, r, color }) => {
        const grd = ctx.createRadialGradient(
          x * width, y * height, 0,
          x * width, y * height, r * Math.max(width, height)
        );
        grd.addColorStop(0, color);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
      });

      t += 0.01;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Track global mouse position for ambient hero grid glow and image reveal
  useGSAP(() => {
    let xTo: gsap.QuickToFunc | undefined;
    let yTo: gsap.QuickToFunc | undefined;

    if (hoverImageRef.current) {
      xTo = gsap.quickTo(hoverImageRef.current, "x", { duration: 0.6, ease: "power3" });
      yTo = gsap.quickTo(hoverImageRef.current, "y", { duration: 0.6, ease: "power3" });
    }

    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (xTo && yTo) {
        xTo(e.clientX + 20); // Smooth floating offset from cursor
        yTo(e.clientY + 20);
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  });

  // Animate floating image reveal
  useGSAP(() => {
    if (!hoverImageRef.current) return;
    if (isHoveringWord) {
      gsap.to(hoverImageRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)", rotation: 2 });
    } else {
      gsap.to(hoverImageRef.current, { scale: 0.4, opacity: 0, duration: 0.4, ease: "power2.inOut", rotation: -5 });
    }
  }, [isHoveringWord]);

  // Rotating words interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  // Animate word change
  useGSAP(() => {
    const el = wordRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }
    );
  }, [currentWord]);

  // Main UI Entrance Animations
  useGSAP(() => {
    // Stats counter
    statsRefs.current.forEach((el, i) => {
      if (!el) return;
      const target = stats[i].value;
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 1.8,
        delay: 0.6, // Start slightly after header text appears
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toString();
        },
      });
    });

    // Scroll indicator bounce
    if (scrollArrowRef.current) {
      gsap.to(scrollArrowRef.current, {
        y: 10,
        duration: 1.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    // Cinematic Entrance animation
    const hero = heroRef.current;
    if (!hero) return;

    const tl = gsap.timeline({ delay: 0.2 });

    // Text scramble character appearance for main headlines
    tl.fromTo(
      ".hero-char",
      { y: 80, opacity: 0, rotateX: -90, filter: "blur(8px)" },
      { y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: 0.03 },
      0
    );

    // Normal slide reveal for sub-elements
    const els = hero.querySelectorAll("[data-reveal]");
    tl.fromTo(
      els,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
      },
      "-=0.8"
    );
  }, { scope: heroRef });

  const splitText = (text: string) => {
    return text.split("").map((char, i) => (
      <span
        key={i}
        className="hero-char"
        style={{
          display: "inline-block",
          transformOrigin: "bottom center",
          willChange: "transform, opacity, filter"
        }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  return (
    <section
      ref={heroRef}
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "0 2.5rem",
      }}
    >
      {/* Animated canvas BG */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Grid lines overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      {/* Interactive Ambient Mouse Glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          background: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, rgba(200, 241, 53, 0.07), transparent 70%)`,
          zIndex: 1,
          mixBlendMode: "screen",
          transition: "background 0.1s ease-out",
        }}
      />

      {/* Floating Image Reveal (hooked to JS QuickTo) */}
      <div
        ref={hoverImageRef}
        className={isRevealLoaded ? "" : "flutter-shimmer"}
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: 320, height: 200,
          pointerEvents: "none", zIndex: 50,
          opacity: 0, transform: "scale(0.4)",
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)"
        }}
      >
        <Image
          src={revealImage}
          alt="Creative Reveal"
          fill
          style={{ objectFit: "cover" }}
          onLoad={() => setIsRevealLoaded(true)}
          priority
        />
      </div>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          paddingTop: "7rem",
        }}
      >
        {/* Tag line */}
        <p
          data-reveal
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.75rem",
            color: "var(--accent)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 32,
              height: 1,
              backgroundColor: "var(--accent)",
            }}
          />
          {tagline}
        </p>

        {/* Hero headline */}
        <h1
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "clamp(3.5rem, 10vw, 9rem)",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "var(--white)",
            marginBottom: "0.25rem",
            perspective: "1000px", // Gives 3D rotation depth
          }}
        >
          {title.split(" ").map((word, i) => (
            <div key={i} style={{ overflow: "hidden" }}>{splitText(word)}</div>
          ))}
        </h1>

        {/* Rotating word */}
        <div
          data-reveal
          onMouseEnter={() => setIsHoveringWord(true)}
          onMouseLeave={() => setIsHoveringWord(false)}
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "clamp(3.5rem, 10vw, 9rem)",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "var(--accent)",
            marginBottom: "3rem",
            overflow: "hidden",
            height: "1.05em",
          }}
        >
          <span ref={wordRef} style={{ display: "inline-block" }}>
            {rotatingWords[currentWord]}
          </span>
        </div>

        {/* Subtext + CTA row */}
        <div
          data-reveal
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "2rem",
            marginBottom: "5rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "1.0625rem",
              color: "var(--muted)",
              lineHeight: 1.7,
              maxWidth: 420,
            }}
          >
            {subtext}
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", zIndex: 10, position: "relative" }}>
            <MagneticElement>
              <Link
                href="/work"
                style={{
                  padding: "0.875rem 2rem",
                  backgroundColor: "var(--accent)",
                  color: "var(--void)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  borderRadius: "100px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(200,241,53,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                View Work
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </MagneticElement>
            <MagneticElement>
              <Link
                href="/contact"
                style={{
                  padding: "0.875rem 2rem",
                  border: "1px solid var(--border)",
                  color: "var(--white)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  borderRadius: "100px",
                  transition: "border-color 0.2s, color 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
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
                Get in Touch
              </Link>
            </MagneticElement>
          </div>
        </div>

        {/* Stats */}
        <div
          data-reveal
          style={{
            display: "flex",
            gap: "3rem",
            flexWrap: "wrap",
            paddingBottom: "5rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {stats.map((stat, i) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 700,
                  color: "var(--white)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.15em",
                }}
              >
                <span
                  ref={(el) => { statsRefs.current[i] = el; }}
                >
                  0
                </span>
                <span style={{ color: "var(--accent)", fontSize: "0.5em", marginTop: "0.2em" }}>+</span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginTop: "0.5rem",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Ticker bottom */}
      <div
        className="ticker-wrap"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid var(--border)",
          padding: "0.875rem 0",
          backgroundColor: "rgba(5,5,7,0.5)",
          backdropFilter: "blur(8px)",
          overflow: "hidden",
        }}
      >
        <div className="ticker-inner" style={{ gap: "2rem" }}>
          {["Photography", "·", "Videography", "·", "Web Dev", "·", "Visual Art", "·", "Motion", "·", "Design", "·"].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.6875rem",
                color: item === "·" ? "var(--accent)" : "var(--muted)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                padding: "0 0.5rem",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollArrowRef}
        style={{
          position: "absolute",
          right: "2.5rem",
          bottom: "5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.625rem",
            color: "var(--muted)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            writingMode: "vertical-rl",
          }}
        >
          Scroll
        </span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3v14M5 13l5 5 5-5" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
