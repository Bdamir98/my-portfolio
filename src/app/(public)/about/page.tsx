import About from "@/components/sections/About";
import { createStaticClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Amir Hossain — photographer, videographer, and web developer based in Bangladesh.",
};

export default async function AboutPage() {
  const supabase = createStaticClient();
  const { data: settingData } = await supabase.from("site_settings").select("*").eq("key", "about").single();

  return <About settings={settingData?.value as any} />;
}
