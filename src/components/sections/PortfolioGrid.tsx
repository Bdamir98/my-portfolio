"use client";

import { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/all";
import { createClient } from "@/lib/supabase/client";
import ProjectCard from "@/components/ui/ProjectCard";
import type { Project } from "@/lib/supabase/types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

interface Props {
  projects: Project[];
}

export default function PortfolioGrid({ projects }: Props) {
  const [activeFilter, setActiveFilter] = useState("");
  const [filters, setFilters] = useState<any[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchFilters = async () => {
      const { data } = await (supabase as any).from("site_settings").select("value").eq("key", "project_categories").maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const dynamicFilters = data.value.map((cat: any) => ({
          value: cat.slug,
          label: cat.name
        }));
        // Remove "Graphic Design" explicitly if it's there, as per user request
        const filteredDynamic = dynamicFilters.filter((f: any) => f.value !== "graphics");
        setFilters(filteredDynamic);
        if (filteredDynamic.length > 0) {
          setActiveFilter(filteredDynamic[0].value);
        }
      } else {
        // Fallback to standard if no DB settings yet
        const defaultFilters = [
          { value: "motion", label: "Motion Graphics" },
          { value: "web", label: "Web Dev" },
          { value: "thumbnail", label: "Thumbnail" }
        ];
        setFilters(defaultFilters);
        setActiveFilter(defaultFilters[0].value);
      }
    };
    fetchFilters();
  }, []);

  const filtered = projects.filter(
    (p) => p.category === activeFilter
  );

  // Animate filter change with GSAP Flip
  const handleFilter = (value: string) => {
    if (value === activeFilter) return;
    const grid = gridRef.current;
    if (!grid) {
      setActiveFilter(value);
      return;
    }

    const state = Flip.getState(grid.querySelectorAll<HTMLElement>("[data-card]"));
    setActiveFilter(value);

    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.04,
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
      });
    });
  };

  // Entrance animation for cards
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll("[data-card]");
    if (!cards) return;
    gsap.fromTo(
      cards,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.06 }
    );
  }, []);

  return (
    <div>
      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "3rem",
          position: "relative",
        }}
      >
        {filters.map(({ value, label }: any) => (
          <button
            key={value}
            onClick={() => handleFilter(value)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "100px",
              border: activeFilter === value ? "1px solid var(--accent)" : "1px solid var(--border)",
              backgroundColor: activeFilter === value ? "var(--accent-dim)" : "transparent",
              color: activeFilter === value ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              transition: "all 0.25s",
              letterSpacing: "0.025em",
            }}
          >
            {label}
            <span
              style={{
                marginLeft: "0.5rem",
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.625rem",
                color: "inherit",
                opacity: 0.7,
              }}
            >
              ({projects.filter((p) => p.category === value).length})
            </span>
          </button>
        ))}

        {/* Total count */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.75rem",
            color: "var(--muted)",
          }}
        >
          {filtered.length} {filtered.length === 1 ? "project" : "projects"}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "6rem 2rem",
            border: "1px solid var(--border)",
            borderRadius: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 600,
              color: "var(--white)",
              marginBottom: "1rem",
            }}
          >
            No projects yet
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.9375rem",
              color: "var(--muted)",
            }}
          >
            Check back soon — new work is always in progress.
          </p>
        </div>
      )}

      {/* Grid - Standard grid for horizontal filling */}
      <div
        ref={gridRef}
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
        className="portfolio-grid"
      >
        <style jsx>{`
          .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 0.5rem;
          }
          @media (min-width: 640px) {
            .portfolio-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (min-width: 1024px) {
            .portfolio-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>
        {filtered.map((project) => (
          <div 
            key={project.id} 
            data-card 
            data-flip-id={project.id}
            style={{
              position: "relative",
            }}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </div>
  );
}
