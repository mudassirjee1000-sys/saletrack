import React, { useState } from "react";
import { Product, Sale, SaleItem, Customer, ShopSettings } from "../types";
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
} from "lucide-react";

interface SalesProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: ShopSettings;
  onRecordSale: (sale: Sale) => void;
  onViewInvoice: (sale: Sale) => void;
  onSaveCustomer: (customer: Customer) => void;
}

export const Sales: React.FC<SalesProps> = ({
  products,
  sales,
  customers,
  settings,
  onRecordSale,
  onViewInvoice,
  onSaveCustomer,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"pos" | "history">("pos");

  // POS State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [productSearch, setProductSearch] = useState("");

  // Customer & Payment State
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customCustomerName, setCustomCustomerName] = useState<string>("");
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>("");
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState<boolean>(false);
  const [saleError, setSaleError] = useState<string>("");

  // Sales History Filter
  const [historySearch, setHistorySearch] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Filter products for dropdown / picker
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Add item to cart
  const handleAddToCart = () => {
    setSaleError("");
    if (!selectedProduct) {
      setSaleError("Please select a product first.");
      return;
    }

    if (itemQty <= 0) {
      setSaleError("Quantity must be at least 1.");
      return;
    }

    // Check existing qty in cart + new qty against stock
    const existingInCart = cart.find((i) => i.productId === selectedProduct.id);
    const totalDemandedQty = (existingInCart ? existingInCart.quantity : 0) + itemQty;

    if (!settings.allowNegativeStock && totalDemandedQty > selectedProduct.stock) {
      setSaleError(
        `Insufficient stock for ${selectedProduct.name}. Available: ${selectedProduct.stock}, In Cart: ${
          existingInCart ? existingInCart.quantity : 0
        }`
      );
      return;
    }

    const lineTotal = selectedProduct.sellingPrice * itemQty;
    const lineProfit = (selectedProduct.sellingPrice - selectedProduct.purchasePrice) * itemQty;

    if (existingInCart) {
      setCart(
        cart.map((item) =>
          item.productId === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + itemQty,
                total: item.total + lineTotal,
                profit: item.profit + lineProfit,
              }
            : item
        )
      );
    } else {
      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        purchasePrice: selectedProduct.purchasePrice,
        sellingPrice: selectedProduct.sellingPrice,
        quantity: itemQty,
        total: lineTotal,
        profit: lineProfit,
      };
      setCart([...cart, newItem]);
    }

    // Reset selection for next item
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
  const grandTotal = subtotal; // Version 1 has no discount complexity

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
      discount: 0,
      total: grandTotal,
      profit: totalProfit,
      paid: paymentType === "cash" ? grandTotal : 0,
    };

    onRecordSale(newSale);

    // Reset state & show invoice
    setCart([]);
    setSelectedCustomerId("");
    setPaymentType("cash");
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
      {/* Sub tabs: POS New Sale vs History */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("pos")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
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
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales History ({sales.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === "pos" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Product Selection Area (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
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
                    placeholder="Search product name or SKU..."
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
                      No products found. Add products in the Products tab first!
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductId === p.id;
                      const isOutOfStock = p.stock <= 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (isOutOfStock && !settings.allowNegativeStock) return;
                            setSelectedProductId(p.id);
                          }}
                          className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition ${
                            isSelected
                              ? "bg-blue-50 border-l-4 border-blue-600"
                              : "hover:bg-slate-50"
                          } ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-800 block">
                              {settings.currency}
                              {p.sellingPrice.toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${
                                p.stock <= p.minStock ? "text-red-500" : "text-slate-400"
                              }`}
                            >
                              {p.stock} in stock
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Product summary & Qty input */}
              {selectedProduct && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase">
                        Selected Product
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">{selectedProduct.name}</h4>
                      <p className="text-xs text-slate-500">
                        Unit Price: {settings.currency}
                        {selectedProduct.sellingPrice.toFixed(2)} | Cost: {settings.currency}
                        {selectedProduct.purchasePrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Available</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {selectedProduct.stock} units
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Line Total Calculation */}
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200/60">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                          className="w-8 h-8 rounded-l-md bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={settings.allowNegativeStock ? 9999 : selectedProduct.stock}
                          value={itemQty}
                          onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-8 text-center text-xs font-bold border-y border-slate-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !settings.allowNegativeStock &&
                              itemQty >= selectedProduct.stock
                            ) {
                              return;
                            }
                            setItemQty(itemQty + 1);
                          }}
                          className="w-8 h-8 rounded-r-md bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Item Total:</span>
                      <span className="text-base font-bold text-slate-800">
                        {settings.currency}
                        {(selectedProduct.sellingPrice * itemQty).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-blue-600 block font-medium">
                        Profit: +{settings.currency}
                        {(
                          (selectedProduct.sellingPrice - selectedProduct.purchasePrice) *
                          itemQty
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    id="add-item-to-sale-btn"
                    onClick={handleAddToCart}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add To Sale Order</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cart & Checkout (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Sale Order Items ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Items in Cart list */}
              {cart.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-400" />
                  No items in this sale yet. Select a product on the left to begin.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-400">
                          {settings.currency}
                          {item.sellingPrice.toFixed(2)} × {item.quantity} ={" "}
                          <strong className="text-slate-700">
                            {settings.currency}
                            {item.total.toFixed(2)}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleUpdateCartQty(item.productId, item.quantity - 1)}
                            className="w-6 h-6 bg-white border border-slate-300 rounded-l text-slate-700 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQty(item.productId, item.quantity + 1)}
                            className="w-6 h-6 bg-white border border-slate-300 rounded-r text-slate-700 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                        ? "bg-green-50 text-green-700 border-green-500 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Cash (Paid)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("credit")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      paymentType === "credit"
                        ? "bg-yellow-50 text-yellow-800 border-yellow-500 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-yellow-600" />
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
                      {c.name} {c.phone ? `(${c.phone})` : ""} - Debt: {settings.currency}
                      {c.remaining.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total & Profit Summary */}
              <div className="p-3.5 bg-slate-50 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Items Total:</span>
                  <span>
                    {settings.currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>Estimated Profit:</span>
                  <span>
                    +{settings.currency}
                    {totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold text-sm pt-2 border-t border-slate-200">
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
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-xs active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Sale & Issue Receipt</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
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
            <div className="p-8 text-center text-slate-400 text-xs">
              No sales records found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {sale.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentType === "cash"
                            ? "bg-green-100 text-green-700 uppercase"
                            : "bg-yellow-100 text-yellow-800 uppercase"
                        }`}
                      >
                        {sale.paymentType.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">Customer: {sale.customerName}</p>
                    <p className="text-slate-400 text-[11px]">
                      {sale.date} • {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-slate-800 block text-sm">
                        {settings.currency}
                        {sale.total.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold">
                        +{settings.currency}
                        {sale.profit.toFixed(2)} profit
                      </span>
                    </div>
                    <button
                      onClick={() => onViewInvoice(sale)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="View & Print Invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
