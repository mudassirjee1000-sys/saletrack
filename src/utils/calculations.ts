import { Sale, Expense } from "../types";

export interface AccountingMetrics {
  totalSales: number; // Sum of all completed sales
  cogs: number; // Cost of Goods Sold = purchase cost × quantity sold
  grossProfit: number; // Gross Profit = Total Sales − COGS
  operatingExpenses: number; // Operating Expenses = sum of recorded expenses
  netProfit: number; // Net Profit = Gross Profit − Operating Expenses
  grossMarginPercentage: number;
  netMarginPercentage: number;
  completedSalesCount: number;
  expensesCount: number;
}

/**
 * Validates whether a sale is completed (excludes cancelled and refunded sales)
 */
export function isCompletedSale(sale: Sale | undefined | null): boolean {
  if (!sale) return false;
  if (sale.status === "cancelled" || sale.status === "refunded") return false;
  return true;
}

/**
 * Calculates Cost of Goods Sold (COGS) for an individual sale:
 * COGS = sum of (purchase cost × quantity sold) for all items in the sale.
 * Only applies to completed sales.
 */
export function calculateSaleCOGS(sale: Sale | undefined | null): number {
  if (!sale || !sale.items || !isCompletedSale(sale)) return 0;
  return sale.items.reduce((sum, item) => {
    const unitPurchaseCost = typeof item.purchasePrice === "number" ? item.purchasePrice : 0;
    const quantity = typeof item.quantity === "number" ? item.quantity : 0;
    return sum + unitPurchaseCost * quantity;
  }, 0);
}

/**
 * Calculates Gross Profit for an individual sale:
 * Gross Profit = Total Sales Revenue - COGS
 */
export function calculateSaleGrossProfit(sale: Sale | undefined | null): number {
  if (!sale || !isCompletedSale(sale)) return 0;
  const cogs = calculateSaleCOGS(sale);
  return (sale.total || 0) - cogs;
}

/**
 * Standard SaleTrack Accounting Engine.
 * 
 * Formulas:
 * 1. Total Sales = sum of all completed sales
 * 2. Cost of Goods Sold (COGS) = purchase cost × quantity sold
 * 3. Gross Profit = Total Sales − COGS
 * 4. Operating Expenses = sum of recorded expenses (counted once)
 * 5. Net Profit = Gross Profit − Operating Expenses
 */
export function calculateAccountingMetrics(
  sales: (Sale | undefined | null)[] = [],
  expenses: (Expense | undefined | null)[] = []
): AccountingMetrics {
  // 1. Exclude refunded/cancelled sales
  const completedSales = sales.filter((s): s is Sale => Boolean(s && isCompletedSale(s)));

  // Total Sales = sum of all completed sales
  const totalSales = completedSales.reduce((sum, s) => sum + (s.total || 0), 0);

  // Cost of Goods Sold (COGS) = purchase cost × quantity sold
  const cogs = completedSales.reduce((sum, s) => sum + calculateSaleCOGS(s), 0);

  // Gross Profit = Total Sales − COGS
  const grossProfit = totalSales - cogs;

  // Operating Expenses = sum of recorded expenses (each expense counted strictly once)
  const validExpenses = expenses.filter((e): e is Expense => Boolean(e && typeof e.amount === "number"));
  const operatingExpenses = validExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Net Profit = Gross Profit − Operating Expenses
  const netProfit = grossProfit - operatingExpenses;

  // Margins
  const grossMarginPercentage =
    totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const netMarginPercentage =
    totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  return {
    totalSales,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    grossMarginPercentage,
    netMarginPercentage,
    completedSalesCount: completedSales.length,
    expensesCount: validExpenses.length,
  };
}
