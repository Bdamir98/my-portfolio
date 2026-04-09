import { createStaticClient } from "@/lib/supabase/server";
import ProjectDetail from "@/components/sections/ProjectDetail";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Project } from "@/lib/supabase/types";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amirhossain.dev";

type Props = {
  params: { slug: string };
};

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient();
  const { data } = await (supabase as any)
    .from("projects")
    .select("slug")
    .eq("published", true);
  return (data ?? []).map((p: any) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createStaticClient();
  const { data: project } = await (supabase as any)
    .from("projects")
    .select("title, description, category, cover_url")
    .eq("slug", params.slug)
    .single();

  if (!project) return { title: "Project Not Found" };

  const description =
    project.description ||
    `Explore this ${project.category} project by Amir Hossain.`;
  const canonicalUrl = `${SITE_URL}/work/${params.slug}`;

  return {
    title: `${project.title} | ${project.category}`,
    description,
    keywords: [
      project.title,
      project.category,
      "Amir Hossain",
      "creative portfolio",
      `${project.category} Bangladesh`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: project.title,
      description,
      url: canonicalUrl,
      type: "article",
      images: project.cover_url
        ? [{ url: project.cover_url, width: 1200, height: 630, alt: project.title }]
        : [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: project.cover_url
        ? [project.cover_url]
        : [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createStaticClient();

  const { data: project } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!project) notFound();

  // Cast to satisfy TypeScript — notFound() throws above so project is defined
  const safeProject = project as Project;

  // Per-project JSON-LD CreativeWork schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: safeProject.title,
    description:
      safeProject.description ||
      `A ${safeProject.category} project by Amir Hossain.`,
    url: `${SITE_URL}/work/${safeProject.slug}`,
    ...(safeProject.cover_url ? { image: safeProject.cover_url } : {}),
    genre: safeProject.category,
    author: {
      "@type": "Person",
      name: "Amir Hossain",
      url: SITE_URL,
    },
    dateCreated: safeProject.created_at,
  };

  // Increment view count (fire and forget)
  (supabase as any)
    .from("projects")
    .update({ view_count: (safeProject.view_count ?? 0) + 1 })
    .eq("id", safeProject.id)
    .then(() => null)
    .catch(() => null);

  // Related projects (same category, excluding current)
  const { data: related } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("category", safeProject.category)
    .eq("published", true)
    .neq("id", safeProject.id)
    .limit(3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectDetail project={safeProject} related={(related ?? []) as Project[]} />
    </>
  );
}
