export type BuyerBusinessInfo = {
  businessName?: string;
  legalEntityName?: string;
  businessEmail?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  taxId?: string; // GSTIN
};

export type InvoiceLike = {
  invoiceNumber?: string;
  dateIssued?: string;
  amount?: number;
  paymentMethod?: string;
  plan?: string;
  planType?: string;
  startDate?: string;
  endDate?: string;
  email?: string;
  phone?: string;
};

export type PaymentLike = {
  transactionId?: string;
  date?: string;
  amount?: number;
  paymentMethod?: string;
  plan?: string;
  startDate?: string;
  endDate?: string;
};

const SELLER = {
  name: "UniqBrioz InfoTech",
  addressLines: [
    "4/123, KJ Nagar, Saravanampatti,",
    "611111, Coimbatore, Tamilnadu",
  ],
  email: "support@uniqbrio.com",
  phone: "+91-80563 29742",
  gstin: "",
  pan: "",
  currency: "INR",
  logoPath: "/logo.png",
} as const;

function formatDate(dateLike?: string) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toFixed2(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function formatMoneyINR(amount?: number) {
  if (amount == null || Number.isNaN(amount)) return "0.00";
  return toFixed2(amount);
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function numberToWordsINR(amount?: number) {
  const safeAmount = isFiniteNumber(amount) ? amount : 0;
  const rupees = Math.floor(Math.abs(safeAmount));
  const paise = Math.round((Math.abs(safeAmount) - rupees) * 100);

  const words = (n: number) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const chunkToWords = (num: number) => {
      let out = "";
      if (num >= 100) {
        out += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
      }
      if (num >= 20) {
        out += tens[Math.floor(num / 10)] + " ";
        num %= 10;
      }
      if (num > 0) out += ones[num] + " ";
      return out.trim();
    };

    if (n === 0) return "Zero";

    const parts: string[] = [];
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;

    if (crore) parts.push(chunkToWords(crore) + " Crore");
    if (lakh) parts.push(chunkToWords(lakh) + " Lakh");
    if (thousand) parts.push(chunkToWords(thousand) + " Thousand");
    if (rest) parts.push(chunkToWords(rest));

    return parts.join(" ").replace(/\s+/g, " ").trim();
  };

  const rupeeWords = words(rupees);
  const paiseWords = paise ? words(paise) : "";

  if (!paise) return `Rupees ${rupeeWords} Only`;
  return `Rupees ${rupeeWords} and ${paiseWords} Paise Only`;
}

function safeUpper(s?: string) {
  return (s ?? "").toUpperCase();
}

function safeString(v: unknown) {
  if (v == null) return "";
  return String(v);
}

type JsPdfCtor = { new (options?: any): any };

async function loadPdfLibs(): Promise<{ jsPDF: JsPdfCtor; autoTable: any }> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = (autoTableModule as any).default ?? autoTableModule;
  return { jsPDF: jsPDF as any, autoTable };
}

