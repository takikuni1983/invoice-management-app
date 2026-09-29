import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateStr;
  }
}

export function formatDateInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : parseISO(String(d));
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export function generateEstimateNumber(lastNumber: string | null): string {
  if (!lastNumber) return 'EST-0001';
  const num = parseInt(lastNumber.replace('EST-', ''), 10);
  return `EST-${String(num + 1).padStart(4, '0')}`;
}

export function generateInvoiceNumber(lastNumber: string | null): string {
  if (!lastNumber) return 'INV-0001';
  const num = parseInt(lastNumber.replace('INV-', ''), 10);
  return `INV-${String(num + 1).padStart(4, '0')}`;
}

export const ESTIMATE_STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  SENT: '送信済み',
  APPROVED: '承認済み',
  INVOICED: '請求済み',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  SENT: '送付済み',
  PAID: '入金済み',
  OVERDUE: '期限超過',
};

export const ESTIMATE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-purple-100 text-purple-700',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

export const TAX_RATES = [0, 8, 10];
