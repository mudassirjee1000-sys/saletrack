import React, { useRef } from "react";
import { Sale, ShopSettings } from "../types";
import { Printer, Download, Share2, X, CheckCircle2, Clock } from "lucide-react";

interface InvoiceModalProps {
  sale: Sale | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, settings, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copiedNotice, setCopiedNotice] = React.useState(false);

  if (!sale) return null;


  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate clean self-contained HTML for receipt download
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${sale.invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 400px; margin: auto; color: #111; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px; }
          .title { font-size: 20px; font-weight: bold; margin: 0; }
          .sub { font-size: 13px; color: #555; margin: 3px 0; }
          .meta { font-size: 13px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0; }
          th { text-align: left; border-bottom: 1px solid #333; padding: 6px 2px; }
          td { padding: 6px 2px; border-bottom: 1px dashed #eee; }
          .text-right { text-align: right; }
          .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .badge-cash { background: #e6f4ea; color: #137333; }
          .badge-credit { background: #fce8e6; color: #c5221f; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${settings.shopName}</h1>
          <p class="sub">${settings.shopAddress}</p>
          <p class="sub">Tel: ${settings.shopPhone}</p>
        </div>
        <div class="meta">
          <div><strong>Invoice #:</strong> ${sale.invoiceNumber}</div>
          <div><strong>Date:</strong> ${sale.date}</div>
          <div><strong>Customer:</strong> ${sale.customerName} ${sale.customerPhone ? `(${sale.customerPhone})` : ""}</div>
          <div style="margin-top: 6px;">
            <span class="badge ${sale.paymentType === "cash" ? "badge-cash" : "badge-credit"}">
              Payment: ${sale.paymentType === "cash" ? "PAID (CASH)" : "UNPAID (CREDIT)"}
            </span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items
              .map(
                (item) => `
              <tr>
                <td>${item.productName}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${settings.currency}${item.sellingPrice.toFixed(2)}</td>
                <td class="text-right">${settings.currency}${item.total.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
          <span>Subtotal:</span>
          <span>${settings.currency}${sale.subtotal.toFixed(2)}</span>
        </div>
        ${
          sale.discount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; color: #c5221f;">
                <span>Discount:</span>
                <span>-${settings.currency}${sale.discount.toFixed(2)}</span>
              </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px;">
          <span>Grand Total:</span>
          <span>${settings.currency}${sale.total.toFixed(2)}</span>
        </div>
        <div class="footer">
          <p>${settings.invoiceFooter || "Thank you for shopping with us!"}</p>
          <p style="font-size: 10px; color: #888; margin-top: 6px;">SaleTrack — Sales, Stock & Profit Made Simple</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${sale.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const itemsSummary = sale.items
      .map((i) => `• ${i.productName} x${i.quantity} = ${settings.currency}${i.total.toFixed(2)}`)
      .join("\n");

    const textToShare = `🧾 INVOICE: ${sale.invoiceNumber}
Shop: ${settings.shopName}
Date: ${sale.date}
Customer: ${sale.customerName}
Status: ${sale.paymentType === "cash" ? "Paid in Cash" : "Credit (Due)"}

ITEMS:
${itemsSummary}

Total: ${settings.currency}${sale.total.toFixed(2)}
${settings.invoiceFooter}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${sale.invoiceNumber} - ${settings.shopName}`,
          text: textToShare,
        });
      } catch {
        // User cancelled share
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3000);
      } catch (err) {
        console.warn("Could not copy:", err);
      }
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden my-6 border border-slate-200">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sale Receipt & Invoice
          </span>
          <button
            id="close-invoice-btn"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            aria-label="Close invoice"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 bg-white print:p-0 print:m-0" id="printable-receipt">
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">{settings.shopName}</h2>
            {settings.shopAddress && (
              <p className="text-xs text-slate-400 mt-1">{settings.shopAddress}</p>
            )}
            {settings.shopPhone && (
              <p className="text-xs text-slate-400">Phone: {settings.shopPhone}</p>
            )}
          </div>

          {/* Invoice Metadata */}
          <div className="my-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-400">Invoice No:</span>
              <span className="font-mono font-bold text-slate-800">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span className="font-medium text-slate-700">{sale.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Customer:</span>
              <span className="font-semibold text-slate-800">
                {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ""}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-2">
              <span className="text-slate-400">Payment Status:</span>
              {sale.paymentType === "cash" ? (
                <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Paid (Cash)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                  <Clock className="w-3 h-3" /> On Credit (Debt)
                </span>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-slate-200 py-2 my-4">
            <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 py-2 text-xs text-slate-700 items-center">
                  <div className="col-span-6 pr-1">
                    <p className="font-medium text-slate-800 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                  </div>
                  <div className="col-span-2 text-center font-medium">{item.quantity}</div>
                  <div className="col-span-2 text-right text-slate-600">
                    {settings.currency}
                    {item.sellingPrice.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right font-semibold text-slate-800">
                    {settings.currency}
                    {item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {settings.currency}
                {sale.subtotal.toFixed(2)}
              </span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>
                  -{settings.currency}
                  {sale.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-800 text-slate-800">
              <span className="text-sm font-bold">Grand Total</span>
              <span className="text-lg font-bold">
                {settings.currency}
                {sale.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-200">
            <p className="text-xs text-slate-500 italic">{settings.invoiceFooter}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1.5">
              SaleTrack — Sales, Stock & Profit Made Simple
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-t border-slate-100">
          <button
            id="print-invoice-btn"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-100 active:scale-95 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
          <button
            id="download-invoice-btn"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-100 active:scale-95 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Save</span>
          </button>
          <button
            id="share-invoice-btn"
            onClick={handleShare}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-semibold text-xs active:scale-95 transition shadow-xs text-white ${
              copiedNotice ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {copiedNotice ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};
