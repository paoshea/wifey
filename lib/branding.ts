export const brandConfig = {
  name: 'Wifey',
  fullName: 'Wifey - WiFi & Coverage Finder',
  description: 'Find the best WiFi and cellular coverage anywhere with real-time maps and navigation',
  url: 'https://wifey.app',
  logo: {
    src: '/logo.svg',
    alt: 'Wifey Logo',
  },
  favicon: {
    src: '/favicon.ico',
    alt: 'Wifey Favicon',
  },

  gradients: {
    primary: 'linear-gradient(to right, #3B82F6, #1E40AF)',
    secondary: 'linear-gradient(to right, #1E40AF, #3B82F6)',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Primary brand color
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  // Animation configurations
  animations: {
    transition: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Asset paths
  assets: {
    logo: '/logo.svg',
    favicon: '/favicon.svg',
    appIcon: '/app-icon.svg',
    icons: {
      wifi: '/icons/wifi.svg',
      coverage: '/icons/coverage.svg',
      navigation: '/icons/navigation.svg',
    },
  },
} as const;

// Type definitions for the brand config
export type BrandColor = keyof typeof brandConfig.colors;
export type BrandGradient = keyof typeof brandConfig.gradients;
export type BrandBreakpoint = keyof typeof brandConfig.breakpoints;
export type BrandSpacing = keyof typeof brandConfig.spacing;
export type BrandRadius = keyof typeof brandConfig.borderRadius;
export type BrandShadow = keyof typeof brandConfig.shadows;
export type BrandShade = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// Helper functions
export const getBrandColor = (color: BrandColor, shade: BrandShade = 500) => {
  const colorObj = brandConfig.colors[color];
  return typeof colorObj === 'string' ? colorObj : (colorObj as Record<BrandShade, string>)[shade];
};

export const getBrandGradient = (gradient: BrandGradient) => brandConfig.gradients[gradient];

export const getBreakpoint = (breakpoint: BrandBreakpoint) => brandConfig.breakpoints[breakpoint];

export const getSpacing = (spacing: BrandSpacing) => brandConfig.spacing[spacing];

export const getBorderRadius = (radius: BrandRadius) => brandConfig.borderRadius[radius];

export const getShadow = (shadow: BrandShadow) => brandConfig.shadows[shadow];

export const getIcon = (icon: keyof typeof brandConfig.assets.icons) => brandConfig.assets.icons[icon];

export const getAsset = (asset: keyof typeof brandConfig.assets) => brandConfig.assets[asset];

export const getTypography = (typography: keyof typeof brandConfig.typography) => brandConfig.typography[typography];

export const getAnimation = (animation: keyof typeof brandConfig.animations) => brandConfig.animations[animation];

export const getBreakpoints = () => brandConfig.breakpoints;

export const getBreakpointStyles = () => {
  const breakpoints = getBreakpoints();
  return Object.keys(breakpoints).map((breakpoint) => {
    const mediaQuery = `@media (min-width: ${breakpoints[breakpoint as keyof typeof breakpoints]})`;
    return {
      [mediaQuery]: {
        [`--breakpoint-${breakpoint}`]: breakpoints[breakpoint as keyof typeof breakpoints],
      },
    };
  });
};