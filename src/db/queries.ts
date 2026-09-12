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
  stockMovements,
  idempotencyKeys,
  saleReturns,
} from './schema.ts';
import { eq, or, and } from 'drizzle-orm';

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
          businessId: s.businessId || userId,
          shopName: s.shopName || 'SaleTrack Store',
          shopPhone: s.shopPhone || '',
          shopAddress: s.shopAddress || '',
          email: s.email || s.businessEmail || '',
          currency: s.currency || '$',
          currencyCode: s.currencyCode || 'USD',
          currencyName: s.currencyName || 'US Dollar',
          allowNegativeStock: Boolean(s.allowNegativeStock),
          invoiceFooter: s.invoiceFooter || '',
          autoEmailReceipt: Boolean(s.autoEmailReceipt),
          taxEnabled: Boolean(s.taxEnabled),
          taxName: s.taxName || 'Tax',
          taxRate: Number(s.taxRate) || 0,
          receiptType: s.receiptType || 'thermal',
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: settings.userId,
          set: {
            businessId: s.businessId || userId,
            shopName: s.shopName || 'SaleTrack Store',
            shopPhone: s.shopPhone || '',
            shopAddress: s.shopAddress || '',
            email: s.email || s.businessEmail || '',
            currency: s.currency || '$',
            currencyCode: s.currencyCode || 'USD',
            currencyName: s.currencyName || 'US Dollar',
            allowNegativeStock: Boolean(s.allowNegativeStock),
            invoiceFooter: s.invoiceFooter || '',
            autoEmailReceipt: Boolean(s.autoEmailReceipt),
            taxEnabled: Boolean(s.taxEnabled),
            taxName: s.taxName || 'Tax',
            taxRate: Number(s.taxRate) || 0,
            receiptType: s.receiptType || 'thermal',
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

export async function getSettingsForBusiness(businessId: string, userId?: string) {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(
        userId
          ? or(eq(settings.businessId, businessId), eq(settings.userId, userId))
          : eq(settings.businessId, businessId)
      )
      .limit(1);

    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        shopName: r.shopName || 'SaleTrack Store',
        shopPhone: r.shopPhone || '',
        shopAddress: r.shopAddress || '',
        email: r.email || '',
        currency: r.currency || '$',
        currencyCode: r.currencyCode || 'USD',
        currencyName: r.currencyName || 'US Dollar',
        allowNegativeStock: Boolean(r.allowNegativeStock),
        invoiceFooter: r.invoiceFooter || '',
        autoEmailReceipt: Boolean(r.autoEmailReceipt),
        taxEnabled: Boolean(r.taxEnabled),
        taxName: r.taxName || 'Tax',
        taxRate: r.taxRate !== null && r.taxRate !== undefined ? Number(r.taxRate) : 0,
        receiptType: (r.receiptType as 'thermal' | 'a4') || 'thermal',
      };
    }
    return null;
  } catch (error) {
    console.error('getSettingsForBusiness query failed:', error);
    return null;
  }
}

