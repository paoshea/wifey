'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Wifi, Signal, MapPin, Menu, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
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

  // Extract locale from pathname
  const locale = pathname?.split('/')[1] || 'en';

  const navItems = [
    { href: `/${locale}`, label: t('navigation.home'), icon: Home },
    { href: `/${locale}/coverage`, label: t('navigation.coverage'), icon: Signal },
    { href: `/${locale}/wifi`, label: t('navigation.wifi'), icon: Wifi },
    { href: `/${locale}/explore`, label: t('navigation.explore'), icon: MapPin },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/branding/logo.svg"
                alt="Wifey Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden font-bold sm:inline-block">Wifey</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="flex-1 hidden md:flex">
          <nav className="flex items-center justify-center w-full max-w-2xl mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center flex-1 py-2 transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button 
            variant="default" 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            {t('navigation.reportCoverage')}
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
            <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
              <nav className="grid grid-flow-row auto-rows-max text-sm">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 transition-colors hover:text-foreground/80",
                        isActive ? "text-foreground" : "text-foreground/60"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
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