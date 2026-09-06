import React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  XCircle,
  Calendar,
  CreditCard,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { AdminOverviewMetrics } from "../../types/admin";

interface AdminRevenueProps {
  metrics: AdminOverviewMetrics | null;
  loading: boolean;
}

export const AdminRevenue: React.FC<AdminRevenueProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-stone-100 rounded-xl"></div>
      </div>
    );
  }

  const mrrDiff = metrics.mrr - metrics.previousMonthMrr;
  const maxRevenue = Math.max(...metrics.monthlyRevenueChart.map((d) => d.revenue), 10);

  return (
    <div className="space-y-6">
      {/* 4 Financial Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current MRR */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Current MRR
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900">
              ${metrics.mrr.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                mrrDiff >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {mrrDiff >= 0 ? `+$${mrrDiff.toFixed(2)}` : `-$${Math.abs(mrrDiff).toFixed(2)}`}
            </span>
          </div>
          <p className="text-2xs text-stone-500 mt-1">
            vs. ${metrics.previousMonthMrr.toFixed(2)} previous month
          </p>
        </div>

        {/* Previous Month's MRR */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Previous Month MRR
            </span>
            <div className="p-2 bg-stone-100 text-stone-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-stone-800">
              ${metrics.previousMonthMrr.toFixed(2)}
            </span>
          </div>
          <p className="text-2xs text-stone-500 mt-1">Baseline comparison month</p>
        </div>

        {/* Total Subscription Revenue */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Subscription Revenue
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-stone-900">
              ${metrics.totalRevenue.toFixed(2)}
            </span>
          </div>
          <p className="text-2xs text-stone-500 mt-1">
            Lifetime settled through provider
          </p>
        </div>

        {/* Churn Rate */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Churn Rate
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-700">
              {metrics.churnRate}%
            </span>
            <span className="text-xs text-rose-600 font-medium">
              {metrics.cancelledSubscriptions} cancelled
            </span>
          </div>
          <p className="text-2xs text-stone-500 mt-1">
            {metrics.activeSubscribers} active paying subscribers
          </p>
        </div>
      </div>

      {/* Subscription Breakdown Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">New Subscriptions This Month</span>
            <p className="text-lg font-bold text-stone-900 mt-0.5">
              +{metrics.newCustomersThisMonth}
            </p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Active Subscribers</span>
            <p className="text-lg font-bold text-stone-900 mt-0.5">
              {metrics.activeSubscribers}
            </p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Total Cancellations</span>
            <p className="text-lg font-bold text-stone-900 mt-0.5">
              {metrics.cancelledSubscriptions}
            </p>
          </div>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Comprehensive Revenue Chart */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Monthly Subscription Revenue (USD)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Historical monthly billing performance across all subscriber accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-stone-100 text-stone-700 text-xs font-medium">
              Plan: SaleTrack Pro ($4.00/mo)
            </span>
          </div>
        </div>

        {/* Bar Chart Visualization with Gridlines */}
        <div className="space-y-4">
          <div className="h-56 flex items-end gap-3 sm:gap-8 px-4 border-b border-stone-200 pb-3 relative">
            {/* Midline benchmark */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-stone-200 pointer-events-none"
              style={{ bottom: "50%" }}
            >
              <span className="absolute left-2 -top-4 text-2xs text-stone-400">
                ${(maxRevenue / 2).toFixed(2)}
              </span>
            </div>

            {metrics.monthlyRevenueChart.map((item, idx) => {
              const heightPercent = Math.max(
                12,
                Math.round((item.revenue / (maxRevenue || 1)) * 100)
              );
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group z-10"
                >
                  <div className="text-xs font-bold text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1.5 py-0.5 rounded shadow-sm border border-stone-200">
                    ${item.revenue.toFixed(2)}
                  </div>
                  <div
                    className="w-full max-w-[56px] bg-amber-600 hover:bg-amber-700 rounded-t-lg transition-all relative cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 rounded-t-lg opacity-0 group-hover:opacity-100"></div>
                  </div>
                  <span className="text-xs font-semibold text-stone-700 truncate w-full text-center">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 px-2">
            <span>$0.00 Floor</span>
            <span>Annual Run Rate: ${(metrics.mrr * 12).toFixed(2)} ARR</span>
            <span>Peak Month: ${maxRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
