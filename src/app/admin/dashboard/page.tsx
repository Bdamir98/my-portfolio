import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();

  // Run stats queries separately (not destructured from Promise.all head:true results)
  const [totalRes, publishedRes, draftRes, messagesRes, recentRes] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("published", false),
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("read", false),
    supabase
      .from("projects")
      .select("id, title, category, published, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const total = totalRes.count ?? 0;
  const published = publishedRes.count ?? 0;
  const drafts = draftRes.count ?? 0;
  const messages = messagesRes.count ?? 0;

  type RecentProject = {
    id: string;
    title: string;
    category: string;
    published: boolean | null;
    created_at: string | null;
  };

  const recentProjects = (recentRes.data ?? []) as RecentProject[];

  const STATS = [
    { label: "Total Projects", value: total, color: "var(--accent)" },
    { label: "Published", value: published, color: "#35C8F1" },
    { label: "Drafts", value: drafts, color: "#F1A835" },
    { label: "Unread Messages", value: messages, color: "#F135A8" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>Welcome back, Amir</p>
        </div>
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

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {STATS.map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
            }}
          >
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: "var(--font-clash)", fontSize: "2.5rem", fontWeight: 700, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "var(--font-clash)", fontSize: "1.125rem", fontWeight: 600, color: "var(--white)" }}>Recent Projects</h2>
          <Link href="/admin/projects" style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none" }}>View all →</Link>
        </div>
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {recentProjects.length > 0 ? (
            recentProjects.map((project, i) => (
              <div
                key={project.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.5rem",
                  borderBottom: i < recentProjects.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: project.published ? "var(--accent)" : "var(--muted)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)", fontWeight: 500 }}>{project.title}</p>
                    <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "capitalize" }}>{project.category}</p>
                  </div>
                </div>
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "var(--muted)", textDecoration: "none", padding: "0.375rem 0.75rem", border: "1px solid var(--border)", borderRadius: "6px" }}
                >
                  Edit
                </Link>
              </div>
            ))
          ) : (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)" }}>No projects yet. </p>
              <Link href="/admin/projects/new" style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--accent)", textDecoration: "none" }}>Create your first project →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
