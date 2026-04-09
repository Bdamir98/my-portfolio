import About from "@/components/sections/About";
import { createStaticClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Amir Hossain — a photographer, videographer, and web developer based in Bangladesh. Discover the story, skills, and philosophy behind the lens and the code.",
  keywords: [
    "about Amir Hossain", "Bangladesh photographer", "freelance creative",
    "videographer Bangladesh", "web developer portfolio",
  ],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: "profile",
    url: `${SITE_URL}/about`,
    title: "About — Amir Hossain",
    description:
      "Meet Amir Hossain — a photographer, videographer, and web developer based in Bangladesh.",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "About Amir Hossain" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Amir Hossain",
    description: "Meet Amir Hossain — photographer, videographer, and web developer based in Bangladesh.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default async function AboutPage() {
  const supabase = createStaticClient();
  const { data: settingData } = await supabase.from("site_settings").select("*").eq("key", "about").single();

  return <About settings={settingData?.value as any} />;
}
