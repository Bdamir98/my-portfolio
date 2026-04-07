"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const NAV_LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
];

interface HeaderProps {
  settings?: {
    logo_text: string;
    logo_accent: string;
  };
  availability?: string;
}

export default function Header({ settings }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const logoText = settings?.logo_text || "AH";
  const logoAccent = settings?.logo_accent !== undefined ? settings.logo_accent : ".";

  // GSAP entrance
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const header = headerRef.current;
    if (!header) return;

    gsap.fromTo(
      header,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "expo.out", delay: 0.2 }
    );

    // Hide on scroll down, show on scroll up
    let lastScroll = 0;
    const onScroll = () => {
      const current = window.scrollY;
      if (current > lastScroll && current > 80) {
        gsap.to(header, { y: -90, duration: 0.4, ease: "expo.in" });
      } else {
        gsap.to(header, { y: 0, duration: 0.5, ease: "expo.out" });
      }
      lastScroll = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Menu animation
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    if (menuOpen) {
      document.body.style.overflow = "hidden";
      gsap.fromTo(
        menu,
        { clipPath: "inset(0 0 100% 0)" },
        { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.inOut" }
      );
      gsap.fromTo(
        menu.querySelectorAll(".menu-item"),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.06, delay: 0.2 }
      );
    } else {
      document.body.style.overflow = "";
      gsap.to(menu, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.5,
        ease: "expo.inOut",
      });
    }
  }, [menuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: "var(--z-header)",
          padding: "1.25rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid var(--border)`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundColor: "rgba(5,5,7,0.7)",
        }}
      >
        {/* Logo - Left */}
        <div style={{ flex: "0 0 100px" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--white)",
              textDecoration: "none",
              letterSpacing: "-0.02em",
              display: "block",
            }}
          >
            {logoText}<span style={{ color: "var(--accent)" }}>{logoAccent}</span>
          </Link>
        </div>

        {/* Desktop Nav - Centered */}
        <nav
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "2.5rem",
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: pathname === href ? "var(--accent)" : "var(--muted)",
                textDecoration: "none",
                letterSpacing: "0.05em",
                transition: "color 0.2s",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Contact - Right */}
        <div style={{ flex: "0 0 auto" }}>
          <a
            href="/contact"
            style={{
              padding: "0.5rem 1.25rem",
              border: "1px solid var(--border)",
              borderRadius: "100px",
              fontFamily: "var(--font-inter)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--white)",
              textDecoration: "none",
              transition: "border-color 0.2s, background 0.2s",
              display: "block",
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
            Let&apos;s Talk
          </a>
        </div>
      </header>
    </>
  );
}
