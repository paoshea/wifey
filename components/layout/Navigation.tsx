'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

export function Navigation() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('cellular');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReport = () => {
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setIsReportModalOpen(false);
      setTimeout(() => {
        setReportType('cellular');
      }, 300);
    }, 2000);
  };

  const navItems = [
    {
      title: t('home'),
      href: '/',
      icon: <Icons.home className="w-4 h-4" />,
    },
    {
      title: t('dashboard'),
      href: '/dashboard',
      icon: <Icons.dashboard className="w-4 h-4" />,
    },
    {
      title: 'Map',
      href: '/wifi-map',
      icon: <Icons.map className="w-4 h-4" />,
    },
  ];

  const authItems = session ? [
    {
      title: t('profile'),
      href: '/profile',
      icon: <Icons.user className="w-4 h-4" />,
    },
    {
      title: t('signOut'),
      onClick: () => signOut(),
      icon: <Icons.logout className="w-4 h-4" />,
    },
  ] : [
    {
      title: t('login'),
      onClick: () => signIn(),
      icon: <Icons.login className="w-4 h-4" />,
    },
    {
      title: t('register'),
      href: '/register',
      icon: <Icons.userPlus className="w-4 h-4" />,
    },
  ];

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex w-full items-center justify-between">
          <Link
            href={`/${locale}`}
            className={cn(
              'flex items-center gap-2 font-medium',
              pathname === `/${locale}`
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <Icons.home className="w-4 h-4" />
            {t('home')}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={cn(
                  'flex items-center gap-2 font-medium',
                  pathname.includes(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}

            {/* Auth Items */}
            {authItems.map((item, index) => (
              item.href ? (
                <Link
                  key={item.title}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'flex items-center gap-2 font-medium',
                    pathname.includes(item.href)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ) : (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="flex items-center gap-2 font-medium"
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.title}
                </Button>
              )
            ))}

            <Button 
              variant="default"
              onClick={() => setIsReportModalOpen(true)}
              className="ml-4"
            >
              {t('reportCoverage')}
            </Button>
          </nav>

          {isMenuOpen && (
            <div className="fixed inset-0 z-40 bg-background">
              <nav className="flex flex-col gap-4 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 text-lg font-medium',
                      pathname.includes(item.href)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}

                {/* Mobile Auth Items */}
                {authItems.map((item, index) => (
                  item.href ? (
                    <Link
                      key={item.title}
                      href={`/${locale}${item.href}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 text-lg font-medium',
                        pathname.includes(item.href)
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  ) : (
                    <Button
                      key={item.title}
                      variant="ghost"
                      className="flex items-center gap-2 text-lg font-medium justify-start"
                      onClick={() => {
                        item.onClick?.();
                        setIsMenuOpen(false);
                      }}
                    >
                      {item.icon}
                      {item.title}
                    </Button>
                  )
                ))}

                <Button 
                  variant="default"
                  onClick={() => {
                    setIsReportModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full mt-4"
                >
                  {t('reportCoverage')}
                </Button>
              </nav>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('report.title')}</DialogTitle>
            <DialogDescription>
              {reportSubmitted ? t('report.success') : t('report.description')}
            </DialogDescription>
          </DialogHeader>
          
          {!reportSubmitted && (
            <div className="grid gap-4 py-4">
              <RadioGroup
                defaultValue="cellular"
                value={reportType}
                onValueChange={setReportType}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="cellular"
                    id="cellular"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="cellular"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                  >
                    <Icons.signal className="mb-3 h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium">{t('report.cellular')}</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem
                    value="wifi"
                    id="wifi"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="wifi"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                  >
                    <Icons.wifi className="mb-3 h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium">{t('report.wifi')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          <DialogFooter className="sm:justify-start">
            {reportSubmitted ? (
              <div className="w-full text-center">
                <p className="text-green-600 font-medium mb-4">{t('report.appreciationMessage')}</p>
                <p className="text-sm text-gray-600">{t('report.joinMessage')}</p>
              </div>
            ) : (
              <Button
                type="submit"
                onClick={handleReport}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {t('report.submit')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
