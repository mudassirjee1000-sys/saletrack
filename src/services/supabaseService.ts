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
 * Authoritative Multi-Tenant Supabase Data Service
 * 
 * CORE RULES:
 * 1. Supabase is the SINGLE AUTHORITATIVE source of truth for all business data.
 * 2. NO LocalStorage database persistence or fallback for business data.
 * 3. Every query enforces tenant isolation via business_id.
 * 4. If Supabase is unavailable or an error occurs, throw a clear error to the UI.
 */

function ensureSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set."
    );
  }
  return getSupabase();
}

// ==============================================================================
// ENTITY MAPPERS (Database Snake_case <-> Application CamelCase)
// ==============================================================================

export function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku || "",
    barcode: p.barcode || undefined,
    unit: p.unit || "Piece",
    purchasePrice: Number(p.purchase_price) || 0,
    sellingPrice: Number(p.selling_price) || 0,
    stock: Number(p.stock ?? p.quantity ?? 0),
    minStock: Number(p.min_stock ?? 5),
    category: p.category || "General",
    imageUrl: p.image_url || undefined,
    createdAt: p.created_at || new Date().toISOString(),
  };
}

export function mapSale(s: any): Sale {
  return {
    id: s.id,
    transactionId: s.transaction_id || s.id,
    invoiceNumber: s.invoice_number || `INV-${s.id.slice(0, 6).toUpperCase()}`,
    date: s.date,
    customerId: s.customer_id || undefined,
    customerName: s.customer_name || "Walk-in Customer",
    customerPhone: s.customer_phone || undefined,
    customerEmail: s.customer_email || undefined,
    items: Array.isArray(s.items) ? s.items : [],
    subtotal: Number(s.subtotal) || 0,
    discount: Number(s.discount) || 0,
    tax: Number(s.tax) || 0,
    taxRate: Number(s.tax_rate) || 0,
    taxName: s.tax_name || undefined,
    total: Number(s.total) || 0,
    profit: Number(s.profit) || 0,
    cogs: Number(s.cogs) || 0,
    paid: Number(s.paid ?? s.total) || 0,
    paymentType: (s.payment_type as any) || "cash",
    paymentMethod: s.payment_method || s.payment_type || "cash",
    status: (s.status as any) || "completed",
    refundedAmount: Number(s.refunded_amount) || 0,
    notes: s.notes || undefined,
    createdAt: s.created_at || s.date,
  };
}

export function mapSaleReturn(r: any): SaleReturn {
  return {
    id: r.id,
    saleId: r.sale_id,
    invoiceNumber: r.invoice_number || "",
    customerId: r.customer_id || undefined,
    customerName: r.customer_name || "Customer",
    date: r.date,
    items: Array.isArray(r.items) ? r.items : [],
    refundAmount: Number(r.refund_amount ?? r.total_refund) || 0,
    refundMethod: r.refund_method || "cash",
    reason: r.reason || "",
    createdAt: r.created_at || r.date,
  };
}

export function mapStockMovement(m: any): StockMovement {
  return {
    id: m.id,
    productId: m.product_id,
    productName: m.product_name || "Product",
    quantity: Number(m.quantity) || 0,
    type: m.type,
    reason: m.reason || "",
    date: m.date || m.created_at || new Date().toISOString(),
    relatedInvoice: m.related_invoice || undefined,
    relatedPurchase: m.related_purchase || undefined,
    stockBefore: m.stock_before !== null && m.stock_before !== undefined ? Number(m.stock_before) : undefined,
    stockAfter: m.stock_after !== null && m.stock_after !== undefined ? Number(m.stock_after) : undefined,
    createdAt: m.created_at || new Date().toISOString(),
  };
}

export function mapExpense(e: any): Expense {
  return {
    id: e.id,
    name: e.name || e.description || e.category || "Expense",
    category: e.category,
    amount: Number(e.amount) || 0,
    date: e.date,
    note: e.note || e.description || undefined,
    createdAt: e.created_at || e.date,
  };
}

export function mapCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || "",
    email: c.email || undefined,
    address: c.address || undefined,
    creditLimit: c.credit_limit !== null && c.credit_limit !== undefined ? Number(c.credit_limit) : undefined,
    totalCredit: Number(c.total_credit ?? c.balance ?? 0),
    totalPaid: Number(c.total_paid ?? 0),
    remaining: Number(c.remaining ?? c.balance ?? 0),
    payments: Array.isArray(c.payments) ? c.payments : [],
    lastPaymentDate: c.last_payment_date || undefined,
    createdAt: c.created_at || new Date().toISOString(),
  };
}

