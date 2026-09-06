export interface Business {
  id: string;
  owner_user_id: string;
  user_id?: string;
  business_name: string;
  name?: string;
  owner_name: string;
  country: string;
  currency: string;
  currency_symbol: string;
  phone_country_code: string;
  phone_number: string;
  phone_e164: string;
  address?: string;
  business_email?: string;
  owner_email?: string;
  logo_url?: string;
  status?: string;
  plan?: string;
  subscription_status?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_start_date?: string;
  next_billing_date?: string;
  last_login_at?: string;
  is_test?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  unit?: string; // "Piece", "Box", "Dozen", "Kg", "Gram", "Liter", "Meter", "Other"
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  category?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  unit?: string;
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
  paymentType: "cash" | "credit" | "bank" | "card" | "other";
  paymentMethod?: string;
  status?: "completed" | "partially_paid" | "unpaid" | "cancelled" | "refunded" | "partially_refunded";
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  taxRate?: number;
  taxName?: string;
  total: number;
  profit: number; // Gross profit for this sale
  cogs?: number; // Cost of goods sold for this sale
  paid: number;
  refundedAmount?: number;
  notes?: string;
}

export interface SaleReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  total: number;
  cogs: number;
}

export interface SaleReturn {
  id: string;
  saleId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  date: string;
  items: SaleReturnItem[];
  refundAmount: number;
  refundMethod: "cash" | "bank" | "card" | "credit_adjustment" | "other";
  reason: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number; // positive for addition, negative for reduction
  type:
    | "purchase"
    | "sale"
    | "sale_return"
    | "purchase_return"
    | "adjustment_increase"
    | "adjustment_decrease"
    | "damaged"
    | "lost";
  reason: string;
  date: string;
  relatedInvoice?: string;
  relatedPurchase?: string;
  stockBefore?: number;
  stockAfter?: number;
  createdAt: string;
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
  reference?: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit?: number;
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

export interface VendorReturnItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface VendorReturn {
  id: string;
  vendorId: string;
  vendorName: string;
  purchaseId?: string;
  invoiceNumber?: string;
  date: string;
  items: VendorReturnItem[];
  totalAmount: number;
  reason: string;
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
  taxEnabled?: boolean;
  taxName?: string;
  taxRate?: number;
  receiptType?: "thermal" | "a4";
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
