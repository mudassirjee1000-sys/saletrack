import { Product, Sale, Expense, Customer, CustomerPayment, ShopSettings } from "./types";

const STORAGE_KEYS = {
  PRODUCTS: "small_shop_products_v1",
  SALES: "small_shop_sales_v1",
  EXPENSES: "small_shop_expenses_v1",
  CUSTOMERS: "small_shop_customers_v1",
  SETTINGS: "small_shop_settings_v1",
  INITIALIZED: "small_shop_initialized_v1",
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "SaleTrack Store",
  shopPhone: "+1 (555) 234-5678",
  shopAddress: "Main Street, Market Block A-12",
  currency: "$",
  currencyCode: "USD",
  currencyName: "US Dollar",
  allowNegativeStock: false,
  invoiceFooter: "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Fresh Whole Milk (1L)",
    sku: "PRD-001",
    purchasePrice: 1.5,
    sellingPrice: 2.2,
    stock: 24,
    minStock: 8,
    category: "Dairy & Beverages",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Golden Grain Rice (5kg)",
    sku: "PRD-002",
    purchasePrice: 6.0,
    sellingPrice: 8.5,
    stock: 14,
    minStock: 5,
    category: "Grains & Staples",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "Farm Fresh Eggs (Crate of 30)",
    sku: "PRD-003",
    purchasePrice: 3.8,
    sellingPrice: 5.2,
    stock: 4, // low stock trigger
    minStock: 6,
    category: "Groceries",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "Refined Sunflower Oil (1L)",
    sku: "PRD-004",
    purchasePrice: 2.8,
    sellingPrice: 3.9,
    stock: 3, // low stock trigger
    minStock: 5,
    category: "Groceries",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    name: "Laundry Soap Bar (400g)",
    sku: "PRD-005",
    purchasePrice: 0.7,
    sellingPrice: 1.2,
    stock: 35,
    minStock: 10,
    category: "Household",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    name: "Whole Wheat Bread (800g)",
    sku: "PRD-006",
    purchasePrice: 1.1,
    sellingPrice: 1.8,
    stock: 18,
    minStock: 5,
    category: "Bakery",
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Ahmed Khan",
    phone: "555-0144",
    address: "Apartment 3B, Green Residency",
    totalCredit: 45.0,
    totalPaid: 20.0,
    remaining: 25.0,
    payments: [
      {
        id: "pay-1",
        customerId: "cust-1",
        amount: 20.0,
        date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
        note: "Partial cash payment",
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "cust-2",
    name: "Sarah Jenkins",
    phone: "555-0891",
    address: "House 14, East Lane",
    totalCredit: 15.0,
    totalPaid: 0.0,
    remaining: 15.0,
    payments: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const todayDateStr = new Date().toISOString().slice(0, 10);

const INITIAL_SALES: Sale[] = [
  {
    id: "sale-1",
    invoiceNumber: `INV-${todayDateStr.replace(/-/g, "")}-001`,
    date: `${todayDateStr} 09:30`,
    customerId: undefined,
    customerName: "Walk-in Customer",
    paymentType: "cash",
    items: [
      {
        productId: "prod-1",
        productName: "Fresh Whole Milk (1L)",
        sku: "PRD-001",
        purchasePrice: 1.5,
        sellingPrice: 2.2,
        quantity: 2,
        total: 4.4,
        profit: 1.4,
      },
      {
        productId: "prod-6",
        productName: "Whole Wheat Bread (800g)",
        sku: "PRD-006",
        purchasePrice: 1.1,
        sellingPrice: 1.8,
        quantity: 1,
        total: 1.8,
        profit: 0.7,
      },
    ],
    subtotal: 6.2,
    discount: 0,
    total: 6.2,
    profit: 2.1,
    paid: 6.2,
  },
  {
    id: "sale-2",
    invoiceNumber: `INV-${todayDateStr.replace(/-/g, "")}-002`,
    date: `${todayDateStr} 11:15`,
    customerId: "cust-1",
    customerName: "Ahmed Khan",
    customerPhone: "555-0144",
    paymentType: "credit",
    items: [
      {
        productId: "prod-2",
        productName: "Golden Grain Rice (5kg)",
        sku: "PRD-002",
        purchasePrice: 6.0,
        sellingPrice: 8.5,
        quantity: 2,
        total: 17.0,
        profit: 5.0,
      },
    ],
    subtotal: 17.0,
    discount: 0,
    total: 17.0,
    profit: 5.0,
    paid: 0,
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    name: "Shop Electricity Bill (August)",
    category: "Electricity",
    amount: 18.5,
    date: todayDateStr,
    note: "Paid via mobile cash",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-2",
    name: "Cardboard Packaging & Carry Bags",
    category: "Packaging",
    amount: 7.0,
    date: todayDateStr,
    note: "50 brown bags for grocery",
    createdAt: new Date().toISOString(),
  },
];

// In-memory storage fallback for sandboxed iframes and privacy-restricted environments
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn("localStorage read blocked or unavailable, using in-memory store:", err);
  }
  return memoryStorage[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  memoryStorage[key] = value;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn("localStorage write blocked or quota exceeded, cached in memory:", err);
  }
}

// Initialize Storage if empty
export function initStorage(): void {
  const initialized = safeGetItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized) {
    safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    safeSetItem(STORAGE_KEYS.INITIALIZED, "true");
  }
}

