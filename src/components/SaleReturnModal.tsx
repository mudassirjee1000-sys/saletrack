import React, { useState } from "react";
import { Sale, SaleReturn, SaleReturnItem, ShopSettings } from "../types";
import {
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface SaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  settings: ShopSettings;
  onProcessReturn: (
    saleReturn: SaleReturn,
    options: {
      restock: boolean;
      refundMethod: "cash" | "bank" | "card" | "credit_adjustment" | "other";
    }
  ) => void;
}

export const SaleReturnModal: React.FC<SaleReturnModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
  onProcessReturn,
}) => {
  // Track quantities to return per product
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sale.items.forEach((item) => {
      initial[item.productId] = 0;
    });
    return initial;
  });

  const [refundMethod, setRefundMethod] = useState<
    "cash" | "bank" | "card" | "credit_adjustment" | "other"
  >(sale.paymentType === "cash" ? "cash" : "credit_adjustment");

  const [restock, setRestock] = useState<boolean>(true);
  const [reason, setReason] = useState<string>("Customer exchange / refund");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleQuantityChange = (productId: string, qty: number, maxQty: number) => {
    const safeQty = Math.max(0, Math.min(qty, maxQty));
    setReturnQuantities((prev) => ({
      ...prev,
      [productId]: safeQty,
    }));
  };

  // Calculate total refund amount
  const calculateRefundAmount = () => {
    let total = 0;
    sale.items.forEach((item) => {
      const qty = returnQuantities[item.productId] || 0;
      total += item.sellingPrice * qty;
    });

    // Proportionally handle discount if applied to original sale
    if (sale.discount && sale.discount > 0 && sale.subtotal > 0) {
      const discountRatio = sale.discount / sale.subtotal;
      total -= total * discountRatio;
    }

    return Math.max(0, total);
  };

  const refundTotal = calculateRefundAmount();
  const totalItemsToReturn = Object.values(returnQuantities).reduce((a, b) => a + b, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (totalItemsToReturn <= 0) {
      setError("Please select at least 1 item quantity to return.");
      return;
    }

    const itemsToReturn: SaleReturnItem[] = [];
    sale.items.forEach((item) => {
      const qty = returnQuantities[item.productId] || 0;
      if (qty > 0) {
        itemsToReturn.push({
          productId: item.productId,
          productName: item.productName,
          quantity: qty,
          sellingPrice: item.sellingPrice,
          purchasePrice: item.purchasePrice,
          total: item.sellingPrice * qty,
          cogs: item.purchasePrice * qty,
        });
      }
    });

    setIsProcessing(true);

    const newSaleReturn: SaleReturn = {
      id: "ret_" + crypto.randomUUID().replace(/-/g, ""),
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerId: sale.customerId,
      customerName: sale.customerName,
      date: new Date().toISOString(),
      items: itemsToReturn,
      refundAmount: refundTotal,
      refundMethod,
      reason: reason.trim() || "Customer Return",
      createdAt: new Date().toISOString(),
    };

    try {
      onProcessReturn(newSaleReturn, {
        restock,
        refundMethod,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process return.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Process Sale Return / Refund</h4>
              <p className="text-xs text-slate-400">
                Invoice: <span className="font-mono font-bold text-slate-700">{sale.invoiceNumber}</span> • {sale.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
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
          {/* Item Selector Table */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Items & Quantities to Return
            </label>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
              {sale.items.map((item) => {
                const currentQty = returnQuantities[item.productId] || 0;
                return (
                  <div
                    key={item.productId}
                    className="p-3 flex items-center justify-between gap-3 text-xs bg-white hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-400">
                        {settings.currency}
                        {item.sellingPrice.toFixed(2)} each • Sold: {item.quantity} units
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(item.productId, currentQty - 1, item.quantity)
                        }
                        className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={currentQty}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.productId,
                            parseInt(e.target.value) || 0,
                            item.quantity
                          )
                        }
                        className="w-12 py-1 text-center font-bold border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(item.productId, currentQty + 1, item.quantity)
                        }
                        className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Method & Restock Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refund Method
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash Refund</option>
                <option value="credit_adjustment">Deduct from Customer Debt</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card / POS</option>
                <option value="other">Other / Store Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Return
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Defective, Wrong Item, Customer Changed Mind"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Restock Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Restock Returned Items</p>
                <p className="text-[11px] text-slate-400">
                  Automatically add returned quantities back to inventory stock
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          {/* Refund Calculation Summary */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-amber-900 block">Total Refund Due:</span>
              <span className="text-[11px] text-amber-700">
                {totalItemsToReturn} item{totalItemsToReturn === 1 ? "" : "s"} selected
              </span>
            </div>
            <span className="text-base font-extrabold text-amber-900">
              {settings.currency}
              {refundTotal.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || totalItemsToReturn === 0}
              className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Processing..." : "Confirm Return & Refund"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
