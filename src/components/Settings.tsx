import React, { useState } from "react";
import { ShopSettings } from "../types";
import { CurrencySelect } from "./CurrencySelect";
import {
  Settings as SettingsIcon,
  Store,
  DollarSign,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  FileCode,
  Coins,
} from "lucide-react";

interface SettingsProps {
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => void;
  onExportData: () => void;
  onImportData: (jsonString: string) => boolean;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [currency, setCurrency] = useState(settings.currency || "$");
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode || "USD");
  const [currencyName, setCurrencyName] = useState(settings.currencyName || "US Dollar");
  const [allowNegativeStock, setAllowNegativeStock] = useState(settings.allowNegativeStock);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooter);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopSettings = {
      shopName: shopName.trim() || "SaleTrack Store",
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      currency: currency.trim() || "$",
      currencyCode: currencyCode || "USD",
      currencyName: currencyName || "US Dollar",
      allowNegativeStock,
      invoiceFooter: invoiceFooter.trim(),
    };
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportData(content);
        if (success) {
          setImportStatus("Database imported successfully! Refreshing view...");
          setTimeout(() => window.location.reload(), 1200);
        } else {
          setImportStatus("Error: Invalid backup file format.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 max-w-3xl mx-auto">
      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Shop Profile & Preferences</span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize receipt headers, currency, and stock rules
            </p>
          </div>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Shop Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Store / Business Name</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Address / Location</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Market Street, Stall #4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Currency Selection & Negative Stock Rule */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span>Business Currency (Global Support)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Searchable list of 60+ world currencies
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

            {/* Custom symbol tweak & negative stock setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-slate-600 mb-1 text-[11px]">
                  Custom Symbol Display (optional)
                </label>
                <input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="$ or ₨ or €"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                />
              </div>

              <div className="flex items-center pt-4 sm:pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
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

          {/* Invoice Receipt Footer Note */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Receipt Footer Greeting / Thank You Note
            </label>
            <input
              type="text"
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              placeholder="Thank you for shopping with us! Please come again."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs transition active:scale-95"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup, Export & Restore */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" />
          <span>Data Storage & Backups (Version 1)</span>
        </h3>
        <p className="text-xs text-slate-400">
          All data is saved reliably in your browser's persistent LocalStorage database. You can export your records at any time as a JSON file to transfer between devices or safeguard your data.
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
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition shadow-xs"
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
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-xs transition"
              >
                Yes, Reset All
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-semibold text-xs transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md font-semibold text-xs shrink-0 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          )}
        </div>

      </div>

      {/* Developer Guidance Section (for Acode & Version 2) */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-2.5 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
          <FileCode className="w-4 h-4 text-blue-600" />
          <span>Developer Notes & Version 2 Roadmap</span>
        </h4>
        <div className="space-y-2 text-[11px] leading-relaxed text-slate-500">
          <p>
            <strong className="text-slate-700">Version 1 Architecture:</strong> Built with modular components and a centralized repository abstraction (<code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">storage.ts</code>). Because all database interactions flow through repository functions, you can easily plug in a cloud database (such as SQLite, PostgreSQL, or Firebase) in Version 2 with zero changes to UI components.
          </p>
          <p>
            <strong className="text-slate-700">Running on Android with Acode:</strong> Acode includes a built-in static HTML/JS web preview. In this project, running <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">npm run build</code> packages the entire application into the standard <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">dist/</code> folder. You can open that folder directly in Acode and tap the Play button to run it offline!
          </p>
        </div>
      </div>
    </div>
  );
};
