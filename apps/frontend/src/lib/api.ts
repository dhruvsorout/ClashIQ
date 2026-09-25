import type {
  ApiResponse,
  GameHistoryItem,
  UserProfile,
  UserStats,
} from "./types";

const HTTP_BASE = process.env.NEXT_PUBLIC_HTTP_URL ?? "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${HTTP_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok) {
    throw new Error(json.message ?? `Request failed with status ${res.status}`);
  }

  return json.data;
}

// ─── Authentication Endpoints ────────────────────────────────────────────────

export async function registerUser(email: string, password: string) {
  return request<{ user: UserProfile }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email: string, password: string) {
  return request<{ user: UserProfile; token: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getAuthMe(token: string) {
  return request<{ user: UserProfile }>("/api/v1/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── User Profile & Statistics Endpoints ─────────────────────────────────────

export async function getUserProfile(token: string) {
  return request<{ user: UserProfile }>("/api/v1/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getUserStats(token: string) {
  return request<{ stats: UserStats }>("/api/v1/user/me/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Game History Endpoints ──────────────────────────────────────────────────

export async function getGameHistory(token: string) {
  return request<{ history: GameHistoryItem[] }>("/api/v1/game/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
