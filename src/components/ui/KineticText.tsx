"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Props {
  text: string;
  className?: string;
  tagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span" | "label";
  style?: React.CSSProperties;
  stagger?: number;
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function KineticText({ text, className = "", tagName: Tag = "h2", style = {}, stagger = 0.02 }: Props) {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    const chars = containerRef.current.querySelectorAll(".kinetic-char");
    
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.fromTo(chars, 
          { y: 80, opacity: 0, rotateX: -90, filter: "blur(8px)" },
          { y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger }
        );
      }
    });

  }, { scope: containerRef });

  const words = text.split(" ");

  return (
    <Tag ref={containerRef as any} className={className} style={{ ...style, perspective: "1000px" }}>
      {words.map((word, wIdx) => (
        <span key={wIdx} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.25em" }}>
          {word.split("").map((char, cIdx) => (
            <span
              key={cIdx}
              className="kinetic-char"
              style={{
                display: "inline-block",
                transformOrigin: "bottom center",
                willChange: "transform, opacity, filter"
              }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
