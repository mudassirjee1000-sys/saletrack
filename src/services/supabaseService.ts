import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import {
  Business,
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
} from "../types";

/**
 * Multi-Tenant Data Service
 * Strictly isolates every store's data by business_id.
 * Starts all brand-new businesses with 100% EMPTY data.
 * Zero cross-tenant data sharing.
 */

function getTenantKey(businessId: string, collection: string): string {
  return `saletrack_tenant_${businessId}_${collection}`;
}

function getLocalTenantData<T>(businessId: string, collection: string): T[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(getTenantKey(businessId, collection));
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

function setLocalTenantData<T>(businessId: string, collection: string, data: T[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(getTenantKey(businessId, collection), JSON.stringify(data));
    }
  } catch (e) {
    // ignore
  }
}

function getLocalBusinesses(): Business[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("saletrack_tenant_businesses");
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

function saveLocalBusiness(biz: Business): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const all = getLocalBusinesses().filter((b) => b.id !== biz.id);
      all.push(biz);
      window.localStorage.setItem("saletrack_tenant_businesses", JSON.stringify(all));
    }
  } catch (e) {
    // ignore
  }
}

export async function fetchBusinessForUser(userId: string): Promise<Business | null> {
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .or(`owner_user_id.eq.${userId},user_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as Business;
      }
    } catch (err: any) {
      console.warn("fetchBusinessForUser remote failed, trying tenant storage:", err?.message);
    }
  }

  const local = getLocalBusinesses().find(
    (b) => b.owner_user_id === userId || b.user_id === userId
  );
  return local || null;
}

export async function createBusinessInSupabase(
  payload: Omit<Business, "id" | "created_at" | "updated_at">
): Promise<Business> {
  const id = "biz_" + crypto.randomUUID().replace(/-/g, "");

  const newBusiness: Business = {
    ...payload,
    id,
    user_id: payload.owner_user_id,
    owner_user_id: payload.owner_user_id,
    business_name: payload.business_name,
    name: payload.business_name,
    owner_name: payload.owner_name,
    owner_email: payload.owner_email || payload.business_email || "",
    status: payload.status || "active",
    plan: payload.plan || "SaleTrack Pro — $4/month",
    subscription_status: payload.subscription_status || "trial",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("businesses")
        .insert([newBusiness])
        .select()
        .maybeSingle();

      if (!error && data) {
        saveLocalBusiness(data as Business);
        return data as Business;
      }
    } catch (err: any) {
      console.warn("Supabase createBusiness failed, saving to tenant storage:", err?.message);
    }
  }

  saveLocalBusiness(newBusiness);
  return newBusiness;
}

export async function updateBusinessInSupabase(
  businessId: string,
  updates: Partial<Business>
): Promise<Business> {
  const updatedTime = new Date().toISOString();
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("businesses")
        .update({ ...updates, updated_at: updatedTime })
        .eq("id", businessId)
        .select()
        .single();

      if (!error && data) {
        saveLocalBusiness(data as Business);
        return data as Business;
      }
    } catch (err) {
      console.warn("Update business remote failed:", err);
    }
  }

  const existing = getLocalBusinesses().find((b) => b.id === businessId);
  const updated: Business = {
    ...(existing || ({} as Business)),
    ...updates,
    id: businessId,
    updated_at: updatedTime,
  } as Business;

  saveLocalBusiness(updated);
  return updated;
}

// ---------------- PRODUCTS ----------------

export async function fetchProductsForBusiness(businessId: string): Promise<Product[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("products")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || "",
          barcode: p.barcode || undefined,
          unit: p.unit || "Piece",
          purchasePrice: Number(p.purchase_price) || 0,
          sellingPrice: Number(p.selling_price) || 0,
          stock: Number(p.quantity ?? p.stock ?? 0),
          minStock: Number(p.min_stock ?? 5),
          maxStock: p.max_stock ? Number(p.max_stock) : undefined,
          category: p.category || "",
          imageUrl: p.image_url || undefined,
          createdAt: p.created_at || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn("fetchProducts remote failed, loading tenant store:", err?.message);
    }
  }

  return getLocalTenantData<Product>(businessId, "products");
}

export async function upsertProductInSupabase(
  businessId: string,
  product: Product
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: product.id || "prod_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || null,
        unit: product.unit || "Piece",
        purchase_price: product.purchasePrice,
        selling_price: product.sellingPrice,
        quantity: product.stock,
        stock: product.stock,
        min_stock: product.minStock,
        max_stock: product.maxStock || null,
        category: product.category || "",
        image_url: product.imageUrl || null,
        created_at: product.createdAt || new Date().toISOString(),
      };

      const { error } = await sb.from("products").upsert(payload);
      if (!error) {
        const items = getLocalTenantData<Product>(businessId, "products");
        const idx = items.findIndex((p) => p.id === product.id);
        if (idx >= 0) items[idx] = product;
        else items.unshift(product);
        setLocalTenantData(businessId, "products", items);
        return;
      }
    } catch (err: any) {
      console.warn("upsertProduct remote failed, falling back to tenant storage:", err?.message);
    }
  }

  const items = getLocalTenantData<Product>(businessId, "products");
  const idx = items.findIndex((p) => p.id === product.id);
  if (idx >= 0) items[idx] = product;
  else items.unshift(product);
  setLocalTenantData(businessId, "products", items);
}

export async function deleteProductInSupabase(
  businessId: string,
  productId: string
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb.from("products").delete().eq("id", productId).eq("business_id", businessId);
    } catch (err) {
      console.warn("deleteProduct remote failed:", err);
    }
  }

  const items = getLocalTenantData<Product>(businessId, "products").filter(
    (p) => p.id !== productId
  );
  setLocalTenantData(businessId, "products", items);
}

// ---------------- SALES ----------------

export async function fetchSalesForBusiness(businessId: string): Promise<Sale[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("sales")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (!error && data) {
        return data.map((s: any) => ({
          id: s.id,
          invoiceNumber: s.invoice_number || "",
          customerId: s.customer_id || undefined,
          customerName: s.customer_name || "Walk-in Customer",
          customerPhone: s.customer_phone || undefined,
          customerEmail: s.customer_email || undefined,
          date: s.date,
          paymentType: s.payment_type || "cash",
          paymentMethod: s.payment_method || "cash",
          status: s.status || "completed",
          items: s.items || [],
          subtotal: Number(s.subtotal) || 0,
          discount: Number(s.discount) || 0,
          tax: Number(s.tax) || 0,
          taxRate: s.tax_rate ? Number(s.tax_rate) : undefined,
          taxName: s.tax_name || undefined,
          total: Number(s.total) || 0,
          profit: Number(s.profit) || 0,
          cogs: s.cogs ? Number(s.cogs) : undefined,
          paid: Number(s.paid ?? s.paid_amount ?? s.total) || 0,
          refundedAmount: s.refunded_amount ? Number(s.refunded_amount) : undefined,
          notes: s.notes || undefined,
        }));
      }
    } catch (err: any) {
      console.warn("fetchSales remote failed:", err?.message);
    }
  }

  return getLocalTenantData<Sale>(businessId, "sales");
}

export async function upsertSaleInSupabase(businessId: string, sale: Sale): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: sale.id || "sale_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        invoice_number: sale.invoiceNumber,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName,
        customer_phone: sale.customerPhone || null,
        customer_email: sale.customerEmail || null,
        date: sale.date,
        payment_type: sale.paymentType,
        payment_method: sale.paymentMethod || sale.paymentType,
        status: sale.status || "completed",
        items: sale.items || [],
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax || 0,
        tax_rate: sale.taxRate || 0,
        tax_name: sale.taxName || null,
        total: sale.total,
        profit: sale.profit,
        cogs: sale.cogs || 0,
        paid: sale.paid,
        refunded_amount: sale.refundedAmount || 0,
        notes: sale.notes || null,
      };

      const { error } = await sb.from("sales").upsert(payload);
      if (!error) {
        const items = getLocalTenantData<Sale>(businessId, "sales");
        const idx = items.findIndex((s) => s.id === sale.id);
        if (idx >= 0) items[idx] = sale;
        else items.unshift(sale);
        setLocalTenantData(businessId, "sales", items);
        return;
      }
    } catch (err: any) {
      console.warn("upsertSale remote failed:", err?.message);
    }
  }

  const items = getLocalTenantData<Sale>(businessId, "sales");
  const idx = items.findIndex((s) => s.id === sale.id);
  if (idx >= 0) items[idx] = sale;
  else items.unshift(sale);
  setLocalTenantData(businessId, "sales", items);
}

export async function deleteSaleInSupabase(businessId: string, saleId: string): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb.from("sales").delete().eq("id", saleId).eq("business_id", businessId);
    } catch (err) {
      console.warn("deleteSale remote failed:", err);
    }
  }

  const items = getLocalTenantData<Sale>(businessId, "sales").filter((s) => s.id !== saleId);
  setLocalTenantData(businessId, "sales", items);
}

// ---------------- SALE RETURNS ----------------

export async function fetchSaleReturnsForBusiness(businessId: string): Promise<SaleReturn[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("sale_returns")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          saleId: r.sale_id,
          invoiceNumber: r.invoice_number || "",
          customerId: r.customer_id || undefined,
          customerName: r.customer_name || "Customer",
          date: r.date,
          items: r.items || [],
          refundAmount: Number(r.refund_amount ?? r.total_refund) || 0,
          refundMethod: r.refund_method || "cash",
          reason: r.reason || "",
          createdAt: r.created_at || r.date,
        }));
      }
    } catch (err: any) {
      console.warn("fetchSaleReturns remote failed:", err?.message);
    }
  }

  return getLocalTenantData<SaleReturn>(businessId, "sale_returns");
}

export async function upsertSaleReturnInSupabase(
  businessId: string,
  ret: SaleReturn
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: ret.id || "ret_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        sale_id: ret.saleId,
        invoice_number: ret.invoiceNumber,
        customer_id: ret.customerId || null,
        customer_name: ret.customerName,
        date: ret.date,
        items: ret.items || [],
        refund_amount: ret.refundAmount,
        refund_method: ret.refundMethod,
        reason: ret.reason || "",
        created_at: ret.createdAt || ret.date,
      };

      await sb.from("sale_returns").upsert(payload);
    } catch (err) {
      console.warn("upsertSaleReturn remote failed:", err);
    }
  }

  const items = getLocalTenantData<SaleReturn>(businessId, "sale_returns");
  const idx = items.findIndex((r) => r.id === ret.id);
  if (idx >= 0) items[idx] = ret;
  else items.unshift(ret);
  setLocalTenantData(businessId, "sale_returns", items);
}

export const createSaleReturnInSupabase = upsertSaleReturnInSupabase;

// ---------------- STOCK MOVEMENTS ----------------

export async function fetchStockMovementsForBusiness(
  businessId: string
): Promise<StockMovement[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("stock_movements")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((m: any) => ({
          id: m.id,
          productId: m.product_id,
          productName: m.product_name || "Product",
          quantity: Number(m.quantity) || 0,
          type: m.type,
          reason: m.reason || "",
          date: m.date || m.created_at || new Date().toISOString(),
          relatedInvoice: m.related_invoice || undefined,
          relatedPurchase: m.related_purchase || undefined,
          stockBefore: m.stock_before ? Number(m.stock_before) : undefined,
          stockAfter: m.stock_after ? Number(m.stock_after) : undefined,
          createdAt: m.created_at || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn("fetchStockMovements remote failed:", err?.message);
    }
  }

  return getLocalTenantData<StockMovement>(businessId, "stock_movements");
}

export async function upsertStockMovementInSupabase(
  businessId: string,
  mov: StockMovement
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: mov.id || "mov_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        product_id: mov.productId,
        product_name: mov.productName,
        type: mov.type,
        quantity: mov.quantity,
        reason: mov.reason || "",
        date: mov.date,
        related_invoice: mov.relatedInvoice || null,
        related_purchase: mov.relatedPurchase || null,
        stock_before: mov.stockBefore || null,
        stock_after: mov.stockAfter || null,
        created_at: mov.createdAt || new Date().toISOString(),
      };

      await sb.from("stock_movements").upsert(payload);
    } catch (err) {
      console.warn("upsertStockMovement remote failed:", err);
    }
  }

  const items = getLocalTenantData<StockMovement>(businessId, "stock_movements");
  items.unshift(mov);
  setLocalTenantData(businessId, "stock_movements", items);
}

export const createStockMovementInSupabase = upsertStockMovementInSupabase;

// ---------------- EXPENSES ----------------

export async function fetchExpensesForBusiness(businessId: string): Promise<Expense[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("expenses")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (!error && data) {
        return data.map((e: any) => ({
          id: e.id,
          name: e.name || e.description || e.category || "Expense",
          category: e.category,
          amount: Number(e.amount) || 0,
          date: e.date,
          note: e.note || e.description || undefined,
          createdAt: e.created_at || e.date,
        }));
      }
    } catch (err: any) {
      console.warn("fetchExpenses remote failed:", err?.message);
    }
  }

  return getLocalTenantData<Expense>(businessId, "expenses");
}

export async function upsertExpenseInSupabase(
  businessId: string,
  exp: Expense
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: exp.id || "exp_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        name: exp.name,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        note: exp.note || null,
        created_at: exp.createdAt || exp.date,
      };

      await sb.from("expenses").upsert(payload);
    } catch (err) {
      console.warn("upsertExpense remote failed:", err);
    }
  }

  const items = getLocalTenantData<Expense>(businessId, "expenses");
  const idx = items.findIndex((e) => e.id === exp.id);
  if (idx >= 0) items[idx] = exp;
  else items.unshift(exp);
  setLocalTenantData(businessId, "expenses", items);
}

export async function deleteExpenseInSupabase(
  businessId: string,
  expenseId: string
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb.from("expenses").delete().eq("id", expenseId).eq("business_id", businessId);
    } catch (err) {
      console.warn("deleteExpense remote failed:", err);
    }
  }

  const items = getLocalTenantData<Expense>(businessId, "expenses").filter(
    (e) => e.id !== expenseId
  );
  setLocalTenantData(businessId, "expenses", items);
}

// ---------------- CUSTOMERS ----------------

export async function fetchCustomersForBusiness(businessId: string): Promise<Customer[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("customers")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true });

      if (!error && data) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || "",
          email: c.email || undefined,
          address: c.address || undefined,
          creditLimit: c.credit_limit ? Number(c.credit_limit) : undefined,
          totalCredit: Number(c.total_credit ?? c.balance ?? 0),
          totalPaid: Number(c.total_paid ?? 0),
          remaining: Number(c.remaining ?? c.balance ?? 0),
          payments: c.payments || [],
          lastPaymentDate: c.last_payment_date || undefined,
          createdAt: c.created_at || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn("fetchCustomers remote failed:", err?.message);
    }
  }

  return getLocalTenantData<Customer>(businessId, "customers");
}

export async function upsertCustomerInSupabase(
  businessId: string,
  cust: Customer
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: cust.id || "cust_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        name: cust.name,
        phone: cust.phone || "",
        email: cust.email || null,
        address: cust.address || null,
        credit_limit: cust.creditLimit || null,
        total_credit: cust.totalCredit,
        total_paid: cust.totalPaid,
        remaining: cust.remaining,
        payments: cust.payments || [],
        last_payment_date: cust.lastPaymentDate || null,
        created_at: cust.createdAt || new Date().toISOString(),
      };

      await sb.from("customers").upsert(payload);
    } catch (err) {
      console.warn("upsertCustomer remote failed:", err);
    }
  }

  const items = getLocalTenantData<Customer>(businessId, "customers");
  const idx = items.findIndex((c) => c.id === cust.id);
  if (idx >= 0) items[idx] = cust;
  else items.push(cust);
  setLocalTenantData(businessId, "customers", items);
}

export async function deleteCustomerInSupabase(
  businessId: string,
  customerId: string
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb.from("customers").delete().eq("id", customerId).eq("business_id", businessId);
    } catch (err) {
      console.warn("deleteCustomer remote failed:", err);
    }
  }

  const items = getLocalTenantData<Customer>(businessId, "customers").filter(
    (c) => c.id !== customerId
  );
  setLocalTenantData(businessId, "customers", items);
}

// ---------------- VENDORS ----------------

export async function fetchVendorsForBusiness(businessId: string): Promise<Vendor[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("vendors")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true });

      if (!error && data) {
        return data.map((v: any) => ({
          id: v.id,
          name: v.name,
          companyName: v.company_name || v.name,
          phone: v.phone || "",
          email: v.email || undefined,
          address: v.address || undefined,
          openingBalance: Number(v.opening_balance ?? 0),
          paymentTerms: v.payment_terms || undefined,
          notes: v.notes || undefined,
          totalPurchased: Number(v.total_purchased ?? 0),
          totalPaid: Number(v.total_paid ?? 0),
          remainingBalance: Number(v.remaining_balance ?? v.balance ?? 0),
          lastPaymentDate: v.last_payment_date || undefined,
          createdAt: v.created_at || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      console.warn("fetchVendors remote failed:", err?.message);
    }
  }

  return getLocalTenantData<Vendor>(businessId, "vendors");
}

export async function upsertVendorInSupabase(businessId: string, vend: Vendor): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: vend.id || "vend_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        name: vend.name,
        company_name: vend.companyName,
        phone: vend.phone || "",
        email: vend.email || null,
        address: vend.address || null,
        opening_balance: vend.openingBalance || 0,
        payment_terms: vend.paymentTerms || null,
        notes: vend.notes || null,
        total_purchased: vend.totalPurchased || 0,
        total_paid: vend.totalPaid || 0,
        remaining_balance: vend.remainingBalance || 0,
        last_payment_date: vend.lastPaymentDate || null,
        created_at: vend.createdAt || new Date().toISOString(),
      };

      await sb.from("vendors").upsert(payload);
    } catch (err) {
      console.warn("upsertVendor remote failed:", err);
    }
  }

  const items = getLocalTenantData<Vendor>(businessId, "vendors");
  const idx = items.findIndex((v) => v.id === vend.id);
  if (idx >= 0) items[idx] = vend;
  else items.push(vend);
  setLocalTenantData(businessId, "vendors", items);
}

export async function deleteVendorInSupabase(
  businessId: string,
  vendorId: string
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb.from("vendors").delete().eq("id", vendorId).eq("business_id", businessId);
    } catch (err) {
      console.warn("deleteVendor remote failed:", err);
    }
  }

  const items = getLocalTenantData<Vendor>(businessId, "vendors").filter(
    (v) => v.id !== vendorId
  );
  setLocalTenantData(businessId, "vendors", items);
}

// ---------------- VENDOR PURCHASES ----------------

export async function fetchVendorPurchasesForBusiness(
  businessId: string
): Promise<VendorPurchase[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("vendor_purchases")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (!error && data) {
        return data.map((p: any) => ({
          id: p.id,
          vendorId: p.vendor_id,
          vendorName: p.vendor_name,
          companyName: p.company_name || undefined,
          invoiceNumber: p.invoice_number,
          date: p.date,
          items: p.items || [],
          totalAmount: Number(p.total_amount) || 0,
          paidAmount: Number(p.paid_amount) || 0,
          remainingBalance: Number(p.remaining_balance ?? p.due_amount ?? 0),
          paymentStatus: p.payment_status || "paid",
          notes: p.notes || undefined,
          createdAt: p.created_at || p.date,
        }));
      }
    } catch (err: any) {
      console.warn("fetchVendorPurchases remote failed:", err?.message);
    }
  }

  return getLocalTenantData<VendorPurchase>(businessId, "vendor_purchases");
}

export async function upsertVendorPurchaseInSupabase(
  businessId: string,
  purchase: VendorPurchase
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: purchase.id || "vp_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        vendor_id: purchase.vendorId,
        vendor_name: purchase.vendorName,
        company_name: purchase.companyName || null,
        invoice_number: purchase.invoiceNumber,
        date: purchase.date,
        items: purchase.items || [],
        total_amount: purchase.totalAmount,
        paid_amount: purchase.paidAmount,
        remaining_balance: purchase.remainingBalance,
        payment_status: purchase.paymentStatus,
        notes: purchase.notes || null,
        created_at: purchase.createdAt || purchase.date,
      };

      await sb.from("vendor_purchases").upsert(payload);
    } catch (err) {
      console.warn("upsertVendorPurchase remote failed:", err);
    }
  }

  const items = getLocalTenantData<VendorPurchase>(businessId, "vendor_purchases");
  const idx = items.findIndex((p) => p.id === purchase.id);
  if (idx >= 0) items[idx] = purchase;
  else items.unshift(purchase);
  setLocalTenantData(businessId, "vendor_purchases", items);
}

export async function deleteVendorPurchaseInSupabase(
  businessId: string,
  purchaseId: string
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      await sb
        .from("vendor_purchases")
        .delete()
        .eq("id", purchaseId)
        .eq("business_id", businessId);
    } catch (err) {
      console.warn("deleteVendorPurchase remote failed:", err);
    }
  }

  const items = getLocalTenantData<VendorPurchase>(businessId, "vendor_purchases").filter(
    (p) => p.id !== purchaseId
  );
  setLocalTenantData(businessId, "vendor_purchases", items);
}

// ---------------- VENDOR PAYMENTS ----------------

export async function fetchVendorPaymentsForBusiness(
  businessId: string
): Promise<VendorPayment[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("vendor_payments")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (!error && data) {
        return data.map((pay: any) => ({
          id: pay.id,
          vendorId: pay.vendor_id,
          vendorName: pay.vendor_name,
          purchaseId: pay.purchase_id || undefined,
          amount: Number(pay.amount) || 0,
          date: pay.date,
          paymentMethod: pay.payment_method || "cash",
          reference: pay.reference || undefined,
          createdAt: pay.created_at || pay.date,
        }));
      }
    } catch (err: any) {
      console.warn("fetchVendorPayments remote failed:", err?.message);
    }
  }

  return getLocalTenantData<VendorPayment>(businessId, "vendor_payments");
}

export async function upsertVendorPaymentInSupabase(
  businessId: string,
  pay: VendorPayment
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: pay.id || "vpay_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        vendor_id: pay.vendorId,
        vendor_name: pay.vendorName || null,
        purchase_id: pay.purchaseId || null,
        amount: pay.amount,
        date: pay.date,
        payment_method: pay.paymentMethod,
        reference: pay.reference || null,
        created_at: pay.createdAt || pay.date,
      };

      await sb.from("vendor_payments").upsert(payload);
    } catch (err) {
      console.warn("upsertVendorPayment remote failed:", err);
    }
  }

  const items = getLocalTenantData<VendorPayment>(businessId, "vendor_payments");
  const idx = items.findIndex((p) => p.id === pay.id);
  if (idx >= 0) items[idx] = pay;
  else items.unshift(pay);
  setLocalTenantData(businessId, "vendor_payments", items);
}

// ---------------- VENDOR RETURNS ----------------

export async function fetchVendorReturnsForBusiness(
  businessId: string
): Promise<VendorReturn[]> {
  if (!businessId) return [];

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("vendor_returns")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          vendorId: r.vendor_id,
          vendorName: r.vendor_name,
          purchaseId: r.purchase_id || undefined,
          invoiceNumber: r.invoice_number || undefined,
          date: r.date,
          items: r.items || [],
          totalAmount: Number(r.total_amount) || 0,
          reason: r.reason || "",
          createdAt: r.created_at || r.date,
        }));
      }
    } catch (err: any) {
      console.warn("fetchVendorReturns remote failed:", err?.message);
    }
  }

  return getLocalTenantData<VendorReturn>(businessId, "vendor_returns");
}

export async function upsertVendorReturnInSupabase(
  businessId: string,
  ret: VendorReturn
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        id: ret.id || "vr_" + crypto.randomUUID().replace(/-/g, ""),
        business_id: businessId,
        vendor_id: ret.vendorId,
        vendor_name: ret.vendorName,
        purchase_id: ret.purchaseId || null,
        invoice_number: ret.invoiceNumber || null,
        date: ret.date,
        items: ret.items || [],
        total_amount: ret.totalAmount,
        reason: ret.reason || "",
        created_at: ret.createdAt || ret.date,
      };

      await sb.from("vendor_returns").upsert(payload);
    } catch (err) {
      console.warn("upsertVendorReturn remote failed:", err);
    }
  }

  const items = getLocalTenantData<VendorReturn>(businessId, "vendor_returns");
  const idx = items.findIndex((r) => r.id === ret.id);
  if (idx >= 0) items[idx] = ret;
  else items.unshift(ret);
  setLocalTenantData(businessId, "vendor_returns", items);
}

// ---------------- SETTINGS ----------------

export async function fetchSettingsForBusiness(
  businessId: string
): Promise<ShopSettings | null> {
  if (!businessId) return null;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("settings")
        .select("*")
        .eq("business_id", businessId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          shopName: data.shop_name || "SaleTrack Store",
          shopPhone: data.shop_phone || "",
          shopAddress: data.shop_address || "",
          currency: data.currency || "$",
          currencyCode: data.currency_code || "USD",
          currencyName: data.currency_name || "US Dollar",
          allowNegativeStock: !!data.allow_negative_stock,
          invoiceFooter: data.invoice_footer || "Thank you for your business!",
          autoEmailReceipt: !!data.auto_email_receipt,
          taxEnabled: !!data.tax_enabled,
          taxName: data.tax_name || "Tax",
          taxRate: data.tax_rate ? Number(data.tax_rate) : 0,
          receiptType: data.receipt_type || "thermal",
        };
      }
    } catch (err: any) {
      console.warn("fetchSettings remote failed:", err?.message);
    }
  }

  const local = getLocalTenantData<ShopSettings>(businessId, "settings");
  return local.length > 0 ? local[0] : null;
}

export async function upsertSettingsInSupabase(
  businessId: string,
  settings: ShopSettings
): Promise<void> {
  if (!businessId) return;

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const payload = {
        business_id: businessId,
        shop_name: settings.shopName,
        shop_phone: settings.shopPhone,
        shop_address: settings.shopAddress,
        currency: settings.currency,
        currency_code: settings.currencyCode || "USD",
        currency_name: settings.currencyName || "US Dollar",
        allow_negative_stock: settings.allowNegativeStock,
        invoice_footer: settings.invoiceFooter,
        auto_email_receipt: settings.autoEmailReceipt || false,
        tax_enabled: settings.taxEnabled || false,
        tax_name: settings.taxName || "Tax",
        tax_rate: settings.taxRate || 0,
        receipt_type: settings.receiptType || "thermal",
        updated_at: new Date().toISOString(),
      };

      await sb.from("settings").upsert(payload, { onConflict: "business_id" });
    } catch (err) {
      console.warn("Failed to update settings in Supabase:", err);
    }
  }

  setLocalTenantData(businessId, "settings", [settings]);
}
