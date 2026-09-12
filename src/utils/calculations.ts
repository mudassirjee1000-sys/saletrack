import { Sale, Expense, SaleReturn, SaleReturnItem } from "../types";

export interface AccountingMetrics {
  totalSales: number; // Net Sales Revenue (Gross Sales − Total Refunds)
  grossSales: number; // Gross sales before any returns/refunds
  totalRefunds: number; // Total amount refunded to customers
  cogs: number; // Net Cost of Goods Sold (Original COGS − Returned COGS)
  originalCogs: number; // Original COGS before returns
  reversedCogs: number; // COGS reversed due to returned items
  grossProfit: number; // Net Gross Profit = Net Sales Revenue − Net COGS
  operatingExpenses: number; // Operating Expenses = sum of valid expenses
  netProfit: number; // Net Profit = Gross Profit − Operating Expenses
  grossMarginPercentage: number;
  netMarginPercentage: number;
  completedSalesCount: number;
  refundedSalesCount: number;
  expensesCount: number;
  // Refund method breakdowns for auditing cash & bank flows
  cashRefunds: number;
  bankRefunds: number;
  cardRefunds: number;
  creditAdjustments: number;
  netCashFlow: number; // Cash sales collected minus cash refunds minus expenses
}

/**
 * Validates whether a sale is completed (excludes cancelled sales).
 * Fully refunded and partially refunded sales are retained so financial
 * adjustments and return histories can be tracked accurately.
 */
export function isCompletedSale(sale: Sale | undefined | null): boolean {
  if (!sale) return false;
  if (sale.status === "cancelled") return false;
  return true;
}

/**
 * Calculates Cost of Goods Sold (COGS) for an individual sale before any returns:
 * COGS = sum of (purchase cost × quantity sold) for all items in the sale.
 */
export function calculateSaleOriginalCOGS(sale: Sale | undefined | null): number {
  if (!sale || !sale.items) return 0;
  if (typeof sale.cogs === "number" && sale.cogs > 0) {
    return sale.cogs;
  }
  return sale.items.reduce((sum, item) => {
    const unitPurchaseCost = typeof item.purchasePrice === "number" ? item.purchasePrice : 0;
    const quantity = typeof item.quantity === "number" ? item.quantity : 0;
    return sum + unitPurchaseCost * quantity;
  }, 0);
}

// Alias for backward compatibility
export const calculateSaleCOGS = calculateSaleOriginalCOGS;

/**
 * Returns the exact refunded amount and reversed COGS for a specific sale.
 * If actual SaleReturn records are provided, it calculates exact returned item costs;
 * otherwise it uses the sale's refundedAmount and proportional ratio.
 */
export function getSaleReturnedAmounts(
  sale: Sale | undefined | null,
  saleReturns: SaleReturn[] = []
): {
  refundedAmount: number;
  returnedCogs: number;
  returnedItems: Record<string, number>;
} {
  if (!sale) {
    return { refundedAmount: 0, returnedCogs: 0, returnedItems: {} };
  }

  // Find matching return records for this sale
  const matchingReturns = saleReturns.filter(
    (r) => r.saleId === sale.id || (r.invoiceNumber && r.invoiceNumber === sale.invoiceNumber)
  );

  if (matchingReturns.length > 0) {
    let refundedAmount = 0;
    let returnedCogs = 0;
    const returnedItems: Record<string, number> = {};

    matchingReturns.forEach((ret) => {
      refundedAmount += Number(ret.refundAmount) || 0;
      if (Array.isArray(ret.items)) {
        ret.items.forEach((item) => {
          const qty = Number(item.quantity) || 0;
          returnedItems[item.productId] = (returnedItems[item.productId] || 0) + qty;
          const cost =
            typeof item.cogs === "number" && item.cogs > 0
              ? item.cogs
              : (Number(item.purchasePrice) || 0) * qty;
          returnedCogs += cost;
        });
      }
    });

    const originalTotal = Number(sale.total) || 0;
    const originalCogs = calculateSaleOriginalCOGS(sale);

    return {
      refundedAmount: Math.min(originalTotal, Math.max(0, refundedAmount)),
      returnedCogs: Math.min(originalCogs, Math.max(0, returnedCogs)),
      returnedItems,
    };
  }

  // Fallback: If no explicit return records, use sale.refundedAmount proportionally
  const refundedAmount = Math.min(
    Number(sale.total) || 0,
    Math.max(0, Number(sale.refundedAmount) || 0)
  );
  const originalTotal = Number(sale.total) || 0;
  const originalCogs = calculateSaleOriginalCOGS(sale);
  const ratio = originalTotal > 0 ? refundedAmount / originalTotal : 0;
  const returnedCogs = originalCogs * ratio;

  return {
    refundedAmount,
    returnedCogs: Math.min(originalCogs, Math.max(0, returnedCogs)),
    returnedItems: {},
  };
}

/**
 * Calculates Net Revenue for an individual sale after deducting refunds.
 */
