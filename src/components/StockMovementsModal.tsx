import React, { useState } from "react";
import { StockMovement, ShopSettings, Product } from "../types";
import {
  History,
  X,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface StockMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: StockMovement[];
  productName?: string;
  products?: Product[];
  settings: ShopSettings;
}

export const StockMovementsModal: React.FC<StockMovementsModalProps> = ({
  isOpen,
  onClose,
  movements,
  productName,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  if (!isOpen) return null;

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.relatedInvoice && m.relatedInvoice.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "all" || m.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getMovementBadge = (type: StockMovement["type"]) => {
    switch (type) {
      case "sale":
        return {
          label: "Sale",
          color: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <ArrowDownRight className="w-3 h-3 text-rose-600" />,
        };
      case "purchase":
        return {
          label: "Purchase",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <ArrowUpRight className="w-3 h-3 text-emerald-600" />,
        };
      case "sale_return":
        return {
          label: "Sale Return",
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <RotateCcw className="w-3 h-3 text-amber-600" />,
        };
      case "purchase_return":
        return {
          label: "Supplier Return",
          color: "bg-orange-50 text-orange-700 border-orange-200",
          icon: <RotateCcw className="w-3 h-3 text-orange-600" />,
        };
      case "adjustment_increase":
        return {
          label: "Stock Added",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Sliders className="w-3 h-3 text-blue-600" />,
        };
      case "adjustment_decrease":
        return {
          label: "Stock Reduced",
          color: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <Sliders className="w-3 h-3 text-purple-600" />,
        };
      case "damaged":
        return {
          label: "Damaged / Expired",
          color: "bg-red-50 text-red-700 border-red-200",
          icon: <AlertTriangle className="w-3 h-3 text-red-600" />,
        };
      case "lost":
        return {
          label: "Lost / Missing",
          color: "bg-stone-50 text-stone-700 border-stone-200",
          icon: <AlertTriangle className="w-3 h-3 text-stone-600" />,
        };
      default:
        return {
          label: type,
          color: "bg-slate-50 text-slate-700 border-slate-200",
          icon: <Sliders className="w-3 h-3 text-slate-600" />,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col my-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                {productName ? `Stock Audit History: ${productName}` : "Stock Movement & Audit Log"}
              </h4>
              <p className="text-xs text-slate-400">
                Track all inward, outward, and manual adjustments
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, invoice, reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Movement Types</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases (Restock)</option>
            <option value="sale_return">Sales Returns</option>
            <option value="adjustment_increase">Adjustments (+)</option>
            <option value="adjustment_decrease">Adjustments (-)</option>
            <option value="damaged">Damaged / Lost</option>
          </select>
        </div>

        {/* Movement Log List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-slate-600">No stock movements recorded yet.</p>
              <p className="mt-1">Movements are automatically logged on sales, returns, and manual adjustments.</p>
            </div>
          ) : (
            filteredMovements.map((movement) => {
              const badge = getMovementBadge(movement.type);
              const isPositive = movement.quantity > 0;

              return (
                <div
                  key={movement.id}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {movement.productName}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">{movement.reason}</p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {movement.date ? movement.date.slice(0, 16).replace("T", " ") : ""}
                      </span>
                      {movement.stockBefore !== undefined && movement.stockAfter !== undefined && (
                        <span>
                          Balance: {movement.stockBefore} → <strong>{movement.stockAfter}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isPositive ? `+${movement.quantity}` : movement.quantity}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
