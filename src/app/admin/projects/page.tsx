"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/supabase/types";
import { revalidatePortfolio } from "@/app/actions/media";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<{ name: string, slug: string }[]>([
    { name: "Motion Graphics", slug: "motion" },
    { name: "Web Development", slug: "web" },
    { name: "Graphic Design", slug: "graphics" }
  ]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [featuring, setFeaturing] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    const { data } = await (supabase as any).from("site_settings").select("value").eq("key", "project_categories").maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      setCategories(data.value as any);
    }
  }, [supabase]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("projects").select("*").order("sort_order").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("category", filter);
    const { data } = await q;
    setProjects(data ?? []);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const togglePublish = async (project: Project) => {
    await (supabase as any).from("projects").update({ published: !project.published }).eq("id", project.id);
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, published: !p.published } : p));
    await revalidatePortfolio(); // Bust Next.js ISR cache so homepage reflects changes immediately
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setDeleting(project.id);
    await supabase.from("projects").delete().eq("id", project.id);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setDeleting(null);
  };

  const toggleFeatured = async (project: Project) => {
    setFeaturing(project.id);
    await (supabase as any).from("projects").update({ featured: !project.featured }).eq("id", project.id);
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, featured: !p.featured } : p));
    await revalidatePortfolio(); // Bust Next.js ISR cache so homepage reflects changes immediately
    setFeaturing(null);
  };

  const getCategoryLabel = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.name : slug.charAt(0).toUpperCase() + slug.slice(1);
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em" }}>Projects</h1>
        <Link
          href="/admin/projects/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            backgroundColor: "var(--accent)",
            color: "var(--void)",
            fontFamily: "var(--font-inter)",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          + New Project
        </Link>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "100px",
            border: filter === "all" ? "1px solid var(--accent)" : "1px solid var(--border)",
            backgroundColor: filter === "all" ? "var(--accent-dim)" : "transparent",
            color: filter === "all" ? "var(--accent)" : "var(--muted)",
            fontFamily: "var(--font-inter)",
            fontSize: "0.8125rem",
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setFilter(cat.slug)}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "100px",
              border: filter === cat.slug ? "1px solid var(--accent)" : "1px solid var(--border)",
              backgroundColor: filter === cat.slug ? "var(--accent-dim)" : "transparent",
              color: filter === cat.slug ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.8125rem",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 90px 150px", gap: "1rem", padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface-2)" }}>
          {["Title", "Category", "Views", "Status", "Featured", "Actions"].map((h) => (
            <p key={h} style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)" }}>Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)", marginBottom: "1rem" }}>No projects found.</p>
            <Link href="/admin/projects/new" style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--accent)", textDecoration: "none" }}>Create your first →</Link>
          </div>
        ) : (
          projects.map((project, i) => (
            <div
              key={project.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 100px 80px 90px 150px",
                gap: "1rem",
                alignItems: "center",
                padding: "1rem 1.5rem",
                borderBottom: i < projects.length - 1 ? "1px solid var(--border)" : "none",
                opacity: deleting === project.id ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {/* Title */}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</p>
                <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{project.slug}</p>
              </div>

              {/* Category */}
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {getCategoryLabel(project.category)}
              </span>

              {/* Views */}
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--muted)" }}>
                {project.view_count ?? 0}
              </span>

              {/* Status toggle */}
              <button
                onClick={() => togglePublish(project)}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "100px",
                  border: `1px solid ${project.published ? "rgba(200,241,53,0.35)" : "var(--border)"}`,
                  backgroundColor: project.published ? "rgba(200,241,53,0.12)" : "transparent",
                  color: project.published ? "var(--accent)" : "var(--muted)",
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.5625rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {project.published ? "Live" : "Draft"}
              </button>

              {/* Featured toggle */}
              <button
                onClick={() => toggleFeatured(project)}
                disabled={featuring === project.id}
                title={project.featured ? "Remove from Selected Works" : "Add to Selected Works on homepage"}
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "100px",
                  border: `1px solid ${project.featured ? "rgba(255,200,50,0.4)" : "var(--border)"}`,
                  backgroundColor: project.featured ? "rgba(255,200,50,0.12)" : "transparent",
                  color: project.featured ? "#FFD700" : "var(--muted)",
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.625rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: featuring === project.id ? "wait" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>{project.featured ? "★" : "☆"}</span>
                {featuring === project.id ? "…" : project.featured ? "On" : "Off"}
              </button>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  style={{
                    padding: "0.3125rem 0.75rem",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-inter)",
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    textDecoration: "none",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(project)}
                  disabled={deleting === project.id}
                  style={{
                    padding: "0.3125rem 0.75rem",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-inter)",
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    backgroundColor: "transparent",
                    cursor: deleting === project.id ? "not-allowed" : "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "crimson";
                    el.style.color = "crimson";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border)";
                    el.style.color = "var(--muted)";
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