// Products
export function getProducts(): Product[] {
  try {
    initStorage();
    const data = safeGetItem(STORAGE_KEYS.PRODUCTS);
    if (!data) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProduct(product: Product): Product[] {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.unshift(product);
  }
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  return products;
}

export function deleteProduct(productId: string): Product[] {
  const products = getProducts().filter((p) => p.id !== productId);
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  return products;
}

export function updateStock(productId: string, quantityChange: number): Product | null {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === productId);
  if (index >= 0) {
    products[index].stock = Math.max(0, products[index].stock + quantityChange);
    safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return products[index];
  }
  return null;
}

// Sales
export function getSales(): Sale[] {
  try {
    initStorage();
    const data = safeGetItem(STORAGE_KEYS.SALES);
    if (!data) return INITIAL_SALES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_SALES;
  } catch {
    return INITIAL_SALES;
  }
}

export function recordSale(sale: Sale): { sales: Sale[]; products: Product[]; customers: Customer[] } {
  // 1. Add sale to history
  const sales = getSales();
  sales.unshift(sale);
  safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

  // 2. Reduce product inventory for each item
  const products = getProducts();
  (sale.items || []).forEach((item) => {
    const pIndex = products.findIndex((p) => p.id === item.productId);
    if (pIndex >= 0) {
      products[pIndex].stock = Math.max(0, products[pIndex].stock - item.quantity);
    }
  });
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // 3. If credit, increase customer outstanding balance
  const customers = getCustomers();
  if (sale.paymentType === "credit" && sale.customerId) {
    const cIndex = customers.findIndex((c) => c.id === sale.customerId);
    if (cIndex >= 0) {
      customers[cIndex].totalCredit += sale.total;
      customers[cIndex].remaining += sale.total;
      safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  return { sales, products, customers };
}

// Expenses
export function getExpenses(): Expense[] {
  try {
    initStorage();
    const data = safeGetItem(STORAGE_KEYS.EXPENSES);
    if (!data) return INITIAL_EXPENSES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_EXPENSES;
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveExpense(expense: Expense): Expense[] {
  const expenses = getExpenses();
  const index = expenses.findIndex((e) => e.id === expense.id);
  if (index >= 0) {
    expenses[index] = expense;
  } else {
    expenses.unshift(expense);
  }
  safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return expenses;
}

export function deleteExpense(expenseId: string): Expense[] {
  const expenses = getExpenses().filter((e) => e.id !== expenseId);
  safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return expenses;
}

// Customers & Payments
export function getCustomers(): Customer[] {
  try {
    initStorage();
    const data = safeGetItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) return INITIAL_CUSTOMERS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomer(customer: Customer): Customer[] {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.unshift(customer);
  }
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  return customers;
}

export function recordCustomerPayment(
  customerId: string,
  amount: number,
  date: string,
  note?: string
): Customer[] {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customerId);
  if (index >= 0) {
    const customer = customers[index];
    const newPayment: CustomerPayment = {
      id: "pay-" + Date.now(),
      customerId,
      amount,
      date,
      note,
    };
    customer.payments = customer.payments || [];
    customer.payments.unshift(newPayment);
    customer.totalPaid = (customer.totalPaid || 0) + amount;
    customer.remaining = Math.max(0, customer.totalCredit - customer.totalPaid);

    safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }
  return customers;
}

// Settings
export function getSettings(): ShopSettings {
  try {
    initStorage();
    const data = safeGetItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ShopSettings): ShopSettings {
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  return settings;
}

// Backup / Restore
export function exportAllData(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    products: getProducts(),
    sales: getSales(),
    expenses: getExpenses(),
    customers: getCustomers(),
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.products && Array.isArray(data.products)) {
      safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    }
    if (data.sales && Array.isArray(data.sales)) {
      safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(data.sales));
    }
    if (data.expenses && Array.isArray(data.expenses)) {
      safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
    }
    if (data.customers && Array.isArray(data.customers)) {
      safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
    }
    if (data.settings) {
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    return true;
  } catch (err) {
    console.error("Failed to import data:", err);
    return false;
  }
}

export function saveProducts(products: Product[]): void {
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function saveSales(sales: Sale[]): void {
  safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

export function saveExpenses(expenses: Expense[]): void {
  safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function saveCustomers(customers: Customer[]): void {
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export const exportAllDataJSON = exportAllData;
export const importAllDataJSON = importAllData;

export function resetToSampleData(): void {
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  safeSetItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
  safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  safeSetItem(STORAGE_KEYS.INITIALIZED, "true");
}


