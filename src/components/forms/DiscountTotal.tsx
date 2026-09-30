'use client';

import { LineItemRow } from '@/components/line-items/LineItemsEditor';
import { formatCurrency } from '@/lib/utils';

interface Props {
  lineItems: LineItemRow[];
  discount: number;
  onDiscountChange: (discount: number) => void;
}

// 明細下の 値引き入力 + 総額表示
export default function DiscountTotal({ lineItems, discount, onDiscountChange }: Props) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = lineItems.reduce((sum, item) => sum + Math.round(item.amount * item.taxRate / 100), 0);
  const total = subtotal + taxAmount - discount;

  return (
    <div className="mt-4 flex justify-end">
      <div className="w-64 space-y-1 text-sm">
        {discount > 0 && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">値引き</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-1">
          <label className="text-gray-600 text-sm">値引き額</label>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={e => onDiscountChange(Number(e.target.value) || 0)}
            className="w-32 text-right border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between py-1 font-bold text-base border-t border-gray-200 pt-2">
          <span>総額</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
