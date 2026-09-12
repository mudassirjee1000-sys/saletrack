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

// Track processed OAuth authorization codes to guarantee single PKCE code exchange across renders/mounts
const processedOAuthCodes = new Set<string>();
let isExchangingOAuthCode = false;

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

          // Check if OAuth PKCE code is in search query params
          // Handle the PKCE code manually, EXACTLY ONCE
          if (typeof window !== "undefined" && window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            const authCode = searchParams.get("code");
            if (authCode && !processedOAuthCodes.has(authCode) && !isExchangingOAuthCode) {
              processedOAuthCodes.add(authCode);
              isExchangingOAuthCode = true;

              // Immediately remove the code from browser URL so subsequent renders/refreshes do not re-exchange
              window.history.replaceState({}, document.title, window.location.pathname);

              try {
                const { data: exchangeData, error: exchangeErr } = await sb.auth.exchangeCodeForSession(authCode);
                if (exchangeErr) {
                  // Safe diagnostic logging: NEVER log access tokens, refresh tokens, secrets, or complete codes
                  console.error("OAuth code exchange error:", {
                    event: "exchangeCodeForSession_failed",
                    message: exchangeErr.message,
                    code: (exchangeErr as any).status || "UNKNOWN",
                    currentOrigin: window.location.origin,
                    hasCodeParam: true,
                  });
                  setOauthError(exchangeErr.message);
                } else if (exchangeData?.session && isMounted) {
                  setSession(exchangeData.session);
                  const user = exchangeData.session.user;
                  setUser(user);
                  if (user) {
                    await loadBusiness(user);
                  }
                }
              } catch (codeErr: any) {
                console.error("OAuth code exchange exception:", {
                  event: "exchangeCodeForSession_exception",
                  message: codeErr?.message || "Unknown error",
                  currentOrigin: window.location.origin,
                  hasCodeParam: true,
                });
                if (isMounted) {
                  setOauthError(codeErr?.message || "Failed to exchange authorization code");
                }
              } finally {
                isExchangingOAuthCode = false;
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

      // No active Supabase session
      setUser(null);
      setBusiness(null);

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

    let configured = isConfigured || isSupabaseConfigured();
    if (!configured) {
      configured = await ensureSupabaseInitialized();
      if (configured) {
        setIsConfigured(true);
        setSupabaseConfig(getSupabaseConfig());
      }
    }

    if (!configured) {
      try {
        getSupabase();
        configured = true;
        setIsConfigured(true);
        setSupabaseConfig(getSupabaseConfig());
      } catch (err) {
        console.warn("Could not lazily get Supabase client:", err);
      }
    }

    if (configured) {
      const sb = getSupabase();
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const isIframe = typeof window !== "undefined" && window.self !== window.top;

      const { data, error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${currentOrigin}/`,
          skipBrowserRedirect: isIframe,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        // Safe diagnostic logging: NEVER log tokens, secrets, passwords, or complete codes
        console.error("Supabase Google OAuth initialization failed:", {
          event: "signInWithOAuth_failed",
          message: error.message,
          code: (error as any).status || "UNKNOWN",
          currentOrigin,
          hasCodeParam: false,
        });
        setOauthError(error.message);
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
      "Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set."
    );
  };

  // Option B — Email + Password Sign Up
  const signUpWithEmail = async (email: string, pass: string, shopName?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    let configured = isConfigured || isSupabaseConfigured();
    if (!configured) {
      configured = await ensureSupabaseInitialized();
      if (configured) {
        setIsConfigured(true);
        setSupabaseConfig(getSupabaseConfig());
      }
    }

    if (configured) {
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

    return { error: "Authentication service is unavailable. Please check your network connection and configuration." };
  };

  // Option B — Email + Password Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    let configured = isConfigured || isSupabaseConfigured();
    if (!configured) {
      configured = await ensureSupabaseInitialized();
      if (configured) {
        setIsConfigured(true);
        setSupabaseConfig(getSupabaseConfig());
      }
    }

    if (configured) {
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

    return { error: "Authentication service is unavailable. Please check your network connection and configuration." };
  };

  // Reset Forgotten Password
  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();

    let configured = isConfigured || isSupabaseConfigured();
    if (!configured) {
      configured = await ensureSupabaseInitialized();
      if (configured) {
        setIsConfigured(true);
        setSupabaseConfig(getSupabaseConfig());
      }
    }

    if (configured) {
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

    return { error: "Authentication service is unavailable. Please check your connection." };
  };

  // Update Password for Authenticated User
  const updatePassword = async (newPass: string) => {
    let configured = isConfigured || isSupabaseConfigured();
    if (configured) {
      const sb = getSupabase();
      try {
        const { error } = await sb.auth.updateUser({ password: newPass });
        if (error) return { error: error.message };
        return { success: true };
      } catch (e: any) {
        return { error: e.message || "Failed to update password" };
      }
    }

    return { error: "Authentication service is unavailable." };
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
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        updatePassword,
        signOut,
        registerBusiness,
        refreshBusiness,
        setupCredentials,
        token: session?.access_token || null,
        getIdToken: async () => {
          if (session?.access_token) return session.access_token;
          try {
            if (isSupabaseConfigured()) {
              const sb = getSupabase();
              const { data } = await sb.auth.getSession();
              return data.session?.access_token || null;
            }
          } catch {}
          return null;
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
