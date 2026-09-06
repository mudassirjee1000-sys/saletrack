import React from "react";
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { AdminOverviewMetrics } from "../../types/admin";

interface AdminOverviewProps {
  metrics: AdminOverviewMetrics | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  metrics,
  loading,
  onNavigate,
}) => {
  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-stone-100 rounded-xl"></div>
      </div>
    );
  }

  const mrrDifference = metrics.mrr - metrics.previousMonthMrr;
  const maxRevenue = Math.max(...metrics.monthlyRevenueChart.map((d) => d.revenue), 10);

  return (
    <div className="space-y-6">
      {/* Platform Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-950">
              Admin Protected Environment
            </h4>
            <p className="text-xs text-amber-800">
              Multi-tenant isolation active. Live metrics synchronized directly with Cloud SQL database.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
            Server RBAC Active
          </span>
        </div>
      </div>

      {/* 8 Primary Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Registered Businesses */}
        <div
          id="kpi-total-businesses"
          onClick={() => onNavigate("businesses")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Businesses
            </span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              {metrics.totalBusinesses}
            </span>
            <span className="text-xs text-stone-500 font-medium">registered</span>
          </div>
        </div>

        {/* 2. Active Businesses */}
        <div
          id="kpi-active-businesses"
          onClick={() => onNavigate("businesses")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Active Businesses
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-800">
              {metrics.activeBusinesses}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {metrics.totalBusinesses > 0
                ? `${Math.round((metrics.activeBusinesses / metrics.totalBusinesses) * 100)}% active`
                : "100%"}
            </span>
          </div>
        </div>

        {/* 3. Businesses Currently on Trial */}
        <div
          id="kpi-trial-businesses"
          onClick={() => onNavigate("businesses")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              On Free Trial
            </span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700">
              {metrics.trialBusinesses}
            </span>
            <span className="text-xs text-blue-600 font-medium">14-day trial</span>
          </div>
        </div>

        {/* 4. Paying Customers */}
        <div
          id="kpi-paying-customers"
          onClick={() => onNavigate("subscriptions")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Paying Customers
            </span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-800">
              {metrics.payingCustomers}
            </span>
            <span className="text-xs text-indigo-600 font-medium">$4/mo plan</span>
          </div>
        </div>

        {/* 5. Cancelled Subscriptions */}
        <div
          id="kpi-cancelled-subs"
          onClick={() => onNavigate("subscriptions")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-700">
              {metrics.cancelledSubscriptions}
            </span>
            <span className="text-xs text-rose-600 font-medium">
              Churn: {metrics.churnRate}%
            </span>
          </div>
        </div>

        {/* 6. Monthly Recurring Revenue (MRR) */}
        <div
          id="kpi-mrr"
          onClick={() => onNavigate("revenue")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Monthly Recurring (MRR)
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              ${metrics.mrr.toFixed(2)}
            </span>
            <span
              className={`text-xs font-medium flex items-center ${
                mrrDifference >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {mrrDifference >= 0 ? `+$${mrrDifference.toFixed(2)}` : `-$${Math.abs(mrrDifference).toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* 7. Total Revenue */}
        <div
          id="kpi-total-revenue"
          onClick={() => onNavigate("revenue")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">
              ${metrics.totalRevenue.toFixed(2)}
            </span>
            <span className="text-xs text-stone-500 font-medium">all-time settled</span>
          </div>
        </div>

        {/* 8. New Customers This Month */}
        <div
          id="kpi-new-customers"
          onClick={() => onNavigate("businesses")}
          className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-400 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              New This Month
            </span>
            <div className="p-2 bg-violet-50 rounded-lg text-violet-700">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-violet-800">
              +{metrics.newCustomersThisMonth}
            </span>
            <span className="text-xs text-violet-600 font-medium">new signups</span>
          </div>
        </div>
      </div>

      {/* Revenue Growth Chart & Plan Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Subscription Revenue Growth (Last 6 Months)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Verified payment receipts synchronized from payment provider
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 text-stone-700">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Monthly Breakdown
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3 pt-2">
            <div className="h-48 flex items-end gap-3 sm:gap-6 px-2 border-b border-stone-200 pb-2">
              {metrics.monthlyRevenueChart.map((item, idx) => {
                const heightPercent = Math.max(
                  12,
                  Math.round((item.revenue / (maxRevenue || 1)) * 100)
                );
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div className="text-xs font-semibold text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${item.revenue.toFixed(2)}
                    </div>
                    <div
                      className="w-full max-w-[48px] bg-amber-600 hover:bg-amber-700 rounded-t-md transition-all relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-t-md opacity-0 group-hover:opacity-100"></div>
                    </div>
                    <span className="text-xs font-medium text-stone-600 truncate w-full text-center">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span>$0.00</span>
              <span>Mid: ${(maxRevenue / 2).toFixed(2)}</span>
              <span>Peak: ${maxRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pricing Plan Breakdown & Health */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">
                Active Pricing Model
              </h3>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                Live
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Single simple, fair pricing tier for all retail shops.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-stone-900">
                  SaleTrack Pro
                </span>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-stone-900">$4</span>
                  <span className="text-xs text-stone-500"> / month</span>
                </div>
              </div>
              <ul className="mt-3 text-xs text-stone-600 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Unlimited sales & products
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Inventory, Vendor, & Customer Ledger
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Cloud SQL auto-sync & AI advisor
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  14-day free trial on signup
                </li>
              </ul>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">Conversion Rate:</span>
                <span className="font-semibold text-stone-900">
                  {metrics.totalBusinesses > 0
                    ? `${Math.round((metrics.payingCustomers / metrics.totalBusinesses) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.totalBusinesses > 0
                        ? Math.min(
                            100,
                            Math.round((metrics.payingCustomers / metrics.totalBusinesses) * 100)
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500">Active Subscribers</span>
            <span className="text-sm font-bold text-stone-900">
              {metrics.activeSubscribers} businesses
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
