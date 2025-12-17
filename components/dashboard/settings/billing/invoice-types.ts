export interface Invoice {
  _id: string;
  id: string;
  academyId: string;
  academyName: string;
  userId: string;
  ownerAdminName: string;
  email: string;
  phone: string;
  planType: "Monthly" | "Yearly";
  invoiceNumber: string;
  dateIssued: string;
  amount: number;
  status: "Paid" | "Failed" | "Pending" | "Overdue";
  paymentMethod: "Card" | "UPI" | "Net Banking" | "Bank Transfer";
  description: string;
  paymentRecordId: string;
  startDate: string;
  endDate: string;
  studentSize: number;
  dueMonth: string;
  createdAt: string;
  updatedAt: string;
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
