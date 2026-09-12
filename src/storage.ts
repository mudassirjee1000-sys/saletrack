import { ShopSettings } from "./types";

/**
 * Client Storage Utility
 * 
 * NOTE: Supabase is the SOLE authoritative persistent database for all business data.
 * LocalStorage must NEVER be used to store business records (products, sales, customers, etc.).
 * This file retains only the default settings template and legacy cache purge helpers.
 */

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "SaleTrack Store",
  shopPhone: "",
  shopAddress: "",
  email: "",
  currency: "$",
  currencyCode: "USD",
  currencyName: "US Dollar",
  allowNegativeStock: false,
  invoiceFooter: "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
  autoEmailReceipt: false,
  taxEnabled: false,
  taxName: "Tax",
  taxRate: 0,
  receiptType: "thermal",
};

/**
 * Legacy storage keys that must be purged to prevent stale data.
 */
const LEGACY_KEYS = [
  "saletrack_products",
  "saletrack_sales",
  "saletrack_sale_returns",
  "saletrack_stock_movements",
  "saletrack_expenses",
  "saletrack_customers",
  "saletrack_vendors",
  "saletrack_vendor_purchases",
  "saletrack_vendor_payments",
  "saletrack_vendor_returns",
  "saletrack_settings",
  "saletrack_tenant_businesses",
  "saletrack_active_user",
  "saletrack_users_registry",
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

/**
 * Purge all local storage and legacy caches on logout or session reset.
 */
export function clearAllLocalData(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      LEGACY_KEYS.forEach((key) => {
        window.localStorage.removeItem(key);
      });

      // Clear all tenant keys (e.g. saletrack_tenant_*)
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith("saletrack_") || key.startsWith("small_shop_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn("Could not clear legacy local storage keys:", err);
  }
}
