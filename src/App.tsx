import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Product,
  Sale,
  Expense,
  Customer,
  CustomerPayment,
  Vendor,
  VendorPurchase,
  VendorPayment,
  ShopSettings,
  ActiveTab,
  SaleReturn,
  StockMovement,
} from "./types";

import { useAuth } from "./context/AuthContext.tsx";
import { LoadingScreen } from "./components/auth/LoadingScreen";
import { AuthPage } from "./components/auth/AuthPage";
import { BusinessRegistration } from "./components/auth/BusinessRegistration";
import { AdminGuard } from "./components/admin/AdminGuard";

import {
  fetchProductsForBusiness,
  upsertProductInSupabase,
  deleteProductInSupabase,
  fetchSalesForBusiness,
  upsertSaleInSupabase,
  recordSaleApi,
  fetchExpensesForBusiness,
  upsertExpenseInSupabase,
  deleteExpenseInSupabase,
  fetchCustomersForBusiness,
  upsertCustomerInSupabase,
  fetchVendorsForBusiness,
  upsertVendorInSupabase,
  deleteVendorInSupabase,
  fetchSaleReturnsForBusiness,
  createSaleReturnInSupabase,
  recordSaleReturnApi,
  fetchStockMovementsForBusiness,
  createStockMovementInSupabase,
  fetchVendorPurchasesForBusiness,
  upsertVendorPurchaseInSupabase,
  fetchVendorPaymentsForBusiness,
  upsertVendorPaymentInSupabase,
  fetchSettingsForBusiness,
  upsertSettingsInSupabase,
} from "./services/supabaseService";

import { Sidebar, Header, MobileNav } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { Products } from "./components/Products";
import { Sales } from "./components/Sales";
import { Expenses } from "./components/Expenses";
import { Customers } from "./components/Customers";
import { Vendors } from "./components/Vendors";
import { ReceivablesPayables } from "./components/ReceivablesPayables";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { InvoiceModal } from "./components/InvoiceModal";
import { SaleReturnModal } from "./components/SaleReturnModal";
import { AIAssistant } from "./components/AIAssistant";

