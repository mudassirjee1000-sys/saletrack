import React, { useState } from "react";
import { Customer, ShopSettings, Sale } from "../types";
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Phone,
  History,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  Share2,
  AlertCircle,
} from "lucide-react";

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  settings: ShopSettings;
  onSaveCustomer: (customer: Customer) => void;
  onRecordPayment: (customerId: string, amount: number, date: string, note?: string) => void;
  onViewInvoice: (sale: Sale) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  customers,
  sales,
  settings,
  onSaveCustomer,
  onRecordPayment,
  onViewInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [viewLedgerCustomer, setViewLedgerCustomer] = useState<Customer | null>(null);

  // Add Customer form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState("");

  // Payment form state
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("Cash installment");
  const [payError, setPayError] = useState("");

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    const newCust: Customer = {
      id: "cust-" + Date.now(),
      name: name.trim(),
      phone: phone.trim() || "N/A",
      address: address.trim() || undefined,
      totalCredit: 0,
      totalPaid: 0,
      remaining: 0,
      payments: [],
      createdAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setName("");
    setPhone("");
    setAddress("");
    setIsAddModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");

    if (!paymentCustomer) return;

    const parsed = parseFloat(payAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setPayError("Payment amount must be greater than zero.");
      return;
    }

    onRecordPayment(paymentCustomer.id, parsed, payDate, payNote);
    setPaymentCustomer(null);
    setPayAmount("");
  };

  const handleSendReminder = (customer: Customer) => {
    const text = `Hello ${customer.name}, friendly reminder from ${settings.shopName}. Your outstanding store balance is ${settings.currency}${customer.remaining.toFixed(2)}. Thank you!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Store Balance Reminder", text }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };


  // Filtered customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstandingCredit = customers.reduce((sum, c) => sum + c.remaining, 0);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-800">Customers & Credit Ledger</h2>
          <p className="text-xs text-slate-400">
            Total Outstanding Balance Owed:{" "}
            <strong className="text-red-600 font-bold">
              {settings.currency}
              {totalOutstandingCredit.toFixed(2)}
            </strong>
          </p>
        </div>

        <button
          id="add-customer-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-customers-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customers List / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700">No customer records found.</p>
          <p className="mt-1">Add regular customers to keep track of their credit and payments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((cust) => {
            const hasDebt = cust.remaining > 0;

            return (
              <div
                key={cust.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition hover:border-slate-300"
              >
                {/* Header: Name & Phone */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{cust.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                    {cust.address && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{cust.address}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    {hasDebt ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        Owes {settings.currency}
                        {cust.remaining.toFixed(2)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                        Fully Cleared
                      </span>
                    )}
                  </div>
                </div>

                {/* Ledger Financials */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Credit</span>
                    <span className="font-semibold text-slate-700">
                      {settings.currency}
                      {cust.totalCredit.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Paid</span>
                    <span className="font-semibold text-green-600">
                      {settings.currency}
                      {cust.totalPaid.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Remaining</span>
                    <span
                      className={`font-bold ${hasDebt ? "text-red-600" : "text-green-700"}`}
                    >
                      {settings.currency}
                      {cust.remaining.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setViewLedgerCustomer(cust)}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium py-1 px-2 rounded-md hover:bg-slate-100 transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View History</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {hasDebt && (
                      <button
                        onClick={() => handleSendReminder(cust)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Share / Send Reminder"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPaymentCustomer(cust);
                        setPayAmount(cust.remaining > 0 ? cust.remaining.toString() : "");
                        setPayError("");
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs shadow-xs active:scale-95 transition"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Customer Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Record Customer Payment</h4>
                <p className="text-xs text-slate-500">Customer: {paymentCustomer.name}</p>
              </div>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-lg text-xs flex justify-between items-center border border-blue-100">
              <span className="text-blue-700 font-medium">Current Outstanding Debt:</span>
              <span className="font-bold text-red-600 text-sm">
                {settings.currency}
                {paymentCustomer.remaining.toFixed(2)}
              </span>
            </div>

            {payError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                {payError}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received ({settings.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Reference
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Cash installment, Mobile money"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-xs"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger / History Modal */}
      {viewLedgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl p-5 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Ledger History: {viewLedgerCustomer.name}
                </h4>
                <p className="text-xs text-slate-400">Phone: {viewLedgerCustomer.phone}</p>
              </div>
              <button
                onClick={() => setViewLedgerCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Purchases</span>
                <span className="font-bold text-slate-800">
                  {settings.currency}
                  {viewLedgerCustomer.totalCredit.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Paid</span>
                <span className="font-bold text-green-600">
                  {settings.currency}
                  {viewLedgerCustomer.totalPaid.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Balance Due</span>
                <span className="font-bold text-red-600">
                  {settings.currency}
                  {viewLedgerCustomer.remaining.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payments History List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recorded Payments ({viewLedgerCustomer.payments?.length || 0})
              </h5>
              {!viewLedgerCustomer.payments || viewLedgerCustomer.payments.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No payment entries yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {viewLedgerCustomer.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 flex items-center justify-between text-xs bg-white"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">
                          {p.note || "Payment received"}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{p.date}</span>
                      </div>
                      <span className="font-bold text-green-600 text-sm">
                        +{settings.currency}
                        {p.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Credit Sales */}
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">
                Credit Sales for Customer
              </h5>
              {sales.filter((s) => s.customerId === viewLedgerCustomer.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No sales assigned.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {sales
                    .filter((s) => s.customerId === viewLedgerCustomer.id)
                    .map((sale) => (
                      <div
                        key={sale.id}
                        className="p-2.5 flex items-center justify-between text-xs bg-white"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800">
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{sale.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {settings.currency}
                            {sale.total.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              setViewLedgerCustomer(null);
                              onViewInvoice(sale);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="View invoice"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewLedgerCustomer(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">Add Customer Profile</h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fatima Ali"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 555-0199"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address / Residence / Notes
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Block C, Flat 12"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