export function calculateSaleNetRevenue(
  sale: Sale | undefined | null,
  saleReturns: SaleReturn[] = []
): number {
  if (!sale || sale.status === "cancelled") return 0;
  const { refundedAmount } = getSaleReturnedAmounts(sale, saleReturns);
  return Math.max(0, (sale.total || 0) - refundedAmount);
}

/**
 * Calculates Net COGS for an individual sale after reversing returned goods cost.
 */
export function calculateSaleNetCOGS(
  sale: Sale | undefined | null,
  saleReturns: SaleReturn[] = []
): number {
  if (!sale || sale.status === "cancelled") return 0;
  const originalCogs = calculateSaleOriginalCOGS(sale);
  const { returnedCogs } = getSaleReturnedAmounts(sale, saleReturns);
  return Math.max(0, originalCogs - returnedCogs);
}

/**
 * Calculates Net Gross Profit for an individual sale:
 * Net Gross Profit = Net Revenue − Net COGS.
 */
export function calculateSaleNetGrossProfit(
  sale: Sale | undefined | null,
  saleReturns: SaleReturn[] = []
): number {
  if (!sale || sale.status === "cancelled") return 0;
  const netRevenue = calculateSaleNetRevenue(sale, saleReturns);
  const netCogs = calculateSaleNetCOGS(sale, saleReturns);
  return netRevenue - netCogs;
}

// Alias for backward compatibility
export const calculateSaleGrossProfit = calculateSaleNetGrossProfit;

/**
 * Standard SaleTrack Centralized Accounting Engine.
 * 
 * Accurately synchronizes:
 * - Gross Sales Revenue
 * - Customer Refunds (by Cash, Card, Bank, and Credit adjustments)
 * - Net Sales Revenue
 * - Original COGS vs Returned COGS Reversal
 * - Net COGS
 * - Net Gross Profit
 * - Operating Expenses
 * - Net Business Profit
 * - Margin Percentages
 */
export function calculateAccountingMetrics(
  sales: (Sale | undefined | null)[] = [],
  expenses: (Expense | undefined | null)[] = [],
  saleReturns: (SaleReturn | undefined | null)[] = []
): AccountingMetrics {
  const validSales = sales.filter((s): s is Sale => Boolean(s && isCompletedSale(s)));
  const validExpenses = expenses.filter((e): e is Expense => Boolean(e && typeof e.amount === "number"));
  const validReturns = saleReturns.filter((r): r is SaleReturn => Boolean(r && typeof r.refundAmount === "number"));

  let grossSales = 0;
  let totalRefunds = 0;
  let originalCogs = 0;
  let reversedCogs = 0;
  let cashRefunds = 0;
  let bankRefunds = 0;
  let cardRefunds = 0;
  let creditAdjustments = 0;
  let completedSalesCount = 0;
  let refundedSalesCount = 0;
  let cashSalesCollected = 0;

  validSales.forEach((sale) => {
    const saleTotal = Number(sale.total) || 0;
    grossSales += saleTotal;

    // Track cash collections
    if (sale.paymentType === "cash" || sale.paymentMethod === "cash") {
      cashSalesCollected += Number(sale.paid ?? sale.total) || 0;
    } else if (typeof sale.paid === "number" && sale.paid > 0) {
      cashSalesCollected += Number(sale.paid) || 0;
    }

    const saleCogs = calculateSaleOriginalCOGS(sale);
    originalCogs += saleCogs;

    const { refundedAmount, returnedCogs: retCogs } = getSaleReturnedAmounts(sale, validReturns);
    totalRefunds += refundedAmount;
    reversedCogs += retCogs;

    if (refundedAmount > 0) {
      refundedSalesCount += 1;
    }
    if (saleTotal - refundedAmount > 0) {
      completedSalesCount += 1;
    }
  });

  // Calculate return method breakdown from returns
  validReturns.forEach((ret) => {
    const amt = Number(ret.refundAmount) || 0;
    switch (ret.refundMethod) {
      case "cash":
        cashRefunds += amt;
        break;
      case "bank":
        bankRefunds += amt;
        break;
      case "card":
        cardRefunds += amt;
        break;
      case "credit_adjustment":
        creditAdjustments += amt;
        break;
      default:
        break;
    }
  });

  const netSales = Math.max(0, grossSales - totalRefunds);
  const netCogs = Math.max(0, originalCogs - reversedCogs);
  const grossProfit = netSales - netCogs;

  const operatingExpenses = validExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = grossProfit - operatingExpenses;

  const grossMarginPercentage = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
  const netMarginPercentage = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  const netCashFlow = cashSalesCollected - cashRefunds - operatingExpenses;

  return {
    totalSales: netSales,
    grossSales,
    totalRefunds,
    cogs: netCogs,
    originalCogs,
    reversedCogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    grossMarginPercentage,
    netMarginPercentage,
    completedSalesCount,
    refundedSalesCount,
    expensesCount: validExpenses.length,
    cashRefunds,
    bankRefunds,
    cardRefunds,
    creditAdjustments,
    netCashFlow,
  };
}