export default function App() {
  const { user, business, loading: authLoading, businessLoading, token, getIdToken, refreshBusiness } = useAuth();

  // Route tracking
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  const isAdminRoute = currentPath.startsWith("/admin");

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState(null, "", "/admin");
    setCurrentPath("/admin");
  };

  const navigateToShop = () => {
    window.history.pushState(null, "", "/");
    setCurrentPath("/");
  };

  // Check admin privileges to decide whether to show admin console link
  const [isAdminUser, setIsAdminUser] = useState(false);
  useEffect(() => {
    if (!user || !token) {
      setIsAdminUser(false);
      return;
    }
    let isMounted = true;
    fetch("/api/admin/check-access", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (isMounted) setIsAdminUser(res.status === 200);
      })
      .catch(() => {
        if (isMounted) setIsAdminUser(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user, token]);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Isolated business data states
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorPurchases, setVendorPurchases] = useState<VendorPurchase[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Derive business settings from registered business and Supabase cloud persistence
  const [customSettings, setCustomSettings] = useState<Partial<ShopSettings>>({});

  const settings: ShopSettings = useMemo(() => {
    const baseCurrency = customSettings.currency || business?.currency_symbol || "$";
    const baseCurrencyCode = customSettings.currencyCode || business?.currency || "USD";
    const baseCurrencyName = customSettings.currencyName || business?.currency || "US Dollar";

    if (!business) {
      return {
        shopName: customSettings.shopName || "SaleTrack Store",
        shopPhone: customSettings.shopPhone || "",
        shopAddress: customSettings.shopAddress || "",
        email: customSettings.email || "",
        currency: baseCurrency,
        currencyCode: baseCurrencyCode,
        currencyName: baseCurrencyName,
        allowNegativeStock: customSettings.allowNegativeStock ?? false,
        invoiceFooter:
          customSettings.invoiceFooter ||
          "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
        autoEmailReceipt: customSettings.autoEmailReceipt ?? false,
        taxEnabled: customSettings.taxEnabled ?? false,
        taxRate: customSettings.taxRate ?? 0,
        taxName: customSettings.taxName || "Tax",
        receiptType: customSettings.receiptType || "thermal",
      };
    }
    return {
      shopName: customSettings.shopName || business.business_name || business.name || "SaleTrack Store",
      shopPhone: customSettings.shopPhone || business.phone_e164 || business.phone_number || "",
      shopAddress: customSettings.shopAddress || business.address || "",
      email: customSettings.email || business.business_email || business.owner_email || "",
      currency: baseCurrency,
      currencyCode: baseCurrencyCode,
      currencyName: baseCurrencyName,
      allowNegativeStock: customSettings.allowNegativeStock ?? false,
      invoiceFooter:
        customSettings.invoiceFooter ||
        "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!",
      autoEmailReceipt: customSettings.autoEmailReceipt ?? false,
      taxEnabled: customSettings.taxEnabled ?? false,
      taxRate: customSettings.taxRate ?? 0,
      taxName: customSettings.taxName || "Tax",
      receiptType: customSettings.receiptType || "thermal",
    };
  }, [business, customSettings]);

  // Modal states for Quick Actions triggered from Dashboard & Sales
  const [viewingInvoice, setViewingInvoice] = useState<Sale | null>(null);
  const [returnTargetSale, setReturnTargetSale] = useState<Sale | null>(null);
  const [isProductAddOpen, setIsProductAddOpen] = useState(false);
  const [isExpenseAddOpen, setIsExpenseAddOpen] = useState(false);

  // Load business data from Supabase once business is identified
  useEffect(() => {
    if (!business?.id) {
      setProducts([]);
      setSales([]);
      setSaleReturns([]);
      setStockMovements([]);
      setExpenses([]);
      setCustomers([]);
      setVendors([]);
      setVendorPurchases([]);
      setVendorPayments([]);
      return;
    }

    let isMounted = true;
    setDataLoading(true);

    Promise.all([
      fetchProductsForBusiness(business.id),
      fetchSalesForBusiness(business.id),
      fetchSaleReturnsForBusiness(business.id),
      fetchStockMovementsForBusiness(business.id),
      fetchExpensesForBusiness(business.id),
      fetchCustomersForBusiness(business.id),
      fetchVendorsForBusiness(business.id),
      fetchVendorPurchasesForBusiness(business.id),
      fetchVendorPaymentsForBusiness(business.id),
      fetchSettingsForBusiness(business.id),
    ])
      .then(([prods, sls, rets, movs, exps, custs, vends, vPurchs, vPays, cloudSettings]) => {
        if (!isMounted) return;
        setProducts(prods);
        setSales(sls);
        setSaleReturns(rets);
        setStockMovements(movs);
        setExpenses(exps);
        setCustomers(custs);
        setVendors(vends);
        setVendorPurchases(vPurchs);
        setVendorPayments(vPays);
        if (cloudSettings) {
          setCustomSettings(cloudSettings);
        }
        setSyncError(null);
        setDataLoading(false);
      })
      .catch((err) => {
        console.error("Error loading business data from Supabase:", err);
        if (isMounted) {
          setSyncError("Failed to load business records from database: " + (err.message || "Connection failure."));
          setDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [business?.id]);

  // Data persistence handlers tied strictly to authenticated business.id
  const handleSaveProduct = useCallback(
    async (product: Product) => {
      if (!business?.id) return;
      setProducts((prev) => {
        const index = prev.findIndex((p) => p.id === product.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = product;
          return updated;
        }
        return [product, ...prev];
      });

      try {
        await upsertProductInSupabase(business.id, product);
      } catch (err) {
        console.error("Failed to save product in Supabase:", err);
      }
    },
    [business?.id]
  );

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      if (!business?.id) return;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      try {
        await deleteProductInSupabase(business.id, id);
      } catch (err) {
        console.error("Failed to delete product in Supabase:", err);
      }
    },
    [business?.id]
  );

  const handleUpdateStock = useCallback(
    async (productId: string, delta: number) => {
      if (!business?.id) return;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const updated = { ...p, stock: Math.max(0, p.stock + delta) };
            upsertProductInSupabase(business.id, updated).catch(console.error);

            // Record movement
            const movement: StockMovement = {
              id: "mov_" + crypto.randomUUID().replace(/-/g, ""),
              productId: p.id,
              productName: p.name,
              type: delta > 0 ? "adjustment_increase" : "adjustment_decrease",
              quantity: delta,
              stockBefore: p.stock,
              stockAfter: updated.stock,
              reason: "Quick stock counter adjustment",
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            setStockMovements((prevMov) => [movement, ...prevMov]);
            createStockMovementInSupabase(business.id, movement).catch(console.error);

            return updated;
          }
          return p;
        })
      );
    },
    [business?.id]
  );

  const handleAdjustStock = useCallback(
    async (productId: string, newStock: number, movement: StockMovement) => {
      if (!business?.id) return;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
      setStockMovements((prev) => [movement, ...prev]);

      const product = products.find((p) => p.id === productId);
      if (product) {
        upsertProductInSupabase(business.id, { ...product, stock: newStock }).catch(console.error);
      }
      createStockMovementInSupabase(business.id, movement).catch(console.error);
    },
    [business?.id, products]
  );

  const inFlightSalesRef = useRef<Set<string>>(new Set());
  const processedTxIdsRef = useRef<Set<string>>(new Set());

  const handleSaveSale = useCallback(
    async (sale: Sale) => {
      if (!business?.id) return;
      const txId = sale.transactionId || sale.id;

      // In-flight or already processed duplicate check on frontend
      if (inFlightSalesRef.current.has(txId) || processedTxIdsRef.current.has(txId)) {
        console.warn(`[Duplicate Protection] Sale ${txId} is already in-flight or processed.`);
        const existingSale = sales.find(
          (s) => s.id === sale.id || (s.transactionId && s.transactionId === txId)
        );
        return existingSale || sale;
      }

      inFlightSalesRef.current.add(txId);

      try {
        // Authoritative server-side idempotent recording
        const result = await recordSaleApi(business.id, sale, user?.id);

        processedTxIdsRef.current.add(txId);

        if (result.isDuplicate) {
          console.log("[Duplicate Protection] Backend recognized duplicate transaction. Returning existing record without duplicate side-effects.");
          setSales((prev) => {
            const hasSale = prev.some(
              (s) => s.id === result.sale.id || (s.transactionId && s.transactionId === txId)
            );
            if (hasSale) return prev;
            return [result.sale, ...prev];
          });
          return result.sale;
        }

        // Fresh first-time sale: Update state & side-effects
        const recordedSale = result.sale || sale;
        setSales((prev) => [recordedSale, ...prev.filter((s) => s.id !== recordedSale.id)]);

        // Deduct sold stock & record movements ONCE
        setProducts((prevProducts) => {
          const updated = prevProducts.map((prod) => {
            const soldItem = recordedSale.items.find((item) => item.productId === prod.id);
            if (soldItem) {
              const newStock = Math.max(0, prod.stock - soldItem.quantity);
              const updatedProd = {
                ...prod,
                stock: newStock,
              };
              upsertProductInSupabase(business.id, updatedProd).catch(console.error);

              const movement: StockMovement = {
                id: "mov_" + crypto.randomUUID().replace(/-/g, ""),
                productId: prod.id,
                productName: prod.name,
                type: "sale",
                quantity: -soldItem.quantity,
                stockBefore: prod.stock,
                stockAfter: newStock,
                reason: `Sale ${recordedSale.invoiceNumber}`,
                relatedInvoice: recordedSale.invoiceNumber,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              };
              setStockMovements((prevMov) => [movement, ...prevMov]);
              createStockMovementInSupabase(business.id, movement).catch(console.error);

              return updatedProd;
            }
            return prod;
          });
          return updated;
        });

        // Update customer record if credit sale ONCE
        if (recordedSale.paymentType === "credit" && recordedSale.customerName) {
          const creditRemaining = recordedSale.total - recordedSale.paid;
          setCustomers((prevCustomers) => {
            const existing = prevCustomers.find(
              (c) =>
                (recordedSale.customerId && c.id === recordedSale.customerId) ||
                c.name.toLowerCase() === recordedSale.customerName.toLowerCase()
            );

            if (existing) {
              const updated = prevCustomers.map((c) => {
                if (c.id === existing.id) {
                  const updatedCust = {
                    ...c,
                    totalCredit: c.totalCredit + creditRemaining,
                    remaining: c.remaining + creditRemaining,
                  };
                  upsertCustomerInSupabase(business.id, updatedCust).catch(console.error);
                  return updatedCust;
                }
                return c;
              });
              return updated;
            } else {
              const newCust: Customer = {
                id: "cust_" + crypto.randomUUID().replace(/-/g, ""),
                name: recordedSale.customerName,
                phone: recordedSale.customerPhone || "",
                email: recordedSale.customerEmail || "",
                totalCredit: creditRemaining,
                totalPaid: recordedSale.paid,
                remaining: creditRemaining,
                payments: [],
                createdAt: new Date().toISOString(),
              };
              upsertCustomerInSupabase(business.id, newCust).catch(console.error);
              return [newCust, ...prevCustomers];
            }
          });
        }

        // Automatic email receipt when configured
        if (settings.autoEmailReceipt) {
          const recipient = recordedSale.customerEmail || customers.find((c) => c.id === recordedSale.customerId)?.email;
          if (recipient && recipient.includes("@")) {
            fetch("/api/email/send-receipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: recipient,
                customerName: recordedSale.customerName,
                sale: recordedSale,
                settings,
              }),
            }).catch((err) => console.warn("Auto email receipt notice:", err));
          }
        }

        return recordedSale;
      } finally {
        inFlightSalesRef.current.delete(txId);
      }
    },
    [business?.id, user?.id, sales, customers, settings]
  );

  const handleProcessReturn = useCallback(
    async (
      saleReturn: SaleReturn,
      options: {
        restock: boolean;
        refundMethod: "cash" | "bank" | "card" | "credit_adjustment" | "other";
      }
    ) => {
      if (!business?.id) return;

      try {
        const result = await recordSaleReturnApi(
          business.id,
          saleReturn,
          options,
          user?.id
        );

        // 1. Add return record to state
        setSaleReturns((prev) => {
          const exists = prev.some((r) => r.id === result.saleReturn.id);
          return exists ? prev : [result.saleReturn, ...prev];
        });

        // 2. Update sale refundedAmount and status
        setSales((prevSales) => {
          return prevSales.map((s) => {
            if (s.id === saleReturn.saleId || (s.invoiceNumber && s.invoiceNumber === saleReturn.invoiceNumber)) {
              if (result.updatedSale) {
                return { ...s, ...result.updatedSale };
              }
              const newRefunded = Math.min(s.total, (s.refundedAmount || 0) + saleReturn.refundAmount);
              const newStatus: "completed" | "unpaid" | "refunded" | "partially_refunded" =
                newRefunded >= s.total ? "refunded" : "partially_refunded";
              return {
                ...s,
                refundedAmount: newRefunded,
                status: newStatus,
              };
            }
            return s;
          });
        });

        // 3. Restock items in UI state if requested
        if (options.restock && saleReturn.items?.length > 0) {
          setProducts((prevProds) => {
            return prevProds.map((prod) => {
              const returnedItem = saleReturn.items.find((it) => it.productId === prod.id);
              if (returnedItem) {
                const newStock = prod.stock + returnedItem.quantity;
                return { ...prod, stock: newStock };
              }
              return prod;
            });
          });

          // Stock movement logs
          saleReturn.items.forEach((returnedItem) => {
            const prod = products.find((p) => p.id === returnedItem.productId);
            const curStock = prod?.stock || 0;
            const movement: StockMovement = {
              id: "mov_" + crypto.randomUUID().replace(/-/g, ""),
              productId: returnedItem.productId,
              productName: returnedItem.productName,
              type: "sale_return",
              quantity: returnedItem.quantity,
              stockBefore: curStock,
              stockAfter: curStock + returnedItem.quantity,
              reason: `Customer return for invoice #${saleReturn.invoiceNumber}: ${saleReturn.reason}`,
              relatedInvoice: saleReturn.invoiceNumber,
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            setStockMovements((prev) => [movement, ...prev]);
          });
        }

        // 4. Update customer credit balance if adjusted
        if (options.refundMethod === "credit_adjustment" && saleReturn.customerId) {
          setCustomers((prevCusts) => {
            return prevCusts.map((c) => {
              if (c.id === saleReturn.customerId) {
                if (result.updatedCustomer) {
                  return { ...c, ...result.updatedCustomer };
                }
                const newRem = Math.max(0, c.remaining - saleReturn.refundAmount);
                const newCred = Math.max(0, c.totalCredit - saleReturn.refundAmount);
                return {
                  ...c,
                  remaining: newRem,
                  totalCredit: newCred,
                };
              }
              return c;
            });
          });
        }

        setReturnTargetSale(null);
      } catch (err: any) {
        console.error("Failed to process sale return:", err);
        throw err;
      }
    },
    [business?.id, user?.id, products]
  );

  const handleSaveExpense = useCallback(
    async (expense: Expense) => {
      if (!business?.id) return;
      setExpenses((prev) => [expense, ...prev]);
      try {
        await upsertExpenseInSupabase(business.id, expense);
      } catch (err) {
        console.error("Failed to save expense in Supabase:", err);
      }
    },
    [business?.id]
  );

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      if (!business?.id) return;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      try {
        await deleteExpenseInSupabase(business.id, id);
      } catch (err) {
        console.error("Failed to delete expense in Supabase:", err);
      }
    },
    [business?.id]
  );

  const handleSaveCustomer = useCallback(
    async (customer: Customer) => {
      if (!business?.id) return;
      setCustomers((prev) => {
        const index = prev.findIndex((c) => c.id === customer.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = customer;
          return updated;
        }
        return [customer, ...prev];
      });
      try {
        await upsertCustomerInSupabase(business.id, customer);
      } catch (err) {
        console.error("Failed to save customer in Supabase:", err);
      }
    },
    [business?.id]
  );

  const handleRecordPayment = useCallback(
    async (customerId: string, amount: number, date?: string, note?: string) => {
      if (!business?.id) return;
      const paymentDate = date && !isNaN(Date.parse(date)) ? new Date(date).toISOString() : new Date().toISOString();
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === customerId) {
            const newPayment: CustomerPayment = {
              id: "pay_" + crypto.randomUUID().replace(/-/g, ""),
              customerId,
              amount,
              date: paymentDate,
              paymentMethod: "cash",
              note,
            };
            const updated = {
              ...c,
              totalPaid: c.totalPaid + amount,
              remaining: Math.max(0, c.remaining - amount),
              payments: [newPayment, ...(c.payments || [])],
              lastPaymentDate: paymentDate,
            };
            upsertCustomerInSupabase(business.id, updated).catch(console.error);
            return updated;
          }
          return c;
        })
      );
    },
    [business?.id]
  );

  const handleSaveVendor = useCallback(
    async (vendor: Vendor) => {
      if (!business?.id) return;
      setVendors((prev) => {
        const index = prev.findIndex((v) => v.id === vendor.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = vendor;
          return updated;
        }
        return [vendor, ...prev];
      });
      try {
        await upsertVendorInSupabase(business.id, vendor);
      } catch (err) {
        console.error("Failed to save vendor in Supabase:", err);
      }
    },
    [business?.id]
  );

  const handleDeleteVendor = useCallback(
    async (id: string) => {
      if (!business?.id) return;
      setVendors((prev) => prev.filter((v) => v.id !== id));
      try {
        await deleteVendorInSupabase(business.id, id);
      } catch (err: any) {
        console.error("Failed to delete vendor in Supabase:", err);
        setSyncError("Failed to delete vendor: " + (err.message || "Database error"));
      }
    },
    [business?.id]
  );

  const handleRecordVendorPurchase = useCallback(
    async (purchase: VendorPurchase, updatedStock?: { productId: string; quantity: number }[]) => {
      if (!business?.id) return;
      setVendorPurchases((prev) => [purchase, ...prev]);
      upsertVendorPurchaseInSupabase(business.id, purchase).catch(console.error);

      // Update vendor balance
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === purchase.vendorId) {
            const addedPurchase = purchase.totalAmount || 0;
            const addedPaid = purchase.paidAmount || 0;
            const addedRemaining = Math.max(0, addedPurchase - addedPaid);
            const updatedVendor: Vendor = {
              ...v,
              totalPurchased: (v.totalPurchased || 0) + addedPurchase,
              totalPaid: (v.totalPaid || 0) + addedPaid,
              remainingBalance: Math.max(0, (v.remainingBalance || 0) + addedRemaining),
            };
            upsertVendorInSupabase(business.id, updatedVendor).catch(console.error);
            return updatedVendor;
          }
          return v;
        })
      );

      // Restock products if updatedStock provided
      if (updatedStock && updatedStock.length > 0) {
        setProducts((prevProducts) => {
          return prevProducts.map((prod) => {
            const stockIn = updatedStock.find((s) => s.productId === prod.id);
            if (stockIn) {
              const newStock = prod.stock + stockIn.quantity;
              const updatedProd = { ...prod, stock: newStock };
              upsertProductInSupabase(business.id, updatedProd).catch(console.error);

              // Record stock movement
              const movement: StockMovement = {
                id: "mov_" + crypto.randomUUID().replace(/-/g, ""),
                productId: prod.id,
                productName: prod.name,
                type: "purchase",
                quantity: stockIn.quantity,
                stockBefore: prod.stock,
                stockAfter: newStock,
                reason: `Supplier purchase ${purchase.invoiceNumber}`,
                relatedPurchase: purchase.invoiceNumber,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              };
              setStockMovements((prevMov) => [movement, ...prevMov]);
              createStockMovementInSupabase(business.id, movement).catch(console.error);

              return updatedProd;
            }
            return prod;
          });
        });
      }
    },
    [business?.id]
  );

  const handleRecordVendorPayment = useCallback(
    async (payment: VendorPayment) => {
      if (!business?.id) return;
      setVendorPayments((prev) => [payment, ...prev]);
      upsertVendorPaymentInSupabase(business.id, payment).catch(console.error);

      // Update vendor balance
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === payment.vendorId) {
            const updatedVendor: Vendor = {
              ...v,
              totalPaid: (v.totalPaid || 0) + payment.amount,
              remainingBalance: Math.max(0, (v.remainingBalance || 0) - payment.amount),
              lastPaymentDate: payment.date || new Date().toISOString(),
            };
            upsertVendorInSupabase(business.id, updatedVendor).catch(console.error);
            return updatedVendor;
          }
          return v;
        })
      );
    },
    [business?.id]
  );

  const handleSaveSettings = useCallback(
    async (newSettings: ShopSettings) => {
      if (!business?.id) {
        throw new Error("No active business found. Please register or select your business.");
      }
      // Update local React state immediately
      setCustomSettings(newSettings);

      // Persist persistently to Supabase & Cloud DB
      await upsertSettingsInSupabase(business.id, newSettings);

      // Refresh business context to update header and store name
      await refreshBusiness().catch(console.warn);
    },
    [business?.id, refreshBusiness]
  );

  const handleExportData = useCallback(() => {
    const data = {
      version: "3.0",
      exportDate: new Date().toISOString(),
      businessId: business?.id,
      businessName: settings.shopName,
      products,
      sales,
      saleReturns,
      stockMovements,
      expenses,
      customers,
      vendors,
      vendorPurchases,
      vendorPayments,
      settings,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saletrack-backup-${(settings.shopName || "store").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    business?.id,
    settings,
    products,
    sales,
    saleReturns,
    stockMovements,
    expenses,
    customers,
    vendors,
    vendorPurchases,
    vendorPayments,
  ]);

  const handleImportData = useCallback(
    async (jsonData: string): Promise<boolean> => {
      if (!business?.id) {
        setSyncError("Cannot import data: No active business profile.");
        return false;
      }
      try {
        const data = JSON.parse(jsonData);
        if (Array.isArray(data.products)) {
          for (const p of data.products) {
            await upsertProductInSupabase(business.id, p);
          }
          setProducts(data.products);
        }
        if (Array.isArray(data.customers)) {
          for (const c of data.customers) {
            await upsertCustomerInSupabase(business.id, c);
          }
          setCustomers(data.customers);
        }
        if (Array.isArray(data.expenses)) {
          for (const e of data.expenses) {
            await upsertExpenseInSupabase(business.id, e);
          }
          setExpenses(data.expenses);
        }
        if (Array.isArray(data.vendors)) {
          for (const v of data.vendors) {
            await upsertVendorInSupabase(business.id, v);
          }
          setVendors(data.vendors);
        }
        if (Array.isArray(data.sales)) {
          for (const s of data.sales) {
            await upsertSaleInSupabase(business.id, s);
          }
          setSales(data.sales);
        }
        if (data.settings) {
          await upsertSettingsInSupabase(business.id, data.settings);
          setCustomSettings(data.settings);
        }
        setSyncError(null);
        return true;
      } catch (err: any) {
        console.error("Import to Supabase failed:", err);
        setSyncError("Import failed: " + (err.message || "Invalid backup JSON"));
        return false;
      }
    },
    [business?.id]
  );

  const handleResetData = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to refresh your view from Supabase?"
      )
    ) {
      if (business?.id) {
        setDataLoading(true);
        Promise.all([
          fetchProductsForBusiness(business.id),
          fetchSalesForBusiness(business.id),
          fetchSaleReturnsForBusiness(business.id),
          fetchStockMovementsForBusiness(business.id),
          fetchExpensesForBusiness(business.id),
          fetchCustomersForBusiness(business.id),
          fetchVendorsForBusiness(business.id),
          fetchVendorPurchasesForBusiness(business.id),
          fetchVendorPaymentsForBusiness(business.id),
          fetchSettingsForBusiness(business.id),
        ])
          .then(([prods, sls, rets, movs, exps, custs, vends, vPurchs, vPays, cloudSettings]) => {
            setProducts(prods);
            setSales(sls);
            setSaleReturns(rets);
            setStockMovements(movs);
            setExpenses(exps);
            setCustomers(custs);
            setVendors(vends);
            setVendorPurchases(vPurchs);
            setVendorPayments(vPays);
            if (cloudSettings) setCustomSettings(cloudSettings);
            setSyncError(null);
            setDataLoading(false);
          })
          .catch((err) => {
            setSyncError("Refresh failed: " + (err.message || "Database connection error"));
            setDataLoading(false);
          });
      }
    }
  }, [business?.id]);

  // Quick stats calculations for Sidebar & Header badges
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products]
  );
  const customerDebtCount = useMemo(
    () => customers.filter((c) => c.remaining > 0).length,
    [customers]
  );

  // 1. Initial Authentication Loading State
  if (authLoading || businessLoading) {
    return <LoadingScreen message="Initializing secure workspace..." />;
  }

  // 2. Unauthenticated -> Show Auth Flow (Email & Password Login/Register)
  if (!user) {
    return <AuthPage />;
  }

  // 3. Authenticated but No Business Record -> Prompt Business Registration
  if (!business) {
    return <BusinessRegistration />;
  }

  // 4. Admin Route Guarding
  if (isAdminRoute) {
    return <AdminGuard onReturnToShop={navigateToShop} />;
  }

  // 5. Main Authenticated SaaS Application
  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shopName={settings.shopName}
        settings={settings}
        lowStockCount={lowStockCount}
        customerDebtCount={customerDebtCount}
        onOpenAI={() => setActiveTab("ai")}
        onNavigateToAdmin={isAdminUser ? navigateToAdmin : undefined}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          shopName={settings.shopName}
          settings={settings}
          lowStockCount={lowStockCount}
          onOpenAI={() => setActiveTab("ai")}
          onNewSale={() => setActiveTab("sales")}
          onNavigateToAdmin={isAdminUser ? navigateToAdmin : undefined}
        />

        {/* Scrollable Dashboard Tab Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {syncError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Database Warning:</span>
                  <span>{syncError}</span>
                </div>
                <button
                  onClick={() => setSyncError(null)}
                  className="text-rose-600 hover:text-rose-800 font-medium text-xs px-2.5 py-1 rounded-md hover:bg-rose-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activeTab === "dashboard" && (
              <Dashboard
                products={products}
                sales={sales}
                saleReturns={saleReturns}
                expenses={expenses}
                customers={customers}
                settings={settings}
                setActiveTab={setActiveTab}
                onAddProduct={() => {
                  setActiveTab("products");
                  setIsProductAddOpen(true);
                }}
                onQuickSale={() => setActiveTab("sales")}
                onAddExpense={() => {
                  setActiveTab("expenses");
                  setIsExpenseAddOpen(true);
                }}
                onViewInvoice={(sale) => setViewingInvoice(sale)}
              />
            )}

            {activeTab === "products" && (
              <Products
                products={products}
                settings={settings}
                stockMovements={stockMovements}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateStock={handleUpdateStock}
                onAdjustStock={handleAdjustStock}
                isAddModalOpen={isProductAddOpen}
                setIsAddModalOpen={setIsProductAddOpen}
              />
            )}

            {activeTab === "sales" && (
              <Sales
                sales={sales}
                saleReturns={saleReturns}
                products={products}
                customers={customers}
                settings={settings}
                onRecordSale={handleSaveSale}
                onViewInvoice={(sale) => setViewingInvoice(sale)}
                onSaveCustomer={handleSaveCustomer}
                onProcessReturn={handleProcessReturn}
              />
            )}

            {activeTab === "expenses" && (
              <Expenses
                expenses={expenses}
                settings={settings}
                onSaveExpense={handleSaveExpense}
                onDeleteExpense={handleDeleteExpense}
                isAddModalOpen={isExpenseAddOpen}
                setIsAddModalOpen={setIsExpenseAddOpen}
              />
            )}

            {activeTab === "customers" && (
              <Customers
                customers={customers}
                sales={sales}
                settings={settings}
                onSaveCustomer={handleSaveCustomer}
                onRecordPayment={handleRecordPayment}
                onViewInvoice={(sale) => setViewingInvoice(sale)}
              />
            )}

            {activeTab === "vendors" && (
              <Vendors
                vendors={vendors}
                vendorPurchases={vendorPurchases}
                vendorPayments={vendorPayments}
                products={products}
                settings={settings}
                onSaveVendor={handleSaveVendor}
                onDeleteVendor={handleDeleteVendor}
                onRecordPurchase={handleRecordVendorPurchase}
                onRecordPayment={handleRecordVendorPayment}
              />
            )}

            {activeTab === "receivables-payables" && (
              <ReceivablesPayables
                customers={customers}
                vendors={vendors}
                settings={settings}
              />
            )}

            {activeTab === "reports" && (
              <Reports
                products={products}
                sales={sales}
                saleReturns={saleReturns}
                expenses={expenses}
                customers={customers}
                settings={settings}
              />
            )}

            {activeTab === "settings" && (
              <Settings
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetData={handleResetData}
              />
            )}

            {activeTab === "ai" && (
              <AIAssistant
                products={products}
                sales={sales}
                expenses={expenses}
                customers={customers}
                settings={settings}
                isOpen={true}
                onClose={() => setActiveTab("dashboard")}
              />
            )}
          </div>
        </main>

        {/* Mobile Navigation Bar */}
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
        />
      </div>

      {/* Invoice Modal (Printable & Shareable) */}
      <InvoiceModal
        sale={viewingInvoice}
        settings={settings}
        onClose={() => setViewingInvoice(null)}
        onOpenReturn={(sale) => {
          setViewingInvoice(null);
          setReturnTargetSale(sale);
        }}
      />

      {/* Sale Return / Refund Modal */}
      {returnTargetSale && (
        <SaleReturnModal
          isOpen={Boolean(returnTargetSale)}
          onClose={() => setReturnTargetSale(null)}
          sale={returnTargetSale}
          settings={settings}
          onProcessReturn={handleProcessReturn}
        />
      )}
    </div>
  );
}
