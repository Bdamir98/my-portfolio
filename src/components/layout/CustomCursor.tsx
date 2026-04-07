"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCursorStore } from "@/store/cursorStore";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const { mode, text } = useCursorStore();

  useGSAP(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const textBox = textRef.current;
    if (!cursor || !dot || !textBox) return;

    let mouseX = 0;
    let mouseY = 0;
    let curX = 0;
    let curY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.05, ease: "none" });
      gsap.to(textBox, { x: mouseX, y: mouseY, duration: 0.1, ease: "none" });
    };

    const lerp = () => {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      gsap.set(cursor, { x: curX, y: curY });
      requestAnimationFrame(lerp);
    };

    const raf = requestAnimationFrame(lerp);

    const onMouseLeave = () => {
      gsap.to([cursor, dot, textBox], { opacity: 0, duration: 0.3 });
    };

    const onMouseEnter = () => {
      gsap.to([cursor, dot, textBox], { opacity: 1, duration: 0.3 });
    };

    const onMouseDown = () => gsap.to(cursor, { scale: 0.8, duration: 0.1 });
    const onMouseUp = () => gsap.to(cursor, { scale: 1, duration: 0.2, ease: "back.out" });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Handle global zustand mode changes
  useGSAP(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    switch (mode) {
      case "view":
        gsap.to(cursor, {
          width: 80, height: 80, borderColor: "var(--accent)",
          backgroundColor: "var(--accent)", duration: 0.35,
          ease: "expo.out",
        });
        gsap.to(dot, { opacity: 0, duration: 0.2 });
        break;
      case "play":
        gsap.to(cursor, {
          width: 80, height: 80, borderColor: "var(--white)",
          backgroundColor: "rgba(255,255,255,0.1)", duration: 0.35,
          ease: "expo.out",
          backdropFilter: "blur(4px)"
        });
        gsap.to(dot, { opacity: 0, duration: 0.2 });
        break;
      case "hidden":
        gsap.to([cursor, dot], { opacity: 0, scale: 0, duration: 0.2 });
        break;
      default:
        gsap.to(cursor, {
          width: 32, height: 32, borderRadius: "50%",
          borderColor: "rgba(255,255,255,0.5)",
          backgroundColor: "transparent", duration: 0.35,
          ease: "expo.out",
          backdropFilter: "blur(0px)"
        });
        gsap.to([cursor, dot], { opacity: 1, scale: 1, duration: 0.2 });
    }
  }, [mode]);

  return (
    <>
      {/* Trailing ring / expanding button */}
      <div
        ref={cursorRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.5)",
          backgroundColor: "transparent",
          pointerEvents: "none",
          zIndex: "var(--z-cursor)",
          transform: "translate(-50%, -50%)",
          willChange: "transform, width, height, background-color",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mixBlendMode: mode === "default" ? "difference" : "normal"
        }}
      />
      
      {/* Text inside cursor (follows dot speed) */}
      <div
        ref={textRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: "calc(var(--z-cursor) + 1)",
          transform: "translate(-50%, -50%)",
          display: mode === "default" || mode === "hidden" ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-jetbrains)",
          fontSize: "0.625rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: mode === "view" ? "var(--void)" : "var(--white)",
          textTransform: "uppercase"
        }}
      >
        {text}
      </div>

      {/* Sharp dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "var(--accent)",
          pointerEvents: "none",
          zIndex: "calc(var(--z-cursor) + 2)",
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      />
    </>
  );
}
