import Contact from "@/components/sections/Contact";
import { createStaticClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Amir Hossain to discuss photography, videography, web development projects, or creative collaborations.",
  keywords: [
    "contact Amir Hossain", "hire photographer Bangladesh", "freelance videographer",
    "web developer for hire", "creative collaboration",
  ],
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/contact`,
    title: "Contact — Amir Hossain",
    description:
      "Get in touch with Amir Hossain for photography, videography, web development projects, or creative collaborations.",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Contact Amir Hossain" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Amir Hossain",
    description: "Get in touch with Amir Hossain for photography, videography, and web development projects.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default async function ContactPage() {
  const supabase = createStaticClient();
  const { data: contactSettings } = await supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle();
  const { data: globalSettings } = await supabase.from("site_settings").select("value").eq("key", "global").maybeSingle();

  return <Contact settings={contactSettings?.value as any} globalSettings={globalSettings?.value as any} />;
}
