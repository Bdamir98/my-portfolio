import CustomCursor from "@/components/layout/CustomCursor";
import { createStaticClient } from "@/lib/supabase/server";
import LoadingScreen from "@/components/layout/LoadingScreen";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScroller from "@/components/layout/SmoothScroller";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createStaticClient();
  const { data: settingsData } = await supabase.from("site_settings").select("*");
  const settings: any = {};
  settingsData?.forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return (
    <div className="grain public-layout">
      <LoadingScreen />
      <CustomCursor />
      <SmoothScroller>
        <Header settings={settings.global} availability={settings.contact?.availability} />
        <main style={{ minHeight: "100vh" }}>{children}</main>
        <Footer settings={settings.global} availability={settings.contact?.availability} />
      </SmoothScroller>
    </div>
  );
}
