# Component Documentation

## Overview

This document provides detailed documentation for all React components in the Wifey application. Components are organized by feature area and include usage examples, props, and best practices.

## Table of Contents

1. [Coverage Components](#coverage-components)
2. [Map Components](#map-components)
3. [UI Components](#ui-components)
4. [Layout Components](#layout-components)
5. [Provider Components](#provider-components)
6. [Leaderboard Components](#leaderboard-components)

## Coverage Components

### CoverageAreaMap

Displays coverage areas with heatmap visualization.

```tsx
import { CoverageAreaMap } from '@/components/coverage/coverage-area-map';

<CoverageAreaMap
  center={[10.0, -84.0]}
  zoom={12}
  provider="all"
  onCoverageSelect={(coverage) => {}}
/>
```

Props:
```typescript
interface CoverageAreaMapProps {
  center: [number, number];
  zoom: number;
  provider?: string;
  onCoverageSelect?: (coverage: CarrierCoverage) => void;
  className?: string;
}
```

### XMarksSpotButton

Floating action button for marking coverage spots.

```tsx
import { XMarksSpotButton } from '@/components/coverage/x-marks-spot-button';

<XMarksSpotButton
  onMarkSpot={(location) => {}}
  className="fixed bottom-6 right-6"
/>
```

Props:
```typescript
interface XMarksSpotButtonProps {
  onMarkSpot: (location: { lat: number; lng: number }) => void;
  className?: string;
}
```

## Map Components

### OptimizedMap

Performance-optimized map component with lazy loading and tile caching.

```tsx
import { OptimizedMap } from '@/components/coverage/optimized-map';

<OptimizedMap
  center={[10.0, -84.0]}
  zoom={12}
  markers={[
    {
      position: [10.0, -84.0],
      popup: "Coverage spot"
    }
  ]}
  onMapLoad={() => {}}
/>
```

Props:
```typescript
interface OptimizedMapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
  }>;
  onMapLoad?: () => void;
}
```

## UI Components

### ErrorBoundary

Global error boundary component with fallback UI.

```tsx
import { ErrorBoundary } from '@/components/error/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Props:
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
```

### LoadingError

Error state component for loading failures.

```tsx
import { LoadingError } from '@/components/error/error-boundary';

<LoadingError
  message="Failed to load data"
  onRetry={() => {}}
/>
```

Props:
```typescript
interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
}
```

## Layout Components

### Navbar

Main navigation component with authentication state.

```tsx
import { Navbar } from '@/components/layout/navbar';

<Navbar
  user={session?.user}
  onSignOut={() => {}}
/>
```

Props:
```typescript
interface NavbarProps {
  user?: User;
  onSignOut?: () => void;
}
```

## Provider Components

### MonitoringProvider

Provides monitoring and analytics context.

```tsx
import { MonitoringProvider } from '@/components/providers/monitoring-provider';

<MonitoringProvider>
  <App />
</MonitoringProvider>
```

Hook Usage:
```typescript
import { useMonitoring } from '@/components/providers/monitoring-provider';

const { trackEvent, trackError } = useMonitoring();
```

## Leaderboard Components

### Leaderboard

Displays user rankings and achievements.

```tsx
import { Leaderboard } from '@/components/leaderboard/leaderboard';

<Leaderboard />
```

### LeaderboardRow

Individual row in the leaderboard.

```tsx
import { LeaderboardRow } from '@/components/leaderboard/leaderboard';

<LeaderboardRow
  entry={leaderboardEntry}
  highlight={isCurrentUser}
/>
```

Props:
```typescript
interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  highlight?: boolean;
}
```

## Best Practices

1. Component Organization:
```
components/
  ├── coverage/       # Coverage-related components
  ├── layout/        # Layout components
  ├── providers/     # Context providers
  ├── ui/           # Reusable UI components
  └── error/        # Error handling components
```

2. Props Interface:
- Always define prop interfaces
- Use descriptive names
- Include JSDoc comments
- Mark optional props with ?

3. Error Handling:
- Use ErrorBoundary for component errors
- Provide fallback UI
- Log errors to monitoring
- Show user-friendly messages

4. Performance:
- Implement lazy loading
- Use memo when needed
- Optimize re-renders
- Cache expensive operations

5. Accessibility:
- Include ARIA labels
- Support keyboard navigation
- Maintain focus management
- Provide alt text

6. Testing:
- Write unit tests
- Include integration tests
- Test error states
- Test loading states

## Component Development Guide

1. Create New Component:
```bash
# Create component files
mkdir -p components/feature-name
touch components/feature-name/component-name.tsx
touch components/feature-name/component-name.test.tsx
```

2. Basic Component Structure:
```tsx
'use client';

import { useState, useEffect } from 'react';
import type { ComponentProps } from './types';

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

3. Testing:
```tsx
import { render, screen } from '@testing-library/react';
import ComponentName from './component-name';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop1="value" />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

## State Management

1. Local State:
```tsx
const [state, setState] = useState(initialState);
```

2. Context:
```tsx
const value = useContext(MyContext);
```

3. Store:
```tsx
const store = useStore(selector);
```

## Styling

1. Tailwind Classes:
```tsx
<div className="flex items-center justify-between p-4">
```

2. CSS Modules:
```tsx
import styles from './Component.module.css';

<div className={styles.container}>
```

## Event Handling

1. User Events:
```tsx
const handleClick = (e: React.MouseEvent) => {
  // Handle click
};
```

2. Form Events:
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Handle submit
};
```

## Component Lifecycle

1. Mount:
```tsx
useEffect(() => {
  // Mount logic
  return () => {
    // Cleanup
  };
}, []);
```

2. Update:
```tsx
useEffect(() => {
  // Update logic
}, [dependency]);
```

## Documentation

1. Component Comments:
```tsx
/**
 * ComponentName - Description
 * 
 * @param {string} prop1 - Description of prop1
 * @param {number} prop2 - Description of prop2
 * @returns {JSX.Element} Component
 * 
 * @example
 * <ComponentName prop1="value" prop2={42} />
 */
```

2. Props Interface:
```tsx
interface ComponentProps {
  /** Description of prop1 */
  prop1: string;
  /** Description of prop2 */
  prop2?: number;
}
