import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Alert, AlertDescription } from './ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatus() {
  const { isOnline, connectionType } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
        <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-900 dark:text-red-100">
          <span className="font-medium">No internet connection</span>
          <br />
          <span className="text-sm">Some features may not be available</span>
        </AlertDescription>
      </Alert>
    </div>
  );
}
