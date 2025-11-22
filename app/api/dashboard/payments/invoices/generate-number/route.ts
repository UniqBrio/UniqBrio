import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { generateInvoiceNumber } from '@/lib/dashboard/payments/payment-processing-service';

/**
 * Generate sequential invoice number
 * GET /api/payments/invoices/generate-number
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    
    const invoiceNumber = await generateInvoiceNumber();
    
    return NextResponse.json({
      success: true,
      invoiceNumber,
    });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    
    // Fallback to timestamp-based ID
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const fallbackId = `INV-${year}${month}-${Date.now().toString().slice(-4)}`;
    
    return NextResponse.json({
      success: true,
      invoiceNumber: fallbackId,
      fallback: true,
    });
  }
}