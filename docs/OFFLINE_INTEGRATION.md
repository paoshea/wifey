# Offline System Integration Guide

## Overview
This guide outlines the steps to integrate the offline functionality into the main application. The integration process is designed to be modular and non-disruptive to existing functionality.

## Integration Steps

### 1. Initialize Offline System

```typescript
// app/[locale]/providers.tsx
import { OfflineManager } from '@/lib/offline';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeOffline = async () => {
      const manager = OfflineManager.getInstance();
      await manager.initialize({
        location: {
          trackingInterval: 5000,
          minDistance: 10,
          maxAge: 30000,
          timeout: 15000,
          enableHighAccuracy: true
        },
        sync: {
          autoSyncInterval: 60000,
          maxRetries: 3,
          retryDelay: 5000
        },
        map: {
          maxZoom: 18,
          minZoom: 10,
          tileExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
          preloadRadius: 5 // 5km
        }
      });
    };

    initializeOffline().catch(console.error);
  }, []);

  return <>{children}</>;
}
```

### 2. Add Offline Status Component

```typescript
// components/offline/status-bar.tsx
import { useEffect, useState } from 'react';
import { OfflineManager, SyncStatus } from '@/lib/offline';

export function OfflineStatusBar() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const manager = OfflineManager.getInstance();
    
    const updateStatus = async () => {
      const syncStatus = await manager.getSyncStatus();
      setStatus(syncStatus);
      setIsMeasuring(manager.isMeasuring());
      setIsNavigating(manager.isNavigating());
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="offline-status-bar">
      <div className="status-indicator">
        {status?.isOnline ? 'Online' : 'Offline'}
      </div>
      {status?.pendingItems > 0 && (
        <div className="pending-items">
          {status.pendingItems} items pending sync
        </div>
      )}
      {isMeasuring && <div className="measuring">Recording Coverage</div>}
      {isNavigating && <div className="navigating">Navigating</div>}
    </div>
  );
}
```

### 3. Implement Coverage Navigation

```typescript
// components/coverage/navigation.tsx
import { useEffect, useState } from 'react';
import { OfflineManager, NavigationUpdate } from '@/lib/offline';

export function CoverageNavigation() {
  const [update, setUpdate] = useState<NavigationUpdate | null>(null);
  
  useEffect(() => {
    const manager = OfflineManager.getInstance();
    
    // Listen for navigation updates
    const cleanup = manager.onNavigationUpdate((navUpdate) => {
      setUpdate(navUpdate);
    });

    return cleanup;
  }, []);

  const handleFindCoverage = async () => {
    const manager = OfflineManager.getInstance();
    await manager.findAndNavigateToCoverage();
  };

  return (
    <div className="coverage-navigation">
      <button onClick={handleFindCoverage}>
        Find Nearest Coverage
      </button>
      {update && (
        <div className="navigation-info">
          <div>Distance: {Math.round(update.distance)}m</div>
          <div>ETA: {Math.round(update.estimatedTime)}s</div>
          <div>{update.nextInstruction}</div>
        </div>
      )}
    </div>
  );
}
```

### 4. Implement Coverage Reporting

```typescript
// components/coverage/reporter.tsx
import { useState } from 'react';
import { OfflineManager, CoveragePoint } from '@/lib/offline';

export function CoverageReporter() {
  const [measuring, setMeasuring] = useState(false);
  const [report, setReport] = useState<CoveragePoint | null>(null);

  const handleStartMeasuring = async () => {
    const manager = OfflineManager.getInstance();
    await manager.startCoverageMeasurement();
    setMeasuring(true);
  };

  const handleStopMeasuring = async () => {
    const manager = OfflineManager.getInstance();
    const coveragePoint = await manager.stopAndReportCoverage(
      "Manual coverage report"
    );
    setReport(coveragePoint);
    setMeasuring(false);
  };

  return (
    <div className="coverage-reporter">
      {!measuring ? (
        <button onClick={handleStartMeasuring}>
          Start Measuring Coverage
        </button>
      ) : (
        <button onClick={handleStopMeasuring}>
          Stop Measuring
        </button>
      )}
      {report && (
        <div className="report-info">
          <div>Signal Strength: {report.averageStrength}dBm</div>
          <div>Reliability: {Math.round(report.reliability * 100)}%</div>
        </div>
      )}
    </div>
  );
}
```

