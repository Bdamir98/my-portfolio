"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { YouTubeVideo } from "@/lib/supabase/types";
import { revalidateVideos } from "@/app/actions/media";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  // Already a bare ID (11 chars, alphanumeric + - _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    // youtu.be/ID
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
    // youtube.com/watch?v=ID
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    // youtube.com/embed/ID or /shorts/ID
    const match = url.pathname.match(/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  } catch {
    // not a URL
  }
  return null;
}

async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return data.title ?? "";
    }
  } catch {
    // ignore
  }
  return "";
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  initial?: Partial<YouTubeVideo & { urlInput?: string }>;
  onSave: (data: Omit<YouTubeVideo, "id" | "created_at" | "updated_at">) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const CATEGORIES = ["motion", "web", "graphics", "shorts", "behind-the-scenes", "tutorial", "general"];

function VideoModal({ initial, onSave, onClose, saving }: ModalProps) {
  const [urlInput, setUrlInput] = useState(initial?.youtube_id ?? "");
  const [resolvedId, setResolvedId] = useState<string | null>(initial?.youtube_id ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [published, setPublished] = useState(initial?.published ?? false);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [fetching, setFetching] = useState(false);
  const [idError, setIdError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When URL input changes: parse ID and auto-fetch title
  const handleUrlChange = useCallback((val: string) => {
    setUrlInput(val);
    setIdError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const id = parseYouTubeId(val);
      if (!id) {
        setResolvedId(null);
        if (val.trim()) setIdError("Couldn't find a valid YouTube video ID in that URL.");
        return;
      }
      setResolvedId(id);
      setIdError("");
      if (!initial?.youtube_id) {
        // Only auto-fetch title for new videos
        setFetching(true);
        const t = await fetchYouTubeTitle(id);
        if (t) setTitle(t);
        setFetching(false);
      }
    }, 500);
  }, [initial?.youtube_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedId) { setIdError("Please enter a valid YouTube URL or video ID."); return; }
    await onSave({
      youtube_id: resolvedId,
      title: title.trim() || resolvedId,
      description: description.trim() || null,
      category,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      published,
      featured,
      sort_order: Number(sortOrder),
    });
  };

  const thumbUrl = resolvedId
    ? `https://img.youtube.com/vi/${resolvedId}/mqdefault.jpg`
    : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "2rem",
          width: "min(100%, 580px)",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontFamily: "var(--font-clash)", fontSize: "1.25rem", fontWeight: 700, color: "var(--white)" }}>
            {initial?.youtube_id ? "Edit Video" : "Add YouTube Video"}
          </h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "1.25rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* YouTube URL */}
        <Field label="YouTube URL or Video ID *">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://youtu.be/dQw4w9WgXcQ"
            required
            style={inputStyle}
          />
          {idError && <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "crimson", letterSpacing: "0.08em" }}>{idError}</span>}
          {fetching && <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", color: "var(--muted)", letterSpacing: "0.08em" }}>Fetching title…</span>}
        </Field>

        {/* Thumbnail preview */}
        {thumbUrl && (
          <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", backgroundColor: "#000", border: "1px solid var(--border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Title */}
        <Field label="Title *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video title"
            required
            style={inputStyle}
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional short description…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        {/* Category & Sort order row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "1rem" }}>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Sort Order">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Tags */}
        <Field label="Tags (comma-separated)">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="motion, cinematic, edit"
            style={inputStyle}
          />
        </Field>

        {/* Toggles */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <ToggleField label="Published" checked={published} onChange={setPublished} color="var(--accent)" />
          <ToggleField label="Featured (homepage)" checked={featured} onChange={setFeatured} color="#FFD700" />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
          <button
            type="submit"
            disabled={saving || !resolvedId}
            style={{
              ...ghostBtnStyle,
              backgroundColor: saving ? "rgba(200,241,53,0.1)" : "var(--accent)",
              color: "var(--void)",
              borderColor: "var(--accent)",
              opacity: !resolvedId ? 0.5 : 1,
            }}
          >
            {saving ? "Saving…" : initial?.youtube_id ? "Save Changes" : "Add Video"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleField({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.375rem 0.875rem",
        borderRadius: "100px",
        border: `1px solid ${checked ? color : "var(--border)"}`,
        backgroundColor: checked ? `${color}18` : "transparent",
        color: checked ? color : "var(--muted)",
        fontFamily: "var(--font-jetbrains)",
        fontSize: "0.5625rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: "0.75rem" }}>{checked ? "●" : "○"}</span>
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  backgroundColor: "var(--void)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--white)",
  fontFamily: "var(--font-inter)",
  fontSize: "0.875rem",
  outline: "none",
};

const ghostBtnStyle: React.CSSProperties = {
  padding: "0.5rem 1.25rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  backgroundColor: "transparent",
  color: "var(--muted)",
  fontFamily: "var(--font-inter)",
  fontSize: "0.875rem",
  cursor: "pointer",
  transition: "all 0.2s",
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminVideosPage() {
  const supabase = createClient();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<YouTubeVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("youtube_videos")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    setVideos(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleSave = async (
    data: Omit<YouTubeVideo, "id" | "created_at" | "updated_at">
  ) => {
    setSaving(true);
    if (editTarget) {
      await (supabase as any).from("youtube_videos").update(data).eq("id", editTarget.id);
    } else {
      await (supabase as any).from("youtube_videos").insert(data);
    }
    await revalidateVideos();
    await fetchVideos();
    setSaving(false);
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async (v: YouTubeVideo) => {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setDeleting(v.id);
    await (supabase as any).from("youtube_videos").delete().eq("id", v.id);
    await revalidateVideos();
    setVideos((prev) => prev.filter((x) => x.id !== v.id));
    setDeleting(null);
  };

  const toggleField = async (v: YouTubeVideo, field: "published" | "featured") => {
    setToggling(v.id + field);
    await (supabase as any).from("youtube_videos").update({ [field]: !v[field] }).eq("id", v.id);
    setVideos((prev) => prev.map((x) => x.id === v.id ? { ...x, [field]: !x[field] } : x));
    await revalidateVideos();
    setToggling(null);
  };

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (v: YouTubeVideo) => { setEditTarget(v); setModalOpen(true); };

  return (
    <>
      {modalOpen && (
        <VideoModal
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          saving={saving}
        />
      )}

      <div style={{ padding: "2rem" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em" }}>
              Videos
            </h1>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.25rem" }}>
              YouTube Channel Manager
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              backgroundColor: "var(--accent)",
              color: "var(--void)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            ▶ Add Video
          </button>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 120px 80px 80px 90px 130px",
              gap: "1rem",
              padding: "0.75rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          >
            {["Thumb", "Title", "Category", "Order", "Status", "Featured", "Actions"].map((h) => (
              <p key={h} style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</p>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)" }}>Loading…</p>
            </div>
          ) : videos.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)", marginBottom: "1rem" }}>
                No videos yet.
              </p>
              <button
                onClick={openAdd}
                style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
              >
                Add your first video →
              </button>
            </div>
          ) : (
            videos.map((v, i) => (
              <div
                key={v.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 120px 80px 80px 90px 130px",
                  gap: "1rem",
                  alignItems: "center",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < videos.length - 1 ? "1px solid var(--border)" : "none",
                  opacity: deleting === v.id ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Thumbnail */}
                <div style={{ borderRadius: "6px", overflow: "hidden", aspectRatio: "16/9", backgroundColor: "#000" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {/* Title & ID */}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--white)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5rem", color: "var(--muted)", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
                    {v.youtube_id}
                  </p>
                </div>

                {/* Category */}
                <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {v.category}
                </span>

                {/* Sort order */}
                <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--muted)" }}>
                  {v.sort_order}
                </span>

                {/* Published */}
                <button
                  onClick={() => toggleField(v, "published")}
                  disabled={toggling === v.id + "published"}
                  style={{
                    padding: "0.25rem 0.625rem",
                    borderRadius: "100px",
                    border: `1px solid ${v.published ? "rgba(200,241,53,0.35)" : "var(--border)"}`,
                    backgroundColor: v.published ? "rgba(200,241,53,0.12)" : "transparent",
                    color: v.published ? "var(--accent)" : "var(--muted)",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {v.published ? "Live" : "Draft"}
                </button>

                {/* Featured */}
                <button
                  onClick={() => toggleField(v, "featured")}
                  disabled={toggling === v.id + "featured"}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "100px",
                    border: `1px solid ${v.featured ? "rgba(255,200,50,0.4)" : "var(--border)"}`,
                    backgroundColor: v.featured ? "rgba(255,200,50,0.12)" : "transparent",
                    color: v.featured ? "#FFD700" : "var(--muted)",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "0.625rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <span>{v.featured ? "★" : "☆"}</span>
                  {v.featured ? "On" : "Off"}
                </button>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button
                    onClick={() => openEdit(v)}
                    style={{
                      padding: "0.3rem 0.625rem",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "var(--muted)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v)}
                    disabled={deleting === v.id}
                    style={{
                      padding: "0.3rem 0.625rem",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "var(--muted)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "crimson"; e.currentTarget.style.color = "crimson"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
