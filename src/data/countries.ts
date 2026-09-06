export interface CountryItem {
  name: string;
  iso: string;
  dialCode: string;
  flag: string;
  currency: string;
  currencySymbol: string;
}

export const COUNTRIES: CountryItem[] = [
  // Frequently requested & major markets
  { name: "Pakistan", iso: "PK", dialCode: "+92", flag: "🇵🇰", currency: "PKR", currencySymbol: "₨" },
  { name: "United States", iso: "US", dialCode: "+1", flag: "🇺🇸", currency: "USD", currencySymbol: "$" },
  { name: "United Kingdom", iso: "GB", dialCode: "+44", flag: "🇬🇧", currency: "GBP", currencySymbol: "£" },
  { name: "Canada", iso: "CA", dialCode: "+1", flag: "🇨🇦", currency: "CAD", currencySymbol: "CA$" },
  { name: "Australia", iso: "AU", dialCode: "+61", flag: "🇦🇺", currency: "AUD", currencySymbol: "A$" },
  { name: "United Arab Emirates", iso: "AE", dialCode: "+971", flag: "🇦🇪", currency: "AED", currencySymbol: "د.إ" },
  { name: "Saudi Arabia", iso: "SA", dialCode: "+966", flag: "🇸🇦", currency: "SAR", currencySymbol: "﷼" },
  { name: "Germany", iso: "DE", dialCode: "+49", flag: "🇩🇪", currency: "EUR", currencySymbol: "€" },
  { name: "France", iso: "FR", dialCode: "+33", flag: "🇫🇷", currency: "EUR", currencySymbol: "€" },
  { name: "India", iso: "IN", dialCode: "+91", flag: "🇮🇳", currency: "INR", currencySymbol: "₹" },
  { name: "Bangladesh", iso: "BD", dialCode: "+880", flag: "🇧🇩", currency: "BDT", currencySymbol: "৳" },
  { name: "Qatar", iso: "QA", dialCode: "+974", flag: "🇶🇦", currency: "QAR", currencySymbol: "ر.ق" },
  { name: "Kuwait", iso: "KW", dialCode: "+965", flag: "🇰🇼", currency: "KWD", currencySymbol: "د.ك" },
  { name: "Oman", iso: "OM", dialCode: "+968", flag: "🇴🇲", currency: "OMR", currencySymbol: "ر.ع." },
  { name: "Bahrain", iso: "BH", dialCode: "+973", flag: "🇧🇭", currency: "BHD", currencySymbol: "ب.د" },
  { name: "Turkey", iso: "TR", dialCode: "+90", flag: "🇹🇷", currency: "TRY", currencySymbol: "₺" },
  { name: "Malaysia", iso: "MY", dialCode: "+60", flag: "🇲🇾", currency: "MYR", currencySymbol: "RM" },
  { name: "Singapore", iso: "SG", dialCode: "+65", flag: "🇸🇬", currency: "SGD", currencySymbol: "S$" },
  { name: "Indonesia", iso: "ID", dialCode: "+62", flag: "🇮🇩", currency: "IDR", currencySymbol: "Rp" },
  { name: "Philippines", iso: "PH", dialCode: "+63", flag: "🇵🇭", currency: "PHP", currencySymbol: "₱" },
  { name: "South Africa", iso: "ZA", dialCode: "+27", flag: "🇿🇦", currency: "ZAR", currencySymbol: "R" },
  { name: "Nigeria", iso: "NG", dialCode: "+234", flag: "🇳🇬", currency: "NGN", currencySymbol: "₦" },
  { name: "Egypt", iso: "EG", dialCode: "+20", flag: "🇪🇬", currency: "EGP", currencySymbol: "E£" },
  { name: "Kenya", iso: "KE", dialCode: "+254", flag: "🇰🇪", currency: "KES", currencySymbol: "KSh" },
  { name: "Ghana", iso: "GH", dialCode: "+233", flag: "🇬🇭", currency: "GHS", currencySymbol: "GH₵" },
  { name: "Sri Lanka", iso: "LK", dialCode: "+94", flag: "🇱🇰", currency: "LKR", currencySymbol: "Rs" },
  { name: "Nepal", iso: "NP", dialCode: "+977", flag: "🇳🇵", currency: "NPR", currencySymbol: "रू" },
  { name: "Japan", iso: "JP", dialCode: "+81", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥" },
  { name: "China", iso: "CN", dialCode: "+86", flag: "🇨🇳", currency: "CNY", currencySymbol: "¥" },
  { name: "South Korea", iso: "KR", dialCode: "+82", flag: "🇰🇷", currency: "KRW", currencySymbol: "₩" },
  { name: "New Zealand", iso: "NZ", dialCode: "+64", flag: "🇳🇿", currency: "NZD", currencySymbol: "NZ$" },
  { name: "Italy", iso: "IT", dialCode: "+39", flag: "🇮🇹", currency: "EUR", currencySymbol: "€" },
  { name: "Spain", iso: "ES", dialCode: "+34", flag: "🇪🇸", currency: "EUR", currencySymbol: "€" },
  { name: "Netherlands", iso: "NL", dialCode: "+31", flag: "🇳🇱", currency: "EUR", currencySymbol: "€" },
  { name: "Switzerland", iso: "CH", dialCode: "+41", flag: "🇨🇭", currency: "CHF", currencySymbol: "CHF" },
  { name: "Sweden", iso: "SE", dialCode: "+46", flag: "🇸🇪", currency: "SEK", currencySymbol: "kr" },
  { name: "Norway", iso: "NO", dialCode: "+47", flag: "🇳🇴", currency: "NOK", currencySymbol: "kr" },
  { name: "Denmark", iso: "DK", dialCode: "+45", flag: "🇩🇰", currency: "DKK", currencySymbol: "kr." },
  { name: "Finland", iso: "FI", dialCode: "+358", flag: "🇫🇮", currency: "EUR", currencySymbol: "€" },
  { name: "Belgium", iso: "BE", dialCode: "+32", flag: "🇧🇪", currency: "EUR", currencySymbol: "€" },
  { name: "Austria", iso: "AT", dialCode: "+43", flag: "🇦🇹", currency: "EUR", currencySymbol: "€" },
  { name: "Ireland", iso: "IE", dialCode: "+353", flag: "🇮🇪", currency: "EUR", currencySymbol: "€" },
  { name: "Poland", iso: "PL", dialCode: "+48", flag: "🇵🇱", currency: "PLN", currencySymbol: "zł" },
  { name: "Portugal", iso: "PT", dialCode: "+351", flag: "🇵🇹", currency: "EUR", currencySymbol: "€" },
  { name: "Greece", iso: "GR", dialCode: "+30", flag: "🇬🇷", currency: "EUR", currencySymbol: "€" },
  { name: "Czech Republic", iso: "CZ", dialCode: "+420", flag: "🇨🇿", currency: "CZK", currencySymbol: "Kč" },
  { name: "Hungary", iso: "HU", dialCode: "+36", flag: "🇭🇺", currency: "HUF", currencySymbol: "Ft" },
  { name: "Romania", iso: "RO", dialCode: "+40", flag: "🇷🇴", currency: "RON", currencySymbol: "lei" },
  { name: "Brazil", iso: "BR", dialCode: "+55", flag: "🇧🇷", currency: "BRL", currencySymbol: "R$" },
  { name: "Mexico", iso: "MX", dialCode: "+52", flag: "🇲🇽", currency: "MXN", currencySymbol: "MX$" },
  { name: "Argentina", iso: "AR", dialCode: "+54", flag: "🇦🇷", currency: "ARS", currencySymbol: "ARS$" },
  { name: "Colombia", iso: "CO", dialCode: "+57", flag: "🇨🇴", currency: "COP", currencySymbol: "COL$" },
  { name: "Chile", iso: "CL", dialCode: "+56", flag: "🇨🇱", currency: "CLP", currencySymbol: "CLP$" },
  { name: "Peru", iso: "PE", dialCode: "+51", flag: "🇵🇪", currency: "PEN", currencySymbol: "S/" },
  { name: "Jordan", iso: "JO", dialCode: "+962", flag: "🇯🇴", currency: "JOD", currencySymbol: "د.ا" },
  { name: "Lebanon", iso: "LB", dialCode: "+961", flag: "🇱🇧", currency: "LBP", currencySymbol: "ل.ل" },
  { name: "Morocco", iso: "MA", dialCode: "+212", flag: "🇲🇦", currency: "MAD", currencySymbol: "د.م." },
  { name: "Algeria", iso: "DZ", dialCode: "+213", flag: "🇩🇿", currency: "DZD", currencySymbol: "د.ج" },
  { name: "Tunisia", iso: "TN", dialCode: "+216", flag: "🇹🇳", currency: "TND", currencySymbol: "د.ت" },
  { name: "Iraq", iso: "IQ", dialCode: "+964", flag: "🇮🇶", currency: "IQD", currencySymbol: "ع.د" },
  { name: "Thailand", iso: "TH", dialCode: "+66", flag: "🇹🇭", currency: "THB", currencySymbol: "฿" },
  { name: "Vietnam", iso: "VN", dialCode: "+84", flag: "🇻🇳", currency: "VND", currencySymbol: "₫" },
  { name: "Taiwan", iso: "TW", dialCode: "+886", flag: "🇹🇼", currency: "TWD", currencySymbol: "NT$" },
  { name: "Hong Kong", iso: "HK", dialCode: "+852", flag: "🇭🇰", currency: "HKD", currencySymbol: "HK$" },
  { name: "Afghanistan", iso: "AF", dialCode: "+93", flag: "🇦🇫", currency: "AFN", currencySymbol: "؋" },
  { name: "Azerbaijan", iso: "AZ", dialCode: "+994", flag: "🇦🇿", currency: "AZN", currencySymbol: "₼" },
  { name: "Kazakhstan", iso: "KZ", dialCode: "+7", flag: "🇰🇿", currency: "KZT", currencySymbol: "₸" },
  { name: "Uzbekistan", iso: "UZ", dialCode: "+998", flag: "🇺🇿", currency: "UZS", currencySymbol: "so'm" },
  { name: "Ethiopia", iso: "ET", dialCode: "+251", flag: "🇪🇹", currency: "ETB", currencySymbol: "Br" },
  { name: "Tanzania", iso: "TZ", dialCode: "+255", flag: "🇹🇿", currency: "TZS", currencySymbol: "TSh" },
  { name: "Uganda", iso: "UG", dialCode: "+256", flag: "🇺🇬", currency: "UGX", currencySymbol: "USh" },
  { name: "Rwanda", iso: "RW", dialCode: "+250", flag: "🇷🇼", currency: "RWF", currencySymbol: "RF" },
  { name: "Iceland", iso: "IS", dialCode: "+354", flag: "🇮🇸", currency: "ISK", currencySymbol: "kr" },
  { name: "Cyprus", iso: "CY", dialCode: "+357", flag: "🇨🇾", currency: "EUR", currencySymbol: "€" },
  { name: "Malta", iso: "MT", dialCode: "+356", flag: "🇲🇹", currency: "EUR", currencySymbol: "€" },
  { name: "Luxembourg", iso: "LU", dialCode: "+352", flag: "🇱🇺", currency: "EUR", currencySymbol: "€" },
];

export function findCountryByIso(iso: string): CountryItem {
  const found = COUNTRIES.find((c) => c.iso.toUpperCase() === iso.toUpperCase());
  return found || COUNTRIES[0]; // defaults to Pakistan
}

export function findCountryByDialCode(dialCode: string): CountryItem {
  const cleanCode = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  const found = COUNTRIES.find((c) => c.dialCode === cleanCode);
  return found || COUNTRIES[0];
}
