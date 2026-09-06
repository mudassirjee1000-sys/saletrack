import React, { useState } from "react";
import { Customer, Vendor, ShopSettings } from "../types";
import {
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Building2,
  Phone,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface ReceivablesPayablesProps {
  customers: Customer[];
  vendors: Vendor[];
  settings: ShopSettings;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectVendor?: (vendor: Vendor) => void;
}

export const ReceivablesPayables: React.FC<ReceivablesPayablesProps> = ({
  customers,
  vendors,
  settings,
}) => {
  const [filterType, setFilterType] = useState<"all" | "receivables" | "payables">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const currency = settings.currency || "$";

  // Financial metrics
  const totalReceivables = customers.reduce((sum, c) => sum + (c.remaining || 0), 0);
  const totalPayables = vendors.reduce((sum, v) => sum + (v.remainingBalance || 0), 0);
  const netCreditPosition = totalReceivables - totalPayables;

  // Customers with pending debts (Receivables)
  const debtorCustomers = customers
    .filter((c) => (c.remaining || 0) > 0)
    .sort((a, b) => b.remaining - a.remaining);

  // Vendors with pending payables (Payables)
  const creditorVendors = vendors
    .filter((v) => (v.remainingBalance || 0) > 0)
    .sort((a, b) => b.remainingBalance - a.remainingBalance);

  const filteredDebtors = debtorCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const filteredCreditors = creditorVendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receivables Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accounts Receivable
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-700">
              {currency}
              {totalReceivables.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              From {debtorCustomers.length} credit customers
            </p>
          </div>
        </div>

        {/* Payables Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accounts Payable
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700">
              {currency}
              {totalPayables.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              To {creditorVendors.length} wholesale suppliers
            </p>
          </div>
        </div>

        {/* Net Working Credit Position */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Credit Gap (Receivable - Payable)
            </span>
            <div
              className={`p-2 rounded-lg ${
                netCreditPosition >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold ${
                netCreditPosition >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {netCreditPosition >= 0 ? "+" : "-"}
              {currency}
              {Math.abs(netCreditPosition).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {netCreditPosition >= 0
                ? "Positive: Market owes your shop more than you owe suppliers"
                : "Deficit: Supplier obligations exceed current customer dues"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search party by name, phone or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              filterType === "all"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Ledger
          </button>
          <button
            onClick={() => setFilterType("receivables")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              filterType === "receivables"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Receivables ({debtorCustomers.length})
          </button>
          <button
            onClick={() => setFilterType("payables")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              filterType === "payables"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Payables ({creditorVendors.length})
          </button>
        </div>
      </div>

      {/* 2-Column Ledger Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables Column */}
        {(filterType === "all" || filterType === "receivables") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-blue-50/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Customers Owing Money (Receivables)
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {currency}{totalReceivables.toFixed(2)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
              {filteredDebtors.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  <p className="text-xs">No pending receivables.</p>
                </div>
              ) : (
                filteredDebtors.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{customer.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {customer.phone || "No phone"}
                        </span>
                        {customer.address && <span>• {customer.address}</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-700">
                        {currency}{customer.remaining.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Total credit: {currency}{customer.totalCredit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Payables Column */}
        {(filterType === "all" || filterType === "payables") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Suppliers to Pay (Payables)
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-700">
                {currency}{totalPayables.toFixed(2)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
              {filteredCreditors.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  <p className="text-xs">All supplier dues settled.</p>
                </div>
              ) : (
                filteredCreditors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {vendor.companyName || vendor.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Contact: {vendor.name}</span>
                        {vendor.phone && <span>• {vendor.phone}</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-700">
                        {currency}{vendor.remainingBalance.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Terms: {vendor.paymentTerms || "N/A"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
