import React from "react";
import { Product, Sale, Expense, Customer, ShopSettings, ActiveTab, SaleReturn } from "../types";
import { calculateAccountingMetrics } from "../utils/calculations";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Receipt,
  ShoppingCart,
  PlusCircle,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  Plus,
} from "lucide-react";

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  saleReturns?: SaleReturn[];
  expenses: Expense[];
  customers: Customer[];
  settings: ShopSettings;
  setActiveTab?: (tab: ActiveTab) => void;
  onQuickSale?: () => void;
  onAddProduct?: () => void;
  onAddExpense?: () => void;
  onOpenAI?: () => void;
  onViewInvoice: (sale: Sale) => void;
  onQuickAddProduct?: () => void;
  onQuickAddExpense?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  sales,
  saleReturns = [],
  expenses,
  customers,
  settings,
  setActiveTab = (_tab: ActiveTab) => {},
  onQuickSale,
  onAddProduct,
  onAddExpense,
  onOpenAI = () => {},
  onViewInvoice,
  onQuickAddProduct,
  onQuickAddExpense,
}) => {
  const safeSales = sales || [];
  const safeSaleReturns = saleReturns || [];
  const safeProducts = products || [];
  const safeExpenses = expenses || [];
  const safeCustomers = customers || [];
  const currency = settings?.currency || "$";

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter today's records
  const todaySalesList = safeSales.filter((s) => s && s.date && s.date.startsWith(todayStr));
  const todayReturnsList = safeSaleReturns.filter((r) => r && r.date && r.date.startsWith(todayStr));
  const todayExpensesList = safeExpenses.filter((e) => e && e.date && e.date.startsWith(todayStr));

  // Accounting accuracy with returns, refunded revenue, and COGS adjustment
  const todayMetrics = calculateAccountingMetrics(todaySalesList, todayExpensesList, todayReturnsList);
  const todaySalesAmount = todayMetrics.totalSales; // Net sales revenue
  const todayGrossSales = todayMetrics.grossSales;
  const todayRefunds = todayMetrics.totalRefunds;
  const todayGrossProfit = todayMetrics.grossProfit;
  const todayExpensesAmount = todayMetrics.operatingExpenses;
  const todayNetProfit = todayMetrics.netProfit;

  // Products and Low stock
  const totalProducts = safeProducts.length;
  const lowStockProducts = safeProducts.filter((p) => p && typeof p.stock === "number" && p.stock <= (p.minStock ?? 0));

  // Total Customer Credit / Debt
  const totalCustomerCredit = safeCustomers.reduce((sum, c) => sum + (c.remaining || 0), 0);

  // Recent 6 sales
  const recentSales = safeSales.slice(0, 6);

  // Handlers
  const handleMakeSale = onQuickSale || (() => setActiveTab("sales"));
  const handleAddProduct = onAddProduct || onQuickAddProduct || (() => setActiveTab("products"));
  const handleAddExpense = onAddExpense || onQuickAddExpense || (() => setActiveTab("expenses"));

  // Dynamic profit bar calculation
  const profitMarginRatio =
    todaySalesAmount > 0
      ? Math.min(100, Math.max(5, Math.round((todayNetProfit / todaySalesAmount) * 100)))
      : todayNetProfit > 0
      ? 50
      : 0;

  // AI summary snippet
  const aiSnippet =
    todaySalesAmount > 0 || todayGrossSales > 0
      ? `Today's net revenue is ${currency}${todaySalesAmount.toFixed(
          2
        )}${todayRefunds > 0 ? ` (after ${currency}${todayRefunds.toFixed(2)} in refunds)` : ""} with ${todaySalesList.length} transaction(s). ${
          lowStockProducts.length > 0
            ? `${lowStockProducts.length} items need restock.`
            : "Inventory levels are healthy."
        }`
      : `No sales recorded yet today. Inventory has ${totalProducts} products ready.`;


  return (
    <div className="space-y-5 pb-6">
      {/* SaleTrack Banner & Primary Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  SaleTrack
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                  SaleTrack — Sales, Stock & Profit Made Simple
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Currency:</span>
            <button
              type="button"
              id="dashboard-currency-indicator"
              onClick={() => setActiveTab("settings")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition border border-slate-200"
              title="Click to change currency in Settings"
            >
              <span>{settings.currencyCode || "USD"}</span>
              <span className="text-blue-600 font-extrabold">{settings.currency}</span>
            </button>
          </div>
        </div>

        {/* 3 Important Actions Highly Visible */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <button
            id="main-action-add-sale"
            onClick={handleMakeSale}
            className="flex items-center justify-center gap-3 p-3.5 sm:p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm transition active:scale-98 cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5 shrink-0" />
            <span>Add Sale</span>
          </button>

          <button
            id="main-action-add-product"
            onClick={handleAddProduct}
            className="flex items-center justify-center gap-3 p-3.5 sm:p-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-bold text-sm sm:text-base shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Package className="w-5 h-5 shrink-0 text-blue-600" />
            <span>Add Product</span>
          </button>

          <button
            id="main-action-add-expense"
            onClick={handleAddExpense}
            className="flex items-center justify-center gap-3 p-3.5 sm:p-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-bold text-sm sm:text-base shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Receipt className="w-5 h-5 shrink-0 text-blue-600" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Today's Sales
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {settings.currency}
                {todaySalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-xs font-bold border border-green-200">
              {todaySalesList.length} sales
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>
              Gross profit: {settings.currency}
              {todayGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {todayRefunds > 0 && (
              <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                -{settings.currency}{todayRefunds.toFixed(2)} ref.
              </span>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
            Expenses
          </p>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {settings.currency}
            {todayExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {todayExpensesList.length} item{todayExpensesList.length === 1 ? "" : "s"} recorded
          </p>
        </div>

        {/* Daily Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
            Daily Profit
          </p>
          <h3
            className={`text-xl sm:text-2xl font-extrabold mt-1 ${
              todayNetProfit >= 0 ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {todayNetProfit >= 0 ? "+" : ""}
            {settings.currency}
            {todayNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
            <div
              className={`h-1.5 rounded-full ${
                todayNetProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${profitMarginRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setActiveTab("products")}
          className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition shadow-xs ${
            lowStockProducts.length > 0
              ? "bg-red-50/70 border-red-200 hover:border-red-300"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-tight ${
              lowStockProducts.length > 0 ? "text-red-600" : "text-slate-500"
            }`}
          >
            Low Stock Alert
          </p>
          <h3
            className={`text-xl sm:text-2xl font-extrabold mt-1 ${
              lowStockProducts.length > 0 ? "text-red-700" : "text-slate-900"
            }`}
          >
            {lowStockProducts.length} items
          </h3>
          <p
            className={`text-xs mt-2 font-semibold ${
              lowStockProducts.length > 0 ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {lowStockProducts.length > 0 ? "Action Required" : "Stock Healthy"}
          </p>
        </div>
      </div>

      {/* Secondary Row: Quick Actions Bar & Customer Credit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions strip */}
        <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-xs uppercase tracking-tight text-slate-400">
              Quick Shop Actions
            </h4>
            <span className="text-[11px] text-slate-400">One-click operations</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              id="quick-action-sale"
              onClick={handleMakeSale}
              className="flex items-center space-x-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition text-left"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-blue-600" />
              <span className="truncate">Add Sale</span>
            </button>
            <button
              id="quick-action-product"
              onClick={handleAddProduct}
              className="flex items-center space-x-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition text-left"
            >
              <Package className="w-4 h-4 shrink-0 text-slate-600" />
              <span className="truncate">Add Product</span>
            </button>
            <button
              id="quick-action-expense"
              onClick={handleAddExpense}
              className="flex items-center space-x-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition text-left"
            >
              <Receipt className="w-4 h-4 shrink-0 text-slate-600" />
              <span className="truncate">Add Expense</span>
            </button>
            <button
              id="quick-action-customer"
              onClick={() => setActiveTab("customers")}
              className="flex items-center space-x-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition text-left"
            >
              <Users className="w-4 h-4 shrink-0 text-slate-600" />
              <span className="truncate">Customer Debt</span>
            </button>
          </div>
        </div>

        {/* Customer Credit Summary Card */}
        <div
          onClick={() => setActiveTab("customers")}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                Customer Debt
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Unpaid balance</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {settings.currency}
              {totalCustomerCredit.toFixed(2)}
            </h3>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>
              {customers.filter((c) => c.remaining > 0).length} customer(s) owe balance
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Sales (2 cols) & Secondary Column: Low Stock + AI (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-700">Recent Sales</h4>
              <p className="text-xs text-slate-400">Latest completed shop transactions</p>
            </div>
            <button
              onClick={() => setActiveTab("sales")}
              className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                No sales recorded yet. Click "New Sale" to record your first transaction.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-xs">
                    <th className="px-5 py-3 font-medium">Product / Order</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-3 py-3 font-medium text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => {
                    const items = sale.items || [];
                    const firstItem = items[0];
                    const summaryName =
                      items.length === 1
                        ? firstItem?.productName || "Product"
                        : items.length > 1
                        ? `${firstItem?.productName || "Product"} +${items.length - 1} more`
                        : "General Sale";
                    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);


                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-700 text-xs">
                          <div>{summaryName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sale.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs truncate max-w-[120px]">
                          {sale.customerName}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600 text-xs font-semibold">
                          {totalQty}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-800 text-xs">
                          {sale.refundedAmount && sale.refundedAmount > 0 ? (
                            <div>
                              <span className="text-slate-900 block">
                                {settings.currency}
                                {Math.max(0, sale.total - sale.refundedAmount).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                {settings.currency}{sale.total.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span>
                              {settings.currency}
                              {sale.total.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {sale.status === "refunded" ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full uppercase font-bold tracking-wider">
                              Refunded
                            </span>
                          ) : sale.status === "partially_refunded" ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full uppercase font-bold tracking-wider">
                              Part. Refund
                            </span>
                          ) : sale.paymentType === "cash" ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase font-bold tracking-wider">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full uppercase font-bold tracking-wider">
                              Credit
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <button
                            onClick={() => onViewInvoice(sale)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Print / View Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Secondary Column: Stock Monitor & AI Assistant */}
        <div className="flex flex-col space-y-6">
          {/* Stock Monitor */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-700">Stock Monitor</h4>
              <button
                onClick={() => setActiveTab("products")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View Inventory
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                <span className="text-emerald-600 font-semibold block mb-1">
                  ✓ All stock levels are sufficient
                </span>
                Total products: {totalProducts}
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium truncate max-w-[160px]">
                      {p.name}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        p.stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Qty: {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Business Assistant Card */}
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">SaleTrack AI Advisor</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mb-4">{aiSnippet}</p>
              <div className="space-y-2">
                <button
                  onClick={onOpenAI}
                  className="w-full py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left px-3 transition-colors"
                >
                  • How to improve daily profit?
                </button>
                <button
                  onClick={onOpenAI}
                  className="w-full py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left px-3 transition-colors"
                >
                  • Analyze inventory & fast sellers
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={onOpenAI}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-98"
              >
                Open AI Advisor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

