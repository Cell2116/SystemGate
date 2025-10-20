import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
export function PWAUpdatePrompt() {
  const { offlineReady, updateAvailable, updateApp, close } = usePWA();
  if (!offlineReady && !updateAvailable) {
    return null;
  }
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {offlineReady && (
        <Alert className="mb-2">
          <AlertDescription>
            App ready to work offline
            <Button variant="ghost" size="sm" onClick={close} className="ml-2">
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {updateAvailable && (
        <Alert className="mb-2">
          <AlertDescription className="flex items-center justify-between">
            <span>New content available, click on reload button to update.</span>
            <div className="flex gap-2 ml-2">
              <Button variant="default" size="sm" onClick={updateApp}>
                Reload
              </Button>
              <Button variant="ghost" size="sm" onClick={close}>
                ✕
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
