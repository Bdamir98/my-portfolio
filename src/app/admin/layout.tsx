"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/admin/projects", label: "Projects", icon: "◈" },
  { href: "/admin/categories", label: "Categories", icon: "✥" },
  { href: "/admin/website-management", label: "Website Management", icon: "⚙" },
  { href: "/admin/messages", label: "Messages", icon: "◉" },
  { href: "/", label: "View Site →", icon: "↗" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        backgroundColor: "var(--void)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0",
          position: "sticky",
          top: 0,
          height: "100dvh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0 1.5rem 2rem", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-clash)", fontSize: "1.25rem", fontWeight: 700, color: "var(--white)" }}>
            AH<span style={{ color: "var(--accent)" }}>.</span>
          </p>
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.5625rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.25rem" }}>
            CMS
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "8px",
                  backgroundColor: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid var(--border-accent)" : "1px solid transparent",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--accent)" : "var(--muted)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "0.875rem", opacity: 0.7 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.75rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              fontFamily: "var(--font-inter)",
              fontSize: "0.875rem",
              color: "var(--muted)",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "crimson"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
          >
            <span>⊗</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
