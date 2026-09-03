import React from "react";
import { ActiveTab, ShopSettings } from "../types";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  shopName?: string;
  settings?: ShopSettings;
  lowStockCount?: number;
  customerDebtCount?: number;
  onOpenAI?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  shopName,
  settings,
  lowStockCount = 0,
  customerDebtCount = 0,
}) => {
  const mainNavItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "products",
      label: "Products",
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: "sales", label: "Sales History", icon: ShoppingCart },
    { id: "expenses", label: "Expenses", icon: Receipt },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      badge: customerDebtCount > 0 ? `${customerDebtCount} debt` : undefined,
    },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "ai", label: "AI Advisor", icon: Sparkles },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
            SaleTrack
          </h1>
          <p className="text-[11px] text-slate-500 font-medium truncate leading-tight">
            Sales, Stock & Profit Made Simple
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg font-medium text-sm transition-colors text-left ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-50 text-red-600 border border-red-100">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="p-4 border-t border-slate-100">
        <button
          id="sidebar-tab-settings"
          onClick={() => setActiveTab("settings")}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg font-medium text-sm transition-colors text-left ${
            activeTab === "settings"
              ? "bg-blue-50 text-blue-700 font-semibold"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === "settings" ? "text-blue-600" : "text-slate-400"}`} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  shopName?: string;
  settings?: ShopSettings;
  onOpenAI?: () => void;
  onNewSale?: () => void;
  lowStockCount?: number;
}


const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: "Overview Dashboard",
  products: "Products & Inventory",
  sales: "Sales & Point of Sale",
  expenses: "Operating Expenses",
  customers: "Customer Credit Ledger",
  reports: "Reports & Financials",
  settings: "Shop Settings",
  ai: "AI Business Advisor",
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  shopName,
  settings,
  onOpenAI,
  onNewSale,
}) => {
  const title = TAB_TITLES[activeTab] || "Overview Dashboard";

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile brand indicator */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">SaleTrack</span>
          <span className="text-slate-300">|</span>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick AI Advisor button */}
        <button
          id="header-ai-btn"
          onClick={onOpenAI || (() => setActiveTab("ai"))}
          className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">AI Advisor</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Quick Add Sale button */}
        <button
          id="header-new-sale-btn"
          onClick={onNewSale || (() => setActiveTab("sales"))}
          className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sale</span>
        </button>

        {/* Today date indicator */}
        <div className="text-right hidden sm:block pl-2 border-l border-slate-200">
          <p className="text-[11px] text-slate-400 leading-tight">Today is</p>
          <p className="text-xs font-medium text-slate-700 leading-tight">{todayFormatted}</p>
        </div>
      </div>
    </header>
  );
};

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount = 0,
}) => {
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "products",
      label: "Products",
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "customers", label: "Credit", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1.5 shadow-lg">
      <div className="grid grid-cols-7 items-center justify-items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center w-full py-1 px-0.5 rounded-lg transition ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 text-[9px] font-bold rounded-full bg-red-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Legacy Navbar compatibility component for simple use
export const Navbar: React.FC<HeaderProps & { lowStockCount?: number }> = (props) => {
  return <Header {...props} />;
};