/**
 * Calculates net product sales performance, ensuring returned products
 * and refunded revenues/profits are deducted so reports do not count
 * returned items as completed sales.
 */
export function calculateProductPerformance(
  sales: (Sale | undefined | null)[] = [],
  saleReturns: (SaleReturn | undefined | null)[] = []
): Array<{
  productId: string;
  name: string;
  sku: string;
  originalQty: number;
  returnedQty: number;
  netQty: number;
  grossRevenue: number;
  refundedRevenue: number;
  netRevenue: number;
  originalCogs: number;
  reversedCogs: number;
  netCogs: number;
  netProfit: number;
}> {
  const validSales = sales.filter((s): s is Sale => Boolean(s && isCompletedSale(s)));
  const validReturns = saleReturns.filter((r): r is SaleReturn => Boolean(r && Array.isArray(r.items)));

  const productMap: Record<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      originalQty: number;
      returnedQty: number;
      grossRevenue: number;
      refundedRevenue: number;
      originalCogs: number;
      reversedCogs: number;
    }
  > = {};

  // 1. Tally original sales per product
  validSales.forEach((sale) => {
    if (!Array.isArray(sale.items)) return;
    sale.items.forEach((item) => {
      const pid = item.productId || item.productName;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: item.productId,
          name: item.productName,
          sku: item.sku || "",
          originalQty: 0,
          returnedQty: 0,
          grossRevenue: 0,
          refundedRevenue: 0,
          originalCogs: 0,
          reversedCogs: 0,
        };
      }
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.sellingPrice) || 0;
      const unitCost = Number(item.purchasePrice) || 0;
      const itemTotal = typeof item.total === "number" ? item.total : unitPrice * qty;

      productMap[pid].originalQty += qty;
      productMap[pid].grossRevenue += itemTotal;
      productMap[pid].originalCogs += unitCost * qty;
    });
  });

  // 2. Subtract returns per product
  validReturns.forEach((ret) => {
    if (!Array.isArray(ret.items)) return;
    ret.items.forEach((item) => {
      const pid = item.productId || item.productName;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: item.productId,
          name: item.productName,
          sku: "",
          originalQty: 0,
          returnedQty: 0,
          grossRevenue: 0,
          refundedRevenue: 0,
          originalCogs: 0,
          reversedCogs: 0,
        };
      }
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(item.purchasePrice) || 0;
      const itemRefund = typeof item.total === "number" ? item.total : (Number(item.sellingPrice) || 0) * qty;
      const itemCogs = typeof item.cogs === "number" ? item.cogs : unitCost * qty;

      productMap[pid].returnedQty += qty;
      productMap[pid].refundedRevenue += itemRefund;
      productMap[pid].reversedCogs += itemCogs;
    });
  });

  return Object.values(productMap)
    .map((p) => {
      const netQty = Math.max(0, p.originalQty - p.returnedQty);
      const netRevenue = Math.max(0, p.grossRevenue - p.refundedRevenue);
      const netCogs = Math.max(0, p.originalCogs - p.reversedCogs);
      const netProfit = netRevenue - netCogs;

      return {
        ...p,
        productName: p.name,
        netQty,
        netRevenue,
        netCogs,
        netProfit,
      };
    })
    .sort((a, b) => b.netQty - a.netQty);
}

/**
 * Calculates remaining returnable quantities per item for a sale,
 * strictly preventing any over-return across partial returns.
 */
export function getSaleReturnableItems(
  sale: Sale,
  allReturns: SaleReturn[] = []
): Array<{
  productId: string;
  productName: string;
  sku?: string;
  sellingPrice: number;
  purchasePrice: number;
  originalSoldQty: number;
  alreadyReturnedQty: number;
  remainingReturnableQty: number;
}> {
  const matchingReturns = allReturns.filter(
    (r) => r.saleId === sale.id || (r.invoiceNumber && r.invoiceNumber === sale.invoiceNumber)
  );

  const returnedPerProduct: Record<string, number> = {};
  matchingReturns.forEach((r) => {
    if (Array.isArray(r.items)) {
      r.items.forEach((item) => {
        returnedPerProduct[item.productId] =
          (returnedPerProduct[item.productId] || 0) + (Number(item.quantity) || 0);
      });
    }
  });

  return (sale.items || []).map((item) => {
    const originalSoldQty = Number(item.quantity) || 0;
    const alreadyReturnedQty = returnedPerProduct[item.productId] || 0;
    const remainingReturnableQty = Math.max(0, originalSoldQty - alreadyReturnedQty);

    return {
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      sellingPrice: Number(item.sellingPrice) || 0,
      purchasePrice: Number(item.purchasePrice) || 0,
      originalSoldQty,
      alreadyReturnedQty,
      remainingReturnableQty,
    };
  });
}
