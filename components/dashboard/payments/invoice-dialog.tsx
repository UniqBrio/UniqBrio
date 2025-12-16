"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useCustomColors } from "@/lib/use-custom-colors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/dashboard/ui/dialog";
import { Button } from "@/components/dashboard/ui/button";
import { Badge } from "@/components/dashboard/ui/badge";
import { X, Download, Calendar, CreditCard } from "lucide-react";
import { type Payment } from "@/types/dashboard/payment";
import { useToast } from "@/hooks/dashboard/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useCurrency } from "@/contexts/currency-context";

// Cache for academy information to avoid repeated API calls
let cachedAcademyInfo: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface PaymentRecord {
  _id: string;
  paidAmount: number;
  paidDate: string;
  paymentMode: string;
  transactionId?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  remarks?: string;
}

interface InvoiceDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({
  payment,
  open,
  onOpenChange,
}: InvoiceDialogProps) {
  const { currency } = useCurrency();
  const { primaryColor } = useCustomColors();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [fetchingInvoiceNumber, setFetchingInvoiceNumber] = useState(false);
  // Initialize with cached data or defaults to show immediately
  const [academyInfo, setAcademyInfo] = useState<{
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
  } | null>(() => {
    // Use cached data if available and valid
    if (cachedAcademyInfo && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return cachedAcademyInfo;
    }
    // Return defaults for instant display
    return {
      businessName: 'Academy',
      email: 'contact@academy.com',
      phone: '+XX-XXXXX-XXXXX',
      website: 'www.academy.com',
      logo: '/Academy logo.png',
      tagline: 'Empowering Minds, Shaping Futures'
    };
  });
  const fetchInProgress = useRef(false);

  // Check if this is a partial payment or EMI scenario
  // Show payment history for installments/EMI regardless of payment status
  const isPartialOrEMI = payment?.paymentOption === 'One Time With Installments' || 
                         payment?.paymentOption === 'EMI' ||
                         payment?.planType === 'ONE_TIME_WITH_INSTALLMENTS' ||
                         payment?.planType === 'EMI' ||
                         (payment && payment.receivedAmount > 0 && payment.receivedAmount < (payment.courseFee || 0));

  // Fetch sequential invoice number from API
  useEffect(() => {
    if (!open || fetchingInvoiceNumber) return;
    
    const fetchInvoiceNumber = async () => {
      setFetchingInvoiceNumber(true);
      try {
        const response = await fetch('/api/dashboard/payments/invoices/generate-number', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.invoiceNumber) {
            setInvoiceId(data.invoiceNumber);
          }
        }
      } catch (error) {
        console.error('Error fetching invoice number:', error);
        // Fallback to date-based format if API fails
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        setInvoiceId(`INV-${year}${month}-TEMP`);
      } finally {
        setFetchingInvoiceNumber(false);
      }
    };
    
    fetchInvoiceNumber();
  }, [open]);

  // Fetch academy information with caching
  useEffect(() => {
    const fetchAcademyInfo = async () => {
      if (!open) {
        return;
      }

      // Check if we have valid cached data
      const now = Date.now();
      if (cachedAcademyInfo && (now - cacheTimestamp) < CACHE_DURATION) {
        setAcademyInfo(cachedAcademyInfo);
        return;
      }

      // Prevent concurrent fetches
      if (fetchInProgress.current) {
        return;
      }

      fetchInProgress.current = true;

      try {
        // Fetch academy information from the dedicated API endpoint
        const academyResponse = await fetch('/api/dashboard/academy-info', {
          credentials: 'include',
          cache: 'force-cache', // Use browser cache for better performance
        });

        if (academyResponse.ok) {
          const academyData = await academyResponse.json();
          if (academyData.businessInfo) {
            const business = academyData.businessInfo;
            const info = {
              businessName: business.businessName || business.academyName || 'Academy',
              email: business.businessEmail || business.email || 'contact@academy.com',
              phone: business.phoneNumber || business.phone || '+XX-XXXXX-XXXXX',
              website: business.website || 'www.academy.com',
              address: business.address || '',
              city: business.city || '',
              state: business.state || '',
              country: business.country || '',
              zipCode: business.pincode || business.zipCode || '',
              logo: business.logo || '/Academy logo.png',
              tagline: business.tagline || 'Empowering Minds, Shaping Futures',
              taxId: business.taxId || ''
            };
            
            // Update cache
            cachedAcademyInfo = info;
            cacheTimestamp = now;
            setAcademyInfo(info);
            return;
          }
        }

        // Fallback: try to fetch from user/registration data
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.tenantId) {
            const regResponse = await fetch(`/api/register?tenantId=${data.user.tenantId}`, {
              credentials: 'include'
            });

            if (regResponse.ok) {
              const regData = await regResponse.json();
              if (regData.registration && regData.registration.businessInfo) {
                const business = regData.registration.businessInfo;
                const info = {
                  businessName: business.businessName || business.name || 'Academy',
                  email: business.email || business.businessEmail || 'contact@academy.com',
                  phone: business.phone || business.phoneNumber || business.contactNumber || '+XX-XXXXX-XXXXX',
                  website: business.website || business.websiteUrl || 'www.academy.com',
                  address: business.address || business.businessAddress || '',
                  city: business.city || '',
                  state: business.state || '',
                  country: business.country || '',
                  zipCode: business.pincode || business.zipCode || '',
                  logo: business.logo || business.logoUrl || '/Academy logo.png',
                  tagline: business.tagline || business.slogan || 'Empowering Minds, Shaping Futures',
                  taxId: business.taxId || ''
                };
                
                // Update cache
                cachedAcademyInfo = info;
                cacheTimestamp = now;
                setAcademyInfo(info);
                return;
              }
            }
          }
        }

        // Set default values if both attempts fail
        const defaultInfo = {
          businessName: 'Academy',
          email: 'contact@academy.com',
          phone: '+XX-XXXXX-XXXXX',
          website: 'www.academy.com',
          logo: '/Academy logo.png',
          tagline: 'Empowering Minds, Shaping Futures'
        };
        setAcademyInfo(defaultInfo);
      } catch (error) {
        console.error('Error fetching academy info:', error);
        // Set default values on error
        const defaultInfo = {
          businessName: 'Academy',
          email: 'contact@academy.com',
          phone: '+XX-XXXXX-XXXXX',
          website: 'www.academy.com',
          logo: '/Academy logo.png',
          tagline: 'Empowering Minds, Shaping Futures'
        };
        setAcademyInfo(defaultInfo);
      } finally {
        fetchInProgress.current = false;
      }
    };

    fetchAcademyInfo();
  }, [open]);

  // Fetch payment records for partial payments and EMI
  useEffect(() => {
    const fetchPaymentRecords = async () => {
      if (!open || !payment?.id || !isPartialOrEMI) {
        console.log('Skipping fetch:', { open, hasPaymentId: !!payment?.id, isPartialOrEMI });
        return;
      }

      console.log('Fetching payment records for:', payment.id);
      setLoadingRecords(true);
      try {
        // Try new PaymentRecord system first
        let response = await fetch(
          `/api/dashboard/payments/payment-records?action=history&paymentId=${payment.id}&sortBy=paidDate&sortOrder=asc`,
          {
            credentials: 'include'
          }
        );
        
        console.log('PaymentRecord Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Payment records data:', data);
          if (data.success && data.records && data.records.length > 0) {
            setPaymentRecords(data.records);
            setLoadingRecords(false);
            return;
          }
        }

        // Fallback to PaymentTransaction (current system)
        console.log('Trying PaymentTransaction fallback...');
        response = await fetch(
          `/api/dashboard/payments/manual?paymentId=${payment.id}`,
          {
            credentials: 'include'
          }
        );
        
        console.log('PaymentTransaction Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Payment transactions data:', data);
          if (data.success && data.transactions && data.transactions.length > 0) {
            // Convert PaymentTransaction format to PaymentRecord format
            const convertedRecords = data.transactions.map((txn: any) => ({
              _id: txn._id,
              paidAmount: txn.amount,
              paidDate: txn.paymentDate,
              paymentMode: txn.mode || txn.paymentMode,
              transactionId: txn._id,
              receiptNumber: txn.receiptNumber,
              invoiceNumber: txn.invoiceNumber, // Include existing invoice number
              remarks: txn.notes
            }));
            setPaymentRecords(convertedRecords);
          }
        } else {
          console.error('Failed to fetch payment transactions:', response.status);
        }
      } catch (error) {
        console.error('Error fetching payment records:', error);
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchPaymentRecords();
  }, [open, payment?.id, isPartialOrEMI]);

  // Set invoice ID from existing payment records specific to this payment
  // Initial invoice ID is already set, this effect will update it if a stored one exists
  useEffect(() => {
    const setInvoiceNumber = async () => {
      if (!open || !payment) {
        return;
      }
      
      // Keep the immediate invoice ID visible while fetching
      const immediateId = generateImmediateInvoiceId(payment);
      
      try {
        // Fetch payment records specifically for this payment ID to get existing invoice number
        let existingInvoiceNumber = null;
        
        // Try PaymentRecord system first
        let response = await fetch(
          `/api/dashboard/payments/payment-records?action=history&paymentId=${payment.id}&sortBy=paidDate&sortOrder=desc`,
          {
            credentials: 'include',
            cache: 'force-cache'
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.records && data.records.length > 0) {
            const recordWithInvoice = data.records.find((record: any) => record.invoiceNumber);
            if (recordWithInvoice) {
              existingInvoiceNumber = recordWithInvoice.invoiceNumber;
            }
          }
        }
        
        // If not found, try PaymentTransaction system
        if (!existingInvoiceNumber) {
          response = await fetch(`/api/dashboard/payments/manual?paymentId=${payment.id}`, {
            credentials: 'include',
            cache: 'force-cache'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.transactions && data.transactions.length > 0) {
              const transactionWithInvoice = data.transactions.find((txn: any) => txn.invoiceNumber);
              if (transactionWithInvoice) {
                existingInvoiceNumber = transactionWithInvoice.invoiceNumber;
              }
            }
          }
        }
        
        // Only update if we found a different invoice number
        if (existingInvoiceNumber && existingInvoiceNumber !== immediateId) {
          setInvoiceId(existingInvoiceNumber);
        }
        // Otherwise keep the immediate invoice ID that's already showing
        
      } catch (error) {
        console.error('Error fetching invoice number:', error);
        // Keep the immediate invoice ID on error
      }
    };
    
    setInvoiceNumber();
  }, [open, payment]); // Removed paymentRecords dependency to avoid shared state issues

  if (!payment) return null;

  // Debug logging
  console.log('Invoice Payment Data:', {
    paymentOption: payment.paymentOption,
    planType: payment.planType,
    hasEmiSchedule: !!payment.emiSchedule,
    emiScheduleLength: payment.emiSchedule?.length || 0,
    emiSchedule: payment.emiSchedule,
    isPartialOrEMI,
    paymentRecordsLength: paymentRecords.length
  });
  const invoiceDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const element = document.getElementById('invoice-content');
      if (!element) {
        throw new Error('Invoice content not found');
      }

      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your invoice...",
      });

      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed (only if content exceeds one page)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const filename = `Invoice_${payment.studentId}_${invoiceId}.pdf`;
      pdf.save(filename);

      // Show success toast
      toast({
        title: "Invoice Downloaded",
        description: `${filename} has been saved successfully.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full p-0">
        <DialogHeader className="print:hidden sticky top-0 bg-white z-10 p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Payment Invoice</DialogTitle>
            <DialogDescription className="sr-only">View and download detailed payment invoice</DialogDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </DialogHeader>

        {/* Invoice Content */}
        <div className="bg-white p-4 sm:p-8 print:p-12 mx-4 sm:mx-6 mb-4 sm:mb-6" id="invoice-content">
          {/* Header with Logo */}
          <div className="pb-6 mb-6" style={{ borderBottom: '4px solid', borderColor: primaryColor }}>
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="w-full md:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2">
                  {/* Academy Logo */}
                  <div className="relative h-16 w-24">
                    <Image 
                      src={academyInfo?.logo || '/Academy logo.png'} 
                      alt="Academy Logo" 
                      fill 
                      style={{ objectFit: "contain" }} 
                      priority 
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: primaryColor }}>
                      {academyInfo?.businessName || 'Academy'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-white font-medium">
                      {academyInfo?.tagline || 'Empowering Minds, Shaping Futures'}
                    </p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-white mt-4 space-y-1">
                  <p><strong>Email:</strong> {academyInfo?.email || 'contact@academy.com'}</p>
                  <p><strong>Phone:</strong> {academyInfo?.phone || '+XX-XXXXX-XXXXX'}</p>
                  <p><strong>Website:</strong> {academyInfo?.website || 'www.academy.com'}</p>
                  {academyInfo?.taxId && (
                    <p><strong>Tax ID:</strong> {academyInfo.taxId}</p>
                  )}
                  {academyInfo?.address && (
                    <p className="mt-1">
                      <strong>Address:</strong> {academyInfo.address}
                      {academyInfo.city && `, ${academyInfo.city}`}
                      {academyInfo.state && `, ${academyInfo.state}`}
                      {academyInfo.zipCode && ` - ${academyInfo.zipCode}`}
                      {academyInfo.country && `, ${academyInfo.country}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left md:text-right w-full md:w-auto">
                <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: primaryColor }}>INVOICE</h2>
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold">Invoice #: {invoiceId}</p>
                  <p className="text-gray-600 dark:text-white">Date: {invoiceDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Student Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Student ID</p>
                <p className="font-semibold">{payment.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Student Name</p>
                <p className="font-semibold">{payment.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Course</p>
                <p className="font-semibold">{payment.enrolledCourseName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Course ID</p>
                <p className="font-semibold">{payment.enrolledCourse || payment.enrolledCourseId}</p>
              </div>
              {payment.cohortName && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">Cohort</p>
                  <p className="font-semibold">{payment.cohortName}</p>
                </div>
              )}
              {payment.cohortId && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">Cohort ID</p>
                  <p className="font-semibold">{payment.cohortId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Payment Details</h3>
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 sm:p-3 font-semibold border text-sm sm:text-base">Description</th>
                  <th className="text-right p-2 sm:p-3 font-semibold border text-sm sm:text-base">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {payment.courseFee > 0 && (
                  <tr className="border">
                    <td className="p-2 sm:p-3 border text-sm sm:text-base">Course Fee</td>
                    <td className="text-right p-2 sm:p-3 border text-sm sm:text-base">{currency} {payment.courseFee.toLocaleString()}</td>
                  </tr>
                )}
                {payment.studentRegistrationFee > 0 && (
                  <tr className="border">
                    <td className="p-2 sm:p-3 border text-sm sm:text-base">Student Registration Fee</td>
                    <td className="text-right p-2 sm:p-3 border text-sm sm:text-base">{currency} {payment.studentRegistrationFee.toLocaleString()}</td>
                  </tr>
                )}
                {payment.courseRegistrationFee > 0 && (
                  <tr className="border">
                    <td className="p-2 sm:p-3 border text-sm sm:text-base">Course Registration Fee</td>
                    <td className="text-right p-2 sm:p-3 border text-sm sm:text-base">{currency} {payment.courseRegistrationFee.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="border bg-gray-50">
                  <td className="p-2 sm:p-3 font-semibold border text-sm sm:text-base">Total Amount</td>
                  <td className="text-right p-2 sm:p-3 font-semibold border text-sm sm:text-base">
                    {currency} {((payment.courseFee || 0) + (payment.studentRegistrationFee || 0) + (payment.courseRegistrationFee || 0)).toLocaleString()}
                  </td>
                </tr>
                <tr className="border bg-green-50">
                  <td className="p-2 sm:p-3 font-semibold text-green-700 border text-sm sm:text-base">Amount Paid</td>
                  <td className="text-right p-2 sm:p-3 font-semibold text-green-700 border text-sm sm:text-base">{currency} {(payment.receivedAmount || 0).toLocaleString()}</td>
                </tr>
                <tr className="bg-red-50 border">
                  <td className="p-2 sm:p-3 font-semibold text-red-700 border text-sm sm:text-base">Outstanding Balance</td>
                  <td className="text-right p-2 sm:p-3 font-semibold text-red-700 border text-sm sm:text-base">{currency} {(payment.outstandingAmount || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* Payment History */}
          {(payment.lastPaymentDate || (isPartialOrEMI && (paymentRecords.length > 0 || payment.emiSchedule))) && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Payment History
              </h3>
              
              {loadingRecords ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-white">Loading payment history...</p>
                </div>
              ) : paymentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">S.No</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Date</th>
                        <th className="border border-gray-300 p-3 text-right text-sm font-semibold">Amount Paid</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Mode</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Transaction ID</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Receipt No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentRecords.map((record, index) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3 text-sm">{index + 1}</td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {new Date(record.paidDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="border border-gray-300 p-3 text-right text-sm font-semibold">
                            {currency} {record.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {record.paymentMode}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm text-gray-600 dark:text-white">
                            {record.transactionId || '-'}
                          </td>
                          <td className="border border-gray-300 p-3 text-sm text-gray-600 dark:text-white">
                            {record.receiptNumber || '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={2} className="border border-gray-300 p-3 text-sm text-right">
                          Total Paid:
                        </td>
                        <td className="border border-gray-300 p-3 text-right text-sm">
                          {currency} {paymentRecords.reduce((sum, r) => sum + r.paidAmount, 0).toLocaleString('en-IN')}
                        </td>
                        <td colSpan={3} className="border border-gray-300 p-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : payment.emiSchedule && payment.emiSchedule.length > 0 ? (
                <>
                  {console.log('Rendering EMI Schedule Table:', payment.emiSchedule)}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">EMI No.</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Due Date</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Paid Date</th>
                        <th className="border border-gray-300 p-3 text-right text-sm font-semibold">Amount</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Status</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.emiSchedule.map((emi, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${emi.status === 'PAID' ? 'bg-green-50' : ''}`}>
                          <td className="border border-gray-300 p-3 text-sm">EMI {emi.emiNumber}</td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {new Date(emi.dueDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            {emi.paidDate ? new Date(emi.paidDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </td>
                          <td className="border border-gray-300 p-3 text-right text-sm font-semibold">
                            {currency} {(emi.paidAmount || emi.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-gray-300 p-3 text-sm">
                            <Badge 
                              variant={emi.status === 'PAID' ? 'default' : emi.status === 'OVERDUE' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {emi.status}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-3 text-sm text-gray-600 dark:text-white">
                            {emi.transactionId || '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={3} className="border border-gray-300 p-3 text-sm text-right">
                          Total Paid:
                        </td>
                        <td className="border border-gray-300 p-3 text-right text-sm">
                          {currency} {payment.emiSchedule
                            .filter(emi => emi.status === 'PAID')
                            .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount), 0)
                            .toLocaleString('en-IN')}
                        </td>
                        <td colSpan={2} className="border border-gray-300 p-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-white">Last Payment Date</p>
                  <p className="font-semibold">
                    {payment.lastPaymentDate ? new Date(payment.lastPaymentDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : 'No payments yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-600 dark:text-white">
            <p className="mb-2 font-semibold">Thank you for choosing {academyInfo?.businessName || 'our academy'}!</p>
            <p>For any queries, please contact us at {academyInfo?.email || 'contact@academy.com'}</p>
            <p className="mt-4 text-xs italic">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
