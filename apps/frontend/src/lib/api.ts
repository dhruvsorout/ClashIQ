import type {
  ApiResponse,
  FriendItem,
  FriendRecord,
  GameDetail,
  GameHistoryItem,
  PendingChallenge,
  PublicUser,
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
    const errorMsg =
      json.message ??
      (json.errors && json.errors.length > 0 ? json.errors.join(", ") : null) ??
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
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
  return request<{ user: UserProfile }>("/api/v1/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateUserProfile(token: string, data: { username: string }) {
  return request<{ user: UserProfile }>("/api/v1/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function getUserStats(token: string) {
  return request<{ stats: UserStats }>("/api/v1/users/me/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function searchUsers(token: string, query: string) {
  return request<{ users: PublicUser[] }>(`/api/v1/users/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getUserById(token: string, userId: string) {
  return request<{ user: PublicUser }>(`/api/v1/users/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Friends Endpoints ───────────────────────────────────────────────────────

export async function getFriends(token: string) {
  return request<{ friends: FriendItem[] }>("/api/v1/friends", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getFriendRequests(token: string) {
  return request<{ requests: FriendRecord[] }>("/api/v1/friends/requests", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function sendFriendRequest(token: string, userId: string) {
  return request<{ request: FriendRecord }>(`/api/v1/friends/${userId}/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function acceptFriendRequest(token: string, userId: string) {
  return request<{ friendship: FriendRecord }>(`/api/v1/friends/${userId}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function rejectFriendRequest(token: string, userId: string) {
  return request<{ friendship: FriendRecord }>(`/api/v1/friends/${userId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function removeFriend(token: string, userId: string) {
  return request<{ message: string }>(`/api/v1/friends/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Game History & Details Endpoints ────────────────────────────────────────

export async function getGameHistory(token: string) {
  return request<{ games: GameHistoryItem[] }>("/api/v1/games/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getGameDetail(token: string, gameId: string) {
  return request<{ game: GameDetail }>(`/api/v1/games/${gameId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Challenge Endpoints ─────────────────────────────────────────────────────

export async function getPendingChallenges(token: string) {
  return request<{ incoming: PendingChallenge[]; outgoing: PendingChallenge[] }>(
    "/api/v1/challenges/pending",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

