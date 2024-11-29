import { Metadata } from 'next'
import { useLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { Providers } from './providers';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Wifey - Find Coverage & WiFi',
  description: 'Find cellular coverage points and free WiFi hotspots near you',
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const locale = useLocale()
 
  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound()
  }
 
  return (
    <Providers locale={locale}>
      {children}
    </Providers>
  )
}