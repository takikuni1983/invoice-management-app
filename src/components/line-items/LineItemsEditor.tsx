'use client';

import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, TAX_RATES } from '@/lib/utils';

export interface LineItemRow {
  description: string;
  details?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  taxRate: number;
}

interface Props {
  items: LineItemRow[];
  onChange: (items: LineItemRow[]) => void;
}

export default function LineItemsEditor({ items, onChange }: Props) {
  function updateItem(index: number, field: keyof LineItemRow, value: string | number) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        next.amount = Number(next.quantity) * Number(next.unitPrice);
      }
      return next;
    });
    onChange(updated);
  }

  function addItem() {
    onChange([...items, { description: '', details: '', quantity: 1, unit: '式', unitPrice: 0, amount: 0, taxRate: 10 }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + Math.round(item.amount * item.taxRate / 100), 0);
  const total = subtotal + taxAmount;

  return (
    <div>
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-medium text-gray-600">品目・内容</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 w-20">数量</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 w-20">単位</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 w-28">単価</th>
              <th className="text-center px-3 py-2 font-medium text-gray-600 w-24">税率</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 w-32">金額</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 align-top">
                <td className="px-2 py-1.5">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="品目名"
                    className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                  />
                  <textarea
                    value={item.details ?? ''}
                    onChange={(e) => updateItem(i, 'details', e.target.value)}
                    placeholder="注釈（任意）"
                    rows={1}
                    className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-xs text-gray-500 resize-none mt-0.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={item.unit}
                    onChange={(e) => updateItem(i, 'unit', e.target.value)}
                    className="w-full text-center border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={item.taxRate}
                    onChange={(e) => updateItem(i, 'taxRate', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded text-xs px-1 py-0.5 text-center"
                  >
                    {TAX_RATES.map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5 text-right text-gray-700">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-1 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400 text-sm">
                  明細行がありません。「行を追加」をクリックしてください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <Plus className="h-4 w-4" /> 行を追加
      </button>

      {/* 合計エリア */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">小計</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-100">
            <span className="text-gray-600">消費税（各行の税率）</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between py-1 font-bold text-base">
            <span>合計</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
