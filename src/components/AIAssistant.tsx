import React, { useState } from "react";
import { Product, Sale, Expense, Customer, ShopSettings } from "../types";
import { Sparkles, X, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle, TrendingUp, DollarSign } from "lucide-react";

interface AIAssistantProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  settings: ShopSettings;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  products,
  sales,
  expenses,
  customers,
  settings,
  isOpen = true,
  onClose = () => {},
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate high-level summary metrics to feed into the AI
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySalesList = sales.filter((s) => s.date.startsWith(todayStr));
  const todaySalesTotal = todaySalesList.reduce((sum, s) => sum + s.total, 0);
  const todayProfitTotal = todaySalesList.reduce((sum, s) => sum + s.profit, 0);

  const todayExpensesList = expenses.filter((e) => e.date === todayStr);
  const todayExpensesTotal = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const todayNetProfit = todayProfitTotal - todayExpensesTotal;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const totalCustomerCredit = customers.reduce((sum, c) => sum + c.remaining, 0);

  // Calculate best-selling products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.total;
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const topExpenses = expenses
    .slice(0, 5)
    .map((e) => ({ name: e.name, amount: e.amount, category: e.category }));

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisText(null);

    const metrics = {
      currency: settings.currency,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      lowStockItems: lowStockProducts.map((p) => ({
        name: p.name,
        currentStock: p.stock,
        minStock: p.minStock,
      })),
      todaySales: todaySalesTotal,
      todayProfit: todayNetProfit,
      todayExpenses: todayExpensesTotal,
      totalCustomerCredit,
      bestSellers,
      topExpenses,
      recentSalesCount: sales.length,
    };

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics,
          promptContext: `Shop: ${settings.shopName}. Currency: ${settings.currency}`,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setAnalysisText(data.analysis);
      setSourceType(data.source === "gemini" ? "Google Gemini AI" : "Local Business Analytics Engine");
      setLastAnalyzed(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Using local fallback analysis:", err);
      // Local fallback rule-based analysis
      const fallbackReport = generateClientSideAnalysis(metrics);
      setAnalysisText(fallbackReport);
      setSourceType("Local Analytical Engine (Offline Safe)");
      setLastAnalyzed(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden my-4 border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                AI Business Assistant
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600">
                  Version 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Actionable analysis of sales, inventory health, profit & costs
              </p>
            </div>
          </div>
          <button
            id="close-ai-modal"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Metrics Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Today's Sales</span>
              <span className="text-base font-bold text-slate-800">
                {settings.currency}
                {todaySalesTotal.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Today's Net Profit</span>
              <span
                className={`text-base font-bold ${
                  todayNetProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {settings.currency}
                {todayNetProfit.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Low Stock</span>
              <span
                className={`text-base font-bold ${
                  lowStockProducts.length > 0 ? "text-amber-600" : "text-slate-700"
                }`}
              >
                {lowStockProducts.length} Items
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-400 block">Customer Debt</span>
              <span
                className={`text-base font-bold ${
                  totalCustomerCredit > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {settings.currency}
                {totalCustomerCredit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Trigger Button Area */}
          <div className="text-center p-5 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Ready to evaluate your store's performance?
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
              The AI reviews your stock movement, high-margin products, expense leaks, and customer credit to produce recommendations.
            </p>
            <button
              id="analyze-business-btn"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs shadow-xs active:scale-95 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Store Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze My Business</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {analysisText && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5 font-medium text-blue-600">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  Generated by: {sourceType}
                </span>
                {lastAnalyzed && <span className="text-slate-400">Analyzed at {lastAnalyzed}</span>}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-sans">
                {analysisText}
              </div>
            </div>
          )}

          {/* Security & Architecture Explanatory Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Secure Server-Side AI Integration</p>
              <p className="text-slate-400 mt-0.5">
                AI requests are safely routed through backend server endpoints. Secret API keys are never bundled into client JavaScript. When building standalone on Android (Acode) or offline, the built-in analytics engine provides recommendations with zero configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-100 transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

function generateClientSideAnalysis(metrics: any): string {
  const {
    currency = "$",
    todaySales = 0,
    todayExpenses = 0,
    todayProfit = 0,
    totalProducts = 0,
    lowStockCount = 0,
    totalCustomerCredit = 0,
    bestSellers = [],
    topExpenses = [],
  } = metrics;

  return `1. Executive Summary
Your store currently operates with ${totalProducts} inventory items. Today's recorded sales stand at ${currency}${todaySales.toLocaleString()}, generating ${currency}${todayProfit.toLocaleString()} in net profit after subtracting today's expenses (${currency}${todayExpenses.toLocaleString()}).

2. Top Sellers & Profit Drivers
${
  bestSellers.length > 0
    ? bestSellers
        .slice(0, 3)
        .map(
          (b: any) =>
            `• ${b.name}: ${b.qty} units sold (${currency}${b.revenue.toLocaleString()} revenue)`
        )
        .join("\n")
    : "• Record more sales transactions to uncover your primary revenue generating products."
}

3. Inventory & Low Stock Alerts
${
  lowStockCount > 0
    ? `⚠️ ${lowStockCount} product(s) have reached or fallen below your minimum stock threshold. Restock these immediately to avoid turning away paying customers.`
    : `✅ All product stock levels are above the set minimum thresholds.`
}

4. Expense & Cost Leak Analysis
Today's expenses total ${currency}${todayExpenses.toLocaleString()}. ${
    topExpenses.length > 0
      ? `Main cost items include: ${topExpenses.map((e: any) => `${e.name} (${currency}${e.amount})`).join(", ")}.`
      : "No major expenses recorded today."
  }
Keeping daily operational overhead below 20-25% of gross revenue ensures high owner take-home pay.

5. Customer Credit & Debt Risk
${
  totalCustomerCredit > 0
    ? `⚠️ Total customer debt currently outstanding is ${currency}${totalCustomerCredit.toLocaleString()}. Follow up on these balances weekly before allowing additional credit.`
    : `✅ Zero pending customer debt recorded. All sales are secured upfront in cash.`
}

6. 3 High-Impact Action Items For This Week
1. Restock urgent low inventory items to avoid stockouts.
2. Reach out to customers with outstanding balances to improve liquid cash flow.
3. Keep recording all miscellaneous expenses daily to maintain accurate real-time profit margins.`;
}
