'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Signal, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/language-switcher';
import { motion } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link 
              href="/"
              className="flex items-center gap-2"
            >
              <div className="relative w-8 h-8">
                <Image
                  alt="Wifey"
                  fill
                  src="/branding/logo.svg"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 font-semibold">
                Wifey
              </span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200",
                  pathname === "/" 
                    ? "border-b-2 border-blue-500 text-gray-900"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent hover:border-gray-300"
                )}
              >
                <Home className="w-4 h-4 mr-2" />
                {t('home')}
              </Link>

              <Link
                href={`/${pathname.split('/')[1]}/coverage-finder`}
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200",
                  pathname.includes("/coverage-finder")
                    ? "border-b-2 border-blue-500 text-gray-900"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent hover:border-gray-300"
                )}
              >
                <Signal className="w-4 h-4 mr-2" />
                {t('coverageFinder')}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {t('register')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}