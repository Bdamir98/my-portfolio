"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function LoadingScreen() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Only show on first visit in this session
    const shown = sessionStorage.getItem("portfolio_loaded");
    if (shown) {
      setVisible(false);
      return;
    }

    const overlay = overlayRef.current;
    const counter = counterRef.current;
    if (!overlay || !counter) return;

    const obj = { val: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("portfolio_loaded", "1");
        // Dismiss
        gsap.to(overlay, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.9,
          ease: "expo.inOut",
          onComplete: () => setVisible(false),
        });
      },
    });

    tl.to(obj, {
      val: 100,
      duration: 2.2,
      ease: "power1.inOut",
      onUpdate: () => {
        if (counter) counter.textContent = Math.round(obj.val).toString();
      },
    });

    return () => { tl.kill(); };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--void)",
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        clipPath: "inset(0 0 0% 0)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "clamp(4rem, 15vw, 12rem)",
            fontWeight: 700,
            color: "var(--white)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            position: "relative",
          }}
        >
          <span ref={counterRef}>0</span>
          <span
            style={{
              fontSize: "0.25em",
              verticalAlign: "super",
              color: "var(--accent)",
            }}
          >
            %
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.75rem",
            color: "var(--muted)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginTop: "1rem",
          }}
        >
          Loading Experience
        </p>
      </div>
    </div>
  );
}
