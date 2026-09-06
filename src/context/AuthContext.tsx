import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  getSupabase,
  isSupabaseConfigured,
  ensureSupabaseInitialized,
  getSupabaseConfig,
} from "../lib/supabase";
import { Business } from "../types";
import {
  fetchBusinessForUser,
  createBusinessInSupabase,
} from "../services/supabaseService";
import { clearAllLocalData } from "../storage";

const LOCAL_ACTIVE_USER_KEY = "saletrack_active_user";
const LOCAL_USERS_REGISTRY_KEY = "saletrack_users_registry";

interface StoredLocalUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

function getStoredUsers(): StoredLocalUser[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveStoredUser(u: StoredLocalUser): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const all = getStoredUsers().filter((x) => x.email.toLowerCase() !== u.email.toLowerCase());
      all.push(u);
      window.localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(all));
    }
  } catch {}
}

function getLocalActiveUser(): { id: string; email: string; name: string } | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function setLocalActiveUser(user: { id: string; email: string; name: string } | null): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (user) {
        window.localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
      }
    }
  } catch {}
}

function createSyntheticUser(id: string, email: string, name?: string): User {
  return {
    id,
    app_metadata: { provider: "email" },
    user_metadata: { full_name: name || email.split("@")[0] },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
  } as User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  business: Business | null;
  loading: boolean;
  businessLoading: boolean;
  isConfigured: boolean;
  supabaseConfig: { url: string; anonKey: string };
  oauthError: string | null;
  oauthPopupUrl: string | null;
  clearOAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithTestUser: (email?: string, name?: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    shopName?: string
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updatePassword: (newPass: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  registerBusiness: (
    data: Omit<Business, "id" | "owner_user_id" | "created_at" | "updated_at">
  ) => Promise<Business>;
  refreshBusiness: () => Promise<Business | null>;
  setupCredentials: (url: string, anonKey: string) => boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  token: null,
  business: null,
  loading: true,
  businessLoading: false,
  isConfigured: false,
  supabaseConfig: { url: "", anonKey: "" },
  oauthError: null,
  oauthPopupUrl: null,
  clearOAuthError: () => {},
  signInWithGoogle: async () => {},
  signInWithTestUser: async () => {},
  signUpWithEmail: async () => ({}),
  signInWithEmail: async () => ({}),
  resetPassword: async () => ({}),
  updatePassword: async () => ({}),
  signOut: async () => {},
  registerBusiness: async () => {
    throw new Error("Auth not initialized");
  },
  refreshBusiness: async () => null,
  setupCredentials: () => false,
  getIdToken: async () => null,
});

/**
 * Extracts error details from URL query params (?error=...) or hash (#error=...)
 */
function extractOAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Check search parameters
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const err = searchParams.get("error_description") || searchParams.get("error");
      if (err) {
        return decodeURIComponent(err.replace(/\+/g, " "));
      }
    }

    // 2. Check hash fragment (common in OAuth error redirects)
    if (window.location.hash) {
      const hashStr = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      const err = hashParams.get("error_description") || hashParams.get("error");
      if (err) {
        return decodeURIComponent(err.replace(/\+/g, " "));
      }
    }
  } catch (e) {
    console.warn("Could not parse URL for OAuth errors:", e);
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());
  const [supabaseConfig, setSupabaseConfig] = useState(() => getSupabaseConfig());
  const [oauthError, setOauthError] = useState<string | null>(() => extractOAuthErrorFromUrl());
  const [oauthPopupUrl, setOauthPopupUrl] = useState<string | null>(null);

  const clearOAuthError = useCallback(() => {
    setOauthError(null);
    setOauthPopupUrl(null);
  }, []);

  // Load business for a given user
  const loadBusiness = useCallback(async (authUser: User | null): Promise<Business | null> => {
    if (!authUser) {
      setBusiness(null);
      return null;
    }
    setBusinessLoading(true);
    try {
      const biz = await fetchBusinessForUser(authUser.id);
      setBusiness(biz);
      return biz;
    } catch (err) {
      console.error("Failed to load business for user:", err);
      setBusiness(null);
      return null;
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  // Initialize Supabase Auth Session & state change listener
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // Check for incoming OAuth redirect error in URL
      const incomingOAuthError = extractOAuthErrorFromUrl();
      if (incomingOAuthError && isMounted) {
        console.error("Detected OAuth callback error:", incomingOAuthError);
        setOauthError(incomingOAuthError);
        // Clean URL to avoid sticky errors on refresh
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const configured = await ensureSupabaseInitialized();
      if (!isMounted) return;

      setIsConfigured(configured);
      setSupabaseConfig(getSupabaseConfig());

      if (configured) {
        try {
          const sb = getSupabase();

          // Check if OAuth code is in search query params (PKCE flow)
          if (typeof window !== "undefined" && window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            const authCode = searchParams.get("code");
            if (authCode) {
              try {
                await sb.auth.exchangeCodeForSession(authCode);
              } catch (codeErr) {
                console.warn("OAuth authorization code exchange notice:", codeErr);
              } finally {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
          }

          // Clean access token fragments from hash once processed
          if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);
          }

          // 1. Initial session check
          const {
            data: { session: currentSession },
          } = await sb.auth.getSession();

          if (!isMounted) return;
          setSession(currentSession);
          const currentUser = currentSession?.user || null;
          setUser(currentUser);
          if (currentUser) {
            await loadBusiness(currentUser);
          } else {
            setBusiness(null);
          }

          // 2. Auth state change listener
          const {
            data: { subscription },
          } = sb.auth.onAuthStateChange(async (event, newSession) => {
            if (!isMounted) return;
            setSession(newSession);
            const newUser = newSession?.user || null;
            setUser(newUser);

            if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
              if (newUser) {
                await loadBusiness(newUser);
              }
            } else if (event === "SIGNED_OUT") {
              setUser(null);
              setSession(null);
              setBusiness(null);
              setLocalActiveUser(null);
              clearAllLocalData();
            }
          });

          if (isMounted) setLoading(false);

          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.error("Error setting up Supabase session:", err);
        }
      }

      // If Supabase is not configured or in local sandbox
      const active = getLocalActiveUser();
      if (active) {
        const synUser = createSyntheticUser(active.id, active.email, active.name);
        setUser(synUser);
        await loadBusiness(synUser);
      } else {
        setUser(null);
        setBusiness(null);
      }

      if (isMounted) setLoading(false);
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [loadBusiness]);

  // Option A — Google OAuth Login via Supabase
  const signInWithGoogle = async () => {
    setOauthError(null);
    setOauthPopupUrl(null);

    if (isConfigured) {
      const sb = getSupabase();
      // Ensure redirect URI is always dynamically derived from current application origin with trailing slash
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = currentOrigin ? `${currentOrigin}/` : undefined;

      const isIframe = typeof window !== "undefined" && window.self !== window.top;

      // Note on iframes: Google OAuth strictly prohibits rendering inside an iframe (X-Frame-Options: DENY).
      // If triggered inside an iframe (like AI Studio preview), Supabase's default window.location.assign
      // causes Google to return "403. That's an error. We're sorry, but you do not have access to this page."
      // By using skipBrowserRedirect and opening in a top-level window/tab, we break out of the iframe!
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isIframe,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Supabase Google OAuth initialization failed:", error);
        throw error;
      }

      if (isIframe && data?.url) {
        try {
          const opened = window.open(data.url, "_blank", "noopener,noreferrer");
          if (!opened) {
            // Popup was blocked by browser policy — provide direct fallback button
            setOauthPopupUrl(data.url);
          }
        } catch {
          setOauthPopupUrl(data.url);
        }
      }
      return;
    }

    throw new Error(
      "Supabase authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set."
    );
  };

  // Option A.2 — Instant 1-Click Test Sign In (bypasses Google Cloud Console testing restrictions)
  const signInWithTestUser = async (userEmail = "mudassirjee1000@gmail.com", userName = "Mudassir") => {
    setOauthError(null);
    setOauthPopupUrl(null);
    setLoading(true);

    const email = userEmail.trim().toLowerCase();
    const name = userName.trim();

    try {
      let existingUser = getStoredUsers().find((u) => u.email.toLowerCase() === email);
      let userId = existingUser ? existingUser.id : "usr_" + crypto.randomUUID().slice(0, 8);

      if (!existingUser) {
        saveStoredUser({ id: userId, email, passwordHash: "test_mode_auth", name });
      }

      const synUser = createSyntheticUser(userId, email, name);
      setUser(synUser);
      setLocalActiveUser({ id: userId, email, name });

      let biz: Business | null = null;
      try {
        biz = await fetchBusinessForUser(userId);
      } catch (e) {
        console.warn("Could not fetch remote business for test user:", e);
      }

      if (!biz) {
        try {
          biz = await createBusinessInSupabase({
            owner_user_id: userId,
            business_name: "Mudassir Retail Shop",
            owner_name: name,
            country: "United States",
            currency: "USD",
            currency_symbol: "$",
            phone_country_code: "+1",
            phone_number: "5551234567",
            phone_e164: "+15551234567",
          });
        } catch (err) {
          console.warn("Could not provision remote business for test user:", err);
        }
      }

      setBusiness(biz);
    } finally {
      setLoading(false);
    }
  };

  // Option B — Email + Password Sign Up
  const signUpWithEmail = async (email: string, pass: string, shopName?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isConfigured) {
      const sb = getSupabase();
      try {
        const { data, error } = await sb.auth.signUp({
          email: cleanEmail,
          password: pass,
        });
        if (error) return { error: error.message };

        if (data?.user && !data.session) {
          return { needsConfirmation: true };
        }

        if (data?.user) {
          setUser(data.user);
          setSession(data.session);

          // Auto-provision store if shopName is provided
          if (shopName) {
            const biz = await createBusinessInSupabase({
              owner_user_id: data.user.id,
              business_name: shopName,
              owner_name: shopName,
              country: "United States",
              currency: "USD",
              currency_symbol: "$",
              phone_country_code: "+1",
              phone_number: "5550000000",
              phone_e164: "+15550000000",
            });
            setBusiness(biz);
          } else {
            await loadBusiness(data.user);
          }
        }
        return {};
      } catch (e: any) {
        return { error: e.message || "Failed to sign up" };
      }
    }

    // Direct registration in sandbox mode
    const existing = getStoredUsers().find((u) => u.email === cleanEmail);
    if (existing) {
      return { error: "An account with this email already exists. Please sign in." };
    }

    const userId = "usr_" + crypto.randomUUID().slice(0, 12);
    const storeName = shopName || `${cleanEmail.split("@")[0]}'s Store`;

    saveStoredUser({
      id: userId,
      email: cleanEmail,
      passwordHash: pass,
      name: storeName,
    });

    const synUser = createSyntheticUser(userId, cleanEmail, storeName);
    setUser(synUser);
    setLocalActiveUser({ id: userId, email: cleanEmail, name: storeName });

    const newBiz = await createBusinessInSupabase({
      owner_user_id: userId,
      business_name: storeName,
      owner_name: storeName,
      country: "United States",
      currency: "USD",
      currency_symbol: "$",
      phone_country_code: "+1",
      phone_number: "5551234567",
      phone_e164: "+15551234567",
    });

    setBusiness(newBiz);
    return {};
  };

  // Option B — Email + Password Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isConfigured) {
      const sb = getSupabase();
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });
        if (error) return { error: error.message };

        if (data?.user) {
          setUser(data.user);
          setSession(data.session);
          await loadBusiness(data.user);
        }
        return {};
      } catch (e: any) {
        return { error: e.message || "Invalid email or password" };
      }
    }

    // Direct sign-in in sandbox mode
    const existing = getStoredUsers().find((u) => u.email === cleanEmail);
    if (!existing || existing.passwordHash !== pass) {
      return { error: "Invalid email or password. Please try again or create an account." };
    }

    const synUser = createSyntheticUser(existing.id, existing.email, existing.name);
    setUser(synUser);
    setLocalActiveUser({ id: existing.id, email: existing.email, name: existing.name });

    await loadBusiness(synUser);
    return {};
  };

  // Reset Forgotten Password
  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isConfigured) {
      const sb = getSupabase();
      try {
        const { error } = await sb.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { error: error.message };
        return { success: true };
      } catch (e: any) {
        return { error: e.message || "Failed to send reset link" };
      }
    }

    // Friendly confirmation in sandbox mode
    return { success: true };
  };

  // Update Password for Authenticated User
  const updatePassword = async (newPass: string) => {
    if (isConfigured) {
      const sb = getSupabase();
      try {
        const { error } = await sb.auth.updateUser({ password: newPass });
        if (error) return { error: error.message };
        return { success: true };
      } catch (e: any) {
        return { error: e.message || "Failed to update password" };
      }
    }

    if (user?.email) {
      const all = getStoredUsers();
      const match = all.find((u) => u.email === user.email);
      if (match) {
        match.passwordHash = newPass;
        saveStoredUser(match);
      }
    }
    return { success: true };
  };

  // Sign Out & Purge In-Memory State
  const signOut = async () => {
    try {
      if (isConfigured) {
        const sb = getSupabase();
        await sb.auth.signOut();
      }
    } catch (e) {
      console.warn("Sign out error:", e);
    } finally {
      setUser(null);
      setSession(null);
      setBusiness(null);
      setLocalActiveUser(null);
      clearAllLocalData();
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", "/login");
      }
    }
  };

  // Register New Business for Authenticated User
  const registerBusiness = async (
    data: Omit<Business, "id" | "owner_user_id" | "created_at" | "updated_at">
  ): Promise<Business> => {
    if (!user) throw new Error("You must be logged in to register a business.");
    setBusinessLoading(true);
    try {
      const newBiz = await createBusinessInSupabase({
        ...data,
        owner_user_id: user.id,
      });
      setBusiness(newBiz);
      return newBiz;
    } finally {
      setBusinessLoading(false);
    }
  };

  // Manually refresh business
  const refreshBusiness = async (): Promise<Business | null> => {
    return loadBusiness(user);
  };

  const setupCredentials = (): boolean => {
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        business,
        loading,
        businessLoading,
        isConfigured,
        supabaseConfig,
        oauthError,
        oauthPopupUrl,
        clearOAuthError,
        signInWithGoogle,
        signInWithTestUser,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        updatePassword,
        signOut,
        registerBusiness,
        refreshBusiness,
        setupCredentials,
        token: session?.access_token || null,
        getIdToken: async () => session?.access_token || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
