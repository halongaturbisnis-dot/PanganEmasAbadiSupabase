/**
 * STYLES/CURRENCYLIST.TS
 * List of available currencies for the application to maintain UI Consistency and data standardization.
 */

export interface CurrencyItem {
  code: string;
  symbol: string;
  locale: string;
  name: string;
}

export const currencyList: CurrencyItem[] = [
  { code: 'IDR', symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah' },
  { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' }
];
