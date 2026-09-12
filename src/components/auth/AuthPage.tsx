import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Store,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  TrendingUp,
  Receipt,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

export const AuthPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    oauthError,
    oauthPopupUrl,
    clearOAuthError,
    supabaseConfig,
  } = useAuth();

  const [copiedCallback, setCopiedCallback] = useState(false);

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign-in could not be completed. Please try email login.");
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      const res = await resetPassword(cleanEmail);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Password reset email sent! Please check your inbox.");
      }
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setLoading(true);
      const res = await signUpWithEmail(cleanEmail, password, shopName.trim());
      setLoading(false);

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.needsConfirmation) {
        setSuccessMessage(
          "Account created successfully! Please check your email to confirm your account."
        );
      }
      return;
    }

    if (mode === "signin") {
      setLoading(true);
      const res = await signInWithEmail(cleanEmail, password);
      setLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      {/* Left Column: Brand Hero Banner */}
      <div className="md:w-5/12 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">SaleTrack</span>
              <p className="text-2xs text-blue-400 font-medium tracking-wide">RETAIL &amp; SHOP MANAGEMENT</p>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight mb-4">
            Total control over your shop sales, stock, and profit.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-8">
            Complete retail point-of-sale, automated inventory deduction, customer credit ledger, and instant financial reports.
          </p>

          {/* Key Pillars */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-blue-900/50 rounded-lg text-blue-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">100% Isolated Business Data</h4>
                <p className="text-2xs text-slate-400">Zero cross-customer data leakage. Every business operates in its own dedicated, secure space.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-emerald-900/50 rounded-lg text-emerald-400 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Universal Country &amp; Currency Support</h4>
                <p className="text-2xs text-slate-400">Native international dialing codes and world currencies built-in.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-amber-900/50 rounded-lg text-amber-400 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Real-Time Profit &amp; Credit Ledgers</h4>
                <p className="text-2xs text-slate-400">Track invoices, customer receivables, operating expenses, and inventory valuation accurately.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-purple-900/50 rounded-lg text-purple-400 mt-0.5">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Instant Invoices &amp; Thermal Receipts</h4>
                <p className="text-2xs text-slate-400">Print 80mm/58mm thermal receipts or generate professional PDF invoices for customers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-8 mt-8 border-t border-slate-800/80 flex items-center justify-between text-2xs text-slate-500">
          <span>Enterprise Encrypted Cloud Platform</span>
          <span className="text-slate-400 font-medium">SaleTrack v2.5</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="md:w-7/12 p-6 sm:p-12 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signin" && "Sign in to your account"}
              {mode === "signup" && "Create your business account"}
              {mode === "forgot" && "Reset your password"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === "signin" && "Enter your credentials or continue with Google to access your store."}
              {mode === "signup" && "Sign up with your email to register and start managing your shop."}
              {mode === "forgot" && "We'll send a password recovery link to your registered email."}
            </p>
          </div>

          {/* OAuth Redirect Error Banner */}
          {oauthError && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2.5 w-full">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <h4 className="font-semibold text-amber-900">Google Authentication Notice</h4>
                    <p className="mt-1 text-amber-800 leading-relaxed font-mono text-2xs bg-amber-100/60 p-1.5 rounded border border-amber-200/50 break-all">
                      {oauthError}
                    </p>

                    {/* Clean guidance for OAuth Configuration */}
                    <div className="mt-3 text-2xs text-amber-900 bg-amber-100/80 p-3 rounded-lg leading-normal space-y-2 border border-amber-200">
                      <div className="bg-white/80 p-2.5 rounded border border-amber-200 space-y-1.5">
                        <p className="font-semibold text-amber-950">Google Cloud Console Authorized redirect URI:</p>
                        <p className="text-slate-600">
                          In <strong>Google Cloud Console</strong> &rarr; <em>Credentials</em> &rarr; <strong>Authorized redirect URIs</strong>, ensure your callback URL is configured:
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-2xs font-mono select-all flex-1 break-all border border-slate-200">
                            {(supabaseConfig?.url || "https://lrqmsmuqfukxtkkvefwt.supabase.co") + "/auth/v1/callback"}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              const url = (supabaseConfig?.url || "https://lrqmsmuqfukxtkkvefwt.supabase.co") + "/auth/v1/callback";
                              navigator.clipboard.writeText(url);
                              setCopiedCallback(true);
                              setTimeout(() => setCopiedCallback(false), 2000);
                            }}
                            className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded text-2xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          >
                            {copiedCallback ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCallback ? "Copied!" : "Copy URL"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearOAuthError}
                  className="text-amber-500 hover:text-amber-800 p-1 text-xs cursor-pointer font-bold shrink-0 ml-2"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Popup Blocker Fallback Link */}
          {oauthPopupUrl && (
            <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col space-y-2 shadow-sm">
              <div className="flex items-center space-x-2 font-semibold text-blue-900">
                <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Google Sign-In Window</span>
              </div>
              <p className="text-2xs text-blue-700">
                Google requires signing in via a standalone tab. If the popup didn't open automatically, click below:
              </p>
              <a
                href={oauthPopupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all text-center"
              >
                <span>Open Google Sign-In Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Option A: Google Login Button */}
          {mode !== "forgot" && (
            <div className="mb-6 space-y-3">
              {/* Standard Google OAuth */}
              <button
                type="button"
                id="btn-google-login"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (New Tab)</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-slate-50 text-2xs uppercase tracking-wider text-slate-400 font-semibold">
                  Or continue with email
                </span>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop / Business Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="auth-shopname-input"
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Apex General Retail"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-2xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="auth-confirm-password-input"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 disabled:opacity-60 cursor-pointer"
            >
              <span>
                {loading
                  ? "Processing..."
                  : mode === "signin"
                  ? "Sign In to SaleTrack"
                  : mode === "signup"
                  ? "Create Account & Continue"
                  : "Send Password Reset Link"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Mode Switcher Tabs */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-600">
            {mode === "signin" && (
              <p>
                Don't have a business account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            )}

            {mode === "signup" && (
              <p>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === "forgot" && (
              <p>
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
