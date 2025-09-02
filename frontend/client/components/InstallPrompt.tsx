import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Download, Smartphone } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = useInstallPrompt();

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      console.log('App installed successfully');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1 mr-2">
            <p className="font-medium text-blue-900 dark:text-blue-100">Install SystemGate</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Add to your home screen for quick access
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleInstall}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