### 5. Add Error Handling

```typescript
// components/offline/error-handler.tsx
import { useEffect } from 'react';
import { OfflineManager, LocationError } from '@/lib/offline';
import { useToast } from '@/hooks/use-toast';

export function OfflineErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const manager = OfflineManager.getInstance();
    
    const cleanup = manager.onError((error: LocationError) => {
      toast({
        title: 'Location Error',
        description: error.message,
        variant: 'destructive'
      });
    });

    return cleanup;
  }, [toast]);

  return null;
}
```

### 6. Update App Layout

```typescript
// app/[locale]/layout.tsx
import { OfflineProvider } from './providers';
import { OfflineStatusBar } from '@/components/offline/status-bar';
import { OfflineErrorHandler } from '@/components/offline/error-handler';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <OfflineProvider>
          <OfflineErrorHandler />
          <OfflineStatusBar />
          {children}
        </OfflineProvider>
      </body>
    </html>
  );
}
```

### 7. Add to Coverage Page

```typescript
// app/[locale]/coverage/page.tsx
import { CoverageNavigation } from '@/components/coverage/navigation';
import { CoverageReporter } from '@/components/coverage/reporter';

export default function CoveragePage() {
  return (
    <div className="coverage-page">
      <h1>Coverage Finder</h1>
      <CoverageNavigation />
      <CoverageReporter />
    </div>
  );
}
```

## Integration Testing

1. **Offline Storage Testing**
```typescript
// tests/integration/offline-storage.test.ts
import { OfflineManager } from '@/lib/offline';

describe('Offline Storage', () => {
  beforeEach(async () => {
    const manager = OfflineManager.getInstance();
    await manager.clearAllData();
  });

  it('should store and retrieve coverage points', async () => {
    // Add test implementation
  });

  it('should handle offline/online transitions', async () => {
    // Add test implementation
  });
});
```

2. **Navigation Testing**
```typescript
// tests/integration/navigation.test.ts
describe('Coverage Navigation', () => {
  it('should find nearest coverage point', async () => {
    // Add test implementation
  });

  it('should provide accurate navigation updates', async () => {
    // Add test implementation
  });
});
```

## Performance Considerations

1. **Data Storage**
   - Monitor IndexedDB usage
   - Implement storage quotas
   - Clean up old data periodically

2. **Battery Usage**
   - Adjust tracking intervals based on battery level
   - Reduce update frequency when stationary
   - Optimize background operations

3. **Network Usage**
   - Implement progressive loading for map tiles
   - Compress data before storage
   - Batch synchronization requests

## Security Considerations

1. **Data Protection**
   - Encrypt sensitive data in IndexedDB
   - Validate data integrity
   - Implement access controls

2. **Location Privacy**
   - Request minimal location permissions
   - Clear location history periodically
   - Provide user controls for data retention

## Next Steps

1. **Progressive Enhancement**
   - Add offline map tile caching
   - Implement background sync
   - Add push notifications

2. **User Experience**
   - Add offline mode indicator
   - Improve navigation UI
   - Add coverage visualization

3. **Performance Optimization**
   - Implement worker threads
   - Add request batching
   - Optimize storage usage

4. **Analytics Integration**
   - Track offline usage
   - Monitor sync success rates
   - Measure coverage accuracy

## Troubleshooting

Common issues and solutions:
1. IndexedDB initialization failures
2. Location permission issues
3. Sync conflicts
4. Storage quota exceeded

## Support

For implementation support:
1. Review documentation
2. Check error logs
3. Test in different network conditions
4. Verify browser compatibility
