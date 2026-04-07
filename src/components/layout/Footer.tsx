"use client";

interface FooterProps {
  settings?: {
    logo_text: string;
    logo_accent: string;
    footer_text: string;
    ticker_items: string[];
    social_links: { label: string; href: string }[];
  };
  availability?: string;
}

export default function Footer({ settings, availability }: FooterProps) {
  const year = new Date().getFullYear();
  const tickerItems = settings?.ticker_items || [
    "Photography", "·", "Videography", "·", "Web Development", "·",
    "Visual Storytelling", "·", "Creative Direction", "·"
  ];
  const socialLinks = settings?.social_links || [
    { label: "GitHub", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Twitter / X", href: "#" },
  ];
  const logoText = settings?.logo_text || "AH";
  const logoAccent = settings?.logo_accent !== undefined ? settings.logo_accent : ".";
  const footerText = settings?.footer_text || `© ${year} Amir Hossain. All rights reserved.`;
  const availabilityText = availability || "Available for work";

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Marquee strip */}
      <div
        className="ticker-wrap"
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "1rem 0",
          overflow: "hidden",
        }}
      >
        <div className="ticker-inner" style={{ gap: "2rem" }}>
          {(tickerItems.length > 0 ? tickerItems : ["·"]).map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "0.75rem",
                color: item === "·" ? "var(--accent)" : "var(--muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                padding: "0 0.5rem",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "3rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        {/* Logo + copyright */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--white)",
              marginBottom: "0.5rem",
            }}
          >
            {logoText}<span style={{ color: "var(--accent)" }}>{logoAccent}</span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.75rem",
              color: "var(--muted)",
              letterSpacing: "0.05em",
            }}
          >
            {footerText}
          </p>
        </div>

        {/* Availability badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.5rem 1rem",
            border: "1px solid var(--border-accent)",
            borderRadius: "100px",
            backgroundColor: "var(--accent-dim)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              display: "inline-block",
              animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "0.75rem",
              color: "var(--accent)",
              letterSpacing: "0.08em",
            }}
          >
            {availabilityText}
          </span>
        </div>

        {/* Social links */}
        <nav style={{ display: "flex", gap: "1.5rem" }}>
          {socialLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.8125rem",
                color: "var(--muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--white)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--muted)";
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </footer>
  );
}
