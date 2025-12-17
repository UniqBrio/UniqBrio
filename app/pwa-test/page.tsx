"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isPWAInstalled } from '@/lib/pwa-detector';
import { CheckCircle, XCircle, Smartphone, Globe, Wifi, WifiOff } from 'lucide-react';

export default function PWATestPage() {
  const [pwaStatus, setPwaStatus] = useState<boolean | null>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('unknown');
  const [manifestStatus, setManifestStatus] = useState<boolean>(false);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(true);

  useEffect(() => {
    // Test PWA detection
    const isPWA = isPWAInstalled();
    setPwaStatus(isPWA);

    // Test session status
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await response.json();
        setSessionStatus(data);
      } catch (error) {
        setSessionStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    // Test service worker
    const checkServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            setServiceWorkerStatus(registration.active ? 'active' : 'registered');
          } else {
            setServiceWorkerStatus('not-registered');
          }
        });
      } else {
        setServiceWorkerStatus('not-supported');
      }
    };

    // Test manifest
    const checkManifest = async () => {
      try {
        const response = await fetch('/manifest.json');
        setManifestStatus(response.ok);
      } catch {
        setManifestStatus(false);
      }
    };

    // Test online status
    const updateOnlineStatus = () => {
      setOnlineStatus(navigator.onLine);
    };

    checkSession();
    checkServiceWorker();
    checkManifest();
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const testPWAStatusApi = async () => {
    try {
      const response = await fetch('/api/session/pwa-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPWA: pwaStatus }),
      });
      const data = await response.json();
      console.log('PWA Status API test:', data);
      alert(`PWA Status API test: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('PWA Status API test failed:', error);
      alert(`PWA Status API test failed: ${error}`);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | null | string }) => {
    if (status === true || status === 'active') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === false || status === 'not-supported') return <XCircle className="h-5 w-5 text-red-500" />;
    return <div className="h-5 w-5 rounded-full bg-yellow-500" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PWA Setup Verification</h1>
        <p className="text-gray-600">Test various PWA components and functionality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PWA Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon status={pwaStatus} />
              PWA Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Running as PWA:</span>
                <Badge variant={pwaStatus ? "default" : "secondary"}>
                  {pwaStatus ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Display Mode:</span>
                <Badge variant="outline">
                  {pwaStatus ? "Standalone" : "Browser"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon status={sessionStatus?.authenticated} />
              Session Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <Badge variant={sessionStatus?.authenticated ? "default" : "destructive"}>
                  {sessionStatus?.authenticated ? "Yes" : "No"}
                </Badge>
              </div>
              {sessionStatus?.session && (
                <div className="text-sm text-gray-600">
                  User: {sessionStatus.session.email}
                </div>
              )}
              {sessionStatus?.error && (
                <div className="text-sm text-red-600">
                  Error: {sessionStatus.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Worker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon status={serviceWorkerStatus} />
              Service Worker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={serviceWorkerStatus === 'active' ? "default" : "secondary"}>
                  {serviceWorkerStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manifest */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon status={manifestStatus} />
              App Manifest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Available:</span>
                <Badge variant={manifestStatus ? "default" : "destructive"}>
                  {manifestStatus ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {onlineStatus ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Online:</span>
                <Badge variant={onlineStatus ? "default" : "destructive"}>
                  {onlineStatus ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={testPWAStatusApi} 
                className="w-full"
                disabled={!sessionStatus?.authenticated}
              >
                Test PWA Status API
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation Prompt */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>PWA Installation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {pwaStatus ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    App is installed and running as PWA
                  </div>
                  <div className="mt-2">
                    Features available:
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Offline support</li>
                      <li>Background sync</li>
                      <li>Push notifications</li>
                      <li>Native app experience</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Globe className="h-4 w-4" />
                    Running in browser mode
                  </div>
                  <div className="mt-2">
                    To install as PWA:
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Look for "Install" or "Add to Home Screen" option in browser</li>
                      <li>Chrome: Menu → Install app</li>
                      <li>Safari: Share → Add to Home Screen</li>
                      <li>Edge: Menu → Install this site as an app</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}