export async function upsertSettingsForBusiness(businessId: string, s: any, userId?: string) {
  try {
    const existing = await db
      .select()
      .from(settings)
      .where(
        userId
          ? or(eq(settings.businessId, businessId), eq(settings.userId, userId))
          : eq(settings.businessId, businessId)
      )
      .limit(1);

    if (existing && existing.length > 0) {
      await db
        .update(settings)
        .set({
          businessId,
          shopName: s.shopName || 'SaleTrack Store',
          shopPhone: s.shopPhone || '',
          shopAddress: s.shopAddress || '',
          email: s.email || s.businessEmail || '',
          currency: s.currency || '$',
          currencyCode: s.currencyCode || 'USD',
          currencyName: s.currencyName || 'US Dollar',
          allowNegativeStock: Boolean(s.allowNegativeStock),
          invoiceFooter: s.invoiceFooter || '',
          autoEmailReceipt: Boolean(s.autoEmailReceipt),
          taxEnabled: Boolean(s.taxEnabled),
          taxName: s.taxName || 'Tax',
          taxRate: Number(s.taxRate) || 0,
          receiptType: s.receiptType || 'thermal',
          updatedAt: new Date(),
        })
        .where(eq(settings.id, existing[0].id));
    } else {
      const targetUserId = userId || businessId;
      await db.insert(settings).values({
        userId: targetUserId,
        businessId,
        shopName: s.shopName || 'SaleTrack Store',
        shopPhone: s.shopPhone || '',
        shopAddress: s.shopAddress || '',
        email: s.email || s.businessEmail || '',
        currency: s.currency || '$',
        currencyCode: s.currencyCode || 'USD',
        currencyName: s.currencyName || 'US Dollar',
        allowNegativeStock: Boolean(s.allowNegativeStock),
        invoiceFooter: s.invoiceFooter || '',
        autoEmailReceipt: Boolean(s.autoEmailReceipt),
        taxEnabled: Boolean(s.taxEnabled),
        taxName: s.taxName || 'Tax',
        taxRate: Number(s.taxRate) || 0,
        receiptType: s.receiptType || 'thermal',
        updatedAt: new Date(),
      });
    }
    return { success: true };
  } catch (error) {
    console.error('upsertSettingsForBusiness query failed:', error);
    throw error;
  }
}

export interface RecordSaleParams {
  businessId: string;
  userId?: string;
  transactionId: string;
  sale: any;
}

/**
 * Idempotently records a sale:
 * 1. Checks if transactionId or sale.id already exists. If yes, returns existing sale (isDuplicate: true).
 * 2. Checks idempotency_keys table. If completed, returns cached result.
 * 3. Checks invoice_number uniqueness; generates non-colliding number if duplicate.
 * 4. Deducts stock only once per product.
 * 5. Records stock movements only once.
 * 6. Updates customer credit/balance only once.
 * 7. Records sale only once in database.
 */
