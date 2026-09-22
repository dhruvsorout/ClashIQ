const HTTP_BASE = process.env.NEXT_PUBLIC_HTTP_URL ?? "http://localhost:4000";

// ─── Helpers ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${HTTP_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? "Request failed");
  }

  return json as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────

export async function registerUser(email: string, password: string) {
  return request<{ message: string; email: string; username: string }>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function loginUser(email: string, password: string) {
  return request<{ message: string; token: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string) {
  return request<{ message: string; email: string; username: string }>(
    "/api/v1/auth/me",
    {
      method: "POST",
      headers: {
        Authorization: token,
      },
    }
  );
}
