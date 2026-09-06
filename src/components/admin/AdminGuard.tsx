import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowLeft,
  LogIn,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AdminDashboard } from "./AdminDashboard";

interface AdminGuardProps {
  onReturnToShop: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ onReturnToShop }) => {
  const { user, token, loading: authLoading, signInWithGoogle, signOut, getIdToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminInfo, setAdminInfo] = useState<{
    role: string;
    email?: string;
    name?: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkServerAdminAccess = async () => {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setVerifying(false);
        }
        return;
      }

      setVerifying(true);
      try {
        const freshToken = await getIdToken();
        if (!freshToken) {
          if (isMounted) {
            setIsAdmin(false);
            setVerifying(false);
          }
          return;
        }

        const res = await fetch("/api/admin/check-access", {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        });

        if (res.status === 200) {
          const data = await res.json();
          if (isMounted) {
            setIsAdmin(true);
            setAdminInfo({
              role: data.role || "admin",
              email: data.email || user.email || undefined,
              name: data.name || user.user_metadata?.full_name || (user as any).displayName || undefined,
            });
            setAccessDeniedReason(null);
          }
        } else {
          // HTTP 403 Forbidden or 401 Unauthorized
          const errorData = await res.json().catch(() => ({}));
          if (isMounted) {
            setIsAdmin(false);
            setAccessDeniedReason(
              errorData.error ||
                "Your account is not registered on the SaleTrack system administrator roster."
            );
          }
        }
      } catch (err: any) {
        console.error("Admin verification error:", err);
        if (isMounted) {
          setIsAdmin(false);
          setAccessDeniedReason("Server authentication check encountered an unexpected error.");
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    if (!authLoading) {
      checkServerAdminAccess();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, getIdToken]);

  // Loading state
  if (authLoading || verifying) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="p-4 bg-stone-800 rounded-2xl border border-stone-700 shadow-xl max-w-sm w-full space-y-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Verifying Cryptographic Credentials
            </h3>
            <p className="text-xs text-stone-400">
              Querying server-side role validation on Cloud SQL...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in at all: provide Admin Sign-In Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              SaleTrack Owner & Admin Portal
            </h2>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              This is a private, restricted console for the SaleTrack platform owner and designated administrators only.
            </p>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-4 text-xs text-stone-300 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Role-Based Access Control (RBAC)
            </div>
            <p className="text-2xs text-stone-400 leading-relaxed">
              Access is protected by server-side verification. Customer accounts will be denied entry automatically.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition shadow-md shadow-amber-900/30 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign In With Admin Account
            </button>

            <button
              onClick={onReturnToShop}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl font-medium text-xs transition border border-stone-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signed in, but server rejected (403 Forbidden / Not an admin)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-rose-900/40 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-widest">
              HTTP 403 &bull; Access Denied
            </span>
            <h2 className="text-xl font-extrabold text-white">
              Unauthorized Admin Access
            </h2>
            <p className="text-xs text-stone-400">
              The authenticated account (
              <span className="font-mono text-stone-200">{user.email}</span>) does not possess system administrator privileges.
            </p>
          </div>

          <div className="p-4 bg-stone-800/80 border border-stone-700 rounded-xl text-left text-xs text-stone-300 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Tenant Boundary Security
            </div>
            <p className="text-2xs text-stone-400 leading-relaxed">
              Normal SaleTrack retail customers cannot access the administrative dashboard.
              All admin capabilities and customer data remain strictly isolated.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onReturnToShop}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition shadow-md shadow-amber-900/30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My Store Dashboard
            </button>

            <button
              onClick={signOut}
              className="w-full py-2 text-2xs text-stone-400 hover:text-stone-200 transition"
            >
              Sign out and try another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin! Render full Dashboard
  return (
    <AdminDashboard
      token={token}
      adminInfo={adminInfo || { role: "admin", email: user.email || "" }}
      onReturnToShop={onReturnToShop}
      onSignOut={signOut}
    />
  );
};
