import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  History,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  RefreshCw,
  Clock,
  Laptop,
} from "lucide-react";
import { AdminLoginActivity as LoginActivityType } from "../../types/admin";

interface AdminLoginActivityProps {
  token: string | null;
}

export const AdminLoginActivity: React.FC<AdminLoginActivityProps> = ({ token }) => {
  const [logins, setLogins] = useState<LoginActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogins = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        search: search.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/login-activity?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setLogins(data.logins || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load login activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, [token, page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogins();
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user email, business name, or IP address..."
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
              <option value="all">All Events</option>
              <option value="successful">Successful Logins</option>
              <option value="failed">Failed Attempts</option>
            </select>
          </div>

          <button
            onClick={fetchLogins}
            className="p-1.5 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            title="Refresh Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Login Audit Trail Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-medium">
              <tr>
                <th className="p-3.5">Account / Business</th>
                <th className="p-3.5">User Email</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Client IP</th>
                <th className="p-3.5">Device & User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading audit trail...
                  </td>
                </tr>
              ) : logins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-500">
                    <History className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No login records found</p>
                    <p className="text-2xs text-stone-500">
                      User authentication events will be automatically logged here.
                    </p>
                  </td>
                </tr>
              ) : (
                logins.map((item) => {
                  const isSuccess = item.status === "successful";
                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition">
                      {/* Business Name */}
                      <td className="p-3.5 font-semibold text-stone-900">
                        {item.businessName || "SaleTrack Account"}
                      </td>

                      {/* Email */}
                      <td className="p-3.5 text-stone-700 font-medium">{item.email}</td>

                      {/* Timestamp */}
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold ${
                            isSuccess
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isSuccess ? "SUCCESS" : "FAILED"}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="p-3.5 font-mono text-2xs text-stone-600 whitespace-nowrap">
                        {item.ipAddress || "127.0.0.1"}
                      </td>

                      {/* User Agent */}
                      <td className="p-3.5 text-2xs text-stone-500 truncate max-w-[280px]">
                        <span title={item.userAgent || ""}>
                          {item.userAgent || "Web Browser"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <div>
            Showing <span className="font-semibold text-stone-900">{logins.length}</span> of{" "}
            <span className="font-semibold text-stone-900">{totalCount}</span> login events
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
