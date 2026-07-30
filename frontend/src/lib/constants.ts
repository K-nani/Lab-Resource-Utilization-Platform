// Shared constants

// Base URL for the backend API. The app makes REAL HTTP calls to this URL —
// there is no mock/interceptor in the frontend. Set VITE_API_BASE_URL in .env.
// Default: http://localhost:8080 (the real backend; a development stand-in
// implementing all 23 documented endpoints runs at mini-services/api-backend).
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/";

export const TOKEN_KEY = "lab-booking-access-token";
export const DEFAULT_OTP = "123456"; // OTP surfaced by the development backend

/**
 * Convert a Date to a datetime string the Spring Boot backend can parse.
 * The backend uses LocalDateTime.parse() which expects "yyyy-MM-ddTHH:mm:ss"
 * (no milliseconds, no timezone suffix). JavaScript's toISOString() produces
 * "2026-07-13T18:51:00.000Z" which fails with "unparsed text found at index 23".
 *
 * This helper strips the milliseconds and the trailing "Z" so the backend
 * receives "2026-07-13T18:51:00".
 */
export function toBackendDateTime(date: Date): string {
  // Pad each component to 2 digits
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" + pad(date.getMonth() + 1) +
    "-" + pad(date.getDate()) +
    "T" + pad(date.getHours()) +
    ":" + pad(date.getMinutes()) +
    ":" + pad(date.getSeconds())
  );
}
