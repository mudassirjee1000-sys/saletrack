import React, { useState } from "react";
import { Product, Sale, Expense, Customer, ShopSettings, SaleReturn } from "../types";
import { calculateAccountingMetrics, calculateProductPerformance } from "../utils/calculations";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Package,
  RotateCcw,
} from "lucide-react";

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  saleReturns?: SaleReturn[];
  expenses: Expense[];
  customers: Customer[];
  settings: ShopSettings;
}

type DateFilterType = "today" | "week" | "month" | "custom";

export const Reports: React.FC<ReportsProps> = ({
  products,
  sales,
  saleReturns = [],
  expenses,
  customers,
  settings,
}) => {
  const [filterType, setFilterType] = useState<DateFilterType>("month");
  const todayStr = new Date().toISOString().slice(0, 10);
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Compute date range based on filterType
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (filterType === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (filterType === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
  } else if (filterType === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  } else if (filterType === "custom") {
    startDate = new Date(`${customStartDate}T00:00:00`);
    endDate = new Date(`${customEndDate}T23:59:59`);
  }

  // Filter sales within range
  const filteredSales = sales.filter((s) => {
    const sDate = new Date(s.date.replace(" ", "T"));
    return !isNaN(sDate.getTime()) && sDate >= startDate && sDate <= endDate;
  });

  // Filter returns within range
  const filteredReturns = (saleReturns || []).filter((r) => {
    const rDate = new Date(r.date.replace(" ", "T"));
    return !isNaN(rDate.getTime()) && rDate >= startDate && rDate <= endDate;
  });

  // Filter expenses within range
  const filteredExpenses = expenses.filter((e) => {
    if (!e || !e.date) return false;
    const rawDate = e.date.includes("T") ? e.date : `${e.date}T12:00:00`;
    const eDate = new Date(rawDate);
    return !isNaN(eDate.getTime()) && eDate >= startDate && eDate <= endDate;
  });

  // Unified Accounting Metrics
  const accounting = calculateAccountingMetrics(filteredSales, filteredExpenses, filteredReturns);
  const totalGrossSales = accounting.grossSales;
  const totalRefunds = accounting.totalRefunds;
  const netSalesRevenue = accounting.totalSales;
  const totalGrossProfit = accounting.grossProfit;
  const totalExpensesAmount = accounting.operatingExpenses;
  const totalNetProfit = accounting.netProfit;
  const profitMarginPercent = accounting.netMarginPercentage;
  const numberOfSales = filteredSales.length;

  // Outstanding customer credit (all-time active)
  const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.remaining || 0), 0);

  // Current Inventory Valuation
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockCost = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
  const totalStockRetail = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const potentialStockProfit = Math.max(0, totalStockRetail - totalStockCost);

  // Best-selling products performance (with accurate return and refund deductions)
  const bestSellingProducts = calculateProductPerformance(filteredSales, filteredReturns);

  // Expense categories aggregation
  const expenseCatMap: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
  });
  const expenseCategories = Object.entries(expenseCatMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header & Date Filter Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Business Financial Reports & Analytics</span>
            </h2>
            <p className="text-xs text-slate-400">
              Clear insight into true net sales, expenses, net profits, and inventory valuation
            </p>
          </div>

          {/* Quick period buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(["today", "week", "month", "custom"] as const).map((period) => (
              <button
                key={period}
                id={`report-filter-${period}`}
                onClick={() => setFilterType(period)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  filterType === period
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {period === "week" ? "This Week" : period === "month" ? "This Month" : period}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {filterType === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <span className="font-medium text-slate-600">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-400">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Financial Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Net Sales Revenue
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 block">
            {settings.currency}
            {netSalesRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {numberOfSales} sales {totalRefunds > 0 ? `(-${settings.currency}${totalRefunds.toFixed(2)} refunds)` : ""}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Operating Expenses
          </span>
          <span className="text-xl sm:text-2xl font-bold text-rose-600 block">
            {settings.currency}
            {totalExpensesAmount.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredExpenses.length} expense entries
          </span>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Gross Profit (Margin)
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 block">
            {settings.currency}
            {totalGrossProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            Product markup after costs
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Net Business Profit
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold block ${
              totalNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {settings.currency}
            {totalNetProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {profitMarginPercent}% net margin
          </span>
        </div>
      </div>

      {/* Returns & Refunds Reconciliation Banner (Visible when returns exist in period) */}
      {totalRefunds > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Returns & Refunds Reconciliation
              </h4>
            </div>
            <span className="text-xs font-bold text-amber-800">
              Total Refunded: {settings.currency}{totalRefunds.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cash Refunds</span>
              <span className="font-bold text-slate-800">
                {settings.currency}{accounting.cashRefunds.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Card / Bank</span>
              <span className="font-bold text-slate-800">
                {settings.currency}{(accounting.cardRefunds + accounting.bankRefunds).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Credit Deductions</span>
              <span className="font-bold text-slate-800">
                {settings.currency}{accounting.creditAdjustments.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Restocked COGS</span>
              <span className="font-bold text-emerald-700">
                +{settings.currency}{accounting.reversedCogs.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Valuation & Customer Dues Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Inventory Valuation */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Inventory Asset Valuation</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{totalStockUnits} Units in Stock</span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Cost Value</span>
              <span className="font-bold text-slate-700 text-sm">
                {settings.currency}
                {totalStockCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Retail Value</span>
              <span className="font-bold text-blue-600 text-sm">
                {settings.currency}
                {totalStockRetail.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Unrealized Profit</span>
              <span className="font-bold text-emerald-600 text-sm">
                {settings.currency}
                {potentialStockProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Receivables Callout */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-sm">Active Customer Credit</h3>
            </div>
            <span className="text-xs text-rose-600 font-bold">
              {customers.filter((c) => c.remaining > 0).length} debtors
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-lg flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-amber-900">Total Outstanding Receivables</p>
              <p className="text-[11px] text-amber-700">Money owed to your business by customers</p>
            </div>
            <span className="text-lg font-extrabold text-rose-600">
              {settings.currency}
              {totalOutstandingCredit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Top Selling Products</span>
              </h3>
              <span className="text-[11px] text-slate-400">By Quantity Sold</span>
            </div>

            {bestSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No products sold in this period.
              </p>
            ) : (
              <div className="space-y-2">
                {bestSellingProducts.slice(0, 5).map((p, idx) => (
                  <div
                    key={p.productId || p.sku || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400">SKU: {p.sku || "N/A"}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-800 block">
                        {p.netQty} net sold
                        {p.returnedQty > 0 && (
                          <span className="text-[10px] text-amber-600 font-normal ml-1">
                            ({p.returnedQty} ret.)
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        +{settings.currency}
                        {p.netProfit.toFixed(2)} profit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span>Expense Breakdown</span>
              </h3>
              <span className="text-[11px] text-slate-400">By Category</span>
            </div>

            {expenseCategories.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No expenses logged in this period.
              </p>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map(([category, amount]) => {
                  const percentage =
                    totalExpensesAmount > 0
                      ? Math.round((amount / totalExpensesAmount) * 100)
                      : 0;

                  return (
                    <div key={category} className="p-2.5 rounded-lg bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{category}</span>
                        <span className="font-bold text-slate-800">
                          {settings.currency}
                          {amount.toFixed(2)}{" "}
                          <span className="text-slate-400 font-normal">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