export async function recordSaleIdempotent({
  businessId,
  userId,
  transactionId,
  sale,
}: RecordSaleParams) {
  const effectiveUserId = userId || businessId;
  const effectiveTxId = transactionId || sale.transactionId || sale.id;

  try {
    // 1. Check if sale with this transactionId or id already exists
    const existingSales = await db
      .select()
      .from(sales)
      .where(
        or(
          eq(sales.transactionId, effectiveTxId),
          eq(sales.id, sale.id)
        )
      )
      .limit(1);

    if (existingSales.length > 0) {
      const existing = existingSales[0];
      return {
        success: true,
        isDuplicate: true,
        sale: {
          ...existing,
          id: existing.id,
          transactionId: existing.transactionId || effectiveTxId,
          invoiceNumber: existing.invoiceNumber,
          date: existing.date,
          customerId: existing.customerId || undefined,
          customerName: existing.customerName,
          customerPhone: existing.customerPhone || undefined,
          customerEmail: existing.customerEmail || undefined,
          paymentType: existing.paymentType,
          paymentMethod: existing.paymentMethod || existing.paymentType,
          status: existing.status,
          items: existing.items || [],
          subtotal: existing.subtotal,
          discount: existing.discount,
          tax: existing.tax || 0,
          taxRate: existing.taxRate || 0,
          taxName: existing.taxName || undefined,
          total: existing.total,
          profit: existing.profit,
          cogs: existing.cogs,
          paid: existing.paid,
          refundedAmount: existing.refundedAmount || 0,
          notes: existing.notes || undefined,
        },
        message: 'Duplicate transaction ID detected; existing sale returned without duplicate deduction.',
      };
    }

    // 2. Check idempotency keys table
    const existingKey = await db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, effectiveTxId))
      .limit(1);

    if (existingKey.length > 0 && existingKey[0].status === 'completed' && existingKey[0].responseBody) {
      const cached = (existingKey[0].responseBody as any).sale;
      return {
        success: true,
        isDuplicate: true,
        sale: cached,
        message: 'Transaction already completed previously. Returned existing transaction.',
      };
    }

    // 3. Mark idempotency key as in_progress
    await db
      .insert(idempotencyKeys)
      .values({
        key: effectiveTxId,
        businessId,
        userId: effectiveUserId,
        resourceId: sale.id,
        resourceType: 'sale',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: idempotencyKeys.key,
        set: {
          status: 'in_progress',
          updatedAt: new Date(),
        },
      });

    // 4. Ensure Invoice Number does not duplicate
    let finalInvoiceNumber = String(sale.invoiceNumber || '').trim();
    if (!finalInvoiceNumber) {
      const now = new Date();
      finalInvoiceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    }

    const existingInvoice = await db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.invoiceNumber, finalInvoiceNumber),
          or(eq(sales.userId, effectiveUserId), eq(sales.businessId, businessId))
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      // If same transaction ID, it was already handled above. If different, append unique suffix to avoid collision
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      finalInvoiceNumber = `${finalInvoiceNumber}-${uniqueSuffix}`;
    }

    const newSaleId = sale.id || 'sale_' + crypto.randomUUID().replace(/-/g, '');

    const saleRow = {
      id: newSaleId,
      userId: effectiveUserId,
      businessId,
      transactionId: effectiveTxId,
      invoiceNumber: finalInvoiceNumber,
      date: String(sale.date || new Date().toISOString()),
      customerId: sale.customerId ? String(sale.customerId) : null,
      customerName: String(sale.customerName || 'Walk-in Customer'),
      customerPhone: sale.customerPhone ? String(sale.customerPhone) : null,
      customerEmail: sale.customerEmail ? String(sale.customerEmail) : null,
      paymentType: String(sale.paymentType || 'cash'),
      paymentMethod: String(sale.paymentMethod || sale.paymentType || 'cash'),
      status: String(sale.status || (sale.paymentType === 'cash' ? 'completed' : 'unpaid')),
      items: Array.isArray(sale.items) ? sale.items : [],
      subtotal: Number(sale.subtotal) || 0,
      discount: Number(sale.discount) || 0,
      tax: Number(sale.tax) || 0,
      taxRate: Number(sale.taxRate) || 0,
      taxName: sale.taxName ? String(sale.taxName) : null,
      total: Number(sale.total) || 0,
      profit: Number(sale.profit) || 0,
      cogs: Number(sale.cogs) || 0,
      paid: Number(sale.paid) || 0,
      refundedAmount: Number(sale.refundedAmount) || 0,
      notes: sale.notes ? String(sale.notes) : null,
      createdAt: new Date(),
    };

    // 5. Insert sale into database
    await db.insert(sales).values(saleRow);

    // 6. Deduct stock and record stock movements
    if (Array.isArray(sale.items) && sale.items.length > 0) {
      for (const item of sale.items) {
        if (!item.productId) continue;
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) continue;

        const [prod] = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.id, item.productId),
              or(eq(products.businessId, businessId), eq(products.userId, effectiveUserId))
            )
          )
          .limit(1);

        if (prod) {
          const currentStock = Number(prod.stock) || 0;
          const newStock = Math.max(0, currentStock - qty);

          await db
            .update(products)
            .set({ stock: newStock })
            .where(eq(products.id, prod.id));

          const movId = 'mov_' + crypto.randomUUID().replace(/-/g, '');
          await db.insert(stockMovements).values({
            id: movId,
            businessId,
            userId: effectiveUserId,
            productId: prod.id,
            productName: prod.name,
            type: 'sale',
            quantity: -qty,
            stockBefore: currentStock,
            stockAfter: newStock,
            reason: `Sale ${finalInvoiceNumber}`,
            relatedInvoice: finalInvoiceNumber,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 7. Update customer balance if credit sale
    if (sale.paymentType === 'credit' && sale.customerName) {
      const creditRemaining = (Number(sale.total) || 0) - (Number(sale.paid) || 0);

      const [cust] = await db
        .select()
        .from(customers)
        .where(
          and(
            sale.customerId ? eq(customers.id, sale.customerId) : eq(customers.name, sale.customerName),
            or(eq(customers.businessId, businessId), eq(customers.userId, effectiveUserId))
          )
        )
        .limit(1);

      if (cust) {
        const curCredit = Number(cust.totalCredit) || 0;
        const curRemaining = Number(cust.remaining) || 0;
        const curPaid = Number(cust.totalPaid) || 0;

        await db
          .update(customers)
          .set({
            totalCredit: curCredit + (creditRemaining > 0 ? creditRemaining : 0),
            remaining: curRemaining + (creditRemaining > 0 ? creditRemaining : 0),
            totalPaid: curPaid + (Number(sale.paid) || 0),
            lastPaymentDate: Number(sale.paid) > 0 ? sale.date : cust.lastPaymentDate,
          })
          .where(eq(customers.id, cust.id));
      }
    }

    // 8. Update idempotency key to completed
    await db
      .update(idempotencyKeys)
      .set({
        status: 'completed',
        responseBody: { sale: saleRow },
        updatedAt: new Date(),
      })
      .where(eq(idempotencyKeys.key, effectiveTxId));

    return {
      success: true,
      isDuplicate: false,
      sale: saleRow,
    };
  } catch (error: any) {
    // If unique constraint violation on transactionId (error code 23505)
    if (error?.code === '23505' || String(error?.message).includes('duplicate key')) {
      console.warn(`Idempotency race resolved: duplicate transaction ${effectiveTxId}`);
      const [existing] = await db
        .select()
        .from(sales)
        .where(
          or(
            eq(sales.transactionId, effectiveTxId),
            eq(sales.id, sale.id)
          )
        )
        .limit(1);

      if (existing) {
        return {
          success: true,
          isDuplicate: true,
          sale: existing,
          message: 'Concurrent duplicate detected; returning existing completed sale.',
        };
      }
    }

    console.error('recordSaleIdempotent error:', error);
    throw error;
  }
}

export interface RecordSaleReturnParams {
  businessId: string;
  userId?: string;
  transactionId?: string;
  saleReturn: {
    id: string;
    saleId: string;
    invoiceNumber: string;
    customerId?: string;
    customerName: string;
    date: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      sellingPrice: number;
      purchasePrice: number;
      total?: number;
      cogs?: number;
    }>;
    refundAmount: number;
    refundMethod: 'cash' | 'bank' | 'card' | 'credit_adjustment' | 'other';
    reason: string;
    createdAt?: string;
  };
  options?: {
    restock?: boolean;
    refundMethod?: 'cash' | 'bank' | 'card' | 'credit_adjustment' | 'other';
  };
}

