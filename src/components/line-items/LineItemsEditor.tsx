'use client';

import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, TAX_RATES } from '@/lib/utils';

export const DEFAULT_TAX_RATE = 10;

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
  masterItems?: string[];
}

const DATALIST_ID = 'item-master-list';

export default function LineItemsEditor({ items, onChange, masterItems = [] }: Props) {
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
    onChange([...items, { description: '', details: '', quantity: 1, unit: '', unitPrice: 0, amount: 0, taxRate: DEFAULT_TAX_RATE }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + Math.round(item.amount * item.taxRate / 100), 0);
  const total = subtotal + taxAmount;

  return (
    <div>
      {/* 品目マスタ datalist */}
      {masterItems.length > 0 && (
        <datalist id={DATALIST_ID}>
          {masterItems.map(name => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}

      {/* スマホ: 1行ずつカードで入力 */}
      <div className="md:hidden space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2" style={{ borderColor: '#e3e3e3' }}>
            <div className="flex items-start gap-2">
              <input
                list={masterItems.length > 0 ? DATALIST_ID : undefined}
                value={item.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                placeholder="品目名"
                className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-2 text-gray-400 hover:text-red-500 rounded"
                aria-label="行を削除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={item.details ?? ''}
              onChange={(e) => updateItem(i, 'details', e.target.value)}
              placeholder="注釈（任意）"
              rows={2}
              className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ color: '#727272' }}
            />
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-gray-500">
                数量
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="mt-0.5 w-full text-right border border-gray-300 rounded px-2 py-1.5 text-gray-900"
                />
              </label>
              <label className="text-xs text-gray-500">
                単価
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="mt-0.5 w-full text-right border border-gray-300 rounded px-2 py-1.5 text-gray-900"
                />
              </label>
              <label className="text-xs text-gray-500">
                税率
                <select
                  value={item.taxRate}
                  onChange={(e) => updateItem(i, 'taxRate', Number(e.target.value))}
                  className="mt-0.5 w-full border border-gray-300 rounded px-1 py-1.5 text-gray-900 bg-white"
                >
                  {TAX_RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-right text-sm">
              <span className="text-gray-500 mr-2">金額</span>
              {formatCurrency(item.amount)}
            </p>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-6 text-gray-400 text-sm">明細行がありません。「行を追加」をタップしてください。</p>
        )}
      </div>

      {/* PC: 表形式 */}
      <div className="hidden md:block border rounded-md overflow-hidden" style={{ borderColor: '#e3e3e3' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#3c3d3a' }}>
              <th className="text-left px-3 py-2 font-bold text-white text-[9pt]">品目・内容</th>
              <th className="text-right px-3 py-2 font-bold text-white text-[9pt] w-20">数量</th>
              <th className="text-right px-3 py-2 font-bold text-white text-[9pt] w-28">単価</th>
              <th className="text-center px-3 py-2 font-bold text-white text-[9pt] w-20">税率</th>
              <th className="text-right px-3 py-2 font-bold text-white text-[9pt] w-28">金額</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                className="border-b align-top"
                style={{ borderColor: '#e3e3e3', backgroundColor: i % 2 === 1 ? '#F9FAFB' : '#FFFFFF' }}
              >
                <td className="px-2 py-2">
                  <input
                    list={masterItems.length > 0 ? DATALIST_ID : undefined}
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="品目名（マスタから選択または入力）"
                    className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[8pt]"
                  />
                  <textarea
                    value={item.details ?? ''}
                    onChange={(e) => updateItem(i, 'details', e.target.value)}
                    placeholder="注釈（任意）"
                    rows={1}
                    className="w-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 resize-none mt-0.5"
                    style={{ fontSize: '7pt', color: '#727272' }}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[8pt]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full text-right border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[8pt]"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={item.taxRate}
                    onChange={(e) => updateItem(i, 'taxRate', Number(e.target.value))}
                    className="w-full border rounded text-center text-xs px-1 py-0.5"
                    style={{ borderColor: '#e3e3e3' }}
                  >
                    {TAX_RATES.map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right text-[8pt]">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-1 py-2">
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
                <td colSpan={6} className="text-center py-6 text-gray-400 text-sm">
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
        <div className="w-64 text-sm">
          <div className="flex justify-between py-2 border-b" style={{ borderColor: '#e3e3e3' }}>
            <span className="text-gray-500">小計</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#e3e3e3' }}>
            <span className="text-gray-500">消費税（各行の税率）</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-base">
            <span>合計</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
