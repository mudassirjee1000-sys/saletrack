import React, { useState, useRef, useEffect, useMemo } from "react";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { COUNTRIES, CountryItem, findCountryByIso } from "../data/countries";
import { Search, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

export interface PhoneValue {
  phone_e164: string;
  phone_country_code: string;
  phone_number: string;
  country_iso: string;
  isValid: boolean;
}

interface PhoneInputProps {
  id?: string;
  value?: string; // initial or controlled e164 or raw
  initialCountryIso?: string;
  onChange: (val: PhoneValue) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = "phone-input",
  value = "",
  initialCountryIso = "PK",
  onChange,
  required = true,
  disabled = false,
  label = "Phone Number",
  placeholder = "300 1234567",
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(() =>
    findCountryByIso(initialCountryIso)
  );
  const [localNumber, setLocalNumber] = useState<string>(() => {
    if (!value) return "";
    // If an E.164 value was provided, try stripping country dial code
    if (value.startsWith(selectedCountry.dialCode)) {
      return value.slice(selectedCountry.dialCode.length);
    }
    return value.replace(/^\+/, "");
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync selected country when initialCountryIso changes
  useEffect(() => {
    if (initialCountryIso) {
      const country = findCountryByIso(initialCountryIso);
      setSelectedCountry(country);
    }
  }, [initialCountryIso]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter countries by name or dial code
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const cleanQ = q.startsWith("+") ? q : q;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(cleanQ) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Validate and format phone number with libphonenumber-js
  const validationResult = useMemo(() => {
    const rawClean = localNumber.trim();
    if (!rawClean) {
      return {
        isValid: false,
        e164: "",
        national: "",
        errorMessage: required ? "Phone number is required" : "",
      };
    }

    try {
      const parsed = parsePhoneNumberFromString(rawClean, selectedCountry.iso as CountryCode);
      if (parsed && parsed.isValid()) {
        return {
          isValid: true,
          e164: parsed.format("E.164"),
          national: parsed.formatNational(),
          errorMessage: "",
        };
      } else {
        // Construct standard e164 fallback
        const cleanDigits = rawClean.replace(/\D/g, "").replace(/^0+/, "");
        const fallbackE164 = `${selectedCountry.dialCode}${cleanDigits}`;
        return {
          isValid: cleanDigits.length >= 7 && cleanDigits.length <= 15,
          e164: fallbackE164,
          national: rawClean,
          errorMessage: "Please enter a valid phone number for this country",
        };
      }
    } catch {
      return {
        isValid: false,
        e164: "",
        national: rawClean,
        errorMessage: "Invalid phone number format",
      };
    }
  }, [localNumber, selectedCountry, required]);

  // Notify parent on change
  useEffect(() => {
    const cleanDigits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
    const e164 = validationResult.isValid
      ? validationResult.e164
      : cleanDigits
      ? `${selectedCountry.dialCode}${cleanDigits}`
      : "";

    onChange({
      phone_e164: e164,
      phone_country_code: selectedCountry.dialCode,
      phone_number: cleanDigits || localNumber,
      country_iso: selectedCountry.iso,
      isValid: validationResult.isValid,
    });
  }, [localNumber, selectedCountry, validationResult.isValid, validationResult.e164]);

  const handleCountrySelect = (country: CountryItem) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Country Selector Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id={`${id}-country-btn`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex items-center space-x-2 px-3.5 py-3 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 text-slate-800 text-sm font-medium rounded-l-xl transition-colors select-none"
            title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
          >
            <span className="text-xl leading-none" role="img" aria-label={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
            <span className="font-semibold text-slate-700">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Searchable Country Popover */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 max-h-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Search Header */}
              <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    id={`${id}-search-input`}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="overflow-y-auto max-h-60 divide-y divide-slate-50">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => {
                    const isSelected = country.iso === selectedCountry.iso;
                    return (
                      <button
                        key={country.iso}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-blue-50 ${
                          isSelected ? "bg-blue-50/70 font-semibold text-blue-900" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="text-lg leading-none">{country.flag}</span>
                          <span className="truncate">{country.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 font-medium ml-2 shrink-0">
                          {country.dialCode}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No country matches "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Phone Number Input */}
        <div className="relative flex-1 flex items-center">
          <input
            id={id}
            type="tel"
            value={localNumber}
            onChange={(e) => setLocalNumber(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 rounded-r-xl focus:outline-none bg-transparent"
          />

          {localNumber.trim().length > 0 && (
            <div className="pr-3.5 flex items-center pointer-events-none">
              {validationResult.isValid ? (
                <span title="Valid phone number">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
              ) : (
                <span title="Incomplete or unformatted">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Normalized E.164 preview & feedback */}
      <div className="mt-1 flex items-center justify-between text-2xs text-slate-500 px-1">
        <span>
          Format: <span className="font-mono text-slate-600">{selectedCountry.dialCode} {placeholder}</span>
        </span>
        {validationResult.e164 && (
          <span className="font-mono text-blue-600 font-medium">
            Saved: {validationResult.e164}
          </span>
        )}
      </div>
    </div>
  );
};
