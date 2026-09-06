import {
  Product,
  Sale,
  SaleReturn,
  StockMovement,
  Expense,
  Customer,
  Vendor,
  VendorPurchase,
  VendorPayment,
  VendorReturn,
  ShopSettings,
} from "./types";

/**
 * Storage Abstraction
 * ZERO Demo Data. ZERO Shared Data.
 * Every new store starts with 100% EMPTY records.
 */

const STORAGE_KEYS = {
  PRODUCTS: "saletrack_products",
  SALES: "saletrack_sales",
  SALE_RETURNS: "saletrack_sale_returns",
  STOCK_MOVEMENTS: "saletrack_stock_movements",
  EXPENSES: "saletrack_expenses",
  CUSTOMERS: "saletrack_customers",
  VENDORS: "saletrack_vendors",
  VENDOR_PURCHASES: "saletrack_vendor_purchases",
  VENDOR_PAYMENTS: "saletrack_vendor_payments",
  VENDOR_RETURNS: "saletrack_vendor_returns",
  SETTINGS: "saletrack_settings",
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "My Store",
  shopPhone: "",
  shopAddress: "",
  currency: "$",
  currencyCode: "USD",
  currencyName: "US Dollar",
  allowNegativeStock: false,
  invoiceFooter: "Thank you for your business!",
  taxEnabled: false,
  taxName: "Tax",
  taxRate: 0,
  receiptType: "thermal",
};

// In-memory fallback
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  memoryStorage[key] = value;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

function safeRemoveItem(key: string): void {
  delete memoryStorage[key];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // fallback
  }
}

/**
 * Completely purge all local data on logout.
 * Guarantees no lingering customer data remains in the browser.
 */
export function clearAllLocalData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    safeRemoveItem(key);
  });
  // Also clean old version keys if any exist in user's browser
  const legacyKeys = [
    "small_shop_products_v1",
    "small_shop_sales_v1",
    "small_shop_expenses_v1",
    "small_shop_customers_v1",
    "small_shop_vendors_v1",
    "small_shop_vendor_purchases_v1",
    "small_shop_vendor_payments_v1",
    "small_shop_settings_v1",
    "small_shop_initialized_v1",
  ];
  legacyKeys.forEach((k) => safeRemoveItem(k));
}

// Products (Default: EMPTY)
export function getProducts(): Product[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.PRODUCTS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function saveProduct(product: Product): Product[] {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.unshift(product);
  }
  saveProducts(products);
  return products;
}

export function deleteProduct(id: string): Product[] {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
  return products;
}

// Sales (Default: EMPTY)
export function getSales(): Sale[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.SALES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSales(sales: Sale[]): void {
  safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

export function saveSale(sale: Sale): Sale[] {
  const sales = getSales();
  sales.unshift(sale);
  saveSales(sales);
  return sales;
}

// Expenses (Default: EMPTY)
export function getExpenses(): Expense[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.EXPENSES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function saveExpense(expense: Expense): Expense[] {
  const expenses = getExpenses();
  expenses.unshift(expense);
  saveExpenses(expenses);
  return expenses;
}

export function deleteExpense(id: string): Expense[] {
  const expenses = getExpenses().filter((e) => e.id !== id);
  saveExpenses(expenses);
  return expenses;
}

// Customers (Default: EMPTY)
export function getCustomers(): Customer[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function saveCustomer(customer: Customer): Customer[] {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.unshift(customer);
  }
  saveCustomers(customers);
  return customers;
}

// Vendors (Default: EMPTY)
export function getVendors(): Vendor[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.VENDORS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVendors(vendors: Vendor[]): void {
  safeSetItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
}

export function saveVendor(vendor: Vendor): Vendor[] {
  const vendors = getVendors();
  const index = vendors.findIndex((v) => v.id === vendor.id);
  if (index >= 0) {
    vendors[index] = vendor;
  } else {
    vendors.unshift(vendor);
  }
  saveVendors(vendors);
  return vendors;
}

// Vendor Purchases (Default: EMPTY)
export function getVendorPurchases(): VendorPurchase[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.VENDOR_PURCHASES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVendorPurchases(purchases: VendorPurchase[]): void {
  safeSetItem(STORAGE_KEYS.VENDOR_PURCHASES, JSON.stringify(purchases));
}

// Vendor Payments (Default: EMPTY)
export function getVendorPayments(): VendorPayment[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVendorPayments(payments: VendorPayment[]): void {
  safeSetItem(STORAGE_KEYS.VENDOR_PAYMENTS, JSON.stringify(payments));
}

// Sale Returns
export function getSaleReturns(): SaleReturn[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.SALE_RETURNS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSaleReturns(returns: SaleReturn[]): void {
  safeSetItem(STORAGE_KEYS.SALE_RETURNS, JSON.stringify(returns));
}

export function saveSaleReturn(ret: SaleReturn): SaleReturn[] {
  const list = getSaleReturns();
  list.unshift(ret);
  saveSaleReturns(list);
  return list;
}

// Stock Movements
export function getStockMovements(): StockMovement[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStockMovements(movements: StockMovement[]): void {
  safeSetItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
}

export function saveStockMovement(mov: StockMovement): StockMovement[] {
  const list = getStockMovements();
  list.unshift(mov);
  saveStockMovements(list);
  return list;
}

// Vendor Returns
export function getVendorReturns(): VendorReturn[] {
  try {
    const data = safeGetItem(STORAGE_KEYS.VENDOR_RETURNS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVendorReturns(returns: VendorReturn[]): void {
  safeSetItem(STORAGE_KEYS.VENDOR_RETURNS, JSON.stringify(returns));
}

export function saveVendorReturn(ret: VendorReturn): VendorReturn[] {
  const list = getVendorReturns();
  list.unshift(ret);
  saveVendorReturns(list);
  return list;
}

// Settings
export function getSettings(): ShopSettings {
  try {
    const data = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ShopSettings): void {
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Export / Import
export function exportAllDataJSON(): string {
  const data = {
    version: "2.1",
    exportDate: new Date().toISOString(),
    products: getProducts(),
    sales: getSales(),
    saleReturns: getSaleReturns(),
    stockMovements: getStockMovements(),
    expenses: getExpenses(),
    customers: getCustomers(),
    vendors: getVendors(),
    vendorPurchases: getVendorPurchases(),
    vendorPayments: getVendorPayments(),
    vendorReturns: getVendorReturns(),
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.products && Array.isArray(data.products)) saveProducts(data.products);
    if (data.sales && Array.isArray(data.sales)) saveSales(data.sales);
    if (data.saleReturns && Array.isArray(data.saleReturns)) saveSaleReturns(data.saleReturns);
    if (data.stockMovements && Array.isArray(data.stockMovements)) saveStockMovements(data.stockMovements);
    if (data.expenses && Array.isArray(data.expenses)) saveExpenses(data.expenses);
    if (data.customers && Array.isArray(data.customers)) saveCustomers(data.customers);
    if (data.vendors && Array.isArray(data.vendors)) saveVendors(data.vendors);
    if (data.vendorPurchases && Array.isArray(data.vendorPurchases))
      saveVendorPurchases(data.vendorPurchases);
    if (data.vendorPayments && Array.isArray(data.vendorPayments))
      saveVendorPayments(data.vendorPayments);
    if (data.vendorReturns && Array.isArray(data.vendorReturns))
      saveVendorReturns(data.vendorReturns);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch (err) {
    console.error("Import failed:", err);
    return false;
  }
}
