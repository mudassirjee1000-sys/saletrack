export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

export const WORLD_CURRENCIES: CurrencyItem[] = [
  // Major Requested Currencies
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr." },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },

  // Additional Recognized ISO 4217 Currencies
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "BHD", name: "Bahraini Dinar", symbol: "ب.د" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "रू" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "ARS", name: "Argentine Peso", symbol: "ARS$" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$" },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP$" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د" },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م." },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn" },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "soʻm" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
];

/**
 * Finds a currency from WORLD_CURRENCIES by matching code, symbol, or name.
 */
export function findCurrency(query: string): CurrencyItem | undefined {
  if (!query) return undefined;
  const clean = query.trim().toUpperCase();
  return (
    WORLD_CURRENCIES.find((c) => c.code.toUpperCase() === clean) ||
    WORLD_CURRENCIES.find((c) => c.symbol === query.trim()) ||
    WORLD_CURRENCIES.find((c) => c.name.toLowerCase() === query.trim().toLowerCase())
  );
}

/**
 * Formats a monetary amount using the active currency symbol and local numbering.
 * Example: formatMoney(10000, "₨") => "₨10,000" or "₨10,000.00"
 */
export function formatMoney(
  amount: number,
  currencySymbol: string = "$",
  includeDecimals: boolean = true
): string {
  const valid = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  
  // Format with thousand separators
  const formatted = valid.toLocaleString(undefined, {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return `${currencySymbol}${formatted}`;
}
