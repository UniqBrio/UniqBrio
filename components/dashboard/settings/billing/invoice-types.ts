export interface Invoice {
  id: string;
  academyName: string;
  planType: "Monthly" | "Yearly";
  invoiceNumber: string;
  dateIssued: string;
  amount: number;
  status: "Paid" | "Failed" | "Pending" | "Overdue";
  paymentMethod: "Card" | "UPI" | "Net Banking" | "Bank Transfer";
  description: string;
}

export interface Payment {
  id: string;
  academyName: string;
  date: string;
  amount: number;
  paymentMethod: "Card" | "UPI" | "Net Banking" | "Bank Transfer";
  transactionId: string;
  refundsAdjustments: string;
}

export interface InvoiceFilters {
  planType: string[];
  status: string[];
  paymentMethod: string[];
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: [number, number];
}

export interface PaymentFilters {
  paymentMethod: string[];
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: [number, number];
}

export const PLAN_TYPE_OPTIONS = ["Monthly", "Yearly"];
export const STATUS_OPTIONS = ["Paid", "Failed", "Pending", "Overdue"];
export const PAYMENT_METHOD_OPTIONS = ["Card", "UPI", "Net Banking", "Bank Transfer"];
