"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export default function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const overlay = overlayRef.current;
    if (!overlay) return;

    const tl = gsap.timeline();
    // Wipe in
    tl.to(overlay, {
      clipPath: "inset(0 0 0% 0)",
      duration: 0.55,
      ease: "expo.inOut",
    })
    // Wipe out
    .to(overlay, {
      clipPath: "inset(100% 0 0% 0)",
      duration: 0.55,
      ease: "expo.inOut",
      delay: 0.1,
    })
    .set(overlay, { clipPath: "inset(0 0 100% 0)" });

    return () => { tl.kill(); };
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      id="page-transition-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--surface)",
        zIndex: 9997,
        clipPath: "inset(0 0 100% 0)",
        pointerEvents: "none",
      }}
    />
  );
}
