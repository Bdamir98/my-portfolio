import { createStaticClient } from "@/lib/supabase/server";
import Hero from "@/components/sections/Hero";
import FeaturedWorks from "@/components/sections/FeaturedWorks";
import ExpertiseMarquee from "@/components/sections/ExpertiseMarquee";
import FooterCTA from "@/components/sections/FooterCTA";
import YouTubePreview from "@/components/sections/YouTubePreview";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev";

export const metadata: Metadata = {
  title: "Amir Hossain — Creative Portfolio",
  description:
    "Award-winning portfolio showcasing photography, videography, and web development. A visual storyteller crafting cinematic experiences and digital wonders.",
  keywords: [
    "Amir Hossain", "creative portfolio", "photographer Bangladesh",
    "videographer", "web developer", "cinematic photography", "visual storyteller",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Amir Hossain — Creative Portfolio",
    description:
      "Award-winning portfolio showcasing photography, videography, and web development. A visual storyteller crafting cinematic experiences.",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Amir Hossain — Creative Portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amir Hossain — Creative Portfolio",
    description: "Award-winning portfolio showcasing photography, videography, and web development.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export const revalidate = 60; // Fetch new featured changes every 60s

export default async function HomePage() {
  const supabase = createStaticClient();

  // Fetch admin-selected featured projects for the homepage
  const { data: featuredProjects } = await (supabase as any)
    .from("projects")
    .select("id, slug, title, category, cover_url, description, metadata, media_urls, sort_order, created_at")
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(8);

  // Fetch featured YouTube videos for homepage preview
  const { data: featuredVideos } = await (supabase as any)
    .from("youtube_videos")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch settings
  const { data: settingsData } = await supabase.from("site_settings").select("key, value");
  const settings: any = {};
  settingsData?.forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return (
    <main style={{ position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 0 }}>
        <Hero settings={settings.hero} />
      </div>
      <div style={{ position: "relative", zIndex: 10, backgroundColor: "var(--void)" }}>
        <FeaturedWorks projects={featuredProjects ?? []} />
        <YouTubePreview videos={featuredVideos ?? []} />
        <ExpertiseMarquee items={settings.global?.ticker_items} />
        <FooterCTA settings={settings.contact} />
      </div>
    </main>
  );
}

