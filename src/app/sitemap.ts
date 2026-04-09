import { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://amirvisuals.vercel.app/";

export const revalidate = 3600; // Regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  // Fetch all published project slugs
  const { data: projects } = await (supabase as any)
    .from("projects")
    .select("slug, created_at, updated_at")
    .eq("published", true);

  const projectUrls: MetadataRoute.Sitemap = (projects ?? []).map(
    (project: { slug: string; created_at: string; updated_at?: string }) => ({
      url: `${SITE_URL}/work/${project.slug}`,
      lastModified: new Date(project.updated_at ?? project.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/videos`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [...staticRoutes, ...projectUrls];
}
