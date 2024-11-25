export const brandConfig = {
  name: 'Wifey',
  fullName: 'Wifey - WiFi & Coverage Finder',
  description: 'Find the best WiFi and cellular coverage anywhere with real-time maps and navigation',
  
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
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  
  // Gradients used in the app
  gradients: {
    primary: 'linear-gradient(to right, #3B82F6, #2563EB)',
    secondary: 'linear-gradient(to right, #64748B, #475569)',
    background: 'linear-gradient(to bottom right, #EFF6FF, #E0F2FE)',
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
    logo: '/branding/logo.svg',
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

// Helper functions
export const getBrandColor = (color: BrandColor, shade: number = 500) => {
  const colorObj = brandConfig.colors[color];
  return typeof colorObj === 'string' ? colorObj : colorObj[shade];
};

export const getBrandGradient = (gradient: BrandGradient) => brandConfig.gradients[gradient];

export const getBreakpoint = (breakpoint: BrandBreakpoint) => brandConfig.breakpoints[breakpoint];

export const getSpacing = (spacing: BrandSpacing) => brandConfig.spacing[spacing];

export const getBorderRadius = (radius: BrandRadius) => brandConfig.borderRadius[radius];

export const getShadow = (shadow: BrandShadow) => brandConfig.shadows[shadow];
