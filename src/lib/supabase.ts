import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Strips surrounding quotes and trims whitespace from config values
 */
export function cleanConfigValue(val: string | undefined | null): string {
  if (!val) return "";
  let s = String(val).trim();
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  const clean = cleanConfigValue(url);
  if (
    clean.includes("your-project.supabase.co") ||
    clean.includes("example.com") ||
    clean === "MY_APP_URL"
  ) {
    return false;
  }
  try {
    const parsed = new URL(clean);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function isValidSupabaseAnonKey(key: string): boolean {
  if (!key) return false;
  const clean = cleanConfigValue(key);
  if (clean === "your-anon-key" || clean.length < 20) {
    return false;
  }
  return true;
}

// Clean any deprecated customer localStorage keys
try {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("saletrack_sb_url");
    window.localStorage.removeItem("saletrack_sb_anon_key");
  }
} catch {
  // Ignore
}

function getInitialConfig() {
  const meta = import.meta as any;
  const envUrl = cleanConfigValue(meta.env?.VITE_SUPABASE_URL || "");
  const envKey = cleanConfigValue(meta.env?.VITE_SUPABASE_ANON_KEY || "");

  if (isValidSupabaseUrl(envUrl) && isValidSupabaseAnonKey(envKey)) {
    return { url: envUrl, anonKey: envKey };
  }

  return { url: "", anonKey: "" };
}

let currentConfig = getInitialConfig();
let clientInstance: SupabaseClient | null = null;
let initPromise: Promise<boolean> | null = null;

function initClient(url: string, anonKey: string): SupabaseClient | null {
  const cleanUrl = cleanConfigValue(url);
  const cleanKey = cleanConfigValue(anonKey);
  if (!isValidSupabaseUrl(cleanUrl) || !isValidSupabaseAnonKey(cleanKey)) {
    return null;
  }

  try {
    return createClient(cleanUrl, cleanKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

if (currentConfig.url && currentConfig.anonKey) {
  clientInstance = initClient(currentConfig.url, currentConfig.anonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    isValidSupabaseUrl(currentConfig.url) &&
    isValidSupabaseAnonKey(currentConfig.anonKey) &&
    clientInstance
  );
}

export function getSupabaseConfig() {
  return { ...currentConfig };
}

export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    if (!currentConfig.url || !currentConfig.anonKey) {
      throw new Error(
        "Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables."
      );
    }
    clientInstance = initClient(currentConfig.url, currentConfig.anonKey);
    if (!clientInstance) {
      throw new Error("Could not initialize Supabase client with the provided credentials.");
    }
  }
  return clientInstance;
}

/**
 * Ensures Supabase client is initialized from build-time env or server /api/config.
 * Safe to call multiple times.
 */
export async function ensureSupabaseInitialized(): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const serverConfig = await fetchServerConfig();
      if (serverConfig && isValidSupabaseUrl(serverConfig.url) && isValidSupabaseAnonKey(serverConfig.anonKey)) {
        currentConfig = { url: serverConfig.url, anonKey: serverConfig.anonKey };
        clientInstance = initClient(currentConfig.url, currentConfig.anonKey);
        return Boolean(clientInstance);
      }
    } catch (err) {
      console.warn("Could not load Supabase config from server:", err);
    }
    return false;
  })();

  return initPromise;
}

/**
 * Asynchronously checks if backend server has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * available via process.env.
 */
export async function fetchServerConfig(): Promise<{ url: string; anonKey: string } | null> {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return null;
    const data = await res.json();
    const url = cleanConfigValue(data.supabaseUrl);
    const anonKey = cleanConfigValue(data.supabaseAnonKey);

    if (isValidSupabaseUrl(url) && isValidSupabaseAnonKey(anonKey)) {
      return { url, anonKey };
    }
  } catch (err) {
    console.warn("Could not retrieve server Supabase configuration:", err);
  }
  return null;
}

export const supabase = clientInstance;
