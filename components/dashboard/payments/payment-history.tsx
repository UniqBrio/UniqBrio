'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Separator } from '@/components/dashboard/ui/separator';
import { PaymentRecord } from '@/types/dashboard/payment';
import {
  formatCurrency,
  formatDate,
  formatPaymentMode,
  calculatePaymentStatistics,
} from '@/lib/dashboard/payments/payment-record-helper';
import {
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface PaymentHistoryProps {
  payments: PaymentRecord[];
  totalFee?: number;
  onViewDetails?: (payment: PaymentRecord) => void;
  showStatistics?: boolean;
}

export default function PaymentHistory({
  payments,
  totalFee,
  onViewDetails,
  showStatistics = true,
}: PaymentHistoryProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = new Date(a.paidDate).getTime();
    const dateB = new Date(b.paidDate).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const statistics = calculatePaymentStatistics(payments);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Payment History</h3>
            <p className="text-sm text-muted-foreground">
              No payments have been recorded yet for this enrollment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Section */}
      {showStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(statistics.totalPaid)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Payment Count
                </p>
                <p className="text-2xl font-bold">{statistics.paymentCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Average Payment
                </p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.averagePayment)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Payment
                </p>
                <p className="text-sm font-semibold">
                  {statistics.lastPaymentDate
                    ? formatDate(statistics.lastPaymentDate, 'short')
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment History Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                {payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={toggleSortOrder}>
              <Calendar className="h-4 w-4 mr-2" />
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedPayments.map((payment, index) => (
              <div key={payment._id || index}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section - Date & Mode */}
                  <div className="flex-shrink-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatDate(payment.paidDate, 'long')}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatPaymentMode(payment.paymentMode)}
                    </Badge>
                  </div>

                  {/* Middle Section - Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.paidAmount)}
                      </span>
                      {payment.status && (
                        <Badge
                          variant={
                            payment.status === 'CONFIRMED' || payment.status === 'VERIFIED'
                              ? 'default'
                              : payment.status === 'PENDING'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {payment.status}
                        </Badge>
                      )}
                    </div>

                    {/* Additional Details */}
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {payment.transactionId && (
                        <p>Transaction ID: {payment.transactionId}</p>
                      )}
                      {payment.receiptNumber && <p>Receipt: {payment.receiptNumber}</p>}
                      {payment.paymentSubType && (
                        <p>
                          Type: <span className="font-medium">{payment.paymentSubType}</span>
                        </p>
                      )}
                      <p>
                        Received by: <span className="font-medium">{payment.receivedBy}</span>
                      </p>
                      {payment.payerName && payment.payerType && (
                        <p>
                          Paid by: <span className="font-medium">{payment.payerName}</span> (
                          {payment.payerType})
                        </p>
                      )}
                    </div>

                    {/* Remarks */}
                    {payment.remarks && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <p className="font-semibold mb-1">Remarks:</p>
                        <p className="text-muted-foreground">{payment.remarks}</p>
                      </div>
                    )}

                    {/* Financial Breakdown */}
                    {(payment.discount || payment.specialCharges || payment.taxAmount) && (
                      <div className="mt-2 space-y-1 text-xs">
                        {payment.discount && payment.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>- {formatCurrency(payment.discount)}</span>
                          </div>
                        )}
                        {payment.specialCharges && payment.specialCharges > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Special Charges:</span>
                            <span>+ {formatCurrency(payment.specialCharges)}</span>
                          </div>
                        )}
                        {payment.taxAmount && payment.taxAmount > 0 && (
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>+ {formatCurrency(payment.taxAmount)}</span>
                          </div>
                        )}
                        {payment.netAmount && (
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Net Amount:</span>
                            <span>{formatCurrency(payment.netAmount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(payment)}
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {index < sortedPayments.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Mode Distribution */}
      {showStatistics && Object.keys(statistics.paymentModes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Mode Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.paymentModes).map(([mode, count]) => (
                <div key={mode} className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{formatPaymentMode(mode)}</p>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {((count / statistics.paymentCount) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
