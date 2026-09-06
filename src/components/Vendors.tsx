import React, { useState } from "react";
import { Vendor, VendorPurchase, VendorPayment, Product, ShopSettings } from "../types";
import {
  Building2,
  Plus,
  Search,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  Calendar,
  X,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

interface VendorsProps {
  vendors: Vendor[];
  vendorPurchases: VendorPurchase[];
  vendorPayments: VendorPayment[];
  products: Product[];
  settings: ShopSettings;
  onSaveVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  onRecordPurchase: (purchase: VendorPurchase, updatedStock?: { productId: string; quantity: number }[]) => void;
  onRecordPayment: (payment: VendorPayment) => void;
}

export const Vendors: React.FC<VendorsProps> = ({
  vendors,
  vendorPurchases,
  vendorPayments,
  products,
  settings,
  onSaveVendor,
  onDeleteVendor,
  onRecordPurchase,
  onRecordPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form states - Vendor
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    paymentTerms: "Net 15 Days",
    notes: "",
  });

  // Form states - Purchase
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: "",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    items: [{ productId: "", productName: "", quantity: 1, purchasePrice: 0, total: 0 }],
    paidAmount: 0,
    notes: "",
  });

  // Form states - Payment
  const [paymentForm, setPaymentForm] = useState({
    vendorId: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash" as const,
    reference: "",
  });

  const currency = settings.currency || "$";

  // Filtered vendors
  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.includes(searchTerm)
  );

  // Financial summary
  const totalPayables = vendors.reduce((acc, v) => acc + (v.remainingBalance || 0), 0);
  const totalPurchasesAmount = vendorPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalPaidToVendors = vendorPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleOpenAddVendor = (v?: Vendor) => {
    if (v) {
      setVendorForm(v);
    } else {
      setVendorForm({
        name: "",
        companyName: "",
        phone: "",
        email: "",
        address: "",
        paymentTerms: "Net 15 Days",
        notes: "",
      });
    }
    setIsAddVendorOpen(true);
  };

  const handleSaveVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name?.trim()) return;

    const newVendor: Vendor = {
      id: vendorForm.id || `vend-${Date.now()}`,
      name: vendorForm.name.trim(),
      companyName: vendorForm.companyName?.trim() || "",
      phone: vendorForm.phone?.trim() || "",
      email: vendorForm.email?.trim(),
      address: vendorForm.address?.trim(),
      openingBalance: vendorForm.openingBalance || 0,
      paymentTerms: vendorForm.paymentTerms || "Net 15 Days",
      notes: vendorForm.notes?.trim(),
      totalPurchased: vendorForm.totalPurchased || 0,
      totalPaid: vendorForm.totalPaid || 0,
      remainingBalance: vendorForm.remainingBalance || 0,
      lastPaymentDate: vendorForm.lastPaymentDate,
      createdAt: vendorForm.createdAt || new Date().toISOString(),
    };

    onSaveVendor(newVendor);
    setIsAddVendorOpen(false);
    if (selectedVendor?.id === newVendor.id) {
      setSelectedVendor(newVendor);
    }
  };

  const handleOpenPurchaseModal = (vendorId?: string) => {
    const targetVendorId = vendorId || vendors[0]?.id || "";
    setPurchaseForm({
      vendorId: targetVendorId,
      date: new Date().toISOString().slice(0, 10),
      invoiceNumber: `PUR-${Date.now().toString().slice(-6)}`,
      items: [{ productId: "", productName: "", quantity: 1, purchasePrice: 0, total: 0 }],
      paidAmount: 0,
      notes: "",
    });
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseItemChange = (index: number, field: string, val: any) => {
    const newItems = [...purchaseForm.items];
    const item = { ...newItems[index], [field]: val };

    if (field === "productId") {
      const prod = products.find((p) => p.id === val);
      if (prod) {
        item.productName = prod.name;
        item.purchasePrice = prod.purchasePrice;
        item.total = prod.purchasePrice * item.quantity;
      }
    } else if (field === "quantity" || field === "purchasePrice") {
      const qty = field === "quantity" ? Number(val) : item.quantity;
      const price = field === "purchasePrice" ? Number(val) : item.purchasePrice;
      item.total = Math.round(qty * price * 100) / 100;
    }

    newItems[index] = item;
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const addPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [
        ...purchaseForm.items,
        { productId: "", productName: "", quantity: 1, purchasePrice: 0, total: 0 },
      ],
    });
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseForm.items.length <= 1) return;
    setPurchaseForm({
      ...purchaseForm,
      items: purchaseForm.items.filter((_, i) => i !== index),
    });
  };

  const handleSavePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === purchaseForm.vendorId);
    if (!vendor) return;

    const totalAmount = purchaseForm.items.reduce((sum, it) => sum + (it.total || 0), 0);
    const paidAmount = Math.min(totalAmount, Math.max(0, Number(purchaseForm.paidAmount) || 0));
    const remainingBalance = totalAmount - paidAmount;

    let paymentStatus: "paid" | "partially_paid" | "unpaid" = "unpaid";
    if (paidAmount >= totalAmount) paymentStatus = "paid";
    else if (paidAmount > 0) paymentStatus = "partially_paid";

    const newPurchase: VendorPurchase = {
      id: `vp-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      companyName: vendor.companyName,
      date: purchaseForm.date,
      invoiceNumber: purchaseForm.invoiceNumber,
      items: purchaseForm.items,
      totalAmount,
      paidAmount,
      remainingBalance,
      paymentStatus,
      notes: purchaseForm.notes,
      createdAt: new Date().toISOString(),
    };

    const stockUpdates = purchaseForm.items
      .filter((it) => it.productId)
      .map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 0,
      }));

    onRecordPurchase(newPurchase, stockUpdates);
    setIsPurchaseModalOpen(false);
  };

  const handleOpenPaymentModal = (vendorId?: string) => {
    const targetVendor = vendors.find((v) => v.id === vendorId) || vendors[0];
    setPaymentForm({
      vendorId: targetVendor?.id || "",
      amount: targetVendor?.remainingBalance || 0,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      reference: "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === paymentForm.vendorId);
    if (!vendor || paymentForm.amount <= 0) return;

    const newPayment: VendorPayment = {
      id: `vpay-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference || undefined,
      createdAt: new Date().toISOString(),
    };

    onRecordPayment(newPayment);
    setIsPaymentModalOpen(false);
  };

  const purchasesForSelected = selectedVendor
    ? vendorPurchases.filter((p) => p.vendorId === selectedVendor.id)
    : [];
  const paymentsForSelected = selectedVendor
    ? vendorPayments.filter((p) => p.vendorId === selectedVendor.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Payables (You Owe)
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700">
              {currency}
              {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending vendor settlements</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sourced / Invoiced
            </span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">
              {currency}
              {totalPurchasesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{vendorPurchases.length} recorded purchases</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Paid to Suppliers
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {currency}
              {totalPaidToVendors.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{vendorPayments.length} payments disbursed</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by name, company, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPurchaseModal()}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            <span>Record Stock Purchase</span>
          </button>
          <button
            onClick={() => handleOpenAddVendor()}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Main Vendor Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Vendors Directory</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              {filteredVendors.length} Suppliers
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredVendors.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No suppliers found.</p>
              </div>
            ) : (
              filteredVendors.map((vendor) => {
                const isSelected = selectedVendor?.id === vendor.id;
                return (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {vendor.companyName || vendor.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Contact: {vendor.name} • {vendor.phone || "No phone"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div
                          className={`text-xs font-bold ${
                            vendor.remainingBalance > 0 ? "text-amber-700" : "text-emerald-700"
                          }`}
                        >
                          {currency}
                          {vendor.remainingBalance.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {vendor.remainingBalance > 0 ? "Due" : "Settled"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Vendor Details & Statement Pane */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVendor ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedVendor.companyName || selectedVendor.name}
                    </h2>
                    <span
                      className={`text-xs px-2 py-0.5 font-bold rounded-full ${
                        selectedVendor.remainingBalance > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {selectedVendor.remainingBalance > 0
                        ? `Balance Due: ${currency}${selectedVendor.remainingBalance.toFixed(2)}`
                        : "All Settled"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVendor.phone || "N/A"}
                    </span>
                    {selectedVendor.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedVendor.email}
                      </span>
                    )}
                    {selectedVendor.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedVendor.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPaymentModal(selectedVendor.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Pay Supplier
                  </button>
                  <button
                    onClick={() => handleOpenPurchaseModal(selectedVendor.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    + Purchase
                  </button>
                  <button
                    onClick={() => handleOpenAddVendor(selectedVendor)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Purchase History for this Vendor */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>Purchases from this Supplier</span>
                </h4>
                {purchasesForSelected.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No purchase records found for this vendor.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Invoice #</th>
                          <th className="p-3">Items</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 text-right">Paid</th>
                          <th className="p-3 text-right">Balance</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchasesForSelected.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-medium text-slate-700">{purchase.date}</td>
                            <td className="p-3 font-mono text-slate-600">{purchase.invoiceNumber}</td>
                            <td className="p-3 text-slate-600">
                              {purchase.items?.map((it) => `${it.productName} (x${it.quantity})`).join(", ")}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {currency}{purchase.totalAmount.toFixed(2)}
                            </td>
                            <td className="p-3 text-right text-emerald-600">
                              {currency}{purchase.paidAmount.toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-bold text-amber-700">
                              {currency}{purchase.remainingBalance.toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  purchase.paymentStatus === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : purchase.paymentStatus === "partially_paid"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {purchase.paymentStatus.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payments History for this Vendor */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Payments Disbursed to Supplier</span>
                </h4>
                {paymentsForSelected.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No disbursement history recorded yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Reference</th>
                          <th className="p-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentsForSelected.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-medium text-slate-700">{pay.date}</td>
                            <td className="p-3 uppercase font-medium text-slate-600">{pay.paymentMethod}</td>
                            <td className="p-3 font-mono text-slate-500">{pay.reference || "—"}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              {currency}{pay.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
              <h3 className="text-base font-bold text-slate-700">Select a Supplier</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Choose a supplier from the list on the left to view their detailed purchase ledger, payments history, and balances.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit Vendor */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {vendorForm.id ? "Edit Supplier Details" : "Add New Supplier"}
              </h3>
              <button
                onClick={() => setIsAddVendorOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendorSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., John Smith"
                  value={vendorForm.name || ""}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Depot Name</label>
                <input
                  type="text"
                  placeholder="e.g., Metro Wholesale Distributors"
                  value={vendorForm.companyName || ""}
                  onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 555-0199"
                    value={vendorForm.phone || ""}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="e.g., Net 15 Days"
                    value={vendorForm.paymentTerms || ""}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={vendorForm.email || ""}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Depot</label>
                <input
                  type="text"
                  placeholder="Market Street, Block 4"
                  value={vendorForm.address || ""}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Stock Purchase */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Stock Purchase from Supplier</h3>
                <p className="text-xs text-slate-500">Automatically adds stock to inventory and updates payable debt.</p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={purchaseForm.vendorId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.companyName || v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invoice / Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. PUR-001"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Purchased Items</label>
                  <button
                    type="button"
                    onClick={addPurchaseItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {purchaseForm.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      {/* Link to existing product or custom */}
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Item Name (or select below)"
                          value={it.productName}
                          onChange={(e) => handlePurchaseItemChange(idx, "productName", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs mb-1"
                          required
                        />
                        <select
                          value={it.productId || ""}
                          onChange={(e) => handlePurchaseItemChange(idx, "productId", e.target.value)}
                          className="w-full px-2 py-0.5 border border-slate-200 rounded text-[11px] text-slate-600"
                        >
                          <option value="">-- Link to catalog product to restock --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Cur Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <label className="text-[10px] text-slate-500 font-semibold">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handlePurchaseItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          required
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] text-slate-500 font-semibold">Unit Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.purchasePrice}
                          onChange={(e) => handlePurchaseItemChange(idx, "purchasePrice", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          required
                        />
                      </div>

                      <div className="w-20 text-right pr-2">
                        <span className="text-[10px] text-slate-500 block font-semibold">Total</span>
                        <span className="font-bold text-slate-800 text-xs">{currency}{it.total.toFixed(2)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePurchaseItem(idx)}
                        disabled={purchaseForm.items.length <= 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-20 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total and Initial Payment */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid Now (Cash / Transfer)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseForm.paidAmount}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paidAmount: Number(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="text-right flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-semibold">Grand Total Purchase</span>
                  <span className="text-xl font-bold text-slate-900">
                    {currency}
                    {purchaseForm.items.reduce((s, it) => s + (it.total || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs"
                >
                  Confirm Purchase & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Supplier Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pay Supplier / Settle Debt</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  required
                  value={paymentForm.vendorId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.companyName || v.name} — Balance: {currency}{v.remainingBalance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={paymentForm.amount || ""}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #49281 or Bank Ref"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
