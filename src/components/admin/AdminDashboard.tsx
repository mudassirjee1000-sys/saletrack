import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  History,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { AdminOverviewMetrics } from "../../types/admin";
import { AdminOverview } from "./AdminOverview";
import { AdminBusinesses } from "./AdminBusinesses";
import { AdminSubscriptions } from "./AdminSubscriptions";
import { AdminPayments } from "./AdminPayments";
import { AdminRevenue } from "./AdminRevenue";
import { AdminLoginActivity } from "./AdminLoginActivity";
import { AdminSecuritySettings } from "./AdminSecuritySettings";

interface AdminDashboardProps {
  token: string | null;
  adminInfo: {
    role: string;
    email?: string;
    name?: string;
  };
  onReturnToShop: () => void;
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminInfo,
  onReturnToShop,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const fetchOverviewMetrics = async () => {
    if (!token) return;
    setLoadingMetrics(true);
    try {
      const res = await fetch("/api/admin/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchOverviewMetrics();
  }, [token]);

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "businesses", label: "Users & Businesses", icon: Building2 },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "payments", label: "Payment Ledger", icon: DollarSign },
    { id: "revenue", label: "Revenue Analytics", icon: TrendingUp },
    { id: "login-activity", label: "Login Audit Trail", icon: History },
    { id: "security", label: "Security Architecture", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onReturnToShop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition border border-stone-700"
              title="Return to Customer Shop"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Return to Shop</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-600 rounded-lg text-white font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white">
                    SaleTrack Admin Console
                  </h1>
                  <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    {adminInfo.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
                <p className="text-2xs text-stone-400 hidden sm:block">
                  Protected System Administration & SaaS Management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverviewMetrics}
              disabled={loadingMetrics}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Refresh All Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMetrics ? "animate-spin" : ""}`} />
            </button>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-medium text-stone-200">
                {adminInfo.name || "Owner"}
              </span>
              <span className="text-2xs text-stone-400 font-mono">
                {adminInfo.email}
              </span>
            </div>

            <button
              onClick={onSignOut}
              className="p-2 rounded-lg bg-stone-800 hover:bg-rose-900/50 hover:text-rose-200 text-stone-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-navigation Bar */}
        <div className="bg-stone-900/90 border-t border-stone-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-amber-600 text-white shadow-sm font-semibold"
                      : "text-stone-300 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === "overview" && (
          <AdminOverview
            metrics={metrics}
            loading={loadingMetrics}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "businesses" && <AdminBusinesses token={token} />}

        {activeTab === "subscriptions" && <AdminSubscriptions token={token} />}

        {activeTab === "payments" && <AdminPayments token={token} />}

        {activeTab === "revenue" && (
          <AdminRevenue metrics={metrics} loading={loadingMetrics} />
        )}

        {activeTab === "login-activity" && <AdminLoginActivity token={token} />}

        {activeTab === "security" && (
          <AdminSecuritySettings
            adminEmail={adminInfo.email}
            adminRole={adminInfo.role}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 px-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SaleTrack Multi-Tenant Management Platform &copy; 2026</span>
          <span className="font-mono text-2xs text-stone-400">
            PostgreSQL Database &bull; Server-Side RBAC Enforcement &bull; Zero Client-Side Leaks
          </span>
        </div>
      </footer>
    </div>
  );
};
