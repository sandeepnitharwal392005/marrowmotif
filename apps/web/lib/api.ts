const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const API_URL = /^https?:\/\//i.test(configuredApiUrl)
  ? configuredApiUrl.replace(/\/$/, "")
  : `https://${configuredApiUrl}`;

interface FetchOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getUserFriendlyError(error: unknown, fallback: string): string {
  const apiError = error instanceof ApiError ? error : null;
  const status = apiError?.status;
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("email") &&
    (normalizedMessage.includes("already exists") || normalizedMessage.includes("already registered") || status === 409)
  ) {
    return "An account with this email already exists. Please sign in or reset your password.";
  }

  if (status === 401) {
    return "The email or password is incorrect. Please try again.";
  }

  if (status === 403) {
    return "You do not have permission to complete this action.";
  }

  if (status === 404) {
    return "We could not find what you were looking for. Please try again.";
  }

  if (status === 400 && normalizedMessage.includes("email must be an email")) {
    return "Please enter a valid email address.";
  }

  if (status === 400 && normalizedMessage.includes("password must be longer than or equal to 8 characters")) {
    return "Your password must be at least 8 characters long.";
  }

  if (!status || normalizedMessage.includes("fetch") || normalizedMessage.includes("network")) {
    return "We are having trouble connecting. Please check your connection and try again.";
  }

  if (status >= 500) {
    return "Something went wrong on our side. Please try again in a moment. If the problem continues, contact support.";
  }

  return message || fallback;
}

// Track if a refresh is already in progress to prevent infinite loops
let isRefreshing = false;

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle path correctly whether it has a leading slash or not
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let response = await fetch(`${API_URL}/api${cleanPath}`, {
    cache: 'no-store',
    ...rest,
    headers,
  });

  // Intercept 401 Unauthorized for token refresh
  if (response.status === 401 && !isRefreshing && path !== "/auth/login" && path !== "/auth/refresh") {
    isRefreshing = true;
    try {
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
      if (refreshToken) {
        // Attempt refresh
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          // Update localStorage with new tokens
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", newTokens.accessToken);
            localStorage.setItem("refreshToken", newTokens.refreshToken);
            
            // Dispatch event to inform AuthContext of the new token silently
            window.dispatchEvent(new CustomEvent("session:refreshed", { detail: newTokens }));
          }
          
          // Retry original request with new token
          headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
          response = await fetch(`${API_URL}/api${cleanPath}`, {
            ...rest,
            headers,
          });
        } else {
          throw new Error("Refresh failed");
        }
      } else {
        throw new Error("No refresh token");
      }
    } catch (refreshErr) {
      // Refresh failed, cleanly evict the user
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session:expired"));
      }
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignored
    }
    
    let message = errorData?.message || `HTTP ${response.status} ${response.statusText}`;
    if (Array.isArray(message)) {
      message = message[0];
    }
    
    // Secure generic 500 errors so users don't see raw stack traces or internal codes
    if (response.status >= 500) {
      console.error(`[API Error ${response.status}]`, message, errorData);
      message = "An unexpected server error occurred. Please try again later or contact support.";
    }
    
    const error = new ApiError(response.status, message, errorData);
    throw new ApiError(response.status, getUserFriendlyError(error, message), errorData);
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: any }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    ),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (token: string, refreshToken?: string) =>
    apiFetch("/auth/logout", {
      method: "POST",
      token,
      body: JSON.stringify({ refreshToken }),
    }),

  me: (token: string) =>
    apiFetch<{ user: any }>("/auth/me", { method: "POST", token }),
};

// Products
export const productsApi = {
  list: () => apiFetch<{ data: any[], meta: any }>("/products"),
  get: (id: string) => apiFetch<any>(`/products/${id}`),
  create: (token: string, data: any) =>
    apiFetch<any>("/products", { method: "POST", token, body: JSON.stringify(data) }),
  update: (token: string, id: string, data: any) =>
    apiFetch<any>(`/products/${id}`, { method: "PUT", token, body: JSON.stringify(data) }),
};

// Picture Books
export const pictureBooksApi = {
  list: (token: string, page: number = 1, limit: number = 20, filters?: { q?: string; status?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.q) params.set('q', filters.q);
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    return apiFetch<any>(`/picture-books?${params.toString()}`, { token });
  },
  get: (token: string, id: string) => apiFetch<any>(`/picture-books/${id}`, { token }),
  create: (token: string, data: any) =>
    apiFetch<any>("/picture-books", { method: "POST", token, body: JSON.stringify(data) }),
  whatsappOptIn: (token: string, id: string, whatsappNumber?: string) =>
    apiFetch<any>(`/picture-books/${id}/whatsapp-opt-in`, { method: "POST", token, body: JSON.stringify({ whatsappNumber }) }),
  whatsappDecline: (token: string, id: string) =>
    apiFetch<any>(`/picture-books/${id}/whatsapp-decline`, { method: "POST", token }),
  resend: (token: string, id: string) =>
    apiFetch<any>(`/picture-books/${id}/resend`, { method: "POST", token }),
  setDriveLink: (token: string, id: string, driveLink: string) =>
    apiFetch<any>(`/picture-books/${id}/drive-link`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ driveLink }),
    }),
  stats: (token: string) => apiFetch<any>("/picture-books/stats", { token }),
};

// Support
export const supportApi = {
  whatsappLink: (token: string) =>
    apiFetch<{ link: string }>("/incidents/whatsapp-support", { method: "POST", token }),
};

// Contact
export const contactApi = {
  submit: (data: { name: string; email: string; message: string }) =>
    apiFetch<{ id: string; message: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Settings
export const settingsApi = {
  get: (token: string) => apiFetch<any>("/settings", { token }),
  update: (token: string, data: any) =>
    apiFetch<any>("/settings", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),
};

// Users
export const usersApi = {
  list: (token: string, page: number = 1, limit: number = 20) => 
    apiFetch<any>(`/users?page=${page}&limit=${limit}`, { token }),
  referCustomer: (token: string, data: any) =>
    apiFetch<any>("/users/referrals", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),
  stats: (token: string) => apiFetch<any>("/users/stats", { token }),
};
