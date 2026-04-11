"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import slugify from "slugify";
import { createClient } from "@/lib/supabase/client";
import { processAndUploadMedia, revalidatePortfolio } from "@/app/actions/media";
import type { ProjectInsert } from "@/lib/supabase/types";

const schema = z.object({
  title: z.string().optional(),
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

export default function NewProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ name: string, slug: string, allowed_types?: ("image" | "video")[], is_multi?: boolean }[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [assets, setAssets] = useState<{ id: string; file?: File; url: string; isPreview: boolean; title?: string; description?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [driveImageUrl, setDriveImageUrl] = useState("");

  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    const { data } = await (supabase as any).from("site_settings").select("value").eq("key", "project_categories").maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      setCategories(data.value as any);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);



  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "graphics" as any, published: false },
  });

  const category = watch("category");
  const currentCategory = categories.find(c => c.slug === category);
  const isSpecialCategory = category === ("motion" as any) || category === ("web" as any);
  const categoryAllowsVideo = currentCategory?.allowed_types?.includes("video") ?? false;

  const onDrop = useCallback(async (accepted: File[]) => {
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

    const newAssets = filesToProcess.map(file => {
      // Initialize per-asset metadata from filename
      const title = file.name.split(".")[0].replace(/[_-]/g, " ");

      return {
        id: Math.random().toString(36).slice(2),
        file,
        url: URL.createObjectURL(file), // Show local preview
        isPreview: false,
        title: title,
        description: ""
      };
    });

    setAssets((prev) => {
      const updated = [...prev, ...newAssets];
      if (updated.length > 0 && !updated.find(a => a.isPreview)) {
        updated[0].isPreview = true;
      }
      return updated;
    });
  }, [currentCategory]);

  const dropzoneAccept: any = {};
  const allowed = currentCategory?.allowed_types || ["image", "video"];
  if (allowed.includes("image")) dropzoneAccept["image/*"] = [];
  if (allowed.includes("video")) dropzoneAccept["video/*"] = [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: dropzoneAccept,
    multiple: currentCategory?.is_multi !== false,
  });


  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError("");

    if (assets.length === 0) {
      setError("Please upload at least one image/video.");
      setSubmitting(false);
      return;
    }

    try {
      if (bulkMode && !isSpecialCategory) {
        // Bulk Upload Logic: Multiple projects from multiple images
        setUploading(true);
        const results = await Promise.all(assets.map(async (asset) => {
          if (!asset.file) return null;

          const formData = new FormData();
          formData.append("file", asset.file);

          const result = await processAndUploadMedia(formData);
          if (!result) return null;

          const title = asset.title || result.name.split(".")[0].replace(/[_-]/g, " ");
          const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now()}`;

          return {
            title: title,
            slug: slug,
            category: data.category,
            published: data.published,
            cover_url: result.url,
            media_urls: [result.url],
            metadata: {
              width: result.dimensions.width,
              height: result.dimensions.height,
              aspect_ratio: result.dimensions.ratio,
              orientation: result.dimensions.orientation
            },
            description: asset.description || "",
            long_description: "",
            featured: false,
            sort_order: 0,
            view_count: 0,
          };
        }));

        const validInserts = results.filter(Boolean);
        const { error: insertError } = await (supabase as any).from("projects").insert(validInserts);
        if (insertError) throw insertError;

      } else {
        // Standard Single Project Logic
        setUploading(true);

        // Upload all new files via Server Action
        const processedAssets = await Promise.all(assets.map(async (asset) => {
          if (asset.file) {
            const formData = new FormData();
            formData.append("file", asset.file);
            const result = await processAndUploadMedia(formData);
            return { ...asset, url: result.url, dimensions: result.dimensions };
          }
          return asset;
        }));

        const validUrls = processedAssets.map(a => a.url).filter(Boolean) as string[];
        const previewAsset = processedAssets.find(a => a.isPreview) || processedAssets[0];

        const dims = (previewAsset as any).dimensions || { width: 0, height: 0, ratio: 0, orientation: "unknown" };

        const projectMetadata: any = {
          width: dims.width,
          height: dims.height,
          aspect_ratio: dims.ratio,
          orientation: dims.orientation
        };

        if (categoryAllowsVideo) {
          if (data.drive_url) projectMetadata.drive_url = data.drive_url;
          else delete projectMetadata.drive_url;
          if (data.youtube_url) projectMetadata.youtube_url = data.youtube_url;
          else delete projectMetadata.youtube_url;
        }

        const insert: ProjectInsert = {
          title: data.title || "Untitled Project",
          slug: data.slug,
          category: data.category as string,
          tech_stack: data.tech_stack ? data.tech_stack.split(",").map((t) => t.trim()).filter(Boolean) : [],
          published: data.published,
          cover_url: previewAsset?.url || null,
          media_urls: validUrls,
          metadata: projectMetadata,
          description: data.description || "",
          long_description: "",
          featured: false,
          sort_order: 0,
          view_count: 0,
        };
        const { error: insertError } = await (supabase as any).from("projects").insert(insert);
        if (insertError) throw insertError;
      }

      await revalidatePortfolio();
      router.push("/admin/projects");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "860px" }}>
      <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em", marginBottom: "2rem" }}>
        New Project Entry
      </h1>

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

        {!isSpecialCategory && (
          <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input type="checkbox" checked={bulkMode} onChange={e => setBulkMode(e.target.checked)} style={{ width: 18, height: 18 }} />
              <div>
                <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)" }}>Bulk Upload Mode</span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--muted)" }}>Each image uploaded will be created as a separate project entry.</span>
              </div>
            </label>
          </div>
        )}

        {(!bulkMode || isSpecialCategory) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Project Title</label>
              <input {...register("title")} placeholder="Project Title" style={inputStyle}
                onChange={(e) => {
                  register("title").onChange(e);
                  setValue("slug", slugify(e.target.value, { lower: true, strict: true }));
                }}
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
        )}

        {categoryAllowsVideo && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>Video URL Options (Optional)</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>Paste a Google Drive or YouTube URL to embed a video player on the project page.</p>
            </div>
            <div>
              <label style={labelStyle}>Google Drive Video URL</label>
              <input {...register("drive_url")} placeholder="https://drive.google.com/file/d/..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>YouTube Video URL</label>
              <input {...register("youtube_url")} placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." style={inputStyle} />
            </div>
          </div>
        )}

        {category === ("web" as any) && (
          <div>
            <label style={labelStyle}>Technologies Used</label>
            <input {...register("tech_stack")} placeholder="Next.js, React, Tailwind CSS" style={inputStyle} />
          </div>
        )}

        {/* Media Upload */}
        <div>
          <label style={labelStyle}>
            {bulkMode ? "Upload Multiple Images" : isSpecialCategory ? "Thumbnail Image" : "Project Media"}
          </label>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "8px", padding: "3rem 1rem", textAlign: "center", cursor: "pointer",
              backgroundColor: isDragActive ? "var(--accent-dim)" : "var(--surface)",
              transition: "all 0.2s",
            }}
          >
            <input {...getInputProps()} />
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--white)" }}>
              {bulkMode ? "Drop all images here to create separate projects" : "Drag & drop files here, or click to select files"}
            </p>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <input 
              type="url"
              placeholder="Or paste any Image URL (CDN, Drive, etc) here..."
              value={driveImageUrl}
              onChange={(e) => setDriveImageUrl(e.target.value)}
              style={{ ...inputStyle, flex: 1, padding: "0.6rem 1rem", fontSize: "0.8125rem" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("add-url-btn")?.click();
                }
              }}
            />
            <button 
              id="add-url-btn"
              type="button"
              onClick={() => {
                if (!driveImageUrl) return;
                let parsedUrl = driveImageUrl;
                
                // Convert Google Drive view URL to direct image URL
                if (parsedUrl.includes("drive.google.com/file/d/")) {
                  const match = parsedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                  if (match && match[1]) {
                    parsedUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                  }
                }
                
                const newAsset = {
                  id: Math.random().toString(36).slice(2),
                  url: parsedUrl,
                  isPreview: assets.length === 0,
                  title: "Image from URL",
                  description: ""
                };
                
                setAssets(prev => {
                  const updated = [...prev, newAsset];
                  if (updated.length > 0 && !updated.find(a => a.isPreview)) {
                    updated[0].isPreview = true;
                  }
                  return updated;
                });
                setDriveImageUrl("");
              }}
              style={{
                padding: "0 1.5rem",
                backgroundColor: "var(--surface)",
                color: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.6875rem",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Add URL
            </button>
          </div>

          {assets.length > 0 && (
            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {assets.map((asset, i) => (
                <div key={asset.id} style={{
                  display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem",
                  backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
                }}>
                  {/* Thumbnail */}
                  <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--surface-2)", flexShrink: 0 }}>
                    {asset.file?.type.startsWith("video/") ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", color: "var(--muted)" }}>Video</div>
                    ) : (
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <Image 
                          src={asset.url} 
                          alt="Preview" 
                          fill 
                          style={{ objectFit: "cover" }} 
                          unoptimized 
                        />
                      </div>
                    )}
                  </div>

                  {/* Info / Metadata Inputs */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {bulkMode ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div>
                          <label style={{ ...labelStyle, fontSize: "0.5rem", marginBottom: "0.2rem" }}>Project Title</label>
                          <input
                            style={{ ...inputStyle, padding: "0.4rem 0.75rem", fontSize: "0.8125rem" }}
                            value={asset.title}
                            placeholder="Project Title"
                            onChange={(e) => {
                              const updated = [...assets];
                              updated[i] = { ...asset, title: e.target.value };
                              setAssets(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: "0.5rem", marginBottom: "0.2rem" }}>Description</label>
                          <textarea
                            style={{ ...inputStyle, padding: "0.4rem 0.75rem", fontSize: "0.8125rem", minHeight: "60px", resize: "vertical" }}
                            value={asset.description}
                            placeholder="Short description..."
                            onChange={(e) => {
                              const updated = [...assets];
                              updated[i] = { ...asset, description: e.target.value };
                              setAssets(updated);
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ overflow: "hidden" }}>
                          <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--white)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {asset.file?.name || "Existing Asset"}
                          </p>
                          <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.6875rem", color: "var(--muted)", margin: 0 }}>
                            {(asset.file?.size ?? 0) / 1024 < 1024 ? `${((asset.file?.size ?? 0) / 1024).toFixed(1)} KB` : `${((asset.file?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB`}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setAssets(prev => prev.map(a => ({ ...a, isPreview: a.id === asset.id })));
                            }}
                            style={{
                              padding: "0.25rem 0.625rem", borderRadius: "4px", fontSize: "0.625rem", fontFamily: "var(--font-jetbrains)",
                              border: `1px solid ${asset.isPreview ? "var(--accent)" : "var(--border)"}`,
                              backgroundColor: asset.isPreview ? "var(--accent-dim)" : "transparent",
                              color: asset.isPreview ? "var(--accent)" : "var(--muted)",
                              cursor: "pointer"
                            }}
                          >
                            {asset.isPreview ? "★ PREVIEW IMAGE" : "SET AS PREVIEW"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Controls */}
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        setAssets(prev => {
                          const updated = [...prev];
                          [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                          return updated;
                        });
                      }}
                      style={{ padding: "0.5rem", borderRadius: "6px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--white)", cursor: i === 0 ? "not-allowed" : "pointer", opacity: i === 0 ? 0.3 : 1 }}
                    >↑</button>
                    <button
                      type="button"
                      disabled={i === assets.length - 1}
                      onClick={() => {
                        setAssets(prev => {
                          const updated = [...prev];
                          [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
                          return updated;
                        });
                      }}
                      style={{ padding: "0.5rem", borderRadius: "6px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--white)", cursor: i === assets.length - 1 ? "not-allowed" : "pointer", opacity: i === assets.length - 1 ? 0.3 : 1 }}
                    >↓</button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssets(prev => {
                          const updated = prev.filter(a => a.id !== asset.id);
                          if (asset.isPreview && updated.length > 0) {
                            updated[0].isPreview = true;
                          }
                          return updated;
                        });
                      }}
                      style={{ padding: "0.5rem", borderRadius: "6px", backgroundColor: "rgba(220, 20, 60, 0.1)", border: "1px solid crimson", color: "crimson", cursor: "pointer" }}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "1rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
            <input type="checkbox" {...register("published")} style={{ width: 18, height: 18 }} />
            <div>
              <span style={{ display: "block", fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)" }}>Publish Automatically</span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--muted)" }}>Make visibility active on live site.</span>
            </div>
          </label>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(220, 20, 60, 0.1)", border: "1px solid crimson", borderRadius: "8px", color: "var(--white)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          style={{
            padding: "1rem",
            backgroundColor: submitting || uploading ? "var(--surface-2)" : "var(--accent)",
            color: submitting || uploading ? "var(--muted)" : "var(--void)",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--font-inter)",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: submitting || uploading ? "not-allowed" : "pointer",
            marginTop: "1rem",
          }}
        >
          {uploading ? "Processing Files..." : submitting ? "Saving..." : bulkMode ? `Create ${assets.length} Projects` : "Save Project"}
        </button>
      </form>
    </div>
  );
}
