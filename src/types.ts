export interface Product {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  category?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  total: number;
  profit: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentType: "cash" | "credit";
  status?: "completed" | "cancelled" | "refunded";
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number; // Gross profit for this sale
  cogs?: number; // Cost of goods sold for this sale
  paid: number;
  notes?: string;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName?: string;
  amount: number;
  date: string;
  paymentMethod?: "cash" | "bank_transfer" | "card" | "other";
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalCredit: number;
  totalPaid: number;
  remaining: number;
  payments: CustomerPayment[];
  lastPaymentDate?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number;
  paymentTerms?: string;
  notes?: string;
  totalPurchased: number;
  totalPaid: number;
  remainingBalance: number;
  lastPaymentDate?: string;
  createdAt: string;
}

export interface VendorPurchaseItem {
  productId?: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface VendorPurchase {
  id: string;
  vendorId: string;
  vendorName: string;
  companyName?: string;
  date: string;
  invoiceNumber: string;
  items: VendorPurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: "paid" | "partially_paid" | "unpaid";
  notes?: string;
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  vendorId: string;
  vendorName?: string;
  purchaseId?: string;
  amount: number;
  date: string;
  paymentMethod: "cash" | "bank_transfer" | "check" | "card" | "other";
  reference?: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  currency: string;
  currencyCode?: string;
  currencyName?: string;
  allowNegativeStock: boolean;
  invoiceFooter: string;
  autoEmailReceipt?: boolean;
}

export type ActiveTab =
  | "dashboard"
  | "products"
  | "sales"
  | "expenses"
  | "customers"
  | "vendors"
  | "receivables-payables"
  | "reports"
  | "settings"
  | "ai";
