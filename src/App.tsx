import React, { useState, useEffect } from "react";
import {
  Product,
  Sale,
  Expense,
  Customer,
  CustomerPayment,
  ShopSettings,
  ActiveTab,
} from "./types";

import {
  getProducts,
  saveProducts,
  getSales,
  saveSales,
  getExpenses,
  saveExpenses,
  getCustomers,
  saveCustomers,
  getSettings,
  saveSettings,
  exportAllDataJSON,
  importAllDataJSON,
  resetToSampleData,
} from "./storage";

import { Sidebar, Header, MobileNav } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { Products } from "./components/Products";
import { Sales } from "./components/Sales";
import { Expenses } from "./components/Expenses";
import { Customers } from "./components/Customers";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { InvoiceModal } from "./components/InvoiceModal";
import { AIAssistant } from "./components/AIAssistant";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [sales, setSales] = useState<Sale[]>(() => getSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [settings, setSettingsState] = useState<ShopSettings>(() => getSettings());

  // Modal states for Quick Actions triggered from Dashboard
  const [viewingInvoice, setViewingInvoice] = useState<Sale | null>(null);
  const [isProductAddOpen, setIsProductAddOpen] = useState(false);
  const [isExpenseAddOpen, setIsExpenseAddOpen] = useState(false);

  // Re-verify data from storage on mount
  useEffect(() => {
    try {
      const p = getProducts();
      if (p.length > 0) setProducts(p);
      const s = getSales();
      if (s.length > 0) setSales(s);
      const e = getExpenses();
      if (e.length > 0) setExpenses(e);
      const c = getCustomers();
      if (c.length > 0) setCustomers(c);
      setSettingsState(getSettings());
    } catch (err) {
      console.warn("Storage sync check:", err);
    }
  }, []);


  // --- Product Handlers ---
  const handleSaveProduct = (product: Product) => {
    const existingIndex = products.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (existingIndex >= 0) {
      updated = [...products];
      updated[existingIndex] = product;
    } else {
      updated = [product, ...products];
    }
    setProducts(updated);
    saveProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  const handleUpdateStock = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(updated);
    saveProducts(updated);
  };

  // --- Sales Handlers ---
  const handleRecordSale = (newSale: Sale) => {
    // 1. Decrease inventory for each sold item
    const updatedProducts = products.map((prod) => {
      const soldItem = newSale.items.find((item) => item.productId === prod.id);
      if (soldItem) {
        const newStock = settings.allowNegativeStock
          ? prod.stock - soldItem.quantity
          : Math.max(0, prod.stock - soldItem.quantity);
        return { ...prod, stock: newStock };
      }
      return prod;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // 2. Add sale to history
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveSales(updatedSales);

    // 3. If credit sale and customer assigned, update customer debt
    if (newSale.paymentType === "credit" && newSale.customerId) {
      const updatedCustomers = customers.map((c) => {
        if (c.id === newSale.customerId) {
          const newCredit = c.totalCredit + newSale.total;
          const newRemaining = newCredit - c.totalPaid;
          return {
            ...c,
            totalCredit: newCredit,
            remaining: newRemaining,
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      saveCustomers(updatedCustomers);
    }
  };

  // --- Expenses Handlers ---
  const handleSaveExpense = (expense: Expense) => {
    const existingIndex = expenses.findIndex((e) => e.id === expense.id);
    let updated: Expense[];
    if (existingIndex >= 0) {
      updated = [...expenses];
      updated[existingIndex] = expense;
    } else {
      updated = [expense, ...expenses];
    }
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updated);
    saveExpenses(updated);
  };

  // --- Customers Handlers ---
  const handleSaveCustomer = (customer: Customer) => {
    const existingIndex = customers.findIndex((c) => c.id === customer.id);
    let updated: Customer[];
    if (existingIndex >= 0) {
      updated = [...customers];
      updated[existingIndex] = customer;
    } else {
      updated = [customer, ...customers];
    }
    setCustomers(updated);
    saveCustomers(updated);
  };

  const handleRecordPayment = (
    customerId: string,
    amount: number,
    date: string,
    note?: string
  ) => {
    const updatedCustomers = customers.map((c) => {
      if (c.id === customerId) {
        const newPaid = c.totalPaid + amount;
        const newRemaining = Math.max(0, c.totalCredit - newPaid);
        const newPayments: CustomerPayment[] = [
          ...(c.payments || []),
          {
            id: "pay-" + Date.now(),
            customerId,
            amount,
            date,
            note: note || "Payment",
          },
        ];

        return {
          ...c,
          totalPaid: newPaid,
          remaining: newRemaining,
          payments: newPayments,
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
  };

  // --- Settings Handlers ---
  const handleSaveSettings = (newSettings: ShopSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleExportData = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `saletrack-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string): boolean => {
    const success = importAllDataJSON(jsonString);
    if (success) {
      setProducts(getProducts());
      setSales(getSales());
      setExpenses(getExpenses());
      setCustomers(getCustomers());
      setSettingsState(getSettings());
    }
    return success;
  };

  const handleResetData = () => {
    resetToSampleData();
    setProducts(getProducts());
    setSales(getSales());
    setExpenses(getExpenses());
    setCustomers(getCustomers());
    setSettingsState(getSettings());
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        lowStockCount={products.filter((p) => p.stock <= p.minStock).length}
        customerDebtCount={customers.filter((c) => c.remaining > 0).length}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          settings={settings}
          onNewSale={() => setActiveTab("sales")}
          onOpenAI={() => setActiveTab("ai")}
          lowStockCount={products.filter((p) => p.stock <= p.minStock).length}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && (
              <Dashboard
                products={products}
                sales={sales}
                expenses={expenses}
                customers={customers}
                settings={settings}
                setActiveTab={setActiveTab}
                onQuickSale={() => setActiveTab("sales")}
                onAddProduct={() => {
                  setActiveTab("products");
                  setIsProductAddOpen(true);
                }}
                onAddExpense={() => {
                  setActiveTab("expenses");
                  setIsExpenseAddOpen(true);
                }}
                onViewInvoice={(sale) => setViewingInvoice(sale)}
                onOpenAI={() => setActiveTab("ai")}
                onQuickAddProduct={() => {
                  setActiveTab("products");
                  setIsProductAddOpen(true);
                }}
                onQuickAddExpense={() => {
                  setActiveTab("expenses");
                  setIsExpenseAddOpen(true);
                }}
              />
            )}

            {activeTab === "products" && (
              <Products
                products={products}
                settings={settings}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateStock={handleUpdateStock}
                isAddModalOpen={isProductAddOpen}
                setIsAddModalOpen={setIsProductAddOpen}
              />
            )}

            {activeTab === "sales" && (
              <Sales
                products={products}
                sales={sales}
                customers={customers}
                settings={settings}
                onRecordSale={handleRecordSale}
                onViewInvoice={(sale) => setViewingInvoice(sale)}
                onSaveCustomer={handleSaveCustomer}
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

            {activeTab === "reports" && (
              <Reports
                products={products}
                sales={sales}
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
          lowStockCount={products.filter((p) => p.stock <= p.minStock).length}
        />
      </div>

      {/* Invoice Modal (Printable & Shareable) */}
      <InvoiceModal
        sale={viewingInvoice}
        settings={settings}
        onClose={() => setViewingInvoice(null)}
      />
    </div>
  );
}
