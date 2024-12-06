import '@testing-library/jest-dom';
import React from 'react';

// Extend window interface
declare global {
  interface Window {
    IntersectionObserver: jest.Mock;
    ResizeObserver: jest.Mock;
  }
}

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock IntersectionObserver
window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = jest.fn().mockImplementation((element: Element) => ({
  ...originalGetComputedStyle(element),
  getPropertyValue: (prop: string) => {
    const styleMap: { [key: string]: string } = {
      'background-color': 'rgb(255, 255, 255)',
      'color': 'rgb(0, 0, 0)',
      'font-size': '16px',
      'transition': 'none',
    };

    if (prop === 'width' && element instanceof HTMLElement) {
      const style = element.getAttribute('style');
      const widthMatch = style?.match(/width:\s*([^;]+)/);
      return widthMatch ? widthMatch[1] : 'auto';
    }

    return styleMap[prop] || '';
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, initial, transition, ...props }: any) => (
      <div
        data-testid="progress-bar-animation"
        {...props}
        style={{
          ...props.style,
          width: animate?.width || initial?.width || '0%'
        }}
        initial={JSON.stringify(initial)}
        animate={JSON.stringify(animate)}
        transition={JSON.stringify(transition)}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
  __esModule: true,
  ...jest.requireActual('@/components/ui/__mocks__'),
}));

// Mock branding
jest.mock('@/lib/branding', () => ({
  __esModule: true,
  ...jest.requireActual('@/lib/__mocks__/branding'),
}));

// Mock useGamification hook
jest.mock('@/hooks/useGamification', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/__mocks__/useGamification'),
}));

// Mock recharts for chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data, margin, ...props }: any) => (
    <div
      data-testid="line-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-margin={JSON.stringify(margin)}
      {...props}
    >
      {children}
    </div>
  ),
  Line: ({ dataKey, name, stroke, strokeWidth, ...props }: any) => (
    <div
      data-testid={`line-${dataKey}`}
      data-name={name}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
      {...props}
    />
  ),
  XAxis: ({ dataKey, tickFormatter, ...props }: any) => (
    <div
      data-testid={`x-axis-${dataKey}`}
      data-tick-formatter={tickFormatter ? 'true' : 'false'}
      {...props}
    />
  ),
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: ({ strokeDasharray }: any) => (
    <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
  ),
  Tooltip: ({ content }: any) => {
    if (typeof content === 'function') {
      const samplePayload = [
        { name: 'Total Measurements', value: 10, color: '#3B82F6' },
        { name: 'Rural Measurements', value: 5, color: '#10B981' },
      ];
      return content({
        active: true,
        payload: samplePayload,
        label: '2024-01-01'
      });
    }
    return <div data-testid="tooltip" />;
  },
}));

// Set up custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAnimationStyle(expected: string): R;
    }
  }
}

expect.extend({
  toHaveAnimationStyle(received: HTMLElement, expected: string) {
    const style = window.getComputedStyle(received);
    const hasAnimation = style.animation === expected;
    return {
      message: () =>
        `expected ${received} to have animation style "${expected}"`,
      pass: hasAnimation,
    };
  },
});

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0]) ||
      /Warning: useLayoutEffect does nothing on the server/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
