"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  {
    icon: "⚡",
    title: "Real-Time Battles",
    desc: "Face off against opponents live. Every millisecond counts.",
  },
  {
    icon: "🧠",
    title: "Math Mastery",
    desc: "Sharpen arithmetic across addition, subtraction, multiplication & division.",
  },
  {
    icon: "🏆",
    title: "Climb the Ranks",
    desc: "Win games, earn rating, and dominate the global leaderboard.",
  },
  {
    icon: "👥",
    title: "Live Opponents",
    desc: "See who's online and challenge players instantly.",
  },
];

export default function LandingPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [token, isLoading, router]);

  return (
    <div className="page-container">
      {/* Decorative orbs */}
      <div
        className="orb orb-purple"
        style={{ width: 600, height: 600, top: -100, left: "20%", opacity: 0.6 }}
      />
      <div
        className="orb orb-indigo"
        style={{ width: 400, height: 400, bottom: 100, right: "10%", opacity: 0.5 }}
      />

      {/* ── Nav ── */}
      <nav className="nav">
        <span className="nav-logo gradient-text">ClashIQ</span>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/auth" className="btn btn-ghost btn-sm">
            Sign In
          </Link>
          <Link href="/auth" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="section"
        style={{
          paddingTop: "10rem",
          paddingBottom: "6rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="badge badge-accent animate-fade-in"
          style={{ marginBottom: "1.5rem" }}
        >
          <span className="badge-dot" />
          Live 1v1 Math Arena
        </div>

        <h1
          className="heading-xl animate-fade-in-up"
          style={{ maxWidth: 800, animationDelay: "0.1s", opacity: 0 }}
        >
          Battle minds.{" "}
          <span className="gradient-text">Prove your IQ.</span>
          <br />
          In real time.
        </h1>

        <p
          className="animate-fade-in-up"
          style={{
            maxWidth: 560,
            marginTop: "1.5rem",
            color: "var(--text-secondary)",
            fontSize: "1.15rem",
            lineHeight: 1.7,
            animationDelay: "0.2s",
            opacity: 0,
          }}
        >
          ClashIQ pairs you with a live opponent for lightning-fast math
          duels. Answer correctly to advance. Answer first to win.
        </p>

        <div
          className="animate-fade-in-up"
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "2.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
            animationDelay: "0.3s",
            opacity: 0,
          }}
        >
          <Link href="/auth" className="btn btn-primary btn-lg animate-glow-pulse">
            Start Battling →
          </Link>
          <Link href="#features" className="btn btn-secondary btn-lg">
            How it works
          </Link>
        </div>

        {/* Floating question card preview */}
        <div
          className="animate-fade-in-up animate-float"
          style={{
            marginTop: "4rem",
            animationDelay: "0.4s",
            opacity: 0,
            position: "relative",
          }}
        >
          <div
            className="question-card"
            style={{ maxWidth: 380, margin: "0 auto", padding: "2rem 3rem" }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Question 3 / 10
            </p>
            <p className="question-text gradient-text">7 × 8 = ?</p>
            <div style={{ marginTop: "1rem" }}>
              <div
                className="progress-bar"
                style={{ maxWidth: 200, margin: "0 auto" }}
              >
                <div className="progress-fill" style={{ width: "30%" }} />
              </div>
            </div>
          </div>
          {/* Floating badge */}
          <div
            style={{
              position: "absolute",
              top: -12,
              right: -16,
              background: "var(--success)",
              color: "white",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.3rem 0.75rem",
              borderRadius: 999,
              boxShadow: "0 0 20px var(--success-glow)",
            }}
          >
            ✓ Correct!
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        className="section"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2 className="heading-lg">
              Everything you need to{" "}
              <span className="gradient-text">dominate</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem", fontSize: "1.05rem" }}>
              Built for speed. Designed for competition.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card card-hover animate-fade-in-up"
                style={{
                  padding: "2rem",
                  animationDelay: `${0.1 * i}s`,
                  opacity: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "2.25rem",
                    marginBottom: "1rem",
                    lineHeight: 1,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: "0.9rem" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="section"
        style={{ position: "relative", zIndex: 1, paddingTop: "2rem", paddingBottom: "6rem" }}
      >
        <div className="container">
          <div
            className="card"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))",
              borderColor: "var(--border-accent)",
              padding: "4rem 3rem",
              textAlign: "center",
            }}
          >
            <h2 className="heading-lg">
              Ready to <span className="gradient-text">clash?</span>
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginTop: "1rem",
                fontSize: "1.05rem",
              }}
            >
              Join now and find your first opponent in seconds.
            </p>
            <Link
              href="/auth"
              className="btn btn-primary btn-lg"
              style={{ marginTop: "2rem" }}
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        © 2026 ClashIQ. All rights reserved.
      </footer>
    </div>
  );
}
