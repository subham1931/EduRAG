/**
 * Turns axios/API errors into a short string for toasts.
 * Handles FastAPI { detail }, Supabase/PostgREST { message, code }, and nested shapes.
 */
export function getApiErrorMessage(err: unknown): string {
  const raw = extractDetailString(err);
  if (!raw) return "Something went wrong. Try again.";

  if (
    raw.includes("PGRST205") ||
    raw.includes("public.organizations") ||
    (raw.includes("organizations") && raw.includes("schema cache"))
  ) {
    return "The organizations table is missing in Supabase. Open SQL Editor and run backend/supabase_migration_organizations.sql, then try again.";
  }

  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

function extractDetailString(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { response?: { data?: unknown } };
  const data = e.response?.data;
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return undefined;

  const rec = data as Record<string, unknown>;
  if ("detail" in rec) {
    const d = rec.detail;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "message" in d && typeof (d as { message: unknown }).message === "string") {
      return (d as { message: string }).message;
    }
    try {
      return JSON.stringify(d);
    } catch {
      return String(d);
    }
  }
  if ("message" in rec && typeof rec.message === "string") return rec.message;
  return undefined;
}
