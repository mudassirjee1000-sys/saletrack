import React, { useState } from "react";
import { Customer, ShopSettings, Sale, CustomerPayment } from "../types";
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
  MessageSquare,
  Printer,
  Edit2,
  ShieldAlert,
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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [viewLedgerCustomer, setViewLedgerCustomer] = useState<Customer | null>(null);

  // Customer form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [formError, setFormError] = useState("");

  // Payment form state
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("Cash installment");
  const [payError, setPayError] = useState("");

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setAddress("");
    setCreditLimit("");
    setFormError("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone === "N/A" ? "" : customer.phone);
    setAddress(customer.address || "");
    setCreditLimit(customer.creditLimit ? customer.creditLimit.toString() : "");
    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    const limitVal = creditLimit.trim() ? parseFloat(creditLimit) : undefined;

    const newCust: Customer = {
      id: editingCustomer ? editingCustomer.id : "cust-" + Date.now(),
      name: name.trim(),
      phone: phone.trim() || "N/A",
      address: address.trim() || undefined,
      creditLimit: limitVal && limitVal > 0 ? limitVal : undefined,
      totalCredit: editingCustomer ? editingCustomer.totalCredit : 0,
      totalPaid: editingCustomer ? editingCustomer.totalPaid : 0,
      remaining: editingCustomer ? editingCustomer.remaining : 0,
      payments: editingCustomer ? editingCustomer.payments : [],
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    onSaveCustomer(newCust);
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

  const handleSendWhatsAppReminder = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const msg = `Assalamu Alaikum / Dear ${customer.name},\n\nThis is a friendly reminder from *${
      settings.shopName
    }*.\nYour current outstanding balance is *${settings.currency}${customer.remaining.toFixed(
      2
    )}*.\n\nPlease clear your balance at your earliest convenience.\nThank you for your business!`;

    if (cleanPhone.length >= 7) {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    } else {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(msg);
        alert("Reminder message copied to clipboard! (Customer phone number was not formatted for direct WhatsApp)");
      }
    }
  };

  const handlePrintStatement = () => {
    window.print();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Customers & Credit Ledger</h2>
          <p className="text-xs text-slate-400">
            Total Outstanding Balance Owed:{" "}
            <strong className="text-rose-600 font-bold">
              {settings.currency}
              {totalOutstandingCredit.toFixed(2)}
            </strong>
          </p>
        </div>

        <button
          id="add-customer-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
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

      {/* Customers List / Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700">No customer records found.</p>
          <p className="mt-1">Add regular customers to keep track of their credit and payments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((cust) => {
            const hasDebt = cust.remaining > 0;
            const isNearLimit =
              cust.creditLimit && cust.creditLimit > 0 && cust.remaining >= cust.creditLimit * 0.9;

            return (
              <div
                key={cust.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition hover:border-slate-300 flex flex-col justify-between"
              >
                {/* Header: Name, Phone & Status */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">{cust.name}</h3>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="text-slate-400 hover:text-blue-600 p-1 rounded"
                          title="Edit customer details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.address && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {cust.address}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="text-right">
                      {hasDebt ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Due: {settings.currency}
                          {cust.remaining.toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Cleared
                        </span>
                      )}
                      {cust.creditLimit && cust.creditLimit > 0 && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          Limit: {settings.currency}
                          {cust.creditLimit.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isNearLimit && (
                    <div className="mt-2 p-1.5 rounded-lg bg-amber-50 text-amber-800 text-[11px] flex items-center gap-1.5 border border-amber-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Credit limit almost reached!</span>
                    </div>
                  )}

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
                      <span className="font-semibold text-emerald-600">
                        {settings.currency}
                        {cust.totalPaid.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Remaining</span>
                      <span
                        className={`font-bold ${hasDebt ? "text-rose-600" : "text-emerald-700"}`}
                      >
                        {settings.currency}
                        {cust.remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setViewLedgerCustomer(cust)}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium py-1 px-2 rounded-md hover:bg-slate-100 transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Statement</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {hasDebt && (
                      <button
                        onClick={() => handleSendWhatsAppReminder(cust)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-emerald-200 flex items-center gap-1 text-[11px] font-semibold"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPaymentCustomer(cust);
                        setPayAmount(cust.remaining > 0 ? cust.remaining.toString() : "");
                        setPayError("");
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs active:scale-95 transition"
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
                <h4 className="font-bold text-slate-800 text-sm">Record Debt Payment</h4>
                <p className="text-xs text-slate-400">
                  {paymentCustomer.name} • Remaining: {settings.currency}
                  {paymentCustomer.remaining.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium">
                {payError}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received ({settings.currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 text-sm"
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
                  placeholder="e.g. Cash, JazzCash, EasyPaisa, Bank"
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
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement / Ledger Modal */}
      {viewLedgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800 text-base">
                  Statement of Account: {viewLedgerCustomer.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {viewLedgerCustomer.phone} • {viewLedgerCustomer.address || "No address on file"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStatement}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1"
                  title="Print Statement"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setViewLedgerCustomer(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Balances Banner */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Total Purchases
                </span>
                <span className="font-bold text-slate-700 text-sm">
                  {settings.currency}
                  {viewLedgerCustomer.totalCredit.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Total Paid
                </span>
                <span className="font-bold text-emerald-600 text-sm">
                  {settings.currency}
                  {viewLedgerCustomer.totalPaid.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Balance Due
                </span>
                <span className="font-extrabold text-rose-600 text-sm">
                  {settings.currency}
                  {viewLedgerCustomer.remaining.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Transactions History */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Payments History List */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recorded Payments ({viewLedgerCustomer.payments?.length || 0})
                </h5>
                {!viewLedgerCustomer.payments || viewLedgerCustomer.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">No payment entries yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {viewLedgerCustomer.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {p.note || "Payment received"}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {p.date ? p.date.slice(0, 10) : ""}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-600 text-sm">
                          +{settings.currency}
                          {p.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Invoices */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Purchases / Invoices
                </h5>
                {sales.filter((s) => s.customerId === viewLedgerCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">No sales assigned.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {sales
                      .filter((s) => s.customerId === viewLedgerCustomer.id)
                      .map((sale) => (
                        <div
                          key={sale.id}
                          className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50"
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
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewLedgerCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">
                {editingCustomer ? "Edit Customer Profile" : "Add Customer Profile"}
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
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
                  Phone Number (Include country code for WhatsApp, e.g. 923001234567)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 923001234567"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credit Limit ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="e.g. 5000 (Optional max allowed debt)"
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
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  {editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
