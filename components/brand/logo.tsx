'use client';

import { brandConfig } from '@/lib/branding';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Icons } from 'components/ui/icons';

interface LogoProps {
    variant?: 'default' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
};

export function Logo({ variant = 'default', size = 'md', className }: LogoProps) {
    const logoSrc = brandConfig.assets.logo;
    const iconSize = sizeClasses[size];

    if (variant === 'icon') {
        return (
            <div className={cn('flex items-center', className)}>
                <Icons.signal className={cn('text-primary', iconSize)} />
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Icons.signal className={cn('text-primary', iconSize)} />
            <span className={cn(
                'font-bold tracking-tight',
                {
                    'text-lg': size === 'sm',
                    'text-xl': size === 'md',
                    'text-2xl': size === 'lg',
                }
            )}>
                {brandConfig.name}
            </span>
        </div>
    );
}
