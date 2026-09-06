import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { PhoneInput, PhoneValue } from "../PhoneInput";
import { COUNTRIES, CountryItem, findCountryByIso } from "../../data/countries";
import { WORLD_CURRENCIES } from "../../currencies";
import {
  Building2,
  User as UserIcon,
  Globe,
  Coins,
  MapPin,
  Mail,
  Image as ImageIcon,
  ArrowRight,
  AlertCircle,
  LogOut,
} from "lucide-react";

export const BusinessRegistration: React.FC = () => {
  const { user, registerBusiness, signOut, businessLoading } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState(() => user?.user_metadata?.full_name || "");
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(() =>
    findCountryByIso("PK") // Default country option (Pakistan +92)
  );
  const [currency, setCurrency] = useState(selectedCountry.currency);
  const [currencySymbol, setCurrencySymbol] = useState(selectedCountry.currencySymbol);

  const [phoneState, setPhoneState] = useState<PhoneValue>({
    phone_e164: "",
    phone_country_code: selectedCountry.dialCode,
    phone_number: "",
    country_iso: selectedCountry.iso,
    isValid: false,
  });

  const [address, setAddress] = useState("");
  const [businessEmail, setBusinessEmail] = useState(() => user?.email || "");
  const [logoUrl, setLogoUrl] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iso = e.target.value;
    const country = findCountryByIso(iso);
    setSelectedCountry(country);
    // Auto-suggest matching currency
    setCurrency(country.currency);
    setCurrencySymbol(country.currencySymbol);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const cur = WORLD_CURRENCIES.find((c) => c.code === code);
    if (cur) {
      setCurrency(cur.code);
      setCurrencySymbol(cur.symbol);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanBizName = businessName.trim();
    const cleanOwnerName = ownerName.trim();

    if (!cleanBizName) {
      setError("Please enter your business name.");
      return;
    }

    if (!cleanOwnerName) {
      setError("Please enter the business owner's name.");
      return;
    }

    if (!phoneState.phone_number.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!phoneState.isValid) {
      setError(`Please enter a valid phone number for ${selectedCountry.name} (e.g. ${selectedCountry.dialCode} 300 1234567).`);
      return;
    }

    setSubmitting(true);
    try {
      await registerBusiness({
        business_name: cleanBizName,
        owner_name: cleanOwnerName,
        country: selectedCountry.name,
        currency,
        currency_symbol: currencySymbol,
        phone_country_code: phoneState.phone_country_code,
        phone_number: phoneState.phone_number,
        phone_e164: phoneState.phone_e164,
        address: address.trim() || undefined,
        business_email: businessEmail.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
      });
      // After registration, AuthContext will set business, unlocking the dashboard!
    } catch (err: any) {
      setError(err.message || "Failed to create business. Please check connection.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-slate-100 font-sans">
      <div className="max-w-xl w-full">
        {/* Top Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-blue-500/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Register Your Business
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Set up your store details to generate your isolated database workspace.
          </p>
          <div className="mt-2 text-2xs text-slate-500 flex items-center justify-center space-x-2">
            <span>Signed in as <strong className="text-slate-300 font-mono">{user?.email}</strong></span>
            <span>&bull;</span>
            <button
              onClick={() => signOut()}
              className="text-red-400 hover:text-red-300 inline-flex items-center space-x-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-800">Registration Notice</p>
                <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Name (Required) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-business-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Al-Madina Superstore"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            {/* Owner Name (Required) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-owner-name"
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Mudassir Khan"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            {/* Country & Currency Row (Required) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <select
                    id="reg-country"
                    required
                    value={selectedCountry.iso}
                    onChange={handleCountryChange}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer shadow-sm font-medium"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.flag} {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <select
                    id="reg-currency"
                    required
                    value={currency}
                    onChange={handleCurrencyChange}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer shadow-sm font-medium"
                  >
                    {WORLD_CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.code} — {cur.name} ({cur.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* International Phone Number (Required) */}
            <div>
              <PhoneInput
                id="reg-phone"
                initialCountryIso={selectedCountry.iso}
                label="Business Phone Number"
                required={true}
                placeholder="300 1234567"
                onChange={setPhoneState}
              />
            </div>

            {/* Optional Section Divider */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">
                Optional Business Information
              </span>
            </div>

            {/* Business Address (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Business Address (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop #14, Commercial Market, Main Road"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Business Email (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Business Contact Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-business-email"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="info@yourbusiness.com"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Logo URL (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Logo URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="reg-logo-url"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                id="btn-create-business"
                type="submit"
                disabled={submitting || businessLoading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 cursor-pointer"
              >
                <span>{submitting ? "Creating Your Business..." : "Create Business & Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-2xs text-center text-slate-400 mt-2">
                Business registration is mandatory. Your account will start with clean, isolated records.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
