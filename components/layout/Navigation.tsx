'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Wifi, Signal, MapPin, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const t = useTranslations();
  const { locale } = useTranslations();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('cellular');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReport = () => {
    setReportSubmitted(true);
    // In a real app, we would send this data to the backend
    setTimeout(() => {
      setReportSubmitted(false);
      setIsReportModalOpen(false);
      // Reset after closing
      setTimeout(() => {
        setReportType('cellular');
      }, 300);
    }, 2000);
  };

  const navItems = [
    { href: '/coverage', label: t('nav.coverage'), icon: Signal },
    { href: '/wifi', label: t('nav.wifi'), icon: Wifi },
    { href: '/explore', label: t('nav.explore'), icon: MapPin },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">Wifey</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:space-x-8 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200',
                    pathname === `/${locale}${item.href}`
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
            <Button 
              variant="default" 
              onClick={() => setIsReportModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              {t('nav.reportCoverage')}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200',
                    pathname === `/${locale}${item.href}`
                      ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
            <div className="pl-3 pr-4 py-2">
              <Button 
                variant="default" 
                onClick={() => {
                  setIsReportModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {t('nav.reportCoverage')}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                  >
                    <Signal className="mb-3 h-6 w-6 text-blue-600" />
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
                    <Wifi className="mb-3 h-6 w-6 text-blue-600" />
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
