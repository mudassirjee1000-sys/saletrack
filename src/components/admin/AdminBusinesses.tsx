import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { AdminBusiness } from "../../types/admin";
import { AdminCustomerModal } from "./AdminCustomerModal";

interface AdminBusinessesProps {
  token: string | null;
}

export const AdminBusinesses: React.FC<AdminBusinessesProps> = ({ token }) => {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Drill-down customer modal
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        search: search.trim(),
        subscriptionStatus: subscriptionFilter,
        accountStatus: accountFilter,
      });

      const res = await fetch(`/api/admin/businesses?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBusinesses(data.businesses || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load businesses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [token, page, subscriptionFilter, accountFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const handleStatusChanged = (businessId: string, newStatus: "active" | "suspended") => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, status: newStatus } : b))
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name, owner email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={subscriptionFilter}
              onChange={(e) => {
                setSubscriptionFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active ($4/mo)</option>
              <option value="trial">On Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          <button
            onClick={fetchBusinesses}
            className="p-1.5 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-medium">
              <tr>
                <th className="p-3.5">Business Name</th>
                <th className="p-3.5">Account Owner Email</th>
                <th className="p-3.5">Registered</th>
                <th className="p-3.5">Last Login</th>
                <th className="p-3.5">Subscription Status</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Next Billing</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading registered businesses...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-stone-500 space-y-1">
                    <Building2 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-stone-700">No businesses found</p>
                    <p className="text-xs text-stone-500">
                      Try clearing search filters or check database connection.
                    </p>
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => {
                  const isSuspended = biz.status === "suspended";
                  return (
                    <tr
                      key={biz.id}
                      onClick={() => setSelectedBusinessId(biz.id)}
                      className="hover:bg-stone-50 transition cursor-pointer group"
                    >
                      {/* Business Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-bold shrink-0">
                            {biz.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 group-hover:text-amber-800 transition">
                              {biz.name}
                            </div>
                            {biz.isTest && (
                              <span className="inline-block text-2xs text-stone-600 bg-stone-100 px-1.5 rounded">
                                Test Data
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Owner Email */}
                      <td className="p-3.5 font-medium text-stone-700">
                        {biz.ownerEmail}
                      </td>

                      {/* Registration Date */}
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {biz.createdAt
                          ? new Date(biz.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Last Login */}
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {biz.lastLoginAt
                          ? new Date(biz.lastLoginAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : "Never"}
                      </td>

                      {/* Subscription Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold ${
                            biz.subscriptionStatus === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : biz.subscriptionStatus === "trial"
                              ? "bg-blue-100 text-blue-800"
                              : biz.subscriptionStatus === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-stone-200 text-stone-800"
                          }`}
                        >
                          {biz.subscriptionStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="p-3.5 text-stone-800 font-medium whitespace-nowrap">
                        {biz.plan}
                      </td>

                      {/* Next Billing Date */}
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {biz.nextBillingDate
                          ? new Date(biz.nextBillingDate).toLocaleDateString()
                          : biz.subscriptionStatus === "trial"
                          ? `Trial ends ${
                              biz.trialEndDate
                                ? new Date(biz.trialEndDate).toLocaleDateString()
                                : "soon"
                            }`
                          : "—"}
                      </td>

                      {/* Account Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold ${
                            isSuspended
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isSuspended ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          {biz.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBusinessId(biz.id);
                          }}
                          className="px-2.5 py-1 text-2xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>
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
            Showing <span className="font-semibold text-stone-900">{businesses.length}</span> of{" "}
            <span className="font-semibold text-stone-900">{totalCount}</span> businesses
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

      {/* Drill-down modal */}
      {selectedBusinessId && (
        <AdminCustomerModal
          businessId={selectedBusinessId}
          token={token}
          onClose={() => setSelectedBusinessId(null)}
          onStatusChanged={handleStatusChanged}
        />
      )}
    </div>
  );
};
