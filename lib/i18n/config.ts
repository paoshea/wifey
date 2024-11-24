export const locales = ['en', 'es'] as const;
export type SupportedLocale = typeof locales[number];

export const defaultLocale = 'en' as const;
