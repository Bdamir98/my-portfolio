"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContactSubmission } from "@/lib/supabase/types";
import { format } from "date-fns";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  const fetchMessages = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markRead = async (msg: ContactSubmission) => {
    if (msg.read) return;
    const supabase = createClient();
    await (supabase as any).from("contact_submissions").update({ read: true }).eq("id", msg.id);
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
  };

  const handleSelect = (msg: ContactSubmission) => {
    setSelected(msg);
    markRead(msg);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "1.75rem", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em", marginBottom: "2rem" }}>Messages</h1>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
        {/* List */}
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", fontFamily: "var(--font-inter)", color: "var(--muted)" }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)" }}>No messages yet.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: i < messages.length - 1 ? "1px solid var(--border)" : "none",
                  backgroundColor: selected?.id === msg.id ? "var(--surface-2)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                {!msg.read && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)", flexShrink: 0, marginTop: "0.3rem" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)", fontWeight: msg.read ? 400 : 600 }}>{msg.name}</p>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)" }}>
                      {msg.created_at ? format(new Date(msg.created_at), "MMM d") : ""}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.subject || msg.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <p style={{ fontFamily: "var(--font-clash)", fontSize: "1.25rem", fontWeight: 600, color: "var(--white)" }}>{selected.name}</p>
                <a href={`mailto:${selected.email}`} style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}>{selected.email}</a>
              </div>
              <button onClick={() => setSelected(null)} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "0.375rem 0.75rem", fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "var(--muted)", backgroundColor: "transparent" }}>Close</button>
            </div>
            {selected.subject && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "var(--surface-2)", borderRadius: "8px" }}>
                <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Subject</p>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)" }}>{selected.subject}</p>
              </div>
            )}
            <div style={{ padding: "1rem", backgroundColor: "var(--surface-2)", borderRadius: "8px", marginBottom: "1rem" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--white)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selected.message}</p>
            </div>
            <a
              href={`mailto:${selected.email}?subject=Re: ${selected.subject || "Your message"}`}
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
                textDecoration: "none",
              }}
            >
              Reply via Email
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
