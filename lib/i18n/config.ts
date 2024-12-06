export const locales = ['en', 'es'] as const;
export type SupportedLocale = typeof locales[number];

export const defaultLocale = 'en' as const;

export const localeNames = {
    en: 'English',
    es: 'Español'
} as const;

export const localePrefix = 'always';

// This is used to configure the navigation
export const i18nConfig = {
    defaultLocale,
    locales,
    localePrefix,
    localeDetection: true
} as const;
