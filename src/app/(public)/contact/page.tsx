import Contact from "@/components/sections/Contact";
import { createStaticClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Amir Hossain for photography, videography, and web development projects.",
};

export default async function ContactPage() {
  const supabase = createStaticClient();
  const { data: contactSettings } = await supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle();
  const { data: globalSettings } = await supabase.from("site_settings").select("value").eq("key", "global").maybeSingle();

  return <Contact settings={contactSettings?.value as any} globalSettings={globalSettings?.value as any} />;
}
