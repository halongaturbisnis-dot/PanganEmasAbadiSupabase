export interface LanguageOption {
  code: string;
  label: string;
  flag?: string; // Optional flag emoji or icon identifier
}

export const LanguageList: LanguageOption[] = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];
