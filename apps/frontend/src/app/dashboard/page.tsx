"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function DashboardPage() {
  const { user, isLoading, logout, token } = useAuth();
  const {
    isConnected,
    onlineUsers,
    pendingGameRequest,
    currentQuestion,
    sendPlayGame,
    clearGameRequest,
  } = useWebSocket();
  const router = useRouter();

  const [isSearching, setIsSearching] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: redirect if not logged in
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth");
    }
  }, [isLoading, token, router]);

  // When a GAME_REQUEST arrives, show toast
  useEffect(() => {
    if (pendingGameRequest) {
      setToastVisible(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToastVisible(false);
        clearGameRequest();
      }, 8000);
    }
  }, [pendingGameRequest, clearGameRequest]);

  // If we receive a QUESTION event (meaning we joined a game), navigate to game arena
  useEffect(() => {
    if (currentQuestion) {
      router.push(`/game/${currentQuestion.gameId}`);
    }
  }, [currentQuestion, router]);

  const handlePlayNow = () => {
    setIsSearching(true);
    sendPlayGame();
  };

  const handleAcceptChallenge = () => {
    setToastVisible(false);
    clearGameRequest();
    setIsSearching(true);
    sendPlayGame();
  };

  const handleDismissToast = () => {
    setToastVisible(false);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    clearGameRequest();
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "var(--text-muted)",
        }}
      >
        Loading…
      </div>
    );
  }

  // Filter self out from online users list
  return (
    <div className="page-container">
      {/* Orbs */}
      <div
        className="orb orb-purple"
        style={{ width: 500, height: 500, top: -100, right: "5%", opacity: 0.3 }}
      />

      {/* ── Nav ── */}
      <nav className="nav">
        <span className="nav-logo gradient-text">ClashIQ</span>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            className="badge badge-online"
            style={{ display: isConnected ? "inline-flex" : "none" }}
          >
            <span className="badge-dot" />
            Live
          </div>
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {user?.username}
          </span>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm"
            style={{ color: "var(--danger)" }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Toast: Incoming challenge ── */}
      {toastVisible && pendingGameRequest && (
        <div
          className="animate-toast"
          style={{
            position: "fixed",
            top: "5rem",
            right: "1.5rem",
            zIndex: 100,
            maxWidth: 360,
            width: "100%",
          }}
        >
          <div
            className="card"
            style={{
              borderColor: "var(--accent-primary)",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 0 30px var(--accent-glow), 0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--text-primary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  ⚔️ Someone wants to clash!
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  A player is looking for an opponent.
                </p>
              </div>
              <button
                onClick={handleDismissToast}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  lineHeight: 1,
                  padding: "0.1rem",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                onClick={handleAcceptChallenge}
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
              >
                Accept ⚡
              </button>
              <button
                onClick={handleDismissToast}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main
        className="container"
        style={{
          paddingTop: "7rem",
          paddingBottom: "4rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <h1
              className="heading-lg animate-fade-in-up"
              style={{ opacity: 0 }}
            >
              Welcome back,{" "}
              <span className="gradient-text">{user?.username}</span> 👋
            </h1>
            <p
              className="animate-fade-in-up"
              style={{
                color: "var(--text-secondary)",
                marginTop: "0.4rem",
                animationDelay: "0.1s",
                opacity: 0,
              }}
            >
              {isConnected
                ? `${onlineUsers.length} player${onlineUsers.length !== 1 ? "s" : ""} online right now`
                : "Connecting to arena…"}
            </p>
          </div>

          <button
            id="play-now-btn"
            onClick={handlePlayNow}
            className={`btn btn-primary btn-lg animate-fade-in-up ${isSearching ? "animate-glow-pulse" : ""}`}
            disabled={isSearching || !isConnected}
            style={{ animationDelay: "0.15s", opacity: 0 }}
          >
            {isSearching ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin-slow 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                Finding match…
              </>
            ) : (
              "⚔️ Play Now"
            )}
          </button>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          {[
            {
              label: "Online Players",
              value: onlineUsers.length,
              icon: "🟢",
              color: "var(--success)",
            },
            {
              label: "Arena Status",
              value: isConnected ? "Live" : "Connecting",
              icon: "📡",
              color: isConnected ? "var(--success)" : "var(--warning)",
            },
            { label: "Your Username", value: user?.username ?? "—", icon: "🧠", color: "var(--accent-primary)" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="card animate-fade-in-up"
              style={{
                padding: "1.5rem",
                animationDelay: `${0.1 + i * 0.08}s`,
                opacity: 0,
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {stat.icon}
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: "0.3rem",
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  color: stat.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Online users list */}
        <div
          className="card animate-fade-in-up"
          style={{ padding: "1.75rem", animationDelay: "0.35s", opacity: 0 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h2 className="heading-md">Online Players</h2>
            <div className="badge badge-online">
              <span className="badge-dot" />
              {onlineUsers.length} live
            </div>
          </div>

          {onlineUsers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🌐</div>
              <p>No other players online yet.</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Share the link and challenge a friend!
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {onlineUsers.map((u, i) => (
                <div
                  key={u.id}
                  className="card card-hover animate-fade-in-up"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    animationDelay: `${0.05 * i}s`,
                    opacity: 0,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: `hsl(${(u.name.charCodeAt(0) * 37) % 360}, 60%, 35%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "white",
                      flexShrink: 0,
                      border: "2px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.name}
                      {u.id === user?.username ? " (you)" : ""}
                    </p>
                    <div className="badge badge-online" style={{ marginTop: "0.2rem" }}>
                      <span className="badge-dot" />
                      Online
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How to play hint */}
        {isSearching && (
          <div
            className="card animate-fade-in"
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem 1.5rem",
              borderColor: "rgba(245,158,11,0.3)",
              background: "rgba(245,158,11,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>⏳</span>
            <div>
              <p style={{ fontWeight: 600, color: "var(--warning)" }}>
                Searching for an opponent…
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Another player needs to also click <strong>Play Now</strong> to start the game.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
