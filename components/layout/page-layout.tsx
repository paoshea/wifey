'use client';

import { PageHeader } from './page-header';
import { cn } from 'lib/utils';

interface PageLayoutProps {
    locale: string;
    nav: any; // Translation function
    title: string;
    description?: string;
    showBack?: boolean;
    showLogout?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function PageLayout({
    locale,
    nav,
    title,
    description,
    showBack = true,
    showLogout = true,
    children,
    className,
}: PageLayoutProps) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            <PageHeader
                locale={locale}
                nav={nav}
                title={title}
                description={description}
                showBack={showBack}
                showLogout={showLogout}
            />
            <main className={cn("container py-8", className)}>
                {children}
            </main>
        </div>
    );
}
