"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError || !data.session) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--void)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--white)",
              marginBottom: "0.5rem",
            }}
          >
            AH<span style={{ color: "var(--accent)" }}>.</span>
          </p>
          <p
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.625rem",
              color: "var(--muted)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Admin Portal
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            padding: "2.5rem",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--white)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.875rem",
              color: "var(--muted)",
              marginBottom: "2rem",
            }}
          >
            Sign in to manage your portfolio
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.625rem",
                  color: "var(--muted)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.9375rem",
                  color: "var(--white)",
                  outline: "none",
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
              />
            </div>

            <div>
              <label
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "0.625rem",
                  color: "var(--muted)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.9375rem",
                  color: "var(--white)",
                  outline: "none",
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
              />
            </div>

            {error && (
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.8125rem",
                  color: "crimson",
                  padding: "0.75rem",
                  border: "1px solid crimson",
                  borderRadius: "8px",
                  backgroundColor: "rgba(220,20,60,0.08)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.875rem",
                backgroundColor: loading ? "var(--surface-2)" : "var(--accent)",
                color: loading ? "var(--muted)" : "var(--void)",
                fontFamily: "var(--font-inter)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                marginTop: "0.5rem",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
