export type EstimateStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'INVOICED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface Customer {
  id: number;
  companyName: string;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id?: number;
  sortOrder: number;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface Estimate {
  id: number;
  estimateNumber: string;
  customerId: number;
  customer?: Customer;
  status: EstimateStatus;
  issueDate: string;
  expiryDate?: string | null;
  subject?: string | null;
  notes?: string | null;
  terms?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  discount: number;
  lineItems: LineItem[];
  customFields?: { id?: number; label: string; value: string; sortOrder: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customer?: Customer;
  estimateId?: number | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  subject?: string | null;
  notes?: string | null;
  terms?: string | null;
  bankInfo?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAt?: string | null;
  lineItems: LineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenueThisMonth: number;
  totalRevenuePrevMonth: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  overdueInvoicesCount: number;
  overdueInvoicesTotal: number;
  draftEstimatesCount: number;
  recentInvoices: Invoice[];
  monthlyRevenue: { month: string; amount: number }[];
}
