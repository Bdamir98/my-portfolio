"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  imageUrl?: string; // Fallback for backward compatibility
  title?: string;
  description?: string | null;
  initialIndex?: number;
}

export default function Lightbox({ isOpen, onClose, images = [], imageUrl, title, description, initialIndex = 0 }: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const allImages = useMemo(() => {
    if (images && images.length > 0) return images;
    return imageUrl ? [imageUrl] : [];
  }, [images, imageUrl]);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentIndex(initialIndex >= 0 && initialIndex < allImages.length ? initialIndex : 0);
    } else {
      document.body.style.overflow = "auto";
      // Ensure GSAP ScrollTrigger and Lenis are aware of the change
      ScrollTrigger.refresh();
    }
    return () => {
      document.body.style.overflow = "auto";
      ScrollTrigger.refresh();
    };
  }, [isOpen, initialIndex, allImages.length]);

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (allImages.length <= 1) return;
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    },
    [allImages.length]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (allImages.length <= 1) return;
      setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    },
    [allImages.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.y) > 100) {
      onClose();
    } else if (info.offset.x > 100) {
      handlePrev();
    } else if (info.offset.x < -100) {
      handleNext();
    }
  };

  if (!mounted) return null;

  const content = (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-lenis-prevent
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.98)",
            backdropFilter: "blur(20px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "4rem 2.5rem 8rem",
            overflowY: "auto",
            cursor: "auto", // Removed zoom-out here
          }}
        >
          {/* Background Overlay (Click to close) */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: -1,
              cursor: "zoom-out" // Only background has zoom-out cursor
            }}
            onClick={onClose}
          />

          {/* Subtle Glow Background */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)",
              opacity: 0.3,
              filter: "blur(100px)",
              pointerEvents: "none",
            }}
          />

          {/* Controls Overlay */}
          {allImages.length > 1 && (
            <>
              {/* Prev Button */}
              <button
                onClick={handlePrev}
                style={{
                  position: "absolute",
                  left: "min(2rem, 5vw)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 100010,
                  ...controlButtonStyle,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                ←
              </button>
              {/* Next Button */}
              <button
                onClick={handleNext}
                style={{
                  position: "absolute",
                  right: "min(2rem, 5vw)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 100010,
                  ...controlButtonStyle,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                →
              </button>
              {/* Counter */}
              <div
                style={{
                  position: "absolute",
                  bottom: "3rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: "0.5rem 1rem",
                  borderRadius: "100px",
                  color: "var(--white)",
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.75rem",
                  zIndex: 100010,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {currentIndex + 1} / {allImages.length}
              </div>
            </>
          )}

          {/* Close Button UI - Top Right of Screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "absolute",
              top: "2.5rem",
              right: "2.5rem",
              zIndex: 100001,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--white)",
                width: "54px",
                height: "54px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.25rem",
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                transition: "all 0.3s var(--ease-expo-out)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.1) rotate(90deg)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1) rotate(0deg)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--white)";
              }}
            >
              ✕
            </button>
          </motion.div>

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            style={{
              position: "relative",
              maxWidth: "100%",
              maxHeight: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
              zIndex: 100000,
              cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "75vh", // Fixed height so the text below NEVER jumps
            }}>
              <AnimatePresence mode="wait">
                {allImages[currentIndex]?.includes(".mp4") || allImages[currentIndex]?.includes(".webm") ? (
                  <motion.video
                    key={`video-${currentIndex}`}
                    src={allImages[currentIndex]}
                    controls
                    autoPlay
                    playsInline
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    style={{
                      maxWidth: "min(95vw, 1400px)",
                      maxHeight: "75vh",
                      objectFit: "contain",
                      borderRadius: "8px",
                      boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
                      display: "block",
                      outline: "none"
                    }}
                  />
                ) : (
                  <motion.div
                    key={`img-${currentIndex}`}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={loadedImages[currentIndex] ? "" : "flutter-shimmer"}
                    style={{
                      position: "relative",
                      maxWidth: "min(95vw, 1400px)",
                      maxHeight: "75vh",
                      minHeight: loadedImages[currentIndex] ? "auto" : "300px",
                      minWidth: loadedImages[currentIndex] ? "auto" : "300px",
                      display: "inline-flex",
                      borderRadius: "8px",
                      boxShadow: loadedImages[currentIndex] ? "0 40px 120px rgba(0,0,0,0.9)" : "none",
                      overflow: "hidden",
                      backgroundColor: loadedImages[currentIndex] ? "transparent" : "var(--surface-2)",
                    }}
                  >
                    <Image
                      src={allImages[currentIndex]}
                      alt={title || "Portfolio Work"}
                      width={1920}
                      height={1080}
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [currentIndex]: true }))}
                      style={{ 
                         maxWidth: "100%", 
                         maxHeight: "75vh",
                         width: "auto", 
                         height: "auto",
                         objectFit: "contain",
                         display: "block"
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content Metadata */}
            {(title || description) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  textAlign: "center",
                  padding: "0 2rem",
                  maxWidth: "800px"
                }}
              >
                {title && (
                  <h4
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontSize: "clamp(1.25rem, 3vw, 2rem)",
                      fontWeight: 600,
                      color: "var(--white)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {title}
                  </h4>
                )}
                {description && (
                  <div style={{
                    width: "100%",
                    maxWidth: "800px",
                    margin: "0 auto 3rem",
                  }}>
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: "var(--white)",
                        opacity: 1,
                        fontSize: "clamp(0.9375rem, 2vw, 1.125rem)",
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap", // Preserve line breaks
                        textAlign: "center",
                      }}
                    >
                      {description}
                    </p>
                  </div>
                )}
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    color: "var(--muted)",
                    fontSize: "0.625rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  {allImages.length > 1 ? "Drag or use arrows to navigate" : "Drag up or down to dismiss"}
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

const controlButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--white)",
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "1.5rem",
  transition: "all 0.3s var(--ease-expo-out)",
  backdropFilter: "blur(10px)",
};
