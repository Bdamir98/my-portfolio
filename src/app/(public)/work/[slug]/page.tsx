import { createStaticClient } from "@/lib/supabase/server";
import ProjectDetail from "@/components/sections/ProjectDetail";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Project } from "@/lib/supabase/types";

export const revalidate = 60;

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

  return {
    title: `${project.title} | ${project.category} | Amir Hossain`,
    description: project.description || `Explore this ${project.category} project by Amir Hossain.`,
    openGraph: {
      title: project.title,
      description: project.description || `Explore this ${project.category} project by Amir Hossain.`,
      images: project.cover_url ? [{ url: project.cover_url }] : [],
      type: "article",
    }
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

  return <ProjectDetail project={safeProject} related={(related ?? []) as Project[]} />;
}
