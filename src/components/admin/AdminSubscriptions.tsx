import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AdminSubscription } from "../../types/admin";

interface AdminSubscriptionsProps {
  token: string | null;
}

export const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ token }) => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSubscriptions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        search: search.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [token, page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  return (
    <div className="space-y-5">
      {/* Integrity & Webhook Synchronized Notice */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-200 text-stone-700 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-stone-700">
            <span className="font-semibold text-stone-900">
              Provider-Synchronized Subscriptions:
            </span>{" "}
            Subscription states are driven by payment provider webhooks (e.g., Stripe events).
            Manual fabrication of payment records is restricted to maintain financial integrity.
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded bg-white border border-stone-300 text-stone-700 font-mono text-2xs whitespace-nowrap">
          Webhook Endpoint: /api/webhooks/payment
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name, email, or subscription ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <button
            onClick={fetchSubscriptions}
            className="p-1.5 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            title="Refresh Subscriptions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-medium">
              <tr>
                <th className="p-3.5">Customer / Business</th>
                <th className="p-3.5">Owner Email</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Interval</th>
                <th className="p-3.5">Subscription Status</th>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">Renewal / Next Billing</th>
                <th className="p-3.5">Cancellation Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-stone-500">
                    <CreditCard className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No subscriptions found</p>
                    <p className="text-2xs text-stone-500">
                      As customers activate plans, their recurring subscriptions will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isCancelled = sub.status === "cancelled";
                  return (
                    <tr key={sub.id} className="hover:bg-stone-50 transition">
                      {/* Customer / Business */}
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-900">
                          {sub.businessName}
                        </div>
                        <div className="text-2xs font-mono text-stone-400">{sub.id}</div>
                      </td>

                      {/* Owner Email */}
                      <td className="p-3.5 text-stone-700">{sub.ownerEmail}</td>

                      {/* Plan: SaleTrack Pro — $4/month */}
                      <td className="p-3.5 font-bold text-stone-900 whitespace-nowrap">
                        {sub.plan}
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 font-semibold text-stone-900 whitespace-nowrap">
                        ${Number(sub.amount).toFixed(2)} {sub.currency}
                      </td>

                      {/* Interval */}
                      <td className="p-3.5 text-stone-600 capitalize whitespace-nowrap">
                        {sub.interval}ly
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                            sub.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : sub.status === "trial"
                              ? "bg-blue-100 text-blue-800"
                              : isCancelled
                              ? "bg-rose-100 text-rose-800"
                              : "bg-stone-200 text-stone-800"
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {sub.startDate
                          ? new Date(sub.startDate).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Renewal / Next Billing Date */}
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Cancellation Date */}
                      <td className="p-3.5 text-stone-500 whitespace-nowrap">
                        {sub.canceledAt
                          ? new Date(sub.canceledAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <div>
            Showing <span className="font-semibold text-stone-900">{subscriptions.length}</span> of{" "}
            <span className="font-semibold text-stone-900">{totalCount}</span> subscriptions
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-stone-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
