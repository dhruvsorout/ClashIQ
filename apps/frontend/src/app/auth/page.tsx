"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { registerUser } from "@/lib/api";

type Tab = "login" | "register";

export default function AuthPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setIsLoading(true);
    try {
      await registerUser(email, password);
      setSuccess("Account created! Signing you in…");
      // Auto-login after register
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    reset();
    setEmail("");
    setPassword("");
  };

  return (
    <div
      className="page-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      {/* Orbs */}
      <div
        className="orb orb-purple"
        style={{ width: 500, height: 500, top: -80, left: -80, opacity: 0.5 }}
      />
      <div
        className="orb orb-indigo"
        style={{ width: 400, height: 400, bottom: -60, right: -60, opacity: 0.4 }}
      />

      <div
        className="card animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "2.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" className="nav-logo gradient-text" style={{ fontSize: "1.75rem" }}>
            ClashIQ
          </Link>
          <p style={{ color: "var(--text-muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
            {tab === "login" ? "Welcome back, champion!" : "Join the arena today."}
          </p>
        </div>

        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            marginBottom: "1.75rem",
            border: "1px solid var(--border)",
          }}
        >
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "calc(var(--radius-md) - 2px)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.2s",
                background: tab === t ? "var(--accent-primary)" : "transparent",
                color: tab === t ? "white" : "var(--text-secondary)",
                boxShadow: tab === t ? "0 0 16px var(--accent-glow)" : "none",
              }}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={tab === "login" ? handleLogin : handleRegister}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label className="input-label" htmlFor="auth-email">
                Email address
              </label>
              <input
                id="auth-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />
            </div>

            {/* Error / Success messages */}
            {error && (
              <div
                className="animate-fade-in"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem 1rem",
                  color: "var(--danger)",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>⚠</span> {error}
              </div>
            )}

            {success && (
              <div
                className="animate-fade-in"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem 1rem",
                  color: "var(--success)",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>✓</span> {success}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ marginTop: "0.25rem", padding: "0.9rem" }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin-slow 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  {tab === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : tab === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginTop: "1.75rem",
            marginBottom: "1rem",
          }}
        >
          <div className="divider" style={{ margin: 0, flex: 1 }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>or</span>
          <div className="divider" style={{ margin: 0, flex: 1 }} />
        </div>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          {tab === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => switchTab("register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchTab("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
