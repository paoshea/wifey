'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next-intl/client';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'es' : 'en';
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="text-sm font-medium"
    >
      {locale === 'en' ? 'ES' : 'EN'}
    </Button>
  );
}