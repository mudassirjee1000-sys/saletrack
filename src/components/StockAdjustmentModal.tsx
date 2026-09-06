import React, { useState } from "react";
import { Product, ShopSettings, StockMovement } from "../types";
import { Sliders, X, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: string;
  settings: ShopSettings;
  onAdjustStock: (
    productId: string,
    newStock: number,
    movement: StockMovement
  ) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  settings,
  onAdjustStock,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0] ? products[0].id : "")
  );
  const [adjustmentType, setAdjustmentType] = useState<"set_exact" | "add_stock" | "remove_stock">(
    "set_exact"
  );
  const [quantityInput, setQuantityInput] = useState<string>("");
  const [reasonCategory, setReasonCategory] = useState<
    "recount" | "damaged" | "lost" | "expired" | "received" | "other"
  >("recount");
  const [customNote, setCustomNote] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const product = products.find((p) => p.id === selectedProductId);
  const currentStock = product ? product.stock : 0;

  const calculateNewStock = (): number => {
    const val = parseInt(quantityInput, 10);
    if (isNaN(val)) return currentStock;

    if (adjustmentType === "set_exact") {
      return Math.max(0, val);
    } else if (adjustmentType === "add_stock") {
      return currentStock + Math.max(0, val);
    } else {
      return Math.max(0, currentStock - Math.max(0, val));
    }
  };

  const newStock = calculateNewStock();
  const delta = newStock - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!product) {
      setError("Please select a product.");
      return;
    }

    const val = parseInt(quantityInput, 10);
    if (isNaN(val) || val < 0) {
      setError("Please enter a valid non-negative number.");
      return;
    }

    if (delta === 0) {
      setError("Adjustment would result in no change to stock.");
      return;
    }

    // Determine movement type
    let movementType: StockMovement["type"] = "adjustment_increase";
    if (delta < 0) {
      if (reasonCategory === "damaged" || reasonCategory === "expired") {
        movementType = "damaged";
      } else if (reasonCategory === "lost") {
        movementType = "lost";
      } else {
        movementType = "adjustment_decrease";
      }
    } else {
      movementType = "adjustment_increase";
    }

    const movement: StockMovement = {
      id: "mov_" + crypto.randomUUID().replace(/-/g, ""),
      productId: product.id,
      productName: product.name,
      quantity: delta,
      type: movementType,
      reason: `${reasonCategory.toUpperCase()}: ${customNote.trim() || "Stock adjusted manually"}`,
      date: new Date().toISOString(),
      stockBefore: currentStock,
      stockAfter: newStock,
      createdAt: new Date().toISOString(),
    };

    onAdjustStock(product.id, newStock, movement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Adjust Stock Level</h4>
              <p className="text-xs text-slate-400">Manual inventory balance correction</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setQuantityInput("");
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.stock} {p.unit || "pcs"})
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAdjustmentType("set_exact")}
                className={`py-1.5 rounded-md transition ${
                  adjustmentType === "set_exact" ? "bg-white text-slate-800 shadow-xs" : "text-slate-600"
                }`}
              >
                Set Exact Qty
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("add_stock")}
                className={`py-1.5 rounded-md transition ${
                  adjustmentType === "add_stock" ? "bg-white text-slate-800 shadow-xs" : "text-slate-600"
                }`}
              >
                + Add Qty
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("remove_stock")}
                className={`py-1.5 rounded-md transition ${
                  adjustmentType === "remove_stock" ? "bg-white text-slate-800 shadow-xs" : "text-slate-600"
                }`}
              >
                - Reduce Qty
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {adjustmentType === "set_exact"
                ? "New Total Stock Count"
                : adjustmentType === "add_stock"
                ? "Quantity to Add"
                : "Quantity to Remove"}
            </label>
            <input
              type="number"
              min="0"
              required
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              placeholder="Enter number..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
            />
          </div>

          {/* Reason Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="recount">Physical Recount / Audit</option>
                <option value="damaged">Damaged Goods</option>
                <option value="lost">Lost / Misplaced</option>
                <option value="expired">Expired Stock</option>
                <option value="received">Direct Stock In</option>
                <option value="other">Other Correction</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Note (Optional)</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Details..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Current Stock:</span>
              <span className="font-bold text-slate-700 text-sm">
                {currentStock} {product?.unit || "pcs"}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-400 block text-[11px]">Resulting Stock:</span>
              <span className="font-extrabold text-blue-600 text-sm">
                {newStock} {product?.unit || "pcs"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Delta:</span>
              <span
                className={`font-bold ${
                  delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-slate-500"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={delta === 0}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition disabled:opacity-40 disabled:pointer-events-none"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
