import React, { useEffect, useState } from 'react';
import { Responsive, Platform, SafeArea, Orientation } from '../utils';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onBreakpointChange?: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
    onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
}

interface LayoutContext {
    breakpoint: 'mobile' | 'tablet' | 'desktop';
    orientation: 'portrait' | 'landscape';
    platform: 'ios' | 'android' | 'web';
    safeArea: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

export const LayoutContext = React.createContext<LayoutContext>({
    breakpoint: 'mobile',
    orientation: 'portrait',
    platform: 'web',
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 }
});

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
    children,
    className = '',
    style = {},
    onBreakpointChange,
    onOrientationChange
}) => {
    const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>(
        Responsive.isMobile() ? 'mobile' : Responsive.isTablet() ? 'tablet' : 'desktop'
    );

    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
        Orientation.current
    );

    const [safeArea, setSafeArea] = useState({
        top: SafeArea.top,
        bottom: SafeArea.bottom,
        left: SafeArea.left,
        right: SafeArea.right
    });

    useEffect(() => {
        // Handle breakpoint changes
        const breakpointCleanup = Responsive.addBreakpointListener((newBreakpoint) => {
            setBreakpoint(newBreakpoint);
            onBreakpointChange?.(newBreakpoint);
        });

        // Handle orientation changes
        const orientationCleanup = Orientation.addListener((newOrientation) => {
            setOrientation(newOrientation);
            onOrientationChange?.(newOrientation);
        });

        // Update safe area on mount and orientation change
        const updateSafeArea = () => {
            setSafeArea({
                top: SafeArea.top,
                bottom: SafeArea.bottom,
                left: SafeArea.left,
                right: SafeArea.right
            });
        };

        window.addEventListener('resize', updateSafeArea);

        return () => {
            breakpointCleanup();
            orientationCleanup();
            window.removeEventListener('resize', updateSafeArea);
        };
    }, [onBreakpointChange, onOrientationChange]);

    const platform = Platform.isIOS ? 'ios' : Platform.isAndroid ? 'android' : 'web';

    const contextValue: LayoutContext = {
        breakpoint,
        orientation,
        platform,
        safeArea
    };

    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        paddingTop: safeArea.top,
        paddingBottom: safeArea.bottom,
        paddingLeft: safeArea.left,
        paddingRight: safeArea.right,
        ...style
    };

    const containerClass = `responsive-layout ${className} ${breakpoint} ${orientation} platform-${platform}`;

    return (
        <LayoutContext.Provider value={contextValue}>
            <div className={containerClass} style={containerStyle}>
                {children}
            </div>
        </LayoutContext.Provider>
    );
};

// Custom hook to access layout context
export const useLayout = () => {
    const context = React.useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a ResponsiveLayout');
    }
    return context;
};

// Responsive container component
interface ResponsiveContainerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    maxWidth?: number | { mobile?: number; tablet?: number; desktop?: number };
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
    children,
    className = '',
    style = {},
    maxWidth
}) => {
    const { breakpoint } = useLayout();

    const getMaxWidth = () => {
        if (!maxWidth) return undefined;
        if (typeof maxWidth === 'number') return maxWidth;
        return maxWidth[breakpoint];
    };

    const containerStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: getMaxWidth(),
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: breakpoint === 'mobile' ? '16px' : '24px',
        paddingRight: breakpoint === 'mobile' ? '16px' : '24px',
        ...style
    };

    return (
        <div className={`responsive-container ${className}`} style={containerStyle}>
            {children}
        </div>
    );
};

// Responsive grid component
interface ResponsiveGridProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    columns?: number | { mobile?: number; tablet?: number; desktop?: number };
    gap?: number | string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
    children,
    className = '',
    style = {},
    columns = { mobile: 1, tablet: 2, desktop: 3 },
    gap = '24px'
}) => {
    const { breakpoint } = useLayout();

    const getColumns = () => {
        if (typeof columns === 'number') return columns;
        return columns[breakpoint] || 1;
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap,
        ...style
    };

    return (
        <div className={`responsive-grid ${className}`} style={gridStyle}>
            {children}
        </div>
    );
};

// Hide component based on breakpoint
interface HideProps {
    children: React.ReactNode;
    on: ('mobile' | 'tablet' | 'desktop')[];
}

export const Hide: React.FC<HideProps> = ({ children, on }) => {
    const { breakpoint } = useLayout();
    if (on.includes(breakpoint)) return null;
    return <>{children}</>;
};

// Show component based on breakpoint
interface ShowProps {
    children: React.ReactNode;
    on: ('mobile' | 'tablet' | 'desktop')[];
}

export const Show: React.FC<ShowProps> = ({ children, on }) => {
    const { breakpoint } = useLayout();
    if (!on.includes(breakpoint)) return null;
    return <>{children}</>;
};
