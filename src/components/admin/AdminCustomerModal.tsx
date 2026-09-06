import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Mail,
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
  CreditCard,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { BusinessDrillDownDetails, AdminBusiness } from "../../types/admin";

interface AdminCustomerModalProps {
  businessId: string | null;
  token: string | null;
  onClose: () => void;
  onStatusChanged: (businessId: string, newStatus: "active" | "suspended") => void;
}

export const AdminCustomerModal: React.FC<AdminCustomerModalProps> = ({
  businessId,
  token,
  onClose,
  onStatusChanged,
}) => {
  const [details, setDetails] = useState<BusinessDrillDownDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modal state for destructive action
  const [confirmingAction, setConfirmingAction] = useState<"suspend" | "reactivate" | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!businessId || !token) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/businesses/${businessId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.details) {
          setDetails(data.details);
        } else {
          setError(data.error || "Failed to load customer details.");
        }
      } catch (err: any) {
        setError(err.message || "Network error fetching business details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [businessId, token]);

  const handleStatusChange = async (targetStatus: "active" | "suspended") => {
    if (!businessId || !token) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        setDetails((prev) =>
          prev
            ? {
                ...prev,
                business: {
                  ...prev.business,
                  status: targetStatus,
                },
              }
            : null
        );
        onStatusChanged(businessId, targetStatus);
        setConfirmingAction(null);
      } else {
        alert(data.error || "Failed to update account status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to contact admin server.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!businessId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-200 text-stone-800 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  {details?.business.name || "Customer Business Details"}
                </h3>
                {details?.business.isTest && (
                  <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-stone-200 text-stone-700">
                    Test Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {details?.business.ownerEmail || "Loading email..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-stone-500 space-y-3">
              <div className="w-8 h-8 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm">Fetching secure business profile & ledger...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          ) : details ? (
            <>
              {/* Account Status and Action Strip */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      details.business.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {details.business.status === "active" ? (
                      <Shield className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        Account Status
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          details.business.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {details.business.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {details.business.status === "active"
                        ? "Customer currently has normal access to their SaleTrack shop."
                        : "Customer account is suspended. Shop access is currently blocked."}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Action Button */}
                <div>
                  {details.business.status === "active" ? (
                    <button
                      onClick={() => setConfirmingAction("suspend")}
                      className="px-3.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmingAction("reactivate")}
                      className="px-3.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition"
                    >
                      Reactivate Account
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmation Dialog Overlay */}
              {confirmingAction && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        {confirmingAction === "suspend"
                          ? `Confirm Suspension of ${details.business.name}`
                          : `Confirm Reactivation of ${details.business.name}`}
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        {confirmingAction === "suspend"
                          ? "Are you sure you want to suspend this customer? They will be locked out of recording sales, inventory, and ledger tools until reinstated."
                          : "Are you sure you want to reactivate this customer? Full operational access to their store will be restored immediately."}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      disabled={isUpdatingStatus}
                      onClick={() => setConfirmingAction(null)}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        handleStatusChange(
                          confirmingAction === "suspend" ? "suspended" : "active"
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition ${
                        confirmingAction === "suspend"
                          ? "bg-rose-600 hover:bg-rose-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {isUpdatingStatus
                        ? "Saving..."
                        : confirmingAction === "suspend"
                        ? "Yes, Suspend Account"
                        : "Yes, Reactivate Account"}
                    </button>
                  </div>
                </div>
              )}

              {/* Business Account Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">
                    Subscription Tier
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-1">
                    {details.business.plan}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">
                    Billing Status
                  </span>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        details.business.subscriptionStatus === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : details.business.subscriptionStatus === "trial"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-200 text-stone-800"
                      }`}
                    >
                      {details.business.subscriptionStatus.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">
                    Registered On
                  </span>
                  <p className="text-xs font-medium text-stone-800 mt-1">
                    {details.business.createdAt
                      ? new Date(details.business.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-2xs font-semibold text-stone-500 uppercase tracking-wider">
                    Last Login
                  </span>
                  <p className="text-xs font-medium text-stone-800 mt-1">
                    {details.business.lastLoginAt
                      ? new Date(details.business.lastLoginAt).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Trial & Billing Schedule Dates */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                  Billing Schedule & Trial Period
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-stone-500">Trial Period:</span>
                    <p className="font-semibold text-stone-900 mt-0.5">
                      {details.business.trialStartDate
                        ? `${new Date(
                            details.business.trialStartDate
                          ).toLocaleDateString()} — ${
                            details.business.trialEndDate
                              ? new Date(
                                  details.business.trialEndDate
                                ).toLocaleDateString()
                              : "Active"
                          }`
                        : "No trial recorded"}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500">Subscription Started:</span>
                    <p className="font-semibold text-stone-900 mt-0.5">
                      {details.business.subscriptionStartDate
                        ? new Date(
                            details.business.subscriptionStartDate
                          ).toLocaleDateString()
                        : "Not yet started (On trial)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500">Next Billing Date:</span>
                    <p className="font-semibold text-stone-900 mt-0.5">
                      {details.business.nextBillingDate
                        ? new Date(
                            details.business.nextBillingDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History (Stripe / Webhook Receipts) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment Transactions ({details.payments.length})
                  </h4>
                  <span className="text-2xs text-stone-500">
                    Provider Webhook Verified
                  </span>
                </div>
                {details.payments.length === 0 ? (
                  <div className="p-4 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500">
                    No payment transactions recorded for this business yet.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-medium">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Transaction ID</th>
                          <th className="p-3">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {details.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50">
                            <td className="p-3 text-stone-600">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-semibold text-stone-900">
                              ${p.amount.toFixed(2)} {p.currency}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                                  p.status === "succeeded"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {p.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-2xs text-stone-600">
                              {p.transactionId}
                            </td>
                            <td className="p-3 text-stone-600">
                              {p.invoiceNumber || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Login Activity */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Recent Account Login History
                </h4>
                {details.loginActivity.length === 0 ? (
                  <div className="p-4 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500">
                    No login events logged yet.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-medium">
                        <tr>
                          <th className="p-2.5">Date & Time</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">IP Address</th>
                          <th className="p-2.5">Client User Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {details.loginActivity.map((l) => (
                          <tr key={l.id} className="hover:bg-stone-50">
                            <td className="p-2.5 text-stone-600">
                              {new Date(l.createdAt).toLocaleString()}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${
                                  l.status === "successful"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-2xs text-stone-500">
                              {l.ipAddress || "127.0.0.1"}
                            </td>
                            <td className="p-2.5 text-2xs text-stone-500 truncate max-w-[200px]">
                              {l.userAgent || "Web Client"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Data Safety Notice */}
              <div className="flex items-center gap-2 text-2xs text-stone-500 bg-stone-100 p-3 rounded-lg">
                <Lock className="w-3.5 h-3.5 shrink-0 text-stone-600" />
                <span>
                  Protected Multi-Tenant View: Raw customer credit cards, passwords, and private store encryption tokens are never transmitted or stored on this server.
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
