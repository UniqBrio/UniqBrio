/**
 * Category-Specific Invoice Templates
 * Different invoice layouts for each payment type
 */

import { InvoiceData } from './invoice-service';

export interface InvoiceTemplate {
  header: string;
  body: string;
  footer: string;
}

/**
 * ONE-TIME PAYMENT INVOICE
 * Shows partial payment history if applicable
 */
export function generateOneTimeInvoiceHTML(invoiceData: InvoiceData): string {
  const isPartialPayment = invoiceData.remainingBalance && invoiceData.remainingBalance > 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .invoice-header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { color: #4CAF50; margin: 0; }
    .invoice-header p { color: #666; margin: 5px 0; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { width: 48%; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; margin-bottom: 8px; }
    .payment-details { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .payment-details h3 { margin-top: 0; color: #4CAF50; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #4CAF50; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .totals { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .totals div { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
    .totals .grand-total { font-size: 20px; font-weight: bold; color: #2e7d32; border-top: 2px solid #4CAF50; padding-top: 12px; margin-top: 12px; }
    .badge-partial { background: #ff9800; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-full { background: #4CAF50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .history-section { margin-top: 30px; border: 2px solid #2196F3; border-radius: 8px; padding: 20px; background: #e3f2fd; }
    .history-section h3 { color: #1976D2; margin-top: 0; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>🎓 PAYMENT INVOICE</h1>
    <p>UniqBrio Learning Solutions</p>
    <p>Invoice #${invoiceData.invoiceNumber}</p>
    <p>Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>

  <div class="invoice-info">
    <div>
      <div class="label">Student Details</div>
      <div class="value">Name: ${invoiceData.studentName}</div>
      <div class="value">Student ID: ${invoiceData.studentId}</div>
      <div class="value">Course: ${invoiceData.courseName}</div>
      <div class="value">Cohort: ${invoiceData.cohortName}</div>
    </div>
    <div>
      <div class="label">Payment Information</div>
      <div class="value">Payment Type: One-Time <span class="${isPartialPayment ? 'badge-partial' : 'badge-full'}">${isPartialPayment ? 'PARTIAL' : 'FULL'}</span></div>
      <div class="value">Payment Mode: ${invoiceData.paymentMode}</div>
      <div class="value">Received By: ${invoiceData.receivedBy}</div>
    </div>
  </div>

  ${isPartialPayment && invoiceData.paymentHistory && invoiceData.paymentHistory.length > 0 ? `
  <div class="history-section">
    <h3>📋 Payment History</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Mode</th>
          <th>Invoice #</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceData.paymentHistory.map((payment, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${new Date(payment.date).toLocaleDateString('en-IN')}</td>
          <td>${invoiceData.currency }${payment.amount.toLocaleString()}</td>
          <td>${payment.mode}</td>
          <td>${payment.invoiceNumber || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="payment-details">
    <h3>Current Payment Details</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Payment Amount</td>
          <td style="text-align: right;">${invoiceData.currency }${invoiceData.paymentAmount.toLocaleString()}</td>
        </tr>
        ${invoiceData.discount && invoiceData.discount > 0 ? `
        <tr>
          <td>Discount</td>
          <td style="text-align: right; color: #4CAF50;">- ${invoiceData.currency }${invoiceData.discount.toLocaleString()}</td>
        </tr>
        ` : ''}
        ${invoiceData.specialCharges && invoiceData.specialCharges > 0 ? `
        <tr>
          <td>Special Charges</td>
          <td style="text-align: right;">${invoiceData.currency }${invoiceData.specialCharges.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr style="font-weight: bold; background: #e8f5e9;">
          <td>Amount Paid</td>
          <td style="text-align: right;">${invoiceData.currency }${invoiceData.finalAmount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    ${isPartialPayment ? `
    <div><span>Total Course Fee:</span><span>${invoiceData.currency }${((invoiceData.paymentAmount) + (invoiceData.remainingBalance || 0)).toLocaleString()}</span></div>
    <div><span>Total Paid to Date:</span><span>${invoiceData.currency }${(invoiceData.totalPaidToDate || invoiceData.paymentAmount).toLocaleString()}</span></div>
    <div class="grand-total"><span>Remaining Balance:</span><span>${invoiceData.currency }${(invoiceData.remainingBalance || 0).toLocaleString()}</span></div>
    ` : `
    <div class="grand-total"><span>✅ Fully Paid:</span><span>${invoiceData.currency }${invoiceData.finalAmount.toLocaleString()}</span></div>
    `}
  </div>

  ${invoiceData.notes ? `
  <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
    <strong>Notes:</strong> ${invoiceData.notes}
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Thank you for your payment!</strong></p>
    <p>For any queries, contact: support@uniqbrio.com</p>
    <p style="font-size: 12px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}

/**
 * EMI PAYMENT INVOICE
 * Shows EMI schedule with current and upcoming installments
 */
export function generateEMIInvoiceHTML(invoiceData: InvoiceData): string {
  const currentEMI = invoiceData.emiDetails?.emiNumber || 1;
  const totalEMIs = invoiceData.emiDetails?.totalEmis || 1;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .invoice-header { text-align: center; border-bottom: 3px solid #9C27B0; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { color: #9C27B0; margin: 0; }
    .invoice-header p { color: #666; margin: 5px 0; }
    .emi-badge { background: linear-gradient(135deg, #9C27B0, #E91E63); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin: 10px 0; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { width: 48%; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #9C27B0; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .current-emi { background: #f3e5f5 !important; border-left: 4px solid #9C27B0; }
    .totals { background: #f3e5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .totals div { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
    .totals .grand-total { font-size: 20px; font-weight: bold; color: #7B1FA2; border-top: 2px solid #9C27B0; padding-top: 12px; margin-top: 12px; }
    .emi-schedule { margin-top: 30px; border: 2px solid #9C27B0; border-radius: 8px; padding: 20px; background: #fce4ec; }
    .emi-schedule h3 { color: #880E4F; margin-top: 0; }
    .badge-paid { background: #4CAF50; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; }
    .badge-pending { background: #FF9800; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>💳 EMI PAYMENT INVOICE</h1>
    <p>UniqBrio Learning Solutions</p>
    <p>Invoice #${invoiceData.invoiceNumber}</p>
    <p>Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    <div class="emi-badge">EMI ${currentEMI} of ${totalEMIs}</div>
  </div>

  <div class="invoice-info">
    <div>
      <div class="label">Student Details</div>
      <div class="value">Name: ${invoiceData.studentName}</div>
      <div class="value">Student ID: ${invoiceData.studentId}</div>
      <div class="value">Course: ${invoiceData.courseName}</div>
      <div class="value">Cohort: ${invoiceData.cohortName}</div>
    </div>
    <div>
      <div class="label">Payment Information</div>
      <div class="value">Payment Type: EMI Plan</div>
      <div class="value">Payment Mode: ${invoiceData.paymentMode}</div>
      <div class="value">Received By: ${invoiceData.receivedBy}</div>
    </div>
  </div>

  ${invoiceData.paymentHistory && invoiceData.paymentHistory.length > 0 ? `
  <div class="emi-schedule">
    <h3>📊 EMI Payment Schedule</h3>
    <table>
      <thead>
        <tr>
          <th>EMI #</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Invoice #</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceData.paymentHistory.map((payment, index) => `
        <tr ${index + 1 === currentEMI ? 'class="current-emi"' : ''}>
          <td>EMI ${index + 1}</td>
          <td>${new Date(payment.date).toLocaleDateString('en-IN')}</td>
          <td>${invoiceData.currency }${payment.amount.toLocaleString()}</td>
          <td><span class="badge-paid">PAID</span></td>
          <td>${payment.invoiceNumber || '-'}</td>
        </tr>
        `).join('')}
        <tr ${invoiceData.paymentHistory.length === currentEMI - 1 ? 'class="current-emi"' : ''}>
          <td>EMI ${currentEMI}</td>
          <td>${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</td>
          <td>${invoiceData.currency }${invoiceData.paymentAmount.toLocaleString()}</td>
          <td><span class="badge-paid">PAID</span></td>
          <td>${invoiceData.invoiceNumber}</td>
        </tr>
        ${Array.from({ length: totalEMIs - currentEMI }, (_, i) => `
        <tr>
          <td>EMI ${currentEMI + i + 1}</td>
          <td>-</td>
          <td>${invoiceData.currency }${invoiceData.paymentAmount.toLocaleString()}</td>
          <td><span class="badge-pending">PENDING</span></td>
          <td>-</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="totals">
    <div><span>Total Course Fee:</span><span>${invoiceData.currency }${((invoiceData.totalPaidToDate || 0) + (invoiceData.remainingBalance || 0)).toLocaleString()}</span></div>
    <div><span>EMIs Paid (${currentEMI}/${totalEMIs}):</span><span>${invoiceData.currency }${(invoiceData.totalPaidToDate || invoiceData.paymentAmount).toLocaleString()}</span></div>
    <div class="grand-total"><span>Remaining Balance:</span><span>${invoiceData.currency }${(invoiceData.remainingBalance || 0).toLocaleString()}</span></div>
  </div>

  ${invoiceData.notes ? `
  <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
    <strong>Notes:</strong> ${invoiceData.notes}
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Thank you for your payment!</strong></p>
    <p>Next EMI Due: ${currentEMI < totalEMIs ? 'Check your reminder notifications' : 'All EMIs Completed!'}</p>
    <p>For any queries, contact: support@uniqbrio.com</p>
    <p style="font-size: 12px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}

/**
 * MONTHLY SUBSCRIPTION INVOICE
 * Shows monthly payment with subscription details
 */
export function generateMonthlyInvoiceHTML(invoiceData: InvoiceData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .invoice-header { text-align: center; border-bottom: 3px solid #2196F3; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { color: #2196F3; margin: 0; }
    .invoice-header p { color: #666; margin: 5px 0; }
    .subscription-badge { background: linear-gradient(135deg, #2196F3, #03A9F4); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin: 10px 0; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { width: 48%; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #2196F3; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .totals { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .totals div { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
    .totals .grand-total { font-size: 20px; font-weight: bold; color: #1565C0; border-top: 2px solid #2196F3; padding-top: 12px; margin-top: 12px; }
    .next-payment { margin-top: 30px; border: 2px solid #FF9800; border-radius: 8px; padding: 20px; background: #fff3e0; text-align: center; }
    .next-payment h3 { color: #E65100; margin-top: 0; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>📅 MONTHLY SUBSCRIPTION INVOICE</h1>
    <p>UniqBrio Learning Solutions</p>
    <p>Invoice #${invoiceData.invoiceNumber}</p>
    <p>Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    <div class="subscription-badge">MONTHLY PAYMENT</div>
  </div>

  <div class="invoice-info">
    <div>
      <div class="label">Student Details</div>
      <div class="value">Name: ${invoiceData.studentName}</div>
      <div class="value">Student ID: ${invoiceData.studentId}</div>
      <div class="value">Course: ${invoiceData.courseName}</div>
      <div class="value">Cohort: ${invoiceData.cohortName}</div>
    </div>
    <div>
      <div class="label">Payment Information</div>
      <div class="value">Payment Type: Monthly Subscription</div>
      <div class="value">Payment Mode: ${invoiceData.paymentMode}</div>
      <div class="value">Received By: ${invoiceData.receivedBy}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Monthly Subscription Fee</td>
        <td style="text-align: right;">${invoiceData.currency }${invoiceData.paymentAmount.toLocaleString()}</td>
      </tr>
      ${invoiceData.discount && invoiceData.discount > 0 ? `
      <tr>
        <td>Discount Applied</td>
        <td style="text-align: right; color: #4CAF50;">- ${invoiceData.currency }${invoiceData.discount.toLocaleString()}</td>
      </tr>
      ` : ''}
      ${invoiceData.specialCharges && invoiceData.specialCharges > 0 ? `
      <tr>
        <td>Additional Charges</td>
        <td style="text-align: right;">${invoiceData.currency }${invoiceData.specialCharges.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr style="font-weight: bold; background: #e3f2fd;">
        <td>Total Paid This Month</td>
        <td style="text-align: right;">${invoiceData.currency }${invoiceData.finalAmount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="grand-total"><span>✅ Monthly Payment Received:</span><span>${invoiceData.currency }${invoiceData.finalAmount.toLocaleString()}</span></div>
  </div>

  ${invoiceData.nextPaymentDate ? `
  <div class="next-payment">
    <h3>⏰ Next Payment Due</h3>
    <p style="font-size: 18px; margin: 10px 0;"><strong>Date:</strong> ${new Date(invoiceData.nextPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    <p style="font-size: 16px; color: #E65100;"><strong>Amount:</strong> ${invoiceData.currency }${(invoiceData.monthlyInstallment || invoiceData.paymentAmount).toLocaleString()}</p>
  </div>
  ` : ''}

  ${invoiceData.notes ? `
  <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
    <strong>Notes:</strong> ${invoiceData.notes}
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Thank you for your continued subscription!</strong></p>
    <p>For any queries, contact: support@uniqbrio.com</p>
    <p style="font-size: 12px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}

/**
 * ONE-TIME WITH INSTALLMENTS INVOICE
 * Shows installment breakdown (1st, 2nd, Final)
 */
export function generateInstallmentsInvoiceHTML(invoiceData: InvoiceData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .invoice-header { text-align: center; border-bottom: 3px solid #FF5722; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-header h1 { color: #FF5722; margin: 0; }
    .invoice-header p { color: #666; margin: 5px 0; }
    .installment-badge { background: linear-gradient(135deg, #FF5722, #FF9800); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; display: inline-block; margin: 10px 0; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { width: 48%; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #FF5722; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .current-installment { background: #ffebee !important; border-left: 4px solid #FF5722; }
    .totals { background: #ffebee; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .totals div { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
    .totals .grand-total { font-size: 20px; font-weight: bold; color: #D84315; border-top: 2px solid #FF5722; padding-top: 12px; margin-top: 12px; }
    .installment-schedule { margin-top: 30px; border: 2px solid #FF5722; border-radius: 8px; padding: 20px; background: #fff3e0; }
    .installment-schedule h3 { color: #E64A19; margin-top: 0; }
    .badge-paid { background: #4CAF50; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; }
    .badge-pending { background: #FF9800; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>📑 INSTALLMENT PAYMENT INVOICE</h1>
    <p>UniqBrio Learning Solutions</p>
    <p>Invoice #${invoiceData.invoiceNumber}</p>
    <p>Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    <div class="installment-badge">${invoiceData.paymentSubType || 'INSTALLMENT PAYMENT'}</div>
  </div>

  <div class="invoice-info">
    <div>
      <div class="label">Student Details</div>
      <div class="value">Name: ${invoiceData.studentName}</div>
      <div class="value">Student ID: ${invoiceData.studentId}</div>
      <div class="value">Course: ${invoiceData.courseName}</div>
      <div class="value">Cohort: ${invoiceData.cohortName}</div>
    </div>
    <div>
      <div class="label">Payment Information</div>
      <div class="value">Payment Type: One-Time with Installments</div>
      <div class="value">Payment Mode: ${invoiceData.paymentMode}</div>
      <div class="value">Received By: ${invoiceData.receivedBy}</div>
    </div>
  </div>

  ${invoiceData.paymentHistory && invoiceData.paymentHistory.length > 0 ? `
  <div class="installment-schedule">
    <h3>📊 Installment Payment Schedule</h3>
    <table>
      <thead>
        <tr>
          <th>Installment</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Invoice #</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceData.paymentHistory.map((payment, index) => `
        <tr>
          <td>${index === 0 ? '1st' : index === 1 ? '2nd' : 'Final'} Installment</td>
          <td>${new Date(payment.date).toLocaleDateString('en-IN')}</td>
          <td>${invoiceData.currency }${payment.amount.toLocaleString()}</td>
          <td><span class="badge-paid">PAID</span></td>
          <td>${payment.invoiceNumber || '-'}</td>
        </tr>
        `).join('')}
        <tr class="current-installment">
          <td>${invoiceData.paymentSubType || 'Current'} Installment</td>
          <td>${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</td>
          <td>${invoiceData.currency }${invoiceData.paymentAmount.toLocaleString()}</td>
          <td><span class="badge-paid">PAID</span></td>
          <td>${invoiceData.invoiceNumber}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="totals">
    <div><span>Total Course Fee:</span><span>${invoiceData.currency }${((invoiceData.totalPaidToDate || 0) + (invoiceData.remainingBalance || 0)).toLocaleString()}</span></div>
    <div><span>Total Paid to Date:</span><span>${invoiceData.currency }${(invoiceData.totalPaidToDate || invoiceData.paymentAmount).toLocaleString()}</span></div>
    ${invoiceData.remainingBalance && invoiceData.remainingBalance > 0 ? `
    <div class="grand-total"><span>Remaining Balance:</span><span>${invoiceData.currency }${invoiceData.remainingBalance.toLocaleString()}</span></div>
    ` : `
    <div class="grand-total"><span>✅ Fully Paid:</span><span>${invoiceData.currency }${(invoiceData.totalPaidToDate || invoiceData.paymentAmount).toLocaleString()}</span></div>
    `}
  </div>

  ${invoiceData.notes ? `
  <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
    <strong>Notes:</strong> ${invoiceData.notes}
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Thank you for your payment!</strong></p>
    <p>${invoiceData.remainingBalance && invoiceData.remainingBalance > 0 ? 'Next installment reminder will be sent as scheduled.' : 'All installments completed!'}</p>
    <p>For any queries, contact: support@uniqbrio.com</p>
    <p style="font-size: 12px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Main function to generate category-specific invoice HTML
 */
export function generateCategorySpecificInvoice(invoiceData: InvoiceData): string {
  const paymentOption = invoiceData.paymentOption;
  const planType = invoiceData.planType;

  console.log('Generating invoice for payment type:', { paymentOption, planType });

  // EMI Payments
  if (planType === 'EMI' || paymentOption === 'EMI') {
    return generateEMIInvoiceHTML(invoiceData);
  }

  // One-Time with Installments
  if (paymentOption === 'One Time With Installments' || planType === 'ONE_TIME_WITH_INSTALLMENTS') {
    return generateInstallmentsInvoiceHTML(invoiceData);
  }

  // Monthly Subscriptions
  if (paymentOption === 'Monthly' || paymentOption === 'Monthly With Discounts' || planType === 'MONTHLY_SUBSCRIPTION') {
    return generateMonthlyInvoiceHTML(invoiceData);
  }

  // One-Time Payments (default)
  return generateOneTimeInvoiceHTML(invoiceData);
}
