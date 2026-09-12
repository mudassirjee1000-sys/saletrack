import React, { useState, useMemo } from "react";
import { Sale, SaleReturn, SaleReturnItem, ShopSettings } from "../types";
import { getSaleReturnableItems } from "../utils/calculations";
import {
  RotateCcw,
  X,
  AlertCircle,
  Package,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface SaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  settings: ShopSettings;
  saleReturns?: SaleReturn[];
  onProcessReturn: (
    saleReturn: SaleReturn,
    options: {
      restock: boolean;
      refundMethod: "cash" | "bank" | "card" | "credit_adjustment" | "other";
    }
  ) => Promise<void> | void;
}

export const SaleReturnModal: React.FC<SaleReturnModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
  saleReturns = [],
  onProcessReturn,
}) => {
  // Calculate item-level return limits accounting for prior partial returns
  const returnableItems = useMemo(() => {
    return getSaleReturnableItems(sale, saleReturns);
  }, [sale, saleReturns]);

  const allItemsFullyReturned = returnableItems.length > 0 && returnableItems.every((it) => it.remainingReturnableQty <= 0);
  const remainingRefundableMax = Math.max(0, (sale.total || 0) - (sale.refundedAmount || 0));

  // Track quantities to return per product
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    returnableItems.forEach((item) => {
      initial[item.productId] = 0;
    });
    return initial;
  });

  const [refundMethod, setRefundMethod] = useState<
    "cash" | "bank" | "card" | "credit_adjustment" | "other"
  >(
    sale.paymentType === "credit"
      ? "credit_adjustment"
      : "cash"
  );

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

    // Cap refund to remaining refundable money on the sale
    return Math.max(0, Math.min(remainingRefundableMax, total));
  };

  const refundTotal = calculateRefundAmount();
  const totalItemsToReturn = Object.values(returnQuantities).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (totalItemsToReturn <= 0) {
      setError("Please select at least 1 item quantity to return.");
      return;
    }

    if (refundTotal > remainingRefundableMax) {
      setError(`Refund amount cannot exceed remaining invoice balance of ${settings.currency}${remainingRefundableMax.toFixed(2)}.`);
      return;
    }

    const itemsToReturn: SaleReturnItem[] = [];
    for (const item of sale.items) {
      const qty = returnQuantities[item.productId] || 0;
      if (qty > 0) {
        const itemInfo = returnableItems.find((r) => r.productId === item.productId);
        const maxReturnable = itemInfo ? itemInfo.remainingReturnableQty : item.quantity;
        if (qty > maxReturnable) {
          setError(`Cannot return ${qty} units of ${item.productName}. Remaining returnable is ${maxReturnable}.`);
          return;
        }

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
    }

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
      await onProcessReturn(newSaleReturn, {
        restock,
        refundMethod,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to process return. Please check inputs and try again.");
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
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prior Returns Warning / Summary */}
        {sale.refundedAmount && sale.refundedAmount > 0 ? (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-amber-900">
              <span>Previous Refunds on this Invoice:</span>
              <span>{settings.currency}{sale.refundedAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-amber-700 text-[11px]">
              <span>Remaining Refundable Balance:</span>
              <span className="font-bold">{settings.currency}{remainingRefundableMax.toFixed(2)}</span>
            </div>
          </div>
        ) : null}

        {allItemsFullyReturned && (
          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All items on this invoice have already been returned and refunded.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selector Table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Select Items & Quantities to Return
              </label>
              <span className="text-[11px] text-slate-400">
                Strict limit: cannot exceed sold quantity
              </span>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-52 overflow-y-auto">
              {sale.items.map((item) => {
                const currentQty = returnQuantities[item.productId] || 0;
                const itemInfo = returnableItems.find((r) => r.productId === item.productId);
                const maxQty = itemInfo ? itemInfo.remainingReturnableQty : item.quantity;
                const alreadyReturned = itemInfo ? itemInfo.alreadyReturnedQty : 0;
                const isItemFullyReturned = maxQty <= 0;

                return (
                  <div
                    key={item.productId}
                    className={`p-3 flex items-center justify-between gap-3 text-xs transition ${
                      isItemFullyReturned ? "bg-slate-50/70 opacity-60" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.productName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>Sold: <strong className="text-slate-600">{item.quantity}</strong></span>
                        {alreadyReturned > 0 && (
                          <span className="text-amber-600 font-medium">
                            • Returned: {alreadyReturned}
                          </span>
                        )}
                        <span>• Price: {settings.currency}{item.sellingPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isItemFullyReturned ? (
                        <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-semibold">
                          Fully Returned
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                            <input
                              type="number"
                              min="0"
                              max={maxQty}
                              value={currentQty}
                              disabled={isProcessing || isItemFullyReturned}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.productId,
                                  parseInt(e.target.value, 10) || 0,
                                  maxQty
                                )
                              }
                              className="w-14 text-center font-bold text-slate-800 text-xs bg-transparent focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 pr-1">/ {maxQty}</span>
                          </div>
                          <button
                            type="button"
                            disabled={isProcessing || isItemFullyReturned}
                            onClick={() => handleQuantityChange(item.productId, maxQty, maxQty)}
                            className="px-2 py-1 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition"
                          >
                            All
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Refund Disbursement Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "cash", label: "Cash Refund" },
                { id: "bank", label: "Bank Transfer" },
                { id: "card", label: "Card Reversal" },
                { id: "credit_adjustment", label: "Credit Adj." },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setRefundMethod(method.id as any)}
                  className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition ${
                    refundMethod === method.id
                      ? "border-amber-500 bg-amber-50/60 text-amber-900 font-bold shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {refundMethod === "credit_adjustment" && (
              <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Deducts {settings.currency}{refundTotal.toFixed(2)} directly from customer's outstanding balance & updates ledger.
              </p>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Return
            </label>
            <input
              type="text"
              value={reason}
              disabled={isProcessing}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Defective item, customer changed mind, wrong size"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Restock Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Restock Returned Items</p>
                <p className="text-[11px] text-slate-400">
                  Automatically add returned quantities back to inventory stock & log movement
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={restock}
              disabled={isProcessing}
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
              disabled={isProcessing || totalItemsToReturn === 0 || allItemsFullyReturned}
              className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
              <span>{isProcessing ? "Processing Return..." : "Confirm Return & Refund"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
