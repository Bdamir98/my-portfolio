"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useDropzone } from "react-dropzone";

const TABS = [
  { id: "hero", label: "Hero" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
  { id: "global", label: "Global" },
];

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

const textareaStyle = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical" as const,
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

export default function WebsiteManagement() {
  const [activeTab, setActiveTab] = useState("hero");
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("site_settings").select("*");
    if (!error && data) {
      const s: any = {};
      data.forEach((row: any) => {
        s[row.key] = row.value;
      });

      // Ensure default structures for new keys if missing
      if (!s.work) s.work = { label: "Selected Work", title: "Everything I've Built" };
      if (!s.global?.social_links) {
        s.global = {
          ...s.global,
          social_links: [
            { label: "GitHub", href: "#", icon: "GH" },
            { label: "Instagram", href: "#", icon: "IG" },
            { label: "LinkedIn", href: "#", icon: "LI" },
            { label: "Twitter / X", href: "#", icon: "X" }
          ],
          logo_text: "AH", logo_accent: "."
        };
      }
      if (!s.about?.metrics) {
        s.about = {
          ...s.about,
          metrics: [
            { label: "Years Experience", value: "5+" },
            { label: "Projects Completed", value: "120+" }
          ],
          location_label: "📍 Bangladesh",
          expertise: [
            { category: "Photography", items: ["Portrait", "Product"], pct: 90 }
          ],
          timeline: [
            { year: "2024-Now", role: "Creative Director", company: "Freelance", desc: "Digital experiences." }
          ]
        };
      }

      setSettings(s);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string) => {
    setSaving(true);
    setMessage("");

    // Check if row exists first for new keys
    const { data: existing } = await supabase.from("site_settings").select("key").eq("key", key).maybeSingle();

    let res;
    if (existing) {
      res = await (supabase as any)
        .from("site_settings")
        .update({ value: settings[key], updated_at: new Date().toISOString() })
        .eq("key", key);
    } else {
      res = await (supabase as any)
        .from("site_settings")
        .insert({ key, value: settings[key] });
    }

    if (res.error) {
      setMessage(`Error saving ${key}: ${res.error.message}`);
    } else {
      setMessage(`${key.charAt(0).toUpperCase() + key.slice(1)} settings saved!`);
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "portfolio-revalidate-secret-2024", path: "/" }),
      }).catch(() => null);
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const updateNested = (key: string, path: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev };
      const keys = path.split(".");
      let current = newSettings[key];
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const ImageUploader = ({ currentUrl, onUpload, label }: { currentUrl: string, onUpload: (url: string) => void, label: string }) => {
    const [uploading, setUploading] = useState(false);
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      const file = acceptedFiles[0];
      const ext = file.name.split(".").pop();
      const path = `site-assets/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("project-media").upload(path, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("project-media").getPublicUrl(path);
        onUpload(data.publicUrl);
      }
      setUploading(false);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { "image/*": [] },
      multiple: false,
    });

    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
          {currentUrl && (
            <div style={{ position: "relative", width: 120, height: 120, borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
              <Image 
                src={currentUrl} 
                alt={label} 
                fill 
                style={{ objectFit: "cover" }} 
                unoptimized 
              />
            </div>
          )}
          <div
            {...getRootProps()}
            style={{
              flex: 1, height: 120, border: "2px dashed var(--border)", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              backgroundColor: isDragActive ? "var(--accent-dim)" : "var(--surface)",
              transition: "all 0.2s"
            }}
          >
            <input {...getInputProps()} />
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--muted)", textAlign: "center", padding: "1rem" }}>
              {uploading ? "Uploading..." : isDragActive ? "Drop here" : "Drag or click to change image"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ListEditor = ({ items, onChange, fields, title }: { items: any[], onChange: (items: any[]) => void, fields: { key: string, label: string, type?: string }[], title: string }) => (
    <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{title}</label>
        <button
          onClick={() => onChange([...items, fields.reduce((acc: any, f) => ({ ...acc, [f.key]: f.type === "number" ? 0 : f.type === "array" ? [] : "" }), {})])}
          style={{ padding: "0.4rem 1rem", backgroundColor: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "6px", fontFamily: "var(--font-jetbrains)", fontSize: "0.625rem", cursor: "pointer" }}
        >
          + Add Item
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ position: "relative", padding: "1rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", display: "grid", gridTemplateColumns: `repeat(${fields.length}, 1fr)`, gap: "1rem" }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ ...labelStyle, fontSize: "0.5rem" }}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    style={{ ...textareaStyle, minHeight: "60px", fontSize: "0.8125rem" }}
                    value={item[f.key]}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, [f.key]: e.target.value };
                      onChange(newItems);
                    }}
                  />
                ) : f.type === "array" ? (
                  <input
                    style={{ ...inputStyle, fontSize: "0.8125rem" }}
                    value={Array.isArray(item[f.key]) ? item[f.key].join(", ") : ""}
                    placeholder="tag1, tag2..."
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, [f.key]: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) };
                      onChange(newItems);
                    }}
                  />
                ) : (
                  <input
                    type={f.type || "text"}
                    style={{ ...inputStyle, fontSize: "0.8125rem" }}
                    value={item[f.key]}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value };
                      onChange(newItems);
                    }}
                  />
                )}
              </div>
            ))}
            <button
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              style={{ position: "absolute", top: "-10px", right: "-10px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "crimson", color: "white", border: "none", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: "4rem", color: "var(--muted)" }}>Loading CMS...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", marginBottom: "0.5rem" }}>
          Website Content Management
        </h1>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--muted)" }}>
          Control all text and images across your portfolio website.
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", marginBottom: "2rem", overflowX: "auto" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1.25rem", border: "none", backgroundColor: "transparent",
              fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", textTransform: "uppercase",
              color: activeTab === tab.id ? "var(--accent)" : "var(--muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.05em", whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: "60vh" }}>
        {activeTab === "hero" && settings.hero && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Headline Title</label>
                <input style={inputStyle} value={settings.hero.title} onChange={e => updateNested("hero", "title", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Tagline</label>
                <input style={inputStyle} value={settings.hero.tagline} onChange={e => updateNested("hero", "tagline", e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Intro Subtext</label>
              <textarea style={textareaStyle} value={settings.hero.subtext} onChange={e => updateNested("hero", "subtext", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Rotating Words (comma separated)</label>
              <input style={inputStyle} value={settings.hero.rotating_words?.join(", ")} onChange={e => updateNested("hero", "rotating_words", e.target.value.split(",").map(s => s.trim()))} />
            </div>
            <ImageUploader label="Revealer Image" currentUrl={settings.hero.reveal_image} onUpload={(url) => updateNested("hero", "reveal_image", url)} />
            <button style={{ alignSelf: "flex-start", padding: "0.75rem 2rem", backgroundColor: "var(--accent)", color: "var(--void)", border: "none", borderRadius: "100px", fontWeight: 600, cursor: "pointer" }} onClick={() => handleSave("hero")} disabled={saving}>Save Hero</button>
          </div>
        )}

        {activeTab === "work" && settings.work && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Work Section Tagline</label>
                <input style={inputStyle} value={settings.work.label} onChange={e => updateNested("work", "label", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Main Title</label>
                <input style={inputStyle} value={settings.work.title} onChange={e => updateNested("work", "title", e.target.value)} />
              </div>
            </div>
            <button style={{ alignSelf: "flex-start", padding: "0.75rem 2rem", backgroundColor: "var(--accent)", color: "var(--void)", border: "none", borderRadius: "100px", fontWeight: 600, cursor: "pointer" }} onClick={() => handleSave("work")} disabled={saving}>Save Work Page</button>
          </div>
        )}

        {activeTab === "about" && settings.about && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Main Title</label>
                <input style={inputStyle} value={settings.about.title} onChange={e => updateNested("about", "title", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Location/Accent Label</label>
                <input style={inputStyle} value={settings.about.location_label} onChange={e => updateNested("about", "location_label", e.target.value)} />
              </div>
            </div>

            <ImageUploader label="About Photo" currentUrl={settings.about.image_url} onUpload={(url) => updateNested("about", "image_url", url)} />

            <div>
              <label style={labelStyle}>Philosophy Paragraphs</label>
              {(settings.about.philosophy || []).map((para: string, i: number) => (
                <textarea key={i} style={{ ...textareaStyle, marginBottom: "0.75rem" }} value={para} onChange={e => {
                  const p = [...settings.about.philosophy]; p[i] = e.target.value; updateNested("about", "philosophy", p);
                }} />
              ))}
            </div>

            <ListEditor
              title="Metrics (Stats)"
              items={settings.about.metrics || []}
              onChange={(items) => updateNested("about", "metrics", items)}
              fields={[{ key: "label", label: "Label" }, { key: "value", label: "Value" }]}
            />

            <ListEditor
              title="Expertise (Skills)"
              items={settings.about.expertise || []}
              onChange={(items) => updateNested("about", "expertise", items)}
              fields={[{ key: "category", label: "Category" }, { key: "items", label: "Skills (Tags)", type: "array" }, { key: "pct", label: "Percentage %", type: "number" }]}
            />

            <ListEditor
              title="Experience Timeline"
              items={settings.about.timeline || []}
              onChange={(items) => updateNested("about", "timeline", items)}
              fields={[{ key: "year", label: "Year" }, { key: "role", label: "Role" }, { key: "company", label: "Company" }, { key: "desc", label: "Description", type: "textarea" }]}
            />

            <button style={{ alignSelf: "flex-start", padding: "0.75rem 2rem", backgroundColor: "var(--accent)", color: "var(--void)", border: "none", borderRadius: "100px", fontWeight: 600, cursor: "pointer" }} onClick={() => handleSave("about")} disabled={saving}>Save About</button>
          </div>
        )}

        {activeTab === "contact" && settings.contact && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Heading</label>
                <input style={inputStyle} value={settings.contact.heading} onChange={e => updateNested("contact", "heading", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Availability</label>
                <input style={inputStyle} value={settings.contact.availability} onChange={e => updateNested("contact", "availability", e.target.value)} />
              </div>
            </div>
            <textarea style={textareaStyle} value={settings.contact.subtext} onChange={e => updateNested("contact", "subtext", e.target.value)} />
            <input style={inputStyle} placeholder="Email" value={settings.contact.email} onChange={e => updateNested("contact", "email", e.target.value)} />
            <button style={{ alignSelf: "flex-start", padding: "0.75rem 2rem", backgroundColor: "var(--accent)", color: "var(--void)", border: "none", borderRadius: "100px", fontWeight: 600, cursor: "pointer" }} onClick={() => handleSave("contact")} disabled={saving}>Save Contact</button>
          </div>
        )}

        {activeTab === "global" && settings.global && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Logo Text</label>
                <input style={inputStyle} value={settings.global.logo_text} onChange={e => updateNested("global", "logo_text", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Logo Accent (e.g. "." )</label>
                <input style={inputStyle} value={settings.global.logo_accent} onChange={e => updateNested("global", "logo_accent", e.target.value)} />
              </div>
            </div>
            <ListEditor
              title="Social Links"
              items={settings.global.social_links || []}
              onChange={(items) => updateNested("global", "social_links", items)}
              fields={[{ key: "label", label: "Label (e.g. Instagram)" }, { key: "href", label: "URL" }, { key: "icon", label: "Icon Shorthand (e.g. IG, GH, LI)" }]}
            />
            <div>
              <label style={labelStyle}>Footer Copyright</label>
              <input style={inputStyle} value={settings.global.footer_text} onChange={e => updateNested("global", "footer_text", e.target.value)} />
            </div>
            <button style={{ alignSelf: "flex-start", padding: "0.75rem 2rem", backgroundColor: "var(--accent)", color: "var(--void)", border: "none", borderRadius: "100px", fontWeight: 600, cursor: "pointer" }} onClick={() => handleSave("global")} disabled={saving}>Save Global</button>
          </div>
        )}
      </div>

      {message && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", padding: "1rem 2rem", backgroundColor: message.includes("Error") ? "crimson" : "var(--accent)", color: "white", borderRadius: "8px", zIndex: 100 }}>
          {message}
        </div>
      )}
    </div>
  );
}

