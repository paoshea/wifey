'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Home, Signal, Wifi, Map, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const links = [
  { href: '/', label: 'home', icon: Home },
  { href: '/coverage', label: 'coverage', icon: Signal },
  { href: '/wifi', label: 'wifi', icon: Wifi },
  { href: '/explore', label: 'explore', icon: Map },
  { href: '/community', label: 'community', icon: Users }
];

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navigation');
  const { toast } = useToast();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'wifi' | 'coverage'>('coverage');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReport = () => {
    setReportSubmitted(true);
    toast({
      title: t('report.success'),
      description: t('report.appreciationMessage'),
      duration: 3000,
    });
    setTimeout(() => {
      setReportSubmitted(false);
      setIsReportModalOpen(false);
      setTimeout(() => {
        setReportType('coverage');
      }, 300);
    }, 2000);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Desktop Logo */}
        <div className="mr-8 hidden md:flex items-center">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/branding/logo.svg"
                alt="Wifey Logo"
                width={32}
                height={32}
                className="w-full h-full"
                priority
                unoptimized
              />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Wifey
            </span>
          </Link>
        </div>

        {/* Mobile Logo */}
        <div className="mr-4 flex md:hidden items-center">
          <Link href={`/${locale}`} className="flex items-center">
            <div className="relative w-6 h-6">
              <Image
                src="/branding/logo.svg"
                alt="Wifey Logo"
                width={24}
                height={24}
                className="w-full h-full"
                priority
                unoptimized
              />
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end md:space-x-4">
          <div className="flex flex-1 items-center justify-evenly md:justify-center space-x-2 md:space-x-6">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(`/${locale}${href}`);
              const fullHref = `/${locale}${href === '/' ? '' : href}`;
              
              return (
                <Link
                  key={href}
                  href={fullHref}
                  className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">{t(label)}</span>
                </Link>
              );
            })}
          </div>

          {/* Report Button */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="default" 
              onClick={() => setIsReportModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <X className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('report.button')}</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Report Coverage Modal */}
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
                defaultValue="coverage"
                value={reportType}
                onValueChange={(value: 'wifi' | 'coverage') => setReportType(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="coverage"
                    id="coverage"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="coverage"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Signal className="mb-3 h-6 w-6" />
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
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Wifi className="mb-3 h-6 w-6" />
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
    </nav>
  );
}