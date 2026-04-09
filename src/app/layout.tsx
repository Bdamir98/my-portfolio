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
  keywords: [
    "photography", "videography", "web development", "portfolio", "creative",
    "Amir Hossain", "Bangladesh photographer", "cinematic photography",
    "freelance videographer", "Next.js developer", "visual storyteller",
  ],
  authors: [{ name: "Amir Hossain" }],
  creator: "Amir Hossain",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev",
    title: "Amir Hossain — Creative Portfolio",
    description:
      "Award-winning portfolio showcasing photography, videography, and web development.",
    siteName: "Amir Hossain",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Amir Hossain — Creative Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@amirhossain",
    creator: "@amirhossain",
    title: "Amir Hossain — Creative Portfolio",
    description:
      "Award-winning portfolio showcasing photography, videography, and web development.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: "Amir Hossain",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev",
      image: `${process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev"}/android-chrome-512x512.png`,
      jobTitle: "Photographer, Videographer & Web Developer",
      description:
        "Award-winning creative professional specializing in photography, cinematic videography, and modern web development.",
      knowsAbout: ["Photography", "Videography", "Web Development", "Motion Graphics"],
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "Amir Hossain — Creative Portfolio",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev",
      description:
        "Award-winning portfolio showcasing photography, videography, and web development.",
      author: { "@type": "Person", name: "Amir Hossain" },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