/**
 * Authoritative, Idempotent Sale Return Processor.
 * 
 * Guarantees:
 * 1. Checks idempotency to prevent duplicate returns/refunds.
 * 2. Validates return quantities against original sale and previous returns.
 * 3. Never deletes the original sale; updates refundedAmount and status.
 * 4. Correctly restocks inventory and logs stock_return movements.
 * 5. Correctly corrects customer credit balance and records ledger adjustment.
 * 6. Creates clear return/refund record linked to original sale.
 */
export async function recordSaleReturnIdempotent(params: RecordSaleReturnParams) {
  const { businessId, userId, transactionId, saleReturn, options } = params;
  const effectiveUserId = userId || 'anonymous';
  const effectiveTxId = String(transactionId || saleReturn.id || '').trim();
  const shouldRestock = options?.restock !== false;
  const effectiveRefundMethod = options?.refundMethod || saleReturn.refundMethod || 'cash';

  try {
    // 1. Check if this exact return record was already processed
    const [existingReturn] = await db
      .select()
      .from(saleReturns)
      .where(
        and(
          eq(saleReturns.id, saleReturn.id),
          or(eq(saleReturns.businessId, businessId), eq(saleReturns.userId, effectiveUserId))
        )
      )
      .limit(1);

    if (existingReturn) {
      console.log(`[Return Protection] Existing return detected: ${existingReturn.id}`);
      return {
        success: true,
        isDuplicate: true,
        saleReturn: existingReturn,
        message: 'Duplicate return request detected; existing return record returned without re-crediting.',
      };
    }

    // 2. Check idempotency keys table
    const [existingKey] = await db
      .select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, effectiveTxId))
      .limit(1);

    if (existingKey && existingKey.status === 'completed' && existingKey.responseBody) {
      const cached = (existingKey.responseBody as any).saleReturn;
      return {
        success: true,
        isDuplicate: true,
        saleReturn: cached,
        message: 'Return transaction already completed previously. Returned existing transaction.',
      };
    }

    // 3. Mark idempotency key as in_progress
    await db
      .insert(idempotencyKeys)
      .values({
        key: effectiveTxId,
        businessId,
        userId: effectiveUserId,
        resourceId: saleReturn.id,
        resourceType: 'sale_return',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: idempotencyKeys.key,
        set: {
          status: 'in_progress',
          updatedAt: new Date(),
        },
      });

    // 4. Fetch and validate original sale (Original sale must NEVER be deleted)
    const [originalSale] = await db
      .select()
      .from(sales)
      .where(
        and(
          or(eq(sales.id, saleReturn.saleId), eq(sales.invoiceNumber, saleReturn.invoiceNumber)),
          or(eq(sales.businessId, businessId), eq(sales.userId, effectiveUserId))
        )
      )
      .limit(1);

    if (!originalSale) {
      throw new Error(`Original sale with ID ${saleReturn.saleId} or invoice ${saleReturn.invoiceNumber} not found.`);
    }

    // 5. Fetch all existing returns for this sale to validate remaining returnable quantities
    const priorReturns = await db
      .select()
      .from(saleReturns)
      .where(
        and(
          or(eq(saleReturns.saleId, originalSale.id), eq(saleReturns.invoiceNumber, originalSale.invoiceNumber)),
          or(eq(saleReturns.businessId, businessId), eq(saleReturns.userId, effectiveUserId))
        )
      );

    const alreadyReturnedMap: Record<string, number> = {};
    priorReturns.forEach((pRet) => {
      if (Array.isArray(pRet.items)) {
        pRet.items.forEach((it: any) => {
          if (it.productId) {
            alreadyReturnedMap[it.productId] = (alreadyReturnedMap[it.productId] || 0) + (Number(it.quantity) || 0);
          }
        });
      }
    });

    const originalItems: any[] = Array.isArray(originalSale.items) ? originalSale.items : [];
    const requestedItems = Array.isArray(saleReturn.items) ? saleReturn.items : [];

    // Verify quantity cannot exceed originally sold quantity minus previous returns
    for (const reqItem of requestedItems) {
      const origItem = originalItems.find((oi: any) => oi.productId === reqItem.productId);
      const originalSoldQty = origItem ? Number(origItem.quantity) || 0 : 0;
      const alreadyReturnedQty = alreadyReturnedMap[reqItem.productId] || 0;
      const maxReturnable = Math.max(0, originalSoldQty - alreadyReturnedQty);

      if (reqItem.quantity > maxReturnable) {
        throw new Error(
          `Cannot return ${reqItem.quantity} unit(s) of "${reqItem.productName}". Maximum remaining returnable is ${maxReturnable}.`
        );
      }
    }

    // 6. Calculate exact refund total and update original sale
    const currentRefundedOnSale = Number(originalSale.refundedAmount) || 0;
    const saleTotal = Number(originalSale.total) || 0;
    const maxRefundableAmount = Math.max(0, saleTotal - currentRefundedOnSale);
    const calculatedRefund = Math.min(maxRefundableAmount, Math.max(0, Number(saleReturn.refundAmount) || 0));

    const newRefundedTotal = currentRefundedOnSale + calculatedRefund;
    const newSaleStatus = newRefundedTotal >= saleTotal ? 'refunded' : 'partially_refunded';

    await db
      .update(sales)
      .set({
        refundedAmount: newRefundedTotal,
        status: newSaleStatus,
      })
      .where(eq(sales.id, originalSale.id));

    // 7. Restock products and log stock movement if requested
    if (shouldRestock && requestedItems.length > 0) {
      for (const item of requestedItems) {
        if (!item.productId || Number(item.quantity) <= 0) continue;
        const returnQty = Number(item.quantity);

        const [prod] = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.id, item.productId),
              or(eq(products.businessId, businessId), eq(products.userId, effectiveUserId))
            )
          )
          .limit(1);

        if (prod) {
          const currentStock = Number(prod.stock) || 0;
          const newStock = currentStock + returnQty;

          await db
            .update(products)
            .set({ stock: newStock })
            .where(eq(products.id, prod.id));

          const movId = 'mov_' + crypto.randomUUID().replace(/-/g, '');
          await db.insert(stockMovements).values({
            id: movId,
            businessId,
            userId: effectiveUserId,
            productId: prod.id,
            productName: prod.name,
            type: 'sale_return',
            quantity: returnQty,
            stockBefore: currentStock,
            stockAfter: newStock,
            reason: `Return on invoice #${originalSale.invoiceNumber}: ${saleReturn.reason || 'Customer Return'}`,
            relatedInvoice: originalSale.invoiceNumber,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 8. Adjust Customer balance if refundMethod is credit_adjustment
    let updatedCustomerRow: any = null;
    if (effectiveRefundMethod === 'credit_adjustment' && calculatedRefund > 0) {
      const customerIdentifier = saleReturn.customerId || originalSale.customerId;
      const [cust] = await db
        .select()
        .from(customers)
        .where(
          and(
            customerIdentifier
              ? eq(customers.id, customerIdentifier)
              : eq(customers.name, originalSale.customerName),
            or(eq(customers.businessId, businessId), eq(customers.userId, effectiveUserId))
          )
        )
        .limit(1);

      if (cust) {
        const curRemaining = Number(cust.remaining) || 0;
        const curCredit = Number(cust.totalCredit) || 0;
        const newRemaining = Math.max(0, curRemaining - calculatedRefund);
        const newCredit = Math.max(0, curCredit - calculatedRefund);

        const currentPayments: any[] = Array.isArray(cust.payments) ? cust.payments : [];
        const adjEntry = {
          id: 'ret_adj_' + crypto.randomUUID().replace(/-/g, ''),
          customerId: cust.id,
          amount: calculatedRefund,
          date: saleReturn.date || new Date().toISOString(),
          paymentMethod: 'other',
          note: `Credit Adjustment (Return #${originalSale.invoiceNumber})`,
        };

        const updatedPayments = [adjEntry, ...currentPayments];

        await db
          .update(customers)
          .set({
            remaining: newRemaining,
            totalCredit: newCredit,
            payments: updatedPayments,
          })
          .where(eq(customers.id, cust.id));

        updatedCustomerRow = {
          ...cust,
          remaining: newRemaining,
          totalCredit: newCredit,
          payments: updatedPayments,
        };
      }
    }

    // 9. Insert return record into sale_returns table
    const returnRow = {
      id: saleReturn.id,
      businessId,
      userId: effectiveUserId,
      saleId: originalSale.id,
      invoiceNumber: originalSale.invoiceNumber,
      customerId: saleReturn.customerId || originalSale.customerId || null,
      customerName: saleReturn.customerName || originalSale.customerName,
      date: saleReturn.date || new Date().toISOString(),
      items: requestedItems,
      refundAmount: calculatedRefund,
      refundMethod: effectiveRefundMethod,
      reason: saleReturn.reason || 'Customer Return',
      createdAt: saleReturn.createdAt || new Date().toISOString(),
    };

    await db.insert(saleReturns).values(returnRow);

    // 10. Complete idempotency key
    await db
      .update(idempotencyKeys)
      .set({
        status: 'completed',
        responseBody: {
          saleReturn: returnRow,
          updatedSale: {
            ...originalSale,
            refundedAmount: newRefundedTotal,
            status: newSaleStatus,
          },
        },
        updatedAt: new Date(),
      })
      .where(eq(idempotencyKeys.key, effectiveTxId));

    return {
      success: true,
      isDuplicate: false,
      saleReturn: returnRow,
      updatedSale: {
        ...originalSale,
        refundedAmount: newRefundedTotal,
        status: newSaleStatus,
      },
      updatedCustomer: updatedCustomerRow,
      message: 'Sale return successfully processed and audited.',
    };
  } catch (error: any) {
    console.error('recordSaleReturnIdempotent error:', error);
    throw error;
  }
}
