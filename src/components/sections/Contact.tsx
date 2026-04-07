"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

interface ContactProps {
  settings?: {
    heading: string;
    subtext: string;
    email: string;
    availability: string;
  };
  globalSettings?: {
    social_links: { label: string; href: string; icon: string }[];
  };
}

export default function Contact({ settings, globalSettings }: ContactProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const heading = settings?.heading || "Let's Work Together";
  const subtext = settings?.subtext || "Have a project in mind? I'd love to hear about it.";
  const email = settings?.email || "hello@amirhossain.com";
  const availability = settings?.availability || "Available for new projects";
  const socialLinks = globalSettings?.social_links || [
    { label: "GitHub", href: "#", icon: "GH" },
    { label: "Instagram", href: "#", icon: "IG" },
    { label: "LinkedIn", href: "#", icon: "LI" },
    { label: "Twitter / X", href: "#", icon: "X" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const supabase = createClient();
    const { error } = await (supabase as any).from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });

    if (error) {
      setServerError("Something went wrong. Please try again.");
      return;
    }

    // Success animation
    if (formRef.current) {
      gsap.to(formRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        onComplete: () => {
          setSubmitted(true);
          if (successRef.current) {
            gsap.fromTo(
              successRef.current,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }
            );
          }
        },
      });
    } else {
      setSubmitted(true);
    }
    reset();
  };

  const inputStyle = {
    width: "100%",
    padding: "0.875rem 1rem",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontFamily: "var(--font-inter)",
    fontSize: "0.9375rem",
    color: "var(--white)",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "var(--font-jetbrains)",
    fontSize: "0.625rem",
    color: "var(--muted)",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "0.5rem",
  };

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "6rem 2.5rem",
      }}
    >
      {/* Header */}
      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ display: "inline-block", width: 32, height: 1, backgroundColor: "var(--accent)" }} />
        Get In Touch
      </p>
      <h1 style={{ fontFamily: "var(--font-clash)", fontSize: "clamp(2.5rem, 7vw, 6rem)", fontWeight: 700, color: "var(--white)", lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: "4rem" }}>
        {heading.includes(" ") ? (
          <>
            {heading.split(" ").slice(0, -2).join(" ")}
            {heading.split(" ").length > 2 && <br />}
            {heading.split(" ").slice(-2, -1)}
            <br />
            <span style={{ color: "var(--accent)" }}>{heading.split(" ").slice(-1)}</span>
          </>
        ) : heading}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "start" }}>
        {/* Left — info */}
        <div>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.0625rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "3rem" }}>
            {subtext}
          </p>

          {/* Availability badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 1.25rem", border: "1px solid var(--border-accent)", borderRadius: "100px", backgroundColor: "var(--accent-dim)", marginBottom: "3rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent)", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.08em" }}>
              {availability}
            </span>
          </div>

          {/* Email */}
          <div style={{ marginBottom: "3rem" }}>
            <p style={{ ...labelStyle }}>Email</p>
            <a
              href={`mailto:${email}`}
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--white)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--white)"; }}
            >
              {email}
            </a>
          </div>

          {/* Socials */}
          <div>
            <p style={{ ...labelStyle, marginBottom: "1rem" }}>Follow</p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {socialLinks.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "0.625rem",
                    color: "var(--muted)",
                    textDecoration: "none",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--accent)";
                    el.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border)";
                    el.style.color = "var(--muted)";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {submitted ? (
            <div
              ref={successRef}
              style={{
                padding: "4rem 2rem",
                textAlign: "center",
                border: "1px solid var(--border-accent)",
                borderRadius: "16px",
                backgroundColor: "var(--accent-dim)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
              <h2 style={{ fontFamily: "var(--font-clash)", fontSize: "2rem", fontWeight: 700, color: "var(--accent)", marginBottom: "0.75rem" }}>
                Message Sent!
              </h2>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.9375rem", color: "var(--muted)", lineHeight: 1.6 }}>
                I&apos;ll get back to you within 24–48 hours. Looking forward to connecting!
              </p>
            </div>
          ) : (
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    {...register("name")}
                    placeholder="Amir Hossain"
                    style={inputStyle}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.name ? "crimson" : "var(--border)"; }}
                  />
                  {errors.name && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.25rem" }}>{errors.name.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.email ? "crimson" : "var(--border)"; }}
                  />
                  {errors.email && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.25rem" }}>{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                <input
                  {...register("subject")}
                  placeholder="Photography project, website, etc."
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
                />
              </div>

              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  {...register("message")}
                  rows={5}
                  placeholder="Tell me about your project..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.message ? "crimson" : "var(--border)"; }}
                />
                {errors.message && <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "crimson", marginTop: "0.25rem" }}>{errors.message.message}</p>}
              </div>

              {serverError && (
                <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.8125rem", color: "crimson", padding: "0.75rem", border: "1px solid crimson", borderRadius: "8px" }}>
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "0.9375rem 2.5rem",
                  backgroundColor: isSubmitting ? "var(--surface-2)" : "var(--accent)",
                  color: isSubmitting ? "var(--muted)" : "var(--void)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  borderRadius: "100px",
                  border: "none",
                  transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  alignSelf: "flex-start",
                }}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                {!isSubmitting && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
