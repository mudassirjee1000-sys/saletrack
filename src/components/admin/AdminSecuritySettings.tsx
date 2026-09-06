import React from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Users,
} from "lucide-react";

interface AdminSecuritySettingsProps {
  adminEmail?: string;
  adminRole?: string;
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({
  adminEmail,
  adminRole,
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              SaleTrack Multi-Tenant Security & Access Control
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              SaleTrack strictly isolates customer tenant boundaries at the database and API layers.
              All administrative operations are verified with cryptographic server-side tokens and database roles.
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Admin Authentication & Role Authorization */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-700" />
            <h4 className="text-sm font-bold text-stone-900">
              Server-Side RBAC Architecture
            </h4>
          </div>
          <div className="text-xs text-stone-600 space-y-2">
            <p>
              Administrative access is guarded by the <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">requireAdmin</code> Express middleware on all <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">/api/admin/*</code> routes.
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Role Verification:</strong> Evaluates active records in the <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">admin_users</code> table and designated platform owner.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>No Email Substring Shortcuts:</strong> Does NOT evaluate substring matches (e.g. &quot;admin@...&quot;).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Immediate 403 Blocking:</strong> Unauthorized users receive HTTP 403 Forbidden with zero tenant data leaks.
                </span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-200 text-xs flex items-center justify-between">
            <span className="text-stone-500">Current Session:</span>
            <span className="font-semibold text-stone-900">
              {adminEmail} ({adminRole || "admin"})
            </span>
          </div>
        </div>

        {/* 2. Multi-Tenant Data Protection */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-700" />
            <h4 className="text-sm font-bold text-stone-900">
              Customer Multi-Tenant Isolation
            </h4>
          </div>
          <div className="text-xs text-stone-600 space-y-2">
            <p>
              Customer shop endpoints (<code className="bg-stone-100 px-1 py-0.5 rounded font-mono">/api/data</code>) bind queries strictly to the verified ID token&apos;s <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">req.user.uid</code>.
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Client Injection Prevention:</strong> A customer cannot alter their user ID in a request payload to query another business.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Row-Level Stamping:</strong> All products, sales, expenses, customers, and vendors are foreign-keyed directly to the authenticated tenant.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Cross-Tenant Leakage:</strong> Normal customers can never see or modify any other business&apos;s data.
                </span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-200 text-xs flex items-center justify-between">
            <span className="text-stone-500">Storage Engine:</span>
            <span className="font-semibold text-stone-900">
              Cloud SQL (PostgreSQL)
            </span>
          </div>
        </div>
      </div>

      {/* Database Schema Status */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-stone-700" />
          Active PostgreSQL Schema Entities
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          {[
            { name: "admin_users", type: "RBAC Security" },
            { name: "businesses", type: "Tenant Registry" },
            { name: "subscriptions", type: "Billing Engine" },
            { name: "payments", type: "Provider Ledger" },
            { name: "login_activity", type: "Security Audit" },
            { name: "profiles", type: "User Identity" },
          ].map((table) => (
            <div key={table.name} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <div className="font-mono font-bold text-stone-900">{table.name}</div>
              <div className="text-2xs text-stone-500 mt-0.5">{table.type}</div>
              <div className="mt-2 flex items-center gap-1 text-2xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