export function mapVendor(v: any): Vendor {
  return {
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
  };
}

export function mapVendorPurchase(p: any): VendorPurchase {
  return {
    id: p.id,
    vendorId: p.vendor_id,
    vendorName: p.vendor_name,
    companyName: p.company_name || undefined,
    invoiceNumber: p.invoice_number,
    date: p.date,
    items: Array.isArray(p.items) ? p.items : [],
    totalAmount: Number(p.total_amount) || 0,
    paidAmount: Number(p.paid_amount) || 0,
    remainingBalance: Number(p.remaining_balance ?? p.due_amount ?? 0),
    paymentStatus: p.payment_status || "paid",
    notes: p.notes || undefined,
    createdAt: p.created_at || p.date,
  };
}

export function mapVendorPayment(pay: any): VendorPayment {
  return {
    id: pay.id,
    vendorId: pay.vendor_id,
    vendorName: pay.vendor_name,
    purchaseId: pay.purchase_id || undefined,
    amount: Number(pay.amount) || 0,
    date: pay.date,
    paymentMethod: pay.payment_method || "cash",
    reference: pay.reference || undefined,
    createdAt: pay.created_at || pay.date,
  };
}

export function mapVendorReturn(r: any): VendorReturn {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    purchaseId: r.purchase_id || undefined,
    invoiceNumber: r.invoice_number || undefined,
    date: r.date,
    items: Array.isArray(r.items) ? r.items : [],
    totalAmount: Number(r.total_amount) || 0,
    reason: r.reason || "",
    createdAt: r.created_at || r.date,
  };
}

