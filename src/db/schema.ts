import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// Users table (maps to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  businessId: text('business_id'),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  purchasePrice: doublePrecision('purchase_price').notNull().default(0),
  sellingPrice: doublePrecision('selling_price').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  category: text('category'),
  createdAt: text('created_at'),
});

// Sales table
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  businessId: text('business_id'),
  transactionId: text('transaction_id'),
  invoiceNumber: text('invoice_number').notNull(),
  date: text('date').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  paymentType: text('payment_type').notNull().default('cash'),
  paymentMethod: text('payment_method'),
  status: text('status').notNull().default('completed'),
  items: jsonb('items').notNull(),
  subtotal: doublePrecision('subtotal').notNull().default(0),
  discount: doublePrecision('discount').notNull().default(0),
  tax: doublePrecision('tax').default(0),
  taxRate: doublePrecision('tax_rate').default(0),
  taxName: text('tax_name'),
  total: doublePrecision('total').notNull().default(0),
  profit: doublePrecision('profit').notNull().default(0),
  cogs: doublePrecision('cogs').notNull().default(0),
  paid: doublePrecision('paid').notNull().default(0),
  refundedAmount: doublePrecision('refunded_amount').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Stock Movements table
export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  userId: text('user_id'),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  type: text('type').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  stockBefore: doublePrecision('stock_before').notNull(),
  stockAfter: doublePrecision('stock_after').notNull(),
  reason: text('reason'),
  relatedInvoice: text('related_invoice'),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull(),
});

// Sale Returns table
export const saleReturns = pgTable('sale_returns', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  userId: text('user_id'),
  saleId: text('sale_id').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  date: text('date').notNull(),
  items: jsonb('items').notNull(),
  refundAmount: doublePrecision('refund_amount').notNull().default(0),
  refundMethod: text('refund_method').notNull().default('cash'),
  reason: text('reason').notNull().default('Customer Return'),
  createdAt: text('created_at').notNull(),
});

// Idempotency Keys table
export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').primaryKey(),
  businessId: text('business_id').notNull(),
  userId: text('user_id'),
  resourceId: text('resource_id'),
  resourceType: text('resource_type').notNull(),
  status: text('status').notNull(),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull().default(0),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at'),
});

// Customers table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  businessId: text('business_id'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  totalCredit: doublePrecision('total_credit').notNull().default(0),
  totalPaid: doublePrecision('total_paid').notNull().default(0),
  remaining: doublePrecision('remaining').notNull().default(0),
  payments: jsonb('payments'),
  lastPaymentDate: text('last_payment_date'),
  createdAt: text('created_at'),
});

// Vendors table
export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  openingBalance: doublePrecision('opening_balance').notNull().default(0),
  paymentTerms: text('payment_terms'),
  notes: text('notes'),
  totalPurchased: doublePrecision('total_purchased').notNull().default(0),
  totalPaid: doublePrecision('total_paid').notNull().default(0),
  remainingBalance: doublePrecision('remaining_balance').notNull().default(0),
  lastPaymentDate: text('last_payment_date'),
  createdAt: text('created_at'),
});

// Vendor Purchases table
export const vendorPurchases = pgTable('vendor_purchases', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vendorId: text('vendor_id').notNull(),
  vendorName: text('vendor_name').notNull(),
  companyName: text('company_name'),
  date: text('date').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  items: jsonb('items').notNull(),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  paidAmount: doublePrecision('paid_amount').notNull().default(0),
  remainingBalance: doublePrecision('remaining_balance').notNull().default(0),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  notes: text('notes'),
  createdAt: text('created_at'),
});

// Vendor Payments table
export const vendorPayments = pgTable('vendor_payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vendorId: text('vendor_id').notNull(),
  vendorName: text('vendor_name'),
  purchaseId: text('purchase_id'),
  amount: doublePrecision('amount').notNull().default(0),
  date: text('date').notNull(),
  paymentMethod: text('payment_method').notNull().default('cash'),
  reference: text('reference'),
  createdAt: text('created_at'),
});

// Shop Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  businessId: text('business_id'),
  userId: text('user_id').notNull().unique(),
  shopName: text('shop_name').notNull().default('SaleTrack Store'),
  shopPhone: text('shop_phone'),
  shopAddress: text('shop_address'),
  email: text('email'),
  currency: text('currency').notNull().default('$'),
  currencyCode: text('currency_code').default('USD'),
  currencyName: text('currency_name').default('US Dollar'),
  allowNegativeStock: boolean('allow_negative_stock').notNull().default(false),
  invoiceFooter: text('invoice_footer'),
  autoEmailReceipt: boolean('auto_email_receipt').notNull().default(false),
  taxEnabled: boolean('tax_enabled').default(false),
  taxName: text('tax_name').default('Tax'),
  taxRate: doublePrecision('tax_rate').default(0),
  receiptType: text('receipt_type').default('thermal'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin Users table for secure server-side role enforcement
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  uid: text('uid'),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull().default('admin'), // 'super_admin', 'admin', 'support'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Profiles table (user profile extension with explicit role)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').notNull().default('user'), // 'user', 'admin', 'super_admin'
  status: text('status').notNull().default('active'), // 'active', 'suspended'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Businesses / Tenants table
export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  ownerEmail: text('owner_email').notNull(),
  status: text('status').notNull().default('active'), // 'active', 'suspended'
  plan: text('plan').notNull().default('SaleTrack Pro — $4/month'),
  subscriptionStatus: text('subscription_status').notNull().default('trial'), // 'trial', 'active', 'cancelled', 'expired'
  trialStartDate: timestamp('trial_start_date').defaultNow(),
  trialEndDate: timestamp('trial_end_date'),
  subscriptionStartDate: timestamp('subscription_start_date'),
  nextBillingDate: timestamp('next_billing_date'),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
  isTest: boolean('is_test').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  userId: text('user_id').notNull(),
  businessName: text('business_name').notNull(),
  ownerEmail: text('owner_email').notNull(),
  plan: text('plan').notNull().default('SaleTrack Pro — $4/month'),
  amount: doublePrecision('amount').notNull().default(4.0),
  currency: text('currency').notNull().default('USD'),
  interval: text('interval').notNull().default('month'),
  status: text('status').notNull().default('active'), // 'trial', 'active', 'cancelled', 'expired'
  startDate: timestamp('start_date').defaultNow(),
  currentPeriodStart: timestamp('current_period_start').defaultNow(),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  externalSubscriptionId: text('external_subscription_id'),
  isTest: boolean('is_test').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Payments table (synchronized via provider webhooks, never directly fabricated)
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  userId: text('user_id').notNull(),
  businessName: text('business_name').notNull(),
  ownerEmail: text('owner_email').notNull(),
  subscriptionId: text('subscription_id'),
  amount: doublePrecision('amount').notNull().default(4.0),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('succeeded'), // 'succeeded', 'failed', 'pending', 'refunded'
  provider: text('provider').notNull().default('Stripe'),
  transactionId: text('transaction_id').notNull(),
  paymentMethodType: text('payment_method_type').default('card'),
  invoiceNumber: text('invoice_number'),
  isTest: boolean('is_test').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Login Activity table
export const loginActivity = pgTable('login_activity', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  email: text('email').notNull(),
  businessName: text('business_name'),
  status: text('status').notNull().default('successful'), // 'successful', 'failed'
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

