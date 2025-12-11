'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Button } from '@/components/dashboard/ui/button';
import { Badge } from '@/components/dashboard/ui/badge';
import { Separator } from '@/components/dashboard/ui/separator';
import { InvoiceBreakdown } from '@/types/dashboard/payment';
import { formatCurrency, formatDate } from '@/lib/dashboard/payments/payment-record-helper';
import { Download, Printer, FileText, Calendar, User, CreditCard } from 'lucide-react';

interface AcademyInfo {
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logo?: string;
  tagline?: string;
  taxId?: string;
}

interface InvoiceDisplayProps {
  invoice: InvoiceBreakdown;
  showActions?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  academyInfo?: AcademyInfo | null;
}

export default function InvoiceDisplay({
  invoice,
  showActions = true,
  onDownload,
  onPrint,
  companyName = 'UniqBrio Education',
  companyAddress = 'Your Address Here',
  companyPhone = '+91 XXXXXXXXXX',
  companyEmail = 'info@uniqbrio.com',
  companyLogo,
  academyInfo,
}: InvoiceDisplayProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {showActions && (
        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      )}

      {/* Invoice Card */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="border-b">
          {/* Company Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              {(academyInfo?.logo || companyLogo) ? (
                <img 
                  src={academyInfo?.logo || companyLogo} 
                  alt={academyInfo?.businessName || companyName} 
                  className="h-12 mb-2" 
                />
              ) : (
                <h1 className="text-2xl font-bold text-primary">
                  {academyInfo?.businessName || companyName}
                </h1>
              )}
              {academyInfo?.tagline && (
                <p className="text-sm text-muted-foreground font-medium">{academyInfo.tagline}</p>
              )}
              <div className="text-sm text-muted-foreground space-y-1">
                {academyInfo?.address ? (
                  <p>
                    {academyInfo.address}
                    {academyInfo.city && `, ${academyInfo.city}`}
                    {academyInfo.state && `, ${academyInfo.state}`}
                    {academyInfo.zipCode && ` - ${academyInfo.zipCode}`}
                    {academyInfo.country && `, ${academyInfo.country}`}
                  </p>
                ) : (
                  <p>{companyAddress}</p>
                )}
                <p>
                  {academyInfo?.phone || companyPhone} | {academyInfo?.email || companyEmail}
                </p>
                {academyInfo?.website && (
                  <p>Website: {academyInfo.website}</p>
                )}
                {academyInfo?.taxId && (
                  <p>Tax ID: {academyInfo.taxId}</p>
                )}
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className="mb-2">
                <FileText className="h-3 w-3 mr-1" />
                {invoice.invoiceNumber || 'INVOICE'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Date: {formatDate(invoice.generatedAt, 'long')}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Student Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">BILL TO:</h3>
            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {invoice.studentName}
              </p>
              <p className="text-sm text-muted-foreground">Student ID: {invoice.studentId}</p>
              {invoice.courseName && (
                <p className="text-sm text-muted-foreground">Course: {invoice.courseName}</p>
              )}
              {invoice.cohortName && (
                <p className="text-sm text-muted-foreground">Cohort: {invoice.cohortName}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Fee Breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-3">FEE BREAKDOWN</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Base Fee</span>
                <span className="font-medium">{formatCurrency(invoice.baseFee)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.specialCharges > 0 && (
                <div className="flex justify-between py-2 text-orange-600">
                  <span>Special Charges</span>
                  <span>+ {formatCurrency(invoice.specialCharges)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Tax</span>
                  <span>+ {formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total Fee</span>
                <span>{formatCurrency(invoice.totalFee)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment History */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              PAYMENT HISTORY
            </h3>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
                  <div className="col-span-2">DATE</div>
                  <div className="col-span-3">AMOUNT</div>
                  <div className="col-span-2">MODE</div>
                  <div className="col-span-3">TRANSACTION ID</div>
                  <div className="col-span-2">RECEIPT NO.</div>
                </div>
                {invoice.payments.map((payment, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0"
                  >
                    <div className="col-span-2">{formatDate(payment.date)}</div>
                    <div className="col-span-3 font-medium">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {payment.mode}
                      </Badge>
                    </div>
                    <div className="col-span-3 text-muted-foreground text-xs">
                      {payment.transactionId || '-'}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {payment.receiptNumber || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(invoice.totalPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding Balance</span>
              <span
                className={`font-semibold ${
                  invoice.outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(invoice.outstandingBalance)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Payment Status</span>
              <Badge
                variant={
                  invoice.paymentStatus === 'PAID'
                    ? 'default'
                    : invoice.paymentStatus === 'PARTIAL'
                    ? 'secondary'
                    : 'outline'
                }
                className="text-sm"
              >
                {invoice.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p className="font-semibold">Terms & Conditions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All payments are non-refundable</li>
              <li>Please keep this invoice for your records</li>
              <li>For any queries, please contact us at {companyEmail}</li>
            </ul>
          </div>

          {/* Payment Methods Info */}
          {invoice.outstandingBalance > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Payment Methods</h4>
              <p className="text-xs text-muted-foreground">
                We accept Cash, Card, UPI, Bank Transfer, and Cheque payments. Please contact our
                office to make your next payment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