// ==============================================================================
// 1. BUSINESSES (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchBusinessForUser(userId: string): Promise<Business | null> {
  if (!userId) return null;
  const sb = ensureSupabaseClient();

  // Validate active authenticated session
  const { data: authData } = await sb.auth.getUser();
  const currentUserId = authData?.user?.id;
  if (!currentUserId) {
    return null;
  }

  // Enforce session user ownership unless administrative override
  const targetUserId = (userId === currentUserId) ? userId : currentUserId;

  const { data, error } = await sb
    .from("businesses")
    .select("*")
    .or(`owner_user_id.eq.${targetUserId},user_id.eq.${targetUserId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchBusinessForUser error:", error);
    throw new Error(`Failed to load business profile: ${error.message}`);
  }

  return (data as Business) || null;
}

export async function createBusinessInSupabase(
  payload: Omit<Business, "id" | "created_at" | "updated_at">
): Promise<Business> {
  const sb = ensureSupabaseClient();

  // Authoritative identity check: bind business to authenticated user
  const { data: authData } = await sb.auth.getUser();
  const authUserId = authData?.user?.id;
  if (!authUserId) {
    throw new Error("Unauthorized: You must possess an active session to create a business.");
  }

  const id = "biz_" + crypto.randomUUID().replace(/-/g, "");

  const newBusiness: Business = {
    ...payload,
    id,
    user_id: authUserId,
    owner_user_id: authUserId,
    business_name: payload.business_name,
    name: payload.business_name,
    owner_name: payload.owner_name,
    owner_email: payload.owner_email || payload.business_email || authData.user.email || "",
    status: payload.status || "active",
    plan: payload.plan || "SaleTrack Pro — $4/month",
    subscription_status: payload.subscription_status || "trial",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("businesses")
    .insert([newBusiness])
    .select()
    .single();

  if (error) {
    console.error("createBusinessInSupabase error:", error);
    throw new Error(`Failed to create business in database: ${error.message}`);
  }

  return data as Business;
}

export async function updateBusinessInSupabase(
  businessId: string,
  updates: Partial<Business>
): Promise<Business> {
  if (!businessId) {
    throw new Error("Missing businessId for updateBusinessInSupabase");
  }
  const sb = ensureSupabaseClient();
  const updatedTime = new Date().toISOString();

  // Strip immutable security columns to prevent ownership or tenant transfer
  const sanitizedUpdates = { ...updates };
  delete (sanitizedUpdates as any).id;
  delete (sanitizedUpdates as any).owner_user_id;
  delete (sanitizedUpdates as any).user_id;

  const { data, error } = await sb
    .from("businesses")
    .update({ ...sanitizedUpdates, updated_at: updatedTime })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    console.error("updateBusinessInSupabase error:", error);
    throw new Error(`Failed to update business in database: ${error.message}`);
  }

  return data as Business;
}

// ==============================================================================
// 2. PRODUCTS (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchProductsForBusiness(businessId: string): Promise<Product[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchProductsForBusiness error:", error);
    throw new Error(`Failed to load products from database: ${error.message}`);
  }

  return (data || []).map(mapProduct);
}

export async function upsertProductInSupabase(
  businessId: string,
  product: Product
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertProductInSupabase");
  }
  const sb = ensureSupabaseClient();

  const payload = {
    id: product.id || "prod_" + crypto.randomUUID().replace(/-/g, ""),
    business_id: businessId,
    name: product.name,
    sku: product.sku || null,
    barcode: product.barcode || null,
    unit: product.unit || "Piece",
    purchase_price: product.purchasePrice,
    selling_price: product.sellingPrice,
    stock: product.stock,
    quantity: product.stock,
    min_stock: product.minStock,
    max_stock: 1000,
    category: product.category,
    image_url: product.imageUrl || null,
    created_at: product.createdAt || new Date().toISOString(),
  };

  const { error } = await sb.from("products").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertProductInSupabase error:", error);
    throw new Error(`Failed to save product in database: ${error.message}`);
  }
}

export async function deleteProductInSupabase(
  businessId: string,
  productId: string
): Promise<void> {
  if (!businessId || !productId) return;
  const sb = ensureSupabaseClient();

  const { error } = await sb
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", businessId);

  if (error) {
    console.error("deleteProductInSupabase error:", error);
    throw new Error(`Failed to delete product from database: ${error.message}`);
  }
}

// ==============================================================================
// 3. SALES & INVOICES (Authoritative Idempotent Supabase Persistence)
// ==============================================================================

export async function fetchSalesForBusiness(businessId: string): Promise<Sale[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) {
    console.error("fetchSalesForBusiness error:", error);
    throw new Error(`Failed to load sales from database: ${error.message}`);
  }

  return (data || []).map(mapSale);
}

export async function upsertSaleInSupabase(businessId: string, sale: Sale): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertSaleInSupabase");
  }
  const sb = ensureSupabaseClient();

  const payload = {
    id: sale.id || "sale_" + crypto.randomUUID().replace(/-/g, ""),
    business_id: businessId,
    invoice_number: sale.invoiceNumber,
    customer_id: sale.customerId || null,
    customer_name: sale.customerName || "Walk-in Customer",
    customer_phone: sale.customerPhone || null,
    customer_email: sale.customerEmail || null,
    date: sale.date,
    payment_type: sale.paymentType,
    payment_method: sale.paymentMethod || sale.paymentType,
    status: sale.status || "completed",
    items: sale.items || [],
    subtotal: sale.subtotal,
    discount: sale.discount,
    tax: sale.tax,
    tax_rate: sale.taxRate,
    tax_name: sale.taxName || null,
    total: sale.total,
    profit: sale.profit,
    cogs: sale.cogs,
    paid: sale.paid,
    refunded_amount: sale.refundedAmount || 0,
    notes: sale.notes || null,
    created_at: sale.createdAt || sale.date,
  };

  const { error } = await sb.from("sales").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertSaleInSupabase error:", error);
    throw new Error(`Failed to save sale in database: ${error.message}`);
  }
}

// Concurrency lock for in-flight sale attempts to prevent duplicate processing
const inFlightSalePromises = new Map<string, Promise<{ success: boolean; isDuplicate: boolean; sale: Sale }>>();

/**
 * Authoritative, Idempotent Sale Recording in Supabase
 * Directly commits the sale into Supabase with duplicate protection.
 */
export async function recordSaleApi(
  businessId: string,
  sale: Sale,
  userId?: string
): Promise<{ success: boolean; isDuplicate: boolean; sale: Sale }> {
  if (!businessId) {
    throw new Error("Cannot record sale: Missing businessId parameter.");
  }
  if (!sale || typeof sale !== "object") {
    throw new Error("Cannot record sale: Missing sale payload.");
  }

  const effectiveTxId = String(sale.transactionId || sale.id || "").trim();
  if (!effectiveTxId) {
    throw new Error("Cannot record sale: Missing sale ID or transactionId.");
  }

  // Concurrency lock: If an identical transaction ID is currently in-flight, await the same promise
  if (inFlightSalePromises.has(effectiveTxId)) {
    return inFlightSalePromises.get(effectiveTxId)!;
  }

  const executionPromise = (async () => {
    const sb = ensureSupabaseClient();

    // 1. Idempotency Check: Check if sale already exists in Supabase for this business
    const { data: existing, error: findError } = await sb
      .from("sales")
      .select("*")
      .eq("business_id", businessId)
      .or(`id.eq.${effectiveTxId},invoice_number.eq.${sale.invoiceNumber}`)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.warn("Idempotency check query warning:", findError.message);
    }

    if (existing) {
      return {
        success: true,
        isDuplicate: true,
        sale: mapSale(existing),
      };
    }

    // 2. Persist directly into Supabase sales table
    const payload = {
      id: sale.id || effectiveTxId,
      business_id: businessId,
      user_id: userId || null,
      invoice_number: sale.invoiceNumber,
      customer_id: sale.customerId || null,
      customer_name: sale.customerName || "Walk-in Customer",
      customer_phone: sale.customerPhone || null,
      customer_email: sale.customerEmail || null,
      date: sale.date,
      payment_type: sale.paymentType,
      payment_method: sale.paymentMethod || sale.paymentType,
      status: sale.status || "completed",
      items: sale.items || [],
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      tax_rate: sale.taxRate,
      tax_name: sale.taxName || null,
      total: sale.total,
      profit: sale.profit,
      cogs: sale.cogs,
      paid: sale.paid,
      refunded_amount: sale.refundedAmount || 0,
      notes: sale.notes || null,
      created_at: sale.createdAt || sale.date,
    };

    const { data: inserted, error: insertError } = await sb
      .from("sales")
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      // If code 23505 (unique violation), another worker recorded it simultaneously
      if (insertError.code === "23505") {
        const { data: dup } = await sb
          .from("sales")
          .select("*")
          .eq("business_id", businessId)
          .eq("id", payload.id)
          .maybeSingle();

        if (dup) {
          return {
            success: true,
            isDuplicate: true,
            sale: mapSale(dup),
          };
        }
      }
      console.error("Supabase record sale error:", insertError);
      throw new Error(`Database error recording sale: ${insertError.message}`);
    }

    return {
      success: true,
      isDuplicate: false,
      sale: inserted ? mapSale(inserted) : sale,
    };
  })();

  inFlightSalePromises.set(effectiveTxId, executionPromise);

  try {
    return await executionPromise;
  } finally {
    inFlightSalePromises.delete(effectiveTxId);
  }
}

export async function deleteSaleInSupabase(businessId: string, saleId: string): Promise<void> {
  if (!businessId || !saleId) return;
  const sb = ensureSupabaseClient();

  const { error } = await sb
    .from("sales")
    .delete()
    .eq("id", saleId)
    .eq("business_id", businessId);

  if (error) {
    console.error("deleteSaleInSupabase error:", error);
    throw new Error(`Failed to delete sale from database: ${error.message}`);
  }
}

// ==============================================================================
// 4. SALE RETURNS (Authoritative Supabase Persistence)
// ==============================================================================

export async function fetchSaleReturnsForBusiness(businessId: string): Promise<SaleReturn[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("sale_returns")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) {
    console.error("fetchSaleReturnsForBusiness error:", error);
    throw new Error(`Failed to load sale returns from database: ${error.message}`);
  }

  return (data || []).map(mapSaleReturn);
}

export async function upsertSaleReturnInSupabase(
  businessId: string,
  ret: SaleReturn
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertSaleReturnInSupabase");
  }
  const sb = ensureSupabaseClient();

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

  const { error } = await sb.from("sale_returns").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertSaleReturnInSupabase error:", error);
    throw new Error(`Failed to save sale return in database: ${error.message}`);
  }
}

export const createSaleReturnInSupabase = upsertSaleReturnInSupabase;

/**
 * Authoritative, Idempotent Sale Return Recording in Supabase
 */
export async function recordSaleReturnApi(
  businessId: string,
  saleReturn: SaleReturn,
  options?: { restock?: boolean; refundMethod?: string },
  _userId?: string
): Promise<{
  success: boolean;
  isDuplicate: boolean;
  saleReturn: SaleReturn;
  updatedSale?: Sale;
  updatedCustomer?: Customer;
}> {
  if (!businessId) {
    throw new Error("Cannot record sale return: Missing businessId.");
  }
  const sb = ensureSupabaseClient();

  // 1. Idempotency Check: check if this return ID was already recorded in Supabase
  const returnId = saleReturn.id || "ret_" + crypto.randomUUID().replace(/-/g, "");
  const { data: existingReturn } = await sb
    .from("sale_returns")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", returnId)
    .maybeSingle();

  if (existingReturn) {
    return {
      success: true,
      isDuplicate: true,
      saleReturn: mapSaleReturn(existingReturn),
    };
  }

  // 2. Persist into Supabase sale_returns table
  const payload = {
    id: returnId,
    business_id: businessId,
    sale_id: saleReturn.saleId,
    invoice_number: saleReturn.invoiceNumber,
    customer_id: saleReturn.customerId || null,
    customer_name: saleReturn.customerName,
    date: saleReturn.date,
    items: saleReturn.items || [],
    refund_amount: saleReturn.refundAmount,
    refund_method: saleReturn.refundMethod,
    reason: saleReturn.reason || "",
    created_at: saleReturn.createdAt || saleReturn.date,
  };

  const { error: insertErr } = await sb.from("sale_returns").insert([payload]);
  if (insertErr && insertErr.code !== "23505") {
    console.error("recordSaleReturnApi insert error:", insertErr);
    throw new Error(`Failed to record return in database: ${insertErr.message}`);
  }

  // 3. Update the associated sale in Supabase
  let updatedSale: Sale | undefined;
  try {
    const { data: saleData } = await sb
      .from("sales")
      .select("*")
      .eq("business_id", businessId)
      .or(`id.eq.${saleReturn.saleId},invoice_number.eq.${saleReturn.invoiceNumber}`)
      .limit(1)
      .maybeSingle();

    if (saleData) {
      const currentRefunded = Number(saleData.refunded_amount || 0);
      const newRefunded = currentRefunded + Number(saleReturn.refundAmount);
      const totalAmount = Number(saleData.total || 0);
      const newStatus = newRefunded >= totalAmount ? "refunded" : "partially_refunded";

      const { data: updatedSaleRow } = await sb
        .from("sales")
        .update({
          refunded_amount: newRefunded,
          status: newStatus,
        })
        .eq("id", saleData.id)
        .eq("business_id", businessId)
        .select()
        .single();

      if (updatedSaleRow) {
        updatedSale = mapSale(updatedSaleRow);
      }
    }
  } catch (err) {
    console.warn("Updating sale after return in Supabase warning:", err);
  }

  // 4. Update customer if store credit adjustment
  let updatedCustomer: Customer | undefined;
  if (options?.refundMethod === "credit_adjustment" && saleReturn.customerId) {
    try {
      const { data: custData } = await sb
        .from("customers")
        .select("*")
        .eq("id", saleReturn.customerId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (custData) {
        const currentRemaining = Number(custData.remaining ?? custData.balance ?? 0);
        const newRemaining = Math.max(0, currentRemaining - Number(saleReturn.refundAmount));

        const { data: updatedCustRow } = await sb
          .from("customers")
          .update({
            remaining: newRemaining,
          })
          .eq("id", custData.id)
          .eq("business_id", businessId)
          .select()
          .single();

        if (updatedCustRow) {
          updatedCustomer = mapCustomer(updatedCustRow);
        }
      }
    } catch (err) {
      console.warn("Updating customer credit after return in Supabase warning:", err);
    }
  }

  return {
    success: true,
    isDuplicate: false,
    saleReturn: { ...saleReturn, id: returnId },
    updatedSale,
    updatedCustomer,
  };
}

// ==============================================================================
// 5. STOCK MOVEMENTS (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchStockMovementsForBusiness(
  businessId: string
): Promise<StockMovement[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("stock_movements")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchStockMovementsForBusiness error:", error);
    throw new Error(`Failed to load stock movements from database: ${error.message}`);
  }

  return (data || []).map(mapStockMovement);
}

export async function upsertStockMovementInSupabase(
  businessId: string,
  mov: StockMovement
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertStockMovementInSupabase");
  }
  const sb = ensureSupabaseClient();

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
    stock_before: mov.stockBefore !== undefined ? mov.stockBefore : null,
    stock_after: mov.stockAfter !== undefined ? mov.stockAfter : null,
    created_at: mov.createdAt || new Date().toISOString(),
  };

  const { error } = await sb.from("stock_movements").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertStockMovementInSupabase error:", error);
    throw new Error(`Failed to save stock movement in database: ${error.message}`);
  }
}

export const createStockMovementInSupabase = upsertStockMovementInSupabase;

// ==============================================================================
// 6. EXPENSES (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchExpensesForBusiness(businessId: string): Promise<Expense[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("expenses")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) {
    console.error("fetchExpensesForBusiness error:", error);
    throw new Error(`Failed to load expenses from database: ${error.message}`);
  }

  return (data || []).map(mapExpense);
}

export async function upsertExpenseInSupabase(
  businessId: string,
  exp: Expense
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertExpenseInSupabase");
  }
  const sb = ensureSupabaseClient();

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

  const { error } = await sb.from("expenses").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertExpenseInSupabase error:", error);
    throw new Error(`Failed to save expense in database: ${error.message}`);
  }
}

export async function deleteExpenseInSupabase(
  businessId: string,
  expenseId: string
): Promise<void> {
  if (!businessId || !expenseId) return;
  const sb = ensureSupabaseClient();

  const { error } = await sb
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("business_id", businessId);

  if (error) {
    console.error("deleteExpenseInSupabase error:", error);
    throw new Error(`Failed to delete expense from database: ${error.message}`);
  }
}

// ==============================================================================
// 7. CUSTOMERS (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchCustomersForBusiness(businessId: string): Promise<Customer[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchCustomersForBusiness error:", error);
    throw new Error(`Failed to load customers from database: ${error.message}`);
  }

  return (data || []).map(mapCustomer);
}

export async function upsertCustomerInSupabase(
  businessId: string,
  cust: Customer
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertCustomerInSupabase");
  }
  const sb = ensureSupabaseClient();

  const payload = {
    id: cust.id || "cust_" + crypto.randomUUID().replace(/-/g, ""),
    business_id: businessId,
    name: cust.name,
    phone: cust.phone || "",
    email: cust.email || null,
    address: cust.address || null,
    credit_limit: cust.creditLimit !== undefined ? cust.creditLimit : null,
    total_credit: cust.totalCredit,
    total_paid: cust.totalPaid,
    remaining: cust.remaining,
    payments: cust.payments || [],
    last_payment_date: cust.lastPaymentDate || null,
    created_at: cust.createdAt || new Date().toISOString(),
  };

  const { error } = await sb.from("customers").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertCustomerInSupabase error:", error);
    throw new Error(`Failed to save customer in database: ${error.message}`);
  }
}

export async function deleteCustomerInSupabase(
  businessId: string,
  customerId: string
): Promise<void> {
  if (!businessId || !customerId) return;
  const sb = ensureSupabaseClient();

  const { error } = await sb
    .from("customers")
    .delete()
    .eq("id", customerId)
    .eq("business_id", businessId);

  if (error) {
    console.error("deleteCustomerInSupabase error:", error);
    throw new Error(`Failed to delete customer from database: ${error.message}`);
  }
}

// ==============================================================================
// 8. VENDORS (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchVendorsForBusiness(businessId: string): Promise<Vendor[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("vendors")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchVendorsForBusiness error:", error);
    throw new Error(`Failed to load vendors from database: ${error.message}`);
  }

  return (data || []).map(mapVendor);
}

export async function upsertVendorInSupabase(businessId: string, vend: Vendor): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertVendorInSupabase");
  }
  const sb = ensureSupabaseClient();

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

  const { error } = await sb.from("vendors").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertVendorInSupabase error:", error);
    throw new Error(`Failed to save vendor in database: ${error.message}`);
  }
}

export async function deleteVendorInSupabase(
  businessId: string,
  vendorId: string
): Promise<void> {
  if (!businessId || !vendorId) return;
  const sb = ensureSupabaseClient();

  const { error } = await sb
    .from("vendors")
    .delete()
    .eq("id", vendorId)
    .eq("business_id", businessId);

  if (error) {
    console.error("deleteVendorInSupabase error:", error);
    throw new Error(`Failed to delete vendor from database: ${error.message}`);
  }
}

// ==============================================================================
// 9. VENDOR PURCHASES (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchVendorPurchasesForBusiness(
  businessId: string
): Promise<VendorPurchase[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("vendor_purchases")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) {
    console.error("fetchVendorPurchasesForBusiness error:", error);
    throw new Error(`Failed to load vendor purchases from database: ${error.message}`);
  }

  return (data || []).map(mapVendorPurchase);
}

export async function upsertVendorPurchaseInSupabase(
  businessId: string,
  purchase: VendorPurchase
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertVendorPurchaseInSupabase");
  }
  const sb = ensureSupabaseClient();

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

  const { error } = await sb.from("vendor_purchases").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertVendorPurchaseInSupabase error:", error);
    throw new Error(`Failed to save vendor purchase in database: ${error.message}`);
  }
}

export async function deleteVendorPurchaseInSupabase(
  businessId: string,
  purchaseId: string
): Promise<void> {
  if (!businessId || !purchaseId) return;
  const sb = ensureSupabaseClient();

  const { error } = await sb
    .from("vendor_purchases")
    .delete()
    .eq("id", purchaseId)
    .eq("business_id", businessId);

  if (error) {
    console.error("deleteVendorPurchaseInSupabase error:", error);
    throw new Error(`Failed to delete vendor purchase from database: ${error.message}`);
  }
}

// ==============================================================================
// 10. VENDOR PAYMENTS (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchVendorPaymentsForBusiness(
  businessId: string
): Promise<VendorPayment[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("vendor_payments")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) {
    console.error("fetchVendorPaymentsForBusiness error:", error);
    throw new Error(`Failed to load vendor payments from database: ${error.message}`);
  }

  return (data || []).map(mapVendorPayment);
}

export async function upsertVendorPaymentInSupabase(
  businessId: string,
  pay: VendorPayment
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertVendorPaymentInSupabase");
  }
  const sb = ensureSupabaseClient();

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

  const { error } = await sb.from("vendor_payments").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertVendorPaymentInSupabase error:", error);
    throw new Error(`Failed to save vendor payment in database: ${error.message}`);
  }
}

// ==============================================================================
// 11. VENDOR RETURNS (Authoritative Supabase CRUD)
// ==============================================================================

export async function fetchVendorReturnsForBusiness(
  businessId: string
): Promise<VendorReturn[]> {
  if (!businessId) return [];
  const sb = ensureSupabaseClient();

  const { data, error } = await sb
    .from("vendor_returns")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (error) {
    console.error("fetchVendorReturnsForBusiness error:", error);
    throw new Error(`Failed to load vendor returns from database: ${error.message}`);
  }

  return (data || []).map(mapVendorReturn);
}

export async function upsertVendorReturnInSupabase(
  businessId: string,
  ret: VendorReturn
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing businessId for upsertVendorReturnInSupabase");
  }
  const sb = ensureSupabaseClient();

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

  const { error } = await sb.from("vendor_returns").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("upsertVendorReturnInSupabase error:", error);
    throw new Error(`Failed to save vendor return in database: ${error.message}`);
  }
}

// ==============================================================================
// 12. SHOP SETTINGS (Authoritative Supabase Persistence)
// ==============================================================================

export async function fetchSettingsForBusiness(
  businessId: string
): Promise<ShopSettings | null> {
  if (!businessId) return null;
  const sb = ensureSupabaseClient();

  let loadedSettings: Partial<ShopSettings> | null = null;

  // A. Check dedicated settings table in Supabase
  try {
    const { data, error } = await sb
      .from("settings")
      .select("*")
      .eq("business_id", businessId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      loadedSettings = {
        shopName: data.shop_name || "SaleTrack Store",
        shopPhone: data.shop_phone || "",
        shopAddress: data.shop_address || "",
        email: data.email || "",
        currency: data.currency || "$",
        currencyCode: data.currency_code || "USD",
        currencyName: data.currency_name || "US Dollar",
        allowNegativeStock: Boolean(data.allow_negative_stock),
        invoiceFooter: data.invoice_footer || "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
        autoEmailReceipt: Boolean(data.auto_email_receipt),
        taxEnabled: Boolean(data.tax_enabled),
        taxName: data.tax_name || "Tax",
        taxRate: data.tax_rate !== null && data.tax_rate !== undefined ? Number(data.tax_rate) : 0,
        receiptType: (data.receipt_type as "thermal" | "a4") || "thermal",
      };
    }
  } catch (err) {
    console.warn("Could not query Supabase settings table:", err);
  }

  // B. If not in settings table, check businesses table in Supabase
  if (!loadedSettings) {
    try {
      const { data: bData, error: bErr } = await sb
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .maybeSingle();

      if (!bErr && bData) {
        let extra: any = {};
        if (bData.logo_url) {
          try {
            if (bData.logo_url.startsWith("{")) {
              extra = JSON.parse(bData.logo_url);
            }
          } catch (e) {
            // ignore non-JSON logo_url
          }
        }

        loadedSettings = {
          shopName: bData.business_name || bData.name || "SaleTrack Store",
          shopPhone: bData.phone_e164 || bData.phone_number || "",
          shopAddress: bData.address || "",
          email: bData.business_email || bData.owner_email || extra.email || "",
          currency: bData.currency_symbol || extra.currency || "$",
          currencyCode: bData.currency || extra.currencyCode || "USD",
          currencyName: bData.currency || extra.currencyName || "US Dollar",
          allowNegativeStock: extra.allowNegativeStock !== undefined ? Boolean(extra.allowNegativeStock) : false,
          invoiceFooter: extra.invoiceFooter || "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
          autoEmailReceipt: Boolean(extra.autoEmailReceipt),
          taxEnabled: Boolean(extra.taxEnabled),
          taxName: extra.taxName || "Tax",
          taxRate: extra.taxRate !== null && extra.taxRate !== undefined ? Number(extra.taxRate) : 0,
          receiptType: (extra.receiptType as "thermal" | "a4") || "thermal",
        };
      }
    } catch (err) {
      console.warn("Could not query Supabase businesses table for settings:", err);
    }
  }

  if (loadedSettings) {
    return {
      shopName: loadedSettings.shopName || "SaleTrack Store",
      shopPhone: loadedSettings.shopPhone || "",
      shopAddress: loadedSettings.shopAddress || "",
      email: loadedSettings.email || "",
      currency: loadedSettings.currency || "$",
      currencyCode: loadedSettings.currencyCode || "USD",
      currencyName: loadedSettings.currencyName || "US Dollar",
      allowNegativeStock: Boolean(loadedSettings.allowNegativeStock),
      invoiceFooter: loadedSettings.invoiceFooter || "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
      autoEmailReceipt: Boolean(loadedSettings.autoEmailReceipt),
      taxEnabled: Boolean(loadedSettings.taxEnabled),
      taxName: loadedSettings.taxName || "Tax",
      taxRate: Number(loadedSettings.taxRate) || 0,
      receiptType: (loadedSettings.receiptType as "thermal" | "a4") || "thermal",
    };
  }

  return null;
}

export async function upsertSettingsInSupabase(
  businessId: string,
  settings: ShopSettings
): Promise<void> {
  if (!businessId) {
    throw new Error("Missing business ID: Cannot save settings without an associated business.");
  }
  const sb = ensureSupabaseClient();

  const extraPayload = {
    allowNegativeStock: Boolean(settings.allowNegativeStock),
    invoiceFooter: settings.invoiceFooter || "",
    autoEmailReceipt: Boolean(settings.autoEmailReceipt),
    taxEnabled: Boolean(settings.taxEnabled),
    taxName: settings.taxName || "Tax",
    taxRate: Number(settings.taxRate) || 0,
    receiptType: settings.receiptType || "thermal",
    email: settings.email || settings.businessEmail || "",
  };

  // 1. Update business table in Supabase
  const { error: bizErr } = await sb
    .from("businesses")
    .update({
      business_name: settings.shopName,
      name: settings.shopName,
      phone_number: settings.shopPhone,
      phone_e164: settings.shopPhone,
      address: settings.shopAddress,
      business_email: settings.email || settings.businessEmail || undefined,
      currency: settings.currencyCode || "USD",
      currency_symbol: settings.currency || "$",
      logo_url: JSON.stringify(extraPayload),
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (bizErr) {
    console.error("Failed to update business profile in Supabase:", bizErr);
    throw new Error(`Failed to update business in database: ${bizErr.message}`);
  }

  // 2. Upsert settings table in Supabase
  try {
    const payload = {
      business_id: businessId,
      shop_name: settings.shopName,
      shop_phone: settings.shopPhone,
      shop_address: settings.shopAddress,
      email: settings.email || settings.businessEmail || "",
      currency: settings.currency,
      currency_code: settings.currencyCode || "USD",
      currency_name: settings.currencyName || "US Dollar",
      allow_negative_stock: Boolean(settings.allowNegativeStock),
      invoice_footer: settings.invoiceFooter,
      auto_email_receipt: Boolean(settings.autoEmailReceipt),
      tax_enabled: Boolean(settings.taxEnabled),
      tax_name: settings.taxName || "Tax",
      tax_rate: Number(settings.taxRate) || 0,
      receipt_type: settings.receiptType || "thermal",
      updated_at: new Date().toISOString(),
    };

    const { error: setErr } = await sb
      .from("settings")
      .upsert(payload, { onConflict: "business_id" });

    if (setErr) {
      console.warn("Supabase settings table upsert warning:", setErr.message);
    }
  } catch (err: any) {
    console.warn("Could not upsert into settings table:", err?.message);
  }
}
