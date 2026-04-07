import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "Amir Hossain — Creative Portfolio",
    template: "%s | Amir Hossain",
  },
  description:
    "Award-winning portfolio showcasing photography, videography, and web development. A visual storyteller crafting cinematic experiences.",
  keywords: ["photography", "videography", "web development", "portfolio", "creative"],
  authors: [{ name: "Amir Hossain" }],
  creator: "Amir Hossain",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Amir Hossain — Creative Portfolio",
    description:
      "Award-winning portfolio showcasing photography, videography, and web development.",
    siteName: "Amir Hossain",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amir Hossain — Creative Portfolio",
    description:
      "Award-winning portfolio showcasing photography, videography, and web development.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/clash-display"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
