'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from 'components/ui/button';
import { Icons } from 'components/ui/icons';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'es' : 'en';
    const newPath = pathname.startsWith('/' + locale)
      ? pathname.replace(`/${locale}`, `/${newLocale}`)
      : `/${newLocale}${pathname}`;
    router.push(newPath);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <Icons.languages className="h-4 w-4" />
      <span className="text-sm font-medium">
        {locale === 'en' ? 'Español' : 'English'}
      </span>
    </Button>
  );
}
