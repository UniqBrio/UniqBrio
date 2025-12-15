'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setLastChecked(new Date());
    };

    checkOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      setLastChecked(new Date());
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold">You're Offline</CardTitle>
          <CardDescription className="text-base mt-2">
            {isOnline
              ? "You're back online! Click retry to continue."
              : "It looks like you've lost your internet connection."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? 'Connection restored. Please reload the page.'
                : 'Please check your internet connection and try again.'}
            </p>
            {lastChecked && (
              <p className="text-xs text-muted-foreground">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              className="w-full"
              variant={isOnline ? 'default' : 'outline'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isOnline ? 'Reload Page' : 'Check Connection'}
            </Button>
            <Button onClick={handleGoHome} variant="ghost" className="w-full">
              Go to Home
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
              Offline Features:
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Previously viewed pages are cached</li>
              <li>• Some content may still be accessible</li>
              <li>• Changes will sync when you're back online</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
