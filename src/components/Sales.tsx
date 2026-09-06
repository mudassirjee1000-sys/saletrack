import React, { useState } from "react";
import { Product, Sale, SaleItem, Customer, ShopSettings, SaleReturn } from "../types";
import { SaleReturnModal } from "./SaleReturnModal";
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Search,
  FileText,
  AlertCircle,
  PlusCircle,
  Receipt,
  X,
  Barcode,
  RotateCcw,
  DollarSign,
  Percent,
  Check,
  Package,
} from "lucide-react";

interface SalesProps {
  products: Product[];
  sales: Sale[];
  saleReturns?: SaleReturn[];
  customers: Customer[];
  settings: ShopSettings;
  onRecordSale: (sale: Sale) => void;
  onViewInvoice: (sale: Sale) => void;
  onSaveCustomer: (customer: Customer) => void;
  onProcessReturn?: (
    saleReturn: SaleReturn,
    options: {
      restock: boolean;
      refundMethod: "cash" | "bank" | "card" | "credit_adjustment" | "other";
    }
  ) => void;
}

export const Sales: React.FC<SalesProps> = ({
  products,
  sales,
  saleReturns = [],
  customers,
  settings,
  onRecordSale,
  onViewInvoice,
  onSaveCustomer,
  onProcessReturn,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"pos" | "history" | "returns">("pos");

  // POS State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [productSearch, setProductSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeMessage, setBarcodeMessage] = useState<string>("");

  // Discount & Tax
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [applyTax, setApplyTax] = useState<boolean>(Boolean(settings.taxEnabled));

  // Customer & Payment State
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customCustomerName, setCustomCustomerName] = useState<string>("");
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>("");
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState<boolean>(false);
  const [saleError, setSaleError] = useState<string>("");

  // Sales History Filter
  const [historySearch, setHistorySearch] = useState("");

  // Return Modal State
  const [returnTargetSale, setReturnTargetSale] = useState<Sale | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Filter products for dropdown / picker
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Quick Barcode Scanning Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const matchedProduct = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        p.sku.toLowerCase() === query.toLowerCase()
    );

    if (!matchedProduct) {
      setBarcodeMessage(`No product found matching barcode "${query}"`);
      setTimeout(() => setBarcodeMessage(""), 3500);
      setBarcodeInput("");
      return;
    }

    // Add 1 qty of matched product to cart
    addProductToCart(matchedProduct, 1);
    setBarcodeMessage(`Added 1x ${matchedProduct.name}`);
    setTimeout(() => setBarcodeMessage(""), 2500);
    setBarcodeInput("");
  };

  const addProductToCart = (prod: Product, qty: number) => {
    setSaleError("");
    const existingInCart = cart.find((item) => item.productId === prod.id);
    const totalDemandedQty = (existingInCart ? existingInCart.quantity : 0) + qty;

    if (!settings.allowNegativeStock && totalDemandedQty > prod.stock) {
      setSaleError(
        `Insufficient stock for ${prod.name}. Available: ${prod.stock}, In Cart: ${
          existingInCart ? existingInCart.quantity : 0
        }`
      );
      return;
    }

    const lineTotal = prod.sellingPrice * qty;
    const lineProfit = (prod.sellingPrice - prod.purchasePrice) * qty;

    if (existingInCart) {
      setCart(
        cart.map((item) =>
          item.productId === prod.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                total: item.total + lineTotal,
                profit: item.profit + lineProfit,
              }
            : item
        )
      );
    } else {
      const newItem: SaleItem = {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        quantity: qty,
        total: lineTotal,
        profit: lineProfit,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      setSaleError("Please select a valid product first.");
      return;
    }
    if (itemQty <= 0) {
      setSaleError("Quantity must be greater than zero.");
      return;
    }

    addProductToCart(selectedProduct, itemQty);
    setSelectedProductId("");
    setItemQty(1);
    setProductSearch("");
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!settings.allowNegativeStock && prod && newQty > prod.stock) {
      setSaleError(`Cannot exceed available stock of ${prod.stock} units for ${prod.name}.`);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const total = item.sellingPrice * newQty;
          const profit = (item.sellingPrice - item.purchasePrice) * newQty;
          return { ...item, quantity: newQty, total, profit };
        }
        return item;
      })
    );
  };

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);

  // Discount Calculation
  let calculatedDiscount = 0;
  if (discountAmount > 0) {
    if (discountType === "percent") {
      calculatedDiscount = (subtotal * Math.min(100, discountAmount)) / 100;
    } else {
      calculatedDiscount = Math.min(subtotal, discountAmount);
    }
  }

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const taxRate = applyTax && settings.taxRate ? settings.taxRate : 0;
  const calculatedTax = applyTax ? (taxableAmount * taxRate) / 100 : 0;
  const grandTotal = Math.max(0, taxableAmount + calculatedTax);

  // Quick Customer Creation
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCustomerName.trim()) return;

    const newCust: Customer = {
      id: "cust-" + Date.now(),
      name: customCustomerName.trim(),
      phone: customCustomerPhone.trim() || "N/A",
      totalCredit: 0,
      totalPaid: 0,
      remaining: 0,
      payments: [],
      createdAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsQuickAddCustomerOpen(false);
    setCustomCustomerName("");
    setCustomCustomerPhone("");
  };

  // Complete & Save Sale
  const handleCompleteSale = () => {
    setSaleError("");

    if (cart.length === 0) {
      setSaleError("Your cart is empty. Add at least one product.");
      return;
    }

    // If credit, customer is strictly required
    if (paymentType === "credit" && !selectedCustomerId) {
      setSaleError("A customer must be selected for credit sales so their balance can be tracked.");
      return;
    }

    const customerObj = customers.find((c) => c.id === selectedCustomerId);
    const customerName =
      customerObj?.name || (paymentType === "cash" ? "Walk-in Customer" : "Credit Customer");
    const customerPhone = customerObj?.phone;

    // Check Credit Limit Warning
    if (paymentType === "credit" && customerObj?.creditLimit && customerObj.creditLimit > 0) {
      const projectedBalance = (customerObj.remaining || 0) + grandTotal;
      if (projectedBalance > customerObj.creditLimit) {
        const proceed = window.confirm(
          `Warning: Customer credit limit is ${settings.currency}${customerObj.creditLimit.toFixed(
            2
          )}. This sale will raise their balance to ${settings.currency}${projectedBalance.toFixed(
            2
          )}. Do you still want to approve this sale?`
        );
        if (!proceed) return;
      }
    }

    const now = new Date();
    const dateFormatted = `${now.toISOString().slice(0, 10)} ${now
      .toTimeString()
      .slice(0, 5)}`;
    const invoiceNum = `INV-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${(
      sales.length + 1
    )
      .toString()
      .padStart(3, "0")}`;

    const newSale: Sale = {
      id: "sale-" + Date.now(),
      invoiceNumber: invoiceNum,
      date: dateFormatted,
      customerId: selectedCustomerId || undefined,
      customerName,
      customerPhone,
      paymentType,
      items: [...cart],
      subtotal,
      discount: calculatedDiscount,
      tax: calculatedTax,
      taxRate: applyTax ? taxRate : 0,
      taxName: settings.taxName || "Tax",
      total: grandTotal,
      profit: totalProfit - calculatedDiscount,
      paid: paymentType === "cash" ? grandTotal : 0,
      refundedAmount: 0,
      status: paymentType === "cash" ? "completed" : "unpaid",
    };

    onRecordSale(newSale);

    // Reset state & show invoice
    setCart([]);
    setSelectedCustomerId("");
    setPaymentType("cash");
    setDiscountAmount(0);
    onViewInvoice(newSale);
  };

  // History filtered
  const filteredSales = sales.filter((s) => {
    const q = historySearch.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Sub tabs: POS vs History vs Returns */}
      <div className="flex flex-wrap items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("pos")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === "pos"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale (POS)</span>
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales History ({sales.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("returns")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === "returns"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns & Refunds ({saleReturns.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === "pos" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Product Selection Area (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barcode Quick Scanner Box */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode or enter SKU & press Enter..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 transition"
                >
                  Scan / Add
                </button>
              </form>
              {barcodeMessage && (
                <p className="mt-2 text-[11px] text-blue-600 font-semibold animate-pulse">
                  {barcodeMessage}
                </p>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Select Product & Quantity
              </h3>

              {saleError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saleError}</span>
                </div>
              )}

              {/* Product Selector / Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Product From Inventory
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name, SKU or barcode..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick product selector list */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No products found. Add products in Inventory first.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductId === p.id;
                      const isOutOfStock = p.stock <= 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setSaleError("");
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? "bg-blue-50 border-l-4 border-blue-600"
                              : "hover:bg-slate-50"
                          } ${isOutOfStock && !settings.allowNegativeStock ? "opacity-50" : ""}`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {p.name}
                              </p>
                              {p.barcode && (
                                <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded font-mono text-slate-500">
                                  {p.barcode}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {p.sku} • Stock: {p.stock} {p.unit || "units"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-slate-800">
                              {settings.currency}
                              {p.sellingPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quantity Picker & Add button */}
              <div className="flex items-end gap-3 pt-2">
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center font-bold text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedProduct}
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add to Cart{" "}
                    {selectedProduct
                      ? `(${settings.currency}${(selectedProduct.sellingPrice * itemQty).toFixed(
                          2
                        )})`
                      : ""}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Active Cart & Checkout (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>Current Cart ({cart.length} items)</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold">Cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select products on the left or scan barcode to add
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-400">
                          {settings.currency}
                          {item.sellingPrice.toFixed(2)} each
                        </p>
                      </div>

                      {/* Qty update buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateCartQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQty(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>

                      {/* Total & Delete */}
                      <div className="text-right pl-3 flex items-center gap-2">
                        <span className="font-bold text-slate-800 w-16 text-right">
                          {settings.currency}
                          {item.total.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Discount & Tax Accordion/Fields */}
              {cart.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Add Discount:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountAmount || ""}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-right font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setDiscountType(discountType === "fixed" ? "percent" : "fixed")}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600"
                      >
                        {discountType === "fixed" ? settings.currency : "%"}
                      </button>
                    </div>
                  </div>

                  {settings.taxRate ? (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyTax}
                          onChange={(e) => setApplyTax(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-700 font-medium">
                          Apply {settings.taxName || "Tax"} ({settings.taxRate}%)
                        </span>
                      </label>
                      {applyTax && (
                        <span className="font-semibold text-slate-700">
                          +{settings.currency}
                          {calculatedTax.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Payment Type Selection */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("cash")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      paymentType === "cash"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cash / Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("credit")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      paymentType === "credit"
                        ? "bg-amber-50 text-amber-800 border-amber-500 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Credit (Debt)</span>
                  </button>
                </div>
              </div>

              {/* Customer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Customer {paymentType === "credit" && <span className="text-red-500">*</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddCustomerOpen(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Add New Customer</span>
                  </button>
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="">
                    {paymentType === "cash"
                      ? "Walk-in Customer (General Cash)"
                      : "-- Select Customer with Debt Account --"}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} - Due: {settings.currency}
                      {c.remaining.toFixed(2)}
                      {c.creditLimit ? ` (Limit: ${settings.currency}${c.creditLimit})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total & Profit Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Items Subtotal:</span>
                  <span>
                    {settings.currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span>
                      -{settings.currency}
                      {calculatedDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                {applyTax && calculatedTax > 0 && (
                  <div className="flex justify-between text-sky-700 font-semibold">
                    <span>{settings.taxName || "Tax"} ({taxRate}%):</span>
                    <span>
                      +{settings.currency}
                      {calculatedTax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-600 font-semibold pt-1 border-t border-slate-200">
                  <span>Estimated Profit:</span>
                  <span>
                    +{settings.currency}
                    {Math.max(0, totalProfit - calculatedDiscount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 font-extrabold text-base pt-2 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span>
                    {settings.currency}
                    {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Save / Complete Sale Button */}
              <button
                id="complete-sale-btn"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Sale & Issue Receipt</span>
              </button>
            </div>
          </div>
        </div>
      ) : activeSubTab === "history" ? (
        /* Sales History Subtab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">All Past Sales History</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search invoice or customer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No sales found</p>
              <p className="mt-1">Completed sales will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const isRefunded = (sale.refundedAmount || 0) >= sale.total;
                const isPartiallyRefunded = (sale.refundedAmount || 0) > 0 && !isRefunded;

                return (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {sale.invoiceNumber}
                        </span>
                        {isRefunded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            Refunded
                          </span>
                        ) : isPartiallyRefunded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Partial Refund
                          </span>
                        ) : sale.paymentType === "cash" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Paid (Cash)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            On Credit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {sale.customerName} • {sale.date}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800 block">
                          {settings.currency}
                          {sale.total.toFixed(2)}
                        </span>
                        {(sale.refundedAmount || 0) > 0 && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            Refunded: {settings.currency}{(sale.refundedAmount || 0).toFixed(2)}
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          +{settings.currency}
                          {sale.profit.toFixed(2)} profit
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onProcessReturn && !isRefunded && (
                          <button
                            onClick={() => setReturnTargetSale(sale)}
                            className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Process Return / Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onViewInvoice(sale)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View & Print Receipt"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Returns & Refunds Subtab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sales Returns & Refunds Log</h3>
              <p className="text-xs text-slate-400">
                Audited history of customer returns and cash/credit refunds
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg">
              {saleReturns.length} Returned Transactions
            </span>
          </div>

          {saleReturns.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No returns processed yet</p>
              <p className="mt-1">
                To process a return, open Sales History and click the Return icon next to any invoice.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {saleReturns.map((ret) => (
                <div key={ret.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-800">
                        Refund for #{ret.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Refund: {ret.refundMethod.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600">
                      -{settings.currency}
                      {ret.refundAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Customer:</span>
                      <span className="font-semibold text-slate-800">{ret.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Reason for return:</span>
                      <span className="text-slate-700">{ret.reason}</span>
                    </div>
                  </div>

                  {/* Returned Items */}
                  <div className="mt-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Returned Items:
                    </span>
                    <div className="space-y-1">
                      {ret.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700">
                          <span>
                            • {it.productName} x{it.quantity}
                          </span>
                          <span className="font-semibold">
                            {settings.currency}
                            {(it.sellingPrice * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sale Return Modal */}
      {returnTargetSale && (
        <SaleReturnModal
          isOpen={Boolean(returnTargetSale)}
          onClose={() => setReturnTargetSale(null)}
          sale={returnTargetSale}
          settings={settings}
          onProcessReturn={(returnRecord, options) => {
            if (onProcessReturn) {
              onProcessReturn(returnRecord, options);
            }
          }}
        />
      )}

      {/* Quick Add Customer Modal */}
      {isQuickAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">Quick Add Customer</h4>
              <button
                onClick={() => setIsQuickAddCustomerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={customCustomerPhone}
                  onChange={(e) => setCustomCustomerPhone(e.target.value)}
                  placeholder="e.g. 555-0199"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
