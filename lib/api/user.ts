const BACKEND_HOST = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";

export interface UserResponse {
  email_address?: string;
  profile_pic?: string;
  first_name?: string;
  last_name?: string;
  initial_step?: number;
  initial_data?: any;
}

export async function fetchUser({
  token,
}: {
  token: string;
}): Promise<UserResponse | null> {
  const response = await fetch(`${BACKEND_HOST}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}