import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Receipt,
  FileText,
} from "lucide-react";
import { AdminPayment } from "../../types/admin";

interface AdminPaymentsProps {
  token: string | null;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({ token }) => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPayments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        search: search.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token, page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name, owner email, transaction ID, or invoice..."
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
              <option value="all">All Transactions</option>
              <option value="succeeded">Succeeded Only</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <button
            onClick={fetchPayments}
            className="p-1.5 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            title="Refresh Transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-medium">
              <tr>
                <th className="p-3.5">Customer / Business</th>
                <th className="p-3.5">Account Owner</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5">Provider</th>
                <th className="p-3.5">Transaction ID</th>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-stone-500">
                    <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">No payment records found</p>
                    <p className="text-2xs text-stone-500">
                      Payment provider webhook deliveries will populate this ledger.
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-stone-50 transition">
                    {/* Business Name */}
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">
                        {pay.businessName}
                      </div>
                      <div className="text-2xs font-mono text-stone-400">
                        {pay.businessId}
                      </div>
                    </td>

                    {/* Owner Email */}
                    <td className="p-3.5 text-stone-700">{pay.ownerEmail}</td>

                    {/* Amount */}
                    <td className="p-3.5 font-bold text-stone-900 whitespace-nowrap">
                      ${Number(pay.amount).toFixed(2)} {pay.currency}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold ${
                          pay.status === "succeeded"
                            ? "bg-emerald-100 text-emerald-800"
                            : pay.status === "refunded"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {pay.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="p-3.5 text-stone-600 whitespace-nowrap">
                      {pay.provider}
                    </td>

                    {/* Transaction ID */}
                    <td className="p-3.5 font-mono text-2xs text-stone-700 whitespace-nowrap">
                      {pay.transactionId}
                    </td>

                    {/* Invoice Number */}
                    <td className="p-3.5 text-stone-600 whitespace-nowrap flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-stone-400" />
                      {pay.invoiceNumber || "—"}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-stone-600 whitespace-nowrap">
                      {pay.createdAt ? new Date(pay.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <div>
            Showing <span className="font-semibold text-stone-900">{payments.length}</span> of{" "}
            <span className="font-semibold text-stone-900">{totalCount}</span> transactions
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
