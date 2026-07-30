import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, TOKEN_KEY } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Single configured Axios instance for the whole app.
//  - request interceptor attaches the Bearer token
//  - response interceptor handles 401 globally and normalizes plain-text vs JSON
// ---------------------------------------------------------------------------

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { Accept: "application/json, text/plain, */*" },
});

// Inject Bearer token on every protected request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

// Normalize errors & handle 401 globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // Only auto-logout when the session-check endpoint (get-user-details)
      // returns 401 — that genuinely means the token is expired/invalid.
      // For ALL other endpoints, a 401/403 might be a @PreAuthorize role
      // issue or a non-existent endpoint returning 401-via-CORS — we must
      // NOT kick the user out of their session in those cases.
      const url = error.config?.url || "";
      const isSessionCheck = url.includes("/api/auth/get-user-details");
      if (isSessionCheck) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_KEY);
          unauthorizedHandler?.();
        }
      }
    }

    // Normalize the error shape so callers always get a friendly message.
    // The upgraded backend's GlobalExceptionHandler returns:
    //   { timestamp, status, error, message }  OR  { timestamp, status, error, fieldErrors }
    const data = error.response?.data;
    let message: string;
    let fieldErrors: Record<string, string> | undefined;
    if (typeof data === "string" && data.trim()) {
      message = data.trim();
    } else if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      message =
        (typeof obj.message === "string" && obj.message) ||
        (typeof obj.error === "string" && obj.error) ||
        error.message ||
        "Something went wrong";
      if (obj.fieldErrors && typeof obj.fieldErrors === "object") {
        fieldErrors = obj.fieldErrors as Record<string, string>;
      }
    } else {
      message = error.message || "Network error";
    }

    return Promise.reject({
      status,
      message,
      fieldErrors,
      raw: error,
    });
  },
);

// Helper to read the raw response body regardless of content-type.
// Axios already parses JSON → object and leaves text/plain → string, so we
// just return response.data, typed by the caller.
export function unwrap<T>(res: AxiosResponse<T>): T {
  return res.data;
}
