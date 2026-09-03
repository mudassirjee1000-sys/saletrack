import React, { useState } from "react";
import { Product, Sale, Expense, Customer, ShopSettings } from "../types";
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
} from "lucide-react";

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  settings: ShopSettings;
}

type DateFilterType = "today" | "week" | "month" | "custom";

export const Reports: React.FC<ReportsProps> = ({
  products,
  sales,
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
    // Current week start (Monday)
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
    // s.date format is YYYY-MM-DD or YYYY-MM-DD HH:mm
    const sDate = new Date(s.date.replace(" ", "T"));
    return !isNaN(sDate.getTime()) && sDate >= startDate && sDate <= endDate;
  });

  // Filter expenses within range
  const filteredExpenses = expenses.filter((e) => {
    const eDate = new Date(`${e.date}T12:00:00`);
    return !isNaN(eDate.getTime()) && eDate >= startDate && eDate <= endDate;
  });

  // Financial Metrics
  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalGrossProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNetProfit = totalGrossProfit - totalExpensesAmount;
  const profitMarginPercent =
    totalSalesRevenue > 0 ? Math.round((totalNetProfit / totalSalesRevenue) * 100) : 0;
  const numberOfSales = filteredSales.length;

  // Outstanding customer credit (all-time active)
  const totalOutstandingCredit = customers.reduce((sum, c) => sum + c.remaining, 0);

  // Best-selling products aggregation in this period
  const productPerformanceMap: Record<
    string,
    { name: string; sku: string; qty: number; revenue: number; profit: number }
  > = {};

  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productPerformanceMap[item.productId]) {
        productPerformanceMap[item.productId] = {
          name: item.productName,
          sku: item.sku,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productPerformanceMap[item.productId].qty += item.quantity;
      productPerformanceMap[item.productId].revenue += item.total;
      productPerformanceMap[item.productId].profit += item.profit;
    });
  });

  const bestSellingProducts = Object.values(productPerformanceMap).sort((a, b) => b.qty - a.qty);

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
              <span>Business Financial Reports</span>
            </h2>
            <p className="text-xs text-slate-400">
              Analyze profitability, top products, overheads, and customer credit
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
        {/* Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Total Sales
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 block">
            {settings.currency}
            {totalSalesRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {numberOfSales} transactions recorded
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Total Expenses
          </span>
          <span className="text-xl sm:text-2xl font-bold text-red-600 block">
            {settings.currency}
            {totalExpensesAmount.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredExpenses.length} expense records
          </span>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Gross Profit (Sales - Cost)
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 block">
            {settings.currency}
            {totalGrossProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-green-600 mt-1 block font-medium">Product margin gain</span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Net Profit (After Expenses)
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold block ${
              totalNetProfit >= 0 ? "text-green-600" : "text-red-600"
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

      {/* Customer Credit Callout */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Outstanding Customer Credit</h4>
            <p className="text-slate-400">
              Total uncollected money currently owed by customers on credit sales
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-lg sm:text-xl font-bold text-red-600 block">
            {settings.currency}
            {totalOutstandingCredit.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Across {customers.filter((c) => c.remaining > 0).length} customer(s)
          </span>
        </div>
      </div>

      {/* Two Column Section: Best Sellers & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Best-Selling Products</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Ranked by Volume</span>
          </div>

          {bestSellingProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No product sales in the selected period.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bestSellingProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800"
                          : idx === 1
                          ? "bg-slate-200 text-slate-700"
                          : idx === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-slate-800 block">
                      {p.qty} units ({settings.currency}
                      {p.revenue.toFixed(2)})
                    </span>
                    <span className="text-[10px] text-green-600 font-medium">
                      Profit: +{settings.currency}
                      {p.profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span>Expense Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">By Category</span>
          </div>

          {expenseCategories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No expenses recorded in the selected period.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {expenseCategories.map(([cat, amount]) => {
                const percent =
                  totalExpensesAmount > 0
                    ? Math.round((amount / totalExpensesAmount) * 100)
                    : 0;

                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">{cat}</span>
                      <span className="text-slate-800 font-bold">
                        {settings.currency}
                        {amount.toFixed(2)}{" "}
                        <span className="text-slate-400 text-[10px] font-normal">({percent}%)</span>
                      </span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
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
  );
};
