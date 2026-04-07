import { createClient } from "@/lib/supabase/server";
import PortfolioGrid from "@/components/sections/PortfolioGrid";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Work",
  description:
    "Explore my portfolio of photography, videography, and web development projects.",
};

export default async function WorkPage() {
  const supabase = await createClient();

  // Fetch projects
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, slug, title, category, cover_url, metadata, media_urls, description, published, sort_order, created_at")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  // Fetch settings
  const { data: settingData } = await supabase.from("site_settings").select("value").eq("key", "work").maybeSingle() as any;
  const workSettings = (settingData?.value as any) || { label: "Selected Work", title: "Everything I've Built" };

  return (
    <section
      style={{
        minHeight: "80dvh",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "6rem 2.5rem",
      }}
    >
      {/* Section header */}
      <div style={{ marginBottom: "4rem" }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.75rem",
            color: "var(--accent)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
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
          {workSettings.label}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "clamp(2.5rem, 7vw, 6rem)",
            fontWeight: 700,
            color: "var(--white)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          {workSettings.title?.includes(" ") ? (
            <>
              {workSettings.title.split(" ").slice(0, -2).join(" ")}
              {workSettings.title.split(" ").length > 2 && <br />}
              {workSettings.title.split(" ").slice(-2, -1)}
              <br />
              <span style={{ color: "var(--accent)" }}>{workSettings.title.split(" ").slice(-1)}</span>
            </>
          ) : workSettings.title}
        </h1>
      </div>

      <PortfolioGrid projects={projects ?? []} />
    </section>
  );
}
