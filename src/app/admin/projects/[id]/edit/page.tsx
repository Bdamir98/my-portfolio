"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import slugify from "slugify";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { processAndUploadMedia, revalidatePortfolio } from "@/app/actions/media";
import type { Project } from "@/lib/supabase/types";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1, "Category is required"),
  drive_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  youtube_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tech_stack: z.string().optional(),
  published: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontFamily: "var(--font-inter)",
  fontSize: "0.9375rem",
  color: "var(--white)",
  outline: "none",
};

const labelStyle = {
  fontFamily: "var(--font-jetbrains)",
  fontSize: "0.5625rem",
  color: "var(--muted)",
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  display: "block",
  marginBottom: "0.4rem",
};

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<{ name: string, slug: string, allowed_types?: ("image" | "video")[], is_multi?: boolean }[]>([]);
  const [assets, setAssets] = useState<{ id: string, file?: File, url: string, isPreview: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const category = watch("category");
  const currentCategory = categories.find(c => c.slug === category);
  const categoryAllowsVideo = currentCategory?.allowed_types?.includes("video") ?? false;

  const fetchCategories = useCallback(async () => {
    const { data } = await (supabase as any).from("site_settings").select("value").eq("key", "project_categories").maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      setCategories(data.value as any);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      await fetchCategories();
      const { data } = await (supabase as any).from("projects").select("*").eq("id", id).single();
      if (data) {
        setProject(data);
        reset({
          title: data.title,
          description: data.description ?? "",
          slug: data.slug,
          category: data.category as any,
          tech_stack: (data.tech_stack ?? []).join(", "),
          drive_url: (data.metadata as any)?.drive_url ?? "",
          youtube_url: (data.metadata as any)?.youtube_url ?? "",
          published: data.published ?? false,
        });

        // Initialize assets
        const mediaUrls = Array.isArray(data.media_urls) ? data.media_urls as string[] : [];
        const initialAssets = mediaUrls.map(url => ({
          id: Math.random().toString(36).slice(2),
          url,
          isPreview: url === data.cover_url
        }));
        // If no preview matched, set the first one
        if (initialAssets.length > 0 && !initialAssets.find(a => a.isPreview)) {
          initialAssets[0].isPreview = true;
        }
        setAssets(initialAssets);
      }
      setLoading(false);
    };
    init();
  }, [id, reset, fetchCategories, supabase]);

  const onDrop = async (accepted: File[]) => {
    const allowedTypes = currentCategory?.allowed_types || ["image", "video"];

    // Filter by category constraints
    const filtered = accepted.filter(file => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      return (isImage && allowedTypes.includes("image")) || (isVideo && allowedTypes.includes("video"));
    });

    if (filtered.length < accepted.length) {
      setError("Some files were ignored because they are not allowed for this category.");
      setTimeout(() => setError(""), 3000);
    }

    // Respect multi-asset constraint
    const filesToProcess = currentCategory?.is_multi === false ? filtered.slice(0, 1) : filtered;

    const newAssets = filesToProcess.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      url: URL.createObjectURL(file),
      isPreview: false
    }));

    setAssets(prev => {
      const updated = [...prev, ...newAssets];
      if (updated.length > 0 && !updated.find(a => a.isPreview)) {
        updated[0].isPreview = true;
      }
      return updated;
    });
  };

  const dropzoneAccept: any = {};
  const allowed = currentCategory?.allowed_types || ["image", "video"];
  if (allowed.includes("image")) dropzoneAccept["image/*"] = [];
  if (allowed.includes("video")) dropzoneAccept["video/*"] = [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: dropzoneAccept,
    multiple: currentCategory?.is_multi !== false
  });


  const onSubmit = async (data: FormData) => {
    setSaving(true);
    if (assets.length === 0) {
      setError("Please add at least one media file.");
      setSaving(false);
      return;
    }

    try {
      setUploading(true);
      // Upload all new files via Server Action
      const processedAssets = await Promise.all(assets.map(async (asset) => {
        if (asset.file) {
          const formData = new FormData();
          formData.append("file", asset.file);
          const result = await processAndUploadMedia(formData);
          return { ...asset, url: result.url };
        }
        return asset;
      }));

      const validUrls = processedAssets.map(a => a.url).filter(Boolean) as string[];
      const previewAsset = processedAssets.find(a => a.isPreview) || processedAssets[0];

      const metadata: any = typeof project?.metadata === 'object' && project?.metadata ? { ...project.metadata } : {};

      if (categoryAllowsVideo) {
        if (data.drive_url) metadata.drive_url = data.drive_url;
        else delete metadata.drive_url;
        if (data.youtube_url) metadata.youtube_url = data.youtube_url;
        else delete metadata.youtube_url;
      } else {
        delete metadata.drive_url;
        delete metadata.youtube_url;
      }

      const { error: updateError } = await (supabase as any).from("projects").update({
        title: data.title,
        description: data.description || "",
        slug: data.slug,
        category: data.category,
        tech_stack: data.tech_stack ? data.tech_stack.split(",").map((t) => t.trim()).filter(Boolean) : [],
        published: data.published,
        cover_url: previewAsset?.url || null,
        media_urls: validUrls,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        updated_at: new Date().toISOString(),
      }).eq("id", id);

      if (updateError) throw updateError;
      setSuccess(true);

      // Revalidate instantly
      await revalidatePortfolio();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem", fontFamily: "var(--font-inter)", color: "var(--muted)" }}>Loading...</div>;
  if (!project) return <div style={{ padding: "2rem", fontFamily: "var(--font-inter)", color: "crimson" }}>Project not found</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "860px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em" }}>
          Edit Project: {project.title}
        </h1>
        <button onClick={() => router.push("/admin/projects")} style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.5rem 1rem", backgroundColor: "transparent", cursor: "pointer" }}>
          ← Back
        </button>
      </div>

      {/* Dedicated Category Link */}
      <div style={{ marginBottom: "2rem", padding: "1rem 1.5rem", background: "linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 100%)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--muted)", margin: 0 }}>
          Need to add or modify categories?
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          style={{ padding: "0.5rem 1rem", backgroundColor: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem" }}
        >
          Open Category Manager →
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Category Pick */}
        <div>
          <label style={labelStyle}>Project Category</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {categories.map(cat => (
              <label key={cat.slug} style={{
                padding: "0.75rem", textAlign: "center", borderRadius: "10px", cursor: "pointer",
                border: `1px solid ${category === (cat.slug as any) ? "var(--accent)" : "var(--border)"}`,
                backgroundColor: category === (cat.slug as any) ? "var(--accent-dim)" : "var(--surface)",
                color: category === (cat.slug as any) ? "var(--white)" : "var(--muted)",
                fontFamily: "var(--font-inter)", fontSize: "0.8125rem", fontWeight: 500,
                transition: "all 0.2s"
              }}>
                <input type="radio" value={cat.slug} {...register("category")} style={{ display: "none" }} />
                {cat.name}
              </label>
            ))}
          </div>
          {currentCategory && (
            <div style={{
              marginTop: "0.75rem", padding: "0.5rem 1rem", backgroundColor: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "8px", display: "inline-flex",
              alignItems: "center", gap: "1rem"
            }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.6875rem", color: "var(--muted)", margin: 0 }}>
                ALLOWED: <span style={{ color: "var(--white)", fontWeight: 600 }}>{currentCategory.allowed_types?.join(", ")}</span>
              </p>
              <div style={{ width: "1px", height: "12px", backgroundColor: "var(--border)" }} />
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.6875rem", color: "var(--muted)", margin: 0 }}>
                MODE: <span style={{ color: "var(--white)", fontWeight: 600 }}>{currentCategory.is_multi ? "Multiple Files" : "Single Asset"}</span>
              </p>
            </div>
          )}
          {errors.category && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.5rem" }}>{errors.category.message}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input {...register("title")} placeholder="Project Title" style={inputStyle}
              onChange={(e) => {
                register("title").onChange(e);
                setValue("slug", slugify(e.target.value, { lower: true, strict: true }));
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.title ? "crimson" : "var(--border)"; }}
            />
            {errors.title && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.25rem" }}>{errors.title.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input {...register("slug")} placeholder="project-title" style={inputStyle} readOnly />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Description (Optional)</label>
            <textarea {...register("description")} placeholder="Project Description..." style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} />
          </div>
        </div>

        {/* Dynamic Fields */}
        {categoryAllowsVideo && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>Video URL Options (Optional)</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>Paste a Google Drive or YouTube URL to embed a video player on the project page.</p>
            </div>
            <div>
              <label style={labelStyle}>Google Drive Video URL</label>
              <input {...register("drive_url")} placeholder="https://drive.google.com/file/d/..." style={inputStyle}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.drive_url ? "crimson" : "var(--border)"; }}
              />
              {errors.drive_url && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.25rem" }}>{errors.drive_url.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>YouTube Video URL</label>
              <input {...register("youtube_url")} placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." style={inputStyle}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.youtube_url ? "crimson" : "var(--border)"; }}
              />
              {errors.youtube_url && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.25rem" }}>{errors.youtube_url.message}</p>}
            </div>
          </div>
        )}

        {category === "web" && (
          <div>
            <label style={labelStyle}>Technologies Used</label>
            <input {...register("tech_stack")} placeholder="Next.js, React, Tailwind CSS" style={inputStyle} />
          </div>
        )}

        {/* Media Management */}
        <div>
          <label style={labelStyle}>Project Media (Order determines sequence)</label>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "8px", padding: "2.5rem 1rem", textAlign: "center", cursor: "pointer",
              backgroundColor: isDragActive ? "var(--accent-dim)" : "var(--surface)",
              transition: "all 0.2s",
            }}
          >
            <input {...getInputProps()} />
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--white)" }}>
              Drag & drop more files here, or click to add
            </p>
          </div>

          {assets.length > 0 && (
            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {assets.map((asset, i) => (
                <div key={asset.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem",
                  backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px"
                }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--surface-2)", flexShrink: 0, position: "relative" }}>
                    <Image src={asset.url} alt="Preview" fill style={{ objectFit: "cover" }} unoptimized />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setAssets(prev => prev.map(a => ({ ...a, isPreview: a.id === asset.id })))}
                        style={{
                          padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.625rem", fontFamily: "var(--font-jetbrains)",
                          border: `1px solid ${asset.isPreview ? "var(--accent)" : "var(--border)"}`,
                          backgroundColor: asset.isPreview ? "var(--accent-dim)" : "transparent",
                          color: asset.isPreview ? "var(--accent)" : "var(--muted)",
                          cursor: "pointer"
                        }}
                      >
                        {asset.isPreview ? "★ PREVIEW" : "SET PREVIEW"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button type="button" disabled={i === 0} onClick={() => {
                      const updated = [...assets];
                      [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                      setAssets(updated);
                    }} style={{ padding: "0.4rem", borderRadius: "4px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--white)", cursor: i === 0 ? "not-allowed" : "pointer", opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                    <button type="button" disabled={i === assets.length - 1} onClick={() => {
                      const updated = [...assets];
                      [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
                      setAssets(updated);
                    }} style={{ padding: "0.4rem", borderRadius: "4px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--white)", cursor: i === assets.length - 1 ? "not-allowed" : "pointer", opacity: i === assets.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button type="button" onClick={() => {
                      const updated = assets.filter(a => a.id !== asset.id);
                      if (asset.isPreview && updated.length > 0) updated[0].isPreview = true;
                      setAssets(updated);
                    }} style={{ padding: "0.4rem", borderRadius: "4px", backgroundColor: "rgba(220, 20, 60, 0.1)", border: "1px solid crimson", color: "crimson" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish Setting */}
        <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
            <input type="checkbox" {...register("published")} style={{ width: 18, height: 18 }} />
            <div>
              <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)" }}>Publish Project</span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--muted)" }}>Make it visible on the live site</span>
            </div>
          </label>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(220, 20, 60, 0.1)", border: "1px solid crimson", borderRadius: "8px", color: "var(--white)" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(172, 255, 67, 0.1)", border: "1px solid var(--accent)", borderRadius: "8px", color: "var(--accent)" }}>
            ✓ Project updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "1rem",
            backgroundColor: saving ? "var(--surface-2)" : "var(--accent)",
            color: saving ? "var(--muted)" : "var(--void)",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--font-inter)",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            marginTop: "1rem",
          }}
        >
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