export async function downloadInvoicePdf(params: { invoice: InvoiceLike; buyer?: BuyerBusinessInfo }) {
  const { invoice, buyer } = params;
  const { jsPDF, autoTable } = await loadPdfLibs();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Professional white header background
  doc.setFillColor(255, 255, 255); // White
  doc.rect(0, 0, pageWidth, 35, "F");

  // Add logo (left side of header)
  try {
    const logoData = await fetch(SELLER.logoPath).then(r => r.blob()).then(b => 
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(b);
      })
    );
    doc.addImage(logoData, "PNG", margin, 8, 35, 12);
  } catch (e) {
    console.warn("Logo could not be loaded:", e);
  }

  // TAX INVOICE title (right side)
  doc.setTextColor(124, 58, 237); // Purple text
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageWidth - margin, 15, { align: "right" });

  // Invoice meta info in header
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // Gray text
  const invoiceId = safeString(invoice.invoiceNumber);
  const invoiceDate = formatDate(invoice.dateIssued);
  doc.text(`Invoice: ${invoiceId}`, pageWidth - margin, 24, { align: "right" });
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, 30, { align: "right" });

  // White body section starts
  doc.setTextColor(0, 0, 0);
  const bodyTop = 40;

  // Seller and Buyer info side by side with modern cards
  const cardY = bodyTop;
  const cardW = (pageWidth - margin * 3) / 2;
  const cardH = 38;

  // From card (left)
  doc.setFillColor(249, 250, 251); // Light gray
  doc.roundedRect(margin, cardY, cardW, cardH, 3, 3, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY, cardW, cardH, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(124, 58, 237);
  doc.text("FROM", margin + 4, cardY + 7);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(SELLER.name, margin + 4, cardY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const sellerLines = [
    ...SELLER.addressLines,
    `${SELLER.email} | ${SELLER.phone}`,
    SELLER.gstin ? `GSTIN: ${SELLER.gstin}` : "",
    SELLER.pan ? `PAN: ${SELLER.pan}` : "",
  ].filter(Boolean);
  doc.text(sellerLines, margin + 4, cardY + 19);

  // Bill To card (right)
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin + cardW + margin, cardY, cardW, cardH, 3, 3, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + cardW + margin, cardY, cardW, cardH, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(124, 58, 237);
  doc.text("BILL TO", margin + cardW + margin + 4, cardY + 7);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  const buyerName = safeString(buyer?.businessName || buyer?.legalEntityName);
  doc.text(buyerName || "Customer", margin + cardW + margin + 4, cardY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const buyerEmail = safeString(buyer?.businessEmail || invoice.email);
  const buyerPhone = safeString(buyer?.phoneNumber || invoice.phone);
  const buyerAddr = safeString(buyer?.address);
  const buyerCity = safeString(buyer?.city);
  const buyerState = safeString(buyer?.state);
  const buyerPin = safeString(buyer?.pincode);
  const buyerGstin = safeString(buyer?.taxId);

  const billToLines = [
    buyerEmail,
    buyerPhone,
    buyerAddr,
    `${buyerCity}${buyerState ? ", " + buyerState : ""}${buyerPin ? " - " + buyerPin : ""}`,
    buyerGstin ? `GSTIN: ${buyerGstin}` : "",
  ].filter(Boolean);
  doc.text(billToLines, margin + cardW + margin + 4, cardY + 19);

  // Additional meta info below cards
  const metaY = cardY + cardH + 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  const metaLeft = [
    `Terms: Due on receipt`,
    `Due Date: ${invoiceDate}`,
  ];
  doc.text(metaLeft, margin, metaY);

  const metaRight = [
    `Place of Supply: ${buyerCity || buyerState || "India"}`,
    `Currency: ${SELLER.currency}`,
  ];
  doc.text(metaRight, pageWidth - margin, metaY, { align: "right" });

  // Item table
  const tableTop = metaY + 6;
  const rateTotal = isFiniteNumber(invoice.amount) ? invoice.amount : 0;
  const base = rateTotal / 1.18;
  const cgstAmt = base * 0.09;
  const sgstAmt = base * 0.09;

  const plan = safeUpper(invoice.plan) || safeUpper(invoice.planType);
  const term = invoice.planType ? safeString(invoice.planType) : "";
  const duration = invoice.startDate && invoice.endDate ? `${formatDate(invoice.startDate)} to ${formatDate(invoice.endDate)}` : "";

  const itemDescription = [
    "Service: UniqBrio Digital Academy",
    plan ? `Plan: ${plan}` : "",
    term ? `Payment term: ${term}` : "",
    duration ? `Payment Duration: ${duration}` : "",
    "SAC:",
  ].filter(Boolean).join("\n");

  autoTable(doc, {
    startY: tableTop,
    theme: "grid",
    styles: { 
      fontSize: 9, 
      cellPadding: 3, 
      valign: "middle",
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    headStyles: { 
      fillColor: [124, 58, 237], 
      textColor: [255, 255, 255], 
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 68 },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 20, halign: "right" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 16, halign: "center" },
      6: { cellWidth: 18, halign: "right" },
      7: { cellWidth: 27, halign: "right", fontStyle: "bold" },
    },
    head: [["Item Description", "Qty", "Rate", "CGST %", "Amt", "SGST %", "Amt", "Amount (Inc. GST)"]],
    body: [
      [
        itemDescription,
        "1",
        formatMoneyINR(base),
        "9%",
        formatMoneyINR(cgstAmt),
        "9%",
        formatMoneyINR(sgstAmt),
        formatMoneyINR(rateTotal),
      ],
    ],
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? tableTop + 30;

  // Total in words (full width box)
  const wordsY = finalY + 3;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, wordsY, pageWidth - margin * 2, 12, 2, 2, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, wordsY, pageWidth - margin * 2, 12, 2, 2, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Amount in words:", margin + 4, wordsY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(numberToWordsINR(rateTotal), margin + 4, wordsY + 9);

  // Summary box (right-aligned)
  const summaryY = wordsY + 13;
  const summaryW = 70;
  
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(pageWidth - margin - summaryW, summaryY, summaryW, 24, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", pageWidth - margin - summaryW + 4, summaryY + 6);
  doc.text(`INR ${formatMoneyINR(base)}`, pageWidth - margin - 4, summaryY + 6, { align: "right" });

  doc.text("Tax (CGST+SGST 18%):", pageWidth - margin - summaryW + 4, summaryY + 12);
  doc.text(`INR ${formatMoneyINR(cgstAmt + sgstAmt)}`, pageWidth - margin - 4, summaryY + 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total Paid:", pageWidth - margin - summaryW + 4, summaryY + 19);
  doc.text(`INR ${formatMoneyINR(rateTotal)}`, pageWidth - margin - 4, summaryY + 19, { align: "right" });

  // Footer notes
  const footerY = summaryY + 26;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text("Tax is payable on forward charge", margin, footerY);
  doc.text("IRN: Not applicable (turnover below threshold)", margin, footerY + 4);

  // Terms & Conditions
  const termsY = footerY + 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Terms & Conditions", margin, termsY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const terms = [
    "1. Access will be provisioned within 24 hours of payment realization.",
    `2. For support: ${SELLER.email}  |  ${SELLER.phone}`,
  ];
  doc.text(terms, margin, termsY + 5);

  const filename = invoiceId ? `invoice-${invoiceId}.pdf` : `invoice-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export async function downloadPaymentReceiptPdf(params: { payment: PaymentLike; buyer?: BuyerBusinessInfo }) {
  const { payment, buyer } = params;
  const { jsPDF, autoTable } = await loadPdfLibs();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Professional white header background
  doc.setFillColor(255, 255, 255); // White
  doc.rect(0, 0, pageWidth, 35, "F");

  // Add logo
  try {
    const logoData = await fetch(SELLER.logoPath).then(r => r.blob()).then(b => 
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(b);
      })
    );
    doc.addImage(logoData, "PNG", margin, 8, 35, 12);
  } catch (e) {
    console.warn("Logo could not be loaded:", e);
  }

  // PAYMENT RECEIPT title
  doc.setTextColor(22, 163, 74); // Green text
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", pageWidth - margin, 14, { align: "right" });

  // Receipt meta info
  const receiptNo = safeString(payment.transactionId);
  const receiptDate = formatDate(payment.date);
  const paymentMethod = safeString(payment.paymentMethod);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // Gray text
  doc.text(`Receipt #: ${receiptNo}`, pageWidth - margin, 22, { align: "right" });
  doc.text(`Date: ${receiptDate}`, pageWidth - margin, 27, { align: "right" });
  doc.text(`Method: ${paymentMethod}`, pageWidth - margin, 32, { align: "right" });

  // White body section
  doc.setTextColor(0, 0, 0);
  const bodyTop = 40;

  // Seller and Customer cards
  const cardY = bodyTop;
  const cardW = (pageWidth - margin * 3) / 2;
  const cardH = 38;

  // From card
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, cardY, cardW, cardH, 3, 3, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY, cardW, cardH, 3, 3, "S");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY, cardW, cardH, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("FROM", margin + 4, cardY + 7);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(SELLER.name, margin + 4, cardY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const sellerLines = [
    ...SELLER.addressLines,
    `${SELLER.email} | ${SELLER.phone}`,
    SELLER.gstin ? `GSTIN: ${SELLER.gstin}` : "",
    SELLER.pan ? `PAN: ${SELLER.pan}` : "",
  ].filter(Boolean);
  doc.text(sellerLines, margin + 4, cardY + 19);

  // Received From card
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin + cardW + margin, cardY, cardW, cardH, 3, 3, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + cardW + margin, cardY, cardW, cardH, 3, 3, "S");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + cardW + margin, cardY, cardW, cardH, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("RECEIVED FROM", margin + cardW + margin + 4, cardY + 7);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  const buyerName = safeString(buyer?.businessName || buyer?.legalEntityName);
  doc.text(buyerName || "Customer", margin + cardW + margin + 4, cardY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const buyerEmail = safeString(buyer?.businessEmail);
  const buyerPhone = safeString(buyer?.phoneNumber);
  const buyerAddr = safeString(buyer?.address);
  const buyerCity = safeString(buyer?.city);
  const buyerState = safeString(buyer?.state);
  const buyerPin = safeString(buyer?.pincode);
  const buyerGstin = safeString(buyer?.taxId);

  const recvLines = [
    buyerEmail,
    buyerPhone,
    buyerAddr,
    `${buyerCity}${buyerState ? ", " + buyerState : ""}${buyerPin ? " - " + buyerPin : ""}`,
    buyerGstin ? `GSTIN: ${buyerGstin}` : "",
  ].filter(Boolean);
  doc.text(recvLines, margin + cardW + margin + 4, cardY + 19);

  // Meta info below cards
  const metaY = cardY + cardH + 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(`Currency: ${SELLER.currency}`, margin, metaY);

  // Table
  const tableTop = metaY + 6;
  const total = isFiniteNumber(payment.amount) ? payment.amount : 0;
  const base = total / 1.18;
  const cgstAmt = base * 0.09;
  const sgstAmt = base * 0.09;

  const duration = payment.startDate && payment.endDate ? `${formatDate(payment.startDate)} - ${formatDate(payment.endDate)}` : "";
  const plan = safeUpper(payment.plan);

  const itemDesc = [
    "Service: UniqBrio Digital Academy",
    plan ? `Plan: ${plan}` : "",
    duration ? `Duration: ${duration}` : "",
    "SAC:",
  ].filter(Boolean).join("\n");

  autoTable(doc, {
    startY: tableTop,
    theme: "grid",
    styles: { 
      fontSize: 9, 
      cellPadding: 3, 
      valign: "middle",
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    headStyles: { 
      fillColor: [22, 163, 74], 
      textColor: [255, 255, 255], 
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 48 },
      4: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    head: [["Item Description", "Qty", "Amount", "Tax", "Total Paid"]],
    body: [
      [
        itemDesc,
        "1",
        formatMoneyINR(base),
        `CGST 9%: ${formatMoneyINR(cgstAmt)}\nSGST 9%: ${formatMoneyINR(sgstAmt)}`,
        formatMoneyINR(total),
      ],
    ],
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? tableTop + 30;

  // Total in words box
  const wordsY = finalY + 3;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, wordsY, pageWidth - margin * 2, 12, 2, 2, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, wordsY, pageWidth - margin * 2, 12, 2, 2, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Amount in words:", margin + 4, wordsY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(numberToWordsINR(total), margin + 4, wordsY + 9);

  // Summary box
  const summaryY = wordsY + 13;
  const summaryW = 70;
  
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(pageWidth - margin - summaryW, summaryY, summaryW, 18, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid:", pageWidth - margin - summaryW + 4, summaryY + 8);
  doc.text(`INR ${formatMoneyINR(total)}`, pageWidth - margin - 4, summaryY + 8, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Balance Due:", pageWidth - margin - summaryW + 4, summaryY + 14);
  doc.text("INR 0.00", pageWidth - margin - 4, summaryY + 14, { align: "right" });

  // Acknowledgment note
  const noteY = summaryY + 22;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(107, 114, 128);
  doc.text(
    "This receipt acknowledges successful payment for the subscription period mentioned above.",
    margin,
    noteY,
    { maxWidth: pageWidth - margin * 2 }
  );

  const filename = receiptNo ? `payment-receipt-${receiptNo}.pdf` : `payment-receipt-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
