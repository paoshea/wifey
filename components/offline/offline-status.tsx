'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/lib/hooks/use-offline-sync';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function OfflineStatus() {
  const { isOnline, isPending, pendingCount, syncStatus } = useOfflineSync();

  return (
    <AnimatePresence>
      {(!isOnline || pendingCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <Alert
            variant={isOnline ? "default" : "destructive"}
            className="rounded-none border-t-0"
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Cloud className="h-5 w-5 text-blue-500" />
                ) : (
                  <CloudOff className="h-5 w-5" />
                )}
                <AlertDescription className="text-sm">
                  {!isOnline ? (
                    "You're offline. Changes will sync when connection is restored."
                  ) : pendingCount > 0 ? (
                    <span className="flex items-center space-x-2">
                      <span>Syncing {pendingCount} pending changes</span>
                      {isPending && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                    </span>
                  ) : null}
                </AlertDescription>
              </div>

              <div className="flex items-center space-x-4">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5" />
                )}
                {pendingCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={((syncStatus.pendingPoints - pendingCount) / syncStatus.pendingPoints) * 100}
                      className="w-24"
                    />
                    <span className="text-xs text-gray-500">
                      {pendingCount}/{syncStatus.pendingPoints}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`bg-gray-100 p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Cloud className="h-5 w-5 text-blue-500" />
          ) : (
            <CloudOff className="h-5 w-5 text-gray-500" />
          )}
          <span className="text-sm font-medium">
            {!isOnline
              ? "You're working offline"
              : `${pendingCount} changes pending sync`}
          </span>
        </div>
        {!isOnline && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => window.location.reload()}
          >
            Try to reconnect
          </Button>
        )}
      </div>
      {pendingCount > 0 && (
        <Progress
          value={((syncStatus.pendingPoints - pendingCount) / syncStatus.pendingPoints) * 100}
          className="mt-2"
        />
      )}
    </div>
  );
}

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const { isOnline, pendingCount } = useOfflineSync();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-gray-500" />
      )}
      {pendingCount > 0 && (
        <span className="text-xs text-gray-500">
          {pendingCount} pending
        </span>
      )}
    </div>
  );
}

interface OfflineSyncDetailsProps {
  className?: string;
}

export function OfflineSyncDetails({ className = '' }: OfflineSyncDetailsProps) {
  const { syncStatus, isOnline } = useOfflineSync();

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Sync Status</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Connection Status</div>
          <div className="flex items-center mt-1">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium">Offline</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Pending Changes</div>
          <div className="font-medium mt-1">{syncStatus.pendingPoints}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Cached Areas</div>
          <div className="font-medium mt-1">{syncStatus.cacheSize}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Last Sync</div>
          <div className="font-medium mt-1">
            {syncStatus.lastSync
              ? new Date(syncStatus.lastSync).toLocaleString()
              : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}
