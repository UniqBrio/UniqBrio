"use client";

import { useState } from 'react';
import { Button } from '@/components/dashboard/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Alert, AlertDescription } from '@/components/dashboard/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function MigratePaymentStatusPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/dashboard/payments/migrate-status', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err) {
      setError('Failed to run migration: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Migration</CardTitle>
          <CardDescription>
            Update all payment statuses to use only "Pending" and "Paid"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">What this migration does:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>"Partial" → "Paid"</li>
              <li>"Completed" → "Paid"</li>
              <li>"In Progress" → "Paid"</li>
              <li>"Pending" remains "Pending"</li>
            </ul>
          </div>

          <Button 
            onClick={runMigration} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Running Migration...' : 'Run Migration'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-semibold">Migration completed successfully!</p>
                  <div className="text-sm">
                    <p>Records updated:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>"Partial" → "Paid": {result.results.partial}</li>
                      <li>"Completed" → "Paid": {result.results.completed}</li>
                      <li>"In Progress" → "Paid": {result.results.inProgress}</li>
                    </ul>
                  </div>
                  {result.currentStatusDistribution && (
                    <div className="text-sm mt-2">
                      <p>Current status distribution:</p>
                      <ul className="list-disc list-inside ml-4">
                        {result.currentStatusDistribution.map((item: any) => (
                          <li key={item._id}>{item._id}: {item.count}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <strong>Next step:</strong> Refresh the payments page to see the updated statuses.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
