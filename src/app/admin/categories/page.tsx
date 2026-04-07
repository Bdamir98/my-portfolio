"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import slugify from "slugify";

interface Category {
  name: string;
  slug: string;
  allowed_types: ("image" | "video")[];
  is_multi: boolean;
}

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  fontFamily: "var(--font-inter)",
  fontSize: "0.9375rem",
  color: "var(--white)",
  outline: "none",
  transition: "all 0.2s",
};

const labelStyle = {
  fontFamily: "var(--font-jetbrains)",
  fontSize: "0.5625rem",
  color: "var(--muted)",
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  display: "block",
  marginBottom: "0.5rem",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("site_settings").select("value").eq("key", "project_categories").maybeSingle();
    
    if (!error && (data as any)?.value && Array.isArray((data as any).value)) {
      // Migration & Loading
      const mapped = (data as any).value.map((cat: any) => ({
        name: cat.name || "Untitled",
        slug: cat.slug || "",
        allowed_types: cat.allowed_types || ["image", "video"],
        is_multi: cat.is_multi !== undefined ? !!cat.is_multi : true
      }));
      setCategories(mapped);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async (updated: Category[]) => {
    setSaving(true);
    setMessage("");

    const { error } = await (supabase as any)
      .from("site_settings")
      .update({ value: updated, updated_at: new Date().toISOString() })
      .eq("key", "project_categories");

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setCategories(updated);
      setMessage("Categories saved successfully!");
      // Revalidate public site
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "portfolio-revalidate-secret-2024", path: "/" }),
      }).catch(() => null);
    }
    
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const addCategory = () => {
    const newCat: Category = {
      name: "New Category",
      slug: "new-category-" + Math.random().toString(36).slice(2, 5),
      allowed_types: ["image"],
      is_multi: true,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
  };

  const updateCategory = (idx: number, updates: Partial<Category>) => {
    const updated = [...categories];
    const newCat = { ...updated[idx], ...updates };
    
    // Auto-update slug if name changes
    if (updates.name) {
      newCat.slug = slugify(updates.name, { lower: true, strict: true }) || newCat.slug;
    }
    
    updated[idx] = newCat;
    setCategories(updated);
  };

  const deleteCategory = (idx: number) => {
    const updated = categories.filter((_, i) => i !== idx);
    setCategories(updated);
  };

  if (loading) return <div style={{ padding: "4rem", color: "var(--muted)", fontFamily: "var(--font-inter)" }}>Loading Categories...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "2rem", fontWeight: 700, color: "var(--white)", marginBottom: "0.5rem" }}>
              Category Management
            </h1>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--muted)" }}>
              Define how your projects are grouped and what assets they support.
            </p>
          </div>
          <button
            onClick={addCategory}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "var(--accent)",
              color: "var(--void)",
              border: "none",
              borderRadius: "100px",
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            + New Category
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {categories.map((cat, idx) => (
          <div
            key={idx}
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* Category Name & Slug */}
            <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Category Name</label>
                <input
                  style={inputStyle}
                  value={cat.name}
                  onChange={(e) => updateCategory(idx, { name: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Slug (Read Only)</label>
                <input style={{ ...inputStyle, opacity: 0.5 }} value={cat.slug} disabled />
              </div>
            </div>

            {/* Constraints */}
            <div style={{ display: "flex", gap: "2.5rem" }}>
              <div>
                <label style={labelStyle}>Allowed Asset Types</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                  {["image", "video"].map((type) => (
                    <label key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "var(--white)", fontFamily: "var(--font-inter)", fontSize: "0.8125rem", textTransform: "capitalize" }}>
                      <input
                        type="checkbox"
                        checked={cat.allowed_types.includes(type as any)}
                        onChange={(e) => {
                          const current = cat.allowed_types || [];
                          const updated = e.target.checked 
                            ? [...current, type as any]
                            : current.filter(t => t !== type);
                          updateCategory(idx, { allowed_types: updated });
                        }}
                        style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
                      />
                      {type}s
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Upload Limit</label>
                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "var(--white)", fontFamily: "var(--font-inter)", fontSize: "0.8125rem" }}>
                    <input
                      type="checkbox"
                      checked={cat.is_multi}
                      onChange={(e) => updateCategory(idx, { is_multi: e.target.checked })}
                      style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
                    />
                    Multiple Files (Showcase Mode)
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
              <button
                onClick={() => deleteCategory(idx)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "transparent",
                  color: "crimson",
                  border: "1px solid rgba(220, 20, 60, 0.2)",
                  borderRadius: "8px",
                  fontSize: "0.625rem",
                  fontFamily: "var(--font-jetbrains)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(220, 20, 60, 0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                Delete Category
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length > 0 && (
        <div style={{ marginTop: "3rem", display: "flex", gap: "1rem" }}>
          <button
            onClick={() => handleSave(categories)}
            disabled={saving}
            style={{
              padding: "1rem 2.5rem",
              backgroundColor: "var(--accent)",
              color: "var(--void)",
              border: "none",
              borderRadius: "12px",
              fontFamily: "var(--font-inter)",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 30px var(--accent-dim)",
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? "Saving Changes..." : "Publish Category Settings"}
          </button>
        </div>
      )}

      {/* Floating Notification */}
      {message && (
        <div 
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            padding: "1rem 2rem",
            backgroundColor: message.includes("Error") ? "crimson" : "var(--accent)",
            color: message.includes("Error") ? "var(--white)" : "var(--void)",
            borderRadius: "12px",
            fontFamily: "var(--font-inter)",
            fontSize: "0.875rem",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%) translateY(20px); opacity: 0; }
          to { transform: translateX(0) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
