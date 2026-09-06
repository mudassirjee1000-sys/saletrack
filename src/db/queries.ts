import { db } from './index.ts';
import {
  users,
  products,
  sales,
  expenses,
  customers,
  vendors,
  vendorPurchases,
  vendorPayments,
  settings,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserSyncPayload {
  products?: any[];
  sales?: any[];
  expenses?: any[];
  customers?: any[];
  vendors?: any[];
  vendorPurchases?: any[];
  vendorPayments?: any[];
  settings?: any;
}

/**
 * Fetch all data for a specific user from Cloud SQL PostgreSQL
 */
export async function getUserData(userId: string) {
  try {
    const [
      userProducts,
      userSales,
      userExpenses,
      userCustomers,
      userVendors,
      userVendorPurchases,
      userVendorPayments,
      userSettings,
    ] = await Promise.all([
      db.select().from(products).where(eq(products.userId, userId)),
      db.select().from(sales).where(eq(sales.userId, userId)),
      db.select().from(expenses).where(eq(expenses.userId, userId)),
      db.select().from(customers).where(eq(customers.userId, userId)),
      db.select().from(vendors).where(eq(vendors.userId, userId)),
      db.select().from(vendorPurchases).where(eq(vendorPurchases.userId, userId)),
      db.select().from(vendorPayments).where(eq(vendorPayments.userId, userId)),
      db.select().from(settings).where(eq(settings.userId, userId)),
    ]);

    return {
      products: userProducts || [],
      sales: userSales || [],
      expenses: userExpenses || [],
      customers: userCustomers || [],
      vendors: userVendors || [],
      vendorPurchases: userVendorPurchases || [],
      vendorPayments: userVendorPayments || [],
      settings: userSettings?.[0] || null,
    };
  } catch (error) {
    console.error('Database getUserData failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Persist/Sync full dataset for a user to Cloud SQL PostgreSQL
 */
export async function syncUserData(userId: string, data: UserSyncPayload) {
  try {
    // 1. Settings
    if (data.settings) {
      const s = data.settings;
      await db
        .insert(settings)
        .values({
          userId,
          shopName: s.shopName || 'SaleTrack Store',
          shopPhone: s.shopPhone || '',
          shopAddress: s.shopAddress || '',
          currency: s.currency || '$',
          currencyCode: s.currencyCode || 'USD',
          currencyName: s.currencyName || 'US Dollar',
          allowNegativeStock: Boolean(s.allowNegativeStock),
          invoiceFooter: s.invoiceFooter || '',
          autoEmailReceipt: Boolean(s.autoEmailReceipt),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: settings.userId,
          set: {
            shopName: s.shopName || 'SaleTrack Store',
            shopPhone: s.shopPhone || '',
            shopAddress: s.shopAddress || '',
            currency: s.currency || '$',
            currencyCode: s.currencyCode || 'USD',
            currencyName: s.currencyName || 'US Dollar',
            allowNegativeStock: Boolean(s.allowNegativeStock),
            invoiceFooter: s.invoiceFooter || '',
            autoEmailReceipt: Boolean(s.autoEmailReceipt),
            updatedAt: new Date(),
          },
        });
    }

    // 2. Products
    if (Array.isArray(data.products)) {
      await db.delete(products).where(eq(products.userId, userId));
      if (data.products.length > 0) {
        const productRows = data.products.map((p) => ({
          id: String(p.id),
          userId,
          name: String(p.name || 'Unnamed Product'),
          sku: String(p.sku || ''),
          purchasePrice: Number(p.purchasePrice) || 0,
          sellingPrice: Number(p.sellingPrice) || 0,
          stock: Number(p.stock) || 0,
          minStock: Number(p.minStock) || 5,
          category: p.category ? String(p.category) : null,
          createdAt: p.createdAt ? String(p.createdAt) : new Date().toISOString(),
        }));
        await db.insert(products).values(productRows);
      }
    }

    // 3. Sales
    if (Array.isArray(data.sales)) {
      await db.delete(sales).where(eq(sales.userId, userId));
      if (data.sales.length > 0) {
        const saleRows = data.sales.map((s) => ({
          id: String(s.id),
          userId,
          invoiceNumber: String(s.invoiceNumber || ''),
          date: String(s.date || new Date().toISOString()),
          customerId: s.customerId ? String(s.customerId) : null,
          customerName: String(s.customerName || 'Walk-in Customer'),
          customerPhone: s.customerPhone ? String(s.customerPhone) : null,
          customerEmail: s.customerEmail ? String(s.customerEmail) : null,
          paymentType: String(s.paymentType || 'cash'),
          status: String(s.status || 'completed'),
          items: s.items || [],
          subtotal: Number(s.subtotal) || 0,
          discount: Number(s.discount) || 0,
          total: Number(s.total) || 0,
          profit: Number(s.profit) || 0,
          cogs: Number(s.cogs) || 0,
          paid: Number(s.paid) || 0,
          notes: s.notes ? String(s.notes) : null,
        }));
        await db.insert(sales).values(saleRows);
      }
    }

    // 4. Expenses
    if (Array.isArray(data.expenses)) {
      await db.delete(expenses).where(eq(expenses.userId, userId));
      if (data.expenses.length > 0) {
        const expenseRows = data.expenses.map((e) => ({
          id: String(e.id),
          userId,
          name: String(e.name || 'Expense'),
          category: String(e.category || 'General'),
          amount: Number(e.amount) || 0,
          date: String(e.date || new Date().toISOString()),
          note: e.note ? String(e.note) : null,
          createdAt: e.createdAt ? String(e.createdAt) : new Date().toISOString(),
        }));
        await db.insert(expenses).values(expenseRows);
      }
    }

    // 5. Customers
    if (Array.isArray(data.customers)) {
      await db.delete(customers).where(eq(customers.userId, userId));
      if (data.customers.length > 0) {
        const customerRows = data.customers.map((c) => ({
          id: String(c.id),
          userId,
          name: String(c.name || 'Customer'),
          phone: String(c.phone || ''),
          email: c.email ? String(c.email) : null,
          address: c.address ? String(c.address) : null,
          totalCredit: Number(c.totalCredit) || 0,
          totalPaid: Number(c.totalPaid) || 0,
          remaining: Number(c.remaining) || 0,
          payments: c.payments || [],
          lastPaymentDate: c.lastPaymentDate ? String(c.lastPaymentDate) : null,
          createdAt: c.createdAt ? String(c.createdAt) : new Date().toISOString(),
        }));
        await db.insert(customers).values(customerRows);
      }
    }

    // 6. Vendors
    if (Array.isArray(data.vendors)) {
      await db.delete(vendors).where(eq(vendors.userId, userId));
      if (data.vendors.length > 0) {
        const vendorRows = data.vendors.map((v) => ({
          id: String(v.id),
          userId,
          name: String(v.name || 'Vendor'),
          companyName: String(v.companyName || ''),
          phone: String(v.phone || ''),
          email: v.email ? String(v.email) : null,
          address: v.address ? String(v.address) : null,
          openingBalance: Number(v.openingBalance) || 0,
          paymentTerms: v.paymentTerms ? String(v.paymentTerms) : null,
          notes: v.notes ? String(v.notes) : null,
          totalPurchased: Number(v.totalPurchased) || 0,
          totalPaid: Number(v.totalPaid) || 0,
          remainingBalance: Number(v.remainingBalance) || 0,
          lastPaymentDate: v.lastPaymentDate ? String(v.lastPaymentDate) : null,
          createdAt: v.createdAt ? String(v.createdAt) : new Date().toISOString(),
        }));
        await db.insert(vendors).values(vendorRows);
      }
    }

    // 7. Vendor Purchases
    if (Array.isArray(data.vendorPurchases)) {
      await db.delete(vendorPurchases).where(eq(vendorPurchases.userId, userId));
      if (data.vendorPurchases.length > 0) {
        const vpRows = data.vendorPurchases.map((vp) => ({
          id: String(vp.id),
          userId,
          vendorId: String(vp.vendorId),
          vendorName: String(vp.vendorName || ''),
          companyName: vp.companyName ? String(vp.companyName) : null,
          date: String(vp.date || new Date().toISOString()),
          invoiceNumber: String(vp.invoiceNumber || ''),
          items: vp.items || [],
          totalAmount: Number(vp.totalAmount) || 0,
          paidAmount: Number(vp.paidAmount) || 0,
          remainingBalance: Number(vp.remainingBalance) || 0,
          paymentStatus: String(vp.paymentStatus || 'unpaid'),
          notes: vp.notes ? String(vp.notes) : null,
          createdAt: vp.createdAt ? String(vp.createdAt) : new Date().toISOString(),
        }));
        await db.insert(vendorPurchases).values(vpRows);
      }
    }

    // 8. Vendor Payments
    if (Array.isArray(data.vendorPayments)) {
      await db.delete(vendorPayments).where(eq(vendorPayments.userId, userId));
      if (data.vendorPayments.length > 0) {
        const vpayRows = data.vendorPayments.map((vpay) => ({
          id: String(vpay.id),
          userId,
          vendorId: String(vpay.vendorId),
          vendorName: vpay.vendorName ? String(vpay.vendorName) : null,
          purchaseId: vpay.purchaseId ? String(vpay.purchaseId) : null,
          amount: Number(vpay.amount) || 0,
          date: String(vpay.date || new Date().toISOString()),
          paymentMethod: String(vpay.paymentMethod || 'cash'),
          reference: vpay.reference ? String(vpay.reference) : null,
          createdAt: vpay.createdAt ? String(vpay.createdAt) : new Date().toISOString(),
        }));
        await db.insert(vendorPayments).values(vpayRows);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Database syncUserData failed:', error);
    throw new Error('Database sync failed. Please try again later.', { cause: error });
  }
}
