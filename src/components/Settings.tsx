import React, { useState, useEffect } from "react";
import { ShopSettings } from "../types";
import { CurrencySelect } from "./CurrencySelect";
import {
  Store,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Coins,
  Percent,
  Mail,
  Receipt,
  Printer,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface SettingsProps {
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => Promise<void> | void;
  onExportData: () => void;
  onImportData: (jsonString: string) => boolean | Promise<boolean>;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetData,
}) => {
  // Business Profile
  const [shopName, setShopName] = useState(settings.shopName || "SaleTrack Store");
  const [shopPhone, setShopPhone] = useState(settings.shopPhone || "");
  const [shopAddress, setShopAddress] = useState(settings.shopAddress || "");
  const [email, setEmail] = useState(settings.email || settings.businessEmail || "");

  // Currency & Inventory
  const [currency, setCurrency] = useState(settings.currency || "$");
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode || "USD");
  const [currencyName, setCurrencyName] = useState(settings.currencyName || "US Dollar");
  const [allowNegativeStock, setAllowNegativeStock] = useState(Boolean(settings.allowNegativeStock));

  // Tax Settings
  const [taxEnabled, setTaxEnabled] = useState(Boolean(settings.taxEnabled));
  const [taxName, setTaxName] = useState(settings.taxName || "Tax");
  const [taxRate, setTaxRate] = useState<number | string>(
    settings.taxRate !== undefined && settings.taxRate !== null ? settings.taxRate : 0
  );

  // Invoices & Receipts
  const [invoiceFooter, setInvoiceFooter] = useState(
    settings.invoiceFooter || "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!"
  );
  const [receiptType, setReceiptType] = useState<"thermal" | "a4">(settings.receiptType || "thermal");
  const [autoEmailReceipt, setAutoEmailReceipt] = useState(Boolean(settings.autoEmailReceipt));

  // Form State & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Update local form state when settings change from Supabase
  useEffect(() => {
    setShopName(settings.shopName || "SaleTrack Store");
    setShopPhone(settings.shopPhone || "");
    setShopAddress(settings.shopAddress || "");
    setEmail(settings.email || settings.businessEmail || "");
    setCurrency(settings.currency || "$");
    setCurrencyCode(settings.currencyCode || "USD");
    setCurrencyName(settings.currencyName || "US Dollar");
    setAllowNegativeStock(Boolean(settings.allowNegativeStock));
    setTaxEnabled(Boolean(settings.taxEnabled));
    setTaxName(settings.taxName || "Tax");
    setTaxRate(settings.taxRate !== undefined && settings.taxRate !== null ? settings.taxRate : 0);
    setInvoiceFooter(
      settings.invoiceFooter || "SaleTrack — Sales, Stock & Profit Made Simple. Thank you for your business!"
    );
    setReceiptType(settings.receiptType || "thermal");
    setAutoEmailReceipt(Boolean(settings.autoEmailReceipt));
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const parsedTaxRate = typeof taxRate === "string" ? parseFloat(taxRate) || 0 : taxRate || 0;

    const updated: ShopSettings = {
      shopName: shopName.trim() || "SaleTrack Store",
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      email: email.trim(),
      businessEmail: email.trim(),
      currency: currency.trim() || "$",
      currencyCode: currencyCode || "USD",
      currencyName: currencyName || "US Dollar",
      allowNegativeStock,
      invoiceFooter: invoiceFooter.trim(),
      autoEmailReceipt,
      taxEnabled,
      taxName: taxName.trim() || "Tax",
      taxRate: parsedTaxRate,
      receiptType,
    };

    try {
      await onSaveSettings(updated);
      setSaveSuccess("Settings saved successfully to Supabase and synced across your devices.");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error("Save settings error:", err);
      setSaveError(err.message || "Failed to save settings to Supabase. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const success = await Promise.resolve(onImportData(content));
          if (success) {
            setImportStatus("Database imported successfully! Refreshing view...");
            setTimeout(() => window.location.reload(), 1200);
          } else {
            setImportStatus("Error: Invalid backup file format.");
          }
        } catch (err: any) {
          setImportStatus("Error: " + (err?.message || "Import failed."));
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8 max-w-3xl mx-auto">
      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Business Settings & Preferences</span>
            </h2>
            <p className="text-xs text-slate-400">
              Settings are saved to Supabase and strictly isolated to your registered business
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Supabase Synced
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div
            id="settings-save-success"
            className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{saveSuccess}</div>
          </div>
        )}

        {saveError && (
          <div
            id="settings-save-error"
            className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{saveError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* SECTION 1: Business Profile */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-slate-500">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Business Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Business / Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-shop-name"
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Modern Retailers"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    id="settings-shop-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@mybusiness.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  id="settings-shop-phone"
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="+1 (555) 0199"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Address / Location</label>
                <input
                  id="settings-shop-address"
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="123 Commercial Way, Suite 400"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 2: Currency & Inventory Rules */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-slate-500">
              <Coins className="w-3.5 h-3.5 text-blue-600" />
              <span>Currency & Stock Rules</span>
            </h3>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Default Currency</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  60+ supported currencies
                </span>
              </label>

              <CurrencySelect
                selectedCode={currencyCode}
                selectedSymbol={currency}
                selectedName={currencyName}
                onChange={(c) => {
                  setCurrency(c.symbol);
                  setCurrencyCode(c.code);
                  setCurrencyName(c.name);
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-slate-700 mb-1 text-[11px]">
                  Custom Symbol Display
                </label>
                <input
                  id="settings-currency-symbol"
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="$ or ₨ or € or £"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center pt-4 sm:pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="settings-negative-stock"
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="font-medium text-slate-700">Allow Negative Stock on Sales</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 3: Tax Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-slate-500">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                <span>Sales Tax / VAT Settings</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="settings-tax-toggle"
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-medium text-slate-700">Enable Tax on Sales</span>
              </label>
            </div>

            {taxEnabled ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tax Name / Label
                  </label>
                  <input
                    id="settings-tax-name"
                    type="text"
                    required={taxEnabled}
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    placeholder="e.g. Sales Tax, VAT, GST"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      id="settings-tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required={taxEnabled}
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="e.g. 5 or 8.25"
                      className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 sm:col-span-2">
                  When enabled, tax is automatically calculated at checkout according to this percentage and itemized on customer invoices.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Tax is currently disabled. Checkout totals will not calculate tax.
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 4: Invoices & Receipts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-slate-500">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              <span>Invoices & Receipts</span>
            </h3>

            {/* Receipt Type Selection */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Default Receipt & Invoice Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReceiptType("thermal")}
                  className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition ${
                    receiptType === "thermal"
                      ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Receipt className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-xs">Thermal POS Roll (80mm)</div>
                    <div className="text-[11px] text-slate-500">
                      Optimized for standard POS receipt printers and compact rolls
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptType("a4")}
                  className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition ${
                    receiptType === "a4"
                      ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Printer className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-xs">Standard Document (A4 / Letter)</div>
                    <div className="text-[11px] text-slate-500">
                      Full-page tax invoice layout for formal billing and office printers
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Invoice Footer */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Receipt Footer Greeting / Thank You Note
              </label>
              <input
                id="settings-invoice-footer"
                type="text"
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                placeholder="Thank you for shopping with us! Please come again."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Automatic Email Receipt */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="settings-auto-email"
                  type="checkbox"
                  checked={autoEmailReceipt}
                  onChange={(e) => setAutoEmailReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Automatic Email Receipt
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    Automatically dispatch a digital copy of the receipt when a customer's email is entered during sale recording.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              id="save-settings-submit-btn"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup, Export & Restore */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" />
          <span>Data Storage & Backups</span>
        </h3>
        <p className="text-xs text-slate-400">
          Your business records and settings are securely stored in Supabase Cloud. You can also export full JSON snapshots to archive or transfer data at any time.
        </p>

        {importStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg font-medium">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export button */}
          <button
            id="export-data-btn"
            onClick={onExportData}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download Store Backup (JSON)</span>
          </button>

          {/* Import button */}
          <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Restore Backup (Upload JSON)</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Danger Zone: Reset to sample */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-800 block">Reset to Sample Store Data</span>
            <span className="text-slate-400 text-[11px]">
              Restores initial demonstration products, customers, and test sales.
            </span>
          </div>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-xs transition cursor-pointer"
              >
                Yes, Reset All
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md font-semibold text-xs shrink-0 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Architecture & Tenant Security Guidance */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-2.5 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
          <FileCode className="w-4 h-4 text-blue-600" />
          <span>Multi-Tenant Cloud Persistence</span>
        </h4>
        <div className="space-y-2 text-[11px] leading-relaxed text-slate-500">
          <p>
            <strong className="text-slate-700">Supabase & Cloud SQL Storage:</strong> All settings configured on this page (Business Name, Phone, Email, Address, Currency, Sales Tax/VAT, Invoice Footers, and Receipt layout) are stored persistently in cloud database tables. Settings are strictly keyed to your business ID, preventing conflicts with any other businesses.
          </p>
          <p>
            <strong className="text-slate-700">Multi-Device Synchronization:</strong> Changes saved here are immediately reflected across all sessions, active team members, receipts, reports, and invoices.
          </p>
        </div>
      </div>
    </div>
  );
};
