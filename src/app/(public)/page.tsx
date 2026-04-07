import { createStaticClient } from "@/lib/supabase/server";
import Hero from "@/components/sections/Hero";
import HorizontalWorks from "@/components/sections/HorizontalWorks";
import ExpertiseMarquee from "@/components/sections/ExpertiseMarquee";
import FooterCTA from "@/components/sections/FooterCTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amir Hossain — Creative Portfolio",
  description:
    "Award-winning portfolio showcasing photography, videography, and web development. Crafting cinematic visuals and digital experiences.",
};

export const revalidate = 60; // Fetch new featured changes every 60s

export default async function HomePage() {
  const supabase = createStaticClient();
  
  // Fetch projects
  const { data: recentProjects } = await (supabase as any)
    .from("projects")
    .select("id, slug, title, category, cover_url, description, sort_order, created_at")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(6);

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
        <HorizontalWorks projects={recentProjects ?? []} />
        <ExpertiseMarquee items={settings.global?.ticker_items} />
        <FooterCTA settings={settings.contact} />
      </div>
    </main>
  );
}
