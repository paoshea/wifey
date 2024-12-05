'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ToastProvider() {
    const { theme } = useTheme();

    // Ensure theme is either 'light' or 'dark'
    const toasterTheme = theme === 'system' ? 'light' : theme as 'light' | 'dark';

    return (
        <Toaster
            position="bottom-right"
            theme={toasterTheme}
            closeButton
        />
    );
}
