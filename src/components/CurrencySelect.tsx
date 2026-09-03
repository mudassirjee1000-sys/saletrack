import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Check, ChevronDown, Coins, X } from "lucide-react";
import { WORLD_CURRENCIES, CurrencyItem, findCurrency } from "../currencies";

interface CurrencySelectProps {
  selectedCode?: string;
  selectedSymbol: string;
  selectedName?: string;
  onChange: (currency: { code: string; name: string; symbol: string }) => void;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  selectedCode,
  selectedSymbol,
  selectedName,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active currency item resolution
  const activeCurrency = useMemo(() => {
    if (selectedCode) {
      const byCode = WORLD_CURRENCIES.find(
        (c) => c.code.toUpperCase() === selectedCode.toUpperCase()
      );
      if (byCode) return byCode;
    }
    return findCurrency(selectedSymbol) || {
      code: selectedCode || "USD",
      name: selectedName || "US Dollar",
      symbol: selectedSymbol || "$",
    };
  }, [selectedCode, selectedSymbol, selectedName]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filtered list
  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WORLD_CURRENCIES;
    return WORLD_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (currency: CurrencyItem) => {
    onChange({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Current selection trigger button */}
      <button
        type="button"
        id="currency-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between min-h-[46px] px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-left shadow-xs hover:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs tracking-wider border border-blue-100 shrink-0">
            {activeCurrency.code}
          </span>
          <span className="text-sm font-medium text-slate-800 truncate">
            {activeCurrency.name}
          </span>
          <span className="text-slate-400 text-xs shrink-0">—</span>
          <span className="font-bold text-slate-900 text-base shrink-0">
            {activeCurrency.symbol}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Change</span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Live display badge preview */}
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Format preview:</span>
        <span className="font-semibold text-blue-600 bg-blue-50/60 px-2 py-0.5 rounded border border-blue-100/60">
          {activeCurrency.symbol}10,000
        </span>
      </div>

      {/* Searchable Dropdown / Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              id="currency-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currency (e.g. PKR, USD, Euro, Rupee, ₨)..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Currency list with touch-friendly 44px+ height */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100" role="listbox">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No currencies matching "{searchQuery}"
              </div>
            ) : (
              filteredCurrencies.map((c) => {
                const isSelected =
                  c.code.toUpperCase() === activeCurrency.code.toUpperCase() ||
                  c.symbol === activeCurrency.symbol;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-left transition hover:bg-blue-50/50 cursor-pointer ${
                      isSelected ? "bg-blue-50/80 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-12 text-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-xs tracking-wider shrink-0 border border-slate-200">
                        {c.code}
                      </span>
                      <span className="text-sm text-slate-800 truncate">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold text-slate-900 min-w-[28px] text-right">
                        {c.symbol}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick note on Version 1 primary business currency */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600">
              <Coins className="w-3.5 h-3.5 text-blue-500" />
              Primary Business Currency
            </span>
            <span className="text-slate-400">ISO 4217 ready</span>
          </div>
        </div>
      )}
    </div>
  );
};
