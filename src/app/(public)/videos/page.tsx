import { createStaticClient } from "@/lib/supabase/server";
import YouTubeGallery from "@/components/sections/YouTubeGallery";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch cinematic productions, motion graphics, and creative visual highlights from Amir Hossain's YouTube channel. A filmmaker's reel of storytelling through video.",
  keywords: [
    "videography reel", "cinematic productions", "motion graphics", "YouTube channel",
    "video portfolio Bangladesh", "filmmaker reel",
  ],
  alternates: { canonical: `${SITE_URL}/videos` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/videos`,
    title: "Video Works — Amir Hossain",
    description:
      "Cinematic productions, motion graphics, and creative highlights by Amir Hossain.",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Amir Hossain Video Works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Works — Amir Hossain",
    description: "Cinematic productions, motion graphics, and creative visual highlights by Amir Hossain.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function VideosPage() {
  const supabase = createStaticClient();

  const { data: videos } = await supabase
    .from("youtube_videos")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // Derive unique categories from the fetched videos
  const categories = Array.from(
    new Set((videos ?? []).map((v) => v.category).filter(Boolean))
  ) as string[];

  return <YouTubeGallery videos={videos ?? []} categories={categories} />;
}
