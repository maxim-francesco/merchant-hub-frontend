import apiClient from "./client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  globalRole: string;
  createdAt: string;
}

// The backend wraps its response: { status: "success", data: { token, user } }
interface BackendAuthEnvelope {
  status: string;
  data: {
    token: string;
    user: User;
  };
}

/**
 * Authenticates the user against the backend.
 * On success, persists the JWT to localStorage and returns the user object.
 */
export async function login(
  email: string,
  password: string,
): Promise<User> {
  const { data: envelope } = await apiClient.post<BackendAuthEnvelope>(
    "/auth/login",
    { email, password },
  );

  // Persist token so the request interceptor can attach it on all future calls
  localStorage.setItem("auth_token", envelope.data.token);

  return envelope.data.user;
}

/**
 * Clears the stored JWT, effectively logging the user out.
 */
export function logout(): void {
  localStorage.removeItem("auth_token");
}

/**
 * Returns true if a JWT is currently stored (session check, not verified server-side).
 */
export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("auth_token"));
}

/**
 * Fetches the currently authenticated user's profile details.
 */
export async function getCurrentUser(): Promise<User> {
  const { data: envelope } = await apiClient.get<{
    status: string;
    data: { user: User };
  }>("/auth/me");
  return envelope.data.user;
}

